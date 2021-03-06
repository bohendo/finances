import { AddressZero } from "@ethersproject/constants";
import { Assets, TransferCategories, TransactionSources } from "@valuemachine/types";

import { getTransactionsError } from "./transactions";
import { expect } from "./testUtils";

const validTransaction = {
  date: new Date(0).toISOString(),
  sources: [TransactionSources.EthTx],
  transfers: [{
    asset: Assets.ETH,
    category: TransferCategories.Expense,
    from: AddressZero,
    to: AddressZero,
    quantity: "0",
  }],
};

describe("Transactions", () => {
  it("should return no errors if json is valid", async () => {
    expect(getTransactionsError([validTransaction])).to.be.null;
  });

  it("should return an error if the json is invalid", async () => {
    expect(getTransactionsError([{ ...validTransaction, date: null }])).to.be.a("string");
  });
});
