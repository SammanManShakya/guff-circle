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
        <button @click="createCircle" class="create-circle-button">
          Create गफ Circle
        </button>
      </div>
    </div>

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

    <div class="tab-content">
      <div v-if="activeTab === 'My Posts'">
        <div v-if="loadingPosts">Loading posts…</div>
        <div v-else-if="!userPosts.length">No posts yet.</div>
        <div v-else>
          <PostView
            v-for="p in userPosts"
            :key="p.id"
            :postId="p.id"
          >
            <template #username>{{ username }} in {{ p.circleName }}</template>
          </PostView>
        </div>
      </div>

      <div v-else-if="activeTab === 'My Circles'">
        <div v-if="loadingCircles">Loading circles…</div>
        <div v-else-if="!userCircles.length">Not in any circles.</div>
        <div v-else>
          <div
            v-for="circle in userCircles"
            :key="circle.circleId"
            class="circle-item"
          >
            <div class="circle-header">
              <span class="circle-name">{{ circle.circleName }}</span>
              <button
                @click="toggleMembers(circle.circleId)"
                class="members-toggle"
              >
                {{ showMembers[circle.circleId] ? 'Hide Members' : 'Show Members' }}
              </button>
            </div>
            <div v-show="showMembers[circle.circleId]" class="circle-members">
              <SearchItem
                v-for="member in circle.membersData"
                :key="member.userId"
                :userId="member.userId"
              >
                <template #profile-pic>
                  <img
                    :src="member.profilePicture || blankProfile"
                    alt="Profile"
                    class="member-pic"
                  />
                </template>
                <template #username>{{ member.username }}</template>
              </SearchItem>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { auth } from "../firebase/init.js";
import blankProfile from "@/assets/blank_profile.png";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import db from "../firebase/init.js";
import PostView from "@/components/PostView.vue";
import SearchItem from "@/components/SearchItem.vue";

export default {
  name: "Profile",
  components: { PostView, SearchItem },
  data() {
    return {
      userStats: {
        posts: 0,
        followers: 0,
        following: 0
      },
      activeTab: "My Posts",
      userPosts: [],
      loadingPosts: false,
      userCircles: [],
      loadingCircles: false,
      showMembers: {}
    };
  },
  computed: {
    profileImage() {
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
  async created() {
    const user = auth.currentUser;
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);
    try {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        this.userStats = {
          posts: Array.isArray(data.posts) ? data.posts.length : 0,
          followers: Array.isArray(data.followers)
            ? data.followers.length
            : 0,
          following: Array.isArray(data.following)
            ? data.following.length
            : 0
        };

        const postIds = Array.isArray(data.posts) ? data.posts : [];
        this.loadUserPosts(postIds);

        const circleIds = Array.isArray(data.user_circles)
          ? data.user_circles
          : [];
        this.loadUserCircles(circleIds);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  },
  methods: {
    async loadUserPosts(postIds) {
      this.loadingPosts = true;
      const posts = [];
      for (const id of postIds) {
        const postSnap = await getDoc(doc(db, "posts", id));
        if (!postSnap.exists()) continue;
        const postData = postSnap.data();
        const circleId = postData.circle_id;
        let circleName = "";
        const circleQ = query(
          collection(db, "circles"),
          where("circle_id", "==", circleId)
        );
        const circleSnap = await getDocs(circleQ);
        if (!circleSnap.empty) {
          circleName = circleSnap.docs[0].data().circle_name;
        }
        posts.push({ id, circleName });
      }
      this.userPosts = posts;
      this.loadingPosts = false;
    },
    async loadUserCircles(circleIds) {
      this.loadingCircles = true;
      const circles = [];
      const show = {};
      for (const cid of circleIds) {
        const circleQ = query(
          collection(db, "circles"),
          where("circle_id", "==", cid)
        );
        const circleSnap = await getDocs(circleQ);
        if (circleSnap.empty) continue;
        const circleDoc = circleSnap.docs[0];
        const circleData = circleDoc.data();
        const members = Array.isArray(circleData.circle_members)
          ? circleData.circle_members
          : [];
        const membersData = [];
        for (const uid of members) {
          const userSnap = await getDoc(doc(db, "users", uid));
          if (!userSnap.exists()) continue;
          const u = userSnap.data();
          membersData.push({
            userId: uid,
            username: u.username,
            profilePicture: u.profilePicture
          });
        }
        circles.push({
          circleId: cid,
          circleName: circleData.circle_name,
          membersData
        });
        show[cid] = false;
      }
      this.userCircles = circles;
      this.showMembers = show;
      this.loadingCircles = false;
    },
    toggleMembers(cid) {
      this.showMembers[cid] = !this.showMembers[cid];
    },
    createCircle() {
      if (auth.currentUser) {
        this.$router.push({
          name: "CreateCircle",
          params: { currentUserId: auth.currentUser.uid }
        });
      } else {
        console.warn("User not authenticated.");
      }
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
.create-circle-button {
  margin-top: 10px;
  padding: 8px 16px;
  font-size: 14px;
  background-color: #734f96;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.create-circle-button:hover {
  background-color: #5b3e7a;
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
.circle-item {
  margin-bottom: 1rem;
}
.circle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.members-toggle {
  background: none;
  border: none;
  color: #734f96;
  cursor: pointer;
}
.circle-members {
  margin-top: 0.5rem;
  padding-left: 1rem;
}
.member-pic {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 8px;
}
</style>
