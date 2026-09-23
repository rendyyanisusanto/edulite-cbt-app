import { defineStore } from 'pinia'
import api from '@/services/api'

export const useResultStore = defineStore('result', {
  state: () => ({
    results: [],
    loading: false,
    error: null
  }),
  
  getters: {
    getResultsByAssignment: (state) => (assignmentId) => {
      return state.results.filter(r => r.assignmentId === Number(assignmentId))
    },
    getStudentResult: (state) => (assignmentId, studentId) => {
      return state.results.find(r => 
        r.assignmentId === Number(assignmentId) && 
        r.studentId === Number(studentId)
      )
    },
    getAssignmentSummary: (state) => (assignmentId) => {
      const assignmentResults = state.results.filter(r => r.assignmentId === Number(assignmentId))
      
      const participants = assignmentResults.length
      const completed = assignmentResults.filter(r => r.status === 'completed').length
      const pending = assignmentResults.filter(r => r.status === 'pending').length
      
      let average = 0
      if (completed > 0) {
        const totalScore = assignmentResults
          .filter(r => r.status === 'completed')
          .reduce((sum, r) => sum + (r.finalScore || 0), 0)
        average = Number((totalScore / completed).toFixed(1))
      }
      
      const essayPending = assignmentResults.reduce((sum, r) => sum + (r.essay?.pending || 0), 0)
      
      return {
        participants,
        completed,
        pending,
        average,
        essayPending
      }
    }
  },
  
  actions: {
    async fetchResultsByAssignment(assignmentId) {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.get(`/teacher/assignments/${assignmentId}/results`)
        const mappedData = data.data.map(r => ({
          ...r,
          assignmentId: Number(assignmentId),
          status: ['SUBMITTED', 'TIME_EXPIRED', 'COMPLETED'].includes(r.attemptStatus) ? 'completed' : 'pending',
          score: r.finalScore || 0
        }))
        this.results = this.results.filter(r => r.assignmentId !== Number(assignmentId)).concat(mappedData)
        return mappedData
      } catch (err) {
        this.error = 'Gagal memuat hasil ujian'
        throw err
      } finally {
        this.loading = false
      }
    },
    
    async fetchStudentResult(assignmentId, studentId) {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.get(`/teacher/assignments/${assignmentId}/results/${studentId}`)
        const detailedData = data.data
        
        const index = this.results.findIndex(r => r.assignmentId === Number(assignmentId) && r.studentId === Number(studentId))
        if (index !== -1) {
          this.results[index] = { ...this.results[index], ...detailedData }
        } else {
          this.results.push({
            assignmentId: Number(assignmentId),
            studentId: Number(studentId),
            ...detailedData
          })
        }
        return detailedData
      } catch (err) {
        this.error = 'Gagal memuat detail hasil siswa'
        throw err
      } finally {
        this.loading = false
      }
    }
  }
})
