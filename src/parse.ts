import Papa from "papaparse";

type row = string[];
type rowGroup = row[];
export interface intersectionData {
  name: string;
  type: string;
  delay: string[];
  movements: string[];
  vc: string[];
}
export type results = {
  [key: string]: intersectionData;
};

export function parseCSV(rawData: string) {
  let result = Papa.parse(rawData, {
    skipEmptyLines: true,
    transform: (str) => str.trim(),
  });

  return result.data as row[];
}

export function groupByIntersection(data: row[]) {
  let headings = ["Lanes, Volumes, Timings", "Queues", "HCM Signalized Intersection Capacity Analysis", "HCM Unsignalized Intersection Capacity Analysis"];
  let groups: rowGroup[] = [];
  let intersection: row[] = [];
  data.forEach((line: row) => {
    if (headings.includes(line[0])) {
      groups.push(intersection);
      intersection = [];
    }
    intersection.push(line);
  });
  groups.push(intersection);
  groups.shift();

  return groups;
}

export function parseResults(results: rowGroup[]) {
  let table: results = {};

  results.forEach((intersection) => {
    let rowData: any = {
      delay: ["Error", "0"],
      vc: [],
    } satisfies Partial<intersectionData>;
    let name = intersection[1][1];
    rowData.name = name;

    intersection.forEach((line) => {
      let [label, data] = parseRow(line);
      if (label) rowData[label as string] = data;
    });

    // skip synchro unsignalized
    if (rowData.type == "synchro" && rowData.signal == "Unsignalized") return;

    // skip queues
    if (rowData.type == "synchro-queues") return;

    // identify side street delay
    if (rowData.type == "hcm-unsignalized") {
      let control = rowData.sign;
      let delay = rowData.movementDelay;
    }

    rowData.movements = parseLaneConfig(rowData.laneGroup, rowData.laneConfig);
    table[name] = rowData;
  });

  return table;
}

export function parseRow(line: row) {
  switch (line[0]) {
    case "Lanes, Volumes, Timings":
      return ["type", "synchro"];
    case "Queues":
      return ["type", "synchro-queues"];
    case "HCM Signalized Intersection Capacity Analysis":
      return ["type", "hcm-signalized"];
    case "HCM Unsignalized Intersection Capacity Analysis":
      return ["type", "hcm-unsignalized"];

    case "Lane Group": // synchro
    case "Movement": // HCM2000 signalized
      return ["laneGroup", line.slice(2)];
    case "Lane Configurations": // synchro
    case "Lanes": // HCM2000 unsignalized
      return ["laneConfig", line.slice(2)];
    case "Control Type": // HCM2000 signalized
      return ["signal", line[1]];
    case "Sign Control": // HCM2000 unsignalized
      return ["sign", line.slice(2)];

    case "Intersection Signal Delay": // synchro
      return ["delay", [line[7], line[1]]];
    case "HCM 2000 Control Delay": // HCM2000 signalized
      return ["delay", [line[10], line[4]]];
    case "Control Delay (s)": // HCM2000 unsignalized, per movement
      return ["movementDelay", line.slice(2)];
    // TODO: need LOS
    // case "Average Delay": // HCM2000 unsignalized, intersection average
    //   return ["delay", line[4]];
    case "v/c Ratio":
      return ["vc", line.slice(2)];
  }
  return [];
}

export function parseLaneConfig(group: string[], config: string[]) {
  let movements: string[] = [];
  group.forEach((lane, index) => {
    if (config[index] == "0" || config[index] == "") {
      movements.push("n/a");
      return;
    }

    let movement = lane.substring(0, 2).concat("-");
    if (config[index].includes("<")) {
      movement = movement.concat("L");
    }
    movement = movement.concat(lane.at(2) as string);
    if (config[index].includes(">")) {
      movement = movement.concat("R");
    }
    movements.push(movement);
  });

  return movements;
}
