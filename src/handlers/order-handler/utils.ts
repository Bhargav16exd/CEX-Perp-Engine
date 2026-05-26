import { FILLS } from "../../memory/fills/fills.js";
import { addPriceToOrderBookIndex,PERPETUAL_ORDERBOOK_STORE} from "../../memory/orderbook/prep-orderbook.js"
import { ORDERS, updateOrderFullFilledQuantity } from "../../memory/orders/orders.js";
import { queueMessageForAdapter } from "../../queue/db-publisher-client.js";
import { OrderSide } from "../../types/perp-types.js"
import { hanldeContracts } from "../contract-handler/contract.handler.js"
import { AdapterEntityType, AdapterMessageType } from "../../types/db-adapter-types.js"

export const actionCreateLong = (userId:string, stockSymbol:string, userPrice:number, quantity:number, orderId:string) => {

	if(!PERPETUAL_ORDERBOOK_STORE[stockSymbol]) return

	PERPETUAL_ORDERBOOK_STORE[stockSymbol].long[userPrice] = {
		totalQuantity:quantity,
		remainingQuantity:quantity,
		makerIds:{
			[userId]: [orderId]
		},
		takerIds:{}
	}

	addPriceToOrderBookIndex(stockSymbol, "long", userPrice)
	return true
}

export const actionCreateShort = (userId:string, stockSymbol:string, userPrice:number, quantity:number, orderId:string) => {

	if(!PERPETUAL_ORDERBOOK_STORE[stockSymbol]) return

	PERPETUAL_ORDERBOOK_STORE[stockSymbol].short[userPrice] = {
		totalQuantity:quantity,
		remainingQuantity:quantity,
		makerIds:{
			[userId]:[orderId],
		},
		takerIds:{}
	}

	addPriceToOrderBookIndex(stockSymbol, "short", userPrice)

	return true
}

export const updateOrderOfMakershanldeContract = (userIds: Record<string,Array<string>>, quantity: number, takerId:string, OrderSideInput:OrderSide, takerOrderID:string) => {
	/*
	------- INPUT INFO -------	
	quantity : input quantity is remaining quantitiy left for that price bracket
	userIds : { <userId>: [orderId1, orderId2]  , <userId2>: [orderId3, orderId4] }
	--------------------------
	*/

	/*
   ------- INFO -------
		->TRAVESRSING OVER EVER ORDER AT A PARTICULAR PRICE
		->UDPATE FULLFILLED STATUS
	 --------------------
	*/

	let fullfilledQuantity = 0;

	for(const userId in userIds){

    if(fullfilledQuantity == quantity){
      break;
    }

		for(const orderId of userIds[userId]!){

      if(fullfilledQuantity == quantity){
        break;
      }

			const order = ORDERS[orderId];  
      let pos = 0;

			if(order?.quantity! <= (quantity - fullfilledQuantity)){
				updateOrderFullFilledQuantity(orderId, order?.quantity!);
				fullfilledQuantity = fullfilledQuantity + order?.quantity!
        pos = order?.quantity!

        //push fills
        queueMessageForAdapter({
          messageType:AdapterMessageType.APPEND_ONLY,
          entityType:AdapterEntityType.FILL,
          payload:{
            makerID:userId,
            takerID:takerId,
            makerOrderID:orderId,
            takerOrderID:takerOrderID,
            quantity:order!.quantity,
            market:order!.stockSymbol,
            price:order!.price
          }
        })

        //push update order
        queueMessageForAdapter({
          messageType:AdapterMessageType.UPDATE,
          entityType:AdapterEntityType.ORDER,
          payload:{
            orderId,
            quantity:order!.quantity,
            status:"closed"
          }
        })
			}
			else{
				updateOrderFullFilledQuantity(orderId, order?.filledQuantity! + (quantity - fullfilledQuantity))
        pos = (quantity - fullfilledQuantity);

        queueMessageForAdapter({
          messageType:AdapterMessageType.APPEND_ONLY,
          entityType:AdapterEntityType.FILL,
          payload:{
            makerID:userId,
            takerID:takerId,
            makerOrderID:orderId,
            takerOrderID:takerOrderID,
            quantity:(quantity - fullfilledQuantity),
            market:order!.stockSymbol,
            price:order!.price
          }
        })

        //push update order
        queueMessageForAdapter({
          messageType:AdapterMessageType.UPDATE,
          entityType:AdapterEntityType.ORDER,
          payload:{
            orderId,
            quantity:(quantity - fullfilledQuantity),
            status:"partialfill"
          }
        })

        fullfilledQuantity = fullfilledQuantity + (quantity - fullfilledQuantity)
			}

      if(OrderSideInput == OrderSide.LONG){
        hanldeContracts("sol", pos, order?.price!, takerId, userId);
      }
      else if(OrderSideInput == OrderSide.SHORT){
        hanldeContracts("sol", pos, order?.price!, userId, takerId);
      }
      
		}

	}

}

