import { Assets, AssetChunk } from "./assets";
import { Address, DecimalString, TimestampString } from "./strings";
import { enumify } from "./utils";

export const EventTypes = enumify({
  Income: "Income",
  Expense: "Expense",

  Borrow: "Borrow", // eg minting dai from cdp or borrowing from compound
  Repay: "Repay",

  Deposit: "Deposit", // eg dai->dsr or eth->compound
  Withdraw: "Withdraw",

  Trade: "Trade",
});
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type EventTypes = (typeof EventTypes)[keyof typeof EventTypes];

type BaseEvent = {
  assetPrice: DecimalString;
  asset: Assets;
  date: TimestampString;
  description: string;
  quantity: DecimalString;
  tags: string[];
  type: EventTypes;
}

////////////////////////////////////////

export type IncomeEvent = BaseEvent & {
  from: Address;
  type: typeof EventTypes.Income;
}

export type ExpenseEvent = BaseEvent & {
  to: Address;
  type: typeof EventTypes.Expense;
}

export type BorrowEvent = BaseEvent & {
  from: Address;
  type: typeof EventTypes.Borrow;
}

export type RepayEvent = BaseEvent & {
  to: Address;
  type: typeof EventTypes.Repay;
}

export type DepositEvent = BaseEvent & {
  to: Address;
  type: typeof EventTypes.Deposit;
}

export type WithdrawEvent = BaseEvent & {
  from: Address;
  type: typeof EventTypes.Withdraw;
}

export type TradeEvent = {
  date: TimestampString;
  description: string;
  inputs: { [asset: string]: DecimalString };
  outputs: { [asset: string]: DecimalString };
  prices: { [asset: string]: DecimalString };
  spentChunks: AssetChunk[];
  tags?: string[];
  type: typeof EventTypes.Trade;
}

export type Event =
  | BorrowEvent
  | DepositEvent
  | ExpenseEvent
  | IncomeEvent
  | RepayEvent
  | TradeEvent
  | WithdrawEvent;
export type Events = Event[];

export type EventsJson = Events;

export const emptyEvents = [] as Events;
