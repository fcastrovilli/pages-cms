<template>
  <!-- Loading screen -->
  <template v-if="status == 'loading'">
    <div class="loading"></div>
  </template>
  <!-- Config error -->
  <template v-if="status == 'error'">
    <div class="error">
      <div class="text-center max-w-md">
        <h1 class="font-semibold text-2xl mb-2">Something's not right.</h1>
        <p class="text-neutral-400 dark:text-neutral-500 mb-6">Either your <code class="text-sm bg-neutral-100 dark:bg-neutral-850 rounded-lg p-1">media</code> settings are wrong or you may need to create the <code class="text-sm bg-neutral-100 dark:bg-neutral-850 rounded-lg p-1">{{ root }}</code> folder in this repository.</p>
        <div class="flex gap-x-2 justify-center">
          <router-link class="btn-primary" :to="{name: 'settings'}">Review settings</router-link>
        </div>
      </div>
    </div>
  </template>
  <!-- File browser -->
  <template v-else>
    <div class="fb">
      <header class="fb-header flex mb-4 gap-x-2">
        <!-- Breadcrumb -->
        <ol v-if="breadcrumb" class="fb-breadcrumb flex items-center">
          <li v-if="path != root">
            <button @click="goTo(root)" class="fb-parent-link group relative btn-icon-sm !rounded-r-none">
              <Icon name="Home" class="h-4 w-4 stroke-2 shrink-0"/>
              <div class="tooltip-top">Home</div>
            </button>
          </li>
          <template v-for="(segment, index) in breadcrumb" :key="index">
            <li class="fb-breadcrumb-segment fb-breadcrumb-link">
              <template v-if="index < breadcrumb.length - 1">
                <button @click="goTo(segment.path)" class="btn-sm !rounded-none !border-l-0">
                  {{ segment.label }}
                </button>
              </template>
              <template v-else>
                <div class="fb-breadcrumb-segment fb-breadcrumb-leaf btn-sm !cursor-default	!text-neutral-400 dark:!text-neutral-500 !font-normal !rounded-l-none !border-l-0">
                  {{ segment.label }}
                </div>
              </template>
            </li>
          </template>
        </ol>
        <!-- Go to parent -->
        <button v-else-if="path != root" @click="goTo(parentPath)" class="fb-parent-link group relative btn-icon-sm">
          <Icon name="CornerLeftUp" class="h-4 w-4 stroke-2 shrink-0"/>
          <div class="tooltip-top">Go to parent</div>
        </button>
        <!-- Add a folder -->
        <button class="btn-icon-sm relative group ml-auto" @click="openAddFolderModal()">
          <Icon name="FolderPlus" class="h-4 w-4 stroke-2 shrink-0"/>
          <div class="spinner-white-sm" v-if="status == 'creating-folder'"></div>
          <div class="tooltip-top">Add a folder</div>
        </button>
        <!-- Upload a file -->
        <button class="btn-sm" @click="uploadComponent.openFileInput()">
          <Icon name="Upload" class="h-4 w-4 stroke-2 shrink-0"/>
          Upload file
          <div class="spinner-white-sm" v-if="status == 'uploading'"></div>
        </button>
        <!-- Toggle layout -->
        <div class="fb-view flex">
          <button @click="setLayout('list')" class="fb-view-list group btn-icon-sm !rounded-r-none relative" :disabled="layout == 'list'" :class="{ '!bg-neutral-200 dark:!bg-neutral-700': (layout == 'list') }">
            <Icon name="LayoutList" class="h-4 w-4 stroke-2 shrink-0"/>
            <div class="tooltip-top">List view</div>
          </button>
          <button @click="setLayout('grid')" class="fb-view-grid group btn-icon-sm !rounded-l-none !border-l-0 relative" :disabled="layout == 'grid'" :class="{ '!bg-neutral-200 dark:!bg-neutral-700': (layout == 'grid') }">
            <Icon name="LayoutGrid" class="h-4 w-4 stroke-2 shrink-0"/>
            <div class="tooltip-top-right">Grid view</div>
          </button>
        </div>
      </header>
      <!-- Content -->
      <div
        class="fb-files-wrapper" :class="[ (status == 'processing') ? 'processing' : '', isDragging ? 'fb-files-wrapper-dragging' : ''  ]"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleFileDrop"
      >
        <ul v-if="filteredContents.length > 0" class="fb-files" :class="[ (layout == 'grid') ? 'fb-files-grid' : 'fb-files-list' ]">
          <li v-for="item in filteredContents" :key="item.path" class="fb-files-item" :class="[ `fb-files-item-${item.type}` ]">
            <!-- Folders -->
            <template v-if="item.type == 'dir'">
              <button @click="goTo(item.path)" class="fb-files-item-content fb-files-item-link">
                <div class="fb-files-item-icon">
                  <Icon name="Folder" width="100%" height="100%"/>
                </div>
                <div class="fb-files-item-name">{{ item.name }}</div>
              </button>
            </template>
            <!-- Files -->
            <template v-else>
              <div class="fb-files-item-content" :class="[ selectedFiles.includes(path ? `${path}/${item.name}` : item.name) ? 'selected' : '', isSelectable ? 'cursor-pointer' : '' ]">
                <input v-if="isSelectable" 
                       type="checkbox" 
                       :checked="selectedFiles.includes(path ? `${path}/${item.name}` : item.name)"
                       class="fb-files-item-checkbox"
                       @click.stop
                       @change="selectToggle(item)"/>
                <div class="fb-files-item-preview" @click="selectToggle(item)">
                  <div v-if="item.kind == 'image'" class="fb-files-item-image">
                    <Image :path="item.path"/>
                  </div>
                  <div v-else class="fb-files-item-icon">
                    <Icon name="File" width="100%" height="100%"/>
                  </div>
                  <div class="fb-files-item-name">{{ item.name }}</div>
                  <div class="fb-files-item-meta">
                    <div class="fb-files-item-meta-size">{{ $filters.fileSize(item.size) }}</div>
                  </div>
                </div>
                <!-- Options -->
                <div class="fb-files-item-options">
                  <Dropdown :dropdownClass="'!max-w-none w-48'">
                    <template #trigger>
                      <button class="fb-files-item-options-btn">
                        <Icon name="MoreHorizontal" class="h-4 w-4 stroke-2 shrink-0"/>
                      </button>
                    </template>
                    <template #content>
                      <ul>
                        <li>
                          <a class="link w-full" :href="`https://github.com/${props.owner}/${props.repo}/blob/${props.branch}/${item.path}`" target="_blank">
                            <div class="truncate">See file on GitHub</div>
                            <Icon name="ExternalLink" class="h-4 w-4 stroke-2 shrink-0 ml-auto text-neutral-400 dark:text-neutral-500"/>
                          </a>
                        </li>
                        <li><hr class="border-t border-neutral-150 dark:border-neutral-750 my-2"/></li>
                        <li><button class="link w-full" @click="openRenameModal(item)">Rename</button></li>
                        <li><button class="link-danger w-full" @click="openDeleteModal(item)">Delete</button></li>
                      </ul>
                    </template>
                  </Dropdown>
                </div>
              </div>
            </template>
          </li>
        </ul>
        <!-- Empty folder -->
        <div v-else class="text-center rounded-xl bg-neutral-100 dark:bg-neutral-850 p-6">
          <div class="max-w-md mx-auto">
            <h2 class="font-semibold tracking-tight">Empty folder</h2>
            <p class="text-neutral-400 dark:text-neutral-500"><template v-if="filteredExtensions.length > 0">There are no maching files in this folder ({{ filteredExtensions.join(', ') }})</template><template v-else>There are no files in this folder</template>. You can drag-and-drop files here or use the "Upload file" button to add files.</p>
          </div>
        </div>
        <div class="fb-drag-message">
          <div class="flex gap-x-2 font-medium items-center">
            <Icon name="Import" class="h-6 w-6 stroke-[1.5] shrink-0"/>
            <span>Drop your files here</span>
          </div>
        </div>
      </div>
    </div>
    <AddFolder
      ref="addFolderComponent"
      :owner="props.owner"
      :repo="props.repo"
      :branch="props.branch"
      :path="path"
      @folder-added="handleFolderAdded"
    />
    <Rename
      ref="renameComponent"
      :owner="props.owner"
      :repo="props.repo"
      :branch="props.branch"
      :path="renamePath"
      @file-renamed="handleRenamed"
    />
    <Delete
      ref="deleteComponent"
      :owner="props.owner"
      :repo="props.repo"
      :branch="props.branch"
      :path="deletePath"
      :sha="deleteSha"
      @file-deleted="handleDeleted"
    />
    <Upload
      ref="uploadComponent"
      :owner="props.owner"
      :repo="props.repo"
      :branch="props.branch"
      :path="path"
      @processed="handleUploaded"
    />
  </template>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import githubImg from '@/services/githubImg';
