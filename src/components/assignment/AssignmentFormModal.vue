<script setup>
import { watch, computed } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'
import { useAssignmentStore } from '@/stores/assignment'
import { useMasterStore } from '@/stores/master'
import { useExamStore } from '@/stores/exam'

import BaseModal from '@/components/common/BaseModal.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const props = defineProps({
  isOpen: Boolean,
  loading: Boolean,
  assignment: Object,
  examId: {
    type: Number,
    required: false
  }
})

const emit = defineEmits(['close', 'submit'])

const assignmentStore = useAssignmentStore()
const masterStore = useMasterStore()
const examStore = useExamStore()

const teacherOptions = computed(() => masterStore.teachers.map(t => ({ label: t.name, value: t.id })))
const subjectOptions = computed(() => masterStore.subjects.map(s => ({ label: s.name, value: s.id })))
const classOptions = computed(() => masterStore.classes.map(c => ({ label: c.name, value: c.id })))
const examOptions = computed(() => examStore.exams.map(e => ({ label: e.name || e.title, value: e.id })))

const schema = toTypedSchema(
  z.object({
    examId: z.number({ required_error: 'Ujian wajib dipilih' }).optional().nullable(),
    teacherId: z.number({ required_error: 'Guru wajib dipilih' }),
    subjectId: z.number({ required_error: 'Mata pelajaran wajib dipilih' }),
    classId: z.number({ required_error: 'Kelas wajib dipilih' }),
    targetChoiceQuestions: z.number({ required_error: 'Target soal PG wajib diisi' }).min(0, 'Minimal 0'),
    targetEssayQuestions: z.number({ required_error: 'Target soal Essay wajib diisi' }).min(0, 'Minimal 0')
  }).refine((data) => data.targetChoiceQuestions + data.targetEssayQuestions > 0, {
    message: 'Total target soal harus lebih dari 0',
    path: ['targetChoiceQuestions']
  })
)

const { handleSubmit, resetForm, setValues } = useForm({
  validationSchema: schema,
  initialValues: {
    examId: '',
    teacherId: '',
    subjectId: '',
    classId: '',
    targetChoiceQuestions: 40,
    targetEssayQuestions: 0
  }
})

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    if (props.assignment) {
      setValues({
        examId: props.assignment.examId,
        teacherId: props.assignment.teacherId,
        subjectId: props.assignment.subjectId,
        classId: props.assignment.classId,
        targetChoiceQuestions: props.assignment.targetChoiceQuestions || props.assignment.targetQuestions || 0,
        targetEssayQuestions: props.assignment.targetEssayQuestions || 0
      })
    } else {
      resetForm()
      setValues({ targetChoiceQuestions: 40, targetEssayQuestions: 0, examId: props.examId || '' })
    }
  }
})

const onSubmit = handleSubmit((values) => {
  if (!props.examId && !props.assignment && !values.examId) {
    return // Need an exam
  }
  emit('submit', { ...values, examId: props.examId || values.examId || (props.assignment ? props.assignment.examId : null) })
})
</script>

<template>
  <BaseModal 
    :isOpen="isOpen" 
    :title="assignment ? 'Edit Penugasan Guru' : 'Tambah Penugasan Guru'" 
    @close="emit('close')"
  >
    <form @submit="onSubmit" class="space-y-4 py-2">
      <BaseSelect 
        v-if="!props.examId && !props.assignment"
        name="examId" 
        label="Ujian"
        :options="examOptions"
      />
      
      <BaseSelect 
        name="teacherId" 
        label="Guru Pengampu"
        :options="teacherOptions"
      />
      
      <BaseSelect 
        name="subjectId" 
        label="Mata Pelajaran"
        :options="subjectOptions"
      />
      
      <BaseSelect 
        name="classId" 
        label="Kelas"
        :options="classOptions"
      />

      <div class="grid grid-cols-2 gap-4">
        <BaseInput 
          name="targetChoiceQuestions" 
          label="Target Pilihan Ganda" 
          type="number"
          min="0"
        />
        <BaseInput 
          name="targetEssayQuestions" 
          label="Target Essay" 
          type="number"
          min="0"
        />
      </div>

      <div class="pt-4 flex justify-end space-x-3 border-t border-slate-100 mt-6">
        <BaseButton variant="secondary" type="button" @click="emit('close')" :disabled="loading">Batal</BaseButton>
        <BaseButton type="submit" :loading="loading">
          {{ assignment ? 'Simpan Perubahan' : 'Tambah Penugasan' }}
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>
