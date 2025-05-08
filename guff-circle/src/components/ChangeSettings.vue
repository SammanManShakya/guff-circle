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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16" height="16"
            fill="currentColor"
            class="bi bi-camera"
            viewBox="0 0 16 16"
          >
            <path
              d="M9.5 2h-3l-.447 1.342A.5.5 0 0 1 6 3.5H4
                 a.5.5 0 0 0-.492.41L3 5H1.5A1.5 1.5 0 0 0 0 
                 6.5v7A1.5 1.5 0 0 0 1.5 15h13
                 a1.5 1.5 0 0 0 1.5-1.5v-7
                 A1.5 1.5 0 0 0 14.5 5H13
                 l-.508-1.59A.5.5 0 0 0 12 3.5z"
            />
            <path
              d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0-1
                 a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"
            />
          </svg>
        </label>
        <input
          id="file-input"
          type="file"
          accept="image/*"
          @change="onFileChange"
          class="file-input"
        />
        <div v-if="imgChanged" class="image-preview-wrapper">
          <button class="remove-btn" @click="removeImage">×</button>
          <img :src="imgContent" alt="Preview" class="image-preview" />
        </div>
      </section>
  
      <!-- Change Password (only for users who didnt use google auth) -->
      <section class="section" v-if="!isGoogleUser">
        <label for="current-password">Current Password</label>
        <input
          id="current-password"
          v-model="currentPassword"
          type="password"
          placeholder="Current password"
          class="text-input"
        />
        <p v-if="wrongCurrent" class="error-text">
          Current password incorrect
        </p>
  
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
  
      <!-- Buttons -->
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
  import {
    updatePassword,
    updateProfile,
    reauthenticateWithCredential,
    EmailAuthProvider
  } from "firebase/auth";
  
  const router = useRouter();
  
  const username        = ref("");
  const originalUsername= ref("");
  const imgContent      = ref("");
  const imgChanged      = ref(false);
  
  const currentPassword = ref("");
  const newPassword     = ref("");
  const confirmPassword = ref("");
  const wrongCurrent    = ref(false);
  
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
  });
  
  // image to base64
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
    imgChanged.value = false;
  }
  
  // guards
  const usernameChanged = computed(() =>
    username.value.trim() !== "" &&
    username.value.trim() !== originalUsername.value.trim()
  );
  const canChangePassword = computed(() =>
    !isGoogleUser.value &&
    currentPassword.value.length > 0 &&
    newPassword.value.length >= 6 &&
    newPassword.value === confirmPassword.value
  );
  const isDirty = computed(() =>
    usernameChanged.value ||
    imgChanged.value ||
    canChangePassword.value
  );
  
  // update only the username field in Firestore (wont reset user account anymore)
  async function applyUsername() {
    const user = auth.currentUser;
    const uRef = doc(db, "users", user.uid);
    await updateDoc(uRef, { username: username.value.trim() });
    // update name
    await updateProfile(user, { displayName: username.value.trim() });
    originalUsername.value = username.value.trim();
  }
  
  async function applyProfilePic() {
    const user = auth.currentUser;
    const uRef = doc(db, "users", user.uid);
    await updateDoc(uRef, { profilePicture: imgContent.value });
    imgChanged.value = false;
  }
  
  async function applyPassword() {
    const user = auth.currentUser;
    // reauthenticate
    const cred = EmailAuthProvider.credential(
      user.email,
      currentPassword.value
    );
    try {
      wrongCurrent.value = false;
      await reauthenticateWithCredential(user, cred);
    } catch {
      wrongCurrent.value = true;
      return;  
    }
    // update
    await updatePassword(user, newPassword.value);
    currentPassword.value = "";
    newPassword.value     = "";
    confirmPassword.value = "";
  }
  
  // Save & redirect
  async function saveChanges() {
    if (usernameChanged.value)   await applyUsername();
    if (imgChanged.value)        await applyProfilePic();
    if (canChangePassword.value) {
      await applyPassword();
      if (wrongCurrent.value) return;
    }
    router.push({ name: "Profile" });
  }
  
  // Cancel & redirect
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
    margin: 0;
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
  .error-text {
    color: red;
    font-size: 0.9rem;
    margin: 0;
  }
  .camera-button {
    width: 2rem;
    height: 2rem;
    color: white;
    background: #734f96;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.25rem;
    cursor: pointer;
  }
  .camera-button svg {
    color: white;
  }
  .file-input {
    display: none;
  }
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
  