import github from '@/services/github';
import Dropdown from '@/components/utils/Dropdown.vue';
import Icon from '@/components/utils/Icon.vue';
import Delete from '@/components/file/Delete.vue';
import AddFolder from '@/components/file/AddFolder.vue';
import Image from '@/components/file/Image.vue';
import Rename from '@/components/file/Rename.vue';
import Upload from '@/components/file/Upload.vue';

// Categories for filtering
const extensionCategories = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'bmp', 'tif', 'tiff'],
  document: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'vxls', 'xlsx', 'txt', 'rtf'],
  video: ['mp4', 'avi', 'mov', 'wmv', 'flv'],
  audio: ['mp3', 'wav', 'aac', 'ogg', 'flac'],
  compressed: ['zip', 'rar', '7z', 'tar', 'gz', 'tgz']
}

const route = useRoute();
const router = useRouter();

const emit = defineEmits(['files-selected']);

const props = defineProps({
  owner: String,
  repo: String,
  branch: String,
  root: String,
  defaultPath: String,
  filterByExtensions: Array,
  filterByCategories: {
    type: Array,
    default: () => []
  },
  isSelectable: Boolean,
  selected: {
    type: [String, Array],
    default: () => []
  },
  selectMax: {
    type: Number,
    default: 1
  }
});

