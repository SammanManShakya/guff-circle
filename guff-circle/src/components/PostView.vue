<template>
    <div class="post-view" v-if="!loading">
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
  
      <div class="post-actions">
        <!-- Like button -->
        <button
          @click="toggleLike"
          class="action-button like-button"
          :style="{ color: liked ? '#e0245e' : '#888' }"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
               fill="currentColor" :class="liked ? 'bi-heart-fill' : 'bi-heart'"
               viewBox="0 0 16 16">
            <path v-if="liked" fill-rule="evenodd"
                  d="M8 1.314C12.438-3.248 23.534 4.735 8 15 -7.534 4.736 3.562-3.248 8 1.314z"/>
            <path v-else
                  d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053
                     c-.523 1.023-.641 2.5.314 4.385.92 1.815
                     2.834 3.989 6.286 6.357 3.452-2.368
                     5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385
                     C13.486.878 10.4.28 8.717 2.01L8 2.748z"/>
          </svg>
        </button>
        <span class="like-count">{{ likes.length }}</span>
  
        <button
          @click="showComments = !showComments"
          class="action-button comment-button"
          :style="{ color: showComments ? '#734f96' : '#888' }"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
               fill="currentColor" class="bi bi-chat" viewBox="0 0 16 16">
            <path d="M2 2h12v11H5.414L2 15.414V2zm1 1v10.586l2.586-2.586H13V3H3z"/>
          </svg>
        </button>
        <span class="comment-count">{{ commentsList.length }}</span>
  
        <!-- Delete button -->
        <button
          v-if="isOwnPost"
          @click="deletePost"
          class="action-button delete-button"
          title="Delete post"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
               fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
            <path
              d="M5.5 5.5A.5.5 0 0 1 6 5h4a.5.5 0 0 1 .5.5v8a
                 .5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5v-8z"/>
            <path fill-rule="evenodd"
                  d="M14.5 3a1 1 0 0 1-1 1H13v9.5
                     A1.5 1.5 0 0 1 11.5 15h-7A1.5 1.5 0 0 1 3
                     13.5V4H2.5a1 1 0 0 1 0-2h3a1 1 0 0 1 1-1h4
                     a1 1 0 0 1 1 1h3a1 1 0 0 1 1 1zM4.118
                     4 4 4.059V13.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0
                     .5-.5V4.059L11.882 4H4.118zM2.5
                     3h11V2h-11v1z"/>
          </svg>
        </button>
      </div>
  
      <!-- Collapsible comments section -->
      <transition name="fade">
        <div v-if="showComments">
          <Comment
            :postId="postId"
            @comment-posted="handleCommentPosted"
          />
          <div class="comments-list" v-if="commentsList.length">
            <div v-for="(c, i) in commentsList" :key="i" class="comment-item">
              <img :src="c.profilePicture || placeholder" class="commenter-pic"/>
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
  import {
    doc,
    getDoc,
    deleteDoc,
    updateDoc,
    arrayRemove,
    arrayUnion,      
    onSnapshot,
    getDocs,         
    collection,      
    query,         
    where           
  } from "firebase/firestore";
  import { auth } from "@/firebase/init.js";
  import db from "@/firebase/init.js";
  import Comment from "@/components/Comment.vue";
  
  export default {
    name: "PostView",
    components: { Comment },
    props: { postId: { type: String, required: true } },
    data() {
      return {
        authorId: "",
        circleId: "",
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
        const op = this.liked ? arrayRemove(uid) : arrayUnion(uid);
        await updateDoc(postRef, { likes: op });
      },
      handleCommentPosted() {
        this.showComments = false;
      },
      async deletePost() {
        if (!confirm("Delete this post?")) return;
  
        // delete post from firebase
        await deleteDoc(doc(db, "posts", this.postId));
  
        // remove from circle.circle_posts
        const circleSnap = await getDocs(
          query(
            collection(db, "circles"),
            where("circle_id", "==", this.circleId)
          )
        );
        circleSnap.forEach(cDoc =>
          updateDoc(cDoc.ref, {
            circle_posts: arrayRemove(this.postId)
          })
        );
  
        // remove from users.posts
        await updateDoc(doc(db, "users", this.authorId), {
          posts: arrayRemove(this.postId)
        });
      }
    },
    mounted() {
      const postRef = doc(db, "posts", this.postId);
      this.unsubscribe = onSnapshot(postRef, async snap => {
        if (!snap.exists()) return;
        const data = snap.data();
  
        this.authorId   = data.user_id;
        this.circleId   = data.circle_id;
        this.text       = data.text_content || "";
        this.imgContent = data.img_content || "";
        this.likes      = data.likes || [];
  
        // load comments
        const raw = data.comments || [];
        this.commentsList = await Promise.all(
          raw.map(async str => {
            let userId, text;
            try { [userId, text] = JSON.parse(str); }
            catch { userId = ""; text = str; }
            const uSnap = await getDoc(doc(db, "users", userId));
            return {
              username: uSnap.exists() ? uSnap.data().username : "Unknown",
              profilePicture: uSnap.exists() ? uSnap.data().profilePicture : "",
              text
            };
          })
        );
  
        // get author info
        const aSnap = await getDoc(doc(db, "users", this.authorId));
        if (aSnap.exists()) this.user = aSnap.data();
  
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
  .delete-button svg {
    color: #c82333;
  }
  .delete-button:hover svg {
    color: #a71d2a;
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
  .fade-enter-active, .fade-leave-active {
    transition: opacity .2s;
  }
  .fade-enter-from, .fade-leave-to {
    opacity: 0;
  }
  </style>
  