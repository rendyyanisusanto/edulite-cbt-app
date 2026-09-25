<script setup>
import { ref, computed, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseSelectSearch from '@/components/common/BaseSelectSearch.vue'
import { Copy, AlertCircle } from 'lucide-vue-next'
import { useAssignmentStore } from '@/stores/assignment'
import { storeToRefs } from 'pinia'

const props = defineProps({
  isOpen: Boolean,
  currentAssignmentId: {
    type: Number,
    required: true
  },
  currentSubjectId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['close', 'clone-success'])

const assignmentStore = useAssignmentStore()
const { assignments, loading } = storeToRefs(assignmentStore)

const selectedAssignmentId = ref('')
const isCloning = ref(false)

// Filter out the current assignment and only show assignments from the same subject
const availableAssignments = computed(() => {
  return assignments.value
    .filter(a => a.id !== props.currentAssignmentId && a.subject?.id === props.currentSubjectId)
    .map(a => ({
      value: a.id,
      label: `${a.exam?.title} - Kelas ${a.class?.name}`
    }))
})

// Fetch assignments when modal opens
watch(() => props.isOpen, async (newVal) => {
  if (newVal) {
    selectedAssignmentId.value = ''
    if (assignments.value.length === 0) {
      await assignmentStore.fetchTeacherAssignments()
    }
  }
})

const handleClone = async () => {
  if (!selectedAssignmentId.value) return
  isCloning.value = true
  emit('clone-success', selectedAssignmentId.value)
  // Let parent handle the API call so we can show toasts properly and reset
  isCloning.value = false
}

const handleClose = () => {
  selectedAssignmentId.value = ''
  emit('close')
}
</script>

<template>
  <BaseModal 
    :isOpen="isOpen" 
    title="Kloning Soal" 
    @close="handleClose"
    maxWidth="max-w-md"
  >
    <div class="py-4 space-y-5">
      <div class="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-4">
        <div class="bg-blue-100 text-primary-blue p-2 rounded-lg shrink-0 mt-1">
          <Copy class="w-5 h-5" />
        </div>
        <div>
          <h3 class="font-bold text-slate-800 text-sm">Salin dari Ujian Lain</h3>
          <p class="text-slate-600 text-sm mt-1">
            Fitur ini memungkinkan Anda menyalin seluruh soal dari ujian lain pada mata pelajaran yang sama ke ujian ini.
          </p>
        </div>
      </div>

      <div v-if="loading" class="text-center text-sm text-slate-500 py-4">
        Memuat daftar ujian...
      </div>
      <div v-else-if="availableAssignments.length === 0" class="flex flex-col items-center justify-center py-4 bg-slate-50 rounded-lg border border-slate-200">
        <AlertCircle class="w-8 h-8 text-slate-400 mb-2" />
        <p class="text-slate-600 text-sm font-medium">Tidak ada ujian lain yang tersedia</p>
        <p class="text-slate-500 text-xs">Buat ujian lain di mapel yang sama terlebih dahulu.</p>
      </div>
      <div v-else>
        <label class="block text-sm font-semibold text-slate-700 mb-2">Pilih Ujian Sumber</label>
        <select 
          v-model="selectedAssignmentId" 
          class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue transition-colors text-sm text-slate-700"
        >
          <option value="" disabled>-- Pilih Ujian --</option>
          <option v-for="opt in availableAssignments" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3 w-full">
        <BaseButton variant="secondary" @click="handleClose" :disabled="isCloning">Batal</BaseButton>
        <BaseButton 
          variant="primary" 
          @click="handleClone" 
          :disabled="!selectedAssignmentId || isCloning"
          :loading="isCloning"
        >
          Mulai Kloning
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
