import { Contract } from "@ethersproject/contracts";
import { formatUnits } from "@ethersproject/units";
import {
  AddressBook,
  AddressBookJson,
  AddressCategories,
  AssetTypes,
  ChainData,
  EthTransaction,
  Logger,
  Transaction,
  TransactionSources,
  TransferCategories,
} from "@finances/types";
import { sm, smeq } from "@finances/utils";

import { getUnique } from "../utils";

const source = TransactionSources.Weth;

////////////////////////////////////////
/// Addresses

export const wethAddresses = [
  { name: "WETH", address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" },
].map(row => ({ ...row, category: AddressCategories.ERC20 })) as AddressBookJson;

////////////////////////////////////////
/// Interfaces

const weth = new Contract(wethAddresses[0].address, [
  "event Approval(address indexed s/rc, address indexed guy, uint256 wad)",
  "event Deposit(address indexed dst, uint256 wad)",
  "event Transfer(address indexed src, address indexed dst, uint256 wad)",
  "event Withdrawal(address indexed src, uint256 wad)",
]);

////////////////////////////////////////
/// Parser

export const wethParser = (
  tx: Transaction,
  ethTx: EthTransaction,
  addressBook: AddressBook,
  chainData: ChainData,
  logger: Logger,
): Transaction => {
  const log = logger.child({ module: source });
  const { getName } = addressBook;

  for (const txLog of ethTx.logs) {
    const address = sm(txLog.address);
    if (smeq(address, weth.address)) {
      const assetType = AssetTypes.WETH;
      const event = Object.values(weth.interface.events).find(e =>
        weth.interface.getEventTopic(e) === txLog.topics[0]
      );
      if (!event) continue;
      log.info(`Found ${source} ${event.name} event`);
      const args = weth.interface.parseLog(txLog).args;
      const amount = formatUnits(args.wad, chainData.getTokenData(address).decimals);
      const index = txLog.index || 1;

      if (event.name === "Deposit") {
        if (smeq(ethTx.to, weth.address)) {
          tx.description = `${getName(args.dst)} swapped ${amount} ETH for WETH`;
        }
        tx.sources = getUnique([source, ...tx.sources]) as TransactionSources[];
        tx.transfers.push({
          assetType,
          category: TransferCategories.SwapIn,
          from: address,
          index,
          quantity: amount,
          to: args.dst,
        });
        tx.transfers[0].category = TransferCategories.SwapOut;

      } else if (event.name === "Withdrawal") {
        tx.sources = getUnique([source, ...tx.sources]) as TransactionSources[];
        tx.transfers.push({
          assetType,
          category: TransferCategories.SwapOut,
          from: args.src,
          index,
          quantity: amount,
          to: address,
        });
        const swapIn = tx.transfers.findIndex(t =>
          t.assetType === AssetTypes.ETH && t.quantity === amount
        );
        if (swapIn >= 0) {
          tx.transfers[swapIn].category = TransferCategories.SwapIn;
          tx.transfers[swapIn].index = index;
          if (smeq(ethTx.to, weth.address)) {
            tx.description = `${getName(args.src)} swapped ${amount} WETH for ETH`;
          }
        } else {
          log.warn(ethTx, `Couldn't find an associated SwapIn eth call`);
        }

      } else if (event.name === "Transfer" || event.name === "Approval") {
        log.debug(`Skipping ${source} event: ${event.name}`);

      } else {
        log.warn(`Unknown ${source} event: ${event.name}`);
      }

    }
  }

  // log.debug(tx, `Done parsing ${source}`);
  return tx;
};
