<template>
  <div class="profile-container">
    <div class="profile-header">
      <img
        :src="profileImage"
        alt="Profile Picture"
        class="profile-picture"
      />
      <div class="profile-info">
        <h2 class="username">{{ username }}</h2>
        <div class="user-stats">
          <span>{{ userStats.posts }} Posts</span>
          <span>{{ userStats.followers }} Followers</span>
          <span>{{ userStats.following }} Following</span>
        </div>
        <div class="profile-actions">
          <button
            @click="createCircle"
            class="create-circle-button"
          >
            Create गफ Circle
          </button>
          <button
            @click="goToSettings"
            class="settings-button"
            title="Settings"
          >
            <!-- hollow gear with solid center -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16" height="16"
              fill="currentColor"
              class="bi bi-gear"
              viewBox="0 0 16 16"
            >
              <!-- inner circle -->
              <path
                d="M8 4.754a3.246 3.246 0 1 0 0 6.492
                   3.246 3.246 0 0 0 0-6.492zM5.754 8
                   a2.246 2.246 0 1 1 4.492 0
                   2.246 2.246 0 0 1-4.492 0z"
              />
              <!-- outer gear teeth -->
              <path
                fill-rule="evenodd"
                d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 
                   0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16
                   c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 
                   0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 
                   3.065 0 3.592l.319.094a.873.873 0 0 1 .52 
                   1.255l-.16.292c-.892 1.64.901 3.434 2.541 
                   2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319
                   c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 
                   0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902
                   2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255
                   l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094
                   a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902
                   -3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52
                   l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0
                   l.094.319a1.873 1.873 0 0 0 2.693 
                   1.115l.291-.16c.764-.415 1.6.42 
                   1.184 1.185l-.159.292a1.873 1.873 
                   0 0 0 1.116 2.692l.318.094c.835.246
                   .835 1.428 0 1.674l-.319.094a1.873 
                   1.873 0 0 0-1.115 2.693l.16.291c.415.764
                   -.42 1.6-1.185 1.184l-.291-.159a1.873 
                   1.873 0 0 0-2.693 1.116l-.094.318c-.246.835
                   -1.428.835-1.674 0l-.094-.319a1.873 1.873
                   0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42
                   -1.184-1.185l.159-.291A1.873 1.873 0 0 0 
                   1.945 8.93l-.319-.094c-.835-.246-.835-1.428 
                   0-1.674l.319-.094A1.873 1.873 0 0 0 
                   3.06 4.377l-.16-.292c-.415-.764.42-1.6 
                   1.185-1.184l.292.159a1.873 1.873 0 0 0 
                   2.692-1.115l.094-.319z"
              />
            </svg>
          </button>
        </div>
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
            <template #username>
              {{ username }} in {{ p.circleName }}
            </template>
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
            <div
              v-show="showMembers[circle.circleId]"
              class="circle-members"
            >
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
                <template #username>
                  {{ member.username }}
                </template>
              </SearchItem>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { auth } from "@/firebase/init.js";
import blankProfile from "@/assets/blank_profile.png";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import db from "@/firebase/init.js";
import PostView from "@/components/PostView.vue";
import SearchItem from "@/components/SearchItem.vue";

export default {
  name: "Profile",
  components: { PostView, SearchItem },
  data() {
    return {
      profilePic: "",
      userStats: { posts: 0, followers: 0, following: 0 },
      activeTab: "My Posts",
      userPosts: [],
      loadingPosts: false,
      userCircles: [],
      loadingCircles: false,
      showMembers: {}
    };
  },
  computed: {
    // now coming from Firestore, not auth.photoURL
    profileImage() {
      return this.profilePic || blankProfile;
    },
    username() {
      return auth.currentUser?.displayName || "Anonymous";
    }
  },
  async created() {
    const user = auth.currentUser;
    if (!user) return;

    // load your Firestore user doc
    const uRef = doc(db, "users", user.uid);
    const snap = await getDoc(uRef);
    if (!snap.exists()) return;
    const data = snap.data();

    // use Firestore’s profilePicture
    this.profilePic = data.profilePicture || "";

    // stats
    this.userStats = {
      posts: Array.isArray(data.posts) ? data.posts.length : 0,
      followers: Array.isArray(data.followers) ? data.followers.length : 0,
      following: Array.isArray(data.following) ? data.following.length : 0
    };

    // fetch posts & circles
    this.loadUserPosts(Array.isArray(data.posts) ? data.posts : []);
    this.loadUserCircles(Array.isArray(data.user_circles) ? data.user_circles : []);
  },
  methods: {
    async loadUserPosts(postIds) {
      this.loadingPosts = true;
      const posts = [];
      for (const id of postIds) {
        const ps = await getDoc(doc(db, "posts", id));
        if (!ps.exists()) continue;
        const post = ps.data();
        const circleSnap = await getDocs(
          query(collection(db, "circles"), where("circle_id", "==", post.circle_id))
        );
        const circleName = !circleSnap.empty
          ? circleSnap.docs[0].data().circle_name
          : "";
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
        const cs = await getDocs(
          query(collection(db, "circles"), where("circle_id", "==", cid))
        );
        if (cs.empty) continue;
        const cdata = cs.docs[0].data();
        const members = Array.isArray(cdata.circle_members) ? cdata.circle_members : [];
        const membersData = [];
        for (const uid of members) {
          const us = await getDoc(doc(db, "users", uid));
          if (!us.exists()) continue;
          membersData.push({ userId: uid, ...us.data() });
        }
        circles.push({
          circleId: cid,
          circleName: cdata.circle_name,
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
      this.$router.push({
        name: "CreateCircle",
        params: { currentUserId: auth.currentUser.uid }
      });
    },
    goToSettings() {
      this.$router.push({ name: "ChangeSettings" });
    }
  }
};
</script>

<style scoped>
.profile-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
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
.profile-actions {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.create-circle-button,
.settings-button {
  padding: 8px 12px;
  font-size: 14px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.create-circle-button {
  background-color: #734f96;
  color: white;
}
.create-circle-button:hover {
  background-color: #5b3e7a;
}
.settings-button {
  background: none;
  color: #734f96;
}
.settings-button:hover {
  background: #f5f0fa;
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
