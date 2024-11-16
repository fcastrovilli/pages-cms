<template>
  <Draggable
    class="grid grid-cols-4 gap-4 sm:grid-cols-5 xl:grid-cols-6"
    v-model="internalModelValue"
    :animation="100"
    :item-key="'index'"
    tag="ul"
  >
    <template #item="{element, index}">
      <li v-if="element" class="relative w-full cursor-move">
        <FilePreview :path="element"/>
        <div class="absolute bottom-0 right-0 z-10 flex p-2">
          <button class="btn-icon-sm !border-r-0 !rounded-r-none relative group" @click="removeFile(index)">
            <Icon name="Trash2" class="h-4 w-4 stroke-2 shrink-0"/>
            <div class="tooltip-top">Remove file</div>
          </button>
          <button class="btn-icon-sm !rounded-l-none relative group" @click="changeFile()">
            <Icon name="Pencil" class="h-4 w-4 stroke-2 shrink-0"/>
            <div class="tooltip-top">Change file</div>
          </button>
        </div>
      </li>
    </template>
    <template #footer>
      <li v-if="internalModelValue.length < maxFiles">
        <button class="btn flex-col gap-y-2 aspect-square items-center justify-center w-full" @click="addFile()">
          <Icon name="FilePlus" class="h-6 w-6 stroke-[1.5] shrink-0"/>
          Add file
        </button>
      </li>
    </template>
  </Draggable>
  <!-- File browser modal -->
  <Modal ref="selectFileModal" :componentClass="'modal-file-browser'">
    <template #header>Select a file</template>
    <template #content>
      <div class="relative">
        <FileBrowser
          :owner="repoStore.owner"
          :repo="repoStore.repo"
          :branch="repoStore.branch"
          :root="props.field.options?.input ?? repoStore.config.object.media?.input"
          :defaultPath="props.field.options?.path ?? repoStore.config.object.media?.path"
          :filterByExtensions="props.field.options?.extensions"
          :isSelectable="true"
          :selected="selectedFile"
          :selectMax="selectMax"
          @files-selected="fileSelection = $event"
          ref="fileBrowserComponent"
        />
      </div>
      <footer class="flex justify-end text-sm gap-x-2 mt-4">
        <button class="btn-secondary" @click="closeFileSelector">Cancel</button>
        <button
          class="btn-primary"
          @click="confirmFileSelection"
        >
          Confirm
        </button>
      </footer>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, inject, watch, onMounted } from 'vue';
import Draggable from 'vuedraggable';
import useSchema from '@/composables/useSchema';
import FileBrowser from '@/components/FileBrowser.vue';
import Icon from '@/components/utils/Icon.vue';
import Modal from '@/components/utils/Modal.vue';
import FilePreview from '@/components/file/FilePreview.vue';

const { sanitizeObject } = useSchema();

const emit = defineEmits(['update:modelValue']);

const repoStore = inject('repoStore', { owner: null, repo: null, branch: null, config: null, details: null });

const props = defineProps({
  field: {
    type: Object,
    required: true,
    validator: (field) => {
      return field.type === 'file' && (
        field.list === true || 
        field.list === false || 
        field.list === undefined ||
        (typeof field.list === 'object' &&
         (!field.list.min || typeof field.list.min === 'number') &&
         (!field.list.max || typeof field.list.max === 'number'))
      );
    }
  },
  modelValue: {
    type: [String, Array],
    default: null
  },
  options: {
    type: Object,
    default: () => ({}),
    validator: (options) => {
      return (
        (!options.input || typeof options.input === 'string') &&
        (!options.output || typeof options.output === 'string') &&
        (!options.extensions || Array.isArray(options.extensions))
      );
    }
  }
});

const internalModelValue = ref([]);
const fileSelection = ref([]);
const selectFileModal = ref(null);

// Always show current selection in browser
watch(internalModelValue, (newValue) => {
  fileSelection.value = [...newValue];
}, { immediate: true, deep: true });

const isList = computed(() => {
  return props.field.list === true || (typeof props.field.list === 'object');
});

const maxFiles = computed(() => {
  if (!isList.value) return 1;
  if (typeof props.field.list === 'object' && props.field.list.max) {
    return props.field.list.max;
  }
  return Infinity;
});

// For FileBrowser, show the active file as selected
const selectedFile = computed(() => {
  return internalModelValue.value;
});

const selectMax = computed(() => {
  if (!isList.value) return 1;
  if (typeof props.field.list === 'object' && props.field.list.max) {
    return props.field.list.max - internalModelValue.value.length;
  }
  return Infinity;
});

function confirmFileSelection() {
  // Get currently selected files from the browser
  const basePath = props.field.options?.input || '';
  const selectedFiles = fileSelection.value.map(file => {
    // Ensure the path is relative to the input directory
    return file.startsWith(basePath) ? file : `${basePath}/${file}`;
  });

  // Simply update the internal value with current selection
  if (!isList.value) {
    // Single file mode - take first file or null
    internalModelValue.value = selectedFiles.slice(0, 1);
  } else {
    // List mode - use all selected files
    internalModelValue.value = [...selectedFiles];
  }
  
  closeFileSelector();
}

function closeFileSelector() {
  if (selectFileModal.value) {
    selectFileModal.value.closeModal();
  }
}

function removeFile(index) {
  internalModelValue.value.splice(index, 1);
}

function changeFile() {
  selectFileModal.value?.openModal();
}

function addFile() {
  selectFileModal.value?.openModal();
}

function setFiles() {
  const value = props.modelValue;
  if (value) {
    internalModelValue.value = Array.isArray(value) ? [...value] : [value];
  } else {
    internalModelValue.value = [];
  }
}

onMounted(() => {
  setFiles();
});

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  if (JSON.stringify(newValue) !== JSON.stringify(isList.value ? internalModelValue.value : internalModelValue.value[0] ?? null)) {
    setFiles();
  }
}, { deep: true });

// Watch for internal changes to update the parent
watch(internalModelValue, (newValue) => {
  console.log('Internal value changed:', newValue);
  if (newValue === props.modelValue) return;
  
  if (isList.value) {
    emit('update:modelValue', [...newValue]);
  } else {
    emit('update:modelValue', newValue[0] ?? null);
  }
}, { deep: true });
</script>
