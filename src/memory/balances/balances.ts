import type { BalanceStoreType, UpdateBalanceInput } from "./balances-types.js";

const BALANCE_STORE: BalanceStoreType = {};

export const readBalanceStoreUserTotalBalance = (userId:string) => {
    //@ts-ignore
    return BALANCE_STORE[userId].balance["inr"].total
}
export const readBalanceStoreUserLockedBalance = (userId:string) => {
    //@ts-ignore
    return BALANCE_STORE[userId].balance["inr"].locked
}

export const updateBalanceStoreUserTotalBalance = (userId:string, value:number) => {
    //@ts-ignore
    BALANCE_STORE[userId].balance["inr"].total = value
}

export const updateBalanceStoreUserLockedBalance = (userId:string, value:number) => {
    //@ts-ignore
    BALANCE_STORE[userId].balance["inr"].locked = value
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

export const handle_UPDATE_USER_BALANCE_Request = (payload:any) =>{
  const { id, balance } = payload
  if(!id || !balance){
    throw new Error("Invalid Inputs");
  }

  const userBalance = readBalanceStoreUserTotalBalance(id)

  if(userBalance === undefined){
    throw new Error("Invalid User Id");
  }

  updateBalanceStoreUserTotalBalance(id, userBalance + balance);

  return {
    balance:readBalanceStoreUserTotalBalance(id)
  }
}

export const handle_GET_USER_BALANCE_Request = (payload:any) => {
  const { id } = payload;

  if(!id){
    throw new Error("Invalid Inputs");
  }

  const totalBalance = readBalanceStoreUserTotalBalance(id)
  const lockedBalance = readBalanceStoreUserLockedBalance(id);

  if(totalBalance === undefined || lockedBalance === undefined){
    throw new Error("Invalid User Id")
  }

  return {
    balance: (totalBalance - lockedBalance)
  }
}

/* 
  ------ LOADING BACKUPS IN MEMORY ------
  ---------------------------------------
*/

export const loadBalances = (backup: BalanceStoreType) => {
  Object.assign(BALANCE_STORE, backup);
}

export default BALANCE_STORE;