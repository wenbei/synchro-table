import Papa from "papaparse";

type row = string[];
type rowGroup = row[];
export interface intersectionData {
  name: string;
  type: string;
  control: string;
  delay: string[];
  movements: string[];
  vc: string[];
  [key: string]: any;
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
  let headings = [
    "Lanes, Volumes, Timings",
    "Queues",
    "HCM Signalized Intersection Capacity Analysis",
    "HCM Unsignalized Intersection Capacity Analysis",
  ];
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
    let rowData: Partial<intersectionData> = {
      delay: ["Error", "0"],
      vc: [],
    };
    let name = intersection[1][1];
    rowData.name = name;

    intersection.forEach((line) => {
      let [label, data] = parseRow(line);
      if (label) rowData[label as string] = data;
    });
    rowData.movements = parseLaneConfig(rowData);

    // skip synchro unsignalized
    if (rowData.type == "synchro" && rowData.control == "Unsignalized") return;

    // skip queues
    if (rowData.type == "synchro-queues") return;

    // identify unsignalized delay and v/c
    if (rowData.type == "hcm-unsignalized") {
      if (rowData.los) {
        // all-way stop
        rowData.control = "All-way Stop";
        rowData.delay = [rowData.los, rowData.delay];
      } else {
        // side street stop
        rowData.control = "Side-street Stop";
        let delays: number[] = rowData.movementDelay.map((d: string) => parseFloat(d));
        let i = delays.indexOf(Math.max(...delays));
        rowData.delay = [rowData.movementLOS[i], rowData.movementDelay[i]];
        rowData.vc = [rowData.movementVC[i]];
        rowData.movements = [rowData.movements[i]];
      }
    }

    table[name] = rowData as intersectionData;
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
    case "Control Type": // synchro
      return ["control", line[1]];
    case "Direction, Lane #": // HCM2000 unsignalized
      return ["lanes", line.slice(2)];
    case "Sign Control": // HCM2000 unsignalized
      return ["sign", line.slice(2)];

    case "Intersection Signal Delay": // synchro
      return ["delay", [line[7], line[1]]];
    case "HCM 2000 Control Delay": // HCM2000 signalized
      return ["delay", [line[10], line[4]]];
    case "v/c Ratio": // synchro and HCM2000 signalized
      return ["vc", line.slice(2)];

    case "Level of Service": // HCM2000 unsignalized, all-way stop
      return ["los", line[4]];
    case "Delay": // HCM2000 unsignalized, all-way stop
      return ["delay", line[4]];
    case "Control Delay (s)": // HCM2000 unsignalized, per movement
      return ["movementDelay", line.slice(2)];
    case "Lane LOS": // HCM2000 unsignalized, per movement
      return ["movementLOS", line.slice(2)];
    case "Volume to Capacity": // HCM2000 unsignalized, per movement
      return ["movementVC", line.slice(2)];
  }
  return [];
}

export function parseLaneConfig(rowData: Partial<intersectionData>) {
  let movements: string[] = [];

  let group: string[] = rowData.laneGroup;
  let config: string[] = rowData.laneConfig;
  group.forEach((lane, index: number) => {
    if (config[index] == "0" || config[index] == "") {
      if (rowData.type != "hcm-unsignalized") movements.push("");
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

    let number = 1;
    if (rowData.type == "hcm-unsignalized") number = parseInt(config[index].replace(/\W/g, ""));
    while (number > 0) {
      movements.push(movement);
      number -= 1;
    }
  });

  return movements;
}
