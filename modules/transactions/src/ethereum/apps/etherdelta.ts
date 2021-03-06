import { Interface } from "@ethersproject/abi";
import { AddressZero } from "@ethersproject/constants";
import { formatUnits } from "@ethersproject/units";
import {
  Address,
  AddressBook,
  AddressCategories,
  Assets,
  Asset,
  EthTransaction,
  Logger,
  Transaction,
  TransactionSources,
  TransactionSource,
  TransferCategories,
} from "@valuemachine/types";
import {
  parseEvent,
  rmDups,
  setAddressCategory,
} from "@valuemachine/utils";

const source = TransactionSources.EtherDelta;
const { Income, Expense, Deposit, Withdraw, SwapIn, SwapOut } = TransferCategories;

////////////////////////////////////////
/// Addresses

// Simple, standalone tokens only. App-specific tokens can be found in that app's parser.
export const etherdeltaAddresses = [
  { name: source, address: "0x8d12a197cb00d4747a1fe03395095ce2a5cc6819" },
].map(setAddressCategory(AddressCategories.Defi));

const etherdeltaAddress = etherdeltaAddresses.find(e => e.name === source).address;

////////////////////////////////////////
/// ABIs

const etherdeltaInterface = new Interface([
  "event Order(address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, uint256 expires, uint256 nonce, address user)",
  "event Cancel(address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, uint256 expires, uint256 nonce, address user, uint8 v, bytes32 r, bytes32 s)",
  "event Trade(address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, address get, address give)",
  "event Deposit(address token, address user, uint256 amount, uint256 balance)",
  "event Withdraw(address token, address user, uint256 amount, uint256 balance)"
]);

////////////////////////////////////////
/// Parser

export const etherdeltaParser = (
  tx: Transaction,
  ethTx: EthTransaction,
  addressBook: AddressBook,
  logger: Logger,
): Transaction => {
  const log = logger.child({ module: `${source}${ethTx.hash.substring(0, 6)}` });
  const { getDecimals, getName, isSelf } = addressBook;

  const getAsset = (address: Address): Asset => {
    if (address === AddressZero) return Assets.ETH;
    else return getName(address) as Asset;
  };

  for (const txLog of ethTx.logs) {
    const address = txLog.address;
    if (address === etherdeltaAddress) {
      const index = txLog.index || 1;
      const event = parseEvent(etherdeltaInterface, txLog);
      if (!event.name) continue;
      // Skip transfers that don't concern self accounts
      const user = [event.args.user, event.args.get, event.args.give].reduce(
        (acc, cur) => acc || (isSelf(cur) ? cur : undefined),
        undefined,
      );
      if (!user) {
        log.debug(`Skipping ${source} ${event.name} that doesn't involve us`);
        continue;
      }
      tx.sources = rmDups([source, ...tx.sources]);
      const account = `${source}-${user.toLowerCase().substring(0, 8)}`;
      const exchange = `${source}-exchange`;

      if (event.name === "Deposit" || event.name === "Withdraw") {
        log.info(`Parsing ${source} ${event.name}`);
        const asset = getAsset(event.args.token);
        const quantity = formatUnits(event.args.amount, getDecimals(event.args.token));
        const transfer = tx.transfers.find(transfer =>
          ([Income, Expense, Deposit, Withdraw] as string[]).includes(transfer.category)
          && transfer.asset === asset
          && transfer.quantity === quantity
        );
        if (transfer) {
          if (event.name === "Deposit") {
            transfer.category = Deposit;
            transfer.to = account;
            tx.method = event.name;
          } else {
            transfer.category = Withdraw;
            transfer.from = account;
            tx.method = event.name;
          }
        } else {
          log.warn(`Unable to find a ${source} transfer of ${quantity} ${asset}`);
        }

      } else if (event.name === "Trade") {
        log.info(`Parsing ${source} ${event.name}`);
        const swapOut = {
          asset: getAsset(event.args.tokenGet),
          category: SwapOut,
          from: account,
          index,
          quantity: formatUnits(event.args.amountGet, getDecimals(event.args.tokenGet)),
          to: exchange,
        };
        const swapIn = {
          asset: getAsset(event.args.tokenGive),
          category: SwapIn,
          from:  exchange,
          index,
          quantity: formatUnits(event.args.amountGive, getDecimals(event.args.tokenGiv)),
          to: account,
        };
        tx.transfers.push(swapOut);
        tx.transfers.push(swapIn);
        tx.method = "Trade";

      } else {
        log.warn(event, `Skipping ${source} ${event.name} event bc idk how to handle it`);
      }

    }
  }

  // log.debug(tx, `Done parsing ${source}`);
  return tx;
};