export const identifyOrderStatus = (inputQuantity:number, fullfilledquantity:number) => {
  if(inputQuantity === fullfilledquantity){
    return "closed"
  }
  else if(inputQuantity > fullfilledquantity){
    return "partialfill"
  }
}


export const handleCancelOrder = (payload:any):any => {

  const {userId , orderId} = payload;
    
  if(!userId || !orderId){
    throw new Error("Invalid Inputs");
  }

  const order = ORDERS[orderId];

  if(!order){
    throw new Error("Invalid Order Id");
  }

  const price = order.price;  

  if(!PERPETUAL_ORDERBOOK_STORE[order.stockSymbol]![order.side][price]){
    throw new Error("Invalid Order Price");
  }

  //check if userid exist in makers
  if(!PERPETUAL_ORDERBOOK_STORE[order.stockSymbol]![order.side]![price]?.makerIds[userId]){
    throw new Error("Invalid User Id");
  }

  const totalOrderBookQuantity = PERPETUAL_ORDERBOOK_STORE[order.stockSymbol]![order.side]![price]?.totalQuantity!
  const totalOrderBookFillledQuantity = PERPETUAL_ORDERBOOK_STORE[order.stockSymbol]![order.side]![price]?.remainingQuantity!
  const makerIds = PERPETUAL_ORDERBOOK_STORE[order.stockSymbol]![order.side]![price]!.makerIds[userId]!

  if(order.quantity == PERPETUAL_ORDERBOOK_STORE[order.stockSymbol]![order.side]![price]?.totalQuantity ){
    delete PERPETUAL_ORDERBOOK_STORE[order.stockSymbol]![order.side]![price]
  }

  else if(PERPETUAL_ORDERBOOK_STORE[order.stockSymbol]![order.side]![price]!.makerIds[userId]!.length > 1){
    //remove order id
    PERPETUAL_ORDERBOOK_STORE[order.stockSymbol]![order.side]![price]!.makerIds[userId] = makerIds.filter(
			(id: string) => id !== orderId
		);

    //updater order book
    PERPETUAL_ORDERBOOK_STORE[order.stockSymbol]![order.side]![price]!.totalQuantity = totalOrderBookQuantity - order.quantity
    PERPETUAL_ORDERBOOK_STORE[order.stockSymbol]![order.side]![price]!.remainingQuantity = totalOrderBookFillledQuantity - order.quantity
  }

  else if(PERPETUAL_ORDERBOOK_STORE[order.stockSymbol]![order.side]![price]!.makerIds[userId]!.length == 1){
    //remove user id
    delete PERPETUAL_ORDERBOOK_STORE[order.stockSymbol]![order.side]![price]!.makerIds[userId]

    //updater order book
    PERPETUAL_ORDERBOOK_STORE[order.stockSymbol]![order.side]![price]!.totalQuantity = totalOrderBookQuantity - order.quantity
    PERPETUAL_ORDERBOOK_STORE[order.stockSymbol]![order.side]![price]!.remainingQuantity = totalOrderBookFillledQuantity - order.quantity
  }

  return PERPETUAL_ORDERBOOK_STORE[order.stockSymbol]

}