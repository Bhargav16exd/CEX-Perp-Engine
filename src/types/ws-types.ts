export enum WsPayloadType {
  depth = "depth"
}

interface WsResponsePayload {
  updateId:number,
  asks:Array<Array<string>>,
  bids:Array<Array<string>>
}

export interface WsResponseType {
  wsPayloadType:WsPayloadType
  payload:WsResponsePayload
}