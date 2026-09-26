<script setup>
import { ref, watch, computed } from 'vue'
import { Calendar, Clock, Lock, UserCheck, RefreshCw, BookOpen, AlertCircle, KeyRound, Hourglass, Timer } from 'lucide-vue-next'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseSelectSearch from '@/components/common/BaseSelectSearch.vue'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  assignments: { type: Array, default: () => [] },
  schedule: { type: Object, default: null } // For edit mode later if needed
})

const emit = defineEmits(['close', 'submit'])

const formData = ref({
  examAssignmentId: '',
  name: 'Reguler',
  startDate: '',
  startTime: '',
  endTime: '',
  durationMinutes: 90,
  lateToleranceMinutes: 15,
  token: '',
  status: 'SCHEDULED'
})

const readyAssignments = computed(() => {
  return props.assignments.filter(a => a.status === 'READY')
})

const assignmentOptions = computed(() => {
  return readyAssignments.value.map(a => ({
    label: `${a.subjectName} - Kelas ${a.className} (${a.teacherName})`,
    value: a.id
  }))
})

const generateToken = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let token = ''
  for (let i = 0; i < 6; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  formData.value.token = token
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    if (props.schedule) {
      // Edit mode (not fully implemented in MVP, but prep)
    } else {
      // Create mode
      const now = new Date()
      const tzOffset = now.getTimezoneOffset() * 60000
      const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, -1)
      
      formData.value = {
        examAssignmentId: readyAssignments.value.length === 1 ? readyAssignments.value[0].id : '',
        name: 'Reguler',
        startDate: localISOTime.split('T')[0],
        startTime: '07:00',
        endTime: '08:00',
        durationMinutes: 90,
        lateToleranceMinutes: 15,
        token: '',
        status: 'SCHEDULED'
      }
      generateToken()
    }
  }
})

const validate = () => {
  if (!formData.value.examAssignmentId) return 'Pilih penugasan guru terlebih dahulu'
  if (!formData.value.startDate || !formData.value.startTime || !formData.value.endTime) return 'Waktu pelaksanaan belum lengkap'
  if (formData.value.durationMinutes < 1) return 'Durasi harus lebih dari 0'
  if (!formData.value.token) return 'Token tidak boleh kosong'
  
  const start = new Date(`${formData.value.startDate}T${formData.value.startTime}`)
  const end = new Date(`${formData.value.startDate}T${formData.value.endTime}`)
  if (end <= start) return 'Batas akhir masuk harus lebih dari waktu mulai'
  
  return null
}

const errorMsg = ref('')

const handleSubmit = () => {
  const err = validate()
  if (err) {
    errorMsg.value = err
    return
  }
  errorMsg.value = ''
  
  const start = new Date(`${formData.value.startDate}T${formData.value.startTime}:00`)
  const end = new Date(`${formData.value.startDate}T${formData.value.endTime}:00`)
  
  const startAt = start.toISOString()
  const endAt = end.toISOString()
  
  emit('submit', {
    ...formData.value,
    startAt,
    endAt
  })
}
</script>

