<template>
    <div class="feed-container">
      <div v-if="loading">Loading your circles…</div>
      <div v-else>
        <select id="circle-select" v-model="selectedCircle">
          <option disabled value="">-- Select a गफ circle --</option>
          <option
            v-for="circle in circlesList"
            :key="circle.id"
            :value="circle.id"
          >
            {{ circle.name }}
          </option>
        </select>
  
       
  
        <CreatePost
          v-if="selectedCircle"
          :circleId="selectedCircle"
        />
  
        <PostList
          v-if="selectedCircle"
          :key="selectedCircle"
          :circleId="selectedCircle"
        />
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, defineAsyncComponent } from "vue";
  import db, { auth } from "@/firebase/init.js";
  import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs
  } from "firebase/firestore";
  
  const CreatePost = defineAsyncComponent(() =>
    import("@/components/CreatePost.vue")
  );
  const PostList = defineAsyncComponent(() =>
    import("@/components/PostList.vue")
  );
  
  const loading = ref(true);
  const circlesList = ref([]);
  const selectedCircle = ref("");
  
  onMounted(async () => {
    const user = auth.currentUser;
    if (!user) {
      loading.value = false;
      return;
    }
  
    const userSnap = await getDoc(doc(db, "users", user.uid));
    const userCircles = userSnap.exists()
      ? userSnap.data().user_circles || []
      : [];
  
    if (userCircles.length) {
      const q = query(
        collection(db, "circles"),
        where("circle_id", "in", userCircles)
      );
      const snap = await getDocs(q);
      circlesList.value = snap.docs.map((d) => ({
        id: d.data().circle_id,
        name: d.data().circle_name
      }));
    }
  
    loading.value = false;
  });
  </script>
  
  <style scoped>
  .feed-container {
    /* fixed width centered */
    width: 600px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    padding: 1rem;
    box-sizing: border-box;
  }
  
  select {
    /* center dropdown and set width */
    width: 450px;
    margin: 1rem auto 1em;
    padding: 0.4em;
  
    /* center the placeholder text */
    text-align: center;
    /* for some browsers to center the selected option as well */
    text-align-last: center;
  }
  
  /* ensure CreatePost & PostList fill that fixed width */
  .create-post,
  .post-list {
    width: 100%;
  }
  </style>
  