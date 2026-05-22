
export enum AdapterMessageType {
  APPEND_ONLY = "append_only",
  INSERT = "insert",
  UPDATE = "update",
}

export enum AdapterEntityType {
  FILL = "fill",
  ORDER = "order",
}

export interface AdapterRequestType {
  messageType:AdapterMessageType
  payload:any
  entityType:AdapterEntityType
}