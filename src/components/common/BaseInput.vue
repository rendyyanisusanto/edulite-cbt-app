<script setup>
import { useField } from 'vee-validate'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'text'
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  icon: {
    type: [Object, Function],
    default: null
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
      <div v-if="icon" class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
        <component :is="icon" class="w-5 h-5" />
      </div>
      <input
        :id="name"
        :type="type"
        :name="name"
        :value="value"
        @input="handleChange"
        @blur="handleBlur"
        :placeholder="placeholder"
        :disabled="disabled"
        class="block w-full rounded-lg border px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-500 transition-colors duration-200"
        :class="[
          icon ? 'pl-10' : '',
          errorMessage 
            ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
            : 'border-slate-300 focus:border-primary-blue focus:ring-blue-100 hover:border-slate-400'
        ]"
      >
      <!-- Option to pass append icon/button -->
      <div v-if="$slots.append" class="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer">
        <slot name="append" />
      </div>
    </div>
    <p v-if="errorMessage" class="mt-1 text-sm text-red-500">
      {{ errorMessage }}
    </p>
  </div>
</template>
