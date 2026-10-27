<template>
  <nav class="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-paper-light/95 dark:bg-paper-dark/95 backdrop-blur-md border-t border-ink-200/60 dark:border-paper-border pb-safe transition-colors">
    <div class="flex items-center justify-around h-16 px-2">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium transition-colors"
        :class="[
          $route.path === item.path || ($route.path.startsWith(item.path) && item.path !== '/')
            ? 'text-brand-600 dark:text-brand-400 font-bold'
            : 'text-ink-500 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-200'
        ]"
      >
        <component :is="item.icon" class="w-5 h-5 mb-1" />
        <span>{{ item.label }}</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { Home, BookOpen, Brain, Sparkles, Compass } from 'lucide-vue-next';

var navItems = [
  { label: 'خانه', path: '/', icon: Home },
  { label: 'شاعران', path: '/poets', icon: BookOpen },
  { label: 'حفظ شعر', path: '/memorize', icon: Brain },
  { label: 'آموزش', path: '/education', icon: Sparkles },
  { label: 'کاوش', path: '/explore', icon: Compass }
];
</script>
