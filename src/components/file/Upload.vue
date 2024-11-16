<template>
  <input type="file" ref="fileInput" @change="handleFileInput" multiple hidden />
  <!-- Waiting overlay -->
  <Teleport to="body">
    <div class="waiting" v-show="status === 'uploaded'"></div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue';
import notifications from '@/services/notifications';
import github from '@/services/github';

const emits = defineEmits(['processed', 'uploaded', 'error']);

const props = defineProps({
  owner: String,
  repo: String,
  branch: String,
  path: String,
  config: {
    type: Object,
    default: () => ({})
  }
});

const fileInput = ref(null);
const status = ref('');

function openFileInput() {
  fileInput.value.click();
}

const handleFileInput = async (event) => {
  const files = event.target.files;
  await processFiles(files);
};

async function processFiles(files) {
  status.value = 'uploading';
  for (let i = 0; i < files.length; i++) {
    await upload(files[i]);
  }
  emits('processed');
  status.value = '';
}

async function processImage(file) {
  // Get optimization settings from config
  const optimize = props.config?.media?.optimize || {
    enabled: true,
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.85
  };

  // If optimization is disabled, return original file
  if (!optimize.enabled) {
    return file;
  }

  // Create an image element
  const img = document.createElement('img');
  const imageUrl = URL.createObjectURL(file);
  
  return new Promise((resolve, reject) => {
    img.onload = async () => {
      try {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > optimize.maxWidth || height > optimize.maxHeight) {
          if (width / height > optimize.maxWidth / optimize.maxHeight) {
            height = Math.round((height * optimize.maxWidth) / width);
            width = optimize.maxWidth;
          } else {
            width = Math.round((width * optimize.maxHeight) / height);
            height = optimize.maxHeight;
          }
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to WebP
        const webpData = canvas.toDataURL('image/webp', optimize.quality);
        
        // Convert base64 to Blob
        const byteString = atob(webpData.split(',')[1]);
        const mimeString = webpData.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        
        const blob = new Blob([ab], { type: mimeString });
        const originalName = file.name.replace(/\.[^/.]+$/, '');
        const newFile = new File([blob], `${originalName}.webp`, { type: 'image/webp' });
        
        URL.revokeObjectURL(imageUrl);
        resolve(newFile);
      } catch (error) {
        URL.revokeObjectURL(imageUrl);
        reject(error);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageUrl;
  });
}

const upload = async (file) => {
  if (file) {
    const notificationId = notifications.notify(`Processing "${file.name}"...`, 'processing', { delay: 0 });
    
    try {
      let processedFile = file;
      
      // Process image files
      if (file.type.startsWith('image/')) {
        processedFile = await processImage(file);
      }

      let content = await readFileContent(processedFile);
      if (content) {
        content = content.replace(/^(.+,)/, '');
        const fullPath = props.path ? `${props.path}/${processedFile.name}` : processedFile.name;
        const data = await github.saveFile(props.owner, props.repo, props.branch, fullPath, content, null, true);
        notifications.close(notificationId);
        
        if (data) {
          if (data.content.path === fullPath) {
            notifications.notify(`File '${processedFile.name}' successfully uploaded.`, 'success');
          } else {
            notifications.notify(`File '${processedFile.name}' successfully uploaded but renamed to '${data.content.name}'.`, 'success');
          }
          emits('uploaded', data);
        } else {
          notifications.notify(`File upload failed.`, 'error');
          emits('error', data);
        }
      }
    } catch (error) {
      notifications.close(notificationId);
      notifications.notify(`Error processing file: ${error.message}`, 'error');
      emits('error', error);
    }
  }
};

const readFileContent = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
};

defineExpose({ openFileInput, processFiles });
</script>