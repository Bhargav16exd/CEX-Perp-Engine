import type { ContractsStoreType } from "./contracts-types.js";

export const CONTRACT_STORE:ContractsStoreType = {}

// ----- CONTRACTS VALUES CREATE  ----
export const createContractUser = (userId:string) => {
  CONTRACT_STORE[userId] = {};
}

export const createContractUserStock = (userId:string, symbol:string) => {
  CONTRACT_STORE[userId]![symbol] = {
    contract_quantity:0,
    avg_price:0,
    collateral:0,
    unrealizedPnL:0
  }
}

// ----- CONTRACTS VALUES READ ----
export const readContractStoreUserContractQuantity = (userId:string, stockSymbol:string) => {
	//@ts-ignore
	return CONTRACT_STORE[userId][stockSymbol].contract_quantity
}
export const readContractStoreUserContractAvgPrice = (userId:string, stockSymbol:string) => {
	//@ts-ignore
	return CONTRACT_STORE[userId][stockSymbol].avg_price
}
export const readContractStoreUserContractCollateral = (userId:string, stockSymbol:string) => {
	//@ts-ignore
	return CONTRACT_STORE[userId][stockSymbol].collateral
}
export const readContractStoreUserContractUnrealizedPnL = (userId:string, stockSymbol:string) => {
	//@ts-ignore
	return CONTRACT_STORE[userId][stockSymbol].unrealizedPnL
}

// ----- CONTRACTS VALUES READ ----

// ----- CONTRACTS VALUES UPDATE ----

export const updateContractStoreUserContractQuantity = (userId:string, stockSymbol:string, value:number) => {
	//@ts-ignore
	CONTRACT_STORE[userId][stockSymbol].contract_quantity = value
}
export const updateContractStoreUserContractAvgPrice = (userId:string, stockSymbol:string, value:number) => {
	//@ts-ignore
	CONTRACT_STORE[userId][stockSymbol].avg_price = value
}
export const updateContractStoreUserContractCollateral = (userId:string, stockSymbol:string, value:number) => {
	//@ts-ignore
	CONTRACT_STORE[userId][stockSymbol].collateral = value
}
export const updateContractStoreUserContractUnrealizedPnL = (userId:string, stockSymbol:string, value:number) => {
	//@ts-ignore
	CONTRACT_STORE[userId][stockSymbol].unrealizedPnL = value
}

// ----- CONTRACTS VALUES UPDATE ----


/* 
  ------ LOADING BACKUPS IN MEMORY ------
  ---------------------------------------
*/
export const loadContracts = (backup: ContractsStoreType) => {
  Object.assign(CONTRACT_STORE, backup);
  console.log(CONTRACT_STORE)
}