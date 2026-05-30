export interface PerpetualOrderbookStoreType {
    [stockName: string]: StockSpecificOrderbookStoreType
}

export interface PerpetualOrderbookIndexStoreType {
    [stockName: string]: StockSpecificOrderbookIndexStoreType
}

interface StockSpecificOrderbookIndexStoreType {
    short:number[],
    long:number[]
}

interface StockSpecificOrderbookStoreType {
    updateId:number,
    short:ShortType,
    long:LongType
}

interface ShortType {
    [price :string]:TransactionEntityType
}

interface LongType {
    [price :string]:TransactionEntityType
}

interface TransactionEntityType {
    totalQuantity:number;
    remainingQuantity:number;
    makerIds:Record<string, Array<string>>; // userId:orderId
    takerIds:Record<string, Array<string>>; // userId:orderId
}