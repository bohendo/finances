import { AssetTypes } from "./assets";
import { DecimalString, TimestampString } from "./strings";

export type PriceList = {
  [unitOfAccount: string]: {
    [assetType: string]: DecimalString; // UoA per asset
  };
};

export type PricesJson = {
  [date: string]: PriceList;
};

export interface Prices {
  getPrice(date: TimestampString, asset: AssetTypes): string | undefined;
  json: PricesJson;
  setPrice(date: TimestampString, asset: AssetTypes, price: DecimalString): void;
  syncPrice(date: TimestampString, asset: AssetTypes): Promise<string>;
}

export const emptyPrices = {} as PricesJson;
