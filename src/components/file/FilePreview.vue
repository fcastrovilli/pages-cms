<template>
  <div class="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-primary"></div>
    </div>
    <div v-else class="absolute inset-0">
      <template v-if="isImage">
        <div class="w-full h-full bg-cover bg-center" :style="{ 'background-image': `url('${imageUrl}')` }" :title="fileName"></div>
      </template>
      <template v-else>
        <div class="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gray-50">
          <div class="w-12 h-12 mb-2 text-gray-500">
            <Icon :name="fileIcon" class="w-full h-full" />
          </div>
          <span class="text-xs truncate max-w-full text-gray-600">{{ fileName }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject, watch } from 'vue';
import Icon from '@/components/utils/Icon.vue';
import githubImg from '@/services/githubImg';

const repoStore = inject('repoStore', { owner: null, repo: null, branch: null, config: null, details: null });

const props = defineProps({
  path: {
    type: String,
    required: true
  }
});

const loading = ref(true);
const imageUrl = ref(null);

const fileName = computed(() => {
  return props.path.split('/').pop();
});

const fileExtension = computed(() => {
  return fileName.value.split('.').pop().toLowerCase();
});

const isImage = computed(() => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp'];
  return imageExtensions.includes(fileExtension.value);
});

const fileIcon = computed(() => {
  // Document types
  if (['pdf', 'doc', 'docx', 'rtf', 'txt', 'md', 'pages'].includes(fileExtension.value)) {
    return 'FileText';
  }
  // Spreadsheet types
  if (['xls', 'xlsx', 'csv', 'numbers'].includes(fileExtension.value)) {
    return 'FileSpreadsheet';
  }
  // Presentation types
  if (['ppt', 'pptx', 'key'].includes(fileExtension.value)) {
    return 'FilePresentation';
  }
  // Archive types
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(fileExtension.value)) {
    return 'FileArchive';
  }
  // Audio types
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(fileExtension.value)) {
    return 'FileAudio';
  }
  // Video types
  if (['mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv'].includes(fileExtension.value)) {
    return 'FileVideo';
  }
  // Code types
  if (['js', 'ts', 'py', 'java', 'cpp', 'php', 'rb', 'go', 'rs'].includes(fileExtension.value)) {
    return 'FileCode';
  }
  // Default icon for unknown types
  return 'File';
});

async function loadImage() {
  if (!props.path) return;
  
  if (isImage.value) {
    imageUrl.value = await githubImg.getRawUrl(
      repoStore.owner,
      repoStore.repo,
      repoStore.branch,
      props.path,
      repoStore.details.private
    );
  }
  loading.value = false;
}

onMounted(() => {
  loadImage();
});

watch(() => props.path, () => {
  loading.value = true;
  imageUrl.value = null;
  loadImage();
});
</script>
