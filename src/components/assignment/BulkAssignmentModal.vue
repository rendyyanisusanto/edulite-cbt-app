<script setup>
import { ref, computed, watch } from 'vue'
import { useMasterStore } from '@/stores/master'
import { Plus, Trash2 } from 'lucide-vue-next'

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

let nextRowId = 1
const createEmptyRow = (pg = 40, essay = 0) => ({
  _key: nextRowId++,
  classId: '',
  subjectId: '',
  targetChoiceQuestions: pg,
  targetEssayQuestions: essay
})

const teacherId = ref('')
const rows = ref([createEmptyRow()])
const errorMessage = ref('')

const teacherOptions = computed(() =>
  masterStore.teachers.map((t) => ({ label: t.name, value: t.id }))
)
const subjectOptions = computed(() =>
  masterStore.subjects.map((s) => ({ label: s.name, value: s.id }))
)
const classOptions = computed(() =>
  masterStore.classes.map((c) => ({ label: c.name, value: c.id }))
)

const existingKeySet = computed(() => {
  return new Set(
    props.existingAssignments.map((a) => `${a.teacherId}:${a.subjectId}:${a.classId}`)
  )
})

const isRowDuplicate = (row) => {
  if (!teacherId.value || !row.classId || !row.subjectId) return false
  return existingKeySet.value.has(`${teacherId.value}:${row.subjectId}:${row.classId}`)
}

const addRow = () => {
  const lastRow = rows.value[rows.value.length - 1]
  rows.value.push(
    createEmptyRow(
      lastRow ? lastRow.targetChoiceQuestions : 40,
      lastRow ? lastRow.targetEssayQuestions : 0
    )
  )
}

const removeRow = (index) => {
  if (rows.value.length <= 1) return
  rows.value.splice(index, 1)
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      teacherId.value = ''
      rows.value = [createEmptyRow()]
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

  for (let i = 0; i < rows.value.length; i++) {
    const row = rows.value[i]
    if (!row.classId) {
      errorMessage.value = `Baris ${i + 1}: Kelas wajib dipilih.`
      return
    }
    if (!row.subjectId) {
      errorMessage.value = `Baris ${i + 1}: Mata pelajaran wajib dipilih.`
      return
    }
    const pg = Number(row.targetChoiceQuestions) || 0
    const essay = Number(row.targetEssayQuestions) || 0
    if (pg < 0 || essay < 0 || pg + essay <= 0) {
      errorMessage.value = `Baris ${i + 1}: Total soal (PG + Esay) harus lebih dari 0.`
      return
    }
  }

  emit('submit', {
    examId: props.examId,
    teacherId: Number(teacherId.value),
    items: rows.value.map((r) => ({
      classId: Number(r.classId),
      subjectId: Number(r.subjectId),
      targetChoiceQuestions: Number(r.targetChoiceQuestions) || 0,
      targetEssayQuestions: Number(r.targetEssayQuestions) || 0
    }))
  })
}
</script>

<template>
  <BaseModal
    :isOpen="isOpen"
    title="Bulk Tambah Penugasan Guru"
    maxWidth="max-w-3xl"
    @close="emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4 py-1">
      <!-- Pilih 1 Guru -->
      <BaseSelectSearch
        v-model="teacherId"
        label="Guru Pengampu"
        placeholder="Cari & pilih guru..."
        :options="teacherOptions"
      />

      <!-- Daftar Baris Penugasan -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-slate-700">
            Daftar Kelas &amp; Mata Pelajaran ({{ rows.length }})
          </span>
          <BaseButton type="button" variant="outline" class="!py-1.5 !px-3 !text-xs" @click="addRow">
            <Plus class="w-3.5 h-3.5 mr-1" /> Tambah
          </BaseButton>
        </div>

        <div class="space-y-2.5">
          <div
            v-for="(row, index) in rows"
            :key="row._key"
            class="p-3 rounded-xl border bg-slate-50/70 transition-colors"
            :class="isRowDuplicate(row) ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200'"
          >
            <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <!-- Kelas -->
              <div class="sm:col-span-4 [&>div]:!mb-0">
                <BaseSelectSearch
                  v-model="row.classId"
                  label="Kelas"
                  placeholder="Pilih kelas..."
                  :options="classOptions"
                />
              </div>

              <!-- Mapel -->
              <div class="sm:col-span-4 [&>div]:!mb-0">
                <BaseSelectSearch
                  v-model="row.subjectId"
                  label="Mapel"
                  placeholder="Pilih mapel..."
                  :options="subjectOptions"
                />
              </div>

              <!-- Jml Soal (PG) -->
              <div class="sm:col-span-2">
                <label class="block mb-1.5 text-sm font-medium text-slate-700">Jml Soal</label>
                <input
                  v-model.number="row.targetChoiceQuestions"
                  type="number"
                  min="0"
                  class="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:border-primary-blue focus:ring-2 focus:ring-blue-100 focus:outline-none sm:text-sm"
                />
              </div>

              <!-- Esay + Hapus -->
              <div class="sm:col-span-2 flex items-end gap-2">
                <div class="flex-1">
                  <label class="block mb-1.5 text-sm font-medium text-slate-700">Esay</label>
                  <input
                    v-model.number="row.targetEssayQuestions"
                    type="number"
                    min="0"
                    class="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:border-primary-blue focus:ring-2 focus:ring-blue-100 focus:outline-none sm:text-sm"
                  />
                </div>
                <button
                  v-if="rows.length > 1"
                  type="button"
                  @click="removeRow(index)"
                  class="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-200 transition-colors shrink-0"
                  title="Hapus baris"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>

            <p v-if="isRowDuplicate(row)" class="mt-2 text-xs text-amber-700 font-medium">
              Kombinasi guru, mapel, dan kelas ini sudah ada di ujian (akan dilewati otomatis).
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="addRow"
          class="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-primary-blue text-slate-500 hover:text-primary-blue rounded-xl text-sm font-medium flex items-center justify-center transition-colors"
        >
          <Plus class="w-4 h-4 mr-1.5" /> Tambah Baris Mapel &amp; Kelas
        </button>
      </div>

      <!-- Error -->
      <p v-if="errorMessage" class="text-sm text-red-600 font-medium">{{ errorMessage }}</p>

      <div class="pt-4 flex justify-end space-x-3 border-t border-slate-100 mt-4">
        <BaseButton variant="secondary" type="button" @click="emit('close')" :disabled="loading">Batal</BaseButton>
        <BaseButton type="submit" :loading="loading">
          Simpan {{ rows.length }} Penugasan
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>
