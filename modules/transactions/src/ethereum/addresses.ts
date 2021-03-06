import { AddressZero } from "@ethersproject/constants";
import { AddressCategories } from "@valuemachine/types";
import { setAddressCategory } from "@valuemachine/utils";

import { appAddresses } from "./apps";

const burnAddresses = [
  { name: "dead", address: "0x000000000000000000000000000000000000dead" },
  { name: "deadbeef", address: "0x00000000000000000000000000000000deadbeef" },
  { name: "void", address: AddressZero },
].map(setAddressCategory(AddressCategories.Burn));

const defiAddresses = [
  { name: "artifaqt", address: "0x34d565bddcff2dd74bc98e056ebd32dd5f5e1d34" },
  { name: "augur", address: "0x24e2b1d415e6e0d04042eaa45dc2a08fc33ca6cd" },
  { name: "augur", address: "0xd5524179cb7ae012f5b642c1d6d700bbaa76b96b" },
  { name: "base-registrar", address: "0xfac7bea255a6990f749363002136af6556b31e04" },
  { name: "bounties-network", address: "0x2af47a65da8cd66729b4209c22017d6a5c2d2400" },
  { name: "bounties-network", address: "0xe7f69ea2a79521136ee0bf3c50f6b5f1ea0ab0cd" },
  { name: "connext-channel-manager", address: "0xdfa6edae2ec0cf1d4a60542422724a48195a5071" },
  { name: "connext-daicard", address: "0x925488c7cd7e5eb3441885c6c1dfdbea875e08f7" },
  { name: "contribution-reward", address: "0x08cc7bba91b849156e9c44ded51896b38400f55b" },
  { name: "contribution-reward", address: "0x6646d0a32d6b9c1d1a7389a6b8da7e5fd780f316" },
  { name: "contribution-reward", address: "0xc282f494a0619592a2410166dcc749155804f548" },
  { name: "cryptokitty-auction", address: "0xb1690c08e213a35ed9bab7b318de14420fb57d8c" },
  { name: "cryptokitty-clockauction", address: "0xc7af99fe5513eb6710e6d5f44f9989da40f27f26" },
  { name: "cryptokitty-core", address: "0x06012c8cf97bead5deae237070f9587f8e7a266d" },
  { name: "daostack", address: "0x99bc239c208c7cf6c123c5fc1666383d17eace19" },
  { name: "dhack-eth-india", address: "0x0ed985925bb42c6719d10dcd1cc02d8cf596c15b" },
  { name: "dharma-lever", address: "0x9bd1428009681e1e3c8f58b50b724739807aa6c5" },
  { name: "ENS", address: "0x314159265dd8dbb310642f98f50c066173c1259b" },
  { name: "ens-controller", address: "0x283af0b28c62c092c9727f1ee09c02ca627eb7f5" },
  { name: "ENS-registrar", address: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85" },
  { name: "ENS-registrar", address: "0xb22c1c159d12461ea124b0deb4b5b93020e6ad16" },
  { name: "ENS-registrar-old", address: "0x6090a6e47849629b7245dfa1ca21d94cd15878ef" },
  { name: "escrowed-erc20-bouncer", address: "0x2e225cf684a48f1de8eba5c56f1715c6f6c6b518" },
  { name: "eternal-storage-proxy", address: "0x4aa42145aa6ebf72e164c9bbc74fbd3788045016" },
  { name: "eth2-deposit", address: "0x00000000219ab540356cbb839cbe05303d7705fa" },
  { name: "genesis-alpha", address: "0x294f999356ed03347c7a23bcbcf8d33fa41dc830" },
  { name: "genesis-alpha", address: "0xa3f5411cfc9eee0dd108bf0d07433b6dd99037f1" },
  { name: "genesis-protocol", address: "0x332b8c9734b4097de50f302f7d9f273ffdb45b84" },
  { name: "genesis-protocol", address: "0x374026a48d777cb0ffdccdb9a919c0aa7ce8a0fc" },
  { name: "genesis-protocol", address: "0x8940442e7f54e875c8c1c80213a4aee7eee4781c" },
  { name: "kickback", address: "0x80bf9ba97bc7a54fe70ef42d9c941b0574319d1d" },
  { name: "publicresolver", address: "0xd3ddccdd3b25a8a7423b5bee360a42146eb4baf3" },
  { name: "redeemer", address: "0x236e077f979f4ccb5f9a9e0163728fe2e743a56d" },
  { name: "redeemer", address: "0x67b13f159ca093325554aac6ee104fce36f3f9dd" },
  { name: "redeemer", address: "0x7f24e3bdc640dd1db413b9e1d68977653aeeda7e" },
  { name: "rep-from-token", address: "0x5c285b08b3c74c2b49d412e5be2230e286624e34" },
  { name: "rep-from-token", address: "0xfd908c16f6d1c731bfca05de3262e775d63d58d2" },
  { name: "reverseRegister", address: "0x9062c0a6dbd6108336bcbe4593a3d1ce05512069" },
  { name: "snt-giveaway", address: "0x3f167627de4d2108d2f30407af5890f5154313a7" },
  { name: "spankbank", address: "0x1ecb60873e495ddfa2a13a8f4140e490dd574e6f" },
  { name: "spankchain", address: "0xb5e658dccc93ca08c88e8bb89dfb4cae854e2d57" },
  { name: "status-username-registrar", address: "0xdb5ac1a559b02e12f29fc0ec0e37be8e046def49" },
  { name: "thecyber", address: "0x0734d56da60852a03e2aafae8a36ffd8c12b32f1" },
  { name: "urbit-azimuth", address: "0x6ac07b7c4601b5ce11de8dfe6335b871c7c4dd4d" },
  { name: "zk-money", address: "0x737901bea3eeb88459df9ef1be8ff3ae1b42a2ba" },
].map(setAddressCategory(AddressCategories.Defi));

const donationAddresses = [
  { name: "gitcoin", address: "0x00de4b13153673bcae2616b67bf822500d325fc3" },
  { name: "gitcoin", address: "0xdf869fad6db91f437b59f1edefab319493d4c4ce" },
  { name: "gitcoin-grant", address: "0x3e947a271a37ae7b59921c57be0a3246ee0d887c" },
  { name: "gitcoin-grant", address: "0x8ba1f109551bd432803012645ac136ddd64dba72" },
  { name: "gitcoin-grant", address: "0xa153b8891e77f1ae037026514c927530d877fab8" },
  { name: "gitcoin-grant", address: "0xcbec15583a21c3ddad5fab658be5b4fe85df730b" },
].map(setAddressCategory(AddressCategories.Donation));

const exchangeAddresses = [
  { name: "idex", address: "0x2a0c0dbecc7e4d658f48e01e3fa353f44050c208" },
  { name: "kyber-old", address: "0x9ae49c0d7f8f9ef4b864e004fe86ac8294e20950" },
  { name: "kyber-proxy", address: "0x818e6fecd516ecc3849daf6845e3ec868087b755" },
  { name: "opensea", address: "0x7be8076f4ea4a4ad08075c2508e481d6c946d12b" },
  { name: "0x-v1", address: "0x12459c951127e0c374ff9105dda097662a027093" },
  { name: "0x-v2", address: "0x4f833a24e1f95d70f028921e27040ca56e09ab0b" },
  { name: "airswap", address: "0x8fd3121013a07c57f0d69646e86e7a4880b467b7" },
].map(setAddressCategory(AddressCategories.Exchange));

export const publicAddresses = [
  ...appAddresses,
  ...burnAddresses,
  ...defiAddresses,
  ...donationAddresses,
  ...exchangeAddresses,
];
