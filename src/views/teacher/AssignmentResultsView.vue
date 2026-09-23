<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAssignmentStore } from '@/stores/assignment'
import { useResultStore } from '@/stores/result'
import { storeToRefs } from 'pinia'
import { ArrowLeft, Search, Filter, AlertCircle, Eye, Users, CheckCircle2, Clock, Activity } from 'lucide-vue-next'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import Skeleton from '@/components/common/Skeleton.vue'

const route = useRoute()
const router = useRouter()
const assignmentStore = useAssignmentStore()
const resultStore = useResultStore()

const { results, loading } = storeToRefs(resultStore)

const assignmentId = computed(() => Number(route.params.id))
const assignment = ref(null)

const assignmentResults = computed(() => resultStore.getResultsByAssignment(assignmentId.value))
const summary = computed(() => resultStore.getAssignmentSummary(assignmentId.value))

// Filters
const searchQuery = ref('')
const statusFilter = ref('semua')

const statusOptions = [
  { label: 'Semua Status', value: 'semua' },
  { label: 'Selesai', value: 'completed' },
  { label: 'Belum Selesai', value: 'pending' }
]

const filteredResults = computed(() => {
  let list = assignmentResults.value
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(r => r.studentName.toLowerCase().includes(q))
  }
  
  if (statusFilter.value !== 'semua') {
    list = list.filter(r => r.status === statusFilter.value)
  }
  
  return list
})

onMounted(async () => {
  try {
    assignment.value = await assignmentStore.fetchTeacherAssignmentById(assignmentId.value)
    await resultStore.fetchResultsByAssignment(assignmentId.value)
  } catch (e) {
    console.error(e)
  }
})
</script>

