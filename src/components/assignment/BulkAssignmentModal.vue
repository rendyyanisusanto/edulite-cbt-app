<script setup>
import { ref, computed, watch } from 'vue'
import { useMasterStore } from '@/stores/master'
import { Search, Check, Layers } from 'lucide-vue-next'

import BaseModal from '@/components/common/BaseModal.vue'
import BaseSelectSearch from '@/components/common/BaseSelectSearch.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const props = defineProps({
  isOpen: Boolean,
  loading: Boolean,
  examId: {
    type: Number,
    required: false
  },
  existingAssignments: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'submit'])

const masterStore = useMasterStore()

const teacherId = ref('')
const selectedSubjectIds = ref([])
const selectedClassIds = ref([])
const targetChoiceQuestions = ref(40)
const targetEssayQuestions = ref(0)

const subjectSearch = ref('')
const classSearch = ref('')
const errorMessage = ref('')

const teacherOptions = computed(() =>
  masterStore.teachers.map((t) => ({ label: t.name, value: t.id }))
)

const filteredSubjects = computed(() => {
  const q = subjectSearch.value.trim().toLowerCase()
  if (!q) return masterStore.subjects
  return masterStore.subjects.filter((s) => s.name.toLowerCase().includes(q))
})

const filteredClasses = computed(() => {
  const q = classSearch.value.trim().toLowerCase()
  if (!q) return masterStore.classes
  return masterStore.classes.filter((c) => c.name.toLowerCase().includes(q))
})

const existingKeySet = computed(() => {
  return new Set(
    props.existingAssignments.map((a) => `${a.teacherId}:${a.subjectId}:${a.classId}`)
  )
})

const summaryStats = computed(() => {
  if (!teacherId.value || !selectedSubjectIds.value.length || !selectedClassIds.value.length) {
    return { total: 0, newCount: 0, duplicateCount: 0 }
  }
  let duplicateCount = 0
  for (const subjectId of selectedSubjectIds.value) {
    for (const classId of selectedClassIds.value) {
      if (existingKeySet.value.has(`${teacherId.value}:${subjectId}:${classId}`)) {
        duplicateCount++
      }
    }
  }
  const total = selectedSubjectIds.value.length * selectedClassIds.value.length
  return {
    total,
    newCount: total - duplicateCount,
    duplicateCount
  }
})

const toggleSubject = (id) => {
  const idx = selectedSubjectIds.value.indexOf(id)
  if (idx === -1) {
    selectedSubjectIds.value.push(id)
  } else {
    selectedSubjectIds.value.splice(idx, 1)
  }
}

const toggleClass = (id) => {
  const idx = selectedClassIds.value.indexOf(id)
  if (idx === -1) {
    selectedClassIds.value.push(id)
  } else {
    selectedClassIds.value.splice(idx, 1)
  }
}

const selectAllFilteredSubjects = () => {
  const current = new Set(selectedSubjectIds.value)
  filteredSubjects.value.forEach((s) => current.add(s.id))
  selectedSubjectIds.value = [...current]
}

const selectAllFilteredClasses = () => {
  const current = new Set(selectedClassIds.value)
  filteredClasses.value.forEach((c) => current.add(c.id))
  selectedClassIds.value = [...current]
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      teacherId.value = ''
      selectedSubjectIds.value = []
      selectedClassIds.value = []
      targetChoiceQuestions.value = 40
      targetEssayQuestions.value = 0
      subjectSearch.value = ''
      classSearch.value = ''
      errorMessage.value = ''
    }
  }
)

const handleSubmit = () => {
  errorMessage.value = ''
  if (!teacherId.value) {
    errorMessage.value = 'Guru pengampu wajib dipilih.'
    return
  }
  if (selectedSubjectIds.value.length === 0) {
    errorMessage.value = 'Minimal pilih 1 mata pelajaran.'
    return
  }
  if (selectedClassIds.value.length === 0) {
    errorMessage.value = 'Minimal pilih 1 kelas.'
    return
  }
  const pg = Number(targetChoiceQuestions.value) || 0
  const essay = Number(targetEssayQuestions.value) || 0
  if (pg < 0 || essay < 0 || pg + essay <= 0) {
    errorMessage.value = 'Total target soal (PG + Essay) harus lebih dari 0.'
    return
  }
  if (summaryStats.value.newCount === 0) {
    errorMessage.value = 'Semua kombinasi guru, mapel, dan kelas yang dipilih sudah ada pada ujian ini.'
    return
  }

  emit('submit', {
    examId: props.examId,
    teacherId: Number(teacherId.value),
    subjectIds: selectedSubjectIds.value.map(Number),
    classIds: selectedClassIds.value.map(Number),
    targetChoiceQuestions: pg,
    targetEssayQuestions: essay
  })
}
</script>

