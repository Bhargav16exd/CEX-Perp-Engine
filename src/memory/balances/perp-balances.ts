import type { BalanceStoreType, UpdateBalanceInput } from "./perp-balances-types.js";

const BALANCE_STORE: BalanceStoreType = {};

export const readBalanceStoreUserTotalBalance = (userId:string) => {
    //@ts-ignore
    return PERPETUAL_BALANCE_STORE[userId].balance["inr"].total
}
export const readBalanceStoreUserLockedBalance = (userId:string) => {
    //@ts-ignore
    return PERPETUAL_BALANCE_STORE[userId].balance["inr"].locked
}

export const updateBalanceStoreUserTotalBalance = (userId:string, value:number) => {
    //@ts-ignore
    PERPETUAL_BALANCE_STORE[userId].balance["inr"].total = value
}

export const updateBalanceStoreUserLockedBalance = (userId:string, value:number) => {
    //@ts-ignore
    PERPETUAL_BALANCE_STORE[userId].balance["inr"].locked = value
}

export const hanldeUserBalanceUpdate = (payload : UpdateBalanceInput):any => {
  const { id , balance, marketType } = payload
  const userTotalBalance = readBalanceStoreUserTotalBalance(id)!;
  updateBalanceStoreUserTotalBalance(id, userTotalBalance + balance)
  //@ts-ignore
  return PERPETUAL_BALANCE_STORE[id]?.balance["inr"]
}

export const handleGetUserBalance = (payload:any):any => {
  const { userId } = payload
  return readBalanceStoreUserTotalBalance(userId) - readBalanceStoreUserLockedBalance(userId);
}

/* 
  ------ QUEUE REQUEST HANDLERS ------
  ------------------------------------
*/

export const handle_INIT_USER_BALANCE_Request = (payload:any) => {
  
  const { id } = payload;
  if( !id ) throw new Error("Invalid Input");

  BALANCE_STORE[id] = {
    balance:{
      "inr":{
        total:0,
        locked:0
      }
    },
  }
  return true
}

export default BALANCE_STORE;