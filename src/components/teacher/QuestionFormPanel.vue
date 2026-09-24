<script setup>
import { ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'
import { Save, Plus } from 'lucide-vue-next'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseWysiwyg from '@/components/common/BaseWysiwyg.vue'
import { Image as ImageIcon, X as XIcon } from 'lucide-vue-next'
import api from '@/services/api'

const props = defineProps({
  isOpen: Boolean,
  loading: Boolean,
  question: Object, // null if creating new
  assignmentId: Number
})

const emit = defineEmits(['close', 'submit', 'submit-and-add'])

const isDirty = ref(false)
const imageBase64 = ref('')
const imageError = ref('')

// Dynamic schema based on question type
const schema = toTypedSchema(
  z.object({
    type: z.enum(['pilihan_ganda', 'esai']),
    questionText: z.string().min(1, 'Pertanyaan wajib diisi').refine(val => val !== '<p><br></p>', 'Pertanyaan wajib diisi'),
    optionA: z.string().optional(),
    optionB: z.string().optional(),
    optionC: z.string().optional(),
    optionD: z.string().optional(),
    optionE: z.string().optional(),
    correctAnswerPG: z.string().optional(),
    correctAnswerEssay: z.string().optional(),
    weight: z.number().min(1, 'Bobot minimal 1')
  }).superRefine((data, ctx) => {
    if (data.type === 'pilihan_ganda') {
      if (!data.optionA) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Pilihan A wajib diisi', path: ['optionA'] })
      if (!data.optionB) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Pilihan B wajib diisi', path: ['optionB'] })
      if (!data.optionC) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Pilihan C wajib diisi', path: ['optionC'] })
      if (!data.optionD) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Pilihan D wajib diisi', path: ['optionD'] })
      if (!data.correctAnswerPG) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Kunci jawaban wajib dipilih', path: ['correctAnswerPG'] })
    }
  })
)

const { handleSubmit, resetForm, setValues, values, meta } = useForm({
  validationSchema: schema,
  initialValues: {
    type: 'pilihan_ganda',
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    optionE: '',
    correctAnswerPG: 'A',
    correctAnswerEssay: '',
    weight: 1
  }
})

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    if (props.question) {
      const type = props.question.questionType === 'ESSAY' ? 'esai' : 'pilihan_ganda'
      const opts = props.question.options || []
      
      setValues({
        type: type,
        questionText: props.question.questionText || '',
        optionA: opts.find(o => o.key === 'A')?.text || '',
        optionB: opts.find(o => o.key === 'B')?.text || '',
        optionC: opts.find(o => o.key === 'C')?.text || '',
        optionD: opts.find(o => o.key === 'D')?.text || '',
        optionE: opts.find(o => o.key === 'E')?.text || '',
        correctAnswerPG: type === 'pilihan_ganda' ? (opts.find(o => o.isCorrect)?.key || 'A') : 'A',
        correctAnswerEssay: type === 'esai' ? (props.question.answerKey?.modelAnswer || '') : '',
        weight: props.question.score || 1
      })
      imageBase64.value = props.question.mediaUrl || ''
    } else {
      resetForm()
      imageBase64.value = ''
    }
    imageError.value = ''
    // Small delay to allow the editor to settle before marking dirty checks
    setTimeout(() => {
      isDirty.value = false
    }, 100)
  }
})

const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  if (file.size > 2 * 1024 * 1024) {
    imageError.value = 'Ukuran gambar maksimal 2MB'
    return
  }
  
  imageError.value = ''
  
  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = (e) => {
    const img = new Image()
    img.src = e.target.result
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const MAX_WIDTH = 800
      const MAX_HEIGHT = 800
      let width = img.width
      let height = img.height

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width
          width = MAX_WIDTH
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height
          height = MAX_HEIGHT
        }
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      imageBase64.value = canvas.toDataURL('image/jpeg', 0.7)
    }
  }
}

const removeImage = () => {
  imageBase64.value = ''
  imageError.value = ''
}

