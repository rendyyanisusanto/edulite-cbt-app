<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    required: true
  }
})

const badgeClass = computed(() => {
  const s = props.status.toLowerCase()
  if (s === 'aktif' || s === 'siap' || s === 'active') {
    return 'bg-green-100 text-green-700 border-green-200'
  }
  if (s === 'selesai') {
    return 'bg-blue-100 text-blue-700 border-blue-200'
  }
  if (s === 'proses') {
    return 'bg-amber-100 text-amber-700 border-amber-200'
  }
  // draft, belum mulai, etc.
  return 'bg-slate-100 text-slate-700 border-slate-200'
})

const displayStatus = computed(() => {
  const s = props.status
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
})
</script>

<template>
  <span
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
    :class="badgeClass"
  >
    {{ displayStatus }}
  </span>
</template>
