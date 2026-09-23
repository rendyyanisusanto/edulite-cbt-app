<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: {
    type: Number,
    required: true
  },
  max: {
    type: Number,
    default: 100
  },
  colorClass: {
    type: String,
    default: 'bg-primary-blue'
  },
  heightClass: {
    type: String,
    default: 'h-2.5'
  },
  showLabel: {
    type: Boolean,
    default: false
  }
})

const percentage = computed(() => {
  const maxVal = Number(props.max) || 0
  const currentVal = Number(props.value) || 0
  
  if (maxVal === 0) return 0
  
  const pct = Math.round((currentVal / maxVal) * 100)
  return isNaN(pct) ? 0 : Math.min(pct, 100)
})
</script>

<template>
  <div class="w-full">
    <div class="flex justify-between items-end mb-1" v-if="showLabel || $slots.label">
      <div class="text-sm font-medium text-slate-700">
        <slot name="label"></slot>
      </div>
      <div class="text-xs text-slate-500 font-medium" v-if="showLabel">
        {{ percentage }}%
      </div>
    </div>
    <div class="w-full bg-slate-200 rounded-full overflow-hidden" :class="heightClass">
      <div 
        class="rounded-full transition-all duration-500 ease-out" 
        :class="[heightClass, colorClass]"
        :style="`width: ${percentage}%`"
      ></div>
    </div>
  </div>
</template>