<template>
  <BaseModal 
    :isOpen="isOpen" 
    :title="schedule ? 'Edit Jadwal' : 'Buat Jadwal Baru'"
    maxWidth="max-w-2xl"
    @close="emit('close')"
  >
    <div class="py-2 space-y-8">
      <div v-if="errorMsg" class="flex items-start p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">
        <AlertCircle class="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
        <div>
          <p class="font-medium">Terdapat Kesalahan</p>
          <p class="mt-1 text-red-600">{{ errorMsg }}</p>
        </div>
      </div>
      
      <!-- Section 1: Informasi Penugasan -->
      <div class="space-y-4">
        <div class="flex items-center space-x-2 text-slate-800">
          <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-primary-blue">
            <BookOpen class="w-4 h-4" />
          </div>
          <h4 class="text-base font-semibold">Informasi Penugasan</h4>
        </div>
        
        <div class="bg-slate-50 p-5 rounded-xl border border-slate-100 transition-all focus-within:ring-2 focus-within:ring-primary-blue/20 focus-within:border-primary-blue/30">
          <label class="block text-sm font-medium text-slate-700 mb-2">Pilih Penugasan Guru</label>
          <BaseSelectSearch 
            v-model="formData.examAssignmentId"
            :options="assignmentOptions"
            :disabled="readyAssignments.length === 0"
            placeholder="-- Pilih Penugasan (Hanya status READY) --"
          />
          <p v-if="readyAssignments.length === 0" class="mt-3 text-xs text-red-500 flex items-center">
            <AlertCircle class="w-3.5 h-3.5 mr-1" />
            Belum ada penugasan dengan status READY (soal mencukupi).
          </p>
        </div>
      </div>

      <!-- Section 2: Waktu & Pelaksanaan -->
      <div class="space-y-4">
        <div class="flex items-center space-x-2 text-slate-800">
          <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
            <Calendar class="w-4 h-4" />
          </div>
          <h4 class="text-base font-semibold">Waktu Pelaksanaan</h4>
        </div>

        <div class="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-5">
          <!-- Date and Access Window -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Tanggal Ujian</label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors group-focus-within:text-primary-blue">
                  <Calendar class="h-4 w-4 text-slate-400 group-focus-within:text-primary-blue" />
                </div>
                <input 
                  v-model="formData.startDate"
                  type="date"
                  class="block w-full pl-10 rounded-xl border-slate-200 py-2.5 shadow-sm transition-all focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 sm:text-sm"
                >
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Buka Akses</label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors group-focus-within:text-primary-blue">
                  <Clock class="h-4 w-4 text-slate-400 group-focus-within:text-primary-blue" />
                </div>
                <input 
                  v-model="formData.startTime"
                  type="time"
                  class="block w-full pl-10 rounded-xl border-slate-200 py-2.5 shadow-sm transition-all focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 sm:text-sm"
                >
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Tutup Akses</label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors group-focus-within:text-primary-blue">
                  <Clock class="h-4 w-4 text-slate-400 group-focus-within:text-primary-blue" />
                </div>
                <input 
                  v-model="formData.endTime"
                  type="time"
                  class="block w-full pl-10 rounded-xl border-slate-200 py-2.5 shadow-sm transition-all focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 sm:text-sm"
                >
              </div>
            </div>
          </div>
          
          <div class="flex items-center space-x-2 text-xs text-slate-500 bg-white p-3 rounded-lg border border-slate-200/60">
            <AlertCircle class="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p>Siswa hanya dapat login dan memulai ujian dalam rentang waktu <strong>Buka Akses</strong> sampai <strong>Tutup Akses</strong>.</p>
          </div>

          <hr class="border-slate-200 border-dashed" />

          <!-- Duration and Tolerance -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Durasi Pengerjaan</label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Timer class="h-4 w-4 text-slate-400 group-focus-within:text-primary-blue" />
                </div>
                <input 
                  v-model="formData.durationMinutes"
                  type="number"
                  placeholder="90"
                  class="block w-full pl-10 pr-12 rounded-xl border-slate-200 py-2.5 shadow-sm transition-all focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 sm:text-sm"
                >
                <div class="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                  <span class="text-sm text-slate-400">Menit</span>
                </div>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Toleransi Terlambat</label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Hourglass class="h-4 w-4 text-slate-400 group-focus-within:text-primary-blue" />
                </div>
                <input 
                  v-model="formData.lateToleranceMinutes"
                  type="number"
                  placeholder="15"
                  class="block w-full pl-10 pr-12 rounded-xl border-slate-200 py-2.5 shadow-sm transition-all focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 sm:text-sm"
                >
                <div class="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                  <span class="text-sm text-slate-400">Menit</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 3: Keamanan -->
      <div class="space-y-4">
        <div class="flex items-center space-x-2 text-slate-800">
          <div class="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-500">
            <Lock class="w-4 h-4" />
          </div>
          <h4 class="text-base font-semibold">Keamanan Akses</h4>
        </div>

        <div class="bg-gradient-to-br from-slate-50 to-white p-5 rounded-xl border border-slate-200 shadow-[inset_0_1px_4px_rgba(0,0,0,0.02)] relative overflow-hidden">
          <div class="absolute -right-6 -top-6 w-24 h-24 bg-primary-blue/5 rounded-full blur-xl pointer-events-none"></div>
          
          <label class="block text-sm font-medium text-slate-700 mb-3">Token Ujian</label>
          <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <div class="relative flex-1 group">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <KeyRound class="h-4 w-4 text-slate-400 group-focus-within:text-primary-blue" />
              </div>
              <input 
                v-model="formData.token"
                type="text"
                class="block w-full pl-10 rounded-xl border-slate-200 py-3 shadow-sm transition-all focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 sm:text-base uppercase tracking-widest font-mono font-bold text-slate-800 placeholder-slate-300 bg-white"
                placeholder="TOKEN"
                maxlength="10"
              >
            </div>
            <button 
              type="button"
              @click="generateToken"
              class="px-5 py-3 bg-gradient-to-r from-primary-blue to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center whitespace-nowrap text-sm font-semibold group"
            >
              <RefreshCw class="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
              Generate Token
            </button>
          </div>
          <p class="mt-3 text-xs text-slate-500 flex items-center">
            <Lock class="w-3.5 h-3.5 mr-1" />
            Token ini wajib dimasukkan siswa sebelum soal dapat diakses.
          </p>
        </div>
      </div>

    </div>
    
    <template #footer>
      <div class="flex items-center justify-between w-full">
        <p class="text-xs text-slate-400 hidden sm:block">Pastikan pengaturan waktu & token sudah benar.</p>
        <div class="flex space-x-3 w-full sm:w-auto">
          <BaseButton variant="ghost" class="w-full sm:w-auto" @click="emit('close')" :disabled="loading">Batal</BaseButton>
          <BaseButton class="w-full sm:w-auto group relative overflow-hidden" @click="handleSubmit" :loading="loading" :disabled="readyAssignments.length === 0">
            <span class="relative z-10 flex items-center">
              Simpan & Generate
            </span>
          </BaseButton>
        </div>
      </div>
    </template>
  </BaseModal>
</template>
