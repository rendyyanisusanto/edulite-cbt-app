<script setup>
import { ref, computed } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'

const props = defineProps({
  isOpen: Boolean,
  students: {
    type: Array,
    required: true
  },
  classes: {
    type: Array,
    required: true
  },
  selectedStudentIds: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'submit'])

const mode = ref('all_no_account') // 'selected', 'class', 'all_no_account'
const selectedClass = ref('')

const noAccountCount = computed(() => props.students.filter(s => !s.account?.exists).length)
const selectedNoAccountCount = computed(() => {
  return props.students.filter(s => props.selectedStudentIds.includes(s.studentId) && !s.account?.exists).length
})

const classNoAccountCount = computed(() => {
  if (!selectedClass.value) return 0
  return props.students.filter(s => s.class?.id === selectedClass.value && !s.account?.exists).length
})

const handleSubmit = () => {
  if (mode.value === 'selected') {
    emit('submit', { studentIds: props.selectedStudentIds })
  } else if (mode.value === 'class') {
    if (!selectedClass.value) return
    emit('submit', { classId: selectedClass.value })
  } else {
    // all_no_account
    const ids = props.students.filter(s => !s.account?.exists).map(s => s.studentId)
    emit('submit', { studentIds: ids })
  }
}
</script>

<template>
  <BaseModal :isOpen="isOpen" title="Generate Akun CBT" @close="$emit('close')" maxWidth="max-w-lg">
    <div class="py-4 space-y-6 text-slate-700">
      <p class="text-sm">Pilih target siswa yang akan dibuatkan akun CBT secara otomatis. Siswa yang sudah memiliki akun tidak akan digenerate ulang.</p>
      
      <div class="space-y-3">
        <!-- Option 1: Selected Students -->
        <label class="flex items-start p-4 border rounded-xl cursor-pointer transition-colors" :class="mode === 'selected' ? 'border-primary-blue bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'">
          <div class="flex items-center h-5">
            <input type="radio" v-model="mode" value="selected" class="w-4 h-4 text-primary-blue border-slate-300 focus:ring-primary-blue" :disabled="selectedStudentIds.length === 0">
          </div>
          <div class="ml-3">
            <span class="block text-sm font-semibold text-slate-800" :class="{'opacity-50': selectedStudentIds.length === 0}">Siswa Terpilih</span>
            <span class="block text-xs text-slate-500 mt-1" :class="{'opacity-50': selectedStudentIds.length === 0}">
              {{ selectedStudentIds.length }} siswa dipilih ({{ selectedNoAccountCount }} belum punya akun)
            </span>
          </div>
        </label>

        <!-- Option 2: By Class -->
        <label class="flex items-start p-4 border rounded-xl cursor-pointer transition-colors" :class="mode === 'class' ? 'border-primary-blue bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'">
          <div class="flex items-center h-5">
            <input type="radio" v-model="mode" value="class" class="w-4 h-4 text-primary-blue border-slate-300 focus:ring-primary-blue">
          </div>
          <div class="ml-3 w-full">
            <span class="block text-sm font-semibold text-slate-800">Berdasarkan Kelas</span>
            <div v-if="mode === 'class'" class="mt-3">
              <BaseSelect
                name="classId"
                v-model="selectedClass"
                :options="classes.map(c => ({ value: c.id, label: c.name }))"
              />
              <span class="block text-xs text-slate-500 mt-2 font-medium" v-if="selectedClass">
                {{ classNoAccountCount }} siswa belum memiliki akun di kelas ini.
              </span>
            </div>
          </div>
        </label>

        <!-- Option 3: All No Account -->
        <label class="flex items-start p-4 border rounded-xl cursor-pointer transition-colors" :class="mode === 'all_no_account' ? 'border-primary-blue bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'">
          <div class="flex items-center h-5">
            <input type="radio" v-model="mode" value="all_no_account" class="w-4 h-4 text-primary-blue border-slate-300 focus:ring-primary-blue" :disabled="noAccountCount === 0">
          </div>
          <div class="ml-3">
            <span class="block text-sm font-semibold text-slate-800" :class="{'opacity-50': noAccountCount === 0}">Semua Siswa Belum Memiliki Akun</span>
            <span class="block text-xs text-slate-500 mt-1" :class="{'opacity-50': noAccountCount === 0}">
              <span class="font-bold text-slate-700">{{ noAccountCount }}</span> akun baru akan dibuat.
            </span>
          </div>
        </label>
      </div>

    </div>
    
    <template #footer>
      <div class="flex justify-end gap-3 w-full">
        <BaseButton variant="secondary" @click="$emit('close')">Batal</BaseButton>
        <BaseButton 
          variant="primary" 
          @click="handleSubmit" 
          :disabled="(mode === 'selected' && selectedNoAccountCount === 0) || (mode === 'class' && (!selectedClass || classNoAccountCount === 0)) || (mode === 'all_no_account' && noAccountCount === 0)"
        >
          Generate Akun
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
