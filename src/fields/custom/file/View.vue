<template>
  <div class="flex flex-wrap gap-2">
    <template v-if="Array.isArray(modelValue)">
      <FilePreview
        v-for="file in modelValue"
        :key="file"
        :path="file"
        class="w-24 h-24"
      />
    </template>
    <template v-else-if="modelValue">
      <FilePreview
        :path="modelValue"
        class="w-24 h-24"
      />
    </template>
  </div>
</template>

<script setup>
import FilePreview from '@/components/file/FilePreview.vue';

defineProps({
  modelValue: {
    type: [String, Array],
    default: null,
  },
});
</script>
