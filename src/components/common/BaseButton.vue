<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'danger', 'ghost', 'success', 'info', 'warning', 'outline'].includes(value)
  },
  type: {
    type: String,
    default: 'button'
  },
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  block: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
    :class="[
      block ? 'w-full' : '',
      {
        'bg-primary-blue text-white hover:bg-primary-dark focus:ring-primary-blue': variant === 'primary',
        'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-500': variant === 'secondary',
        'bg-white text-primary-blue border border-primary-blue hover:bg-blue-50 focus:ring-primary-blue': variant === 'outline',
        'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500': variant === 'danger',
        'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500': variant === 'success',
        'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500': variant === 'info',
        'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500': variant === 'warning',
        'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900': variant === 'ghost',
      }
    ]"
  >
    <svg v-if="loading" class="w-4 h-4 mr-2 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <slot />
  </button>
</template>
