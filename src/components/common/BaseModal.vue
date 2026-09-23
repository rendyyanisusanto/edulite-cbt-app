<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  maxWidth: {
    type: String,
    default: 'max-w-lg' // e.g., max-w-sm, max-w-md, max-w-lg, max-w-xl
  }
})

const emit = defineEmits(['close'])

const handleKeydown = (e) => {
  if (e.key === 'Escape' && props.isOpen) {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" @click="emit('close')"></div>
        
        <!-- Modal Panel -->
        <div 
          class="relative bg-white rounded-xl shadow-xl w-full flex flex-col transform transition-all overflow-hidden max-h-[90vh]"
          :class="[maxWidth]"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 class="text-lg font-semibold text-slate-800">{{ title }}</h3>
            <button @click="emit('close')" class="text-slate-400 hover:text-slate-600 transition-colors rounded-full p-1 hover:bg-slate-100">
              <X class="w-5 h-5" />
            </button>
          </div>
          
          <!-- Body -->
          <div class="px-6 py-4 overflow-y-auto">
            <slot />
          </div>
          
          <!-- Footer -->
          <div v-if="$slots.footer" class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3 rounded-b-xl">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
