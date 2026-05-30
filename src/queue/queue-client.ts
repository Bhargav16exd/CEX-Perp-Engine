import { createClient } from "redis";
import { adapterPublisher } from "./db-publisher-client.js";
import { wsEventPublisher } from "./ws-publisher-client.js";


const REDIS_URL = process.env.REDIS_URL || "";

export const publisher = createClient({url:REDIS_URL}).on("err",(error)=>{
  console.log("ERROR WHILE CREATING PUBILSHER");
})

export const subscriber = createClient({url:REDIS_URL}).on("err",(error)=>{
  console.log("ERROR WHILE CREATING SUBSCRIBER");
})


export const connectRedis = async (): Promise<void> => {
  await Promise.all([publisher.connect(), subscriber.connect(), adapterPublisher.connect(), wsEventPublisher.connect()]);
}

const pingRedis = () => {
  return publisher.ping();
}