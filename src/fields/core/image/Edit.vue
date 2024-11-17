<template>
  <div class="image-field w-full">
    <Draggable
      v-if="props.field.list"
      class="grid auto-rows-fr gap-2 sm:gap-3"
      :class="{
        'grid-cols-1': $parent?.width === '1/3' || $parent?.width === '1/4',
        'grid-cols-2': $parent?.width === '1/2' || $parent?.width === '2/3',
        'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4': $parent?.width === '1/1' || !$parent?.width
      }"
      v-model="internalModelValue"
      :animation="100"
      :item-key="'index'"
      tag="ul"
    >
      <template #item="{ element, index }">
        <li v-if="element" class="relative w-full cursor-move">
          <div class="aspect-square w-full">
            <Image :path="element" class="h-full w-full object-cover rounded-lg" />
          </div>
          <div class="absolute bottom-0 right-0 z-10 flex p-1.5 sm:p-2">
            <button
              class="btn-icon-xs sm:btn-icon-sm !border-r-0 !rounded-r-none relative group"
              @click="removeImage(index)"
            >
              <Icon name="Trash2" class="h-3 w-3 sm:h-4 sm:w-4 stroke-2 shrink-0" />
              <div class="tooltip-top">Remove image</div>
            </button>
            <button
              class="btn-icon-xs sm:btn-icon-sm !rounded-l-none relative group"
              @click="changeImage(index)"
            >
              <Icon name="Pencil" class="h-3 w-3 sm:h-4 sm:w-4 stroke-2 shrink-0" />
              <div class="tooltip-top">Change image</div>
            </button>
          </div>
        </li>
      </template>
      <template #footer>
        <li v-if="internalModelValue.length < (props.field.list.max ?? Infinity)">
          <button
            class="btn flex-col gap-y-1.5 sm:gap-y-2 aspect-square items-center justify-center w-full min-w-[120px] min-h-[120px] text-sm sm:text-base"
            @click="addImage()"
          >
            <Icon name="ImagePlus" class="h-5 w-5 sm:h-6 sm:w-6 stroke-[1.5] shrink-0" />
            Add image
          </button>
        </li>
      </template>
    </Draggable>
    <div v-else class="w-full">
      <div v-if="internalModelValue[0]" class="relative flex justify-center">
        <div class="aspect-square w-full max-w-md">
          <Image :path="internalModelValue[0]" class="h-full w-full object-cover rounded-lg" />
        </div>
        <div class="absolute bottom-0 right-0 z-10 flex p-2">
          <button
            class="btn-icon-sm !border-r-0 !rounded-r-none relative group"
            @click="removeImage(0)"
          >
            <Icon name="Trash2" class="h-4 w-4 stroke-2 shrink-0" />
            <div class="tooltip-top">Remove image</div>
          </button>
          <button
            class="btn-icon-sm !rounded-l-none relative group"
            @click="changeImage(0)"
          >
            <Icon name="Pencil" class="h-4 w-4 stroke-2 shrink-0" />
            <div class="tooltip-top">Change image</div>
          </button>
        </div>
      </div>
      <button
        v-else
        class="btn flex-col gap-y-2 aspect-square items-center justify-center w-full max-w-md min-w-[120px] min-h-[120px]"
        @click="addImage()"
      >
        <Icon name="ImagePlus" class="h-6 w-6 stroke-[1.5] shrink-0" />
        Add image
      </button>
    </div>
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
          :filterByCategories="props.field.options?.extensions ? undefined : ['image']"
          :filterByExtensions="props.field.options?.extensions"
          :isSelectable="true"
          :selected="imageSelection"
          :selectMax="selectMax"
          @files-selected="imageSelection = $event"
          ref="fileBrowserComponent"
        />
      </div>
      <footer class="flex justify-end text-sm gap-x-2 mt-4">
        <button class="btn-secondary" @click="selectImageModal.closeModal()">
          Cancel
        </button>
        <button class="btn-primary" @click="confirmImageSelection()">
          Confirm
        </button>
      </footer>
    </template>
  </Modal>
  <!-- Validation errors -->
  <ul v-if="errors.length" class="mt-2 text-sm text-red-500 dark:text-red-400">
    <li v-for="error in errors" :key="error" class="flex gap-x-1 items-center">
      <Icon name="Ban" class="h-3 w-3 stroke-[2.5]"/>
      {{ error }}
    </li>
  </ul>
