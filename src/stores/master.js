import { defineStore } from 'pinia'
import api from '@/services/api'

export const useMasterStore = defineStore('master', {
  state: () => ({
    academicYears: [],
    teachers: [],
    classes: [],
    subjects: [],
    loading: false
  }),
  actions: {
    async fetchAll() {
      this.loading = true
      try {
        const [ay, th, cl, sb] = await Promise.all([
          api.get('/master/academic-years'),
          api.get('/master/teachers'),
          api.get('/master/classes'),
          api.get('/master/subjects')
        ])
        
        this.academicYears = ay.data.data
        this.teachers = th.data.data
        this.classes = cl.data.data
        this.subjects = sb.data.data
      } catch (error) {
        console.error('Failed to fetch master data:', error)
      } finally {
        this.loading = false
      }
    }
  }
})
