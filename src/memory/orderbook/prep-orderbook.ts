import type { PerpetualOrderbookIndexStoreType, PerpetualOrderbookStoreType } from "./perp-orderbook-types.js";

export const PERPETUAL_ORDERBOOK_STORE: PerpetualOrderbookStoreType = {
	sol: {
    updateId:0,
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
    updateId:0,
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
    updateId:getStockUpdateId(stockSymbol),
    orderbook:PERPETUAL_ORDERBOOK_STORE[stockSymbol],
    orderbookIndex:PERPETUAL_ORDERBOOK_STORE_INDEX[stockSymbol]
  }
}

export const getStockUpdateId = (stockSymbol:string) => {
  return PERPETUAL_ORDERBOOK_STORE[stockSymbol]?.updateId!
}
export const updateStockUpdateId =  (stockSymbol:string) => {
  PERPETUAL_ORDERBOOK_STORE[stockSymbol]!.updateId! = getStockUpdateId(stockSymbol) + 1;
}