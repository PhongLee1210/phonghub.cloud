<script setup lang="ts">
import Copyright from "./Copyright.vue";
import UsedTechnologies from "./UsedTechnologies.vue";
import Version from "./Version.vue";
</script>

<template>
  <section id="footer">
    <div
      class="flex flex-col pt-12 pb-32 items-center gap-4 p-4 bg-gradient-to-b from-zinc-950 to-slate-950"
    >
      <UsedTechnologies />

      <div class="text-center space-y-2">
        <Version />

        <Copyright />
      </div>
    </div>
  </section>
</template>
