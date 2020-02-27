import fs from "fs";
import axios from "axios";
// import { formatEther } from "ethers/utils";

import { DateString, InputData, PriceData, TimestampString } from "./types";
import { Logger } from "./utils";

const emptyPriceData: PriceData = {
  ids: {},
};

const cacheFile = "./price-data.json";

const loadCache = (log: Logger): PriceData => {
  try {
    return JSON.parse(fs.readFileSync(cacheFile, "utf8"));
  } catch (e) {
    if (e.message.startsWith("ENOENT: no such file or directory")) {
      return emptyPriceData;
    }
    log.warn(e.message);
    throw new Error(`Unable to load priceData cache, try deleting ${cacheFile} & try again`);
  }
};

const saveCache = (priceData: PriceData): void =>
  fs.writeFileSync(cacheFile, JSON.stringify(priceData, null, 2));

export const getPrice = async (
  input: InputData,
  asset: string,
  timestamp: TimestampString,
): Promise<string> => {
  const log = new Logger("FetchPriceData", input.logLevel);
  const prices = loadCache(log) as PriceData;
  const date = (timestamp.includes("T") ? timestamp.split("T")[0] : timestamp) as DateString;
  const coingeckoUrl = "https://api.coingecko.com/api/v3";

  if (!prices[date]) {
    prices[date] = {};
  }

  if (!prices[date][asset]) {

    // get coin id
    if (!prices.ids[asset]) {
      const coins = (await axios(`${coingeckoUrl}/coins/list`)).data;
      const id = coins.find(coin => coin.symbol.toLowerCase() === asset.toLowerCase()).id;
      if (!id) {
        throw new Error(`Asset ${asset} is not supported by coingecko`);
      }
      prices.ids[asset] = id;
      saveCache(prices);
    }
    const coinId = prices.ids[asset];

    // get coin price
    // https://api.coingecko.com/api/v3/coins/bitcoin/history?date=30-12-2017

    // DD-MM-YYYY
    const coingeckoDate = `${date.split("-")[2]}-${date.split("-")[1]}-${date.split("-")[0]}`;
    const response = (await axios(
      `${coingeckoUrl}/coins/${coinId}/history?date=${coingeckoDate}`,
    )).data;
    prices[date][asset] = response.market_data.current_price.usd;
    saveCache(prices);
  }

  return prices[date][asset];
};
