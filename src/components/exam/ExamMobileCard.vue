<script setup>
import { computed } from 'vue'
import { MoreVertical } from 'lucide-vue-next'
import StatusBadge from '@/components/common/StatusBadge.vue'
import BaseDropdown from '@/components/common/BaseDropdown.vue'

const props = defineProps({
  exam: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['action'])

const dropdownItems = computed(() => [
  { label: 'Lihat Detail', onClick: () => emit('action', 'detail', props.exam.id) },
  { label: 'Edit Ujian', onClick: () => emit('action', 'edit', props.exam) },
  { label: 'Penugasan Guru', onClick: () => emit('action', 'detail', props.exam.id) },
  { label: 'Hapus', danger: true, onClick: () => emit('action', 'delete', props.exam) }
])
</script>

<template>
  <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-3 last:mb-0 hover:shadow transition-shadow">
    <div class="flex justify-between items-start mb-2">
      <div class="pr-3">
        <h4 class="font-semibold text-slate-900 leading-tight">{{ exam.title }}</h4>
        <p class="text-xs text-slate-500 font-mono mt-0.5">{{ exam.code }}</p>
      </div>
      <BaseDropdown :items="dropdownItems">
        <template #trigger>
          <button class="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded transition-colors">
            <MoreVertical class="w-5 h-5" />
          </button>
        </template>
      </BaseDropdown>
    </div>
    
    <div class="text-xs text-slate-600 mb-3">
      <span class="font-medium text-slate-700">{{ exam.academicYear }}</span> &bull; Semester {{ exam.semester }}
    </div>
    
    <div class="text-xs text-slate-500 mb-3 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-center font-medium">
      Jenis Ujian: {{ exam.exam_type || exam.examType || '-' }}
    </div>
    
    <div class="flex items-center justify-between mt-auto">
      <StatusBadge :status="exam.status" />
      <span class="text-xs text-slate-500 font-medium">{{ exam.assignmentCount || 0 }} Penugasan</span>
    </div>
  </div>
</template>
