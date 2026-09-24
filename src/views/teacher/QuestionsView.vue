<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAssignmentStore } from '@/stores/assignment'
import { useQuestionStore } from '@/stores/question'
import { useUiStore } from '@/stores/ui'
import { storeToRefs } from 'pinia'
import BaseDropdown from '@/components/common/BaseDropdown.vue'
import Skeleton from '@/components/common/Skeleton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import QuestionFormPanel from '@/components/teacher/QuestionFormPanel.vue'
import ImportQuestionModal from '@/components/teacher/ImportQuestionModal.vue'
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Copy, 
  Trash2,
  ChevronDown,
  ChevronUp,
  Target,
  Upload,
  Download,
  FileSpreadsheet,
  FileText as FilePdf
} from 'lucide-vue-next'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import * as XLSX from 'xlsx'
import html2pdf from 'html2pdf.js'

const route = useRoute()
const router = useRouter()
const assignmentStore = useAssignmentStore()
const questionStore = useQuestionStore()
const uiStore = useUiStore()

const { questions, loading: questionsLoading } = storeToRefs(questionStore)

const assignmentId = computed(() => Number(route.params.id))
const assignment = ref(null)

// State
const searchQuery = ref('')
const expandedQuestions = ref([])
const isPanelOpen = ref(false)
const selectedQuestion = ref(null)
const isSubmitting = ref(false)
const deleteModalOpen = ref(false)
const questionToDelete = ref(null)
const showMobileNavigator = ref(false)

const importModalOpen = ref(false)
const isExporting = ref(false)

const assignmentQuestions = computed(() => {
  let list = questionStore.getQuestionsByAssignment(assignmentId.value)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(question => question.questionText.toLowerCase().includes(q))
  }
  return list
})

const totalTarget = computed(() => {
  if (!assignment.value) return 0
  return (assignment.value.targetChoiceQuestions || 0) + (assignment.value.targetEssayQuestions || 0)
})

const getProgressPercentage = computed(() => {
  if (!assignment.value || totalTarget.value === 0) return 0
  return Math.round((assignmentQuestions.value.length / totalTarget.value) * 100)
})

const isTargetMet = computed(() => {
  if (!assignment.value) return false
  return assignmentQuestions.value.length >= totalTarget.value
})

const toggleExpand = (id) => {
  const index = expandedQuestions.value.indexOf(id)
  if (index === -1) {
    expandedQuestions.value.push(id)
  } else {
    expandedQuestions.value.splice(index, 1)
  }
}

const isExpanded = (id) => expandedQuestions.value.includes(id)

const openAddPanel = () => {
  selectedQuestion.value = null
  isPanelOpen.value = true
}

const openEditPanel = (question) => {
  selectedQuestion.value = question
  isPanelOpen.value = true
}

const handlePanelSubmit = async (payload) => {
  isSubmitting.value = true
  try {
    if (selectedQuestion.value) {
      await questionStore.updateQuestion(selectedQuestion.value.id, payload)
      uiStore.addToast('Soal berhasil diperbarui', 'success')
    } else {
      await questionStore.createQuestion(assignmentId.value, payload)
      uiStore.addToast('Soal berhasil ditambahkan', 'success')
      // Ensure it's expanded by default if they want to see it
    }
    isPanelOpen.value = false
  } catch (error) {
    uiStore.addToast(error.message, 'error')
  } finally {
    isSubmitting.value = false
  }
}

const handlePanelSubmitAndAdd = async (payload) => {
  isSubmitting.value = true
  try {
    await questionStore.createQuestion(assignmentId.value, payload)
    uiStore.addToast('Soal berhasil ditambahkan', 'success')
    // Keep panel open, just clear selectedQuestion so it resets form
    selectedQuestion.value = null
    // Note: the component internally resets form when selectedQuestion is null
    // But since it's already null, we might need to force a key update or expose a method.
    // For simplicity, we just close and reopen rapidly.
    isPanelOpen.value = false
    setTimeout(() => {
      isPanelOpen.value = true
    }, 50)
  } catch (error) {
    uiStore.addToast(error.message, 'error')
  } finally {
    isSubmitting.value = false
  }
}

const confirmDelete = (question) => {
  questionToDelete.value = question
  deleteModalOpen.value = true
}

