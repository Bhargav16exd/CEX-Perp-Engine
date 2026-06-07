import { EngineCommandEnum, type EngineRequestType } from "@bhargav16exdd/cex";
import { hanldeLongOrders } from "../handlers/order-handler/long.handler.js";
import { hanldeShortOrders } from "../handlers/order-handler/short.handler.js";
import { handleCancelOrder } from "../handlers/order-handler/utils.js";
import { handle_GET_USER_BALANCE_Request, handle_INIT_USER_BALANCE_Request } from "../memory/balances/balances.js";
import { handle_GET_DEPTH_Request, handleCreateOrderEntityRequest } from "../memory/orderbook/prep-orderbook.js";
import { OrderSide } from "../types/perp-types.js";
import { handle_UPDATE_USER_BALANCE_Request } from "../memory/balances/balances.js";
import { handle_GET_OPEN_CONTRACT_Request } from "../handlers/contract-handler/contract.handler.js";
import { handle_GET_OPEN_ORDERS_Request } from "../memory/orders/orders.js";

export function engineRequestHanlder(request:EngineRequestType){

  const messageType = request.type;

  /*
    ------- USER REQUEST HANLDER -------- 
    -------------------------------------
  */ 

  if(messageType === EngineCommandEnum.INIT_USER_BALANCE){
    return handle_INIT_USER_BALANCE_Request(request.payload);
  }

  if(messageType === EngineCommandEnum.UPDATE_USER_BALANCE){
    return handle_UPDATE_USER_BALANCE_Request(request.payload);
  }

  if(messageType === EngineCommandEnum.GET_USER_BALANCE){
    return handle_GET_USER_BALANCE_Request(request.payload);
  }

  /*
    ------- ORDER REQUEST HANLDER -------- 
    -------------------------------------
  */ 

  if(messageType == EngineCommandEnum.CREATE_ORDER){
    if(request.payload.side == OrderSide.long){
      return hanldeLongOrders(request.payload as any);
    }
    if(request.payload.side == OrderSide.short){
     return hanldeShortOrders(request.payload as any);
    }
  }

  if(messageType == EngineCommandEnum.GET_DEPTH){
    return handle_GET_DEPTH_Request(request.payload); 
  }

  if(messageType == EngineCommandEnum.GET_OPEN_ORDERS){
    return handle_GET_OPEN_ORDERS_Request(request.payload);
  }

  /*
    ------- CONTRACT REQUEST HANLDER -------- 
    -----------------------------------------
  */ 

  if(messageType == EngineCommandEnum.GET_OPEN_CONTRACT){
    return handle_GET_OPEN_CONTRACT_Request(request.payload as any);
  }



  if(messageType == EngineCommandEnum.CANCEL_ORDER){
    return handleCancelOrder(request.payload as any);
  }

  if(messageType == EngineCommandEnum.CREATE_STOCK_ENTITY){
    return handleCreateOrderEntityRequest(request.payload as any);
  }

}