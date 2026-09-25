<script setup>
import { computed } from 'vue'

const props = defineProps({
  students: {
    type: Array,
    required: true
  }
})

const validStudents = computed(() => {
  return props.students.filter(s => s.account?.exists)
})
</script>

<template>
  <div class="print-cards-container">
    <div v-for="student in validStudents" :key="student.studentId" class="card">
      <div class="card-header">
        <h3 class="title">KARTU PESERTA CBT</h3>
      </div>
      <div class="card-body">
        <div class="row">
          <span class="label">Nama</span>
          <span class="colon">:</span>
          <span class="value font-bold">{{ student.name }}</span>
        </div>
        <div class="row">
          <span class="label">Kelas</span>
          <span class="colon">:</span>
          <span class="value">{{ student.class?.name || '-' }}</span>
        </div>
        <div class="row">
          <span class="label">Username</span>
          <span class="colon">:</span>
          <span class="value font-mono">{{ student.account.username }}</span>
        </div>
        <div class="row">
          <span class="label">Password</span>
          <span class="colon">:</span>
          <span class="value font-mono">{{ student.account.plainPassword || '******' }}</span>
        </div>
      </div>
      <div class="card-footer">
        Harap simpan kartu ini baik-baik.
      </div>
    </div>
  </div>
</template>

<style scoped>
.print-cards-container {
  display: none;
}

@media print {
  /* Hide the rest of the app */
  :deep(body > *:not(#app)), :deep(#app > *:not(.print-cards-container)) {
    display: none !important;
  }
  
  .print-cards-container {
    display: grid !important;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    padding: 10px;
    background: white;
    width: 100%;
    position: absolute;
    left: 0;
    top: 0;
  }

  .card {
    border: 1px solid #333;
    border-radius: 6px;
    break-inside: avoid;
    font-family: Arial, sans-serif;
    color: #000;
    overflow: hidden;
  }

  .card-header {
    background-color: #f1f5f9 !important;
    border-bottom: 1px solid #333;
    padding: 6px;
    text-align: center;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .title {
    font-size: 11px;
    font-weight: bold;
    margin: 0;
  }

  .card-body {
    padding: 6px;
  }

  .row {
    display: flex;
    margin-bottom: 4px;
    font-size: 10px;
  }

  .label {
    width: 55px;
    color: #333;
  }

  .colon {
    width: 10px;
  }

  .value {
    flex: 1;
    word-break: break-word;
  }

  .font-bold {
    font-weight: bold;
  }

  .font-mono {
    font-family: monospace;
  }

  .card-footer {
    padding: 4px;
    text-align: center;
    font-size: 9px;
    font-style: italic;
    border-top: 1px dashed #ccc;
  }
}
</style>

