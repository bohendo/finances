import { DecimalString, TimestampString } from "./strings";
import { enumify } from "./utils";

export const AssetTypes = enumify({
  BAT: "BAT",
  cDAI: "cDAI",
  COMP: "COMP",
  DAI: "DAI",
  ETH: "ETH",
  GEN: "GEN",
  INR: "INR",
  MKR: "MKR",
  SAI: "SAI",
  SNT: "SNT",
  SNX: "SNX",
  USD: "USD",
  WETH: "WETH",
});
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type AssetTypes = (typeof AssetTypes)[keyof typeof AssetTypes];

export type AssetChunk = {
  assetType: AssetTypes;
  dateRecieved: TimestampString;
  purchasePrice: DecimalString; /* units of account (USD/DAI) per 1 assetType */
  quantity: DecimalString;
};
