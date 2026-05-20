import { HttpErrorResponse } from "../../../backend/src/utils/http.responses.js";
import { readContractStoreUserContractQuantity } from "../memory/contracts/contracts-store.js"
import { OrderSide } from "../types/perp-types.js";

/**
 * Validates whether a reduce-only order is allowed.
 *
 * Rules:
 * - A reduce-only order must only decrease an existing position.
 * - It must not increase exposure.
 * - It must not flip the position direction.
 *
 * @param reduceOnly Indicates whether the order is reduce-only.
 * @param side Order side ("BUY" | "SELL").
 * @param quantity Order quantity.
 * @param userId User placing the order.
 * @param stockSymbol Trading pair symbol.
 *
 * @throws Error when:
 * - order increases position size
 */
export const reduceOnlyGuard = (reduceOnly:boolean, side:string, quantity:number, userId:string, stockSymbol:string) => {

	if(reduceOnly === false) return

	if(reduceOnly === true && side == OrderSide.LONG){
		const userAvailableActiveContracts = readContractStoreUserContractQuantity(userId, stockSymbol);
		if(quantity > userAvailableActiveContracts){
			throw new HttpErrorResponse(400, false, "Reduce Only Order Error Type:[LONG]");
		}
		return
	}

	if(reduceOnly === true && side == OrderSide.SHORT){
		const userAvailableActiveContracts = readContractStoreUserContractQuantity(userId, stockSymbol);
		if(Math.abs(quantity) > Math.abs(userAvailableActiveContracts)){
			throw new HttpErrorResponse(400, false, "Reduce Only Order Error Type:[SHORT]");
		}		
	}

	return
}