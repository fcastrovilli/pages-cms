<template>
  <div class="grid-layout">
    <div 
      class="grid grid-cols-12 gap-4 auto-rows-auto"
      :style="gridStyles"
    >
      <template v-for="childField in field.fields" :key="childField.name">
        <Field
          :field="childField"
          :model="fieldModel"
          ref="fieldRefs"
          :class="getFieldClasses(childField)"
        />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import Field from '@/components/file/Field.vue';

const props = defineProps({
  field: Object,
  modelValue: {
    type: [Object, String],
    default: () => ({})
  }
});

const emit = defineEmits(['update:modelValue']);

const gridStyles = computed(() => {
  const maxRow = Math.max(...props.field.fields.map(f => f.layout?.row ?? 0));
  return {
    'grid-template-rows': `repeat(${maxRow + 1}, minmax(min-content, auto))`
  };
});

const getFieldClasses = (field) => {
  // If no layout specified, make it full width and centered
  if (!field.layout) {
    return ['col-span-12', 'w-full'];
  }
  
  const widthMap = {
    '1/1': 'col-span-12',
    '1/2': 'col-span-6',
    '1/3': 'col-span-4',
    '2/3': 'col-span-8',
    '1/4': 'col-span-3',
    '3/4': 'col-span-9'
  };

  const classes = [
    widthMap[field.layout.width] || 'col-span-12',
    'w-full'
  ];

  // Only add explicit positioning if specified
  if (typeof field.layout.row === 'number') {
    classes.push(`row-start-${field.layout.row + 1}`);
  }
  if (typeof field.layout.column === 'number') {
    classes.push(`col-start-${field.layout.column + 1}`);
  }

  return classes;
};

const fieldModel = computed({
  get: () => {
    if (typeof props.modelValue === 'string') {
      return {};
    }
    return props.modelValue;
  },
  set: (value) => {
    emit('update:modelValue', value);
  }
});

const fieldRefs = ref([]);

const validate = () => {
  let isValid = true;
  const errors = [];

  fieldRefs.value.forEach(fieldRef => {
    if (fieldRef && typeof fieldRef.validate === 'function') {
      const fieldValid = fieldRef.validate();
      if (!fieldValid) {
        isValid = false;
      }
    }
  });

  return isValid;
};

defineExpose({ validate });
</script>

<style>
.grid-layout {
  @apply w-full;
}

.grid-layout .field {
  @apply w-full;
}

.grid-layout .grid {
  @apply grid-flow-row-dense;
}

/* Debug styles - uncomment when needed */
/* .grid-layout .grid > * {
  @apply border border-dashed border-gray-200 dark:border-gray-700;
} */
</style>
