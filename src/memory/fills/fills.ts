
type FillType = {
  makerID: string;
  takerID: string;
  makerOrderID: string;
  takerOrderID: string;
  quantity: number;
  symbol: string;
  market: string;
  price:number;
}

export let FILLS: FillType[] = [];