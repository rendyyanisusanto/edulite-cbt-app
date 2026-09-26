<script setup>
import { RouterLink, useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import AccountCard from './AccountCard.vue'
import { 
  Monitor, 
  LayoutDashboard, 
  FileText, 
  Award
} from 'lucide-vue-next'

const route = useRoute()
const uiStore = useUiStore()

const menuGroups = [
  {
    items: [
      { name: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard }
    ]
  },
  {
    title: 'UJIAN',
    items: [
      { name: 'Ujian Saya', path: '/teacher/exams', icon: FileText },
      { name: 'Monitoring Ujian', path: '/teacher/monitoring', icon: Monitor }
    ]
  },
  {
    title: 'HASIL',
    items: [
      { name: 'Hasil Ujian', path: '/teacher/results', icon: Award }
    ]
  }
]

const isActive = (path) => {
  if (route.path === path) return true
  if (path !== '/teacher/dashboard' && route.path.startsWith(path)) return true
  return false
}

const handleMenuClick = () => {
  if (window.innerWidth < 1024) {
    uiStore.closeSidebar()
  }
}
</script>

<template>
  <div class="flex flex-col h-full flex-1 overflow-hidden bg-sidebar">
    <!-- Logo area -->
    <div class="flex items-center px-6 h-20 border-b border-white/10 shrink-0">
      <div class="flex items-center space-x-3 text-white">
        <div class="bg-primary-blue p-2 rounded-lg">
          <Monitor class="w-6 h-6" />
        </div>
        <div>
          <h1 class="text-lg font-bold leading-none tracking-tight">CBT Edulite</h1>
          <p class="text-[10px] text-slate-300 tracking-wider font-medium mt-1 uppercase">Panel Guru</p>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-thin">
      <div v-for="(group, gIndex) in menuGroups" :key="gIndex">
        <h2 v-if="group.title" class="px-3 mb-3 text-xs font-semibold text-slate-400 tracking-wider">
          {{ group.title }}
        </h2>
        <ul class="space-y-1">
          <li v-for="item in group.items" :key="item.path">
            <RouterLink
              :to="item.path"
              @click="handleMenuClick"
              class="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group relative"
              :class="isActive(item.path) 
                ? 'bg-primary-blue/90 text-white shadow-sm' 
                : 'text-slate-300 hover:bg-white/5 hover:text-white'"
            >
              <!-- Active Indicator (optional) -->
              <div v-if="isActive(item.path)" class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full -ml-4"></div>
              
              <component 
                :is="item.icon" 
                class="w-5 h-5 mr-3 flex-shrink-0 transition-colors"
                :class="isActive(item.path) ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'"
              />
              {{ item.name }}
            </RouterLink>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Account Card -->
    <AccountCard />
  </div>
</template>

<style scoped>
/* Custom scrollbar for webkit */
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
.scrollbar-thin:hover::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
}
</style>
