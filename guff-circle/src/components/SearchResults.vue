<template>
    <div class="search-results">
      <h1>Search result for "{{ searchQuery }}"</h1>
      <div v-if="users.length">
        <div v-for="user in users" :key="user.user_id" class="user-item">
          <!-- Display user information; customize as needed -->
          <p>{{ user.username }}</p>
        </div>
      </div>
      <div v-else>
        <p>No users found.</p>
      </div>
    </div>
  </template>
  
  <script>
  import { collection, getDocs } from "firebase/firestore";
  import db from "../firebase/init.js";
  
  export default {
    name: "SearchResults",
    data() {
      return {
        users: [],
        searchQuery: ""
      }
    },
    watch: {
      // Watch for changes in the route's query parameter.
      '$route.query.q': {
        handler(newQuery) {
          this.searchQuery = newQuery || "";
          this.fetchUsers();
        },
        immediate: true
      }
    },
    methods: {
      fetchUsers() {
        // If there's no query, clear the users list.
        if (!this.searchQuery.trim()) {
          this.users = [];
          return;
        }
        // Fetch all users from Firestore.
        const usersCollection = collection(db, "users");
        getDocs(usersCollection)
          .then((snapshot) => {
            const allUsers = [];
            snapshot.forEach((doc) => {
              // Here the document ID is used as the user's key (user_id).
              allUsers.push({ ...doc.data(), user_id: doc.id });
            });
            // Filter users by checking if the username contains the search query (case‑insensitive).
            const queryLower = this.searchQuery.toLowerCase();
            this.users = allUsers.filter(
              user =>
                user.username &&
                user.username.toLowerCase().includes(queryLower)
            );
          })
          .catch((error) => {
            console.error("Error fetching users:", error);
          });
      }
    }
  };
  </script>
  
  <style scoped>
  .search-results {
    padding: 20px;
  }
  .user-item {
    padding: 10px;
    border-bottom: 1px solid #ccc;
  }
  </style>
  