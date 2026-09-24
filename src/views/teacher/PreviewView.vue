<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAssignmentStore } from '@/stores/assignment'
import { useQuestionStore } from '@/stores/question'
import { useUiStore } from '@/stores/ui'
import { storeToRefs } from 'pinia'
import { 
  ArrowLeft, 
  ArrowRight,
  Edit,
  Eye,
  AlertCircle
} from 'lucide-vue-next'
import BaseButton from '@/components/common/BaseButton.vue'
import Skeleton from '@/components/common/Skeleton.vue'
import QuestionFormPanel from '@/components/teacher/QuestionFormPanel.vue'

const route = useRoute()
const router = useRouter()
const assignmentStore = useAssignmentStore()
const questionStore = useQuestionStore()
const uiStore = useUiStore()

const { questions, loading: questionsLoading } = storeToRefs(questionStore)

const assignmentId = computed(() => Number(route.params.id))
const assignment = ref(null)

const assignmentQuestions = computed(() => questionStore.getQuestionsByAssignment(assignmentId.value))

const currentIndex = ref(0)
const currentQuestion = computed(() => assignmentQuestions.value[currentIndex.value])

const showKey = ref(false)

// Edit Panel
const isPanelOpen = ref(false)
const isSubmitting = ref(false)

const handleEditClick = () => {
  isPanelOpen.value = true
}

const handlePanelSubmit = async (payload) => {
  isSubmitting.value = true
  try {
    await questionStore.updateQuestion(currentQuestion.value.id, payload)
    uiStore.addToast('Soal berhasil diperbarui', 'success')
    isPanelOpen.value = false
  } catch (error) {
    uiStore.addToast(error.message, 'error')
  } finally {
    isSubmitting.value = false
  }
}

const goToNext = () => {
  if (currentIndex.value < assignmentQuestions.value.length - 1) {
    currentIndex.value++
  }
}

const goToPrev = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

onMounted(async () => {
  try {
    assignment.value = await assignmentStore.fetchTeacherAssignmentById(assignmentId.value)
    await questionStore.fetchQuestionsByAssignment(assignmentId.value)
  } catch(e) {
    console.error(e)
  }
})
</script>

