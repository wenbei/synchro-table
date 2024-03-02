import { readFileSync } from "fs";
import { describe, expect, test } from "vitest";

import { groupByIntersection, parseCSV, parseResults } from "src/parse";

const input = readFileSync("tests/sample-output/HCM2000_Signalized.txt", "utf-8").replaceAll(":", "	");

test("read file into intersections", () => {
  let data = parseCSV(input);
  expect(data).toHaveLength(139);

  let groups = groupByIntersection(data);
  expect(groups).toHaveLength(3);
});

describe("parse HCM2000 signalized results", () => {
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
      ["A", "9.6"],
      ["B", "10.2"],
      ["A", "9.1"],
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
          "0.07",
          "0.22",
          "0.15",
          "0.07",
          "0.23",
          "0.16",
          "0.07",
          "0.24",
          "0.16",
          "0.08",
        ],
        [
          "",
          "0.48",
          "",
          "",
          "0.24",
          "",
          "",
          "0.37",
          "",
          "",
          "0.38",
          "",
        ],
        [
          "",
          "0.19",
          "",
          "",
          "0.25",
          "",
          "",
          "",
          "",
          "0.12",
          "",
          "0.08",
        ],
      ]
    `);
  });
});
