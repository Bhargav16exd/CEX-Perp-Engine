import type { SidePerp } from "@cex/shared";
import type { PerpetualOrderbookIndexStoreType, PerpetualOrderbookStoreType } from "./perp-orderbook-types.js";

export const PERPETUAL_ORDERBOOK_STORE: PerpetualOrderbookStoreType = {};

export const PERPETUAL_ORDERBOOK_STORE_INDEX: PerpetualOrderbookIndexStoreType = {};

export const addPriceToOrderBookIndex = (stockSymbol:string, side:SidePerp, price:number) => {

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


/* 
  ------ LOADING BACKUPS IN MEMORY ------
  ---------------------------------------
*/

export const loadOrderbook = (backup: PerpetualOrderbookStoreType) => {
  Object.assign(PERPETUAL_ORDERBOOK_STORE, backup);
}

export const loadOrderbookIndex = (backup: PerpetualOrderbookIndexStoreType) => {
  Object.assign(PERPETUAL_ORDERBOOK_STORE_INDEX, backup);
}

