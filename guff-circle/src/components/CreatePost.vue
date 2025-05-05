<template>
  <div class="create-post">
    <textarea
      v-model="textContent"
      placeholder="What's on your mind?"
      class="post-textarea"
    ></textarea>

    <label for="file-input" class="camera-button">
      <!-- camera svg -->
    </label>
    <input
      id="file-input"
      type="file"
      accept="image/*"
      @change="onImageChange"
      ref="fileInput"
      class="post-file-input"
    />

    <div v-if="imgContent" class="image-preview">
      <img :src="imgContent" alt="Preview" />
    </div>

    <button
      :disabled="!canPost"
      @click="submitPost"
      class="post-button"
    >
      Post
    </button>
  </div>
</template>

<script setup>
import { ref, computed, defineProps } from "vue";
import db, { auth } from "@/firebase/init.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
  query,
  where,
  getDocs
} from "firebase/firestore";

const props = defineProps({
  circleId: {
    type: [String, Number],
    required: true
  }
});

const textContent = ref("");
const imgFile = ref(null);
const imgContent = ref("");

const canPost = computed(() => textContent.value.trim() !== "" || imgFile.value !== null);

function onImageChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  imgFile.value = file;
  const reader = new FileReader();
  reader.onload = () => { imgContent.value = reader.result; };
  reader.readAsDataURL(file);
}

async function submitPost() {
  const postRef = await addDoc(collection(db, "posts"), {
    circle_id: props.circleId,
    text: textContent.value,
    created_at: serverTimestamp(),
    author_id: auth.currentUser.uid
  });

  const circlesQuery = query(
    collection(db, "circles"),
    where("circle_id", "==", props.circleId)
  );
  const circlesSnap = await getDocs(circlesQuery);
  for (const circleDoc of circlesSnap.docs) {
    await updateDoc(
      doc(db, "circles", circleDoc.id),
      { circle_posts: arrayUnion(postRef.id) }
    );
  }

  textContent.value = "";
  imgFile.value = null;
  imgContent.value = "";
}
</script>

<style scoped>
.create-post {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.post-textarea {
  width: 100%;
  height: 100px;
  padding: 0.5rem;
  resize: vertical;
}
.camera-button {
  width: 2rem;
  height: 2rem;
  background: #007bff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  cursor: pointer;
}
.post-file-input {
  display: none;
}
.image-preview img {
  max-width: 100%;
  border-radius: 0.25rem;
}
.post-button {
  align-self: flex-end;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
}
.post-button:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>
