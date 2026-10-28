import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/poets',
    name: 'Poets',
    component: () => import('../views/PoetsView.vue')
  },
  {
    path: '/poet/:poetSlug',
    name: 'PoetDetail',
    component: () => import('../views/PoetDetailView.vue'),
    props: true
  },
  {
    path: '/poet/:poetSlug/cat/:catPath(.*)*',
    name: 'Category',
    component: () => import('../views/CategoryView.vue'),
    props: true
  },
  {
    path: '/read/:poetSlug/:catPath(.*)/:poemSlug',
    name: 'PoemDetail',
    component: () => import('../views/PoemDetailView.vue'),
    props: true
  },
  {
    path: '/read/:poetSlug/:poemSlug',
    name: 'PoemDetailSimple',
    component: () => import('../views/PoemDetailView.vue'),
    props: true
  },
  {
    path: '/poem/:poemId',
    name: 'PoemById',
    component: () => import('../views/PoemResolverView.vue')
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('../views/SearchView.vue')
  },
  {
    path: '/faal',
    name: 'Faal',
    component: () => import('../views/FaalView.vue')
  },
  {
    path: '/memorize',
    name: 'Memorize',
    component: () => import('../views/MemorizeView.vue')
  },
  {
    path: '/memorize/quiz/:mode',
    name: 'QuizSession',
    component: () => import('../views/QuizSessionView.vue'),
    props: true
  },
  {
    path: '/memorize/daily-challenge',
    name: 'DailyChallenge',
    component: () => import('../views/DailyChallengeView.vue')
  },
  {
    path: '/metres',
    name: 'Metres',
    component: () => import('../views/MetresView.vue')
  },
  {
    path: '/dialects',
    name: 'Dialects',
    component: () => import('../views/DialectsView.vue')
  },
  {
    path: '/collections',
    name: 'Collections',
    component: () => import('../views/CollectionsView.vue')
  },
  {
    path: '/compare',
    name: 'PoetCompare',
    component: () => import('../views/PoetCompareView.vue')
  },
  {
    path: '/education',
    name: 'Education',
    component: () => import('../views/EducationView.vue')
  },
  {
    path: '/explore',
    name: 'Explore',
    component: () => import('../views/ExploreView.vue')
  },
  {
    path: '/person/:personId',
    name: 'PersonDetail',
    component: () => import('../views/PersonDetailView.vue'),
    props: true
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/SettingsView.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  }
});
