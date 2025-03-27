import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/register',
    name: 'Register',
    component: () => import('../components/Register.vue'),
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../components/Login.vue'),
  },
  {
    path: '/feed',
    name: 'Feed',
    component: () => import('../components/Feed.vue'),
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../components/Profile.vue'),
  },
  {
    path: '/search-results',
    name: 'SearchResults',
    component: () => import('../components/SearchResults.vue'),
  },
  {
    path: '/visit-profile/:userId',
    name: 'VisitProfile',
    component: () => import('../components/VisitProfile.vue'),
    props: true
  },
  {
    path: '/create-circle/:currentUserId',
    name: 'CreateCircle',
    component: () => import('../components/CreateCircle.vue'),
  },
  {
    path: '/',
    redirect: '/login',
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