</template>

<script setup>
import { ref, computed, inject, watch, onMounted } from "vue";
import Draggable from "vuedraggable";
import useSchema from "@/composables/useSchema";
import useFieldValidation from "@/composables/useFieldValidation";
import githubImg from "@/services/githubImg";
import FileBrowser from "@/components/FileBrowser.vue";
import Icon from "@/components/utils/Icon.vue";
import Modal from "@/components/utils/Modal.vue";
import Image from "@/components/file/Image.vue";

const { sanitizeObject } = useSchema();
const { validateRequired, validateListRange } = useFieldValidation();

const emit = defineEmits(["update:modelValue"]);

const repoStore = inject("repoStore", {
  owner: null,
  repo: null,
  branch: null,
  config: null,
  details: null,
});

const props = defineProps({
  field: Object,
  modelValue: [String, Array],
  options: { type: Object, default: {} },
});

const internalModelValue = ref([]);
const imageSelection = ref([]);
const activeImgIndex = ref(null);
const errors = ref([]);
const prefixInput = ref(
  props.field.options?.input ?? repoStore.config.object.media?.input ?? null
);
const prefixOutput = ref(
  props.field.options?.output ?? repoStore.config.object.media?.output ?? null
);

const selectMax = computed(() => {
  // Always allow multiple selection in list mode, regardless of whether we're changing or adding
  if (props.field.list === true) {
    // If list is just true (no max specified), allow unlimited selection
    return null;
  } else if (typeof props.field.list === "object" && props.field.list?.max) {
    // If list has a max property, respect it
    return (
      props.field.list.max -
      internalModelValue.value.length +
      (activeImgIndex.value !== null ? 1 : 0)
    );
  } else {
    // Not a list, only allow single selection
    return 1;
  }
});

const selectImageModal = ref(null);
const fileBrowserComponent = ref(null);

const addImage = () => {
  // Keep showing current selection
  imageSelection.value = [...internalModelValue.value];
  activeImgIndex.value = null;
  selectImageModal.value.openModal();
};

const changeImage = (index) => {
  // Keep showing current selection
  imageSelection.value = [...internalModelValue.value];
  activeImgIndex.value = index;
  selectImageModal.value.openModal();
};

const confirmImageSelection = () => {
  if (props.field.list) {
    // In list mode, just use the entire selection as is
    internalModelValue.value = [...imageSelection.value];
  } else {
    // In single mode, just use the first selected image
    internalModelValue.value =
      imageSelection.value.length > 0 ? [imageSelection.value[0]] : [];
  }

  activeImgIndex.value = null;
  selectImageModal.value.closeModal();
};

const removeImage = (index) => {
  internalModelValue.value.splice(index, 1);
};

const setImages = () => {
  if (props.modelValue) {
    if (Array.isArray(props.modelValue)) {
      internalModelValue.value = props.modelValue;
    } else {
      internalModelValue.value = [props.modelValue];
    }
  } else {
    internalModelValue.value = [];
  }
};

const validate = () => {
  errors.value = [];
  let allErrors = [];

  // Check if field is required
  const requiredErrors = validateRequired(props.field, internalModelValue.value);
  if (requiredErrors.length) {
    allErrors = allErrors.concat(requiredErrors);
  }

  // If it's a list, validate list constraints
  if (props.field.list) {
    const listErrors = validateListRange(props.field, internalModelValue.value);
    if (listErrors.length) {
      allErrors = allErrors.concat(listErrors);
    }
  }

  errors.value = allErrors;
  return allErrors;
};

defineExpose({ validate });

onMounted(() => {
  setImages();
});

watch(
  () => props.modelValue,
  () => {
    setImages();
  }
);

watch(
  internalModelValue,
  (newValue) => {
    // Always emit an array in list mode, otherwise emit a single value
    emit(
      "update:modelValue",
      props.field.list ? newValue : newValue[0] ?? null
    );
  },
  { deep: true }
);
</script>
