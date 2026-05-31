import { serveOpenContracts } from "../handlers/contract-handler/contract.handler.js";
import { hanldeLongOrders } from "../handlers/order-handler/long.handler.js";
import { hanldeShortOrders } from "../handlers/order-handler/short.handler.js";
import { handleCancelOrder } from "../handlers/order-handler/utils.js";
import { handleGetUserBalance, hanldeUserBalanceUpdate } from "../memory/balances/perp-balances.js";
import { getDepth, handleCreateOrderEntityRequest } from "../memory/orderbook/prep-orderbook.js";
import { handleOrderOpenOrderRequest } from "../memory/orders/orders.js";
import type { EngineRequestType } from "../types/engine-types.js";
import { OrderSide } from "../types/perp-types.js";

enum EngineCommand {
  CREATE_ORDER = "create_order",
  CANCEL_ORDER = "cancel_order",
  GET_OPEN_ORDERS = "get_open_order",
  UPDATE_BALANCE = "update_balance",
  GET_USER_BALANCE = "get_user_balance",
  OPEN_CONTRACT = "get_open_contract",
  CREATE_STOCK_ENTITY = "create_stock_entity",
  GET_DEPTH = "get_depth"
}

export function engineRequestHanlder(request:EngineRequestType):any{

  const messageType = request.type;

  if(messageType == EngineCommand.CREATE_ORDER){
    if(request.payload.side == OrderSide.LONG){
      return hanldeLongOrders(request.payload as any);
    }
    if(request.payload.side == OrderSide.SHORT){
     return hanldeShortOrders(request.payload as any);
    }
  }

  if(messageType == EngineCommand.UPDATE_BALANCE){
    return hanldeUserBalanceUpdate(request.payload as any);
  }

  if(messageType == EngineCommand.OPEN_CONTRACT){
    return serveOpenContracts(request.payload as any);
  }

  if(messageType == EngineCommand.CANCEL_ORDER){
    return handleCancelOrder(request.payload as any);
  }

  if(messageType == EngineCommand.CREATE_STOCK_ENTITY){
    return handleCreateOrderEntityRequest(request.payload as any);
  }

  if(messageType == EngineCommand.GET_USER_BALANCE){
    return handleGetUserBalance(request.payload as any)
  }

  if(messageType == EngineCommand.GET_DEPTH){
    return getDepth(request.payload); 
  }

  if(messageType == EngineCommand.GET_OPEN_ORDERS){
    return handleOrderOpenOrderRequest(request.payload);
  }

}