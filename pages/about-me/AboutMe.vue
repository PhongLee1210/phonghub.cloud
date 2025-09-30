<script lang="ts" setup>
interface LifetimeStats {
  age: number;
  experience: number;
}

const sectionRef = ref<HTMLElement | null>(null);

// Use useFetch for better SSR support, automatic caching, and error handling
const { data: stats } = await useFetch<LifetimeStats>("/api/lifetime-stats", {
  key: "lifetime-stats",
  lazy: false,
  server: true,
  transform: (data) => data,
});

// Computed text with null safety
const text = computed(() => {
  const age = stats.value?.age ?? 0;
  return `I'm a ${age}-year-old Software Engineer from Vietnam, passionate about AI and modern frontend development with Vue.js/React.js. I also work with Node.js/Bun.js and cloud technologies to build scalable, innovative solutions.`;
});

// Initialize observer
const { observeSectionChange } = useObserver("About Me", sectionRef);
observeSectionChange();
</script>

<template>
  <section id="about-me" ref="sectionRef">
    <div class="bg-gradient-to-b from-slate-950 to-violet-950 relative">
      <div class="flex flex-col lg:flex-row items-center justify-between">
        <!-- Text Section -->
        <div class="w-full lg:w-1/2">
          <TextScrollReveal :text="text" />
        </div>

        <!-- Profile Image Section -->
        <div class="w-full lg:w-1/2 h-[200vh] relative">
          <div
            class="sticky top-0 h-screen flex items-center justify-center p-8"
          >
            <div class="relative w-full max-w-md aspect-square">
              <img
                src="/images/me.JPG"
                alt="Profile"
                class="w-full h-full object-cover rounded-2xl shadow-2xl ring-4 ring-violet-500/30"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
