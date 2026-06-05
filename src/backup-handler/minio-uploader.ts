import path from "node:path";
import fs from "fs/promises";
import minIOClient from "./minio-client.js"
import { loadOrderbook, loadOrderbookIndex, PERPETUAL_ORDERBOOK_STORE, PERPETUAL_ORDERBOOK_STORE_INDEX } from "../memory/orderbook/prep-orderbook.js";
import { ACTIVE_ORDER_INDEX, loadOrders, ORDERS } from "../memory/orders/orders.js";
import type { BackupTypes } from "./backup.types.js";
import BALANCE_STORE, { loadBalances } from "../memory/balances/balances.js";
import { CONTRACT_STORE, loadContracts } from "../memory/contracts/contracts-store.js";


const BUCKET_NAME = "centralized-exchange-bucket"
const FILE_NAME = "perp-state.json";

const UPLOAD_LOCAL_STATE_FILE = path.join(`${process.cwd()}/src/backup/upload/`, "perp-state.json");
const DOWNLOAD_LOCAL_STATE_FILE = path.join(`${process.cwd()}/src/backup/download/`, "perp-state.json");


export const backupServerState = async () =>{
  try {

    await writeStateIntoFile()

    const exists = await minIOClient.bucketExists(BUCKET_NAME);

    if (!exists) {
      await minIOClient.makeBucket(BUCKET_NAME, 'ap-south-1');
    }

    await minIOClient.fPutObject(BUCKET_NAME, FILE_NAME, UPLOAD_LOCAL_STATE_FILE);

    await fs.unlink(UPLOAD_LOCAL_STATE_FILE);

  } catch (error) {
    console.log(error)
  }
}

const writeStateIntoFile = async () => {

  const serializedActiveOrderIndex = Object.fromEntries(
    Array.from(ACTIVE_ORDER_INDEX.entries()).map(
      ([symbol, userMap]) => [
        symbol,
        Object.fromEntries(userMap)
      ]
    )
  );

  try {
    const data = {
      PERPETUAL_ORDERBOOK_STORE,
      PERPETUAL_ORDERBOOK_STORE_INDEX,
      CONTRACT_STORE,
      BALANCE_STORE,
      ORDERS,
      ACTIVE_ORDER_INDEX:serializedActiveOrderIndex,
      updatedAt: Date.now(),
    };
  
    await fs.writeFile(
      UPLOAD_LOCAL_STATE_FILE,
      JSON.stringify(data, null, 2),
      "utf-8"
    );
  } catch (error:any) {
    console.log(error)
  }
}

export const loadBackups = async () =>{

  try {

    await minIOClient.fGetObject(BUCKET_NAME, FILE_NAME, DOWNLOAD_LOCAL_STATE_FILE);

    const jsonStringBackupData = await fs.readFile(DOWNLOAD_LOCAL_STATE_FILE, {encoding:"utf-8"});
    
    const parsedBackup  = JSON.parse(jsonStringBackupData) as BackupTypes;


    console.log(parsedBackup)

    const activeOrderIndex = new Map(
      Object.entries(parsedBackup.ACTIVE_ORDER_INDEX).map(
        ([symbol, userMap]) => [
          symbol,
          new Map(
            Object.entries(
              userMap as Record<string, string[]>
            )
          )
        ]
      )
    );

    loadBalances(parsedBackup.BALANCE_STORE);
    loadContracts(parsedBackup.CONTRACT_STORE);
    loadOrderbook(parsedBackup.PERPETUAL_ORDERBOOK_STORE);
    //loadOrderbookIndex(parsedBackup.PERPETUAL_ORDERBOOK_STORE_INDEX);
    loadOrders(parsedBackup.ORDERS, activeOrderIndex);
    
    await fs.unlink(DOWNLOAD_LOCAL_STATE_FILE);

  } catch (error:any) {
    if(error.message == "Not Found"){
      return
    }
    console.log(error);
  }
}

export const startBackups = () => {
  setInterval(async ()=>{
    await backupServerState();
  }, 5000)
}