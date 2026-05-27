export type EngineCommandType = 
  | "create_order"
  | "get_depth"
  | "cancel_order"
  | "update_balance"
  | "get_open_contract"
  | "create_stock_entity"

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