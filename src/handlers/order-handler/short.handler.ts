import { type OrderInputPayload } from "./long.handler.js";
import { randomUUID } from "crypto";
import { actionCreateShort, FILLS, updateOrderOfMakershanldeContract} from "./utils.js";
import PERPETUAL_BALANCE_STORE, { readBalanceStoreUserLockedBalance, readBalanceStoreUserTotalBalance, updateBalanceStoreUserLockedBalance } from "../../memory/balances/perp-balances.js";
import { OrderSide, OrderType } from "../../types/perp-types.js";
import { PERPETUAL_ORDERBOOK_STORE, PERPETUAL_ORDERBOOK_STORE_INDEX } from "../../memory/orderbook/prep-orderbook.js";
import { CONTRACT_STORE } from "../../memory/contracts/contracts-store.js";
import { createOrder, fetchFullFilledQuantityFromOrderId, ORDERS, updateOrderFullFilledQuantity } from "../../memory/orders/orders.js";


export const hanldeShortOrders = (payload: OrderInputPayload):any => {

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
    throw new Error("Insuffienct Balance");
	}

	//READ AND UPDATE USER LOCKER BALANCE
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
	if(!PERPETUAL_ORDERBOOK_STORE_INDEX[stockSymbol] || !PERPETUAL_ORDERBOOK_STORE_INDEX[stockSymbol].long) return

  //UTILS AND DECLARTIONS
	const orderbook_long_index_length = PERPETUAL_ORDERBOOK_STORE_INDEX[stockSymbol].long.length

  //CREATE ORDER
	const orderId = randomUUID();
	createOrder(orderId, stockSymbol, userPrice, quantity, "short", userId);

	if(
		!PERPETUAL_ORDERBOOK_STORE[stockSymbol]?.long[userPrice] 
		&& (orderbook_long_index_length == 0 
			||
			userPrice > PERPETUAL_ORDERBOOK_STORE_INDEX[stockSymbol].long[orderbook_long_index_length - 1]!
		)
	){
    //IF THERE EXIST AN LONG ORDER AT THE SAME PRICE
    //WE SIMPLY UPDATE THE QUANTITY OF THAT ORDER INSTEAD OF CREATING NEW ENTRY IN THE ORDERBOOK
		if(PERPETUAL_ORDERBOOK_STORE[stockSymbol].short[userPrice]){

			const totalQuantity = PERPETUAL_ORDERBOOK_STORE[stockSymbol].short[userPrice].totalQuantity
			const remainingQuantity = PERPETUAL_ORDERBOOK_STORE[stockSymbol].short[userPrice].remainingQuantity

			PERPETUAL_ORDERBOOK_STORE[stockSymbol].short[userPrice].totalQuantity = totalQuantity + quantity
			PERPETUAL_ORDERBOOK_STORE[stockSymbol].short[userPrice].remainingQuantity = remainingQuantity + quantity

			const isUserAlreadyInSameOrder = PERPETUAL_ORDERBOOK_STORE[stockSymbol].short[userPrice].makerIds[userId] ? true : false;

			if(!isUserAlreadyInSameOrder){
				PERPETUAL_ORDERBOOK_STORE[stockSymbol].short[userPrice].makerIds[userId] = [orderId];
			}else{
				PERPETUAL_ORDERBOOK_STORE[stockSymbol].short[userPrice].makerIds[userId]!.push(orderId);
			}
			return PERPETUAL_ORDERBOOK_STORE[stockSymbol];
		}
		else{
      //if there exist no LONG order at same price , create SHORT
			actionCreateShort(userId, stockSymbol, userPrice, quantity, orderId);
			return PERPETUAL_ORDERBOOK_STORE[stockSymbol];
		}
	}

	return handlePriceNotAvailableInLimitOrder(req, res, userId, stockSymbol, type, side, userPrice, quantity, collateral, orderId);
}

