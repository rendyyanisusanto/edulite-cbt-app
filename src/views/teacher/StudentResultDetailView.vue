<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAssignmentStore } from '@/stores/assignment'
import { useQuestionStore } from '@/stores/question'
import { useResultStore } from '@/stores/result'
import { storeToRefs } from 'pinia'
import { ArrowLeft, CheckCircle2, XCircle, MinusCircle, AlertCircle } from 'lucide-vue-next'
import Skeleton from '@/components/common/Skeleton.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'

const route = useRoute()
const router = useRouter()
const assignmentStore = useAssignmentStore()
const questionStore = useQuestionStore()
const resultStore = useResultStore()

const { allEnrichedAssignments: assignments } = storeToRefs(assignmentStore)
const { questions } = storeToRefs(questionStore)
const { results, loading: resultLoading } = storeToRefs(resultStore)

const assignmentId = computed(() => Number(route.params.assignmentId))
const studentId = computed(() => Number(route.params.studentId))

const assignment = computed(() => assignments.value.find(a => a.id === assignmentId.value))
const studentResult = computed(() => resultStore.getStudentResult(assignmentId.value, studentId.value))
const assignmentQuestions = computed(() => questionStore.getQuestionsByAssignment(assignmentId.value))

const loading = ref(true)
const statusFilter = ref('semua')

const statusOptions = [
  { label: 'Semua Jawaban', value: 'semua' },
  { label: 'Benar', value: 'benar' },
  { label: 'Salah', value: 'salah' },
  { label: 'Kosong', value: 'kosong' }
]

// Combine question data with student's answers
const detailedAnswers = computed(() => {
  if (!studentResult.value || assignmentQuestions.value.length === 0) return []
  
  return assignmentQuestions.value.map((q, index) => {
    const studentAns = studentResult.value.answers.find(a => a.questionId === q.id)
    let status = 'kosong'
    if (studentAns) {
      status = studentAns.isCorrect ? 'benar' : 'salah'
    }

    // Find full text of student answer and correct answer
    const studentAnswerText = studentAns && studentAns.studentAnswer
      ? q.questionType === 'ESSAY' ? studentAns.studentAnswer : (q.options?.find(o => o.optionKey === studentAns.studentAnswer)?.optionText || '')
      : ''
    const correctAnswerText = q.questionType === 'ESSAY' ? q.correctAnswer : (q.options?.find(o => o.optionKey === q.correctAnswer)?.optionText || '')

    return {
      index: index + 1,
      questionId: q.id,
      questionText: q.questionText,
      type: q.questionType || 'SINGLE_CHOICE',
      studentAnswerKey: studentAns?.studentAnswer || null,
      studentAnswerText,
      correctAnswerKey: q.correctAnswer,
      correctAnswerText,
      status
    }
  })
})

const filteredAnswers = computed(() => {
  if (statusFilter.value === 'semua') return detailedAnswers.value
  return detailedAnswers.value.filter(a => a.status === statusFilter.value)
})

