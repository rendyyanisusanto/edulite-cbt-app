<script setup>
import { computed } from 'vue'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-vue-next'

const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  totalItems: {
    type: Number,
    required: true
  },
  itemsPerPage: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['update:currentPage'])

const startItem = computed(() => {
  if (props.totalItems === 0) return 0
  return (props.currentPage - 1) * props.itemsPerPage + 1
})

const endItem = computed(() => {
  return Math.min(props.currentPage * props.itemsPerPage, props.totalItems)
})

const visiblePages = computed(() => {
  const pages = []
  if (props.totalPages <= 5) {
    for (let i = 1; i <= props.totalPages; i++) {
      pages.push(i)
    }
  } else {
    if (props.currentPage <= 3) {
      pages.push(1, 2, 3, 4, '...', props.totalPages)
    } else if (props.currentPage >= props.totalPages - 2) {
      pages.push(1, '...', props.totalPages - 3, props.totalPages - 2, props.totalPages - 1, props.totalPages)
    } else {
      pages.push(1, '...', props.currentPage - 1, props.currentPage, props.currentPage + 1, '...', props.totalPages)
    }
  }
  return pages
})

const changePage = (page) => {
  if (page === '...' || page === props.currentPage || page < 1 || page > props.totalPages) return
  emit('update:currentPage', page)
}
</script>

<template>
  <div class="flex items-center justify-between py-3">
    <div class="text-sm text-slate-500 hidden sm:block">
      Menampilkan <span class="font-medium text-slate-700">{{ startItem }}</span> – <span class="font-medium text-slate-700">{{ endItem }}</span> dari <span class="font-medium text-slate-700">{{ totalItems }}</span> hasil
    </div>
    <div class="text-sm text-slate-500 sm:hidden">
      {{ startItem }} - {{ endItem }} dari {{ totalItems }}
    </div>
    
    <div class="flex items-center space-x-1">
      <button 
        @click="changePage(currentPage - 1)"
        :disabled="currentPage === 1"
        class="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue"
      >
        <ChevronLeft class="w-4 h-4" />
      </button>
      
      <button 
        v-for="(page, index) in visiblePages" 
        :key="index"
        @click="changePage(page)"
        :disabled="page === '...'"
        :class="[
          'min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue',
          page === currentPage 
            ? 'bg-primary-blue text-white' 
            : page === '...' 
              ? 'text-slate-400 cursor-default' 
              : 'text-slate-600 hover:bg-slate-100'
        ]"
      >
        <span v-if="page !== '...'">{{ page }}</span>
        <MoreHorizontal v-else class="w-4 h-4 mx-auto" />
      </button>
      
      <button 
        @click="changePage(currentPage + 1)"
        :disabled="currentPage === totalPages || totalPages === 0"
        class="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue"
      >
        <ChevronRight class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
