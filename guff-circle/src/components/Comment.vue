<template>
    <div class="comment-section">
      <div class="new-comment">
        <textarea
          v-model="newComment"
          placeholder="Write a comment..."
          class="comment-input"
        ></textarea>
        <button
          :disabled="!newComment.trim()"
          @click="submitComment"
          class="comment-button"
        >
          Post
        </button>
      </div>
    </div>
  </template>
  
  <script>
  import { auth } from "@/firebase/init.js";
  import db from "@/firebase/init.js";
  import { doc, updateDoc, arrayUnion } from "firebase/firestore";
  
  export default {
    name: "Comment",
    props: {
      postId: {
        type: String,
        required: true
      }
    },
    data() {
      return {
        newComment: ""
      };
    },
    computed: {
      currentUserId() {
        return auth.currentUser?.uid || "";
      }
    },
    methods: {
      async submitComment() {
        const userId = this.currentUserId;
        const text = this.newComment.trim();
        if (!userId || !text) return;
  
        const commentStr = JSON.stringify([userId, text]);
        const postRef = doc(db, "posts", this.postId);
        await updateDoc(postRef, {
          comments: arrayUnion(commentStr)
        });
  
        // notify parent immediately
        this.$emit("comment-posted", { userId, text });
        this.newComment = "";
      }
    }
  };
  </script>
  
  <style scoped>
  .comment-section {
    margin-top: 1rem;
  }
  .new-comment {
    display: flex;
    gap: 0.5rem;
  }
  .comment-input {
    flex: 1;
    resize: vertical;
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid #ccc;
  }
  .comment-button {
    padding: 0.5rem 1rem;
    background-color: #734f96;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .comment-button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  </style>
  