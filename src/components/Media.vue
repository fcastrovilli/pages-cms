<template>
  <main class="relative min-h-screen" v-if="config.media && config.media.input != null && config.media.output != null">
    <div class="max-w-screen-3xl mx-auto p-4 lg:p-8">
      <header class="flex gap-x-2">
        <h1 class="font-semibold text-2xl lg:text-4xl mb-8 tracking-tight">Media</h1>
      </header>
      <FileBrowser
        :owner="owner"
        :repo="repo"
        :branch="branch"
        :root="config.media.input"
        :defaultPath="config.media.default"
        :filterByExtensions="config.media.extensions"
        :filterByCategories="config.media.categories"
      />
      <Upload
        ref="uploadComponent"
        :owner="owner"
        :repo="repo"
        :branch="branch"
        :path="path"
        :config="config"
        @processed="handleUploaded"
      />
    </div>
  </main>
</template>

<script setup>
import { ref } from 'vue';
import FileBrowser from '@/components/FileBrowser.vue';
import Upload from '@/components/file/Upload.vue';

const props = defineProps({
  config: {
    type: Object,
    default: () => (null),
  },
  owner: { type: String },
  repo: { type: String },
  branch: { type: String }
});

const path = ref(''); // Assuming path is a ref, you might need to adjust this based on your actual code

function handleUploaded() {
  // You might need to implement this function based on your actual code
}
</script>