import * as f1040 from "./f1040.json";
import * as f1040s1 from "./f1040s1.json";
import * as f1040s2 from "./f1040s2.json";
import * as f1040s3 from "./f1040s3.json";
import * as f1040sc from "./f1040sc.json";
import * as f1040sse from "./f1040sse.json";
import * as f1040sd from "./f1040sd.json";
import * as f8949 from "./f8949.json";

export type Field = any; // string | boolean;

type maybeArray<T> = T | Array<T>;

export type Forms = {
  f1040?: maybeArray<{ [key in keyof typeof mappings.f1040]?: Field; }>;
  f1040s1?: maybeArray<{ [key in keyof typeof mappings.f1040s1]?: Field; }>;
  f1040s2?: maybeArray<{ [key in keyof typeof mappings.f1040s2]?: Field; }>;
  f1040s3?: maybeArray<{ [key in keyof typeof mappings.f1040s3]?: Field; }>;
  f1040sse?: maybeArray<{ [key in keyof typeof mappings.f1040sse]?: Field; }>;
  f1040sc?: maybeArray<{ [key in keyof typeof mappings.f1040sc]?: Field; }>;
  f1040sd?: maybeArray<{ [key in keyof typeof mappings.f1040sd]?: Field; }>;
  f8949?: maybeArray<{ [key in keyof typeof mappings.f8949]?: Field; }>;
}

export const mappings = {
  f1040,
  f1040s1,
  f1040s2,
  f1040s3,
  f1040sc,
  f1040sse,
  f1040sd,
  f8949,
}
