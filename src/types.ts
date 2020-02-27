import { Field, Forms } from "./mappings";
export { Field, Forms };

export type DateString = string; // eg "2020-02-27" aka TimestampString.split("T")[0] 
export type DecimalString = string; // eg "3.1415"
export type HexString = string; // eg "0xabc123"
export type TimestampString = string; // eg "2020-02-27T09:51:30.444Z" (ISO 8601 format)

export type AddressData = {
  address: HexString;
  block: number;
  hasCode: boolean;
  transactions: Array<HexString>;
};

export type TransactionLog = {
  address: HexString;
  data: HexString;
  index: number;
  topics: Array<HexString>;
};

export type TransactionData = {
  block: number;
  data: HexString;
  from: HexString;
  gasLimit: HexString;
  gasPrice: HexString;
  gasUsed?: HexString;
  hash: HexString;
  index?: number;
  logs?: Array<TransactionLog>;
  nonce: number;
  timestamp: TimestampString;
  to: HexString | null;
  value: DecimalString;
};

export type CallData = {
  block: number;
  from: HexString;
  hash: HexString;
  timestamp: TimestampString;
  to: HexString;
  value: DecimalString;
};

// format of chain-data.json
export type ChainData = {
  lastUpdated: TimestampString;
  addresses: { [address: string]: AddressData };
  transactions: { [hash: string]: TransactionData };
  calls: { [hash: string]: CallData };
};

export const AddressCategories = {
  "erc20": "erc20",
  "family": "family",
  "friend": "friend",
  "private": "private",
  "public": "public",
  "self": "self",
};
export type AddressCategory = keyof typeof AddressCategories;

export type AddressBook = Array<{
  address: HexString;
  category: AddressCategory;
  name; string;
  tags: string[];
}>

export const AssetTypes = {
  "DAI": "DAI",
  "ETH": "ETH",
  "INR": "INR",
  "MKR": "MKR",
  "SAI": "SAI",
  "SNT": "SNT",
  "SNX": "SNX",
  "USD": "USD",
  "WETH": "WETH",
};
export type AssetType = keyof typeof AssetTypes;

export type Asset = {
  amount: DecimalString;
  date?: TimestampString;
  price?: DecimalString;
  type: AssetType | string;
  value?: DecimalString;
}

export type PriceData = {
  ids: {
    [key: string /* AssetType */]: string;
  };
  [key: string /* DateString */]: {
    [key: string /* AssetType */]: DecimalString;
  };
}

export const EventCategories = {
  "borrow": "borrow",
  "expense": "expense",
  "income": "income",
  "repayment": "repayment",
  "swap": "swap",
};
export type EventCategory = keyof typeof EventCategories;

export type Event = {
  assetsIn?: Asset[];
  assetsOut?: Asset[];
  category?: EventCategory | string;
  date: TimestampString;
  description?: string;
  from?: string;
  hash?: HexString;
  prices?: { [key: string]: DecimalString };
  source: string;
  tags?: string[];
  to?: string;
}

export const CapitalGainsMethods = {
  "FIFO": "FIFO",
  "HIFO": "HIFO",
  "LIFO": "LIFO",
};
export type CapitalGainsMethod = keyof typeof CapitalGainsMethods;

export type InputData = {
  addressBook?: AddressBook;
  capitalGainsMethod: CapitalGainsMethod;
  etherscanKey?: string;
  events: Array<Event | string>;
  formData: Forms;
  forms: string[];
  logLevel?: number;
  taxYear: string;
}

// aka row of f8949
export type CapitalGain = {
  Adjustment: string;
  Code: string;
  Cost: string;
  DateAcquired: string;
  DateSold: string;
  Description: string;
  GainOrLoss: string;
  Proceeds: string;
}

export type FinancialData = {
  expenses: Array<Event>;
  income: Array<Event>;
  input: InputData;
  trades: CapitalGain[];
}
