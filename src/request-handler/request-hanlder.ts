import { hanldeLongOrders } from "../handlers/order-handler/long.handler.js";
import { hanldeShortOrders } from "../handlers/order-handler/short.handler.js";
import { hanldeUserBalanceUpdate } from "../memory/balances/perp-balances.js";
import type { EngineRequestType } from "../types/engine-types.js";
import { OrderSide } from "../types/perp-types.js";

enum EngineCommand {
  CREATE_ORDER = "create_order",
  UPDATE_BALANCE = "update_balance"
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


}