<script setup>
import { ref, watch, onMounted } from 'vue'
import { useField } from 'vee-validate'
import { Bold, Italic, Underline, List, ListOrdered, Image, Link, AlignLeft, AlignCenter, AlignRight } from 'lucide-vue-next'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Tuliskan teks di sini...'
  },
  minHeight: {
    type: String,
    default: 'min-h-[120px]'
  }
})

const { value, errorMessage, handleBlur, handleChange } = useField(() => props.name, undefined, {
  syncVModel: true,
})

const editorRef = ref(null)

// Initialize content
onMounted(() => {
  if (editorRef.value && value.value) {
    editorRef.value.innerHTML = value.value
  }
})

// Watch for external value changes (e.g. when editing a different question)
watch(value, (newVal) => {
  if (editorRef.value && newVal !== editorRef.value.innerHTML) {
    editorRef.value.innerHTML = newVal || ''
  }
})

const execCommand = (command, val = null) => {
  document.execCommand(command, false, val)
  editorRef.value.focus()
  updateValue()
}

const updateValue = () => {
  if (editorRef.value) {
    // Basic sanitize or just pass raw HTML
    handleChange(editorRef.value.innerHTML)
  }
}
</script>

<template>
  <div class="w-full">
    <label v-if="label" :for="name" class="block text-sm font-semibold text-slate-700 mb-1.5">
      {{ label }}
    </label>
    
    <div 
      class="border rounded-xl overflow-hidden bg-white flex flex-col transition-colors focus-within:border-primary-blue focus-within:ring-1 focus-within:ring-primary-blue"
      :class="errorMessage ? 'border-red-300' : 'border-slate-200'"
    >
      <!-- Toolbar -->
      <div class="flex items-center flex-wrap gap-1 p-2 border-b border-slate-100 bg-slate-50">
        <button type="button" @click="execCommand('bold')" class="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded" title="Bold">
          <Bold class="w-4 h-4" />
        </button>
        <button type="button" @click="execCommand('italic')" class="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded" title="Italic">
          <Italic class="w-4 h-4" />
        </button>
        <button type="button" @click="execCommand('underline')" class="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded" title="Underline">
          <Underline class="w-4 h-4" />
        </button>
        
        <div class="w-px h-5 bg-slate-300 mx-1"></div>
        
        <button type="button" @click="execCommand('insertUnorderedList')" class="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded" title="Bullet List">
          <List class="w-4 h-4" />
        </button>
        <button type="button" @click="execCommand('insertOrderedList')" class="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded" title="Number List">
          <ListOrdered class="w-4 h-4" />
        </button>
        
        <div class="w-px h-5 bg-slate-300 mx-1"></div>

        <button type="button" @click="execCommand('justifyLeft')" class="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded" title="Align Left">
          <AlignLeft class="w-4 h-4" />
        </button>
        <button type="button" @click="execCommand('justifyCenter')" class="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded" title="Align Center">
          <AlignCenter class="w-4 h-4" />
        </button>
        <button type="button" @click="execCommand('justifyRight')" class="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded" title="Align Right">
          <AlignRight class="w-4 h-4" />
        </button>
        
        <div class="w-px h-5 bg-slate-300 mx-1"></div>
        
        <button type="button" @click="execCommand('createLink', prompt('Masukkan URL:'))" class="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded" title="Link">
          <Link class="w-4 h-4" />
        </button>
        <button type="button" class="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded" title="Image (Mock)">
          <Image class="w-4 h-4" />
        </button>
      </div>
      
      <!-- Editor -->
      <div 
        ref="editorRef"
        contenteditable="true"
        class="p-3 outline-none prose prose-sm max-w-none text-slate-800"
        :class="minHeight"
        @input="updateValue"
        @blur="handleBlur"
        :data-placeholder="placeholder"
      ></div>
    </div>
    
    <p v-if="errorMessage" class="mt-1 text-sm text-red-500">
      {{ errorMessage }}
    </p>
  </div>
</template>

<style scoped>
[contenteditable]:empty:before {
  content: attr(data-placeholder);
  color: #94a3b8;
  pointer-events: none;
  display: block;
}
</style>
