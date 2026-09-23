<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import { Menu, Bell } from 'lucide-vue-next'

const route = useRoute()
const uiStore = useUiStore()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const pageTitle = computed(() => {
  return route.meta?.title || 'CBT Edulite'
})

const pageDescription = computed(() => {
  return route.meta?.description || ''
})
</script>

<template>
  <header class="bg-white border-b border-slate-200 h-16 flex-shrink-0 flex items-center justify-between px-4 lg:px-8">
    <!-- Mobile left: Hamburger + Title -->
    <div class="flex items-center lg:hidden">
      <button 
        @click="uiStore.toggleSidebar()"
        class="p-2 -ml-2 mr-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue transition-colors"
      >
        <Menu class="w-6 h-6" />
      </button>
      <h1 class="text-lg font-semibold text-slate-800">{{ pageTitle }}</h1>
    </div>

    <!-- Desktop left: Page Title & Desc -->
    <div class="hidden lg:block">
      <h1 class="text-xl font-semibold text-slate-800">{{ pageTitle }}</h1>
      <p v-if="pageDescription" class="text-sm text-slate-500 mt-0.5">{{ pageDescription }}</p>
    </div>

    <!-- Right: Actions & User Info -->
    <div class="flex items-center space-x-4">
      <button class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative">
        <Bell class="w-5 h-5" />
        <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
      </button>

      <div class="hidden sm:flex items-center space-x-3 pl-4 border-l border-slate-200">
        <div class="text-right">
          <p class="text-sm font-medium text-slate-700 leading-tight">{{ user?.name || 'Administrator' }}</p>
          <p class="text-xs text-slate-500">{{ user?.roles?.[0] || 'Administrator' }}</p>
        </div>
        <div class="w-9 h-9 rounded-full bg-primary-blue/10 text-primary-blue flex items-center justify-center font-semibold text-sm">
          {{ user?.name ? user.name.substring(0, 2).toUpperCase() : 'AD' }}
        </div>
      </div>
    </div>
  </header>
</template>