const handleDelete = async () => {
  if (!questionToDelete.value) return
  isSubmitting.value = true
  try {
    await questionStore.deleteQuestion(questionToDelete.value.id)
    uiStore.addToast('Soal berhasil dihapus', 'success')
    deleteModalOpen.value = false
    questionToDelete.value = null
  } catch (error) {
    uiStore.addToast(error.message, 'error')
  } finally {
    isSubmitting.value = false
  }
}

const handleDuplicate = async (question) => {
  try {
    await questionStore.duplicateQuestion(question.id)
    uiStore.addToast('Soal berhasil diduplikasi', 'success')
  } catch (error) {
    uiStore.addToast(error.message, 'error')
  }
}

const getDropdownItems = (question) => [
  {
    label: 'Edit Soal',
    icon: Edit,
    onClick: () => openEditPanel(question)
  },
  {
    label: 'Duplikat',
    icon: Copy,
    onClick: () => handleDuplicate(question)
  },
  {
    label: 'Hapus',
    icon: Trash2,
    danger: true,
    onClick: () => confirmDelete(question)
  }
]

const handleImportSuccess = async (payload) => {
  importModalOpen.value = false
  uiStore.addToast(`Mengimpor soal dari ${payload.filename}...`, 'info')
  isSubmitting.value = true
  
  try {
    let successCount = 0
    let failCount = 0
    for (const q of payload.questions) {
      try {
        await questionStore.createQuestion(assignmentId.value, q)
        successCount++
      } catch (e) {
        console.error('Failed to import question:', e)
        failCount++
      }
    }
    
    if (failCount === 0) {
      uiStore.addToast(`Berhasil mengimpor ${successCount} soal`, 'success')
    } else {
      uiStore.addToast(`Berhasil mengimpor ${successCount} soal, ${failCount} gagal`, 'warning')
    }
  } catch (e) {
    console.error(e)
    uiStore.addToast('Gagal mengimpor file', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const stripHtmlTags = (html) => {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

const handleExportExcel = () => {
  isExporting.value = true
  uiStore.addToast('Mempersiapkan file Excel...', 'info')
  
  try {
    const data = assignmentQuestions.value.map((q, i) => {
      const row = {
        'No': i + 1,
        'Jenis Soal': q.questionType === 'ESSAY' ? 'Esai' : 'Pilihan Ganda',
        'Pertanyaan': stripHtmlTags(q.questionText),
        'Kunci Jawaban': q.questionType === 'ESSAY' ? stripHtmlTags(q.answerKey?.modelAnswer || '') : q.options.find(o => o.isCorrect)?.key,
        'Bobot': q.score || 1
      }
      if (q.questionType !== 'ESSAY') {
        q.options.forEach(opt => {
          row[`Opsi ${opt.key}`] = stripHtmlTags(opt.text)
        })
      }
      return row
    })
    
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Soal')
    XLSX.writeFile(wb, `Soal_${assignment.value?.exam?.title}_${assignment.value?.subject?.name}.xlsx`)
    uiStore.addToast('Berhasil mengekspor ke Excel', 'success')
  } catch (e) {
    console.error(e)
    uiStore.addToast('Gagal mengekspor file', 'error')
  } finally {
    isExporting.value = false
  }
}

const handleExportPDF = async () => {
  isExporting.value = true
  uiStore.addToast('Mempersiapkan file PDF...', 'info')
  
  try {
    // Generate an invisible div to render for PDF
    const el = document.createElement('div')
    el.innerHTML = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>${assignment.value?.exam?.title || 'Ujian'}</h2>
        <h3>Mata Pelajaran: ${assignment.value?.subject?.name || ''}</h3>
        <h3>Kelas: ${assignment.value?.class?.name || ''}</h3>
        <hr/>
        ${assignmentQuestions.value.map((q, i) => `
          <div style="margin-bottom: 20px;">
            <p><strong>${i + 1}.</strong> ${q.questionText}</p>
            ${q.questionType !== 'ESSAY' ? 
              `<ul style="list-style-type: none; padding-left: 20px;">
                ${q.options.map(opt => `<li><strong>${opt.key}.</strong> ${opt.text}</li>`).join('')}
              </ul>` : ''
            }
            <p style="color: green; font-size: 12px; margin-top: 5px;">
              <strong>Kunci:</strong> ${q.questionType === 'ESSAY' ? (q.answerKey?.modelAnswer || 'Ada') : q.options.find(o => o.isCorrect)?.key}
            </p>
          </div>
        `).join('')}
      </div>
    `
    
    const opt = {
      margin:       1,
      filename:     `Soal_${assignment.value?.exam?.title}_${assignment.value?.subject?.name}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    }
    
    await html2pdf().set(opt).from(el).save()
    uiStore.addToast('Berhasil mengekspor ke PDF', 'success')
  } catch (e) {
    console.error(e)
    uiStore.addToast('Gagal mengekspor file', 'error')
  } finally {
    isExporting.value = false
  }
}

const exportDropdownItems = [
  {
    label: 'Ekspor ke Excel',
    icon: FileSpreadsheet,
    onClick: handleExportExcel
  },
  {
    label: 'Ekspor ke PDF',
    icon: FilePdf,
    onClick: handleExportPDF
  }
]

onMounted(async () => {
  try {
    assignment.value = await assignmentStore.fetchTeacherAssignmentById(assignmentId.value)
    await questionStore.fetchQuestionsByAssignment(assignmentId.value)
  } catch(e) {
    console.error(e)
  }
})
</script>

<template>
  <div class="h-full flex flex-col relative max-w-7xl mx-auto">
    
    <!-- Sticky Header -->
    <div class="sticky top-0 z-20 bg-slate-50 pt-2 pb-5 border-b border-slate-200">
      <div class="flex items-center text-sm font-medium text-slate-500 mb-4">
        <button @click="router.push(`/teacher/assignments/${assignmentId}`)" class="hover:text-slate-800 flex items-center transition-colors">
          <ArrowLeft class="w-4 h-4 mr-1" />
          {{ assignment?.subject?.name || 'Kembali' }} — {{ assignment?.class?.name }}
        </button>
      </div>
      
      <div class="flex flex-col lg:flex-row justify-between lg:items-center gap-5 mt-2">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-slate-800">{{ assignment?.exam?.title }}</h1>
          <p class="text-sm text-slate-500 mt-1">
            <span class="font-medium text-slate-700">{{ assignmentQuestions.length }} / {{ totalTarget }}</span> soal terbuat
          </p>
        </div>
        
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
          <BaseButton variant="info" @click="importModalOpen = true" class="justify-center py-2.5">
            <Upload class="w-5 h-5 mr-2" />
            Impor dari Excel
          </BaseButton>
          
          <div class="w-full sm:w-auto flex">
            <BaseDropdown :items="exportDropdownItems" placement="bottom-end" class="w-full">
              <template #trigger>
                <BaseButton variant="success" :disabled="assignmentQuestions.length === 0 || isExporting" class="w-full justify-center py-2.5">
                  <Download class="w-5 h-5 mr-2" />
                  Ekspor
                  <ChevronDown class="w-4 h-4 ml-2" />
                </BaseButton>
              </template>
            </BaseDropdown>
          </div>

          <BaseButton variant="primary" @click="openAddPanel" class="justify-center py-2.5 font-bold shadow-md shadow-blue-500/30">
            <Plus class="w-5 h-5 mr-2" />
            Tambah Soal Baru
          </BaseButton>
        </div>
      </div>
    </div>

    <div class="flex-1 py-6 flex flex-col lg:flex-row gap-6 relative">
      
      <!-- Main Content Area -->
      <div class="flex-1 space-y-6">
        
        <!-- Progress Info -->
        <div class="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm font-semibold text-slate-700 flex items-center">
              <Target class="w-4 h-4 mr-2 text-slate-400" />
              Progress Soal
            </span>
            <span class="text-sm font-bold text-slate-900">{{ getProgressPercentage }}%</span>
          </div>
          <div class="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
            <div 
              class="h-2 rounded-full transition-all duration-500" 
              :class="isTargetMet ? 'bg-green-500' : 'bg-primary-blue'"
              :style="{ width: Math.min(getProgressPercentage, 100) + '%' }"
            ></div>
          </div>
          <p class="text-xs text-slate-500">
            <template v-if="isTargetMet">
              <span class="text-green-600 font-medium">Target soal sudah terpenuhi.</span>
            </template>
            <template v-else>
              {{ totalTarget - assignmentQuestions.length }} soal lagi untuk mencapai target.
            </template>
          </p>
        </div>

        <!-- Toolbar -->
        <div class="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
          <div class="w-full sm:max-w-sm">
            <BaseInput 
              name="search" 
              v-model="searchQuery" 
              placeholder="Cari isi soal..." 
              :icon="Search"
              class="!mb-0"
            />
          </div>
        </div>

        <!-- Question List -->
        <div v-if="questionsLoading" class="space-y-4">
          <Skeleton type="card" />
          <Skeleton type="card" />
          <Skeleton type="card" />
        </div>
        
        <div v-else-if="assignmentQuestions.length === 0" class="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <div class="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText class="w-8 h-8" />
          </div>
          <h3 class="text-lg font-bold text-slate-800">Belum Ada Soal</h3>
          <p class="text-slate-500 mt-1 max-w-md mx-auto mb-6">
            Mulai tambahkan soal untuk ujian ini.
          </p>
          <BaseButton @click="openAddPanel" variant="outline" class="border-primary-blue text-primary-blue hover:bg-blue-50">
            <Plus class="w-4 h-4 mr-2" /> Tambah Soal Pertama
          </BaseButton>
        </div>

        <div v-else class="space-y-4 pb-20 lg:pb-0">
          <div 
            v-for="(question, index) in assignmentQuestions" 
            :key="question.id"
            :id="`question-${index + 1}`"
            class="bg-white rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors"
          >
            <div class="p-4 sm:p-5 flex items-start gap-4">
              <!-- Number -->
              <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 shrink-0 text-sm">
                {{ index + 1 }}
              </div>
              
              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-xs font-bold px-2 py-0.5 rounded" :class="question.questionType === 'ESSAY' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'">
                    {{ question.questionType === 'ESSAY' ? 'Esai' : 'Pilihan Ganda' }}
                  </span>
                </div>
                
                <div class="text-slate-800 font-medium prose prose-sm max-w-none mb-3" v-html="question.questionText"></div>
                <div v-if="question.mediaUrl" class="mb-3">
                  <img :src="question.mediaUrl" class="max-h-40 rounded border border-slate-200" alt="Gambar Soal" />
                </div>
                
                <!-- Compact Info -->
                <div v-if="!isExpanded(question.id)" class="flex items-center text-xs text-slate-500 space-x-3">
                  <span v-if="question.questionType !== 'ESSAY'" class="bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">Kunci: {{ question.options.find(o => o.isCorrect)?.key }}</span>
                  <span v-else class="bg-purple-50 border border-purple-200 text-purple-700 px-2 py-0.5 rounded font-bold flex items-center">
                    Ada Rubrik Penilaian
                  </span>
                  
                  <span class="bg-slate-100 px-2 py-0.5 rounded">Bobot: {{ question.score }}</span>
                  <button @click="toggleExpand(question.id)" class="text-primary-blue hover:underline flex items-center ml-auto">
                    Tampilkan Detail <ChevronDown class="w-3 h-3 ml-1" />
                  </button>
                </div>

                <!-- Expanded Detail -->
                <div v-else class="mt-4 space-y-2">
                  <!-- Pilihan Ganda -->
                  <template v-if="question.questionType !== 'ESSAY'">
                    <div 
                      v-for="opt in question.options" 
                      :key="opt.key"
                      class="flex items-start p-2.5 rounded-lg text-sm border"
                      :class="opt.isCorrect ? 'bg-green-50 border-green-200 text-green-800' : 'bg-white border-slate-100 text-slate-600'"
                    >
                      <span class="font-bold mr-3" :class="opt.isCorrect ? 'text-green-700' : 'text-slate-400'">{{ opt.key }}.</span>
                      <span class="flex-1">{{ opt.text }}</span>
                    </div>
                  </template>
                  
                  <!-- Esai -->
                  <template v-else>
                    <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <p class="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Rubrik Penilaian / Kunci Jawaban</p>
                      <div class="prose prose-sm max-w-none text-slate-700" v-html="question.answerKey?.modelAnswer || '<em>Tidak ada rubrik.</em>'"></div>
                    </div>
                  </template>
                  
                  <div class="mt-3 flex items-center text-xs text-slate-500 space-x-3 justify-end">
                    <span class="bg-slate-100 px-2 py-0.5 rounded">Bobot: {{ question.score }}</span>
                    <button @click="toggleExpand(question.id)" class="text-slate-500 hover:text-slate-700 flex items-center">
                      Sembunyikan <ChevronUp class="w-3 h-3 ml-1" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="shrink-0 ml-2">
                <BaseDropdown :items="getDropdownItems(question)" placement="bottom-end">
                  <template #trigger>
                    <button class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none">
                      <MoreVertical class="w-5 h-5" />
                    </button>
                  </template>
                </BaseDropdown>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop Sidebar Navigator -->
      <div class="hidden lg:block w-72 shrink-0">
        <div class="sticky top-[140px] bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 class="font-bold text-slate-800 mb-4">Navigasi Soal</h3>
          <div class="grid grid-cols-5 gap-2">
            <button 
              v-for="i in assignmentQuestions.length" 
              :key="i"
              @click="() => document.getElementById(`question-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })"
              class="h-10 rounded border border-slate-200 flex items-center justify-center text-sm font-medium text-slate-600 hover:bg-primary-blue hover:text-white hover:border-primary-blue transition-colors"
            >
              {{ i }}
            </button>
            <button 
              @click="openAddPanel"
              class="h-10 rounded border border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-primary-blue hover:border-primary-blue hover:bg-blue-50 transition-colors"
              title="Tambah Soal"
            >
              <Plus class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Sticky Action (if needed) -->
    <div class="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 flex justify-between gap-3">
      <BaseButton variant="outline" class="flex-1 justify-center relative" @click="showMobileNavigator = !showMobileNavigator">
        Navigasi
        <span class="absolute -top-2 -right-2 w-5 h-5 bg-primary-blue text-white text-[10px] rounded-full flex items-center justify-center font-bold">
          {{ assignmentQuestions.length }}
        </span>
      </BaseButton>
      <BaseButton class="flex-1 justify-center" @click="openAddPanel">
        <Plus class="w-4 h-4 mr-1" /> Tambah Soal
      </BaseButton>
    </div>

    <!-- Mobile Navigator Panel -->
    <Transition name="fade-slide-up">
      <div v-if="showMobileNavigator && window.innerWidth < 1024" class="lg:hidden fixed bottom-20 left-4 right-4 bg-white rounded-xl border border-slate-200 shadow-lg p-5 z-30">
        <div class="flex justify-between items-center mb-3">
          <h3 class="font-bold text-slate-800">Navigasi Soal</h3>
          <button @click="showMobileNavigator = false" class="p-1 text-slate-400"><X class="w-5 h-5"/></button>
        </div>
        <div class="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-60 overflow-y-auto scrollbar-thin p-1">
          <button 
            v-for="i in assignmentQuestions.length" 
            :key="i"
            @click="() => {
              showMobileNavigator = false
              document.getElementById(`question-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }"
            class="h-10 rounded border border-slate-200 flex items-center justify-center text-sm font-medium text-slate-600 hover:bg-primary-blue hover:text-white"
          >
            {{ i }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- Side Panel -->
    <QuestionFormPanel 
      :isOpen="isPanelOpen"
      :question="selectedQuestion"
      :assignmentId="assignmentId"
      :loading="isSubmitting"
      @close="isPanelOpen = false"
      @submit="handlePanelSubmit"
      @submit-and-add="handlePanelSubmitAndAdd"
    />

    <!-- Delete Confirmation -->
    <BaseModal 
      :isOpen="deleteModalOpen" 
      title="Hapus Soal" 
      @close="deleteModalOpen = false"
      maxWidth="max-w-sm"
    >
      <div class="py-4">
        <p class="text-slate-600">Apakah Anda yakin ingin menghapus soal ini? Soal akan dihapus permanen dari daftar.</p>
        <div class="mt-6 flex justify-end space-x-3">
          <BaseButton variant="secondary" @click="deleteModalOpen = false" :disabled="isSubmitting">Batal</BaseButton>
          <BaseButton variant="danger" @click="handleDelete" :loading="isSubmitting">Hapus</BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Import Modal -->
    <ImportQuestionModal 
      :isOpen="importModalOpen"
      @close="importModalOpen = false"
      @import-success="handleImportSuccess"
    />
  </div>
</template>

<style scoped>
.fade-slide-up-enter-active,
.fade-slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-slide-up-enter-from,
.fade-slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
