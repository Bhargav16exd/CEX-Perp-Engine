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
			}
			else{
				updateOrderFullFilledQuantity(orderId, order?.fullFilledQuantity! + (quantity - fullfilledQuantity))
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