<template>
  <div class="h-full flex flex-col max-w-5xl mx-auto">
    
    <!-- Header -->
    <div class="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row justify-between sm:items-start gap-4">
      <div>
        <nav class="flex items-center text-sm font-medium text-slate-500 mb-2">
          <button @click="router.push(`/teacher/assignments/${assignmentId}`)" class="hover:text-slate-800 flex items-center transition-colors">
            <ArrowLeft class="w-4 h-4 mr-1" />
            Kembali
          </button>
        </nav>
        <h1 class="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
          Preview: {{ assignment?.subject?.name }}
        </h1>
        <p class="text-slate-600 mt-1">{{ assignment?.class?.name }} &mdash; {{ assignment?.exam?.title }}</p>
      </div>
      <div class="flex flex-col items-end gap-3">
        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <Eye class="w-3.5 h-3.5 mr-1.5" /> MODE PREVIEW
        </span>
        <label class="flex items-center space-x-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <input type="checkbox" v-model="showKey" class="rounded text-primary-blue focus:ring-primary-blue h-4 w-4">
          <span class="text-sm font-medium text-slate-700">Tampilkan Kunci Jawaban</span>
        </label>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!questionsLoading && assignmentQuestions.length === 0" class="bg-white p-12 rounded-xl border border-slate-200 text-center shadow-sm">
      <div class="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle class="w-8 h-8" />
      </div>
      <h3 class="text-lg font-bold text-slate-800">Tidak Ada Soal</h3>
      <p class="text-slate-500 mt-1 mb-6">Belum ada soal yang ditambahkan untuk preview.</p>
      <BaseButton @click="router.push(`/teacher/assignments/${assignmentId}/questions`)">
        Ke Halaman Kelola Soal
      </BaseButton>
    </div>

    <!-- Loading State -->
    <div v-else-if="questionsLoading" class="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <Skeleton type="text" :lines="4" />
    </div>

    <!-- Preview Content -->
    <div v-else class="flex-1 flex flex-col lg:flex-row gap-6 relative pb-20 lg:pb-0">
      
      <!-- Main Question Panel -->
      <div class="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div class="p-6 sm:p-8 flex-1">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-lg font-bold text-slate-800">Soal {{ currentIndex + 1 }} dari {{ assignmentQuestions.length }}</h2>
            <BaseButton variant="outline" size="sm" @click="handleEditClick">
              <Edit class="w-4 h-4 mr-1.5" /> Edit Soal Ini
            </BaseButton>
          </div>
          
          <div class="prose max-w-none mb-8">
            <div class="flex items-center gap-2 mb-4">
              <span class="text-xs font-bold px-2 py-0.5 rounded" :class="currentQuestion.questionType === 'ESSAY' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'">
                {{ currentQuestion.questionType === 'ESSAY' ? 'Esai' : 'Pilihan Ganda' }}
              </span>
            </div>
            <div class="text-lg text-slate-800 leading-relaxed" v-html="currentQuestion.questionText"></div>
            
            <div v-if="currentQuestion.mediaUrl" class="mt-4 mb-6">
              <img :src="currentQuestion.mediaUrl" alt="Gambar Soal" class="max-h-64 rounded-lg border border-slate-200 shadow-sm object-contain" />
            </div>
          </div>

          <div class="space-y-3">
            <template v-if="currentQuestion.questionType !== 'ESSAY'">
              <div 
                v-for="opt in currentQuestion.options" 
                :key="opt.key"
                class="flex items-start p-4 rounded-xl border-2 transition-colors relative"
                :class="[
                  showKey && opt.isCorrect 
                    ? 'bg-green-50 border-green-400' 
                    : 'bg-white border-slate-100 hover:border-slate-200'
                ]"
              >
                <!-- Mock radio button to look like student UI -->
                <div class="flex-shrink-0 mt-0.5 mr-4">
                  <div 
                    class="w-5 h-5 rounded-full border flex items-center justify-center"
                    :class="showKey && opt.isCorrect ? 'border-green-600 bg-green-100' : 'border-slate-300'"
                  >
                    <div v-if="showKey && opt.isCorrect" class="w-2.5 h-2.5 bg-green-600 rounded-full"></div>
                  </div>
                </div>
                <span class="font-bold mr-3 text-slate-700">{{ opt.key }}.</span>
                <div class="flex-1 text-slate-700 min-w-0 pr-24">
                  <div class="prose max-w-none" v-html="opt.text"></div>
                  <div v-if="opt.mediaUrl" class="mt-3">
                    <img :src="opt.mediaUrl" alt="Gambar Pilihan" class="max-h-32 rounded-lg border border-slate-200 shadow-sm object-contain" />
                  </div>
                </div>
                
                <div v-if="showKey && opt.isCorrect" class="absolute right-4 top-1/2 -translate-y-1/2">
                  <span class="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">Jawaban Benar</span>
                </div>
              </div>
            </template>

            <!-- Esai Preview -->
            <template v-else>
              <div class="p-4 border border-slate-200 rounded-xl bg-slate-50 mb-4">
                <p class="text-sm text-slate-500 mb-2">Area Jawaban Siswa (Simulasi):</p>
                <textarea 
                  class="w-full border border-slate-300 rounded-lg p-3 min-h-[150px] bg-white text-slate-700 outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue"
                  placeholder="Ketik jawaban di sini..."
                ></textarea>
              </div>

              <div v-if="showKey" class="p-4 border border-purple-200 rounded-xl bg-purple-50">
                <p class="text-xs font-bold text-purple-700 mb-2 uppercase tracking-wider">Rubrik Penilaian / Kunci Jawaban</p>
                <div class="prose prose-sm max-w-none text-slate-700" v-html="currentQuestion.answerKey?.modelAnswer || '<em>Tidak ada rubrik.</em>'"></div>
              </div>
            </template>
          </div>
        </div>

        <!-- Navigation Footer -->
        <div class="bg-slate-50 border-t border-slate-200 p-4 sm:p-6 flex justify-between items-center">
          <BaseButton 
            variant="secondary" 
            :disabled="currentIndex === 0"
            @click="goToPrev"
          >
            <ArrowLeft class="w-4 h-4 mr-2" /> Sebelumnya
          </BaseButton>
          
          <BaseButton 
            variant="primary" 
            :disabled="currentIndex === assignmentQuestions.length - 1"
            @click="goToNext"
          >
            Selanjutnya <ArrowRight class="w-4 h-4 ml-2" />
          </BaseButton>
        </div>
      </div>

      <!-- Desktop Navigator -->
      <div class="hidden lg:block w-72 shrink-0">
        <div class="sticky top-6 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 class="font-bold text-slate-800 mb-4">Navigasi Soal</h3>
          <div class="grid grid-cols-5 gap-2">
            <button 
              v-for="(q, idx) in assignmentQuestions" 
              :key="q.id"
              @click="currentIndex = idx"
              class="h-10 rounded border text-sm font-medium transition-colors"
              :class="[
                currentIndex === idx 
                  ? 'bg-primary-blue text-white border-primary-blue' 
                  : 'border-slate-200 text-slate-600 hover:border-primary-blue hover:text-primary-blue hover:bg-blue-50'
              ]"
            >
              {{ idx + 1 }}
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Navigator (bottom bar) -->
      <div class="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 flex overflow-x-auto gap-2">
        <button 
          v-for="(q, idx) in assignmentQuestions" 
          :key="q.id"
          @click="currentIndex = idx"
          class="h-10 w-10 shrink-0 rounded border text-sm font-medium transition-colors"
          :class="[
            currentIndex === idx 
              ? 'bg-primary-blue text-white border-primary-blue' 
              : 'border-slate-200 text-slate-600'
          ]"
        >
          {{ idx + 1 }}
        </button>
      </div>

    </div>

    <!-- Edit Panel -->
    <QuestionFormPanel 
      :isOpen="isPanelOpen"
      :question="currentQuestion"
      :assignmentId="assignmentId"
      :loading="isSubmitting"
      @close="isPanelOpen = false"
      @submit="handlePanelSubmit"
    />
  </div>
</template>
