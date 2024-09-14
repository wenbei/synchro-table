import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, test } from "vitest";

import { groupByIntersection, parseCSV, parseResults } from "src/parse";

const file = resolve(__dirname, "sample-output/LanesVolumeTimings.txt");
const input = readFileSync(file, "utf-8").replaceAll(":", "	");

test("read file", () => {
  let data = parseCSV(input);
  expect(data).toHaveLength(358);

  let groups = groupByIntersection(data);
  expect(groups).toHaveLength(6);
});

describe("Synchro signalized results", () => {
  let data = parseCSV(input);
  let groups = groupByIntersection(data);
  let results = parseResults(groups);

  test("names", () => {
    let names = [];
    for (const intersection of results) names.push(intersection.name);
    expect(names).toEqual(["Side1 & Main", "Side2 & Main", "Main & Side3"]);
  });

  test("type", () => {
    let type = [];
    let control = [];
    for (const intersection of results) {
      type.push(intersection.type);
      control.push(intersection.control);
    }
    expect(type).toEqual(["synchro", "synchro", "synchro"]);
    expect(control).toEqual(["Pretimed", "Actuated-Coordinated", "Actuated-Uncoordinated"]);
  });

  test("lane configuration", () => {
    let config = [];
    for (const intersection of results) {
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
          "",
          "EB-LT",
          "",
          "",
          "WB-TR",
          "",
          "",
          "NB-LTR",
          "",
          "",
          "SB-LTR",
          "",
        ],
        [
          "",
          "EB-T",
          "",
          "",
          "WB-TR",
          "",
          "",
          "",
          "",
          "SB-L",
          "",
          "SB-R",
        ],
      ]
    `);
  });

  test("delay", () => {
    let delays = [];
    for (const intersection of results) {
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
    for (const intersection of results) {
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