<template>
  <BaseModal
    :isOpen="isOpen"
    title="Bulk Tambah Penugasan Guru"
    maxWidth="max-w-2xl"
    @close="emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4 py-1">
      <!-- 1 Guru -->
      <BaseSelectSearch
        v-model="teacherId"
        label="Guru Pengampu (1 Guru untuk Banyak Mapel)"
        placeholder="Cari & pilih guru..."
        :options="teacherOptions"
      />

      <!-- Multi Mapel & Multi Kelas -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Mata Pelajaran -->
        <div class="border border-slate-200 rounded-xl p-3 flex flex-col bg-slate-50/50">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-slate-700">
              Mata Pelajaran
              <span class="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-primary-blue">
                {{ selectedSubjectIds.length }} dipilih
              </span>
            </span>
            <div class="flex items-center gap-2 text-xs">
              <button type="button" @click="selectAllFilteredSubjects" class="text-primary-blue hover:underline font-medium">
                Pilih Semua
              </button>
              <span class="text-slate-300">|</span>
              <button type="button" @click="selectedSubjectIds = []" class="text-slate-500 hover:text-slate-700">
                Reset
              </button>
            </div>
          </div>

          <div class="relative mb-2">
            <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              v-model="subjectSearch"
              type="text"
              placeholder="Cari mapel..."
              class="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
            />
          </div>

          <div class="max-h-52 overflow-y-auto space-y-1 pr-1">
            <label
              v-for="subject in filteredSubjects"
              :key="subject.id"
              @click.prevent="toggleSubject(subject.id)"
              class="flex items-center justify-between px-2.5 py-2 rounded-lg text-sm cursor-pointer transition-colors select-none"
              :class="selectedSubjectIds.includes(subject.id) ? 'bg-blue-50 text-primary-blue font-medium' : 'bg-white hover:bg-slate-100 text-slate-700'"
            >
              <span class="truncate pr-2">{{ subject.name }}</span>
              <span
                class="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors"
                :class="selectedSubjectIds.includes(subject.id) ? 'bg-primary-blue border-primary-blue text-white' : 'border-slate-300 bg-white'"
              >
                <Check v-if="selectedSubjectIds.includes(subject.id)" class="w-3 h-3" />
              </span>
            </label>
            <div v-if="filteredSubjects.length === 0" class="py-6 text-center text-xs text-slate-400">
              Mata pelajaran tidak ditemukan
            </div>
          </div>
        </div>

        <!-- Kelas -->
        <div class="border border-slate-200 rounded-xl p-3 flex flex-col bg-slate-50/50">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-slate-700">
              Kelas
              <span class="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-primary-blue">
                {{ selectedClassIds.length }} dipilih
              </span>
            </span>
            <div class="flex items-center gap-2 text-xs">
              <button type="button" @click="selectAllFilteredClasses" class="text-primary-blue hover:underline font-medium">
                Pilih Semua
              </button>
              <span class="text-slate-300">|</span>
              <button type="button" @click="selectedClassIds = []" class="text-slate-500 hover:text-slate-700">
                Reset
              </button>
            </div>
          </div>

          <div class="relative mb-2">
            <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              v-model="classSearch"
              type="text"
              placeholder="Cari kelas..."
              class="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
            />
          </div>

          <div class="max-h-52 overflow-y-auto space-y-1 pr-1">
            <label
              v-for="cls in filteredClasses"
              :key="cls.id"
              @click.prevent="toggleClass(cls.id)"
              class="flex items-center justify-between px-2.5 py-2 rounded-lg text-sm cursor-pointer transition-colors select-none"
              :class="selectedClassIds.includes(cls.id) ? 'bg-blue-50 text-primary-blue font-medium' : 'bg-white hover:bg-slate-100 text-slate-700'"
            >
              <span class="truncate pr-2">{{ cls.name }}</span>
              <span
                class="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors"
                :class="selectedClassIds.includes(cls.id) ? 'bg-primary-blue border-primary-blue text-white' : 'border-slate-300 bg-white'"
              >
                <Check v-if="selectedClassIds.includes(cls.id)" class="w-3 h-3" />
              </span>
            </label>
            <div v-if="filteredClasses.length === 0" class="py-6 text-center text-xs text-slate-400">
              Kelas tidak ditemukan
            </div>
          </div>
        </div>
      </div>

      <!-- Target Soal -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block mb-1.5 text-sm font-medium text-slate-700">Target Pilihan Ganda</label>
          <input
            v-model.number="targetChoiceQuestions"
            type="number"
            min="0"
            class="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:border-primary-blue focus:ring-2 focus:ring-blue-100 focus:outline-none sm:text-sm"
          />
        </div>
        <div>
          <label class="block mb-1.5 text-sm font-medium text-slate-700">Target Essay</label>
          <input
            v-model.number="targetEssayQuestions"
            type="number"
            min="0"
            class="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:border-primary-blue focus:ring-2 focus:ring-blue-100 focus:outline-none sm:text-sm"
          />
        </div>
      </div>

      <!-- Summary Banner -->
      <div
        v-if="summaryStats.total > 0"
        class="rounded-xl px-4 py-3 text-sm flex items-start gap-2.5 border"
        :class="summaryStats.newCount > 0 ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-amber-50 border-amber-200 text-amber-800'"
      >
        <Layers class="w-4 h-4 mt-0.5 shrink-0" />
        <div>
          <span v-if="summaryStats.newCount > 0">
            Akan menambahkan <strong>{{ summaryStats.newCount }} penugasan baru</strong>
            ({{ selectedSubjectIds.length }} mapel &times; {{ selectedClassIds.length }} kelas).
          </span>
          <span v-else>
            Semua kombinasi yang dipilih ({{ summaryStats.total }}) sudah ada pada ujian ini.
          </span>
          <span v-if="summaryStats.duplicateCount > 0 && summaryStats.newCount > 0" class="block text-xs mt-0.5 opacity-80">
            {{ summaryStats.duplicateCount }} kombinasi sudah ada dan akan dilewati otomatis.
          </span>
        </div>
      </div>

      <!-- Error -->
      <p v-if="errorMessage" class="text-sm text-red-600 font-medium">{{ errorMessage }}</p>

      <div class="pt-4 flex justify-end space-x-3 border-t border-slate-100 mt-4">
        <BaseButton variant="secondary" type="button" @click="emit('close')" :disabled="loading">Batal</BaseButton>
        <BaseButton type="submit" :loading="loading" :disabled="summaryStats.total > 0 && summaryStats.newCount === 0">
          Simpan {{ summaryStats.newCount > 0 ? `${summaryStats.newCount} ` : '' }}Penugasan
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>
