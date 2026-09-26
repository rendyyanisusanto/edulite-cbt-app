<script setup>
import { RouterView } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { storeToRefs } from 'pinia'
import TeacherSidebar from '@/components/layout/TeacherSidebar.vue'
import TeacherTopbar from '@/components/layout/TeacherTopbar.vue'

const uiStore = useUiStore()
const { isSidebarOpen } = storeToRefs(uiStore)
</script>

<template>
  <div class="h-screen bg-background flex overflow-hidden">
    <!-- Mobile Sidebar Overlay -->
    <Transition name="fade">
      <div 
        v-if="isSidebarOpen" 
        class="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
        @click="uiStore.closeSidebar"
      ></div>
    </Transition>

    <!-- Sidebar -->
    <aside 
      class="fixed inset-y-0 left-0 z-50 w-[280px] lg:w-[260px] bg-sidebar transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0 flex flex-col"
      :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <TeacherSidebar />
    </aside>

    <!-- Main Content Wrapper -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Topbar -->
      <TeacherTopbar />

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <RouterView v-slot="{ Component }">
          <Transition name="fade-slide" mode="out-in">
            <!-- Ensure components like AssignmentsView wrap modals outside of transition correctly, or use key -->
            <component :is="Component" :key="$route.path" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
