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
  import { collection, query, where, onSnapshot } from "firebase/firestore";
  import PostView from "@/components/PostView.vue";
  
  const props = defineProps({
    circleId: {
      type: [String, Number],
      required: true
    }
  });
  
  const postIds = ref([]);
  const loading = ref(true);
  let unsubscribe = null;
  
  function subscribeToCircle(id) {
    loading.value = true;
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    if (!id) {
      postIds.value = [];
      loading.value = false;
      return;
    }
    const q = query(
      collection(db, "circles"),
      where("circle_id", "==", id)
    );
    unsubscribe = onSnapshot(q, snap => {
      if (!snap.empty) {
        const posts = snap.docs[0].data().circle_posts || [];
        // newest first:
        postIds.value = posts.slice().reverse();
      } else {
        postIds.value = [];
      }
      loading.value = false;
    });
  }
  
  onMounted(() => {
    subscribeToCircle(props.circleId);
  });
  
  watch(
    () => props.circleId,
    newId => {
      subscribeToCircle(newId);
    }
  );
  
  onUnmounted(() => {
    if (unsubscribe) unsubscribe();
  });
  </script>
  
  <style scoped>
  .post-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  </style>
  