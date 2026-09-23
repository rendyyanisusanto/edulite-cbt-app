<script setup>
import { watch, computed } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'
import { useMasterStore } from '@/stores/master'

import BaseModal from '@/components/common/BaseModal.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const props = defineProps({
  isOpen: Boolean,
  loading: Boolean,
  exam: Object
})

const emit = defineEmits(['close', 'submit'])

const masterStore = useMasterStore()
const academicYearOptions = computed(() => masterStore.academicYears.map(ay => ({ label: ay.name, value: ay.id })))

const schema = toTypedSchema(
  z.object({
    title: z.string().min(1, 'Nama ujian wajib diisi'),
    code: z.string().min(1, 'Kode ujian wajib diisi'),
    academicYearId: z.number({ required_error: 'Tahun ajaran wajib dipilih' }),
    semester: z.string().min(1, 'Semester wajib dipilih'),
    examType: z.string().min(1, 'Jenis ujian wajib dipilih'),
    description: z.string().nullable().optional(),
    instructions: z.string().nullable().optional(),
    status: z.string().min(1, 'Status wajib dipilih')
  })
)

const { handleSubmit, resetForm, setValues, setFieldValue } = useForm({
  validationSchema: schema,
  initialValues: {
    title: '',
    code: '',
    academicYearId: '',
    semester: '',
    examType: '',
    description: '',
    instructions: '',
    status: 'DRAFT'
  }
})

// Auto uppercase and replace spaces with hyphen for code
const handleCodeInput = (e) => {
  const val = e.target.value.toUpperCase().replace(/\s+/g, '-')
  setFieldValue('code', val)
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    if (props.exam) {
      setValues({
        title: props.exam.title,
        code: props.exam.code,
        academicYearId: props.exam.academicYearId,
        semester: props.exam.semester,
        examType: props.exam.exam_type || props.exam.examType || '',
        description: props.exam.description || '',
        instructions: props.exam.instructions || '',
        status: props.exam.status || 'DRAFT'
      })
    } else {
      resetForm()
      setValues({ status: 'DRAFT' })
    }
  }
})

const onSubmit = handleSubmit((values) => {
  emit('submit', values)
})
</script>

<template>
  <BaseModal 
    :isOpen="isOpen" 
    :title="exam ? 'Edit Ujian' : 'Buat Ujian Baru'" 
    @close="emit('close')"
  >
    <form @submit="onSubmit" class="space-y-4 py-2">
      <BaseInput 
        name="title" 
        label="Nama Ujian" 
        placeholder="Contoh: PTS Ganjil"
      />
      
      <div class="grid grid-cols-2 gap-4">
        <BaseInput 
          name="code" 
          label="Kode Ujian" 
          placeholder="Contoh: PTS-GANJIL-2026"
          @input="handleCodeInput"
        />
        <BaseSelect 
          name="examType" 
          label="Jenis Ujian"
          :options="[
            { label: 'UTS', value: 'UTS' },
            { label: 'UAS', value: 'UAS' },
            { label: 'TRYOUT', value: 'TRYOUT' },
            { label: 'QUIZ', value: 'QUIZ' }
          ]"
        />
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <BaseSelect 
          name="academicYearId" 
          label="Tahun Ajaran"
          :options="academicYearOptions"
        />
        <BaseSelect 
          name="semester" 
          label="Semester"
          :options="[
            { label: 'Ganjil', value: 'Ganjil' },
            { label: 'Genap', value: 'Genap' }
          ]"
        />
      </div>

      <BaseSelect 
        name="status" 
        label="Status Ujian"
        :options="[
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Siap (Ready)', value: 'READY' },
          { label: 'Dipublikasikan', value: 'PUBLISHED' },
          { label: 'Selesai', value: 'FINISHED' }
        ]"
      />

      <div class="pt-4 flex justify-end space-x-3 border-t border-slate-100 mt-6">
        <BaseButton variant="secondary" type="button" @click="emit('close')" :disabled="loading">Batal</BaseButton>
        <BaseButton type="submit" :loading="loading">
          {{ exam ? 'Simpan Perubahan' : 'Simpan Ujian' }}
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>
