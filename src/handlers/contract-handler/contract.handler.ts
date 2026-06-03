import { randomUUID } from "crypto";
import { readBalanceStoreUserLockedBalance, readBalanceStoreUserTotalBalance, updateBalanceStoreUserLockedBalance, updateBalanceStoreUserTotalBalance } from "../../memory/balances/balances.js";
import { CONTRACT_STORE, createContractUser, createContractUserStock, readContractStoreUserContractAvgPrice, readContractStoreUserContractCollateral, readContractStoreUserContractQuantity, readContractStoreUserContractUnrealizedPnL, updateContractStoreUserContractAvgPrice, updateContractStoreUserContractCollateral, updateContractStoreUserContractQuantity } from "../../memory/contracts/contracts-store.js";
import type { ContractInputPayloadDbAdapter } from "../../memory/contracts/contracts-types.js";
import { queueMessageForAdapter } from "../../queue/db-publisher-client.js";
import { AdapterEntityType, AdapterMessageType } from "@cex/shared";
import { OrderSide } from "../../types/perp-types.js";


export const hanldeContracts = (stockSymbol:string, contract_quantity:number, price:number, personWhoLongedId:string, personWhoShortedId:string) => {

  const collateral = contract_quantity * price ;

  handlePreContractChecks(personWhoLongedId, stockSymbol);
  handlePreContractChecks(personWhoShortedId, stockSymbol);

  const {completeClose:isLongCompleteClose, partialClosePartialRefill:isLongParitalClosePartialRefill} = checkIsLongOrderClosingContract(stockSymbol, contract_quantity, price, personWhoLongedId, personWhoShortedId);
  const {completeClose:isShortCompleteClose, partialClosePartialRefill:isShortParitalClosePartialRefill} = checkIsShortOrderClosingContract(stockSymbol, contract_quantity, price, personWhoLongedId, personWhoShortedId);

  if(isLongCompleteClose === true || isLongParitalClosePartialRefill === true){
    const personExitingLockedBalance = readBalanceStoreUserLockedBalance(personWhoLongedId);
    updateBalanceStoreUserLockedBalance(personWhoLongedId, personExitingLockedBalance - collateral);
  }
  else if(isShortCompleteClose === true || isShortParitalClosePartialRefill == true){
    const personExitingLockedBalance = readBalanceStoreUserLockedBalance(personWhoShortedId);
    updateBalanceStoreUserLockedBalance(personWhoShortedId, personExitingLockedBalance - collateral);
  }

  OrderLongSettleContracts(stockSymbol, contract_quantity, price, personWhoLongedId, personWhoShortedId, collateral);
	OrderShortSettleContracts(stockSymbol, contract_quantity, price, personWhoLongedId, personWhoShortedId, collateral);
  if(isLongCompleteClose === true){
    delete CONTRACT_STORE[personWhoLongedId]![stockSymbol]
  }
  if(isShortCompleteClose === true){
    delete CONTRACT_STORE[personWhoShortedId]![stockSymbol]
  }
}

const OrderLongSettleContracts = (stockSymbol:string, contract_quantity:number, price:number, personWhoLongedId:string, personWhoShortedId:string, collateral:number) => {

	//read values of the personWhoLonged
	const personWhoLongedContractQuantity = readContractStoreUserContractQuantity(personWhoLongedId, stockSymbol)
	const personWhoLongedAvgPrice = readContractStoreUserContractAvgPrice(personWhoLongedId, stockSymbol)
	const personWhoLongedCollateral = readContractStoreUserContractCollateral(personWhoLongedId, stockSymbol)

	if(personWhoLongedContractQuantity > 0 ){
		updateContractStoreUserContractQuantity(personWhoLongedId, stockSymbol, personWhoLongedContractQuantity + contract_quantity);
		updateContractStoreUserContractAvgPrice(personWhoLongedId, stockSymbol, ((personWhoLongedAvgPrice * personWhoLongedContractQuantity) + (price * contract_quantity)) / (personWhoLongedContractQuantity + contract_quantity));
		updateContractStoreUserContractCollateral(personWhoLongedId, stockSymbol, personWhoLongedCollateral + collateral);
	}
	else if(personWhoLongedContractQuantity === 0){
		updateContractStoreUserContractQuantity(personWhoLongedId, stockSymbol, contract_quantity);
		updateContractStoreUserContractAvgPrice(personWhoLongedId, stockSymbol, price);
		updateContractStoreUserContractCollateral(personWhoLongedId, stockSymbol, collateral);
	}
	else{

		if(personWhoLongedContractQuantity + contract_quantity < 0){
			updateContractStoreUserContractQuantity(personWhoLongedId, stockSymbol, personWhoLongedContractQuantity + contract_quantity);
			updateContractStoreUserContractAvgPrice(personWhoLongedId, stockSymbol, personWhoLongedAvgPrice);
			updateContractStoreUserContractCollateral(personWhoLongedId, stockSymbol, personWhoLongedCollateral + collateral);
		}
		else if(personWhoLongedContractQuantity + contract_quantity === 0){
      //implies a condition where earlier person has shorted and now the person has longed to close the contract
      closeContractSettleBalances(stockSymbol, personWhoLongedId, true);
    }
		else{

      //implies a condition where earlier person has shorted and now the person has longed to close the contract
			const remainingContractQuantity = personWhoLongedContractQuantity + contract_quantity;
			const remainingCollateral = (personWhoLongedCollateral / personWhoLongedContractQuantity) * remainingContractQuantity;

      closeContractSettleBalances(stockSymbol, personWhoLongedId, false);
  
			updateContractStoreUserContractQuantity(personWhoLongedId, stockSymbol, remainingContractQuantity);
			updateContractStoreUserContractAvgPrice(personWhoLongedId, stockSymbol, personWhoLongedAvgPrice);
			updateContractStoreUserContractCollateral(personWhoLongedId, stockSymbol, remainingCollateral);

		}

	}
}

