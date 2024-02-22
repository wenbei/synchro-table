<script lang="ts">
  import Papa from "papaparse";

  let synchro = "Paste Synchro output here";

  let results: any;

  function parseResults() {
    results = Papa.parse(synchro, {
      skipEmptyLines: true,
      transform: (str) => str.trim(),
    }).data;

    console.log(results);
  }

  parseResults();
</script>

<h1 class="text-2xl font-bold mb-2">Synchro Result Aggregator</h1>

<main class="flex flex-grow">
  <textarea bind:value={synchro} on:input={parseResults} spellcheck="false" class="grow shrink-0 basis-1/2 p-1 border-2 border-black"></textarea>
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
