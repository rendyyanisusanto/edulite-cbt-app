<script setup>
defineProps({
  type: {
    type: String,
    default: 'text' // text, avatar, card, table
  },
  lines: {
    type: Number,
    default: 1
  }
})
</script>

<template>
  <div v-if="type === 'text'" class="animate-pulse space-y-2.5">
    <div v-for="i in lines" :key="i" class="h-4 bg-slate-200 rounded w-full" :class="{ 'w-3/4': i % 2 !== 0 && lines > 1 }"></div>
  </div>

  <div v-else-if="type === 'avatar'" class="animate-pulse">
    <div class="rounded-full bg-slate-200 h-10 w-10"></div>
  </div>

  <div v-else-if="type === 'card'" class="animate-pulse flex flex-col bg-white p-6 rounded-xl border border-slate-100">
    <div class="flex items-center space-x-4 mb-4">
      <div class="rounded-full bg-slate-200 h-10 w-10"></div>
      <div class="flex-1 space-y-2">
        <div class="h-4 bg-slate-200 rounded w-1/3"></div>
        <div class="h-3 bg-slate-200 rounded w-1/4"></div>
      </div>
    </div>
    <div class="space-y-2 flex-1">
      <div class="h-3 bg-slate-200 rounded w-full"></div>
      <div class="h-3 bg-slate-200 rounded w-5/6"></div>
    </div>
  </div>

  <div v-else-if="type === 'table'" class="animate-pulse border border-slate-200 rounded-xl overflow-hidden">
    <div class="h-12 bg-slate-100 border-b border-slate-200"></div>
    <div class="divide-y divide-slate-100 bg-white">
      <div v-for="i in lines" :key="i" class="p-4 flex space-x-4">
        <div class="h-4 bg-slate-200 rounded w-1/4"></div>
        <div class="h-4 bg-slate-200 rounded w-1/4"></div>
        <div class="h-4 bg-slate-200 rounded w-1/4"></div>
        <div class="h-4 bg-slate-200 rounded w-1/4"></div>
      </div>
    </div>
  </div>
</template>
