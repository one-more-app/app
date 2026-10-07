<script setup lang="ts">
import DefaultTheme from 'vitepress/theme';
import CopyMarkdownButton from './components/CopyMarkdownButton.vue';

const { Layout: DefaultLayout } = DefaultTheme;
</script>

<template>
  <DefaultLayout>
    <template #doc-before>
      <CopyMarkdownButton />
    </template>
  </DefaultLayout>
</template>
