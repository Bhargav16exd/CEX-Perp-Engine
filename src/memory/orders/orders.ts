import type { Side } from "../orderbook/prep-orderbook.js";

type Orders = {
	orderId:string,
	stockSymbol:string,
	price:number,
	quantity:number,
	fullFilledQuantity?:number,
	side:Side,
	userId:string,
	createdAt:string
}

export const ORDERS : Record<string, Orders> = {}

export const fetchOrderFromOrderId = (orderId:string) => {
	return ORDERS[orderId];
}

export const fetchFullFilledQuantityFromOrderId = (orderId:string) => {
	return ORDERS[orderId]?.fullFilledQuantity || 0;
}

export const createOrder = (orderId:string, stockSymbol:string, price:number, quantity:number, side:Side, userId:string) => {
	ORDERS[orderId] = {
		orderId,
		stockSymbol,
		price,
		quantity,
		fullFilledQuantity:0,
		side,
		userId,
		createdAt: new Date().toISOString()	
	}
}

export const updateOrderFullFilledQuantity = (orderId:string, fullFilledQuantity:number) => {
	if(!ORDERS[orderId]) return;
	ORDERS[orderId].fullFilledQuantity = fullFilledQuantity;
}