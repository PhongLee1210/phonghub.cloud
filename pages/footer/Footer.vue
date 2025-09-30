<script setup lang="ts">
// Components are auto-imported in Nuxt 3
</script>

<template>
  <section id="footer">
    <div
      class="flex flex-col py-32 items-center gap-4 p-4 bg-gradient-to-b from-zinc-950 to-slate-950"
    >
      <UsedTechnologies />

      <div class="text-center space-y-2">
        <div class="flex flex-row items-center gap-2">
          <Version />
        </div>

        <Copyright />
      </div>
    </div>
  </section>
</template>
