<script setup>
import { onMounted, onUnmounted, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMonitoringStore } from '@/stores/monitoring'
import { useAuthStore } from '@/stores/auth'
import { ArrowLeft, Clock, Users, PlayCircle, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-vue-next'
import MonitoringTable from '@/components/monitoring/MonitoringTable.vue'
import ParticipantDetailDrawer from '@/components/monitoring/ParticipantDetailDrawer.vue'

const route = useRoute()
const router = useRouter()
const monitoringStore = useMonitoringStore()
const authStore = useAuthStore()

const scheduleId = Number(route.params.scheduleId)
const rolePrefix = computed(() => authStore.isAdmin ? '/admin' : '/teacher')

onMounted(() => {
  monitoringStore.resetState()
  monitoringStore.startPolling(scheduleId)
})

onUnmounted(() => {
  monitoringStore.stopPolling()
})

const goBack = () => {
  router.push(`${rolePrefix.value}/monitoring`)
}

const schedule = computed(() => monitoringStore.currentSchedule)
const summary = computed(() => monitoringStore.summary)
const lastUpdated = computed(() => {
  if (!monitoringStore.lastUpdatedAt) return '-'
  return monitoringStore.lastUpdatedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
})

const refreshManually = () => {
  monitoringStore.fetchMonitoringDetail(scheduleId)
}

const showDrawer = ref(false)
const selectedParticipantId = ref(null)

const handleOpenDetail = (participantId) => {
  selectedParticipantId.value = participantId
  showDrawer.value = true
}

const handleCloseDrawer = () => {
  showDrawer.value = false
  selectedParticipantId.value = null
}
</script>

<template>
  <div class="space-y-6 pb-10">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div class="flex items-center gap-3">
        <button 
          @click="goBack"
          class="p-2 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors border border-transparent hover:border-slate-200"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight leading-none mb-1">
            {{ schedule?.examTitle || 'Memuat...' }}
          </h1>
          <p class="text-sm text-slate-500">
            {{ schedule?.subjectName || '...' }} &bull; {{ schedule?.className || '...' }}
          </p>
        </div>
      </div>
      
      <div class="flex flex-col items-end gap-1">
        <button 
          @click="refreshManually"
          class="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
          :disabled="monitoringStore.loading"
        >
          <RefreshCw :class="['w-4 h-4', { 'animate-spin': monitoringStore.loading }]" />
          Segarkan
        </button>
        <span class="text-xs text-slate-400 font-medium mr-1">Terakhir diperbarui: {{ lastUpdated }}</span>
      </div>
    </div>

    <div v-if="monitoringStore.loading && !schedule" class="flex justify-center py-20">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <template v-else-if="schedule">
      <!-- Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        <div class="bg-white p-4 rounded-xl border border-slate-200 flex flex-col shadow-sm">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Users class="w-3.5 h-3.5"/> Total</span>
          <span class="text-2xl font-black text-slate-900">{{ summary.total }}</span>
        </div>

        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col shadow-sm">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Clock class="w-3.5 h-3.5"/> Belum Mulai</span>
          <span class="text-2xl font-black text-slate-600">{{ summary.notStarted }}</span>
        </div>

        <div class="bg-blue-50 p-4 rounded-xl border border-blue-200 flex flex-col shadow-sm">
          <span class="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1 flex items-center gap-1.5"><PlayCircle class="w-3.5 h-3.5"/> Mengerjakan</span>
          <span class="text-2xl font-black text-blue-700">{{ summary.inProgress }}</span>
        </div>

        <div class="bg-green-50 p-4 rounded-xl border border-green-200 flex flex-col shadow-sm">
          <span class="text-xs font-bold text-green-600 uppercase tracking-wider mb-1 flex items-center gap-1.5"><CheckCircle2 class="w-3.5 h-3.5"/> Selesai</span>
          <span class="text-2xl font-black text-green-700">{{ summary.submitted }}</span>
        </div>

        <div class="bg-amber-50 p-4 rounded-xl border border-amber-200 flex flex-col shadow-sm">
          <span class="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1 flex items-center gap-1.5"><AlertTriangle class="w-3.5 h-3.5"/> Waktu Habis</span>
          <span class="text-2xl font-black text-amber-700">{{ summary.timeExpired }}</span>
        </div>

        <div class="bg-red-50 p-4 rounded-xl border border-red-200 flex flex-col shadow-sm">
          <span class="text-xs font-bold text-red-600 uppercase tracking-wider mb-1 flex items-center gap-1.5"><AlertCircle class="w-3.5 h-3.5"/> Tidak Aktif</span>
          <span class="text-2xl font-black text-red-700">{{ summary.stale }}</span>
        </div>

      </div>

      <!-- Filters & Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        <div class="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div class="relative w-full sm:w-64">
            <input 
              v-model="monitoringStore.searchQuery"
              type="text" 
              placeholder="Cari nama atau NIS..." 
              class="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
            <div class="absolute left-3 top-2.5 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>
          
          <div class="w-full sm:w-auto">
            <select 
              v-model="monitoringStore.statusFilter"
              class="w-full sm:w-48 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option value="SEMUA">Semua Status</option>
              <option value="NOT_STARTED">Belum Mulai</option>
              <option value="IN_PROGRESS">Mengerjakan</option>
              <option value="SUBMITTED">Selesai</option>
              <option value="TIME_EXPIRED">Waktu Habis</option>
              <option value="STALE">Tidak Aktif (> 5m)</option>
            </select>
          </div>
        </div>

        <div class="flex-grow p-0">
          <MonitoringTable 
            :participants="monitoringStore.filteredParticipants"
            @view-detail="handleOpenDetail"
          />
        </div>
      </div>
    </template>

    <div v-else-if="monitoringStore.error" class="bg-red-50 border border-red-200 text-red-600 p-6 rounded-xl text-center">
      <AlertCircle class="w-8 h-8 mx-auto mb-2 text-red-500" />
      <p class="font-bold">{{ monitoringStore.error }}</p>
      <button @click="goBack" class="mt-4 px-4 py-2 bg-white border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-50 text-sm">Kembali</button>
    </div>

    <!-- Participant Detail Drawer -->
    <ParticipantDetailDrawer 
      v-if="showDrawer"
      :show="showDrawer"
      :schedule-id="scheduleId"
      :participant-id="selectedParticipantId"
      @close="handleCloseDrawer"
    />
  </div>
</template>
