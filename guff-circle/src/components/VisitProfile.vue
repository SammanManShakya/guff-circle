<template>
  <!-- root wrapper still has class="profile-container" -->
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
        <!-- Follow/Unfollow button -->
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

    <!-- Single tab for posts -->
    <div class="tab-navbar">
      <button class="active">
        {{ username }}'s Posts
      </button>
    </div>
    <div class="tab-content">
      <div v-if="loadingPosts">Loading posts…</div>
      <div v-else-if="!userPosts.length">
        No posts from {{ username }} in your circles.
      </div>
      <div v-else>
        <PostView
          v-for="p in userPosts"
          :key="p.id"
          :postId="p.id"
        >
          <template #username>
            {{ username }} in {{ p.circleName }}
          </template>
        </PostView>
      </div>
    </div>
  </div>
</template>

<script>
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import db, { auth } from "../firebase/init.js";
import blankProfile from "@/assets/blank_profile.png";
import PostView from "@/components/PostView.vue";

export default {
  name: "VisitProfile",
  components: { PostView },
  props: {
    userId: { type: String, required: true }
  },
  data() {
    return {
      user: null,
      userStats: { posts: 0, followers: 0, following: 0 },
      currentUserCircles: [],
      userPosts: [],
      loadingPosts: false
    };
  },
  computed: {
    username() {
      return (this.user && this.user.username) || "Anonymous";
    },
    profileImage() {
      return (this.user && this.user.profilePicture) || blankProfile;
    },
    isOwnProfile() {
      return auth.currentUser?.uid === this.userId;
    },
    isFollowing() {
      return (
        this.user &&
        Array.isArray(this.user.followers) &&
        this.user.followers.includes(auth.currentUser.uid)
      );
    }
  },
  async created() {
    // load visited user's data
    const visitedSnap = await getDoc(doc(db, "users", this.userId));
    if (!visitedSnap.exists()) {
      console.error("No such user exists.");
      return;
    }
    this.user = visitedSnap.data();
    this.userStats = {
      posts: Array.isArray(this.user.posts) ? this.user.posts.length : 0,
      followers: Array.isArray(this.user.followers)
        ? this.user.followers.length
        : 0,
      following: Array.isArray(this.user.following)
        ? this.user.following.length
        : 0
    };

    // load current user's circles
    const meUid = auth.currentUser?.uid;
    if (meUid) {
      const meSnap = await getDoc(doc(db, "users", meUid));
      this.currentUserCircles = meSnap.exists()
        ? meSnap.data().user_circles || []
        : [];
    }

    // load & filter their posts
    this.loadUserPosts();
  },
  methods: {
    async loadUserPosts() {
      this.loadingPosts = true;
      const posts = [];
      const postIds = Array.isArray(this.user.posts) ? this.user.posts : [];

      for (const pid of postIds) {
        const postSnap = await getDoc(doc(db, "posts", pid));
        if (!postSnap.exists()) continue;
        const post = postSnap.data();
        if (this.currentUserCircles.includes(post.circle_id)) {
          let circleName = "";
          const circleSnap = await getDocs(
            query(
              collection(db, "circles"),
              where("circle_id", "==", post.circle_id)
            )
          );
          if (!circleSnap.empty) {
            circleName = circleSnap.docs[0].data().circle_name;
          }
          posts.push({ id: pid, circleName });
        }
      }

      this.userPosts = posts;
      this.loadingPosts = false;
    },
    async followUser() {
      const me = auth.currentUser.uid;
      if (me === this.userId) return;
      const visitedRef = doc(db, "users", this.userId);
      const meRef = doc(db, "users", me);
      await updateDoc(visitedRef, { followers: arrayUnion(me) });
      await updateDoc(meRef, { following: arrayUnion(this.userId) });
      this.userStats.followers++;
      this.user.followers = [...(this.user.followers || []), me];
    },
    async unfollowUser() {
      const me = auth.currentUser.uid;
      if (me === this.userId) return;
      const visitedRef = doc(db, "users", this.userId);
      const meRef = doc(db, "users", me);
      await updateDoc(visitedRef, { followers: arrayRemove(me) });
      await updateDoc(meRef, { following: arrayRemove(this.userId) });
      this.userStats.followers--;
      this.user.followers = (this.user.followers || []).filter(id => id !== me);
    }
  }
};
</script>

<style scoped>
/* span both columns of the #app grid */
:deep(.profile-container) {
  grid-column: 1 / -1 !important;
}

.profile-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;

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