const OrderShortSettleContracts = (stockSymbol:string, contract_quantity:number, price:number, personWhoLongedId:string, personWhoShortedId:string, collateral:number) => {

	//read values of the personWhoShorted
	const personWhoShortedContractQuantity = readContractStoreUserContractQuantity(personWhoShortedId, stockSymbol)
	const personWhoShortedAvgPrice = readContractStoreUserContractAvgPrice(personWhoShortedId, stockSymbol)
	const personWhoShortedCollateral = readContractStoreUserContractCollateral(personWhoShortedId, stockSymbol)

	if(personWhoShortedContractQuantity < 0 ){
		updateContractStoreUserContractQuantity(personWhoShortedId, stockSymbol, personWhoShortedContractQuantity - contract_quantity);
		updateContractStoreUserContractAvgPrice(personWhoShortedId, stockSymbol, ((personWhoShortedAvgPrice * Math.abs(personWhoShortedContractQuantity)) + (price * contract_quantity)) / (Math.abs(personWhoShortedContractQuantity) + contract_quantity));
		updateContractStoreUserContractCollateral(personWhoShortedId, stockSymbol, personWhoShortedCollateral + collateral);
	}
	else if(personWhoShortedContractQuantity === 0){
		updateContractStoreUserContractQuantity(personWhoShortedId, stockSymbol, -contract_quantity);
		updateContractStoreUserContractAvgPrice(personWhoShortedId, stockSymbol, price);
		updateContractStoreUserContractCollateral(personWhoShortedId, stockSymbol, collateral);
	}
	else{

		if(personWhoShortedContractQuantity - contract_quantity > 0){
			updateContractStoreUserContractQuantity(personWhoShortedId, stockSymbol, personWhoShortedContractQuantity - contract_quantity);
			updateContractStoreUserContractAvgPrice(personWhoShortedId, stockSymbol, personWhoShortedAvgPrice);
			updateContractStoreUserContractCollateral(personWhoShortedId, stockSymbol, personWhoShortedCollateral + collateral);
		}
		else if(personWhoShortedContractQuantity - contract_quantity === 0){

      //implies a condition where earlier person has longed and now the person has short to close the contract
      closeContractSettleBalances(stockSymbol, personWhoShortedId, true);
		}
		else{

      //implies a condition where earlier person has longed and now the person has short to close the contract

			const remainingContractQuantity = personWhoShortedContractQuantity - contract_quantity;
			const remainingCollateral = (personWhoShortedCollateral / Math.abs(personWhoShortedContractQuantity)) * Math.abs(remainingContractQuantity);

      closeContractSettleBalances(stockSymbol, personWhoShortedId, false);

			updateContractStoreUserContractQuantity(personWhoShortedId, stockSymbol, remainingContractQuantity);
			updateContractStoreUserContractAvgPrice(personWhoShortedId, stockSymbol, personWhoShortedAvgPrice);
			updateContractStoreUserContractCollateral(personWhoShortedId, stockSymbol, remainingCollateral);

		}

	}
}

const checkIsLongOrderClosingContract = (stockSymbol:string, contract_quantity:number, price:number, personWhoLongedId:string, personWhoShortedId:string) => {
	const personWhoLongedContractQuantity = readContractStoreUserContractQuantity(personWhoLongedId, stockSymbol);

	if(personWhoLongedContractQuantity > 0 ){
    return {
      completeClose:false,
      partialClosePartialRefill:false
    }
	}
	else if(personWhoLongedContractQuantity === 0){
    return {
      completeClose:false,
      partialClosePartialRefill:false
    }
	}
	else{

		if(personWhoLongedContractQuantity + contract_quantity < 0){
      return {
        completeClose:false,
        partialClosePartialRefill:false
      }
		}
		else if(personWhoLongedContractQuantity + contract_quantity === 0){
      //implies a condition where earlier person has longed and now the person has short to close the contract
      return {
        completeClose:true,
        partialClosePartialRefill:false
      }
		}
		else{
      //implies a condition where earlier person has shorted and now the person has longed to close the contract
      return {
        completeClose:false,
        partialClosePartialRefill:true
      }
		}
  }
}

