import {
  AddressCategories,
  Transactions,
  TransactionSources,
  TransferCategories,
} from "@finances/types";
import { expect } from "@finances/utils";

import {
  getRealChainData,
  getTestAddressBook,
  testLogger,
} from "../../testing";
import { getTransactions } from "../index";

const { Expense, SwapIn, SwapOut } = TransferCategories;
const log = testLogger.child({
  level: "debug",
  module: "TestTransactions",
});

describe.only(TransactionSources.EtherDelta, () => {
  let txns: Transactions;
  let addressBook;

  beforeEach(() => {
    addressBook = getTestAddressBook();
    txns = getTransactions({ addressBook, logger: log });
    expect(txns.json.length).to.equal(0);
  });

  it("should handle a deposit", async () => {
    const selfAddress = "0x213fe7e177160991829a4d0a598a848d2448f384";
    const txHash = "0x37f4fbcd53d68c3b9297b6d2d5034a5604234310ae443d300fa918af7d7e42f4";
    addressBook.newAddress(selfAddress, AddressCategories.Self, "test-self");
    const chainData = await getRealChainData(txHash);
    txns.mergeChainData(chainData);
    expect(txns.json.length).to.equal(1);
    const tx = txns.json[0];
    expect(tx.transfers.length).to.equal(1);
  });

  it("should handle a trade", async () => {
    const selfAddress = "0x213fe7e177160991829a4d0a598a848d2448f384";
    const txHash = "0x3f55624c4e0c3bfd8c2f60432776432f12efc31b0258a0a3034502d667368f6b";
    addressBook.newAddress(selfAddress, AddressCategories.Self, "test-self");
    const chainData = await getRealChainData(txHash);
    txns.mergeChainData(chainData);
    expect(txns.json.length).to.equal(1);
    const tx = txns.json[0];
    expect(tx.transfers.length).to.equal(1);
  });

  it("should handle a withdraw", async () => {
    const selfAddress = "0x213fe7e177160991829a4d0a598a848d2448f384";
    const txHash = "0xec9b74458504b5058290983ef09093c58187bfcf888374187a9469cad793425f";
    addressBook.newAddress(selfAddress, AddressCategories.Self, "test-self");
    const chainData = await getRealChainData(txHash);
    txns.mergeChainData(chainData);
    expect(txns.json.length).to.equal(1);
    const tx = txns.json[0];
    expect(tx.transfers.length).to.equal(1);
  });

});

