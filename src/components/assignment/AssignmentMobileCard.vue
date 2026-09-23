<script setup>
import { computed } from 'vue'
import { MoreVertical, BookOpen } from 'lucide-vue-next'
import StatusBadge from '@/components/common/StatusBadge.vue'
import BaseDropdown from '@/components/common/BaseDropdown.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'

const props = defineProps({
  assignment: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['action'])

const dropdownItems = computed(() => [
  { label: 'Edit', onClick: () => emit('action', 'edit', props.assignment) },
  { label: 'Hapus', danger: true, onClick: () => emit('action', 'delete', props.assignment) }
])
</script>

<template>
  <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-3 last:mb-0 hover:shadow transition-shadow">
    <div class="flex justify-between items-start mb-2">
      <div class="pr-3">
        <h4 class="font-semibold text-slate-900 leading-tight">{{ assignment.teacherName }}</h4>
        <div class="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-2 gap-y-1">
          <span class="flex items-center"><BookOpen class="w-3.5 h-3.5 mr-1" /> {{ assignment.subjectName }}</span>
          <span class="font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{{ assignment.className }}</span>
        </div>
      </div>
      <BaseDropdown :items="dropdownItems">
        <template #trigger>
          <button class="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded transition-colors">
            <MoreVertical class="w-5 h-5" />
          </button>
        </template>
      </BaseDropdown>
    </div>
    
    <div class="text-xs text-slate-600 mb-4 bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
      <span class="font-medium text-slate-700">{{ assignment.examName || 'Ujian' }}</span>
    </div>
    
    <div class="mb-3 space-y-3">
      <ProgressBar 
        :value="assignment.choiceCount" 
        :max="assignment.targetChoiceQuestions" 
        :colorClass="assignment.choiceCount >= assignment.targetChoiceQuestions && assignment.targetChoiceQuestions > 0 ? 'bg-green-500' : 'bg-primary-blue'"
        heightClass="h-1.5"
        showLabel
      >
        <template #label>PG ({{ assignment.choiceCount }}/{{ assignment.targetChoiceQuestions }})</template>
      </ProgressBar>
      
      <ProgressBar 
        :value="assignment.essayCount" 
        :max="assignment.targetEssayQuestions" 
        :colorClass="assignment.essayCount >= assignment.targetEssayQuestions && assignment.targetEssayQuestions > 0 ? 'bg-green-500' : 'bg-orange-400'"
        heightClass="h-1.5"
        showLabel
      >
        <template #label>Esai ({{ assignment.essayCount }}/{{ assignment.targetEssayQuestions }})</template>
      </ProgressBar>
    </div>
    
    <div class="flex items-center justify-between mt-auto">
      <StatusBadge :status="assignment.status" />
    </div>
  </div>
</template>
