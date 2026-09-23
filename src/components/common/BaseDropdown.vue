<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    required: true // [{ label: '', icon: Component, onClick: fn, danger: boolean }]
  }
})

const isOpen = ref(false)
const dropdownRef = ref(null)

const toggle = () => {
  isOpen.value = !isOpen.value
}

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false
  }
}

const handleItemClick = (item) => {
  if (item.onClick) {
    item.onClick()
  }
  isOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="relative inline-block text-left" ref="dropdownRef">
    <div @click="toggle" class="inline-flex w-full">
      <slot name="trigger" />
    </div>

    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
      >
        <div class="py-1">
          <button
            v-for="(item, index) in items"
            :key="index"
            @click="handleItemClick(item)"
            class="group flex w-full items-center px-4 py-2 text-sm transition-colors"
            :class="item.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-100'"
          >
            <component v-if="item.icon" :is="item.icon" class="mr-3 h-4 w-4" :class="item.danger ? 'text-red-500' : 'text-slate-400 group-hover:text-slate-500'" />
            {{ item.label }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
