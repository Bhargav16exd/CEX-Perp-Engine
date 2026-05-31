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

export const ORDERS : Record<string, Order> = {};
export const ACTIVE_ORDER_INDEX: Map<string, Array<string>> = new Map();

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
  putUserOrderInIndex(userId, orderId);
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

export const getUserActiveOrders = (userId:string) => {
  const orderIds = ACTIVE_ORDER_INDEX.get(userId);
  if(!orderIds){
    return [];
  }
  
  const activeOrders = orderIds.map((id)=>{
    return ORDERS[id]!
  })
  
  return activeOrders; 
}

export const putUserOrderInIndex = (userId:string, orderId:string) =>{
  const userExist = ACTIVE_ORDER_INDEX.get(userId);
  if(!userExist){
    ACTIVE_ORDER_INDEX.set(userId,[orderId]);
    return
  }
  userExist.push(orderId);
}

export const removeUserOrderInIndex = (userId:string, orderId:string) =>{
  const userExist = ACTIVE_ORDER_INDEX.get(userId);
  if(!userExist){
    return
  }

  if(userExist.length === 1 && userExist[0] === orderId ){
    ACTIVE_ORDER_INDEX.delete(userId);
    return
  }

  userExist.filter((id:string)=> id != orderId);
}

export const handleOrderOpenOrderRequest = (payload:any) => {
  const { id } = payload;
  if(!id){
    throw new Error("Invalid Input");
  }
  return getUserActiveOrders(id);
}