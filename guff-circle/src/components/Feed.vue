<template>
    <div>
      <h1>Feed</h1>
      <div v-if="loading">
        Loading your circles…
      </div>
      <div v-else>
        <label for="circle-select">Choose a circle:</label>
        <select id="circle-select" v-model="selectedCircle">
          <option disabled value="">-- Select a circle --</option>
          <option v-for="circle in circlesList" :key="circle.id" :value="circle.id">
            {{ circle.name }}
          </option>
        </select>
        <p v-if="selectedCircle">
          Selected circle_id: {{ selectedCircle }}
        </p>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from "vue";
  import db, { auth } from "@/firebase/init.js";
  import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
  
  export default {
    name: "Feed",
    setup() {
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
        const userCircles = userSnap.exists() ? userSnap.data().user_circles || [] : [];
        if (userCircles.length) {
          const q = query(
            collection(db, "circles"),
            where("circle_id", "in", userCircles)
          );
          const snap = await getDocs(q);
          circlesList.value = snap.docs.map(d => ({
            id: d.data().circle_id,
            name: d.data().circle_name
          }));
        }
        loading.value = false;
      });
  
      return { loading, circlesList, selectedCircle };
    }
  };
  </script>
  
  <style scoped>
  label {
    display: block;
    margin-bottom: 0.5em;
  }
  
  select {
    margin-bottom: 1em;
    padding: 0.4em;
  }
  </style>
  