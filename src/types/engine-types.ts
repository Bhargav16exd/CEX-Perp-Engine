export type EngineCommandType = 
  | "create_order"
  | "get_depth"
  | "cancel_order"

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