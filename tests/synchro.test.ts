import { readFileSync } from "fs";
import { describe, expect, test } from "vitest";

import { groupByIntersection, parseCSV, parseResults } from "src/parse";

const input = readFileSync("tests/sample-output/LanesVolumeTimings.txt", "utf-8").replaceAll(":", "	");

test("read file into intersections", () => {
  let data = parseCSV(input);
  expect(data).toHaveLength(358);

  let groups = groupByIntersection(data);
  expect(groups).toHaveLength(6);
});

describe("parse Synchro results", () => {
  let data = parseCSV(input);
  let groups = groupByIntersection(data);
  let results = parseResults(groups);

  test("names", () => {
    expect(Object.keys(results)).toEqual(["Side1 & Main", "Side2 & Main", "Main & Side3"]);
  });

  test("lane configuration", () => {
    let config = [];
    for (const intersection of Object.values(results)) {
      config.push(intersection.movements);
    }
    expect(config).toMatchInlineSnapshot(`
      [
        [
          "EB-L",
          "EB-T",
          "EB-R",
          "WB-L",
          "WB-T",
          "WB-R",
          "NB-L",
          "NB-T",
          "NB-R",
          "SB-L",
          "SB-T",
          "SB-R",
        ],
        [
          "n/a",
          "EB-LT",
          "n/a",
          "n/a",
          "WB-TR",
          "n/a",
          "n/a",
          "NB-LTR",
          "n/a",
          "n/a",
          "SB-LTR",
          "n/a",
        ],
        [
          "n/a",
          "EB-T",
          "n/a",
          "n/a",
          "WB-TR",
          "n/a",
          "n/a",
          "n/a",
          "n/a",
          "SB-L",
          "n/a",
          "SB-R",
        ],
      ]
    `);
  });

  test("delay", () => {
    let delays = [];
    for (const intersection of Object.values(results)) {
      delays.push(intersection.delay);
    }
    expect(delays).toEqual([
      ["A", "7.7"],
      ["A", "8.9"],
      ["A", "6.4"],
    ]);
  });

  test("v/c", () => {
    let vc = [];
    for (const intersection of Object.values(results)) {
      vc.push(intersection.vc);
    }
    expect(vc).toMatchInlineSnapshot(`
      [
        [
          "0.22",
          "0.15",
          "0.16",
          "0.22",
          "0.15",
          "0.16",
          "0.23",
          "0.16",
          "0.17",
          "0.24",
          "0.16",
          "0.17",
        ],
        [
          "",
          "0.42",
          "",
          "",
          "0.31",
          "",
          "",
          "0.36",
          "",
          "",
          "0.38",
          "",
        ],
        [
          "",
          "0.16",
          "",
          "",
          "0.31",
          "",
          "",
          "",
          "",
          "0.11",
          "",
          "0.12",
        ],
      ]
    `);
  });
});
