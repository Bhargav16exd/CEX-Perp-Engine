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
export type Type = "limit" | "market";

export const addPriceToOrderBookIndex = (stockSymbol:string,side:Side,price:number) => {

	if(!PERPETUAL_ORDERBOOK_STORE_INDEX[stockSymbol]){
		return
	}
	//push
	PERPETUAL_ORDERBOOK_STORE_INDEX[stockSymbol][side].push(price);
	//sort
	PERPETUAL_ORDERBOOK_STORE_INDEX[stockSymbol][side].sort((a,b)=> a - b);
}


export const handleCreateOrderEntityRequest = (payload:any) => {
  const { stockSymbol } = payload

  if(PERPETUAL_ORDERBOOK_STORE_INDEX[stockSymbol]){
    throw new Error("Stock Already Exist in PERP MARKET");
  }

  PERPETUAL_ORDERBOOK_STORE[stockSymbol] = {
		short:{},
		long:{}
  }

  PERPETUAL_ORDERBOOK_STORE_INDEX[stockSymbol] = {
    short:[],
    long:[]
  }

  return true
}

export const getDepth = (payload:any):any=> {
  const { stockSymbol } = payload;
  return {
    orderbook:PERPETUAL_ORDERBOOK_STORE[stockSymbol],
    orderbookIndex:PERPETUAL_ORDERBOOK_STORE_INDEX[stockSymbol]
  }
}