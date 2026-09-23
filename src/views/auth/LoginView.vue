<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { useAuthStore } from '@/stores/auth'
import { Monitor, Lock, Eye, EyeOff, User, AlertCircle } from 'lucide-vue-next'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const router = useRouter()
const authStore = useAuthStore()

const showPassword = ref(false)
const isLoading = ref(false)
const loginError = ref('')

const loginSchema = toTypedSchema(
  z.object({
    login: z.string().min(1, 'Username atau email harus diisi'),
    password: z.string().min(1, 'Password harus diisi')
  })
)

const { handleSubmit } = useForm({
  validationSchema: loginSchema
})

const onSubmit = handleSubmit(async (values) => {
  try {
    isLoading.value = true
    loginError.value = ''
    
    const user = await authStore.login(values.login, values.password)

    // Redirect based on role
    if (user.roles?.includes('ADMIN')) {
      router.push('/admin/dashboard')
    } else if (user.roles?.includes('GURU')) {
      router.push('/teacher/dashboard')
    } else {
      router.push('/')
    }
  } catch (error) {
    // Show inline error — no alert()
    const msg = error.response?.data?.message || 'Terjadi kesalahan. Silakan coba kembali.'
    loginError.value = msg
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen flex">
    <!-- Left Side: Branding (Hidden on mobile) -->
    <div class="hidden lg:flex lg:w-1/2 bg-sidebar relative overflow-hidden flex-col justify-between p-12">
      <!-- Abstract Background Elements -->
      <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div class="absolute -top-24 -left-24 w-96 h-96 rounded-full border-4 border-white"></div>
        <div class="absolute top-1/2 right-[-10%] w-[600px] h-[600px] rounded-full border-2 border-white -translate-y-1/2"></div>
      </div>

      <div class="relative z-10 flex items-center space-x-3 text-white">
        <div class="bg-primary-blue p-2.5 rounded-xl">
          <Monitor class="w-8 h-8" />
        </div>
        <span class="text-xl font-bold tracking-tight">CBT Edulite</span>
      </div>

      <div class="relative z-10 mt-auto">
        <h1 class="text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
          Sistem Ujian Berbasis Komputer
        </h1>
        <p class="text-lg text-slate-300 max-w-md">
          SMK IT Asy-Syadzili
        </p>
      </div>
      
      <div class="relative z-10 mt-12 text-sm text-slate-400">
        &copy; 2026 CBT Edulite. All rights reserved.
      </div>
    </div>

    <!-- Right Side: Login Form -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white">
      <div class="w-full max-w-md">
        
        <!-- Mobile Branding -->
        <div class="lg:hidden flex items-center justify-center space-x-3 text-sidebar mb-10">
          <div class="bg-primary-blue p-2 rounded-lg text-white">
            <Monitor class="w-6 h-6" />
          </div>
          <span class="text-xl font-bold tracking-tight">CBT Edulite</span>
        </div>

        <div class="text-center lg:text-left mb-10">
          <h2 class="text-3xl font-bold text-slate-900 mb-2">Selamat Datang</h2>
          <p class="text-slate-500">Masuk menggunakan akun Edulite Anda.</p>
        </div>

        <form @submit.prevent="onSubmit" class="space-y-5">
          <BaseInput
            name="login"
            label="Username atau Email"
            placeholder="Masukkan username atau email"
            :icon="User"
            :disabled="isLoading"
            autocomplete="username"
          />

          <BaseInput
            name="password"
            :type="showPassword ? 'text' : 'password'"
            label="Password"
            placeholder="Masukkan password Anda"
            :icon="Lock"
            :disabled="isLoading"
            autocomplete="current-password"
          >
            <template #append>
              <button 
                type="button" 
                @click="showPassword = !showPassword"
                class="text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                <Eye v-if="!showPassword" class="w-5 h-5" />
                <EyeOff v-else class="w-5 h-5" />
              </button>
            </template>
          </BaseInput>

          <!-- Inline Error -->
          <Transition
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 -translate-y-2"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-2"
          >
            <div
              v-if="loginError"
              class="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"
            >
              <AlertCircle class="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
              <p>{{ loginError }}</p>
            </div>
          </Transition>

          <BaseButton 
            type="submit" 
            variant="primary" 
            block 
            :loading="isLoading"
            class="py-2.5 text-base mt-2"
          >
            {{ isLoading ? 'Memproses...' : 'Masuk' }}
          </BaseButton>
        </form>
      </div>
    </div>
  </div>
</template>
