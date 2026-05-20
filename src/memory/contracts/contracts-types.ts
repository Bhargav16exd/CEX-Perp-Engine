
export interface ContractsStoreType {
    [userId :string]:UserContarctType
}

interface UserContarctType {
    [stockSymbol: string]:ContractType
}

interface ContractType {
	contract_quantity:number;
    avg_price:number;
    collateral:number;
    unrealizedPnL:number;
    counterPartId?:Array<string>;
}