const checkIsShortOrderClosingContract = (stockSymbol:string, contract_quantity:number, price:number, personWhoLongedId:string, personWhoShortedId:string) => {
  //read values of the personWhoShorted
	const personWhoShortedContractQuantity = readContractStoreUserContractQuantity(personWhoShortedId, stockSymbol);


	if(personWhoShortedContractQuantity < 0 ){
    return {
      completeClose:false,
      partialClosePartialRefill:false
    }
	}
	else if(personWhoShortedContractQuantity === 0){
    return {
      completeClose:false,
      partialClosePartialRefill:false
    }
	}
	else{

		if(personWhoShortedContractQuantity - contract_quantity > 0){
			return {
        completeClose:false,
        partialClosePartialRefill:false
      }
		}
		else if(personWhoShortedContractQuantity - contract_quantity === 0){
      //implies a condition where earlier person has longed and now the person has short to close the contract
      return {
        completeClose:true,
        partialClosePartialRefill:false
      }
		}
		else{
      //implies a condition where earlier person has longed and now the person has short to close the contract
      return {
        completeClose:false,
        partialClosePartialRefill:true
      }
		}

	}
}

const closeContractSettleBalances = (stockSymbol:string, userId:string, completeClose:boolean) => {

  const personExitingPnL = readContractStoreUserContractUnrealizedPnL(userId, stockSymbol);
  const personExitingCollateral = readContractStoreUserContractCollateral(userId, stockSymbol);

  const personExitingTotalBalance = readBalanceStoreUserTotalBalance(userId);
  const personExitingLockedBalance = readBalanceStoreUserLockedBalance(userId);

  if(personExitingPnL > 0){
    updateBalanceStoreUserTotalBalance(userId, personExitingTotalBalance + personExitingPnL);
    if(completeClose === true){
      updateBalanceStoreUserLockedBalance(userId, personExitingLockedBalance - personExitingCollateral);
    }
  }
  else if(personExitingPnL < 0){
    updateBalanceStoreUserTotalBalance(userId, personExitingTotalBalance + personExitingPnL);
    if(completeClose === true){
      updateBalanceStoreUserLockedBalance(userId, personExitingLockedBalance - (personExitingCollateral - Math.abs(personExitingPnL)));
    }
  }

  const contractEntity = CONTRACT_STORE[userId]![stockSymbol]!

  //after every transaction is complete push msg to queue
  const contractId = randomUUID()
  buildAndQueueContractEntity(contractId, contractEntity.contract_quantity, contractEntity.avg_price, contractEntity.collateral, personExitingPnL, stockSymbol, userId);
}

const buildAndQueueContractEntity = (contract_id:string, quantity:number, price:number, collateral:number, pnl:number, stockSymbol:string, userId:string) => {
  
  let realizedProfit = 0;
  let realizedLoss = 0;

  if(pnl > 0){
    realizedProfit = pnl
  }
  else if(pnl < 0){
    realizedLoss = pnl
  }

  const payload:ContractInputPayloadDbAdapter = {
    id:contract_id,
    contract_quantity:quantity,
    avg_price:price,
    collateral,
    realizedProfit,
    realizedLoss,
    stockSymbol,
    userId
  };

  queueMessageForAdapter({
    messageType:AdapterMessageType.APPEND_ONLY,
    entityType:AdapterEntityType.CONTRACT,
    payload
  });
}

const handlePreContractChecks = (userId:string, symbol:string) => {
  if(!checkIsUserExistInContract(userId)){
    createContractUser(userId);
  }
  if(!checkIsStockExistInUser(userId, symbol)){
    createContractUserStock(userId, symbol);
  }
}

const checkIsUserExistInContract = (userId:string) => {
  if(!CONTRACT_STORE[userId]){
    return false;
  }
  return true;
}

const checkIsStockExistInUser = (userId: string, symbol:string) => {
  if(!CONTRACT_STORE[userId]![symbol]){
    return false
  }
  return true
}

/* 
  ------ QUEUE REQUEST HANDLERS ------
  ------------------------------------
*/

export const handle_GET_OPEN_CONTRACT_Request = (payload:any) => {
  const { symbol, id } = payload

  if(!CONTRACT_STORE[id]){
    return {
      success:false
    }
  }

  if(!CONTRACT_STORE[id][symbol]){
    return {
      success:false
    }
  }

  const contract = CONTRACT_STORE[id][symbol]
  const pnl = contract.unrealizedPnL;

  let realizedProfit = 0;
  let realizedLoss = 0;
  let side = OrderSide.long

  if(contract.contract_quantity > 0){
    side = OrderSide.long
  }
  else if(contract.contract_quantity < 0){
    side = OrderSide.short
  }

  if(pnl > 0){
    realizedProfit = pnl
  }
  else if(pnl < 0){
    realizedLoss = pnl
  }

  return {
    success:true,
    symbol,
    side,
    contract_quantity:contract.contract_quantity,
    avg_price:contract.avg_price,
    collateral:contract.collateral,
    realizedProfit,
    realizedLoss,
    id
  };
}