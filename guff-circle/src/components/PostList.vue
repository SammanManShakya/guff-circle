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
  import { ref, watch, onMounted, defineProps } from "vue";
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
  
  async function fetchPostsForCircle(id) {
    loading.value = true;
    postIds.value = [];
    if (!id) {
      loading.value = false;
      return;
    }
    // query the circles collection by the circle_id field
    const q = query(
      collection(db, "circles"),
      where("circle_id", "==", id)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      // assume one document per circle_id
      postIds.value = snap.docs[0].data().circle_posts || [];
    }
    loading.value = false;
  }
  
  onMounted(() => {
    fetchPostsForCircle(props.circleId);
  });
  
  watch(
    () => props.circleId,
    newId => {
      fetchPostsForCircle(newId);
    }
  );
  </script>
  
  <style scoped>
  .post-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  </style>
  