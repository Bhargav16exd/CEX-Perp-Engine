export type EngineCommandType = 
  | "create_order"
  | "get_open_order"
  | "cancel_order"
  | "get_depth"
  | "update_balance"
  | "get_open_contract"
  | "create_stock_entity"
  | "get_user_balance"

export interface EngineRequestType {
  transactionId: string;
  responseQueue: string;
  type: EngineCommandType;
  payload: Record<string, unknown>; 
}

export interface EngineResponseType {
  transactionId:string;
  ok: boolean;
  data?: unknown;
  error?: string;
}