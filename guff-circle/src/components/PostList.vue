<template>
    <div class="post-list">
      <div v-if="loading">Loading posts…</div>
      <div v-else-if="!postIds.length">No posts yet.</div>
      <div v-else>
        <PostView
          v-for="pid in postIds"
          :key="pid"
          :postId="pid"
        />
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, watch, onMounted, onUnmounted, defineProps } from "vue";
  import db from "@/firebase/init.js";
  import { collection, query, where, getDocs } from "firebase/firestore";
  import PostView from "@/components/PostView.vue";
  
  const props = defineProps({
    circleId: {
      type: [String, Number],
      required: true
    }
  });
  
  const postIds = ref([]);
  const loading = ref(true);
  let intervalId = null;
  
  // initial load of all posts, in newest-first order
  async function fetchPostsForCircle(id) {
    loading.value = true;
    postIds.value = [];
    if (!id) {
      loading.value = false;
      return;
    }
    const q = query(
      collection(db, "circles"),
      where("circle_id", "==", id)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const posts = snap.docs[0].data().circle_posts || [];
      postIds.value = posts.slice().reverse();
    }
    loading.value = false;
  }
  
  // check for any new post IDs and prepend them
  async function checkForNewPosts(id) {
    if (!id) return;
    const q = query(
      collection(db, "circles"),
      where("circle_id", "==", id)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const allPosts = snap.docs[0].data().circle_posts || [];
      const existingSet = new Set(postIds.value);
      // find posts not already in postIds
      const additions = allPosts.filter(pid => !existingSet.has(pid));
      if (additions.length) {
        // add newest first
        additions.reverse().forEach(pid => {
          postIds.value.unshift(pid);
        });
      }
    }
  }
  
  onMounted(() => {
    fetchPostsForCircle(props.circleId);
    intervalId = setInterval(() => {
      checkForNewPosts(props.circleId);
    }, 15000);
  });
  
  watch(
    () => props.circleId,
    (newId) => {
      fetchPostsForCircle(newId);
      // reset the interval so we continue checking for the new circle
      clearInterval(intervalId);
      intervalId = setInterval(() => {
        checkForNewPosts(newId);
      }, 15000);
    }
  );
  
  onUnmounted(() => {
    clearInterval(intervalId);
  });
  </script>
  
  <style scoped>
  .post-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  </style>
  