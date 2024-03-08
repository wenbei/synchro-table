import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, test } from "vitest";

import { groupByIntersection, parseCSV, parseResults } from "src/parse";

const file = resolve(__dirname, "sample-output/HCM2000_Unsignalized.txt");
const input = readFileSync(file, "utf-8").replaceAll(":", "	");

test("read file into intersections", () => {
  let data = parseCSV(input);
  expect(data).toHaveLength(119);

  let groups = groupByIntersection(data);
  expect(groups).toHaveLength(3);
});

describe("parse HCM2000 unsignalized results", () => {
  let data = parseCSV(input);
  let groups = groupByIntersection(data);
  let results = parseResults(groups);

  test("names", () => {
    expect(Object.keys(results)).toEqual(["Side4 & Main", "Side5 & Main", "Side6 & Main"]);
  });

  test("type", () => {
    let type = [];
    let control = [];
    for (const intersection of Object.values(results)) {
      type.push(intersection.type);
      control.push(intersection.control);
    }
    expect(type).toEqual(["hcm-unsignalized", "hcm-unsignalized", "hcm-unsignalized"]);
    expect(control).toEqual(["Side-street Stop", "All-way Stop", "Side-street Stop"]);
  });

  test("lane configuration", () => {
    let config = [];
    for (const intersection of Object.values(results)) {
      config.push(intersection.movements);
    }
    expect(config).toMatchInlineSnapshot(`
      [
        [
          "SB 1",
        ],
        [
          "EB 1",
          "WB 1",
          "NB 1",
          "SB 1",
        ],
        [
          "NB 1",
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
      ["F", "225.3"],
      ["C", "20.9"],
      ["B", "11.5"],
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
          "1.32",
        ],
        [],
        [
          "0.30",
        ],
      ]
    `);
  });
});