const contents = ref(null);
const status = ref('loading');
const path = ref(props.root);
const layout = ref('grid');
const isDragging = ref(false);
const selectedFiles = ref([]);
const uploadComponent = ref(null);
const addFolderComponent = ref(null);
const renameComponent = ref(null);
const renamePath = ref('');
const deleteComponent = ref(null);
const deletePath = ref('');
const deleteSha = ref('');

const parentPath = computed(() => {
  const segments = path.value.split('/');
  if (segments.length > 1) {
    segments.pop();
    return segments.join('/');
  }
  return '';
});

const handleUploaded = () => {
  setContents();
};

const handleFileDrop = async (event) => {
  isDragging.value = false;
  const files = event.dataTransfer.files;
  await uploadComponent.value.processFiles(files);
  setContents();
};

function openAddFolderModal() {
  addFolderComponent.value.openModal();
}

const handleFolderAdded = () => {
  setContents();
};

function openRenameModal(item) {
  renamePath.value = item.path;
  renameComponent.value.openModal();
}

const handleRenamed = (renamedData) => {
  const { renamedPath, renamedSha } = renamedData;
  const item = contents.value.find(item => item.path === renamePath.value);
  item.path = renamedPath;
  item.name = renamedPath.split('/').pop();
};

function openDeleteModal(item) {
  deletePath.value = item.path;
  deleteSha.value = item.sha;
  deleteComponent.value.openModal();
}

const handleDeleted = () => {
  const index = contents.value.findIndex(item => item.path === deletePath.value);
  contents.value.splice(index, 1);
};

const selectToggle = (item) => {
  if (!props.isSelectable || item.type === 'dir') return;
  
  // Construct the full path relative to the root
  const itemPath = path.value ? `${path.value}/${item.name}` : item.name;
  
  // Get current state
  const currentSelection = [...selectedFiles.value].filter(Boolean); // Remove any empty paths
  const isSelected = currentSelection.includes(itemPath);
  
  // Determine new selection state
  let newSelection;
  if (isSelected) {
    // Always allow deselection
    newSelection = currentSelection.filter(i => i !== itemPath);
  } else {
    if (props.selectMax === 1) {
      // Single select mode - replace selection
      newSelection = [itemPath];
    } else if (props.selectMax != null && currentSelection.length >= props.selectMax) {
      // Multi-select with max - shift out oldest
      newSelection = [...currentSelection.slice(1), itemPath];
    } else {
      // Multi-select without max
      newSelection = [...currentSelection, itemPath];
    }
  }
  
  // Only update and emit if selection actually changed
  if (JSON.stringify(newSelection) !== JSON.stringify(currentSelection)) {
    selectedFiles.value = newSelection;
    emit('files-selected', newSelection);
  }
};

// Watch for changes to the selected prop
watch(() => props.selected, (newSelected) => {
  if (!newSelected) {
    selectedFiles.value = [];
  } else if (Array.isArray(newSelected)) {
    selectedFiles.value = [...newSelected];
  } else {
    selectedFiles.value = [newSelected];
  }
}, { immediate: true, deep: true });

