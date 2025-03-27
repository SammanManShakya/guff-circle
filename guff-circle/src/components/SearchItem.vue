<template>
    <div class="search-results">
      <h1>Search results for "{{ searchQuery }}"</h1>
      <div v-if="users.length">
        <SearchItem
          v-for="user in users"
          :key="user.user_id"
          :userId="user.user_id"
        >
          <template #profile-pic>
            <img :src="user.profilePicture" alt="Profile Picture" />
          </template>
          <template #username>
            {{ user.username }}
          </template>
          <template #user-id>
            {{ user.user_id }}
          </template>
        </SearchItem>
      </div>
      <div v-else>
        <p>No users found.</p>
      </div>
    </div>
  </template>
  
  <script>
  import { collection, getDocs } from "firebase/firestore";
  import db from "../firebase/init.js";
  import SearchItem from "./SearchItem.vue";
  
  export default {
    name: "SearchResults",
    components: {
      SearchItem
    },
    data() {
      return {
        users: [],
        searchQuery: ""
      };
    },
    watch: {
      '$route.query.q': {
        handler(newQuery) {
          this.searchQuery = newQuery || "";
          this.fetchUsers();
        },
        immediate: true
      }
    },
    methods: {
      async fetchUsers() {
        if (!this.searchQuery.trim()) {
          this.users = [];
          return;
        }
  
        try {
          const usersCollection = collection(db, "users");
          const snapshot = await getDocs(usersCollection);
          const queryLower = this.searchQuery.toLowerCase();
  
          this.users = snapshot.docs
            .map(doc => ({
              ...doc.data(),
              user_id: doc.id
            }))
            .filter(user =>
              user.username &&
              user.username.toLowerCase().includes(queryLower)
            )
            .map(user => {
              if (
                user.profilePicture &&
                !user.profilePicture.startsWith('http') &&
                !user.profilePicture.startsWith('data:')
              ) {
                user.profilePicture = `data:image/png;base64,${user.profilePicture}`;
              }
              return {
                ...user,
                profilePicture: user.profilePicture || 'https://via.placeholder.com/48'
              };
            });
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      }
    }
  };
  </script>
  
  <style scoped>
  .search-results {
    padding: 20px;
    max-width: 600px;
    margin: 0 auto;
  }
  </style>
  