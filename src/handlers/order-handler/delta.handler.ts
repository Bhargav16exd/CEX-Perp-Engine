import { DIRTY_ORDERBOOK_PRICES } from "../../memory/dirty-prices/dirty-prices.js";
import { getStockUpdateId, PERPETUAL_ORDERBOOK_STORE } from "../../memory/orderbook/prep-orderbook.js";
import { queueMessageWsServer } from "../../queue/ws-publisher-client.js";

const PUBLISH_DIRTY_PRICES_INTERVAL = 100;

export const publishDirtyPrices = () => {

  setInterval(()=>{
    for(const stockSymbol of Object.keys(DIRTY_ORDERBOOK_PRICES)){

      const updateId = getStockUpdateId(stockSymbol);
      const SNAPSHOT_ORDERBOOK_STATE = PERPETUAL_ORDERBOOK_STORE;
      const SNAPSHOT_DIRTY_ORDERBOOK_PRICES_STATE =  DIRTY_ORDERBOOK_PRICES;

      const priceSet = SNAPSHOT_DIRTY_ORDERBOOK_PRICES_STATE[stockSymbol]
      if(!priceSet || priceSet.size == 0) continue;

      const bidsPayload: [string, string][] = [];
      const asksPayload: [string, string][] = [];

      for(const price of priceSet){
        
        const longLevel = SNAPSHOT_ORDERBOOK_STATE[stockSymbol]?.long?.[price];
        const longQty = longLevel ? longLevel.remainingQuantity : 0;
        
        const shortLevel = SNAPSHOT_ORDERBOOK_STATE[stockSymbol]?.short?.[price];
        const shortQty = shortLevel ? shortLevel.remainingQuantity : 0;

        bidsPayload.push([price.toString(), longQty.toString()]);
        asksPayload.push([price.toString(), shortQty.toString()]);

      }

      queueMessageWsServer({
          topic:`perp-${stockSymbol}`,
          bids:bidsPayload,
          asks:asksPayload,
          updateId
      })

      priceSet.clear();
    }
  }, PUBLISH_DIRTY_PRICES_INTERVAL)
}