// src/stores/user.js
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    uid:   null,
    email: null,
  }),
  actions: {
    setUser(user) {
      this.uid   = user.uid
      this.email = user.email
    },
    clearUser() {
      console.groupCollapsed('%c💧 clearUser called', 'color: #f66')
      console.trace()
      console.groupEnd()
      this.uid   = null
      this.email = null
    },
  },
})
