<script setup>
import { FileText } from 'lucide-vue-next'
import BaseButton from './BaseButton.vue'

defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  icon: {
    type: [Object, Function],
    default: null
  },
  actionLabel: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['action'])
</script>

<template>
  <div class="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
    <div class="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-slate-50 text-slate-400">
      <component :is="icon || FileText" class="w-8 h-8" />
    </div>
    <h3 class="text-lg font-semibold text-slate-900 mb-1">{{ title }}</h3>
    <p class="text-sm text-slate-500 max-w-sm mb-6">{{ description }}</p>
    
    <BaseButton v-if="actionLabel" @click="emit('action')" variant="primary">
      {{ actionLabel }}
    </BaseButton>
  </div>
</template>
