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
    delay: number;
    vc: Object;
  }

  let synchro = "";

  let table: results = {};

  function update() {
    let table = {};

    synchro = synchro.replaceAll(":", "	");
    let rawData = parseCSV(synchro);
    // console.log("raw", rawData);

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
    let groups: rowGroup[] = [];
    let intersection: row[] = [];
    results.forEach((line: row) => {
      if (line[0] == "Lanes, Volumes, Timings" || line[0] == "Queues") {
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
    let labels = ["Control Type", "Intersection Signal Delay", "v/c Ratio"];
    let parsedResults: rowGroup[] = [];
    let table: any = {};

    results.forEach((intersection) => {
      let result: row[] = intersection.slice(0, 4);
      let tableData: any = {};

      let name = intersection[1][1];
      intersection.forEach((line) => {
        if (labels.includes(line[0])) {
          result.push(line);
          let [label, data] = parseRow(line);
          tableData[label] = data;
        }
      });

      table[name] = result;
      parsedResults.push(result);
    });

    return table;
  }

  function parseRow(line: row) {
    switch (line[0]) {
      case "Control Type":
        return ["type", line[1]];
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
        <th>Delay</th>
        <th>v/c Ratio</th>
      </thead>
      <tbody>
        {#each Object.values(table) as row}
          <tr>
            <td> {row.name} </td>
            <td> {row.delay}</td>
            <td>
              {#each Object.entries(row.vc) as cell}
                {cell[0]}: {cell[1].toString().padEnd(4, "0")}<br />
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
