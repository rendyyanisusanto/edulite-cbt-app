<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import { LogOut } from 'lucide-vue-next'
import BaseModal from '../common/BaseModal.vue'
import BaseButton from '../common/BaseButton.vue'

const router = useRouter()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const showLogoutModal = ref(false)
const isLoggingOut = ref(false)

const handleLogout = async () => {
  isLoggingOut.value = true
  await authStore.logout()
  isLoggingOut.value = false
  showLogoutModal.value = false
  router.push('/login')
}
</script>

<template>
  <div class="p-4 bg-sidebar-dark/50 mt-auto">
    <div class="flex items-center p-3 bg-sidebar-dark rounded-xl border border-white/5">
      <div class="flex-shrink-0">
        <div class="w-10 h-10 rounded-full bg-primary-blue flex items-center justify-center text-white font-semibold text-sm">
          {{ user?.name ? user.name.substring(0, 2).toUpperCase() : 'AD' }}
        </div>
      </div>
      <div class="ml-3 min-w-0 flex-1">
        <p class="text-sm font-medium text-white truncate">
          {{ user?.name || 'Administrator' }}
        </p>
        <p class="text-xs text-slate-400 truncate">
          {{ user?.roles?.[0] || 'Administrator' }}
        </p>
      </div>
      <div class="ml-2 flex-shrink-0">
        <button 
          @click="showLogoutModal = true"
          class="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          title="Keluar"
        >
          <LogOut class="w-5 h-5" />
        </button>
      </div>
    </div>

    <BaseModal 
      :isOpen="showLogoutModal" 
      title="Konfirmasi Keluar" 
      @close="showLogoutModal = false"
      maxWidth="max-w-sm"
    >
      <div class="py-4">
        <p class="text-slate-600 text-sm">
          Apakah Anda yakin ingin keluar dari sistem CBT Edulite?
        </p>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="showLogoutModal = false">Batal</BaseButton>
        <BaseButton variant="danger" :loading="isLoggingOut" @click="handleLogout">Ya, Keluar</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
