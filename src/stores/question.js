import { defineStore } from 'pinia'
import api from '@/services/api'

export const useQuestionStore = defineStore('question', {
  state: () => ({
    questions: [],
    loading: false,
    error: null,
    search: '',
    typeFilter: 'Semua'
  }),
  
  getters: {
    getQuestionsByAssignment: (state) => (assignmentId) => {
      return state.questions.filter(q => q.assignmentId === Number(assignmentId))
    },
    getQuestionById: (state) => (id) => {
      return state.questions.find(q => q.id === Number(id))
    },
    filteredQuestions: (state) => (assignmentId) => {
      let filtered = state.questions.filter(q => q.assignmentId === Number(assignmentId))
      
      if (state.search) {
        const qSearch = state.search.toLowerCase()
        filtered = filtered.filter(q => q.questionText.toLowerCase().includes(qSearch))
      }
      
      if (state.typeFilter !== 'Semua') {
        const type = state.typeFilter === 'Pilihan Ganda' ? 'SINGLE_CHOICE' : 'ESSAY'
        filtered = filtered.filter(q => q.questionType === type)
      }
      
      return filtered
    }
  },
  
  actions: {
    async fetchQuestionsByAssignment(assignmentId) {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.get(`/teacher/assignments/${assignmentId}/questions`)
        this.questions = this.questions.filter(q => q.assignmentId !== Number(assignmentId)).concat(data.data)
        return data.data
      } catch (err) {
        this.error = 'Gagal memuat soal'
        throw err
      } finally {
        this.loading = false
      }
    },
    
    async createQuestion(assignmentId, payload) {
      this.loading = true
      try {
        const { data } = await api.post(`/teacher/assignments/${assignmentId}/questions`, payload)
        this.questions.push(data.data)
        return data.data
      } catch (err) {
        console.error('Failed to create question:', err)
        throw err
      } finally {
        this.loading = false
      }
    },
    
    async updateQuestion(id, payload) {
      this.loading = true
      try {
        const { data } = await api.put(`/teacher/questions/${id}`, payload)
        const idx = this.questions.findIndex(q => q.id === id)
        if (idx !== -1) {
          this.questions[idx] = data.data
        }
        return data.data
      } catch (err) {
        console.error('Failed to update question:', err)
        throw err
      } finally {
        this.loading = false
      }
    },
    
    async duplicateQuestion(id) {
      this.loading = true
      try {
        const { data } = await api.post(`/teacher/questions/${id}/duplicate`)
        this.questions.push(data.data)
        return data.data
      } catch (err) {
        console.error('Failed to duplicate question:', err)
        throw err
      } finally {
        this.loading = false
      }
    },
    
    async cloneQuestions(assignmentId, sourceAssignmentId) {
      this.loading = true
      try {
        const { data } = await api.post(`/teacher/assignments/${assignmentId}/clone-questions`, { sourceAssignmentId })
        // Replace current assignment questions with updated list from backend
        this.questions = this.questions.filter(q => q.assignmentId !== Number(assignmentId)).concat(data.data)
        return data.data
      } catch (err) {
        console.error('Failed to clone questions:', err)
        throw err
      } finally {
        this.loading = false
      }
    },
    
    async deleteQuestion(id) {
      this.loading = true
      try {
        await api.delete(`/teacher/questions/${id}`)
        this.questions = this.questions.filter(q => q.id !== id)
      } catch (err) {
        console.error('Failed to delete question:', err)
        throw err
      } finally {
        this.loading = false
      }
    }
  }
})
