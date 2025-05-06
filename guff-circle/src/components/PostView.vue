<template>
    <div class="post-view" v-if="!loading">
      <div class="post-header">
        <div class="profile-pic">
          <slot name="profile-pic">
            <img :src="user.profile_pic" alt="Profile" class="profile-pic-img" />
          </slot>
        </div>
        <div class="username">
          <router-link
            :to="{ name: 'VisitProfile', params: { userId: authorId } }"
            class="username-link"
          >
            <slot name="username">{{ user.username }}</slot>
          </router-link>
        </div>
      </div>
      <div class="post-content">
        <slot>
          <div v-if="text && imgContent">
            <p class="post-text">{{ text }}</p>
            <img :src="imgContent" alt="Post image" class="post-image" />
          </div>
          <div v-else-if="text">
            <p class="post-text">{{ text }}</p>
          </div>
          <div v-else-if="imgContent">
            <img :src="imgContent" alt="Post image" class="post-image" />
          </div>
        </slot>
      </div>
    </div>
  </template>
  
  <script>
  import db from "@/firebase/init.js";
  import { doc, getDoc } from "firebase/firestore";
  
  export default {
    name: "PostView",
    props: {
      postId: {
        type: String,
        required: true
      }
    },
    data() {
      return {
        authorId: "",
        user: { username: "", profile_pic: "" },
        text: "",
        imgContent: "",
        loading: true
      };
    },
    async mounted() {
      const postSnap = await getDoc(doc(db, "posts", this.postId));
      if (postSnap.exists()) {
        const post = postSnap.data();
        this.authorId = post.author_id;
        this.text = post.text || "";
        this.imgContent = post.img_content || "";
        const userSnap = await getDoc(doc(db, "users", this.authorId));
        if (userSnap.exists()) {
          this.user = userSnap.data();
        }
      }
      this.loading = false;
    }
  };
  </script>
  
  <style scoped>
  .post-view {
    border: 1px solid #ccc;
    padding: 1rem;
    margin-bottom: 1rem;
    border-radius: 0.5rem;
  }
  .post-header {
    display: flex;
    align-items: center;
    margin-bottom: 0.75rem;
  }
  .profile-pic-img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
  }
  .username-link {
    margin-left: 0.5rem;
    font-weight: bold;
    color: #734f96;
    text-decoration: none;
  }
  .username-link:hover {
    text-decoration: underline;
  }
  .post-content {
    margin-top: 0.5rem;
  }
  .post-text {
    margin: 0 0 0.5rem;
    line-height: 1.4;
  }
  .post-image {
    width: 100%;
    border-radius: 0.5rem;
    object-fit: cover;
  }
  </style>
  