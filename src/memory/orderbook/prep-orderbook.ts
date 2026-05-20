import type { PerpetualOrderbookIndexStoreType, PerpetualOrderbookStoreType } from "./perp-orderbook-types.js";

export const PERPETUAL_ORDERBOOK_STORE: PerpetualOrderbookStoreType = {
	sol: {
		short:{},
		long:{}
}
};

export const PERPETUAL_ORDERBOOK_STORE_INDEX: PerpetualOrderbookIndexStoreType = {
	sol:{
		short:[],
		long:[]
	}
};

type Side = "short" | "long";

export const addPriceToOrderBookIndex = (stockSymbol:string,side:Side,price:number) => {

	if(!PERPETUAL_ORDERBOOK_STORE_INDEX[stockSymbol]){
		return
	}
	//push
	PERPETUAL_ORDERBOOK_STORE_INDEX[stockSymbol][side].push(price);
	//sort
	PERPETUAL_ORDERBOOK_STORE_INDEX[stockSymbol][side].sort((a,b)=> a - b);
}

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