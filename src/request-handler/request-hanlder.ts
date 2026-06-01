import { EngineCommandEnum, type EngineRequestType } from "@cex/shared";
import { serveOpenContracts } from "../handlers/contract-handler/contract.handler.js";
import { hanldeLongOrders } from "../handlers/order-handler/long.handler.js";
import { hanldeShortOrders } from "../handlers/order-handler/short.handler.js";
import { handleCancelOrder } from "../handlers/order-handler/utils.js";
import { handle_INIT_USER_BALANCE_Request, handleGetUserBalance, hanldeUserBalanceUpdate } from "../memory/balances/perp-balances.js";
import { getDepth, handleCreateOrderEntityRequest } from "../memory/orderbook/prep-orderbook.js";
import { handleOrderOpenOrderRequest } from "../memory/orders/orders.js";
import { OrderSide } from "../types/perp-types.js";

export function engineRequestHanlder(request:EngineRequestType){

  const messageType = request.type;

  /*
    ------- USER REQUEST HANLDER -------- 
    -------------------------------------
  */ 

  if(messageType === EngineCommandEnum.INIT_USER_BALANCE){
    return handle_INIT_USER_BALANCE_Request(request.payload);
  }



  if(messageType == EngineCommandEnum.CREATE_ORDER){
    if(request.payload.side == OrderSide.long){
      return hanldeLongOrders(request.payload as any);
    }
    if(request.payload.side == OrderSide.short){
     return hanldeShortOrders(request.payload as any);
    }
  }

  if(messageType == EngineCommandEnum.UPDATE_BALANCE){
    return hanldeUserBalanceUpdate(request.payload as any);
  }

  if(messageType == EngineCommandEnum.OPEN_CONTRACT){
    return serveOpenContracts(request.payload as any);
  }

  if(messageType == EngineCommandEnum.CANCEL_ORDER){
    return handleCancelOrder(request.payload as any);
  }

  if(messageType == EngineCommandEnum.CREATE_STOCK_ENTITY){
    return handleCreateOrderEntityRequest(request.payload as any);
  }

  if(messageType == EngineCommandEnum.GET_USER_BALANCE){
    return handleGetUserBalance(request.payload as any)
  }

  if(messageType == EngineCommandEnum.GET_DEPTH){
    return getDepth(request.payload); 
  }

  if(messageType == EngineCommandEnum.GET_OPEN_ORDERS){
    return handleOrderOpenOrderRequest(request.payload);
  }

}