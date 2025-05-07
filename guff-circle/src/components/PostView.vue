<template>
    <div class="post-view" v-if="!loading">
      <!-- Post header -->
      <div class="post-header">
        <div class="profile-pic">
          <slot name="profile-pic">
            <img :src="profileImageSrc" alt="Profile" class="profile-pic-img" />
          </slot>
        </div>
        <div class="username">
          <router-link :to="profileRoute" class="username-link">
            <slot name="username">{{ user.username }}</slot>
          </router-link>
        </div>
      </div>
  
      <!-- Post content -->
      <div class="post-content">
        <slot>
          <div v-if="text && postImageSrc">
            <p class="post-text">{{ text }}</p>
            <img :src="postImageSrc" alt="Post image" class="post-image" />
          </div>
          <div v-else-if="text">
            <p class="post-text">{{ text }}</p>
          </div>
          <div v-else-if="postImageSrc">
            <img :src="postImageSrc" alt="Post image" class="post-image" />
          </div>
        </slot>
      </div>
  
      <!-- Actions: like & comment -->
      <div class="post-actions">
        <!-- Like button -->
        <button
          @click="toggleLike"
          class="action-button like-button"
          :style="{ color: liked ? '#e0245e' : '#888' }"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16" height="16"
            fill="currentColor"
            :class="liked ? 'bi-heart-fill' : 'bi-heart'"
            viewBox="0 0 16 16"
          >
            <path
              v-if="liked"
              fill-rule="evenodd"
              d="M8 1.314C12.438-3.248 23.534 4.735 8 15 -7.534 4.736 3.562-3.248 8 1.314z"
            />
            <path
              v-else
              d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748z"
            />
          </svg>
        </button>
        <span class="like-count">{{ likes.length }}</span>
  
        <!-- Comment toggle -->
        <button
          @click="showComments = !showComments"
          class="action-button comment-button"
          :style="{ color: showComments ? '#734f96' : '#888' }"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16" height="16"
            fill="currentColor"
            class="bi bi-chat"
            viewBox="0 0 16 16"
          >
            <path
              d="M2 2h12v11H5.414L2 15.414V2zm1 1v10.586l2.586-2.586H13V3H3z"
            />
          </svg>
        </button>
        <span class="comment-count">{{ commentsList.length }}</span>
      </div>
  
      <!-- Collapsible comments + input -->
      <transition name="fade">
        <div v-if="showComments">
          <!-- Comment input -->
          <Comment
            :postId="postId"
            @comment-posted="handleCommentPosted"
          />
  
          <!-- Existing comments -->
          <div class="comments-list" v-if="commentsList.length">
            <div
              v-for="(c, i) in commentsList"
              :key="i"
              class="comment-item"
            >
              <img
                :src="c.profilePicture || placeholder"
                class="commenter-pic"
              />
              <div class="comment-body">
                <span class="commenter-name">{{ c.username }}</span>
                <p class="comment-text">{{ c.text }}</p>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </template>
  
  <script>
  import db, { auth } from "@/firebase/init.js";
  import {
    doc,
    getDoc,
    onSnapshot,
    updateDoc,
    arrayUnion,
    arrayRemove
  } from "firebase/firestore";
  import Comment from "@/components/Comment.vue";
  
  export default {
    name: "PostView",
    components: { Comment },
    props: {
      postId: { type: String, required: true }
    },
    data() {
      return {
        authorId: "",
        user: { username: "", profilePicture: "" },
        text: "",
        imgContent: "",
        likes: [],
        commentsList: [],
  
        showComments: false,
        loading: true,
        placeholder: "https://via.placeholder.com/32",
  
        unsubscribe: null
      };
    },
    computed: {
      profileImageSrc() {
        const pic = this.user.profilePicture || "";
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
      liked() {
        const uid = auth.currentUser?.uid;
        return uid && this.likes.includes(uid);
      },
      isOwnPost() {
        return auth.currentUser?.uid === this.authorId;
      },
      profileRoute() {
        return this.isOwnPost
          ? { name: "Profile" }
          : { name: "VisitProfile", params: { userId: this.authorId } };
      }
    },
    methods: {
      async toggleLike() {
        const uid = auth.currentUser.uid;
        const postRef = doc(db, "posts", this.postId);
        if (this.liked) {
          await updateDoc(postRef, { likes: arrayRemove(uid) });
        } else {
          await updateDoc(postRef, { likes: arrayUnion(uid) });
        }
      },
      handleCommentPosted() {
        this.showComments = false;
      }
    },
    mounted() {
      const postRef = doc(db, "posts", this.postId);
  
      this.unsubscribe = onSnapshot(postRef, async snap => {
        if (!snap.exists()) return;
        const post = snap.data();
  
        // update all fields
        this.authorId = post.user_id;
        this.text = post.text_content || "";
        this.imgContent = post.img_content || "";
        this.likes = post.likes || [];
  
        const raw = post.comments || [];
        this.commentsList = await Promise.all(
          raw.map(async str => {
            let userId, text;
            try {
              [userId, text] = JSON.parse(str);
            } catch {
              userId = ""; text = str;
            }
            const uSnap = await getDoc(doc(db, "users", userId));
            const u = uSnap.exists() ? uSnap.data() : {};
            return {
              userId,
              username: u.username || "Unknown",
              profilePicture: u.profilePicture || "",
              text
            };
          })
        );
  
        const authorSnap = await getDoc(doc(db, "users", this.authorId));
        if (authorSnap.exists()) this.user = authorSnap.data();
  
        this.loading = false;
      });
    },
    unmounted() {
      if (this.unsubscribe) this.unsubscribe();
    }
  };
  </script>
  
  <style scoped>
  .post-view {
    border: 1px solid #ccc;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
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
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
  .action-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }
  .like-count,
  .comment-count {
    font-size: 0.9rem;
    color: #555;
  }
  
  .comments-list {
    margin-top: 1rem;
  }
  .comment-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 0.75rem;
  }
  .commenter-pic {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    margin-right: 0.5rem;
  }
  .comment-body {
    flex: 1;
  }
  .commenter-name {
    font-weight: bold;
    display: block;
  }
  .comment-text {
    margin: 0.25rem 0 0;
  }
  
  /* simple fade transition */
  .fade-enter-active, .fade-leave-active {
    transition: opacity .2s;
  }
  .fade-enter-from, .fade-leave-to {
    opacity: 0;
  }
  </style>
  