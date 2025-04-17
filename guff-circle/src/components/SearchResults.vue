<template>
  <div class="search-results">
    <h1>Search result for "{{ searchQuery }}"</h1>
    <div v-if="users.length">
      <div v-for="user in users" :key="user.user_id" class="user-item">
        <img
          :src="getPictureSource(user.profilePicture)"
          alt="Profile Picture"
          class="profile-img"
        />
        <router-link
          class="username-link"
          :to="user.user_id === currentUserId 
                ? { name: 'Profile' } 
                : { name: 'VisitProfile', params: { userId: user.user_id } }"
        >
          {{ user.username }}
        </router-link>
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
import { auth } from "../firebase/init.js"; 

export default {
  name: "SearchResults",
  data() {
    return {
      users: [],
      searchQuery: ""
    }
  },
  computed: {
    currentUserId() {
      return auth.currentUser ? auth.currentUser.uid : null;
    }
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
    fetchUsers() {
      if (!this.searchQuery.trim()) {
        this.users = [];
        return;
      }
      const usersCollection = collection(db, "users");
      getDocs(usersCollection)
        .then((snapshot) => {
          const allUsers = [];
          snapshot.forEach((doc) => {
            allUsers.push({ ...doc.data(), user_id: doc.id });
          });
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
    },
    getPictureSource(profilePicture) {
      if (profilePicture) {
        if (profilePicture.startsWith("http") || profilePicture.startsWith("data:")) {
          return profilePicture;
        } else {
          return "data:image/png;base64," + profilePicture;
        }
      }
      return "https://via.placeholder.com/48";
    }
  }
};
</script>

<style scoped>
.search-results {
  padding: 20px;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #ccc;
}

.profile-img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 10px;
}

.username-link {
  font-size: 1.2rem;
  font-weight: bold;
  color: #734f96;
  text-decoration: none;
  cursor: pointer;
}

.username-link:hover {
  text-decoration: underline;
}
</style>