<template>
  <div class="h-full flex flex-col max-w-7xl mx-auto">
    <div class="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <nav class="flex items-center text-sm font-medium text-slate-500 mb-2">
          <button @click="router.push('/teacher/results')" class="hover:text-slate-800 flex items-center transition-colors">
            <ArrowLeft class="w-4 h-4 mr-1" />
            Daftar Hasil Ujian
          </button>
        </nav>
        <h1 class="text-2xl font-bold text-slate-900 leading-tight">Hasil Ujian: {{ assignment?.subject?.name }}</h1>
        <p class="text-slate-600 mt-1">{{ assignment?.class?.name }} &mdash; {{ assignment?.exam?.title }}</p>
      </div>
      <div>
        <BaseButton 
          v-if="summary.essayPending > 0"
          @click="router.push(`/teacher/assignments/${assignmentId}/grade-essays`)"
          variant="primary"
          class="shadow-sm border-blue-600 bg-blue-600 hover:bg-blue-700"
        >
          Nilai Essay ({{ summary.essayPending }})
        </BaseButton>
      </div>
    </div>

    <!-- Summary Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center space-x-4">
        <div class="bg-slate-100 text-slate-600 p-3 rounded-lg flex-shrink-0">
          <Users class="w-6 h-6" />
        </div>
        <div>
          <p class="text-sm font-medium text-slate-500">Peserta</p>
          <p class="text-2xl font-bold text-slate-800 mt-0.5">{{ summary.participants }}</p>
        </div>
      </div>
      <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center space-x-4">
        <div class="bg-green-100 text-green-600 p-3 rounded-lg flex-shrink-0">
          <CheckCircle2 class="w-6 h-6" />
        </div>
        <div>
          <p class="text-sm font-medium text-slate-500">Sudah Selesai</p>
          <p class="text-2xl font-bold text-slate-800 mt-0.5">{{ summary.completed }}</p>
        </div>
      </div>
      <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center space-x-4">
        <div class="bg-amber-100 text-amber-600 p-3 rounded-lg flex-shrink-0">
          <Clock class="w-6 h-6" />
        </div>
        <div>
          <p class="text-sm font-medium text-slate-500">Belum Selesai</p>
          <p class="text-2xl font-bold text-slate-800 mt-0.5">{{ summary.pending }}</p>
        </div>
      </div>
      <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center space-x-4">
        <div class="bg-blue-100 text-blue-600 p-3 rounded-lg flex-shrink-0">
          <Activity class="w-6 h-6" />
        </div>
        <div>
          <p class="text-sm font-medium text-slate-500">Rata-rata</p>
          <p class="text-2xl font-bold text-slate-800 mt-0.5">{{ summary.average }}</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-4">
      <div class="flex-1">
        <BaseInput 
          name="search" 
          v-model="searchQuery" 
          placeholder="Cari nama siswa..." 
          :icon="Search"
          class="!mb-0"
        />
      </div>
      <div class="w-full sm:w-48 shrink-0">
        <BaseSelect 
          name="status" 
          v-model="statusFilter" 
          :options="statusOptions"
        />
      </div>
    </div>

    <!-- Results Area -->
    <div v-if="loading" class="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
      <Skeleton type="text" :lines="5" />
    </div>

    <div v-else-if="filteredResults.length === 0" class="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
      <div class="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle class="w-8 h-8" />
      </div>
      <h3 class="text-lg font-bold text-slate-800">Tidak ada hasil</h3>
      <p class="text-slate-500 mt-1 max-w-md mx-auto">
        Tidak ada data siswa yang cocok dengan pencarian atau filter Anda.
      </p>
    </div>

    <div v-else>
      <!-- Desktop Table -->
      <div class="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table class="w-full text-sm text-left text-slate-600">
          <thead class="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
            <tr>
              <th scope="col" class="px-6 py-3 font-semibold">No</th>
              <th scope="col" class="px-6 py-3 font-semibold">Nama Siswa</th>
              <th scope="col" class="px-6 py-3 font-semibold text-center">PG (B/S)</th>
              <th scope="col" class="px-6 py-3 font-semibold text-center">Essay (Nilai/Total)</th>
              <th scope="col" class="px-6 py-3 font-semibold text-center">Nilai</th>
              <th scope="col" class="px-6 py-3 font-semibold text-center">Status</th>
              <th scope="col" class="px-6 py-3 font-semibold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr 
              v-for="(result, index) in filteredResults" 
              :key="result.studentId"
              class="hover:bg-slate-50/50 transition-colors"
            >
              <td class="px-6 py-4">{{ index + 1 }}</td>
              <td class="px-6 py-4 font-semibold text-slate-900">{{ result.studentName }}</td>
              <td class="px-6 py-4 text-center">{{ result.objective?.correct || 0 }} / {{ result.objective?.wrong || 0 }}</td>
              <td class="px-6 py-4 text-center">
                <span v-if="result.essay?.total > 0" :class="result.essay?.pending > 0 ? 'text-amber-600 font-bold' : 'text-green-600'">
                  {{ result.essay?.graded }} / {{ result.essay?.total }}
                </span>
                <span v-else class="text-slate-400">-</span>
              </td>
              <td class="px-6 py-4 text-center font-bold text-slate-900 text-base">
                <span v-if="result.gradingStatus === 'WAITING_ESSAY_GRADING'" class="text-amber-500 text-sm">Menunggu</span>
                <span v-else>{{ result.score }}</span>
              </td>
              <td class="px-6 py-4 text-center">
                <span 
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  :class="result.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'"
                >
                  {{ result.status === 'completed' ? 'Selesai' : 'Belum Selesai' }}
                </span>
              </td>
              <td class="px-6 py-4 text-center">
                <button 
                  v-if="result.status === 'completed'"
                  @click="router.push(`/teacher/assignments/${assignmentId}/results/${result.studentId}`)"
                  class="text-primary-blue hover:text-blue-700 font-medium hover:underline inline-flex items-center"
                >
                  <Eye class="w-4 h-4 mr-1" /> Lihat
                </button>
                <span v-else class="text-slate-400">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards -->
      <div class="md:hidden space-y-4">
        <div 
          v-for="result in filteredResults" 
          :key="result.studentId"
          class="bg-white rounded-xl border border-slate-200 shadow-sm p-4"
        >
          <div class="flex justify-between items-start mb-3">
            <h3 class="font-bold text-slate-900 text-lg">{{ result.studentName }}</h3>
            <span 
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
              :class="result.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'"
            >
              {{ result.status === 'completed' ? 'Selesai' : 'Belum Selesai' }}
            </span>
          </div>
          
          <div class="flex items-center justify-between mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div>
              <p class="text-xs text-slate-500 mb-0.5">Nilai</p>
              <p class="text-2xl font-bold text-slate-900">{{ result.score }}</p>
            </div>
            <div class="text-right text-xs text-slate-500 space-y-1">
              <p>PG B/S: <span class="font-bold text-slate-700">{{ result.objective?.correct || 0 }}/{{ result.objective?.wrong || 0 }}</span></p>
              <p>Essay: <span class="font-bold text-slate-700">{{ result.essay?.graded || 0 }}/{{ result.essay?.total || 0 }}</span></p>
            </div>
          </div>
          
          <BaseButton 
            v-if="result.status === 'completed'"
            block 
            variant="outline"
            @click="router.push(`/teacher/assignments/${assignmentId}/results/${result.studentId}`)"
            class="text-primary-blue border-primary-blue hover:bg-blue-50 justify-center"
          >
            Lihat Detail
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>
