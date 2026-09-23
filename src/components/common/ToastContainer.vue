<script setup>
import { useUiStore } from '@/stores/ui'
import { storeToRefs } from 'pinia'
import { CheckCircle, XCircle, Info, X } from 'lucide-vue-next'

const uiStore = useUiStore()
const { toasts } = storeToRefs(uiStore)
</script>

<template>
  <div class="fixed top-4 right-4 z-50 flex flex-col space-y-3 w-full max-w-sm px-4 sm:px-0 pointer-events-none">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="flex items-start p-4 bg-white rounded-lg shadow-lg border border-slate-100 pointer-events-auto overflow-hidden relative"
      >
        <div class="flex-shrink-0">
          <CheckCircle v-if="toast.type === 'success'" class="w-5 h-5 text-green-500" />
          <XCircle v-else-if="toast.type === 'error'" class="w-5 h-5 text-red-500" />
          <Info v-else class="w-5 h-5 text-blue-500" />
        </div>
        <div class="ml-3 w-0 flex-1 pt-0.5">
          <p class="text-sm font-medium text-slate-900">
            {{ toast.message }}
          </p>
        </div>
        <div class="ml-4 flex flex-shrink-0">
          <button
            @click="uiStore.removeToast(toast.id)"
            class="inline-flex text-slate-400 hover:text-slate-500 focus:outline-none"
          >
            <span class="sr-only">Close</span>
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