const filteredExtensions = computed(() => {
  if (props.filterByExtensions) {
    return props.filterByExtensions;
  } else if (props.filterByCategories?.length) {
    return props.filterByCategories.reduce((acc, category) => {
      return acc.concat(extensionCategories[category] || []);
    }, []);
  }
  return [];
});

const filteredContents = computed(() => {
  if (contents.value) {
    if (filteredExtensions.value.length === 0) return contents.value;
    return contents.value.filter((item) => {
      if (item.type === 'dir') {
        return true;
      }
      if (filteredExtensions.value.includes(item.extension)) {
        return true;
      }
      return false;
    });
  }
  return [];
});

const breadcrumb = computed(() => {
  const cleanedPath = path.value.replace(props.root, '');
  const pathSegments = cleanedPath.split('/').filter(Boolean);
  const breadcrumbSegments = pathSegments.map((segment, index) => {
    const fullPath = props.root + '/' + pathSegments.slice(0, index + 1).join('/');
    return {
      label: segment,
      path: fullPath
    };
  });

  return breadcrumbSegments;
});

const setContents = async () => {
  status.value = 'loading';
  let contentsData = null;
  try {
    // Get contents using GitHub API
    contentsData = await github.getContents(props.owner, props.repo, props.branch, path.value || '', false);
    
    if (contentsData) {
      // Update githubImg cache
      const fullPath = `${props.owner}/${props.repo}/${props.branch}/${path.value || ''}`;
      githubImg.state.cache[fullPath] = { time: Date.now(), files: {} };
      contentsData.forEach(file => {
        githubImg.state.cache[fullPath].files[file.name] = file.download_url;
      });

      // Process contents
      contents.value = contentsData.map((item) => {
        let extension = '';
        let kind = 'other';

        if (item.type === 'file') {
          const parts = item.name.split('.');
          if (parts.length > 1 && parts[0] !== '') {
            extension = parts.pop().toLowerCase();
            kind = Object.keys(extensionCategories).find(key => extensionCategories[key].includes(extension)) || 'other';
          }
        }

        // Add the full path to the item
        const itemPath = path.value ? `${path.value}/${item.name}` : item.name;
        return { ...item, extension, kind, path: itemPath };
      });

      // Sort contents
      contents.value.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'dir' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      status.value = '';
    } else {
      status.value = 'error';
    }
  } catch (error) {
    console.error('Failed to fetch contents:', error);
    status.value = 'error';
  }
};

const setLayout = (mode = null) => {
  if (mode) {
    layout.value = mode;
  } else if (route.query.layout) {
    layout.value = route.query.layout;
  } else if (props.defaultLayout) {
    layout.value = props.defaultLayout;
  } else {
    layout.value = 'grid';
  }
  router.replace({ query: { ...route.query, layout: layout.value } });
};

const goTo = (destination) => {
  if (destination === undefined) {
    destination = props.defaultPath || props.root;
  }
  if (props.root && !destination.startsWith(props.root)) {
    destination = props.root;
  }
  if (destination !== path.value) {
    path.value = destination;
    router.push({ query: { ...route.query, 'fb-path': destination } });
  }
};

const selectFile = (file) => {
  if (!file) {
    selectedFiles.value = [];
    return;
  }
  
  // Convert to array if needed
  const fileValue = Array.isArray(file) ? file : [file];
  selectedFiles.value = fileValue;
  
  // Navigate to parent directory of first file
  const firstFile = fileValue[0];
  if (firstFile) {
    const segments = firstFile.split('/').filter(Boolean);
    segments.pop();
    const parentPath = segments.join('/');
    goTo(parentPath);
  }
};

onMounted(async () => {
  if (props.defaultPath) {
    goTo(props.defaultPath);
  } else if (route.query['fb-path']) {  
    goTo(route.query['fb-path']);
  } else {
    goTo(props.root);
  }
  selectFile(props.selected);
  setLayout();
  await setContents();
});

watch(() => props.selected, (newValue, oldValue) => {
  if (newValue != null) {
    selectFile(newValue);
  }
});

watch(path, async (newValue, oldValue) => {
  if (newValue !== oldValue) {
    await setContents();
  }
});

watch(() => route.query['fb-path'], (newValue) => {
  if (newValue !== path.value) {
    goTo(newValue);
  }
});

defineExpose({ goTo, selectFile, setContents });
</script>