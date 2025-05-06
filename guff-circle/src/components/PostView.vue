<template>
    <div class="post-view" v-if="!loading">
      <div class="post-header">
        <div class="profile-pic">
          <slot name="profile-pic">
            <img :src="profileImageSrc" alt="Profile" class="profile-pic-img" />
          </slot>
        </div>
        <div class="username">
          <router-link
            :to="profileRoute"
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
            <img :src="postImageSrc" alt="Post image" class="post-image" />
          </div>
          <div v-else-if="text">
            <p class="post-text">{{ text }}</p>
          </div>
          <div v-else-if="imgContent">
            <img :src="postImageSrc" alt="Post image" class="post-image" />
          </div>
        </slot>
      </div>
      <div class="post-actions">
        <button @click="toggleLike" class="like-button">
          <svg
            v-if="liked"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="red"
            class="bi bi-heart-fill"
            viewBox="0 0 16 16"
          >
            <path
              fill-rule="evenodd"
              d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"
            />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            class="bi bi-heart"
            viewBox="0 0 16 16"
          >
            <path
              d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 
                 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 
                 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 
                 10.4.28 8.717 2.01zM8 15C-7.333 4.868 3.279-3.04 
                 7.824 1.143q.09.083.176.171a3 3 0 0 1 .176-.17C12.72-3.042 
                 23.333 4.867 8 15"
            />
          </svg>
        </button>
        <span class="like-count">{{ likes.length }}</span>
      </div>
    </div>
  </template>
  
  <script>
  import db, { auth } from "@/firebase/init.js";
  import {
    doc,
    getDoc,
    updateDoc,
    arrayUnion,
    arrayRemove
  } from "firebase/firestore";
  
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
        user: { username: "", profilePicture: "" },
        text: "",
        imgContent: "",
        likes: [],
        loading: true
      };
    },
    computed: {
      profileImageSrc() {
        const pic = this.user.profilePicture || "";
        if (!pic) {
          return "https://via.placeholder.com/40";
        }
        return pic.startsWith("http") || pic.startsWith("data:")
          ? pic
          : `data:image/png;base64,${pic}`;
      },
      postImageSrc() {
        if (!this.imgContent) return "";
        return this.imgContent.startsWith("data:")
          ? this.imgContent
          : `data:image/png;base64,${this.imgContent}`;
      },
      isOwnPost() {
        const current = auth.currentUser;
        return current && current.uid === this.authorId;
      },
      profileRoute() {
        return this.isOwnPost
          ? { name: "Profile" }
          : { name: "VisitProfile", params: { userId: this.authorId } };
      },
      liked() {
        const current = auth.currentUser;
        return current && this.likes.includes(current.uid);
      }
    },
    methods: {
      async toggleLike() {
        const userId = auth.currentUser.uid;
        const postRef = doc(db, "posts", this.postId);
        if (this.liked) {
          await updateDoc(postRef, {
            likes: arrayRemove(userId)
          });
          this.likes = this.likes.filter(id => id !== userId);
        } else {
          await updateDoc(postRef, {
            likes: arrayUnion(userId)
          });
          this.likes.push(userId);
        }
      }
    },
    async mounted() {
      const postSnap = await getDoc(doc(db, "posts", this.postId));
      if (postSnap.exists()) {
        const post = postSnap.data();
        this.authorId = post.user_id || post.author_id;
        this.text = post.text_content || post.text || "";
        this.imgContent = post.img_content || "";
        this.likes = post.likes || [];
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
  .post-actions {
    display: flex;
    align-items: center;
    margin-top: 0.5rem;
  }
  .like-button {
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
  }
  .like-count {
    margin-left: 0.5rem;
    font-size: 0.9rem;
    color: #555;
  }
  </style>
  