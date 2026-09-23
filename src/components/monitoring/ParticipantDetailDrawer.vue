<script setup>
import { computed, watch } from 'vue'
import { useMonitoringStore } from '@/stores/monitoring'
import { X, Clock, PlayCircle, CheckCircle2, AlertTriangle, User } from 'lucide-vue-next'

const props = defineProps({
  show: Boolean,
  scheduleId: Number,
  participantId: Number
})

const emit = defineEmits(['close'])

const monitoringStore = useMonitoringStore()

watch(() => props.show, async (newVal) => {
  if (newVal && props.participantId) {
    monitoringStore.clearParticipantDetail()
    await monitoringStore.fetchParticipantDetail(props.scheduleId, props.participantId)
  }
}, { immediate: true })

const participant = computed(() => {
  return monitoringStore.participants.find(p => p.participantId === props.participantId)
})

const detail = computed(() => monitoringStore.participantDetail)

const getStatusBadge = (status, isStale) => {
  if (isStale && status === 'IN_PROGRESS') {
    return { class: 'bg-red-50 text-red-700 border-red-200', label: 'Tidak Aktif (> 5m)' }
  }
  
  switch (status) {
    case 'NOT_STARTED': return { class: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Belum Mulai' }
    case 'IN_PROGRESS': return { class: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Mengerjakan' }
    case 'SUBMITTED': return { class: 'bg-green-50 text-green-700 border-green-200', label: 'Selesai' }
    case 'TIME_EXPIRED': return { class: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Waktu Habis' }
    case 'BLOCKED': return { class: 'bg-red-50 text-red-700 border-red-200', label: 'Diblokir' }
    default: return { class: 'bg-slate-100 text-slate-700 border-slate-200', label: status }
  }
}

const formatTime = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

const formatRemainingTime = (seconds) => {
  if (seconds <= 0) return '0 mnt'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}j ${m}m`
  return `${m} mnt`
}

const getGridButtonClass = (q) => {
  if (q.flagged) return 'bg-amber-100 border-amber-400 text-amber-700'
  if (q.answered) return 'bg-blue-500 border-blue-600 text-white shadow-sm shadow-blue-500/20'
  return 'bg-white border-slate-200 text-slate-500'
}

const answeredCount = computed(() => detail.value?.questions?.filter(q => q.answered).length || 0)
const flaggedCount = computed(() => detail.value?.questions?.filter(q => q.flagged).length || 0)

</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
    <!-- Backdrop -->
    <div 
      class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
      @click="emit('close')"
    ></div>

    <!-- Modal Content -->
    <div class="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
      
      <!-- Header -->
      <div class="flex justify-between items-center px-6 py-4 border-b border-slate-100 shrink-0">
        <h2 class="text-lg font-bold text-slate-900">Detail Peserta</h2>
        <button 
          @click="emit('close')"
          class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Body -->
      <div v-if="!participant" class="flex-grow flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <div v-else class="flex-grow overflow-y-auto">
        <!-- Student Info -->
        <div class="p-6 border-b border-slate-100 bg-slate-50/50">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <User class="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 class="font-bold text-slate-900 text-lg leading-tight">{{ participant.student.name }}</h3>
              <p class="text-sm text-slate-500 mt-1">{{ participant.student.nis || '-' }} &bull; {{ participant.student.className }}</p>
              
              <div class="mt-3">
                <span :class="['px-2.5 py-1 text-xs font-bold rounded-md border', getStatusBadge(participant.status, participant.isStale).class]">
                  {{ getStatusBadge(participant.status, participant.isStale).label }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Layout for Activity & Progress in Modal (Grid Side by Side on Desktop) -->
        <div class="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
          
          <!-- Activity Stats -->
          <div class="p-6 md:w-1/2">
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Aktivitas Ujian</h4>
            
            <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-xs font-medium text-slate-500 mb-1">Mulai</div>
              <div class="font-bold text-slate-900 flex items-center gap-1.5">
                <PlayCircle class="w-4 h-4 text-slate-400" />
                {{ formatTime(participant.attempt?.startedAt) }}
              </div>
            </div>
            <div>
              <div class="text-xs font-medium text-slate-500 mb-1">Berakhir</div>
              <div class="font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 class="w-4 h-4 text-slate-400" />
                {{ formatTime(participant.attempt?.expiresAt) }}
              </div>
            </div>
            <div>
              <div class="text-xs font-medium text-slate-500 mb-1">Last Activity</div>
              <div class="font-bold text-slate-900 flex items-center gap-1.5">
                <Clock class="w-4 h-4 text-slate-400" />
                {{ formatTime(participant.attempt?.lastActivityAt) }}
              </div>
            </div>
            <div>
              <div class="text-xs font-medium text-slate-500 mb-1">Sisa Waktu</div>
              <div class="font-bold text-slate-900 flex items-center gap-1.5">
                <AlertTriangle class="w-4 h-4 text-slate-400" />
                {{ participant.status === 'IN_PROGRESS' ? formatRemainingTime(participant.remainingSeconds) : '-' }}
              </div>
            </div>
          </div>
          </div>

          <!-- Progress Stats -->
          <div class="p-6 md:w-1/2">
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex justify-between items-center">
              <span>Progress Jawaban</span>
              <span class="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md">{{ participant.progress.percentage }}%</span>
            </h4>

          <div v-if="!detail" class="flex justify-center py-6">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>

          <template v-else>
            <div class="flex gap-4 mb-6">
              <div class="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <div class="text-2xl font-black text-slate-700">{{ answeredCount }}</div>
                <div class="text-[10px] font-bold text-slate-400 uppercase mt-1">Dijawab</div>
              </div>
              <div class="flex-1 bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                <div class="text-2xl font-black text-amber-700">{{ flaggedCount }}</div>
                <div class="text-[10px] font-bold text-amber-600 uppercase mt-1">Ditandai</div>
              </div>
              <div class="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <div class="text-2xl font-black text-slate-700">{{ participant.progress.total - answeredCount }}</div>
                <div class="text-[10px] font-bold text-slate-400 uppercase mt-1">Kosong</div>
              </div>
            </div>

            <div v-if="detail.questions.length > 0" class="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-8 gap-2">
              <div 
                v-for="q in detail.questions" 
                :key="q.questionId"
                :class="['h-9 rounded-lg border font-bold text-xs flex items-center justify-center transition-colors', getGridButtonClass(q)]"
              >
                {{ q.number }}
              </div>
            </div>
            
            <div v-else class="text-center text-sm text-slate-500 py-6">
              Peserta belum memulai ujian sehingga grid soal belum tersedia.
            </div>
          </template>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>