onMounted(async () => {
  loading.value = true
  try {
    if (assignments.value.length === 0) await assignmentStore.fetchTeacherAssignments()
    await questionStore.fetchQuestionsByAssignment(assignmentId.value)
    await resultStore.fetchStudentResult(assignmentId.value, studentId.value)
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="h-full flex flex-col max-w-7xl mx-auto">
    <!-- Loading State -->
    <div v-if="loading" class="space-y-6">
      <Skeleton type="card" />
      <Skeleton type="card" />
    </div>

    <!-- Error State -->
    <div v-else-if="!studentResult" class="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
      <div class="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle class="w-8 h-8" />
      </div>
      <h3 class="text-xl font-bold text-slate-800">Hasil Siswa Tidak Ditemukan</h3>
      <p class="text-slate-500 mt-2 mb-6 max-w-md mx-auto">
        Data hasil ujian siswa yang Anda cari tidak tersedia.
      </p>
      <BaseButton @click="router.push(`/teacher/assignments/${assignmentId}/results`)">
        Kembali ke Daftar Hasil
      </BaseButton>
    </div>

    <div v-else class="space-y-6">
      <!-- Header -->
      <div>
        <nav class="flex items-center text-sm font-medium text-slate-500 mb-2">
          <button @click="router.push(`/teacher/assignments/${assignmentId}/results`)" class="hover:text-slate-800 flex items-center transition-colors">
            <ArrowLeft class="w-4 h-4 mr-1" />
            Kembali ke Hasil
          </button>
        </nav>
        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 class="text-2xl font-bold text-slate-900 leading-tight">{{ studentResult.studentName }}</h1>
            <p class="text-slate-600 mt-1 font-medium">{{ studentResult.className }}</p>
            <p class="text-sm text-slate-500 mt-1">{{ assignment?.examName }} &mdash; {{ assignment?.subjectName }}</p>
          </div>
          <div class="bg-slate-50 px-6 py-4 rounded-xl border border-slate-100 text-center">
            <p class="text-sm text-slate-500 font-medium mb-1">Nilai Akhir</p>
            <p class="text-3xl font-black text-slate-900">{{ studentResult.score }}</p>
          </div>
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center space-x-3">
          <div class="bg-green-100 text-green-600 p-2 rounded-lg flex-shrink-0">
            <CheckCircle2 class="w-5 h-5" />
          </div>
          <div>
            <p class="text-xs font-medium text-slate-500">Benar</p>
            <p class="text-xl font-bold text-slate-800">{{ studentResult.correct }}</p>
          </div>
        </div>
        <div class="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center space-x-3">
          <div class="bg-red-100 text-red-600 p-2 rounded-lg flex-shrink-0">
            <XCircle class="w-5 h-5" />
          </div>
          <div>
            <p class="text-xs font-medium text-slate-500">Salah</p>
            <p class="text-xl font-bold text-slate-800">{{ studentResult.wrong }}</p>
          </div>
        </div>
        <div class="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center space-x-3">
          <div class="bg-slate-100 text-slate-600 p-2 rounded-lg flex-shrink-0">
            <MinusCircle class="w-5 h-5" />
          </div>
          <div>
            <p class="text-xs font-medium text-slate-500">Kosong</p>
            <p class="text-xl font-bold text-slate-800">{{ studentResult.unanswered }}</p>
          </div>
        </div>
      </div>

      <!-- Main Layout -->
      <div class="flex flex-col lg:flex-row gap-6 relative">
        
        <!-- Detailed Answers -->
        <div class="flex-1 space-y-4 pb-16 lg:pb-0">
          
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-bold text-slate-800">Review Jawaban</h2>
            <div class="w-48">
              <BaseSelect 
                name="statusFilter"
                v-model="statusFilter"
                :options="statusOptions"
              />
            </div>
          </div>

          <div v-if="filteredAnswers.length === 0" class="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
            Tidak ada jawaban yang sesuai dengan filter.
          </div>

          <div 
            v-for="ans in filteredAnswers" 
            :key="ans.questionId"
            :id="`review-${ans.index}`"
            class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div class="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-start gap-4">
              <div class="font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded">
                Soal {{ ans.index }}
              </div>
              <div>
                <span v-if="ans.status === 'benar'" class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700">
                  <CheckCircle2 class="w-3.5 h-3.5 mr-1" /> Benar
                </span>
                <span v-else-if="ans.status === 'salah'" class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">
                  <XCircle class="w-3.5 h-3.5 mr-1" /> Salah
                </span>
                <span v-else class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-600">
                  <MinusCircle class="w-3.5 h-3.5 mr-1" /> Kosong
                </span>
              </div>
            </div>
            
            <div class="p-4 sm:p-5">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-xs font-bold px-2 py-0.5 rounded" :class="ans.type === 'ESSAY' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'">
                  {{ ans.type === 'ESSAY' ? 'Esai' : 'Pilihan Ganda' }}
                </span>
              </div>
              <div class="text-slate-800 font-medium prose prose-sm max-w-none mb-6" v-html="ans.questionText"></div>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- Student Answer -->
                <div 
                  class="p-4 rounded-xl border-2 flex flex-col"
                  :class="ans.status === 'benar' ? 'bg-green-50 border-green-200' : (ans.status === 'salah' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200')"
                >
                  <p class="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Jawaban Siswa</p>
                  <div v-if="ans.studentAnswerKey" class="flex items-start">
                    <span v-if="ans.type !== 'ESSAY'" class="font-bold mr-2 text-slate-700">{{ ans.studentAnswerKey }}.</span>
                    <span class="text-slate-700 prose prose-sm max-w-none" v-html="ans.studentAnswerText"></span>
                  </div>
                  <div v-else class="text-slate-400 font-medium italic">
                    Tidak dijawab
                  </div>
                </div>

                <!-- Correct Answer / Rubrik -->
                <div class="p-4 rounded-xl border-2 bg-blue-50 border-blue-200 flex flex-col">
                  <p class="text-xs font-bold text-primary-blue mb-2 uppercase tracking-wider">
                    {{ ans.type === 'ESSAY' ? 'Rubrik Penilaian' : 'Kunci Jawaban' }}
                  </p>
                  <div class="flex items-start">
                    <span v-if="ans.type !== 'ESSAY'" class="font-bold mr-2 text-slate-800">{{ ans.correctAnswerKey }}.</span>
                    <span class="text-slate-800 prose prose-sm max-w-none" v-html="ans.correctAnswerText || '<em>Tidak ada rubrik.</em>'"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Desktop Navigator -->
        <div class="hidden lg:block w-72 shrink-0">
          <div class="sticky top-6 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 class="font-bold text-slate-800 mb-4">Navigasi Soal</h3>
            <div class="grid grid-cols-5 gap-2">
              <button 
                v-for="ans in detailedAnswers" 
                :key="ans.questionId"
                @click="() => document.getElementById(`review-${ans.index}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })"
                class="h-10 rounded border text-sm font-bold transition-colors"
                :class="{
                  'bg-green-100 text-green-700 border-green-200 hover:bg-green-200': ans.status === 'benar',
                  'bg-red-100 text-red-700 border-red-200 hover:bg-red-200': ans.status === 'salah',
                  'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200': ans.status === 'kosong'
                }"
              >
                {{ ans.index }}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
