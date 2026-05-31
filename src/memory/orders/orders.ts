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
  createdAt:string
}

export const APPEND_ONLY_ORDERS : Array<Order> = [];

export const ORDERS : Record<string, Order> = {};

/*
  {
    "userId":{ 
      "SOL_USDC":["orderId"] 
    }
  }
*/

export const ACTIVE_ORDER_INDEX: Map<string, Map<string, Array<string>>> = new Map();

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
    market:"perp",
    createdAt:new Date().toLocaleString()
	}
  putUserOrderInIndex(userId, orderId, stockSymbol);
  return ORDERS[orderId]
}

export const updateOrderFullFilledQuantity = (orderId:string, fullFilledQuantity:number) => {
	if(!ORDERS[orderId]) return;
	ORDERS[orderId].filledQuantity = fullFilledQuantity;
}

export const updateOrderStatus = (orderId:string, status:OrderStatus) => {
  if(!ORDERS[orderId]) return;
	ORDERS[orderId].status = status
}

export const getUserActiveOrders = (userId:string, symbol:string) => {
  
  const userOrders = ACTIVE_ORDER_INDEX.get(userId);
  if(!userOrders){
    return [];
  }
  
  const symbolOrders = userOrders.get(symbol);

  if(!symbolOrders){
    return []
  }

  const activeOrders = symbolOrders.map((id)=>{
    return ORDERS[id]!
  })
  
  return activeOrders; 
}

export const putUserOrderInIndex = (userId:string, orderId:string, symbol:string) =>{
  let userOrders = ACTIVE_ORDER_INDEX.get(userId);

  if(!userOrders){
    userOrders = new Map()  
    ACTIVE_ORDER_INDEX.set(userId, userOrders);
  }

  let symbolOrders = userOrders.get(symbol);

  if(!symbolOrders){
    symbolOrders = [];
    userOrders.set(symbol, symbolOrders);
  }

  symbolOrders.push(orderId);
}

export const removeUserOrderInIndex = (userId:string, orderId:string, symbol:string) =>{
  
  const userOrders = ACTIVE_ORDER_INDEX.get(userId);
  
  if(!userOrders){
    return
  }

  const symbolOrder = userOrders.get(symbol)

  if(!symbolOrder){
    return
  }

  const updatedOrders = symbolOrder.filter((id:string)=> id != orderId);

  if(updatedOrders.length === 0){
    userOrders.delete(symbol);
  }
  else{
    userOrders.set(symbol, updatedOrders);
  }

  // Remove user if no symbols left
  if (userOrders.size === 0) {
    ACTIVE_ORDER_INDEX.delete(userId);
  }
}

export const handleOrderOpenOrderRequest = (payload:any) => {
  const { id, symbol } = payload;
  if(!id){
    throw new Error("Invalid Input");
  }
  return getUserActiveOrders(id, symbol);
}