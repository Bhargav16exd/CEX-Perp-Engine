import { randomUUID } from "crypto";
import { actionCreateLong, identifyOrderStatus, updateOrderOfMakershanldeContract } from "./utils.js";
import { OrderSide, OrderType } from "../../types/perp-types.js";
import { readBalanceStoreUserLockedBalance, readBalanceStoreUserTotalBalance, updateBalanceStoreUserLockedBalance } from "../../memory/balances/perp-balances.js";
import { PERPETUAL_ORDERBOOK_STORE, PERPETUAL_ORDERBOOK_STORE_INDEX } from "../../memory/orderbook/prep-orderbook.js";
import { createOrder, fetchFullFilledQuantityFromOrderId, ORDERS, updateOrderFullFilledQuantity, type Order } from "../../memory/orders/orders.js";
import { CONTRACT_STORE } from "../../memory/contracts/contracts-store.js";
import { FILLS } from "../../memory/fills/fills.js";
import { queueMessageForAdapter } from "../../queue/db-publisher-client.js";
import { AdapterEntityType, AdapterMessageType } from "../../types/db-adapter-types.js";

export type OrderInputPayload = {
	req:Request,
	res:Response,
	userId:string,
	stockSymbol:string,
	type:OrderType,
	side:string,
	price:number,
	quantity:number,
	collateral:number,
	reduceOnly:boolean
}

export const hanldeLongOrders = (payload: OrderInputPayload):any => {

	const { req, res, userId, stockSymbol, type, side, price, quantity } = payload;

  const collateral = price * quantity;

	/*
  ------ SECTION - 1 -----
	INFO : Check if user has sufficient balance for collateral, 
	if not return error, if yes , update locked balance and proceed with order placement 
  -----------------------
	*/
	const userAvailableBalance = readBalanceStoreUserTotalBalance(userId) - readBalanceStoreUserLockedBalance(userId);
	if(userAvailableBalance < collateral){
    throw new Error("Insufficient Balance");
	}

	// READ AND UPDATE USER LOCKED BALANCE
	const previousUserLockedBalance = readBalanceStoreUserLockedBalance(userId);
	updateBalanceStoreUserLockedBalance(userId, (previousUserLockedBalance + collateral));

	if(type == OrderType.LIMIT){
		return handleOrderTypeLimit(req, res, userId, stockSymbol, type, side, price, quantity, collateral);
	}

	if(type == OrderType.MARKET){
		handleOrderTypeMarket()
	}
}

const handleOrderTypeLimit = (req: Request, res: Response, userId: string, stockSymbol: string, type: string, side: string, userPrice: number, quantity: number, collateral:number) => {

	if(!PERPETUAL_ORDERBOOK_STORE[stockSymbol]) return
	if(!PERPETUAL_ORDERBOOK_STORE_INDEX[stockSymbol] || !PERPETUAL_ORDERBOOK_STORE_INDEX[stockSymbol].short) return

	//UTILS AND DECLARTIONS
	const orderbook_short_index_length = PERPETUAL_ORDERBOOK_STORE_INDEX[stockSymbol].short.length

	//CREATE ORDER
	const orderId = randomUUID();
	let order = createOrder(orderId, stockSymbol, userPrice, quantity, "long", userId, "limit", "open");

	if(
		!PERPETUAL_ORDERBOOK_STORE[stockSymbol]?.short[userPrice] 
		&& (orderbook_short_index_length == 0 
			||
			userPrice < PERPETUAL_ORDERBOOK_STORE_INDEX[stockSymbol].short[0]!
		)
	){

		//IF THERE EXIST AN LONG ORDER AT THE SAME PRICE, 
		//WE SIMPLY UPDATE THE QUANTITY OF THAT ORDER INSTEAD OF CREATING NEW ENTRY IN THE ORDERBOOK
		if(PERPETUAL_ORDERBOOK_STORE[stockSymbol].long[userPrice]){

			const totalQuantity = PERPETUAL_ORDERBOOK_STORE[stockSymbol].long[userPrice].totalQuantity
			const remainingQuantity = PERPETUAL_ORDERBOOK_STORE[stockSymbol].long[userPrice].remainingQuantity

			PERPETUAL_ORDERBOOK_STORE[stockSymbol].long[userPrice].totalQuantity = totalQuantity + quantity
			PERPETUAL_ORDERBOOK_STORE[stockSymbol].long[userPrice].remainingQuantity = remainingQuantity + quantity

			const isUserAlreadyInSameOrder = PERPETUAL_ORDERBOOK_STORE[stockSymbol].long[userPrice].makerIds[userId] ? true : false;

			if(!isUserAlreadyInSameOrder){
				PERPETUAL_ORDERBOOK_STORE[stockSymbol].long[userPrice].makerIds[userId] = [orderId];
			}
			else{
				PERPETUAL_ORDERBOOK_STORE[stockSymbol].long[userPrice].makerIds[userId]!.push(orderId);
			}

      queueMessageForAdapter({
        messageType:AdapterMessageType.INSERT,
        entityType:AdapterEntityType.ORDER,
        payload:order
      })
      return PERPETUAL_ORDERBOOK_STORE[stockSymbol]
		}
		//if there exist no SHORT order at same price , create LONG
		else{
			actionCreateLong(userId, stockSymbol, userPrice, quantity, orderId)

      queueMessageForAdapter({
        messageType:AdapterMessageType.INSERT,
        entityType:AdapterEntityType.ORDER,
        payload:order
      })
      return PERPETUAL_ORDERBOOK_STORE[stockSymbol]
		}
	}

	return handlePriceNotAvailableInLimitOrder(req, res, userId, stockSymbol, type, side, userPrice, quantity, collateral, orderId, order);
}

