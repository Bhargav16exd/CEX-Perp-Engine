import type { Side, Type } from "../orderbook/prep-orderbook.js";

type OrderStatus = "open" | "canceled" | "partialfill" | "closed"

export type Order = {
	orderId:string,

  side:Side,
  type:Type,

	price:number,
	quantity:number,
	filledQuantity:number,
	
  status:OrderStatus

	userId:string,

  symbol:string,
  market:string,
}

export const APPEND_ONLY_ORDERS : Array<Order> = [];

export const ORDERS : Record<string, Order> = {}

export const fetchOrderFromOrderId = (orderId:string) => {
	return ORDERS[orderId];
}

export const fetchFullFilledQuantityFromOrderId = (orderId:string) => {
	return ORDERS[orderId]!.filledQuantity! || 0;
}

export const createOrder = (orderId:string, stockSymbol:string, price:number, quantity:number, side:Side, userId:string, type:Type, status:OrderStatus):Order=> {
		ORDERS[orderId] = {
		orderId,
		side,
    type,
		price,
		quantity,
		filledQuantity:0,
    status:"open",
		userId,
    symbol:stockSymbol,
    market:"perp"
	}
  return ORDERS[orderId]
}

export const updateOrderFullFilledQuantity = (orderId:string, fullFilledQuantity:number) => {
	if(!ORDERS[orderId]) return;
	ORDERS[orderId].filledQuantity = fullFilledQuantity;
}