// Track dirtiness manually to warn user on close
watch(values, () => {
  isDirty.value = meta.value.dirty
}, { deep: true })

const handleClose = () => {
  if (isDirty.value) {
    if (confirm('Ada perubahan yang belum disimpan. Keluar tanpa menyimpan?')) {
      emit('close')
    }
  } else {
    emit('close')
  }
}

const buildSubmitPayload = (formValues, mediaUrl) => {
  const payload = {
    questionType: formValues.type === 'esai' ? 'ESSAY' : 'SINGLE_CHOICE',
    questionText: formValues.questionText,
    score: formValues.weight,
    mediaUrl: mediaUrl || null
  }

  if (formValues.type === 'pilihan_ganda') {
    payload.options = [
      { key: 'A', text: formValues.optionA, isCorrect: formValues.correctAnswerPG === 'A' },
      { key: 'B', text: formValues.optionB, isCorrect: formValues.correctAnswerPG === 'B' },
      { key: 'C', text: formValues.optionC, isCorrect: formValues.correctAnswerPG === 'C' },
      { key: 'D', text: formValues.optionD, isCorrect: formValues.correctAnswerPG === 'D' },
      { key: 'E', text: formValues.optionE || '', isCorrect: formValues.correctAnswerPG === 'E' }
    ].filter(o => o.text !== '')
  } else {
    payload.answerKey = { modelAnswer: formValues.correctAnswerEssay }
  }

  return payload
}

const uploadImageIfNew = async () => {
  if (imageBase64.value && imageBase64.value.startsWith('data:image/')) {
    try {
      const { data } = await api.post('/upload/image', { image: imageBase64.value })
      return data.data.url
    } catch (e) {
      console.error(e)
      imageError.value = e.message || 'Gagal menyimpan gambar ke server'
      throw e
    }
  }
  return imageBase64.value
}

const onSubmit = handleSubmit(async (formValues) => {
  try {
    const mediaUrl = await uploadImageIfNew()
    emit('submit', buildSubmitPayload(formValues, mediaUrl))
  } catch (e) {
    // Error handled in uploadImageIfNew
  }
})

const onSubmitAndAdd = handleSubmit(async (formValues) => {
  try {
    const mediaUrl = await uploadImageIfNew()
    emit('submit-and-add', buildSubmitPayload(formValues, mediaUrl))
  } catch (e) {
    // Error handled in uploadImageIfNew
  }
})
</script>

