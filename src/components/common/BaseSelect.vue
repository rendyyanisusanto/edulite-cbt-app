<script setup>
import { useField } from 'vee-validate'

const props = defineProps({
  name: {
    type: String,
    required: true
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

const { value, errorMessage, handleBlur, handleChange } = useField(() => props.name, undefined, {
  validateOnValueUpdate: false
})
</script>

<template>
  <div class="mb-4 w-full">
    <label v-if="label" :for="name" class="block mb-1.5 text-sm font-medium text-slate-700">
      {{ label }}
    </label>
    <div class="relative">
      <select
        :id="name"
        :name="name"
        :value="value"
        @change="handleChange"
        @blur="handleBlur"
        :disabled="disabled"
        class="block w-full appearance-none rounded-lg border px-3 py-2 pr-10 text-slate-900 text-sm focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-500 transition-colors duration-200"
        :class="[
          errorMessage 
            ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
            : 'border-slate-300 focus:border-primary-blue focus:ring-blue-100 hover:border-slate-400',
          !value ? 'text-slate-500' : ''
        ]"
      >
        <option value="" disabled>{{ placeholder }}</option>
        <option v-for="option in options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
        <svg class="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
        </svg>
      </div>
    </div>
    <p v-if="errorMessage" class="mt-1 text-sm text-red-500">
      {{ errorMessage }}
    </p>
  </div>
</template>
