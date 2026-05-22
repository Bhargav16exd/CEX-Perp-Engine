export interface PerpetualBalanceStoreType {
  [userId:string]:BalanceStoreUserEntity;
}

interface BalanceStoreUserEntity {
	balance:{
		[currencyType:string]:currencyType;
	}
}

interface currencyType {
  total:number;
  locked:number;
}

export interface UpdateBalanceInput {
  id:string,
  balance:number,
  marketType:number
}





