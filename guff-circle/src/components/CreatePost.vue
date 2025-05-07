<template>
  <div class="create-post">
    <textarea
      v-model="textContent"
      placeholder="What's on your mind?"
      class="post-textarea"
    ></textarea>

    <input
      id="file-input"
      type="file"
      accept="image/*"
      @change="onImageChange"
      ref="fileInput"
      class="post-file-input"
    />

    <div v-if="imgContent" class="image-preview-wrapper">
      <button class="remove-btn" @click="removeImage">×</button>
      <img :src="imgContent" alt="Preview" class="image-preview" />
    </div>

    <div class="controls">
      <label for="file-input" class="camera-button">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
          <path
            fill="white"
            d="M15 12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1.172a3 3 0 0 0 2.12-.879l.83-.828A1 1 0 0 1 6.827 3h2.344a1 1 0 0 1 .707.293l.828.828A3 3 0 0 0 12.828 5H14a1 1 0 0 1 1 1z"
          />
          <path
            fill="white"
            d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4z"
          />
          <path
            fill="white"
            d="M8 11a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5m0 1a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"
          />
        </svg>
      </label>
      <button
        :disabled="!canPost"
        @click="submitPost"
        class="post-button"
      >
        Post
      </button>
    </div>
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

const canPost = computed(
  () => textContent.value.trim() !== "" || imgFile.value !== null
);

function onImageChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  imgFile.value = file;
  const reader = new FileReader();
  reader.onload = () => {
    imgContent.value = reader.result;
  };
  reader.readAsDataURL(file);
}

function removeImage() {
  imgFile.value = null;
  imgContent.value = "";
}

async function submitPost() {
  const userId = auth.currentUser.uid;
  const postData = {
    circle_id: props.circleId,
    comments: [],
    img_content: imgContent.value || "",
    likes: [],
    text_content: textContent.value,
    time_data: serverTimestamp(),
    user_id: userId
  };

  const postRef = await addDoc(collection(db, "posts"), postData);

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

  await updateDoc(
    doc(db, "users", userId),
    { posts: arrayUnion(postRef.id) }
  );

  textContent.value = "";
  removeImage();
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

/* hide the native file input */
.post-file-input {
  display: none;
}

/* image preview (if any) */
.image-preview-wrapper {
  position: relative;
  width: 150px;
  height: 150px;
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.25rem;
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* controls row: camera + post button */
.controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* camera icon */
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

.camera-button svg {
  width: 1rem;
  height: 1rem;
}

/* Post button stays on same row, vertically centered */
.post-button {
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
