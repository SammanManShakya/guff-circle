<template>
    <div class="create-post">
      <!-- Text area for post content -->
      <textarea
        v-model="textContent"
        placeholder="What's on your mind?"
        class="post-textarea"
      ></textarea>
  
      <!-- Camera icon button to trigger file input -->
      <label for="file-input" class="camera-button">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 16 16">
          <path d="M15 12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1.172a3 3 0 0 0 2.12-.879l.83-.828A1 1 0 0 1 6.827 3h2.344a1 1 0 0 1 .707.293l.828.828A3 3 0 0 0 12.828 5H14a1 1 0 0 1 1 1z"/>
          <path d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4z"/>
          <path d="M8 11a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5m0 1a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M3 6.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0"/>
        </svg>
      </label>
      <input
        id="file-input"
        type="file"
        accept="image/*"
        @change="onImageChange"
        ref="fileInput"
        class="post-file-input"
      />
  
      <!-- Optional preview of uploaded image -->
      <div v-if="imgContent" class="image-preview">
        <img :src="imgContent" alt="Preview" />
      </div>
  
      <!-- Post button, enabled only if text or image is present -->
      <button
        :disabled="!canPost"
        @click="submitPost"
        class="post-button"
      >
        Post
      </button>
    </div>
  </template>
    
    <script>
    import { auth } from "@/firebase/init.js";
    import db from "@/firebase/init.js";
    import {
      doc,
      getDoc,
      collection,
      query,
      where,
      getDocs
    } from "firebase/firestore";
    import CreatePost from "@/components/CreatePost.vue";
    
    export default {
      name: "Feed",
      components: { CreatePost },
      data() {
        return {
          loading: true,
          userCircles: [],        // array of circle IDs (ints)
          circles: [],            // array of circle objects { circle_id, circle_name, ... }
          selectedCircleId: null  // currently selected circle ID
        };
      },
      computed: {
        // find the name of the currently selected circle
        selectedCircleName() {
          const circle = this.circles.find(
            (c) => c.circle_id === this.selectedCircleId
          );
          return circle ? circle.circle_name : "";
        }
      },
      methods: {
        async fetchUserCircles() {
          const user = auth.currentUser;
          if (!user) return [];
          const userSnap = await getDoc(doc(db, "users", user.uid));
          return userSnap.exists()
            ? userSnap.data().user_circles || []
            : [];
        },
        async fetchCirclesByIds(ids) {
          if (!ids.length) return [];
          // Firestore 'in' queries max 10 values; for more, you'd batch
          const circlesQuery = query(
            collection(db, "circles"),
            where("circle_id", "in", ids)
          );
          const snap = await getDocs(circlesQuery);
          return snap.docs.map((d) => d.data());
        },
        onCircleChange() {
          // any additional logic when circle changes can go here
          console.log(
            `Switched to circle ${this.selectedCircleName} (ID: ${this.selectedCircleId})`
          );
        }
      },
      async mounted() {
        // 1. Load the logged-in user's circle IDs
        this.userCircles = await this.fetchUserCircles();
    
        // 2. If any, fetch full circle objects
        if (this.userCircles.length > 0) {
          this.circles = await this.fetchCirclesByIds(this.userCircles);
          // default to the first circle in the list
          this.selectedCircleId = this.circles[0]?.circle_id;
        }
    
        this.loading = false;
      }
    };
    </script>
    
    <style scoped>
    .feed-container {
      padding: 1rem;
      width: 100%;
    }
    .loading {
      color: #666;
    }
    .no-circles {
      font-size: 1.2rem;
      color: #333;
    }
    .circle-selector {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .selected-info {
      margin-top: 0.75rem;
      font-weight: bold;
    }
    </style>
  