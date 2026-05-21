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

export type Side = "short" | "long";

export const addPriceToOrderBookIndex = (stockSymbol:string,side:Side,price:number) => {

	if(!PERPETUAL_ORDERBOOK_STORE_INDEX[stockSymbol]){
		return
	}
	//push
	PERPETUAL_ORDERBOOK_STORE_INDEX[stockSymbol][side].push(price);
	//sort
	PERPETUAL_ORDERBOOK_STORE_INDEX[stockSymbol][side].sort((a,b)=> a - b);
}