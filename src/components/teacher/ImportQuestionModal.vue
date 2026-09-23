<script setup>
import { ref } from 'vue'
import * as XLSX from 'xlsx'
import { UploadCloud, Download, FileSpreadsheet } from 'lucide-vue-next'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close', 'import-success'])

const fileInput = ref(null)
const selectedFile = ref(null)
const isUploading = ref(false)
const isDownloadingTemplate = ref(false)

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    // Check if it's an excel file (mock validation)
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      selectedFile.value = file
    } else {
      alert('Harap unggah file Excel (.xlsx atau .xls)')
      event.target.value = ''
    }
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const downloadTemplate = () => {
  const data = [
    {
      'Jenis Soal': 'Pilihan Ganda',
      'Pertanyaan': 'Apa ibu kota Indonesia?',
      'Kunci Jawaban': 'A',
      'Bobot': 1,
      'Opsi A': 'Jakarta',
      'Opsi B': 'Bandung',
      'Opsi C': 'Surabaya',
      'Opsi D': 'Medan',
      'Opsi E': 'Semarang'
    },
    {
      'Jenis Soal': 'Esai',
      'Pertanyaan': 'Jelaskan pengertian dari fotosintesis!',
      'Kunci Jawaban': 'Proses pembuatan makanan pada tumbuhan...',
      'Bobot': 2
    }
  ]
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Template_Soal')
  XLSX.writeFile(wb, 'Template_Impor_Soal.xlsx')
}

const importData = () => {
  if (!selectedFile.value) return
  isUploading.value = true
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      const parsedQuestions = jsonData.map(row => {
        const type = row['Jenis Soal']?.toLowerCase() === 'esai' ? 'ESSAY' : 'SINGLE_CHOICE'
        const options = []
        let answerKey = null
        const correctAnswerString = String(row['Kunci Jawaban'] || '').toUpperCase()
        
        if (type === 'SINGLE_CHOICE') {
          ['A', 'B', 'C', 'D', 'E'].forEach(key => {
            if (row[`Opsi ${key}`] !== undefined && row[`Opsi ${key}`] !== '') {
              options.push({
                key,
                text: String(row[`Opsi ${key}`]),
                isCorrect: key === correctAnswerString
              })
            }
          })
        } else {
          answerKey = { modelAnswer: String(row['Kunci Jawaban'] || '') }
        }
        
        return {
          questionType: type,
          questionText: String(row['Pertanyaan'] || ''),
          score: Number(row['Bobot'] || 1),
          options: type === 'SINGLE_CHOICE' ? options : undefined,
          answerKey: type === 'ESSAY' ? answerKey : undefined
        }
      })
      
      emit('import-success', { filename: selectedFile.value.name, questions: parsedQuestions })
      reset()
    } catch (err) {
      alert('Gagal memproses file Excel. Pastikan format sesuai template.')
    } finally {
      isUploading.value = false
    }
  }
  reader.onerror = () => {
    alert('Terjadi kesalahan saat membaca file')
    isUploading.value = false
  }
  reader.readAsArrayBuffer(selectedFile.value)
}

const reset = () => {
  selectedFile.value = null
  if (fileInput.value) fileInput.value.value = ''
}

const handleClose = () => {
  reset()
  emit('close')
}
</script>

<template>
  <BaseModal 
    :isOpen="isOpen" 
    title="Impor Soal dari Excel" 
    @close="handleClose"
    maxWidth="max-w-xl"
  >
    <div class="py-4 space-y-6">
      
      <!-- Step 1: Download Template -->
      <div class="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-4">
        <div class="bg-blue-100 text-primary-blue p-2 rounded-lg shrink-0 mt-1">
          <FileSpreadsheet class="w-5 h-5" />
        </div>
        <div>
          <h3 class="font-bold text-slate-800 text-sm">Langkah 1: Unduh Template</h3>
          <p class="text-slate-600 text-sm mt-1 mb-3">
            Untuk mengimpor soal, Anda harus menggunakan format template Excel yang telah kami sediakan.
          </p>
          <BaseButton 
            variant="outline" 
            size="sm" 
            class="bg-white border-primary-blue text-primary-blue hover:bg-blue-50"
            @click="downloadTemplate"
            :loading="isDownloadingTemplate"
          >
            <Download class="w-4 h-4 mr-2" />
            Unduh Template Excel
          </BaseButton>
        </div>
      </div>

      <!-- Step 2: Upload File -->
      <div>
        <h3 class="font-bold text-slate-800 text-sm mb-3">Langkah 2: Unggah File Excel</h3>
        
        <div 
          class="border-2 border-dashed rounded-xl p-8 text-center transition-colors relative"
          :class="selectedFile ? 'border-primary-blue bg-blue-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100'"
        >
          <input 
            type="file" 
            ref="fileInput"
            accept=".xlsx, .xls"
            class="hidden"
            @change="handleFileSelect"
          >
          
          <div v-if="!selectedFile" class="flex flex-col items-center cursor-pointer" @click="triggerFileInput">
            <UploadCloud class="w-10 h-10 text-slate-400 mb-3" />
            <p class="text-sm font-medium text-slate-700">Klik untuk memilih file Excel</p>
            <p class="text-xs text-slate-500 mt-1">Hanya mendukung format .xlsx atau .xls</p>
          </div>
          
          <div v-else class="flex flex-col items-center">
            <FileSpreadsheet class="w-10 h-10 text-primary-blue mb-3" />
            <p class="text-sm font-bold text-slate-800">{{ selectedFile.name }}</p>
            <p class="text-xs text-slate-500 mt-1 mb-4">{{ (selectedFile.size / 1024).toFixed(2) }} KB</p>
            
            <button 
              @click="triggerFileInput"
              class="text-xs font-semibold text-primary-blue hover:underline"
              :disabled="isUploading"
            >
              Ganti File
            </button>
          </div>
        </div>
      </div>

    </div>

    <template #footer>
      <div class="flex justify-end gap-3 w-full">
        <BaseButton variant="secondary" @click="handleClose" :disabled="isUploading">Batal</BaseButton>
        <BaseButton 
          variant="primary" 
          @click="importData" 
          :disabled="!selectedFile || isUploading"
          :loading="isUploading"
        >
          Mulai Impor Data
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
