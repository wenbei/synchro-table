<script lang="ts">
  import Papa from "papaparse";

  let synchro = "";

  let results: string[] = [];

  function update() {
    results = [];

    let rawData = parseCSV(synchro);
    console.log(rawData);

    let intersections = groupByIntersection(rawData);
    console.log(intersections);

    intersections.forEach((int) => {
      results.push(int[1][0]);
    });
  }

  function parseCSV(data: string) {
    let result = Papa.parse(synchro, {
      skipEmptyLines: true,
      transform: (str) => str.trim(),
    });

    return result.data as string[];
  }

  function groupByIntersection(results: string[]) {
    let groups: string[][] = [];
    let intersection: string[] = [];
    results.forEach((row: string) => {
      if (row == "Lanes, Volumes, Timings") {
        groups.push(intersection);
        intersection = [];
      }
      intersection.push(row);
    });
    groups.push(intersection);
    groups.shift();

    return groups;
  }
</script>

<h1 class="text-2xl font-bold mb-2">Synchro Result Aggregator</h1>

<main class="flex flex-grow">
  <textarea bind:value={synchro} on:input={update} placeholder="Paste Synchro output here" spellcheck="false" class="grow shrink-0 basis-1/2 p-1 border-2 border-black"></textarea>
  <div class="grow shrink-0 basis-1/2 p-1">
    {#each results as line}
      {line} <br />
    {/each}
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
