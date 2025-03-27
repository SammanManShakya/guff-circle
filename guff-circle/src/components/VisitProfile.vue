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
        <!-- Follow button: Only visible if not viewing your own profile -->
        <div v-if="!isOwnProfile">
          <button
            v-if="!isFollowing"
            @click="followUser"
            class="follow-button"
          >
            Follow
          </button>
          <button
            v-else
            @click="unfollowUser"
            class="follow-button following"
          >
            Following
          </button>
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
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import db from "../firebase/init.js";
import blankProfile from "@/assets/blank_profile.png";
import { auth } from "../firebase/init.js"; // Ensure your Firebase auth is exported from here

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
    },
    // Check if this is the current user's own profile.
    isOwnProfile() {
      return auth.currentUser && auth.currentUser.uid === this.userId;
    },
    // Check if the current user is already following the visited user.
    isFollowing() {
      if (this.user && this.user.followers && Array.isArray(this.user.followers)) {
        return this.user.followers.includes(auth.currentUser.uid);
      }
      return false;
    }
  },
  created() {
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
  },
  methods: {
    followUser() {
      if (!auth.currentUser) {
        console.error("User not logged in.");
        return;
      }
      const currentUserId = auth.currentUser.uid;
      if (currentUserId === this.userId) {
        console.error("Cannot follow yourself.");
        return;
      }
      const visitedUserRef = doc(db, "users", this.userId);
      const currentUserRef = doc(db, "users", currentUserId);
      // Update the visited user's followers array.
      updateDoc(visitedUserRef, {
        followers: arrayUnion(currentUserId)
      })
        .then(() => {
          // Update the current user's following array.
          return updateDoc(currentUserRef, {
            following: arrayUnion(this.userId)
          });
        })
        .then(() => {
          // Update local state to reflect the new follower.
          this.userStats.followers += 1;
          if (this.user && Array.isArray(this.user.followers)) {
            this.user.followers.push(currentUserId);
          } else if (this.user) {
            this.user.followers = [currentUserId];
          }
        })
        .catch((error) => {
          console.error("Error updating follow information:", error);
        });
    },
    unfollowUser() {
      if (!auth.currentUser) {
        console.error("User not logged in.");
        return;
      }
      const currentUserId = auth.currentUser.uid;
      if (currentUserId === this.userId) {
        console.error("Cannot unfollow yourself.");
        return;
      }
      const visitedUserRef = doc(db, "users", this.userId);
      const currentUserRef = doc(db, "users", currentUserId);
      // Update the visited user's followers array: remove current user's ID.
      updateDoc(visitedUserRef, {
        followers: arrayRemove(currentUserId)
      })
        .then(() => {
          // Update the current user's following array: remove visited user's ID.
          return updateDoc(currentUserRef, {
            following: arrayRemove(this.userId)
          });
        })
        .then(() => {
          // Update local state to reflect the removal.
          this.userStats.followers -= 1;
          if (this.user && Array.isArray(this.user.followers)) {
            this.user.followers = this.user.followers.filter(
              (id) => id !== currentUserId
            );
          }
        })
        .catch((error) => {
          console.error("Error updating unfollow information:", error);
        });
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
.follow-button {
  margin-top: 10px;
  padding: 8px 16px;
  font-size: 14px;
  background-color: #734f96;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.follow-button:hover {
  background-color: #5b3e7a;
}
.follow-button.following {
  background-color: #ccc;
  color: #666;
  cursor: pointer;
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
