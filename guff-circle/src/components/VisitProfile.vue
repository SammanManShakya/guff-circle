<template>
  <div class="profile-container">
    <!-- Display the user ID for error checking -->
    <div class="user-id-display">
      User ID: {{ userId }}
    </div>
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
    <!-- Single tab for posts only -->
    <div class="tab-navbar">
      <button class="active">
        {{ username }}'s Posts
      </button>
    </div>
    <div class="tab-content">
      <div>
        <p>User posts go here.</p>
      </div>
    </div>
  </div>
</template>

<script>
import { doc, getDoc } from "firebase/firestore";
import db from "../firebase/init.js";
import blankProfile from "@/assets/blank_profile.png";

export default {
  name: "VisitProfile",
  props: {
    userId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      user: null,
      userStats: {
        posts: 0,
        followers: 0,
        following: 0
      }
    };
  },
  computed: {
    username() {
      return this.user && this.user.username ? this.user.username : "Anonymous";
    },
    profileImage() {
      return this.user && this.user.profilePicture
        ? this.user.profilePicture
        : blankProfile;
    }
  },
  created() {
    // Use the userId prop to fetch the user data from Firestore.
    if (this.userId) {
      const userDocRef = doc(db, "users", this.userId);
      getDoc(userDocRef)
        .then((docSnap) => {
          if (docSnap.exists()) {
            this.user = docSnap.data();
            this.userStats = {
              posts: Array.isArray(this.user.posts) ? this.user.posts.length : 0,
              followers: Array.isArray(this.user.followers) ? this.user.followers.length : 0,
              following: Array.isArray(this.user.following) ? this.user.following.length : 0
            };
          } else {
            console.error("No such user exists.");
          }
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
        });
    } else {
      console.error("No userId provided.");
    }
  }
};
</script>

<style scoped>
.profile-container {
  padding: 20px;
}
.user-id-display {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
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
