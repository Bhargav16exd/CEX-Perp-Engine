
type FillType = {
  makerID: string;
  takerID: string;
  makerSide:string;
  takerSide:string;
  makerOrderID: string;
  takerOrderID: string;
  quantity: number;
  symbol: string;
  market: string;
  price:number;
}

export let FILLS: FillType[] = [];