import csv from 'csv-parse/lib/sync';
import fs from 'fs';

import { Event, InputData, SwapEvent } from "./types";
import { diff, add, sub, round, mul, eq, gt, lt } from './utils';

const shouldWarn = false

const getTimestamp = (date: Date): string => {
  if (isNaN(date.getFullYear())) {
    return '';
  }
  const year = date.getFullYear().toString().substring(2,4);
  const month = date.getMonth().toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}${month}${day}`;
}

const parseCoinbase = (filename: string, personal: InputData): SwapEvent[] => {
  const rawFile = fs.readFileSync(filename, 'utf8').split('\r\n');
  return csv(
    rawFile.slice(3, rawFile.length).join('\r\n'),
    { columns: true, skip_empty_lines: true },
  ).map(row => {
    const usd = {
      amount: row["USD Amount Transacted (Inclusive of Coinbase Fees)"],
      type: "USD",
    };
    const asset = {
      price: row["USD Spot Price at Transaction"],
      amount: row["Quantity Transacted"],
      type: row["Asset"],
    };
    const isBuy = row["Transaction Type"] === "Buy";
    return ({
      date: getTimestamp(new Date(row["Timestamp"])),
      category: "swap",
      tags: ["coinbase"],
      description: "",
      assetsIn: [isBuy ? asset : usd],
      assetsOut: [isBuy ? usd : asset],
      prices: { [asset.type]: row["USD Spot Price at Transaction"] },
    });
  });
}

const parseWyre = (filename: string, personal: InputData): SwapEvent[] => {
  return csv(
    fs.readFileSync(filename, 'utf8'),
    { columns: true, skip_empty_lines: true },
  ).map(row => {
    // Ignore any rows with an invalid timestamp
    if (!getTimestamp(new Date(row["Created At"]))) return null;
    // Ignore any transfers into Wyre account
    if (row["Source Currency"] === row["Dest Currency"]) return null;
    return ({
      date: getTimestamp(new Date(row["Created At"])),
      category: "swap",
      tags: ["sendwyre"],
      description: "",
      assetsIn: [{ type: row["Dest Currency"], amount: row["Dest Amount"] }],
      assetsOut: [{ type: row["Source Currency"], amount: row["Source Amount"] }],
      prices: { type: row["Dest Currency"], amount: row["Exchange Rate"] },
    });
  }).filter(row => !!row);
}

const parseEtherscan = (filename: string, personal: InputData): Event[] => {
  const hasWarned = [];
  const rawFile = fs.readFileSync(filename, 'utf8').split('\r\n');
  // Etherscan csv exports have 15 columns labeled but data rows have 16 columns..?
  rawFile[0] = `${rawFile[0]},"?"`;
  return csv(
    rawFile.join('\r\n'),
    { columns: true, skip_empty_lines: true },
  ).map(row => {
    // console.log(`Parsing row:`, row);
    const quantity = add([row["Value_IN(ETH)"], row["Value_OUT(ETH)"]]);
    if (quantity === "0") return null; // TODO: ERC20 txns?!
    let from;
    if (Object.keys(personal.addresses).includes(row["From"].toLowerCase())) {
      from = personal.addresses[row["From"]]
    } else {
      from = row["From"]
      if (shouldWarn && !hasWarned.includes(row["From"])) {
        console.log(`Warning, unknown address: ${row["From"]} (from tx ${row["Txhash"]})`);
        hasWarned.push(row["From"]);
      }
    }
    let to;
    if (Object.keys(personal.addresses).includes(row["To"].toLowerCase())) {
      to = personal.addresses[row["To"]]
    } else {
      to = row["To"]
      if (shouldWarn && !hasWarned.includes(row["To"])) {
        console.log(`Warning, unknown address: ${row["To"]} (from tx ${row["Txhash"]})`);
        hasWarned.push(row["To"]);
      }
    }
    // Skip self-to-self transactions
    if (from.substring(0, 4) === to.substring(0, 4) && from.substring(0, 4) === "self") {
      return null;
    }
    // Skip transactions to/from exchanges, these will be dealt w in the exchange-specific file
    if (from.includes('coinbase') || to.includes('coinbase')) {
      return null;
    }
    const value = mul(quantity, row["Historical $Price/Eth"]);
    const eth = amount => ({ type: "ETH", amount });
    return ({
      date: getTimestamp(new Date(parseInt(`${row["UnixTimestamp"]}000`))),
      category: "idk",
      tags: ["etherscan"],
      description: "",
      assetsIn: [row["Value_OUT(ETH)"] === "0" ? eth(value) : eth("0")],
      assetsOut: row["Value_IN(ETH)"] === "0" ? eth(value) : eth("0"),
      from,
      to,
      prices: { "ETH": row["Historical $Price/Eth"] },
      hash: row["Txhash"]
    });
  }).filter(row => !!row);
}

export const parseHistory = (personalData: InputData): Event[] => {
  const allHistory = [];
  for (const historyFilename of personalData.txHistory || []) {
    if (historyFilename.includes('coinbase')) {
      allHistory.push(...parseCoinbase(historyFilename, personalData))
    } else if (historyFilename.includes('wyre')) {
      allHistory.push(...parseWyre(historyFilename, personalData))
    } else if (historyFilename.includes('etherscan')) {
      // console.log('Parsed etherscan:', parseEtherscan(historyFilename));
      allHistory.push(...parseEtherscan(historyFilename, personalData))
    } else {
      console.log(`No parser available for this history format, skipping: ${historyFilename}`);
    }
  }
  return allHistory.filter(row => row.timestamp.startsWith('19'));
}