import { createClient } from "redis";
import type { AdapterRequestType } from "../types/db-adapter-types.js";

const REDIS_URL = process.env.REDIS_URL || "";

const ADAPTER_INGESTER_QUEUE = `adapter-ingester-queue`;

const adapterPublisher = createClient({url:REDIS_URL}).on("error",(error)=>{
  console.log("ERROR WHILE CREATING DB PUBLISHER");
})

export const queueMessageForAdapter = async (payload:AdapterRequestType) => {
  await adapterPublisher.lPush(ADAPTER_INGESTER_QUEUE ,JSON.stringify(payload))
}

export {
  adapterPublisher
}
