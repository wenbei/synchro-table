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
    delay: string[];
    movements: string[];
    vc: string[];
  }

  let files: FileList;
  let synchro = "";

  let table: results = {};

  let criticaVC = 0.85;

  async function pasteFile() {
    let file = files[0];
    let input = await file.text();
    synchro = input;
    update();
  }

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

  function groupByIntersection(rawData: row[]) {
    let headings = ["Lanes, Volumes, Timings", "Queues", "HCM Signalized Intersection Capacity Analysis", "HCM Unsignalized Intersection Capacity Analysis"];
    let groups: rowGroup[] = [];
    let intersection: row[] = [];
    rawData.forEach((line: row) => {
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

      rowData.movements = rowData["laneGroup"];
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
</script>

<h1 class="text-2xl font-bold mb-2">Synchro Result Aggregator</h1>

<main class="flex flex-grow">
  <div class="flex flex-col grow shrink-0 basis-1/2">
    <input type="file" bind:files on:change={pasteFile} class="w-full my-2 border border-black" />

    <textarea bind:value={synchro} on:input={update} wrap="off" placeholder="Paste Synchro output here" spellcheck="false" class="grow shrink-0 text-nowrap p-1 border-2 border-black"></textarea>
  </div>

  <div class="grow shrink-0 basis-1/2 p-1">
    <div>
      <h4 class="font-bold">Options:</h4>
      <span>Critical v/c Ratio</span><input bind:value={criticaVC} class="w-20 m-2 border border-black" />
    </div>

    <table class="table-auto w-full text-center border-2 border-black">
      <thead>
        <th>Intersection</th>
        <!-- <th>Type</th> -->
        <th>Delay</th>
        <th>v/c Ratio</th>
      </thead>
      <tbody>
        {#each Object.values(table) as row}
          <tr>
            <td> {row.name} </td>
            <!-- <td> {row.type}</td> -->
            <td> {row.delay[0]} ({Math.round(parseFloat(row.delay[1]))})</td>
            <td>
              {#each row.vc as vc, index}
                {#if parseFloat(vc) >= criticaVC}
                  {row.movements[index]}: {vc.padEnd(4, "0")}<br />
                {/if}
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
