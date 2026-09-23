<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useScheduleStore } from '@/stores/schedule'
import { useUiStore } from '@/stores/ui'
import { ArrowLeft, RefreshCw, Calendar, Clock, Lock, Users, CheckCircle, XCircle } from 'lucide-vue-next'
import BaseButton from '@/components/common/BaseButton.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

const route = useRoute()
const router = useRouter()
const scheduleStore = useScheduleStore()
const uiStore = useUiStore()

const loading = ref(true)
const syncing = ref(false)
const schedule = computed(() => scheduleStore.currentSchedule)
const participants = computed(() => scheduleStore.participants)

const fetchDetail = async () => {
  loading.value = true
  try {
    await scheduleStore.fetchScheduleDetail(route.params.id)
  } catch (error) {
    uiStore.addToast('Gagal memuat detail jadwal', 'error')
    router.push('/admin/schedules')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDetail()
})

const goBack = () => router.back()

const handleSync = async () => {
  syncing.value = true
  try {
    const res = await scheduleStore.syncParticipants(route.params.id)
    uiStore.addToast(`Sinkronisasi berhasil. Ditambahkan: ${res.data.generated} siswa.`, 'success')
  } catch (error) {
    uiStore.addToast('Gagal melakukan sinkronisasi', 'error')
  } finally {
    syncing.value = false
  }
}

const toggleEligibility = async (participant) => {
  const newStatus = participant.is_eligible ? 0 : 1
  try {
    await scheduleStore.updateEligibility(schedule.value.id, participant.participantId, newStatus)
    uiStore.addToast('Status eligibility diperbarui', 'success')
  } catch (error) {
    uiStore.addToast('Gagal mengupdate status', 'error')
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

const formatTime = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit'
  })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Breadcrumb & Header -->
    <div class="flex items-center space-x-2 text-sm text-slate-500 mb-2">
      <router-link to="/admin/dashboard" class="hover:text-primary-blue transition-colors">Dashboard</router-link>
      <span>/</span>
      <router-link to="/admin/schedules" class="hover:text-primary-blue transition-colors">Jadwal Ujian</router-link>
      <span>/</span>
      <span class="text-slate-800 font-medium truncate max-w-[200px]" v-if="!loading">{{ schedule?.subjectName }}</span>
    </div>

    <!-- Header Panel -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="p-6">
        <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div class="flex items-start gap-4">
            <button 
              @click="goBack"
              class="mt-1 p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue shrink-0"
            >
              <ArrowLeft class="w-5 h-5" />
            </button>
            <div v-if="loading" class="space-y-2">
              <div class="w-48 h-7 bg-slate-200 animate-pulse rounded"></div>
              <div class="w-32 h-4 bg-slate-200 animate-pulse rounded"></div>
            </div>
            <div v-else>
              <h2 class="text-2xl font-bold text-slate-800 flex items-center gap-3">
                {{ schedule?.subjectName }}
                <StatusBadge :status="schedule?.status || ''" />
              </h2>
              <p class="text-slate-500 mt-1 font-medium">{{ schedule?.examTitle }} &bull; Kelas {{ schedule?.className }}</p>
            </div>
          </div>
          
          <div v-if="!loading" class="bg-slate-50 border border-slate-200 rounded-lg p-3 px-5 flex items-center gap-4 min-w-[200px] self-start md:self-auto">
            <div>
              <p class="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Token Ujian</p>
              <div class="flex items-center gap-2">
                <Lock class="w-4 h-4 text-slate-400" />
                <span class="font-mono text-xl font-bold text-primary-blue tracking-widest">{{ schedule?.token }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!loading" class="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div class="flex flex-col">
            <span class="text-sm font-medium text-slate-500 mb-1 flex items-center gap-1.5"><Calendar class="w-4 h-4" /> Tanggal</span>
            <span class="font-semibold text-slate-900">{{ formatDate(schedule?.start_at) }}</span>
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-medium text-slate-500 mb-1 flex items-center gap-1.5"><Clock class="w-4 h-4" /> Akses</span>
            <span class="font-semibold text-slate-900">{{ formatTime(schedule?.start_at) }} - {{ formatTime(schedule?.end_at) }}</span>
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-medium text-slate-500 mb-1 flex items-center gap-1.5"><Clock class="w-4 h-4" /> Durasi</span>
            <span class="font-semibold text-slate-900">{{ schedule?.duration_minutes }} Menit</span>
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-medium text-slate-500 mb-1 flex items-center gap-1.5"><Users class="w-4 h-4" /> Peserta</span>
            <span class="font-semibold text-slate-900">{{ participants.length }} Siswa</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Participants Table -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div class="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 class="text-lg font-semibold text-slate-800">Daftar Peserta</h3>
          <p class="text-sm text-slate-500 mt-0.5">Siswa yang terdaftar pada kelas assignment ini.</p>
        </div>
        <BaseButton variant="secondary" :loading="syncing" @click="handleSync">
          <RefreshCw class="w-4 h-4 mr-2" :class="{'animate-spin': syncing}" /> Sinkronisasi Peserta
        </BaseButton>
      </div>

      <div v-if="loading" class="p-6">
        <div class="space-y-4">
          <div v-for="i in 5" :key="i" class="w-full h-12 bg-slate-100 animate-pulse rounded-lg"></div>
        </div>
      </div>
      
      <div v-else-if="participants.length === 0" class="p-12 text-center text-slate-500">
        <Users class="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p>Belum ada peserta yang digenerate.</p>
        <p class="text-sm mt-1">Silakan klik "Sinkronisasi Peserta" untuk mencari data siswa dari kelas terkait.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm text-left text-slate-600">
          <thead class="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="px-6 py-4 font-medium">No</th>
              <th class="px-6 py-4 font-medium">Siswa</th>
              <th class="px-6 py-4 font-medium">Status Pengerjaan</th>
              <th class="px-6 py-4 font-medium text-center">Eligibility</th>
              <th class="px-6 py-4 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="(p, index) in participants" :key="p.participantId" class="hover:bg-slate-50/50">
              <td class="px-6 py-4 w-12">{{ index + 1 }}</td>
              <td class="px-6 py-4">
                <div class="font-semibold text-slate-900">{{ p.studentName }}</div>
                <div class="text-xs text-slate-500">{{ p.nis }} &bull; {{ p.className }}</div>
              </td>
              <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" :class="{
                  'bg-slate-100 text-slate-600': p.participant_status === 'NOT_STARTED',
                  'bg-blue-100 text-blue-700': p.participant_status === 'IN_PROGRESS',
                  'bg-green-100 text-green-700': p.participant_status === 'FINISHED',
                  'bg-red-100 text-red-700': p.participant_status === 'BLOCKED'
                }">
                  {{ p.participant_status.replace('_', ' ') }}
                </span>
              </td>
              <td class="px-6 py-4 text-center">
                <span v-if="p.is_eligible" class="inline-flex items-center text-green-600 font-medium text-xs bg-green-50 px-2 py-1 rounded">
                  <CheckCircle class="w-3.5 h-3.5 mr-1" /> Eligible
                </span>
                <span v-else class="inline-flex items-center text-red-600 font-medium text-xs bg-red-50 px-2 py-1 rounded">
                  <XCircle class="w-3.5 h-3.5 mr-1" /> Blocked
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <BaseButton 
                  variant="secondary" 
                  class="!py-1.5 !px-3 text-xs"
                  @click="toggleEligibility(p)"
                >
                  {{ p.is_eligible ? 'Block' : 'Unblock' }}
                </BaseButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
