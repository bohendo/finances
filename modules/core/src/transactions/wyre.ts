import {
  DateString,
  Logger,
  Transaction,
  TransactionSources,
  TransferCategories,
} from "@finances/types";
import { ContextLogger, math } from "@finances/utils";
import csv from "csv-parse/lib/sync";

import {
  mergeFactory,
  mergeOffChainTransactions,
  shouldMergeOffChain,
} from "./utils";
import { getTransactionsError } from "../verify";

export const mergeWyreTransactions = (
  oldTransactions: Transaction[],
  wyreData: string,
  lastUpdated: number,
  logger?: Logger,
): Transaction[] => {
  const log = new ContextLogger("SendWyre", logger);
  let transactions = JSON.parse(JSON.stringify(oldTransactions));
  const wyreTransactions = csv(
    wyreData,
    { columns: true, skip_empty_lines: true },
  ).map(row => {
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

    if (new Date(date).getTime() <= lastUpdated) {
      return null;
    }

    const beforeDaiMigration = (date: DateString): boolean =>
      new Date(date).getTime() < new Date("2019-12-02T00:00:00Z").getTime();

    const destType = beforeDaiMigration(date) && rawDestType === "DAI" ? "SAI" : rawDestType;
    const sourceType = beforeDaiMigration(date) && rawSourceType === "DAI" ? "SAI" : rawDestType;

    // Ignore any rows with an invalid timestamp
    if (isNaN((new Date(date)).getUTCFullYear())) return null;
    const transaction = {
      date: (new Date(date)).toISOString(),
      description: "",
      prices: {},
      sources: [TransactionSources.SendWyre],
      tags: [],
      transfers: [],
    } as Transaction;

    // Push transfer depending on exchange/currency types

    if (txType === "EXCHANGE") {
      transaction.transfers.push({
        assetType: sourceType,
        category: TransferCategories.SwapOut,
        from: "sendwyre-account",
        quantity: sourceQuantity,
        to: "sendwyre-exchange",
      });
      transaction.transfers.push({
        assetType: destType,
        category: TransferCategories.SwapIn,
        from: "sendwyre-exchange",
        quantity: destQuantity,
        to: "sendwyre-account",
      });
      transaction.description = sourceType === "USD"
        ? `Buy ${destQuantity} ${destType} for ${sourceQuantity} USD on sendwyre`
        : `Sell ${sourceQuantity} ${sourceType} for ${destQuantity} ${destType} on sendwyre`;

    } else if (txType === "INCOMING" && destType === sourceType) {
      transaction.transfers.push({
        assetType: destType,
        category: TransferCategories.Transfer,
        from: "external-account",
        quantity: destQuantity,
        to: "sendwyre-account",
      });
      transaction.description = `Deposit ${destQuantity} ${destType} into sendwyre`;

    } else if (txType === "INCOMING" && destType !== sourceType) {
      transaction.transfers.push({
        assetType: sourceType,
        category: TransferCategories.SwapOut,
        from: "external-account",
        quantity: sourceQuantity,
        to: "sendwyre-exchange",
      });
      transaction.transfers.push({
        assetType: destType,
        category: TransferCategories.SwapIn,
        from: "sendwyre-exchange",
        quantity: destQuantity,
        to: "sendwyre-account",
      });
      transaction.description = sourceType === "USD"
        ? `Buy ${destQuantity} ${destType} for ${sourceQuantity} USD on sendwyre`
        : `Sell ${sourceQuantity} ${sourceType} for ${destQuantity} ${destType} on sendwyre`;

    } else if (txType === "OUTGOING" && destType === sourceType) {
      transaction.transfers.push({
        assetType: destType,
        category: TransferCategories.Transfer,
        from: "sendwyre-account",
        quantity: destQuantity,
        to: "external-account",
      });
      transaction.description = `Withdraw ${destQuantity} ${destType} out of sendwyre`;

    } else if (txType === "OUTGOING" && destType !== sourceType) {
      transaction.transfers.push({
        assetType: sourceType,
        category: TransferCategories.SwapOut,
        from: "sendwyre-account",
        quantity: sourceQuantity,
        to: "sendwyre-exchange",
      });
      transaction.transfers.push({
        assetType: destType,
        category: TransferCategories.SwapIn,
        from: "sendwyre-exchange",
        quantity: destQuantity,
        to: "external-account",
      });
      transaction.description = sourceType === "USD"
        ? `Buy ${destQuantity} ${destType} for ${sourceQuantity} USD on sendwyre`
        : `Sell ${sourceQuantity} ${sourceType} for ${destQuantity} ${destType} on sendwyre`;
    }

    // Add fees paid to exchange
    const feeTransfer = {
      category: TransferCategories.Expense,
      from: "sendwyre-account",
      to: "sendwyre-exchange",
    };
    if (math.gt(usdFees, "0")) {
      transaction.transfers.push({ ...feeTransfer, assetType: "USD", quantity: usdFees });
    } else if (math.gt(ethFees, "0")) {
      transaction.transfers.push({ ...feeTransfer, assetType: "ETH", quantity: ethFees });
    } else if (math.gt(daiFees, "0")) {
      transaction.transfers.push({ ...feeTransfer, assetType: "DAI", quantity: daiFees });
    }

    log.debug(transaction.description);
    return transaction;
  }).filter(row => !!row);


  const mergeWyre = mergeFactory({
    allowableTimeDiff: 15 * 60 * 1000,
    log,
    mergeTransactions: mergeOffChainTransactions,
    shouldMerge: shouldMergeOffChain,
  });

  log.info(`Processing ${wyreTransactions.length} new transactions from wyre`);

  wyreTransactions.forEach((wyreTransaction: Transaction): void => {
    log.debug(wyreTransaction.description);
    transactions = mergeWyre(transactions, wyreTransaction);
  });

  // The non-zero allowableTimeDiff for exchange merges causes edge cases while insert-sorting
  // edge case is tricky to solve at source, just sort manually ffs
  transactions = transactions.sort((e1: Transaction, e2: Transaction): number =>
    new Date(e1.date).getTime() - new Date(e2.date).getTime(),
  );

  const error = getTransactionsError(transactions);
  if (error) {
    throw new Error(error);
  }

  return transactions;
};
