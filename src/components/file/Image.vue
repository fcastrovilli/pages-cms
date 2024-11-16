<template>
  <div v-if="path" class="bg-neutral-100 dark:bg-neutral-850 w-full pb-[100%] rounded-xl ring-1 ring-neutral-200 dark:ring-neutral-750 overflow-hidden relative" :class="[ props.customClass ]">
    <div v-if="rawUrl" class="absolute inset-0 bg-cover bg-center" :style="{ 'background-image': `url('${rawUrl}')` }" :title="path"></div>
    <div v-else class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <div class="spinner-black"></div>
    </div>
  </div>
</template>

<script setup>
// TODO: handle case where file doesn't exist or settings are wrong
import { ref, onMounted, inject, watch } from 'vue';
import githubImg from '@/services/githubImg';

const repoStore = inject('repoStore', { owner: null, repo: null, branch: null, config: null, details: null });

const props = defineProps({
  path: { type: String, default: null },
  customClass: { type: String, default: null }
});

const rawUrl = ref(null);

const getInputPath = (outputPath) => {
  if (!outputPath) return null;
  
  // Get global media settings
  const globalInput = repoStore.config.object.media?.input ?? '';
  const globalOutput = repoStore.config.object.media?.output ?? '';
  
  // Normalize paths
  const normalizedPath = githubImg.normalizePath(outputPath);
  const normalizedOutput = githubImg.normalizePath(globalOutput);
  
  // Transform from output path back to input path
  if (normalizedPath.startsWith(normalizedOutput)) {
    return githubImg.swapPrefix(outputPath, globalOutput, globalInput, false);
  }
  return outputPath;
};

onMounted(async () => {
  const inputPath = getInputPath(props.path);
  rawUrl.value = await githubImg.getRawUrl(repoStore.owner, repoStore.repo, repoStore.branch, inputPath, repoStore.details.private);
});

watch(() => props.path, async (newPath) => {
  rawUrl.value = null;
  const inputPath = getInputPath(newPath);
  rawUrl.value = await githubImg.getRawUrl(repoStore.owner, repoStore.repo, repoStore.branch, inputPath, repoStore.details.private);
});
</script>