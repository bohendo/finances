import { isAddress as isEthAddress } from "@ethersproject/address";
import {
  Account,
  Address,
  AddressBook,
  AddressBookParams,
  AddressCategories,
  AddressCategory,
  emptyAddressBook,
  EthereumSources,
  jurisdictions,
  SecurityProvider,
  SecurityProviders,
} from "@valuemachine/types";
import { getLogger, sm, smeq } from "@valuemachine/utils";

import { publicAddresses } from "./ethereum";

export const getAddressBook = (params?: AddressBookParams): AddressBook => {
  const { json: addressBookJson, logger } = params || {};
  const log = (logger || getLogger()).child({ module: "AddressBook" });
  const json = addressBookJson || JSON.parse(JSON.stringify(emptyAddressBook));

  ////////////////////////////////////////
  // Hardcoded Public Addresses

  const addressBook = []
    .concat(publicAddresses, json)
    .filter(entry => !!entry);

  ////////////////////////////////////////
  // Internal Functions

  ////////////////////////////////////////
  // Init Code

  // Sanity check: it shouldn't have two entries for the same address
  let addresses = [];
  addressBook.forEach(row => {
    if (addresses.includes(sm(row.address))) {
      log.warn(`Address book has multiple entries for address ${row.address}`);
    } else if (!isEthAddress(row.address)) {
      throw new Error(`Address book contains invalid address ${row.address}`);
    } else {
      addresses.push(sm(row.address));
    }
  });
  addresses = addresses.sort();

  ////////////////////////////////////////
  // Exports

  const isCategory = (category: AddressCategory) => (address: Address): boolean =>
    address && addressBook
      .filter(row => smeq(row.category, category))
      .map(row => sm(row.address))
      .includes(sm(address));

  const isPresent = (address: Address): boolean => addresses.includes(sm(address));

  const isProxy = isCategory(AddressCategories.Proxy);

  const isSelf = isCategory(AddressCategories.Self);

  const isToken = (address: Address): boolean =>
    isCategory(AddressCategories.ERC20)(address);

  const getName = (address: Address): string =>
    !address
      ? ""
      : !isEthAddress(address)
        ? address
        : addressBook.find(row => smeq(row.address, address))
          ? addressBook.find(row => smeq(row.address, address)).name
          : `${address.substring(0, 6)}..${address.substring(address.length - 4)}`;

  const newAddress = (address: Address, category: AddressCategory, name?: string): void => {
    if (!addresses.includes(sm(address))) {
      addressBook.push({ address, category, name: name || getName(address) });
      addresses.push(address);
      addresses.sort();
    }
  };

  const getGuardian = (account: Account): SecurityProvider => {
    if (!account) return SecurityProviders.None;
    const source = account.split("-")[0];
    return addressBook.find(row => smeq(row.address, account))?.guardian
      || ((isEthAddress(account) || Object.keys(EthereumSources).includes(source))
        ? SecurityProviders.ETH
        : (
          jurisdictions[source]
          || (Object.keys(SecurityProviders).includes(source) ? source : SecurityProviders.None)
        ));
  };

  // Only really useful for ERC20 addresses
  const getDecimals = (address: Address): number =>
    addressBook.find(row => smeq(row.address, address))?.decimals || 18;

  // Set default guardians
  addressBook.forEach(entry => {
    entry.guardian = entry.guardian
      || isEthAddress(entry.address) ? SecurityProviders.ETH : SecurityProviders.None;
  });

  return {
    addresses,
    getName,
    getGuardian,
    getDecimals,
    isCategory,
    isPresent,
    isProxy,
    isSelf,
    isToken,
    json,
    newAddress,
  };
};
