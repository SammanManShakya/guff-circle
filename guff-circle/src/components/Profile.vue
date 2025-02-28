<template>
    <div class="profile-container">
      <div class="profile-header">
        <img :src="profileImage" alt="Profile Picture" class="profile-picture" />
        <h2 class="username">{{ username }}</h2>
      </div>
      <!-- Additional profile content can go here -->
    </div>
  </template>
  
  <script>
  import { auth } from "../firebase/init.js";
  import blankProfile from "@/assets/blank_profile.png";
  
  export default {
    name: "Profile",
    computed: {
      profileImage() {
        // Use the user's photoURL if available; otherwise, use the blank profile image.
        return auth.currentUser && auth.currentUser.photoURL
          ? auth.currentUser.photoURL
          : blankProfile;
      },
      username() {
        // Display the user's displayName, or fallback to "Anonymous" if not available.
        return auth.currentUser && auth.currentUser.displayName
          ? auth.currentUser.displayName
          : "Anonymous";
      }
    }
  }
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
  .username {
    font-size: 24px;
    font-weight: bold;
  }
  </style>
  