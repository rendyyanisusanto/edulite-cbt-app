<script setup>
import { Monitor, Info } from 'lucide-vue-next'
</script>

<template>
  <div class="space-y-6 max-w-4xl">
    <div>
      <h2 class="text-2xl font-bold text-slate-800">Pengaturan CBT</h2>
      <p class="text-slate-500 mt-1">Konfigurasi sistem dan informasi aplikasi.</p>
    </div>

    <!-- App Info Card -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center space-x-3">
        <div class="bg-primary-blue/10 p-2 rounded-lg text-primary-blue">
          <Info class="w-5 h-5" />
        </div>
        <h3 class="text-lg font-semibold text-slate-800">Informasi Aplikasi</h3>
      </div>
      
      <div class="p-6">
        <div class="flex items-center space-x-4 mb-6">
          <div class="bg-primary-blue p-4 rounded-xl text-white">
            <Monitor class="w-8 h-8" />
          </div>
          <div>
            <h4 class="text-xl font-bold text-slate-900">CBT Edulite</h4>
            <p class="text-slate-500 text-sm">Sistem Ujian Berbasis Komputer</p>
          </div>
        </div>
        
        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 text-sm">
          <div>
            <dt class="font-medium text-slate-500">Versi</dt>
            <dd class="mt-1 text-slate-900 font-semibold">UI Prototype v1.0.0</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Lisensi</dt>
            <dd class="mt-1 text-slate-900">SMK IT Asy-Syadzili</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Teknologi Frontend</dt>
            <dd class="mt-1 text-slate-900">Vue 3, Vite, Tailwind CSS, Pinia</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Terakhir Diperbarui</dt>
            <dd class="mt-1 text-slate-900">September 2026</dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
</template>
