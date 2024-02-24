<script lang="ts">
  import Papa from "papaparse";

  type row = string[];
  type rowGroup = row[];
  type results = {
    [key: string]: intersectionData;
  };
  interface intersectionData {
    name: string;
    type: string;
    delay: number[];
    movements: string[];
    vc: string[];
  }

  let synchro = "";

  let table: results = {};

  function update() {
    table = {};

    synchro = synchro.replaceAll(":", "	");
    let rawData = parseCSV(synchro);

    let intersections = groupByIntersection(rawData);
    console.log("groups", intersections);

    table = parseResults(intersections);
    console.log("results", table);
  }

  function parseCSV(data: string) {
    let result = Papa.parse(synchro, {
      skipEmptyLines: true,
      transform: (str) => str.trim(),
    });

    return result.data as row[];
  }

  function groupByIntersection(results: row[]) {
    let headings = ["Lanes, Volumes, Timings", "Queues", "HCM Signalized Intersection Capacity Analysis", "HCM Unsignalized Intersection Capacity Analysis"];
    let groups: rowGroup[] = [];
    let intersection: row[] = [];
    results.forEach((line: row) => {
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

  function parseResults(results: rowGroup[]) {
    results.forEach((intersection) => {
      let rowData: any = {};
      let name = intersection[1][1];
      rowData.name = name;

      intersection.forEach((line) => {
        let [label, ...data] = parseRow(line);
        if (label) rowData[label as string] = data;
      });

      rowData.movements = rowData["lane-group"];
      table[name] = rowData;
    });

    return table;
  }

  function parseRow(line: row) {
    switch (line[0]) {
      case "Lanes, Volumes, Timings":
        return ["type", "synchro"];
      case "Queues":
        return ["type", "synchro-queues"];
      case "HCM Signalized Intersection Capacity Analysis":
        return ["type", "hcm-signalized"];
      case "HCM Unsignalized Intersection Capacity Analysis":
        return ["type", "hcm-unsignalized"];

      case "Lane Group":
        return ["lane-group", ...line.slice(2)];
      case "Lane Configurations":
        return ["lane-config", ...line.slice(2)];

      case "Control Type":
        return ["signal", line[1]];
      case "Intersection Signal Delay":
        return ["delay", line[7], line[1]];
      case "v/c Ratio":
        return ["vc", ...line.slice(2)];
    }
    return [];
  }
</script>

<h1 class="text-2xl font-bold mb-2">Synchro Result Aggregator</h1>

<main class="flex flex-grow">
  <textarea bind:value={synchro} on:input={update} placeholder="Paste Synchro output here" spellcheck="false" class="grow shrink-0 basis-1/2 p-1 border-2 border-black"></textarea>
  <div class="grow shrink-0 basis-1/2 p-1">
    <table class="table-auto w-full text-center border-2 border-black">
      <thead>
        <th>Intersection</th>
        <th>Type</th>
        <th>Delay</th>
        <th>v/c Ratio</th>
      </thead>
      <tbody>
        {#each Object.values(table) as row}
          <tr>
            <td> {row.name} </td>
            <td> {row.type}</td>
            <td> {row.delay[0]} ({row.delay[1]})</td>
            <td>
              {#each row.vc as vc, index}
                {row.movements[index]}: {vc.toString().padEnd(4, "0")}<br />
              {/each}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</main>

<footer>
  Disclaimer: This web application is provided "as is". The author does not take responsibility for the accuracy of the provided information. Please do your due dilligence and apply engineering
  judgement.
</footer>

<style global lang="postcss">
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
</style>
