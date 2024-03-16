<script lang="ts">
  import { groupByIntersection, parseCSV, parseResults, type results } from "src/parse";

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
    synchro = synchro.replaceAll(":", "	");
    let rawData = parseCSV(synchro);

    let intersections = groupByIntersection(rawData);
    console.log("groups", intersections);

    table = parseResults(intersections);
    console.log("results", table);
  }
</script>

<h1 class="mb-2 text-2xl font-bold">Synchro Result Aggregator</h1>

<main class="flex flex-grow">
  <div class="flex shrink-0 grow basis-1/2 flex-col">
    <input type="file" bind:files on:change={pasteFile} class="my-2 w-full border border-black" />

    <textarea
      bind:value={synchro}
      on:input={update}
      wrap="off"
      placeholder="Paste Synchro output here"
      spellcheck="false"
      class="shrink-0 grow text-nowrap border-2 border-black p-1"></textarea>
  </div>

  <div class="shrink-0 grow basis-1/2 p-1">
    <div>
      <h4 class="font-bold">Options:</h4>
      <span>Critical v/c Ratio</span><input bind:value={criticaVC} class="m-2 w-20 border border-black" />
    </div>

    <table class="w-full table-auto border-2 border-black text-center">
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
                {#if row.type != "hcm-unsignalized"}
                  {#if parseFloat(vc) >= criticaVC}
                    {row.movements[index]} ({vc.padEnd(4, "0")})<br />
                  {/if}
                {:else}
                  {row.movements[index]} ({vc.padEnd(4, "0")})<br />
                {/if}
              {:else}
                --
              {/each}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</main>

<footer>
  Disclaimer: This web application is provided "as is". The author does not take responsibility for the accuracy of the
  provided information. Please do your due dilligence and apply engineering judgement.
</footer>

<style global lang="postcss">
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
</style>