<template>
  <BaseModal 
    :isOpen="isOpen" 
    :title="question ? 'Edit Soal' : 'Tambah Soal'"
    @close="handleClose"
    maxWidth="max-w-4xl"
  >
    <div class="py-4">
      <form @submit.prevent class="space-y-6 max-h-[70vh] overflow-y-auto px-1 scrollbar-thin">
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Tipe Soal -->
          <BaseSelect 
            name="type"
            label="Tipe Soal"
            :options="[
              { label: 'Pilihan Ganda', value: 'pilihan_ganda' },
              { label: 'Esai', value: 'esai' }
            ]"
          />
          
          <!-- Bobot -->
          <BaseInput 
            name="weight"
            label="Bobot Nilai"
            type="number"
            min="1"
          />
        </div>

        <!-- Pertanyaan -->
        <div class="mt-4">
          <BaseWysiwyg 
            name="questionText" 
            label="Pertanyaan" 
            placeholder="Tuliskan isi pertanyaan di sini..."
            minHeight="min-h-[160px]"
          />
        </div>

        <!-- Gambar Soal -->
        <div class="mt-4">
          <label class="block mb-1.5 text-sm font-medium text-slate-700">Gambar Soal (Opsional)</label>
          <div v-if="imageBase64" class="relative inline-block mt-2">
            <img :src="imageBase64" class="max-h-48 rounded-lg border border-slate-200" />
            <button type="button" @click="removeImage" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
              <XIcon class="w-4 h-4" />
            </button>
          </div>
          <div v-else class="mt-2 flex items-center justify-center w-full">
            <label class="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100">
              <div class="flex flex-col items-center justify-center pt-5 pb-6">
                <ImageIcon class="w-8 h-8 mb-2 text-slate-400" />
                <p class="mb-1 text-sm text-slate-500"><span class="font-semibold">Klik untuk upload</span> gambar soal</p>
                <p class="text-xs text-slate-500">Maks. ukuran 2MB (JPEG, PNG)</p>
              </div>
              <input type="file" class="hidden" accept="image/jpeg, image/png, image/jpg" @change="handleImageUpload" />
            </label>
          </div>
          <p v-if="imageError" class="mt-1 text-sm text-red-500">{{ imageError }}</p>
        </div>

        <!-- Mode Pilihan Ganda -->
        <div v-if="values.type === 'pilihan_ganda'" class="space-y-4 pt-4 border-t border-slate-100">
          <h3 class="text-sm font-semibold text-slate-700">Pilihan Jawaban</h3>
          
          <div class="flex items-start gap-3">
            <div class="w-8 h-10 flex items-center justify-center font-bold text-slate-500 shrink-0">A</div>
            <div class="flex-1"><BaseInput name="optionA" placeholder="Masukkan Pilihan A" /></div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-8 h-10 flex items-center justify-center font-bold text-slate-500 shrink-0">B</div>
            <div class="flex-1"><BaseInput name="optionB" placeholder="Masukkan Pilihan B" /></div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-8 h-10 flex items-center justify-center font-bold text-slate-500 shrink-0">C</div>
            <div class="flex-1"><BaseInput name="optionC" placeholder="Masukkan Pilihan C" /></div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-8 h-10 flex items-center justify-center font-bold text-slate-500 shrink-0">D</div>
            <div class="flex-1"><BaseInput name="optionD" placeholder="Masukkan Pilihan D" /></div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-8 h-10 flex items-center justify-center font-bold text-slate-400 shrink-0">E</div>
            <div class="flex-1"><BaseInput name="optionE" placeholder="Masukkan Pilihan E (Opsional)" /></div>
          </div>

          <div class="w-1/2 pt-2">
            <BaseSelect 
              name="correctAnswerPG"
              label="Kunci Jawaban"
              :options="[
                { label: 'Pilihan A', value: 'A' },
                { label: 'Pilihan B', value: 'B' },
                { label: 'Pilihan C', value: 'C' },
                { label: 'Pilihan D', value: 'D' },
                { label: 'Pilihan E', value: 'E' }
              ]"
            />
          </div>
        </div>

        <!-- Mode Esai -->
        <div v-if="values.type === 'esai'" class="pt-4 border-t border-slate-100">
          <BaseWysiwyg 
            name="correctAnswerEssay" 
            label="Rubrik Penilaian / Kunci Jawaban (Opsional)" 
            placeholder="Tuliskan referensi jawaban yang benar untuk acuan penilaian..."
            minHeight="min-h-[120px]"
          />
        </div>
      </form>
    </div>

    <!-- Footer Actions -->
    <template #footer>
      <div class="flex flex-col sm:flex-row justify-between gap-3 w-full">
        <BaseButton variant="secondary" @click="handleClose" :disabled="loading" class="order-3 sm:order-1">
          Batal
        </BaseButton>
        <div class="flex flex-col sm:flex-row gap-3 order-1 sm:order-2">
          <BaseButton variant="primary" @click="onSubmit" :loading="loading" class="flex-1 sm:flex-none justify-center">
            <Save class="w-4 h-4 mr-2" />
            Simpan & Tutup
          </BaseButton>
          <BaseButton 
            v-if="!question"
            variant="outline" 
            @click="onSubmitAndAdd" 
            :disabled="loading"
            class="flex-1 sm:flex-none justify-center border-primary-blue text-primary-blue hover:bg-blue-50"
          >
            <Plus class="w-4 h-4 mr-2" />
            Simpan & Tambah Lagi
          </BaseButton>
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 20px;
}
</style>
