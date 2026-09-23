<script setup>
import { Activity, Users, CheckCircle, Clock } from 'lucide-vue-next'
import DataTable from '@/components/common/DataTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

const stats = [
  { label: 'Ujian Berlangsung', value: '3', icon: Activity, color: 'text-primary-blue', bg: 'bg-blue-100' },
  { label: 'Peserta Online', value: '186', icon: Users, color: 'text-green-600', bg: 'bg-green-100' },
  { label: 'Sudah Selesai', value: '92', icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-100' },
  { label: 'Belum Mulai', value: '46', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
]

const monitoringCols = [
  { key: 'exam', label: 'Ujian' },
  { key: 'subject', label: 'Mapel' },
  { key: 'class', label: 'Kelas' },
  { key: 'participants', label: 'Peserta' },
  { key: 'finished', label: 'Selesai' },
  { key: 'status', label: 'Status' }
]

const monitoringData = [
  { exam: 'PTS Ganjil 2026', subject: 'Keamanan Jaringan', class: 'XII TKJ 1', participants: 32, finished: 18, status: 'Aktif' },
  { exam: 'PTS Ganjil 2026', subject: 'Keamanan Jaringan', class: 'XII TKJ 2', participants: 30, finished: 12, status: 'Aktif' },
  { exam: 'PTS Ganjil 2026', subject: 'Matematika', class: 'XII RPL 1', participants: 36, finished: 36, status: 'Selesai' },
]
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-slate-800">Monitoring Ujian</h2>
      <p class="text-slate-500 mt-1">Pantau ujian yang sedang berlangsung secara real-time.</p>
    </div>

    <!-- Live Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div 
        v-for="(stat, index) in stats" 
        :key="index"
        class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center space-x-4"
      >
        <div class="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" :class="stat.bg">
          <component :is="stat.icon" class="w-6 h-6" :class="stat.color" />
        </div>
        <div>
          <p class="text-xs font-medium text-slate-500">{{ stat.label }}</p>
          <h3 class="text-xl font-bold text-slate-900 leading-tight">{{ stat.value }}</h3>
        </div>
      </div>
    </div>

    <!-- Live Monitoring Table -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <div class="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
          <h3 class="text-lg font-semibold text-slate-800">Sesi Berlangsung</h3>
        </div>
      </div>
      
      <DataTable 
        :columns="monitoringCols" 
        :data="monitoringData"
        class="border-0 rounded-none shadow-none"
      >
        <template #exam="{ value }">
          <span class="font-medium text-slate-900">{{ value }}</span>
        </template>
        <template #participants="{ value }">
          <span class="font-medium text-slate-700">{{ value }} Siswa</span>
        </template>
        <template #finished="{ row }">
          <div class="w-full bg-slate-200 rounded-full h-2.5 mb-1 max-w-[100px]">
            <div class="bg-primary-blue h-2.5 rounded-full" :style="`width: ${(row.finished / row.participants) * 100}%`"></div>
          </div>
          <span class="text-xs text-slate-500">{{ row.finished }} / {{ row.participants }}</span>
        </template>
        <template #status="{ value }">
          <StatusBadge :status="value" />
        </template>
      </DataTable>
    </div>
  </div>
</template>
