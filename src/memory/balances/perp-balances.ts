import type { PerpetualBalanceStoreType, UpdateBalanceInput } from "./perp-balances-types.js";

const PERPETUAL_BALANCE_STORE: PerpetualBalanceStoreType = {
	"14":{
		balance :{
		"inr":{
				total:10000,
				locked:0,
			}
		}
	},
    "13":{
		balance :{
		"inr":{
				total:10000,
				locked:0,
			}
		}
	},
    "12":{
		balance :{
		"inr":{
				total:10000,
				locked:0,
			}
		}
	},
	"11":{
			balance: {
			"inr": {
					total: 10000,
					locked: 0,
			},
			}
	}
};

interface User {
    username: string;
    password: string;
    balance: number;
    id: number;
}

export const initUserInBalanceStore = (user:User) => {  
    PERPETUAL_BALANCE_STORE[user.id] = {
        balance:{
            "inr":{
                total:user.balance,
                locked:0,
            },
            
        }
    }
}

//@ts-ignore
// export const putBackupInBalanceStore = (data) => {
//     // clear existing keys
//     Object.keys(BALANCE_STORE).forEach(key => {
//         delete BALANCE_STORE[key]
//     })

//     Object.assign(BALANCE_STORE, data)
// }
export const readBalanceStoreUserTotalBalance = (userId:string) => {
    //@ts-ignore
    return PERPETUAL_BALANCE_STORE[userId].balance["inr"].total
}
export const readBalanceStoreUserLockedBalance = (userId:string) => {
    //@ts-ignore
    return PERPETUAL_BALANCE_STORE[userId].balance["inr"].locked
}

export const updateBalanceStoreUserTotalBalance = (userId:string, value:number) => {
    //@ts-ignore
    PERPETUAL_BALANCE_STORE[userId].balance["inr"].total = value
}

export const updateBalanceStoreUserLockedBalance = (userId:string, value:number) => {
    //@ts-ignore
    PERPETUAL_BALANCE_STORE[userId].balance["inr"].locked = value
}

export const hanldeUserBalanceUpdate = (payload : UpdateBalanceInput):any => {
  const { id , balance, marketType } = payload
  const userTotalBalance = readBalanceStoreUserTotalBalance(id)!;
  updateBalanceStoreUserTotalBalance(id, userTotalBalance + balance)
  //@ts-ignore
  return PERPETUAL_BALANCE_STORE[id]?.balance["inr"]
}

export default PERPETUAL_BALANCE_STORE;