<template>
    <div class="settings-container">
      <h2>Account Settings</h2>
  
      <!-- Change Username -->
      <section class="section">
        <label for="username-input">Username</label>
        <input
          id="username-input"
          v-model="username"
          type="text"
          placeholder="Enter new username"
          class="text-input"
        />
      </section>
  
      <!-- Change Profile Picture -->
      <section class="section">
        <label>Profile Picture</label>
        <label for="file-input" class="camera-button">
          <!-- same camera icon -->
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
            <path fill="white" d="M15 12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1.172a3 3 0 0 0 2.12-.879l.83-.828A1 1 0 0 1 6.827 3h2.344a1 1 0 0 1 .707.293l.828.828A3 3 0 0 0 12.828 5H14a1 1 0 0 1 1 1z"/>
            <path fill="white" d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4z"/>
            <path fill="white" d="M8 11a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5m0 1a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/>
          </svg>
        </label>
        <input
          id="file-input"
          type="file"
          accept="image/*"
          @change="onFileChange"
          ref="fileInput"
          class="file-input"
        />
        <div v-if="imgContent" class="image-preview-wrapper">
          <button class="remove-btn" @click="removeImage">×</button>
          <img :src="imgContent" alt="Preview" class="image-preview" />
        </div>
      </section>
  
      <!-- Change Password (hidden for Google users) -->
      <section class="section" v-if="!isGoogleUser">
        <label for="new-password">New Password</label>
        <input
          id="new-password"
          v-model="newPassword"
          type="password"
          placeholder="New password"
          class="text-input"
        />
        <label for="confirm-password">Confirm New Password</label>
        <input
          id="confirm-password"
          v-model="confirmPassword"
          type="password"
          placeholder="Confirm password"
          class="text-input"
        />
      </section>
  
      <!-- Action Buttons -->
      <div class="buttons">
        <button
          :disabled="!isDirty"
          @click="saveChanges"
          class="save-button"
        >
          Save Changes
        </button>
        <button @click="cancel" class="cancel-button">
          Cancel
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from "vue";
  import { useRouter } from "vue-router";
  import { auth } from "@/firebase/init.js";
  import db from "@/firebase/init.js";
  import { doc, getDoc, updateDoc } from "firebase/firestore";
  import { updatePassword, updateProfile } from "firebase/auth";
  
  const router = useRouter();
  
  const username        = ref("");
  const originalUsername = ref("");
  const imgContent      = ref("");
  const imgChanged      = ref(false);
  const newPassword     = ref("");
  const confirmPassword = ref("");
  
  // detect Google sign-in
  const isGoogleUser = computed(() =>
    auth.currentUser?.providerData?.some(p => p.providerId === "google.com")
  );
  
  // load current user data
  onMounted(async () => {
    const user = auth.currentUser;
    if (!user) return;
  
    const uRef = doc(db, "users", user.uid);
    const snap = await getDoc(uRef);
    if (!snap.exists()) return;
    const data = snap.data();
  
    username.value         = data.username || "";
    originalUsername.value = username.value;
    imgContent.value       = data.profilePicture || "";
  });
  
  // file → base64
  function onFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      imgContent.value = reader.result;
      imgChanged.value = true;
    };
    reader.readAsDataURL(file);
  }
  
  // remove preview
  function removeImage() {
    imgContent.value = "";
    imgChanged.value = true;
  }
  
  // guards
  const usernameChanged = computed(() =>
    username.value.trim() !== "" &&
    username.value.trim() !== originalUsername.value.trim()
  );
  const canChangePassword = computed(() =>
    !isGoogleUser.value &&
    newPassword.value.length >= 6 &&
    newPassword.value === confirmPassword.value
  );
  const isDirty = computed(() =>
    usernameChanged.value ||
    imgChanged.value ||
    canChangePassword.value
  );
  
  // Firestore updates
  async function applyUsername() {
    const user = auth.currentUser;
    // 1) Firestore:
    const uRef = doc(db, "users", user.uid);
    await updateDoc(uRef, { username: username.value.trim() });
    originalUsername.value = username.value.trim();
    // 2) Auth profile for displayName:
    await updateProfile(user, { displayName: username.value.trim() });
  }
  
  async function applyProfilePic() {
    const user = auth.currentUser;
    const uRef = doc(db, "users", user.uid);
    await updateDoc(uRef, { profilePicture: imgContent.value || "" });
    imgChanged.value = false;
  }
  
  async function applyPassword() {
    const user = auth.currentUser;
    await updatePassword(user, newPassword.value);
    newPassword.value = "";
    confirmPassword.value = "";
  }
  
  // Save & redirect
  async function saveChanges() {
    if (usernameChanged.value)   await applyUsername();
    if (imgChanged.value)        await applyProfilePic();
    if (canChangePassword.value) await applyPassword();
    router.push({ name: "Profile" });
  }
  
  // Cancel → redirect without saving
  function cancel() {
    router.push({ name: "Profile" });
  }
  </script>
  
  <style scoped>
  .settings-container {
    max-width: 600px;
    margin: 2rem auto;
    padding: 1.5rem;
    border: 1px solid #ccc;
    border-radius: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  h2 {
    text-align: center;
  }
  .section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .text-input {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  .camera-button {
    width: 2rem;
    height: 2rem;
    background: #734f96;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.25rem;
    cursor: pointer;
  }
  .camera-button svg {
    width: 1rem; height: 1rem;
  }
  .file-input {
    display: none;
  }
  .image-preview-wrapper {
    position: relative;
    width: 150px; height: 150px;
  }
  .image-preview {
    width: 100%; height: 100%;
    object-fit: cover; border-radius: 0.25rem;
  }
  .remove-btn {
    position: absolute; top: 4px; right: 4px;
    background: rgba(0,0,0,0.5); color: white;
    border: none; border-radius: 50%;
    width: 1.5rem; height: 1.5rem;
    cursor: pointer; display: flex;
    align-items: center; justify-content: center;
  }
  .buttons {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }
  .save-button {
    padding: 0.75rem 1.5rem;
    background-color: #734f96;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .save-button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .cancel-button {
    padding: 0.75rem 1.5rem;
    background: none;
    color: #734f96;
    border: 1px solid #734f96;
    border-radius: 4px;
    cursor: pointer;
  }
  .cancel-button:hover {
    background: #f5f0fa;
  }
  </style>
  