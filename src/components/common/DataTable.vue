<script setup>
defineProps({
  columns: {
    type: Array,
    required: true // [{ key: 'id', label: 'ID', sortable: false }]
  },
  data: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-sm text-left text-slate-600">
        <thead class="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
          <tr>
            <th 
              v-for="col in columns" 
              :key="col.key"
              scope="col" 
              class="px-6 py-4 font-medium whitespace-nowrap"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="columns.length" class="px-6 py-8 text-center text-slate-500">
              <div class="flex items-center justify-center space-x-2">
                <svg class="w-5 h-5 animate-spin text-primary-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Memuat data...</span>
              </div>
            </td>
          </tr>
          <tr v-else-if="data.length === 0">
            <td :colspan="columns.length" class="px-6 py-8 text-center text-slate-500">
              Tidak ada data.
            </td>
          </tr>
          <template v-else>
            <tr 
              v-for="(row, index) in data" 
              :key="index"
              class="bg-white border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors"
            >
              <td 
                v-for="col in columns" 
                :key="col.key"
                class="px-6 py-4"
              >
                <slot :name="col.key" :row="row" :value="row[col.key]">
                  {{ row[col.key] }}
                </slot>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>
