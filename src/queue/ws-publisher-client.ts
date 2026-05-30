import { createClient } from "redis";
import type { WsResponseType } from "../types/ws-types.js";

const REDIS_URL = process.env.REDIS_URL || "";

const WS_BROADCAST_QUEUE = "ws-broadcast-queue";

export const wsEventPublisher = createClient({url:REDIS_URL}).on("err",(error)=>{
  console.log("ERROR WHILE CREATING PUBILSHER");
})

export const queueMessageWsServer = async (payload:WsResponseType) => {
  await wsEventPublisher.lPush(WS_BROADCAST_QUEUE ,JSON.stringify(payload))
}