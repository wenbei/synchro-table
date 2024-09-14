import Papa from "papaparse";

type row = string[];
type rowGroup = row[];
interface Data {
  name: string;
  laneGroup: string[];
  laneConfig: string[];
}
interface Synchro_Data extends Data {
  type: "synchro";
  control: string;
  delay: [string, string];
  vc: string[];
}
interface HCM2000_Signalized_Data extends Data {
  type: "hcm-signalized";
  delay: [string, string];
  vc: string[];
}
interface HCM2000_Unsignalized_Data extends Data {
  type: "hcm-unsignalized";
  lanes: string[];
  sign: string[];
  los: string;
  delay: string;
  movementDelay: string[];
  movementLOS: string[];
  movementVC: string[];
}
type UnknownData = Synchro_Data | HCM2000_Signalized_Data | HCM2000_Unsignalized_Data;

export interface intersectionResult {
  type: string;
  name: string;
  control: string;
  movements: string[];
  delay: [string, string];
  vc: string[];
}
export type results = intersectionResult[];

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

export function parseResults(intersections: rowGroup[]) {
  let results: results = [];

  intersections.forEach((rows) => {
    let data = extractRows(rows);

    let result: intersectionResult;
    switch (data.type) {
      case "synchro":
        result = Synchro(data);
        break;
      case "hcm-signalized":
        result = HCM2000_Signalized(data);
        break;
      case "hcm-unsignalized":
        result = HCM2000_Unsignalized(data);
        break;
    }

    // skip synchro unsignalized
    if (result.type == "synchro" && result.control == "Unsignalized") return;
    // skip synchro queues
    if (result.type == "synchro-queues") return;

    results.push(result);
  });

  return results;
}

function extractRows(group: rowGroup) {
  let data: any = {};
  data.name = group[1][1];
  data.type = parseType(group);

  group.forEach((row) => {
    switch (row[0]) {
      // synchro
      case "Lane Group":
        data.laneGroup = row.slice(2);
        break;
      case "Lane Configurations":
        data.laneConfig = row.slice(2);
        break;
      case "Control Type":
        data.control = row[1];
        break;
      case "Intersection Signal Delay":
        data.delay = [row[7], row[1]];
        break;
      case "v/c Ratio":
        data.vc = row.slice(2);
        break;

      // HCM2000 signalized
      case "Movement":
        data.laneGroup = row.slice(2);
        break;
      case "HCM 2000 Control Delay":
        data.delay = [row[10], row[4]];
        break;

      // HCM2000 unsignalized
      case "Lanes":
        data.laneConfig = row.slice(2);
        break;
      case "Direction, Lane #":
        data.lanes = row.slice(2);
        break;
      case "Sign Control":
        data.sign = row.slice(2);
        break;

      // HCM2000 unsignalized, all-way stop
      case "Level of Service":
        data.los = row[4];
        break;
      case "Delay":
        data.delay = row[4];
        break;

      // HCM2000 unsignalized, side-street stop
      case "Control Delay (s)":
        data.movementDelay = row.slice(2);
        break;
      case "Lane LOS":
        data.movementLOS = row.slice(2);
        break;
      case "Volume to Capacity":
        data.movementVC = row.slice(2);
        break;
    }
  });

  return data as UnknownData;
}

function parseType(intersection: rowGroup) {
  switch (intersection[0][0]) {
    case "Lanes, Volumes, Timings":
      return "synchro";
    case "Queues":
      return "synchro-queues";
    case "HCM Signalized Intersection Capacity Analysis":
      return "hcm-signalized";
    case "HCM Unsignalized Intersection Capacity Analysis":
      return "hcm-unsignalized";
  }
  throw new Error("Unsupported output type: " + intersection[0][0]);
}

function parseLaneConfig(intersection: UnknownData) {
  let movements: string[] = [];

  let group = intersection.laneGroup;
  let config = intersection.laneConfig;

  group.forEach((lane, index: number) => {
    if (config[index] == "0" || config[index] == "") {
      if (intersection.type != "hcm-unsignalized") movements.push("");
      return;
    }

    // get approach direction
    let movement = lane.substring(0, 2).concat("-");

    if (config[index].includes("<")) {
      movement = movement.concat("L");
    }
    if (/\d/.test(config[index])) {
      movement = movement.concat(lane.at(2)!);
    }
    if (config[index].includes(">")) {
      movement = movement.concat("R");
    }

    if (intersection.type == "hcm-unsignalized") {
      // extract the number of lanes and add it multiple times
      let number = parseInt(config[index].replace(/\W/g, ""));
      while (number > 0) {
        movements.push(movement);
        number -= 1;
      }
    } else {
      movements.push(movement);
    }
  });
  return movements;
}

function Synchro(data: Synchro_Data) {
  let result: intersectionResult = {
    type: data.type,
    name: data.name,
    control: data.control,
    movements: parseLaneConfig(data),
    delay: data.delay,
    vc: data.vc,
  };

  return result;
}

function HCM2000_Signalized(data: HCM2000_Signalized_Data) {
  let result: intersectionResult = {
    type: data.type,
    name: data.name,
    control: "Signalized",
    movements: parseLaneConfig(data),
    delay: data.delay,
    vc: data.vc,
  };

  return result;
}

function HCM2000_Unsignalized(data: HCM2000_Unsignalized_Data) {
  // find max delay
  let delays = data.movementDelay.map((d: string) => parseFloat(d));
  let i = delays.indexOf(Math.max(...delays));
  let movements = parseLaneConfig(data);
  let lane = [movements[i]];

  if (data.los) {
    // all-way stop
    let result: intersectionResult = {
      type: data.type,
      name: data.name,
      control: "All-way Stop",
      movements: lane,
      delay: [data.los, data.delay],
      vc: [],
    };
    return result;
  } else {
    // side-street stop
    let delay = [data.movementLOS[i], data.movementDelay[i]] satisfies [string, string];
    let vc = [data.movementVC[i]];

    let result: intersectionResult = {
      type: data.type,
      name: data.name,
      control: "Side-street Stop",
      movements: lane,
      delay: delay,
      vc: vc,
    };
    return result;
  }
}
