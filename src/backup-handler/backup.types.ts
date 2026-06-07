import type { OrderEntityType } from "@bhargav16exdd/cex";
import type { PerpetualOrderbookIndexStoreType, PerpetualOrderbookStoreType } from "../memory/orderbook/perp-orderbook-types.js";
import type { BalanceStoreType } from "../memory/balances/balances-types.js";
import type { ContractsStoreType } from "../memory/contracts/contracts-types.js";

export interface BackupTypes {
  PERPETUAL_ORDERBOOK_STORE : PerpetualOrderbookStoreType,
  PERPETUAL_ORDERBOOK_STORE_INDEX : PerpetualOrderbookIndexStoreType,
  CONTRACT_STORE : ContractsStoreType,
  BALANCE_STORE: BalanceStoreType,
  ORDERS : OrderEntityType,
  ACTIVE_ORDER_INDEX : Map<string, Map<string, Array<string>>>
  updatedAt:number
}