const handlePriceNotAvailableInLimitOrder = (req: Request, res: Response, userId: string, stockSymbol: string, type: string, side: string, userPrice: number, userQuantity: number, collateral:number, orderId:string) => {

	let fullfilledQuantity = 0;
	let totalAmountSpent = 0;
	let count = 0;
	const orderbook_long_index_length = PERPETUAL_ORDERBOOK_STORE_INDEX[stockSymbol]?.long.length!

	if(!PERPETUAL_ORDERBOOK_STORE_INDEX[stockSymbol] || !PERPETUAL_ORDERBOOK_STORE_INDEX[stockSymbol]) return
	if(!PERPETUAL_ORDERBOOK_STORE[stockSymbol]) return

	for(let i = orderbook_long_index_length - 1 ; i >= 0 ; i--){

		const price = PERPETUAL_ORDERBOOK_STORE_INDEX[stockSymbol].long[i]!;

		if(price < userPrice &&  fullfilledQuantity != userQuantity){
			actionCreateShort(userId, stockSymbol, userPrice, (userQuantity - fullfilledQuantity), orderId);
			break;
		}

		if(fullfilledQuantity == userQuantity || price < userPrice){
			break;
		}

    // ----- FETCH LONG INFO AT THAT PRICE -----
		const longInfo = PERPETUAL_ORDERBOOK_STORE[stockSymbol]?.long[price]!

    /*
      ------ SECTION 2 ------
			INFO : We check if the available quantity at that price bracket is sufficient to fulfill user requirements
			-----------------------
		*/

		if(longInfo?.remainingQuantity == (userQuantity - fullfilledQuantity)){
      //update orders of makers
			updateOrderOfMakershanldeContract(longInfo.makerIds, longInfo?.remainingQuantity, userId, OrderSide.SHORT);

      //update order of taker
      updateOrderFullFilledQuantity(orderId, fetchFullFilledQuantityFromOrderId(orderId) + longInfo.remainingQuantity);

			//delete 
			delete PERPETUAL_ORDERBOOK_STORE[stockSymbol].long[price];

			count++;
			break;
		}

		if(longInfo?.remainingQuantity > (userQuantity - fullfilledQuantity)){
      //upate orders of makers
			updateOrderOfMakershanldeContract(longInfo.makerIds, (userQuantity - fullfilledQuantity), userId, OrderSide.SHORT);

      //update orders of takers
      updateOrderFullFilledQuantity(orderId, fetchFullFilledQuantityFromOrderId(orderId) + (userQuantity - fullfilledQuantity));

			//update remaining quanitity in the stock
			const remainingStockQuantity = longInfo.remainingQuantity;
			PERPETUAL_ORDERBOOK_STORE[stockSymbol].long[price]!.remainingQuantity = remainingStockQuantity - (userQuantity - fullfilledQuantity);

			break;
		}

    //upate order of makers
		updateOrderOfMakershanldeContract(longInfo.makerIds, longInfo.remainingQuantity, userId, OrderSide.SHORT);

    //upate order of taker
    updateOrderFullFilledQuantity(orderId, fetchFullFilledQuantityFromOrderId(orderId) + longInfo.remainingQuantity);

		//update fullfilled quantity
		fullfilledQuantity = fullfilledQuantity + longInfo.remainingQuantity;

		//delete entry at that price
		delete PERPETUAL_ORDERBOOK_STORE[stockSymbol].long[price]

		if(price == userPrice){
			actionCreateShort(userId, stockSymbol, userPrice, (userQuantity - fullfilledQuantity), orderId);
		}

		if(price == PERPETUAL_ORDERBOOK_STORE_INDEX[stockSymbol].long[0]){
			actionCreateShort(userId, stockSymbol, userPrice, (userQuantity - fullfilledQuantity), orderId);
		}
		count ++;
	}

	while(count > 0 ){
		PERPETUAL_ORDERBOOK_STORE_INDEX[stockSymbol].long.pop();
		count--;
	}
	return PERPETUAL_ORDERBOOK_STORE[stockSymbol];
}

const handleOrderTypeMarket = () => {
}