<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useField } from 'vee-validate'

const props = defineProps({
  name: {
    type: String,
    required: false
  },
  modelValue: {
    type: [String, Number],
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  options: {
    type: Array,
    default: () => [] // { label: '', value: '' }
  },
  placeholder: {
    type: String,
    default: 'Pilih salah satu...'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

// Vee-validate integration if name is provided
const isVeeValidate = computed(() => !!props.name)
const { value: veeValue, errorMessage, handleChange } = useField(() => props.name, undefined, {
  validateOnValueUpdate: false,
  syncVModel: false
})

const currentValue = computed(() => isVeeValidate.value ? veeValue.value : props.modelValue)

const isOpen = ref(false)
const searchQuery = ref('')
const containerRef = ref(null)
const searchInputRef = ref(null)

const selectedOption = computed(() => {
  return props.options.find(o => o.value === currentValue.value)
})

const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options
  const q = searchQuery.value.toLowerCase()
  return props.options.filter(o => o.label.toLowerCase().includes(q))
})

const toggleDropdown = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    searchQuery.value = ''
    setTimeout(() => {
      if (searchInputRef.value) searchInputRef.value.focus()
    }, 50)
  }
}

const selectOption = (option) => {
  if (isVeeValidate.value) {
    handleChange(option.value)
  }
  emit('update:modelValue', option.value)
  emit('change', option.value)
  isOpen.value = false
}

const closeDropdown = (e) => {
  if (containerRef.value && !containerRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', closeDropdown))
onUnmounted(() => document.removeEventListener('click', closeDropdown))
</script>

<template>
  <div class="mb-4 w-full" ref="containerRef">
    <label v-if="label" :for="name || 'select'" class="block mb-1.5 text-sm font-medium text-slate-700">
      {{ label }}
    </label>
    <div class="relative">
      <div 
        @click="toggleDropdown"
        class="block w-full appearance-none rounded-xl border bg-white px-3 py-2.5 pr-10 text-slate-900 shadow-sm transition-colors cursor-pointer sm:text-sm"
        :class="[
          isOpen 
            ? 'border-primary-blue ring-2 ring-blue-100' 
            : (errorMessage ? 'border-red-300' : 'border-slate-300 hover:border-slate-400'),
          disabled ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''
        ]"
      >
        <span v-if="selectedOption" class="block truncate">{{ selectedOption.label }}</span>
        <span v-else class="block truncate text-slate-500">{{ placeholder }}</span>
        
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
          <svg class="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
          </svg>
        </div>
      </div>
      
      <transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-75 ease-in"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <div v-if="isOpen" class="absolute z-50 mt-1 w-full rounded-xl bg-white shadow-lg border border-slate-100 max-h-60 flex flex-col">
          <div class="p-2 border-b border-slate-50">
            <input 
              ref="searchInputRef"
              v-model="searchQuery" 
              type="text" 
              class="w-full rounded-lg bg-slate-50 px-3 py-2 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-blue/20" 
              placeholder="Cari..."
              @click.stop
            >
          </div>
          <ul class="overflow-y-auto flex-1 p-1">
            <li 
              v-for="option in filteredOptions" 
              :key="option.value"
              @click="selectOption(option)"
              class="cursor-pointer select-none rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-primary-blue transition-colors"
              :class="{'bg-blue-50 text-primary-blue font-medium': option.value === currentValue}"
            >
              {{ option.label }}
            </li>
            <li v-if="filteredOptions.length === 0" class="px-3 py-4 text-center text-sm text-slate-500">
              Data tidak ditemukan
            </li>
          </ul>
        </div>
      </transition>
    </div>
    <p v-if="errorMessage" class="mt-1 text-sm text-red-500">
      {{ errorMessage }}
    </p>
  </div>
</template>
