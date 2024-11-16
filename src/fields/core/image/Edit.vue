<template>
  <Draggable
    v-if="props.field.list"
    class="grid grid-cols-4 gap-4 sm:grid-cols-5 xl:grid-cols-6"
    v-model="internalModelValue"
    :animation="100"
    :item-key="'index'"
    tag="ul"
  >
    <template #item="{element, index}">
      <li v-if="element" class="relative w-full cursor-move">
        <Image :path="element"/>
        <div class="absolute bottom-0 right-0 z-10 flex p-2">
          <button class="btn-icon-sm !border-r-0 !rounded-r-none relative group" @click="removeImage(index)">
            <Icon name="Trash2" class="h-4 w-4 stroke-2 shrink-0"/>
            <div class="tooltip-top">Remove image</div>
          </button>
          <button class="btn-icon-sm !rounded-l-none relative group" @click="changeImage(index)">
            <Icon name="Pencil" class="h-4 w-4 stroke-2 shrink-0"/>
            <div class="tooltip-top">Change image</div>
          </button>
        </div>
      </li>
    </template>
    <template #footer>
      <li v-if="internalModelValue.length < (props.field.list.max ?? Infinity)">
        <button class="btn flex-col gap-y-2 aspect-square items-center justify-center w-full" @click="addImage()">
          <Icon name="ImagePlus" class="h-6 w-6 stroke-[1.5] shrink-0"/>
          Add image
        </button>
      </li>
    </template>
  </Draggable>
  <div v-else class="relative w-48">
    <Image v-if="internalModelValue[0]" :path="internalModelValue[0]"/>
    <div v-if="internalModelValue[0]" class="absolute bottom-0 right-0 z-10 flex p-2">
      <button class="btn-icon-sm !border-r-0 !rounded-r-none relative group" @click="removeImage(0)">
        <Icon name="Trash2" class="h-4 w-4 stroke-2 shrink-0"/>
        <div class="tooltip-top">Remove image</div>
      </button>
      <button class="btn-icon-sm !rounded-l-none relative group" @click="changeImage(0)">
        <Icon name="Pencil" class="h-4 w-4 stroke-2 shrink-0"/>
        <div class="tooltip-top">Change image</div>
      </button>
    </div>
    <button v-else class="btn flex-col gap-y-2 aspect-square items-center justify-center w-full" @click="addImage()">
      <Icon name="ImagePlus" class="h-6 w-6 stroke-[1.5] shrink-0"/>
      Add image
    </button>
  </div>
  <!-- File browser modal -->
  <Modal ref="selectImageModal" :componentClass="'modal-file-browser'">
    <template #header>Select an image</template>
    <template #content>
      <div class="relative">
        <FileBrowser
          :owner="repoStore.owner"
          :repo="repoStore.repo"
          :branch="repoStore.branch"
          :root="prefixInput"
          :defaultPath="props.field.options?.path ?? repoStore.config.object.media?.path"
          :filterByCategories="props.field.options?.extensions ? undefined : [ 'image' ]"
          :filterByExtensions="props.field.options?.extensions"
          :isSelectable="true"
          :selected="imageSelection"
          :selectMax="selectMax"
          @files-selected="imageSelection = $event"
          ref="fileBrowserComponent"
        />
      </div>
      <footer class="flex justify-end text-sm gap-x-2 mt-4">
        <button class="btn-secondary" @click="selectImageModal.closeModal()">Cancel</button>
        <button
          class="btn-primary"
          @click="confirmImageSelection()"
        >
          Confirm
        </button>
      </footer>
    </template>
  </Modal>
</template>

<script setup>
// TODO: review the need for the validate() method (unclear if it's needed)
import { ref, computed, inject, watch, onMounted } from 'vue';
import Draggable from 'vuedraggable';
import useSchema from '@/composables/useSchema';
import githubImg from '@/services/githubImg';
import FileBrowser from '@/components/FileBrowser.vue';
import Icon from '@/components/utils/Icon.vue';
import Modal from '@/components/utils/Modal.vue';
import Image from '@/components/file/Image.vue';

const { sanitizeObject } = useSchema();

const emit = defineEmits(['update:modelValue']);

const repoStore = inject('repoStore', { owner: null, repo: null, branch: null, config: null, details: null });

const props = defineProps({
  field: Object,
  modelValue: [String, Array],
  options: { type: Object, default: {} },
});

const internalModelValue = ref([]);
const imageSelection = ref([]);
const activeImgIndex = ref(null);
const prefixInput = ref(props.field.options?.input ?? repoStore.config.object.media?.input ?? null);
const prefixOutput = ref(props.field.options?.output ?? repoStore.config.object.media?.output ?? null);

const selectMax = computed(() => {
  // Always allow multiple selection in list mode, regardless of whether we're changing or adding
  if (props.field.list === true) {
    // If list is just true (no max specified), allow unlimited selection
    return null;
  } else if (typeof props.field.list === 'object' && props.field.list?.max) {
    // If list has a max property, respect it
    return props.field.list.max - internalModelValue.value.length + (activeImgIndex.value !== null ? 1 : 0);
  } else {
    // Not a list, only allow single selection
    return 1;
  }
});

const selectImageModal = ref(null);
const fileBrowserComponent = ref(null);

const addImage = () => {
  console.log('📸 Image Field addImage:', {
    currentImages: internalModelValue.value,
    activeImgIndex: activeImgIndex.value,
    imageSelection: imageSelection.value
  });
  
  // Keep showing current selection
  imageSelection.value = [...internalModelValue.value];
  activeImgIndex.value = null;
  selectImageModal.value.openModal();
};

const changeImage = (index) => {
  console.log('🔄 Image Field changeImage:', {
    index,
    currentImages: internalModelValue.value,
    imageSelection: imageSelection.value
  });
  
  // Keep showing current selection
  imageSelection.value = [...internalModelValue.value];
  activeImgIndex.value = index;
  selectImageModal.value.openModal();
};

const confirmImageSelection = () => {
  console.log('✅ Image Field confirmImageSelection:', {
    imageSelection: imageSelection.value,
    activeImgIndex: activeImgIndex.value,
    currentImages: internalModelValue.value
  });
  
  if (props.field.list) {
    // In list mode, just use the entire selection as is
    internalModelValue.value = [...imageSelection.value];
  } else {
    // In single mode, just use the first selected image
    internalModelValue.value = imageSelection.value.length > 0 ? [imageSelection.value[0]] : [];
  }
  
  activeImgIndex.value = null;
  selectImageModal.value.closeModal();
};

const removeImage = (index) => {
  internalModelValue.value.splice(index, 1);
};

const setImages = () => {  
  if (props.modelValue) {
    // For simplicity, we internally deal with an array whether it's a list or not
    internalModelValue.value = Array.isArray(props.modelValue) ? [...props.modelValue] : [props.modelValue];
  } else {
    internalModelValue.value = [];
  }
};

onMounted(async () => {
  setImages();
});

watch(() => props.modelValue, (newValue, oldValue) => {
  if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) setImages();
});

watch(imageSelection, (newSelection) => {
  console.log('👀 Image Field imageSelection changed:', {
    newSelection,
    activeImgIndex: activeImgIndex.value,
    currentImages: internalModelValue.value
  });
}, { deep: true });

watch(internalModelValue, (newValue) => {
  console.log('💾 Image Field internalModelValue changed:', {
    newValue,
    activeImgIndex: activeImgIndex.value,
    imageSelection: imageSelection.value
  });
  
  if (props.field.list) {
    emit('update:modelValue', newValue);
  } else {
    emit('update:modelValue', newValue[0] || '');
  }
}, { deep: true });
</script>