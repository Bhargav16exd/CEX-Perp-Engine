
type FillType = {
  makerID: string;
  takerID: string;
  makerOrderID: string;
  takerOrderID: string;
  quantity: number;
  market: string;
  price:number;
}

export let FILLS: FillType[] = [];