import { hexlify } from "@ethersproject/bytes";
import { keccak256 } from "@ethersproject/keccak256";
import { encode } from "@ethersproject/rlp";
import { Address, EthTransaction, ChainDataJson } from "@valuemachine/types";

import { ajv, formatErrors } from "./validate";

export const getEmptyChainData = (): ChainDataJson => ({
  addresses: {},
  calls: [],
  transactions: [],
});

export const getNewContractAddress = (from: Address, nonce: number): Address => `0x${
  keccak256(encode([from, hexlify(nonce)])).substring(26).toLowerCase()
}`;

const validateChainData = ajv.compile(ChainDataJson);
export const getChainDataError = (chainDataJson: ChainDataJson): string | null =>
  validateChainData(chainDataJson)
    ? null
    : validateChainData.errors.length ? formatErrors(validateChainData.errors)
    : `Invalid ChainData: ${JSON.stringify(chainDataJson)}`;

const validateEthTransaction = ajv.compile(EthTransaction);
export const getEthTransactionError = (ethTx: EthTransaction): string | null =>
  validateEthTransaction(ethTx)
    ? null
    : validateEthTransaction.errors.length ? formatErrors(validateEthTransaction.errors)
    : `Invalid EthTransaction: ${JSON.stringify(ethTx)}`;
