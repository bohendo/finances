import { Static, Type } from "@sinclair/typebox";

import { AddressBookJson } from "./addressBook";
import { ChainDataJson } from "./chainData";
import { PricesJson } from "./prices";
import { ValueMachineJson } from "./vm";
import { TransactionsJson } from "./transactions";

export const StoreKeys = {
  AddressBook: "AddressBook",
  ChainData: "ChainData",
  Prices: "Prices",
  Transactions: "Transactions",
  ValueMachine: "ValueMachine",
} as const;
export const StoreKey = Type.Union([
  Type.String(),
  Type.Enum(StoreKeys),
]);
export type StoreKey = Static<typeof StoreKey>;

interface StoreTypeMap {
  [StoreKeys.AddressBook]: AddressBookJson;
  [StoreKeys.ChainData]: ChainDataJson;
  [StoreKeys.Prices]: PricesJson;
  [StoreKeys.Transactions]: TransactionsJson;
  [StoreKeys.ValueMachine]: ValueMachineJson;
}

export type StoreValues = {
  [P in keyof StoreTypeMap]: StoreTypeMap[P];
}

export interface Store {
  load: <T extends keyof StoreValues>(key: T) => StoreValues[T];
  save: <T extends keyof StoreValues>(key: T, value: StoreValues[T]) => void; 
}
