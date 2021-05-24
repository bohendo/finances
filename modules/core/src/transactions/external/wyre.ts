import {
  DateString,
  Logger,
  Transaction,
  TransactionSources,
  TransferCategories,
} from "@finances/types";
import { math } from "@finances/utils";
import csv from "csv-parse/lib/sync";

import { mergeTransaction } from "../utils";

export const mergeWyreTransactions = (
  oldTransactions: Transaction[],
  csvData: string,
  logger: Logger,
): Transaction[] => {
  const log = logger.child({ module: "Wyre" });
  log.info(`Processing ${csvData.split(`\n`).length - 2} rows of wyre data`);
  csv(csvData, { columns: true, skip_empty_lines: true }).forEach(row => {

    const {
      ["Created At"]: date,
      ["Dest Amount"]: destQuantity,
      ["Dest Currency"]: rawDestType,
      ["Fees DAI"]: daiFees,
      ["Fees ETH"]: ethFees,
      ["Fees USD"]: usdFees,
      ["Source Amount"]: sourceQuantity,
      ["Source Currency"]: rawSourceType,
      ["Type"]: txType,
    } = row;

    const beforeDaiMigration = (date: DateString): boolean =>
      new Date(date).getTime() < new Date("2019-12-02T00:00:00Z").getTime();

    const destType = beforeDaiMigration(date) && rawDestType === "DAI" ? "SAI" : rawDestType;
    const sourceType = beforeDaiMigration(date) && rawSourceType === "DAI" ? "SAI" : rawDestType;

    // Ignore any rows with an invalid timestamp
    if (isNaN((new Date(date)).getUTCFullYear())) return null;
    const transaction = {
      date: (new Date(date)).toISOString(),
      description: "",
      sources: [TransactionSources.Wyre],
      tags: [],
      transfers: [],
    } as Transaction;

    // Push transfer depending on exchange/currency types

    if (txType === "EXCHANGE") {
      transaction.transfers.push({
        asset: sourceType,
        category: TransferCategories.SwapOut,
        from: "wyre-account",
        quantity: sourceQuantity,
        to: "wyre-exchange",
      });
      transaction.transfers.push({
        asset: destType,
        category: TransferCategories.SwapIn,
        from: "wyre-exchange",
        quantity: destQuantity,
        to: "wyre-account",
      });
      transaction.description = sourceType === "USD"
        ? `Buy ${destQuantity} ${destType} for ${sourceQuantity} USD on wyre`
        : `Sell ${sourceQuantity} ${sourceType} for ${destQuantity} ${destType} on wyre`;

    } else if (txType === "INCOMING" && destType === sourceType) {
      transaction.transfers.push({
        asset: destType,
        category: TransferCategories.Transfer,
        from: "external-account",
        quantity: destQuantity,
        to: "wyre-account",
      });
      transaction.description = `Deposit ${destQuantity} ${destType} into wyre`;

    } else if (txType === "INCOMING" && destType !== sourceType) {
      transaction.transfers.push({
        asset: sourceType,
        category: TransferCategories.SwapOut,
        from: "external-account",
        quantity: sourceQuantity,
        to: "wyre-exchange",
      });
      transaction.transfers.push({
        asset: destType,
        category: TransferCategories.SwapIn,
        from: "wyre-exchange",
        quantity: destQuantity,
        to: "wyre-account",
      });
      transaction.description = sourceType === "USD"
        ? `Buy ${destQuantity} ${destType} for ${sourceQuantity} USD on wyre`
        : `Sell ${sourceQuantity} ${sourceType} for ${destQuantity} ${destType} on wyre`;

    } else if (txType === "OUTGOING" && destType === sourceType) {
      transaction.transfers.push({
        asset: destType,
        category: TransferCategories.Transfer,
        from: "wyre-account",
        quantity: destQuantity,
        to: "external-account",
      });
      transaction.description = `Withdraw ${destQuantity} ${destType} out of wyre`;

    } else if (txType === "OUTGOING" && destType !== sourceType) {
      transaction.transfers.push({
        asset: sourceType,
        category: TransferCategories.SwapOut,
        from: "wyre-account",
        quantity: sourceQuantity,
        to: "wyre-exchange",
      });
      transaction.transfers.push({
        asset: destType,
        category: TransferCategories.SwapIn,
        from: "wyre-exchange",
        quantity: destQuantity,
        to: "external-account",
      });
      transaction.description = sourceType === "USD"
        ? `Buy ${destQuantity} ${destType} for ${sourceQuantity} USD on wyre`
        : `Sell ${sourceQuantity} ${sourceType} for ${destQuantity} ${destType} on wyre`;
    }

    // Add fees paid to exchange
    const feeTransfer = {
      category: TransferCategories.Expense,
      from: "wyre-account",
      to: "wyre-exchange",
    };
    if (math.gt(usdFees, "0")) {
      transaction.transfers.push({ ...feeTransfer, asset: "USD", quantity: usdFees });
    } else if (math.gt(ethFees, "0")) {
      transaction.transfers.push({ ...feeTransfer, asset: "ETH", quantity: ethFees });
    } else if (math.gt(daiFees, "0")) {
      transaction.transfers.push({ ...feeTransfer, asset: "DAI", quantity: daiFees });
    }

    log.debug(transaction, "Parsed row into transaction:");
    mergeTransaction(oldTransactions, transaction, log);

  });
  return oldTransactions;
};