<template>
    <div class="profile-container">
      <div class="profile-header">
        <img :src="profileImage" alt="Profile Picture" class="profile-picture" />
        <div class="profile-info">
          <h2 class="username">{{ username }}</h2>
          <div class="user-stats">
            <span>{{ userStats.posts }} Posts</span>
            <span>{{ userStats.followers }} Followers</span>
            <span>{{ userStats.following }} Following</span>
          </div>
        </div>
      </div>
      <!-- Tab navbar to switch between posts and circles -->
      <div class="tab-navbar">
        <button
          :class="{ active: activeTab === 'My Posts' }"
          @click="activeTab = 'My Posts'"
        >
          My Posts
        </button>
        <button
          :class="{ active: activeTab === 'My Circles' }"
          @click="activeTab = 'My Circles'"
        >
          My Circles
        </button>
      </div>
      <!-- Tab content area -->
      <div class="tab-content">
        <div v-if="activeTab === 'My Posts'">
          <!-- Replace this with actual posts listing -->
          <p>User posts go here.</p>
        </div>
        <div v-else-if="activeTab === 'My Circles'">
          <!-- Replace this with actual circles content -->
          <p>User circles go here.</p>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { auth } from "../firebase/init.js";
  import blankProfile from "@/assets/blank_profile.png";
  import { doc, getDoc } from "firebase/firestore";
  import db from "../firebase/init.js";
  
  export default {
    name: "Profile",
    data() {
      return {
        userStats: {
          posts: 0,
          followers: 0,
          following: 0
        },
        activeTab: "My Posts"
      };
    },
    computed: {
      profileImage() {
        // Use photoURL if available (Google registration), else fall back to local image.
        return auth.currentUser && auth.currentUser.photoURL
          ? auth.currentUser.photoURL
          : blankProfile;
      },
      username() {
        return auth.currentUser && auth.currentUser.displayName
          ? auth.currentUser.displayName
          : "Anonymous";
      }
    },
    created() {
      // Fetch the user's stats from Firestore "users" collection.
      if (auth.currentUser) {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        getDoc(userDocRef)
          .then((docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              this.userStats = {
                posts: data.posts || 0,
                followers: data.followers || 0,
                following: data.following || 0
              };
            }
          })
          .catch((error) => {
            console.error("Error fetching user stats:", error);
          });
      }
    }
  };
  </script>
  
  <style scoped>
  .profile-container {
    padding: 20px;
  }
  .profile-header {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
  }
  .profile-picture {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
    margin-right: 20px;
  }
  .profile-info {
    display: flex;
    flex-direction: column;
  }
  .username {
    font-size: 24px;
    font-weight: bold;
    margin: 0;
  }
  .user-stats {
    margin-top: 5px;
    font-size: 14px;
    color: #666;
  }
  .user-stats span {
    margin-right: 10px;
  }
  .tab-navbar {
    display: flex;
    justify-content: center;
    margin-bottom: 10px;
  }
  .tab-navbar button {
    background: none;
    border: none;
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
    color: #734f96;
  }
  .tab-navbar button.active {
    border-bottom: 2px solid #734f96;
    font-weight: bold;
  }
  .tab-content {
    padding: 10px;
    border: 1px solid #ccc;
  }
  </style>
  