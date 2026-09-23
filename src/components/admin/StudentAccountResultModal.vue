<script setup>
import { ref, computed } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { Copy, Printer, CheckCircle, AlertTriangle } from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui'

const props = defineProps({
  isOpen: Boolean,
  results: {
    type: Object,
    default: () => ({ generated: [], skipped: [] })
  },
  title: {
    type: String,
    default: 'Hasil Generate Akun'
  },
  isReset: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])
const uiStore = useUiStore()

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    uiStore.addToast('Berhasil disalin ke clipboard', 'success')
  } catch (err) {
    uiStore.addToast('Gagal menyalin text', 'error')
  }
}

const copySingle = (item) => {
  const text = `CBT Edulite\nNama: ${item.name}\nUsername: ${item.username}\nPassword: ${item.password}`
  copyToClipboard(text)
}

const copyAll = () => {
  let text = 'CBT Edulite - Daftar Akun\n\n'
  props.results.generated.forEach(item => {
    text += `Nama: ${item.name}\nUsername: ${item.username}\nPassword: ${item.password}\n\n`
  })
  copyToClipboard(text)
}

const printCredentials = () => {
  const printWindow = window.open('', '_blank')
  let html = `
    <html>
      <head>
        <title>Cetak Akun CBT</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          .card { border: 1px dashed #ccc; padding: 20px; margin-bottom: 20px; width: 300px; display: inline-block; margin-right: 20px; page-break-inside: avoid; }
          .header { font-weight: bold; font-size: 16px; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
          .row { margin-bottom: 10px; font-size: 14px; }
          .label { color: #666; font-size: 12px; }
          .val { font-weight: bold; font-size: 16px; }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
  `
  props.results.generated.forEach(item => {
    html += `
      <div class="card">
        <div class="header">CBT EDULITE</div>
        <div class="row"><div class="label">Nama</div><div class="val" style="font-size:14px;">${item.name}</div></div>
        <div class="row"><div class="label">Username</div><div class="val">${item.username}</div></div>
        <div class="row"><div class="label">Password</div><div class="val">${item.password}</div></div>
      </div>
    `
  })
  html += `
        <script>
          window.onload = function() { window.print(); }
        <\/script>
      <\/body>
    <\/html>
  `
  printWindow.document.write(html)
  printWindow.document.close()
}
</script>

<template>
  <BaseModal 
    :isOpen="isOpen" 
    :title="title" 
    @close="$emit('close')" 
    maxWidth="max-w-2xl"
    :preventClose="true"
  >
    <div class="py-4 space-y-6">
      
      <div v-if="!isReset" class="flex flex-col gap-3">
        <div v-if="results.generated.length > 0" class="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
          <CheckCircle class="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
          <div>
            <h4 class="font-bold text-green-800">{{ results.generated.length }} akun berhasil dibuat.</h4>
            <p class="text-sm text-green-700 mt-1">Harap catat atau cetak password di bawah ini. Password tidak akan ditampilkan lagi setelah jendela ini ditutup.</p>
          </div>
        </div>
        
        <div v-if="results.skipped?.length > 0" class="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
          <AlertTriangle class="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
          <div>
            <h4 class="font-bold text-yellow-800">{{ results.skipped.length }} siswa dilewati.</h4>
            <p class="text-sm text-yellow-700 mt-1">Siswa tersebut sudah memiliki akun CBT sebelumnya.</p>
          </div>
        </div>
      </div>

      <div v-if="isReset" class="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
        <CheckCircle class="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div>
          <h4 class="font-bold text-blue-800">Password berhasil direset.</h4>
          <p class="text-sm text-blue-700 mt-1">Password lama tidak dapat digunakan kembali. Harap catat password baru ini.</p>
        </div>
      </div>

      <div class="max-h-[50vh] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 scrollbar-thin">
        <div v-for="item in results.generated" :key="item.studentId" class="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
          <div>
            <p class="font-bold text-slate-800">{{ item.name }}</p>
            <div class="flex gap-4 mt-2">
              <div>
                <span class="text-xs text-slate-500 block">Username</span>
                <span class="font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{{ item.username }}</span>
              </div>
              <div>
                <span class="text-xs text-slate-500 block">Password</span>
                <span class="font-mono font-bold text-primary-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{{ item.password }}</span>
              </div>
            </div>
          </div>
          <BaseButton variant="outline" class="sm:w-auto w-full text-xs" @click="copySingle(item)">
            <Copy class="w-3.5 h-3.5 mr-1.5" /> Salin
          </BaseButton>
        </div>
      </div>

    </div>
    
    <template #footer>
      <div class="flex flex-col sm:flex-row justify-between items-center gap-3 w-full">
        <p class="text-xs text-red-500 font-medium w-full sm:w-auto text-center sm:text-left">
          ⚠️ Password tidak akan disimpan dalam bentuk teks biasa.
        </p>
        <div class="flex gap-2 w-full sm:w-auto">
          <BaseButton v-if="results.generated.length > 0" variant="outline" @click="printCredentials">
            <Printer class="w-4 h-4 mr-2" /> Cetak
          </BaseButton>
          <BaseButton v-if="results.generated.length > 1" variant="outline" @click="copyAll">
            <Copy class="w-4 h-4 mr-2" /> Salin Semua
          </BaseButton>
          <BaseButton variant="primary" @click="$emit('close')">
            Selesai & Tutup
          </BaseButton>
        </div>
      </div>
    </template>
  </BaseModal>
</template>
