<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, CheckCircle2, ChevronRight, AlertCircle, Save } from 'lucide-vue-next'
import api from '@/services/api'
import BaseButton from '@/components/common/BaseButton.vue'

const route = useRoute()
const router = useRouter()
const assignmentId = route.params.assignmentId

const pendingEssays = ref([])
const currentIndex = ref(0)
const loading = ref(true)
const saving = ref(false)
const error = ref(null)

const scoreInput = ref('')
const feedbackInput = ref('')

const fetchPendingEssays = async () => {
  loading.value = true
  try {
    const { data } = await api.get(`/teacher/assignments/${assignmentId}/essay-pending`)
    pendingEssays.value = data.data
    if (pendingEssays.value.length > 0) {
      currentIndex.value = 0
      scoreInput.value = ''
      feedbackInput.value = ''
    }
  } catch (err) {
    error.value = 'Gagal memuat antrean essay.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPendingEssays()
})

const currentEssay = computed(() => pendingEssays.value[currentIndex.value])
const totalPending = computed(() => pendingEssays.value.length)

const saveAndNext = async () => {
  if (!currentEssay.value) return
  
  const score = Number(scoreInput.value)
  if (isNaN(score) || score < 0 || score > currentEssay.value.max_score) {
    alert(`Nilai harus antara 0 dan ${currentEssay.value.max_score}`)
    return
  }

  saving.value = true
  try {
    await api.put(`/teacher/answers/${currentEssay.value.answerId}/grade`, {
      score,
      feedback: feedbackInput.value
    })
    
    // Remove current from list
    pendingEssays.value.splice(currentIndex.value, 1)
    
    // Reset inputs
    scoreInput.value = ''
    feedbackInput.value = ''
    
    // If list is empty, go back
    if (pendingEssays.value.length === 0) {
      router.push(`/teacher/assignments/${assignmentId}/results`)
    }
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.message || 'Gagal menyimpan nilai')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="h-full flex flex-col max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <nav class="flex items-center text-sm font-medium text-slate-500 mb-2">
          <button @click="router.push(`/teacher/assignments/${assignmentId}/results`)" class="hover:text-slate-800 flex items-center transition-colors">
            <ArrowLeft class="w-4 h-4 mr-1" />
            Kembali ke Hasil Ujian
          </button>
        </nav>
        <h1 class="text-2xl font-bold text-slate-900 leading-tight">Penilaian Essay</h1>
      </div>
      <div v-if="!loading && totalPending > 0" class="text-right">
        <p class="text-sm text-slate-500 font-medium mb-1">Tersisa</p>
        <p class="text-xl font-bold text-slate-800">{{ totalPending }} Jawaban</p>
      </div>
    </div>

    <!-- Loading / Error / Empty States -->
    <div v-if="loading" class="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-4 text-slate-500 font-medium">Memuat antrean essay...</p>
    </div>
    
    <div v-else-if="error" class="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 text-center font-semibold">
      {{ error }}
    </div>
    
    <div v-else-if="totalPending === 0" class="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200 flex flex-col items-center">
      <div class="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
        <CheckCircle2 class="w-10 h-10" />
      </div>
      <h3 class="text-2xl font-bold text-slate-900">Selesai!</h3>
      <p class="text-slate-500 mt-2">Semua soal essay telah selesai dinilai.</p>
      <BaseButton @click="router.push(`/teacher/assignments/${assignmentId}/results`)" variant="primary" class="mt-6">
        Kembali ke Daftar Hasil
      </BaseButton>
    </div>
    
    <!-- Grading Interface -->
    <div v-else class="flex flex-col gap-6">
      <!-- Student Info -->
      <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
          {{ currentEssay.studentName.charAt(0).toUpperCase() }}
        </div>
        <div>
          <h2 class="font-bold text-slate-900 text-lg">{{ currentEssay.studentName }}</h2>
          <p class="text-slate-500 text-sm">NISN: {{ currentEssay.nisn || '-' }}</p>
        </div>
      </div>
      
      <!-- Question & Answer -->
      <div class="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
        <div class="p-6 bg-slate-50 border-b border-slate-200">
          <div class="flex items-center gap-2 mb-3">
            <span class="px-2.5 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-md uppercase tracking-wider">Soal Essay</span>
          </div>
          <div class="prose max-w-none text-slate-800" v-html="currentEssay.question_text"></div>
        </div>
        <div class="p-6">
          <h3 class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Jawaban Siswa</h3>
          <div class="p-5 bg-blue-50 border border-blue-100 rounded-xl text-slate-800 min-h-[120px] whitespace-pre-wrap">
            {{ currentEssay.answer_text || '(Tidak menjawab)' }}
          </div>
        </div>
      </div>
      
      <!-- Grading Form -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h3 class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Form Penilaian</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Score Input -->
          <div class="md:col-span-1 border-r border-slate-100 pr-0 md:pr-6">
            <label class="block text-sm font-bold text-slate-700 mb-2">Nilai</label>
            <div class="relative">
              <input 
                type="number" 
                v-model="scoreInput"
                class="w-full text-3xl font-black text-slate-900 py-3 px-4 border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all text-center"
                placeholder="0"
                min="0"
                :max="currentEssay.max_score"
              />
              <div class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                / {{ currentEssay.max_score }}
              </div>
            </div>
            <p class="text-xs text-slate-500 mt-2 font-medium flex items-start gap-1">
              <AlertCircle class="w-4 h-4 shrink-0" />
              Nilai maksimal adalah {{ currentEssay.max_score }}
            </p>
          </div>
          
          <!-- Feedback Input -->
          <div class="md:col-span-2">
            <label class="block text-sm font-bold text-slate-700 mb-2">Umpan Balik (Opsional)</label>
            <textarea 
              v-model="feedbackInput"
              class="w-full h-[120px] p-4 border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all resize-none text-slate-700 placeholder-slate-400"
              placeholder="Berikan umpan balik atau catatan untuk jawaban siswa..."
            ></textarea>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="mt-8 flex justify-end">
          <BaseButton 
            @click="saveAndNext"
            :disabled="saving || scoreInput === ''"
            variant="primary"
            class="px-8 py-3 bg-green-600 hover:bg-green-700 border-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-600/20 w-full sm:w-auto flex justify-center text-lg"
          >
            <span v-if="saving" class="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-2"></span>
            <Save v-else class="w-5 h-5 mr-2" />
            {{ saving ? 'Menyimpan...' : 'Simpan & Berikutnya' }}
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>