const handlePriceNotAvailableInLimitOrder = (req: Request, res: Response, userId: string, stockSymbol: string, type: string, side: string, userPrice: number, userQuantity: number, collateral: number, orderId: string , order:Order) => {

	let fullfilledQuantity = 0;
	let finalfilledquantity = 0;
	let count = 0;
	const orderbook_short_index_length = PERPETUAL_ORDERBOOK_STORE_INDEX[stockSymbol]?.short.length!

	if(!PERPETUAL_ORDERBOOK_STORE_INDEX[stockSymbol]) return
	if(!PERPETUAL_ORDERBOOK_STORE[stockSymbol]) return

	for(const price of PERPETUAL_ORDERBOOK_STORE_INDEX[stockSymbol].short){

		if(price > userPrice &&  fullfilledQuantity != userQuantity){
			actionCreateLong(userId, stockSymbol, userPrice, (userQuantity - fullfilledQuantity), orderId);
			break;
		}

		if(fullfilledQuantity == userQuantity || price > userPrice){
			break;
		}

		// ----- FETCH SHORT INFO AT THAT PRICE -----
		const shortInfo = PERPETUAL_ORDERBOOK_STORE[stockSymbol]?.short[price]!

		/*
      ------ SECTION 2 ------
			INFO : We check if the available quantity at that price bracket is sufficient to fulfill user requirements
			-----------------------
		*/

		if(shortInfo?.remainingQuantity == (userQuantity - fullfilledQuantity)){

      finalfilledquantity = finalfilledquantity + (userQuantity - fullfilledQuantity)

			//update orders of makers
			updateOrderOfMakershanldeContract(shortInfo.makerIds, shortInfo.remainingQuantity, userId, OrderSide.LONG, orderId);

			//update order of taker
			updateOrderFullFilledQuantity(orderId, fetchFullFilledQuantityFromOrderId(orderId) + shortInfo.remainingQuantity);

			//delete 
			delete PERPETUAL_ORDERBOOK_STORE[stockSymbol].short[price];
			
			count++;
			break;
		}

		if(shortInfo?.remainingQuantity > (userQuantity - fullfilledQuantity) ){

      finalfilledquantity = finalfilledquantity + (userQuantity - fullfilledQuantity)

			//update orders of makers
			updateOrderOfMakershanldeContract(shortInfo.makerIds, (userQuantity - fullfilledQuantity), userId, OrderSide.LONG, orderId);

			//update order of taker
			updateOrderFullFilledQuantity(orderId, fetchFullFilledQuantityFromOrderId(orderId) + (userQuantity - fullfilledQuantity));

			//update remaining quanitity in the orderbook
			const remainingStockQuantity = shortInfo.remainingQuantity;
			PERPETUAL_ORDERBOOK_STORE[stockSymbol].short[price]!.remainingQuantity = remainingStockQuantity - (userQuantity - fullfilledQuantity);

			break;
		}

		//update order of makers
		updateOrderOfMakershanldeContract(shortInfo.makerIds, shortInfo.remainingQuantity, userId, OrderSide.LONG, orderId);

		//update order of taker
		updateOrderFullFilledQuantity(orderId, fetchFullFilledQuantityFromOrderId(orderId) + shortInfo.remainingQuantity);

		//update fullfilled quantity
    finalfilledquantity = finalfilledquantity + shortInfo.remainingQuantity;
		fullfilledQuantity = fullfilledQuantity + shortInfo.remainingQuantity;

		//delete entry at that price
		delete PERPETUAL_ORDERBOOK_STORE[stockSymbol].short[price];

		if(price == userPrice){
			actionCreateLong(userId, stockSymbol, userPrice, (userQuantity - fullfilledQuantity), orderId);
		}

		if(price == PERPETUAL_ORDERBOOK_STORE_INDEX[stockSymbol].short[orderbook_short_index_length-1]){
			actionCreateLong(userId, stockSymbol, userPrice, (userQuantity - fullfilledQuantity), orderId);
		} 
    count ++;		
	}

	while(count > 0){
		PERPETUAL_ORDERBOOK_STORE_INDEX[stockSymbol].short.shift();
		count--;
	} 

  let messageType = AdapterMessageType.INSERT;
  order.status = identifyOrderStatus(userQuantity, finalfilledquantity)!;

  if(order.status === "closed"){
    delete ORDERS[orderId];
    messageType = AdapterMessageType.APPEND_ONLY
  }

  queueMessageForAdapter({
    messageType,
    entityType:AdapterEntityType.ORDER,
    payload:order
  })

	return PERPETUAL_ORDERBOOK_STORE[stockSymbol];
}

const handleOrderTypeMarket = () => {
}
