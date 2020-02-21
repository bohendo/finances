/* global process */
import { Asset, Event } from "../types";

// inputs are ISO 8601 format date strings
const datesAreClose = (d1: string, d2: string): boolean =>
  Math.abs((new Date(d1)).getTime() - (new Date(d2)).getTime()) <= 1000 * 60 * 30;

const sameEvent = (e1: Event, e2: Event): boolean =>
  e1.source !== e2.source &&
  datesAreClose(e1.date, e2.date) && (
    commonAssets(e1.assetsIn, e2.assetsIn).length > 0 ||
    commonAssets(e1.assetsOut, e2.assetsOut).length > 0
  );

const mergeEvents = (e1: Event, e2: Event): Event => {
  const merged = {} as Event;
  const prefer = (source: string, yea: boolean, key: string, e1: Event, e2: Event) =>
    (e1.source === source) === yea ? (e1[key] || e2[key]) :
    (e2.source === source) === yea ? (e2[key] || e1[key]) :
    (e1[key] || e2[key]);
  merged.assetsIn = coalesceAssets(e1.assetsIn, e2.assetsIn);
  merged.assetsOut = coalesceAssets(e1.assetsOut, e2.assetsOut);
  merged.category = prefer("ethereum", false, "category", e1, e2);
  merged.date = prefer("ethereum", true, "date", e1, e2);
  merged.description = prefer("ethereum", true, "description", e1, e2);
  merged.from = prefer("ethereum", false, "from", e1, e2);
  merged.hash = prefer("ethereum", true, "hash", e1, e2);
  merged.source = [...e1.source.split("+"), ...e2.source.split("+")].sort().join("+");
  merged.to = prefer("ethereum", false, "to", e1, e2);
  return merged;
};

const sameAsset = (a1: Asset, a2: Asset): boolean =>
  a1.type == a2.type && a1.amount === a2.amount;

const coalesceAssets = (loa1: Asset[], loa2: Asset[]): Asset[] => {
  const loa = JSON.parse(JSON.stringify(loa1)) as Asset[];
  for (let a2 of loa2) {
    if (loa.find(a => sameAsset(a, a2))) {
      continue;
    } else {
      loa.push(a2);
    }
  }
  return loa;
};

const commonAssets = (loa1: Asset[], loa2: Asset[]): Asset[] => {
  const common: Asset[] = [];
  for (let i = 0; i < loa1.length; i++) {
    for (let j = 0; j < loa2.length; j++) {
      if (sameAsset(loa1[i], loa2[j])) {
        common.push(JSON.parse(JSON.stringify(loa1[i])));
      }
    }
  }
  return common;
};

export const coalesce = (oldEvents: Event[], newEvents: Event[]): Event[] => {
  const consolidated = [] as number[];
  const events = [] as Event[];
  for (let oldI = 0; oldI < oldEvents.length; oldI++) {
    let mergedE = oldEvents[oldI];
    for (let newI = 0; newI < newEvents.length; newI++) {
      const newE = newEvents[newI];
      if (consolidated.includes(newI)) { continue; }
      if (mergedE.hash && newE.hash && mergedE.hash !== newE.hash) { continue; }
      if (sameEvent(mergedE, newE)) {
        console.log(`Merging event "${mergedE.description}" with "${newE.description}"`);
        mergedE = mergeEvents(mergedE, newE);
        consolidated.push(newI);
      }
    }
    events.push(mergedE);
  }
  for (let newI = 0; newI < newEvents.length; newI++) {
    if (!consolidated.includes(newI)) {
      events.push(newEvents[newI]);
    }
  }
  return events;
};