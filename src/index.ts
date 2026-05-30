import dotenv from "dotenv";
import { connectRedis, publisher, subscriber } from "./queue/queue-client.js";
import type { EngineRequestType, EngineResponseType } from "./types/engine-types.js";
import { engineRequestHanlder } from "./request-handler/request-hanlder.js";
import { publishDirtyPrices } from "./handlers/order-handler/delta.handler.js";

dotenv.config();

//connect redis
connectRedis();

const ENGINE_REQUEST_QUEUE =  `perp-engine-request-queue`;

const sendResponse = async (queue:string, payload:EngineResponseType) => {
  await publisher.lPush(queue, JSON.stringify(payload));
}

publishDirtyPrices();

//process request
for(;;){
  const entity = await subscriber.brPop(ENGINE_REQUEST_QUEUE, 5);

  if(!entity) continue;

  const parsedRequest = JSON.parse(entity.element) as EngineRequestType;

  try {
    const engineResponse = engineRequestHanlder(parsedRequest);
    const payload:EngineResponseType = {
      transactionId:parsedRequest.transactionId,
      ok:true,
      data:engineResponse
    }
    await sendResponse(parsedRequest.responseQueue, payload);
  } catch (error) {
    await sendResponse(parsedRequest.responseQueue,{
      transactionId:parsedRequest.transactionId,
      ok:false,
      error: error instanceof Error ? error.message : "engine_error"
    })
  }
}

