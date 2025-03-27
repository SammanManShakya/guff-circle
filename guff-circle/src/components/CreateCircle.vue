<template>
    <div class="create-circle-container">
      <div class="form-content">
        <h2>Create गफ Circle</h2>
  
        <label for="circle-name">Circle Name</label>
        <input
          type="text"
          id="circle-name"
          v-model="circleName"
          placeholder="Enter circle name"
        />
  
        <h3>Your Following</h3>
        <div v-if="followingUsers.length">
          <div
            v-for="user in followingUsers"
            :key="user.user_id"
            class="checkbox-item"
          >
            <input
              type="checkbox"
              :id="`checkbox-${user.user_id}`"
              :value="user.user_id"
              v-model="selectedUserIds"
            />
            <label :for="`checkbox-${user.user_id}`" class="search-wrapper">
              <SearchItem :userId="user.user_id">
                <template #profile-pic>
                  <img
                    :src="getPictureSource(user.profilePicture)"
                    alt="Profile Picture"
                    class="profile-img"
                  />
                </template>
                <template #username>
                  {{ user.username || 'Unnamed User' }}
                </template>
              </SearchItem>
            </label>
          </div>
        </div>
        <div v-else>
          <p>You are not following anyone.</p>
        </div>
  
        <div class="button-group">
          <button @click="saveCircle" class="save-circle-button">
            Create Circle
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import db from "../firebase/init.js";
  import {
    doc,
    getDoc,
    collection,
    getDocs,
    addDoc,
    updateDoc,
  } from "firebase/firestore";
  import SearchItem from "./SearchItem.vue";
  
  export default {
    name: "CreateCircle",
    components: {
      SearchItem,
    },
    data() {
      return {
        circleName: "",
        followingUsers: [],
        selectedUserIds: [],
        currentUserId: null,
      };
    },
    created() {
      this.currentUserId = this.$route.params.currentUserId;
  
      if (!this.currentUserId) {
        console.error("❌ No currentUserId found in route params.");
        this.$router.push("/profile");
        return;
      }
  
      const userDocRef = doc(db, "users", this.currentUserId);
      getDoc(userDocRef)
        .then((docSnap) => {
          if (!docSnap.exists()) {
            console.error("❌ User document not found.");
            return;
          }
  
          const data = docSnap.data();
          const followingList = data.following || [];
  
          return Promise.all(
            followingList.map((userId) => {
              const followedUserRef = doc(db, "users", userId);
              return getDoc(followedUserRef).then((snap) => {
                if (snap.exists()) {
                  const userData = snap.data();
                  return {
                    user_id: snap.id,
                    username: userData.username || "Unnamed User",
                    profilePicture: userData.profilePicture || "",
                  };
                } else {
                  return null;
                }
              });
            })
          );
        })
        .then((users) => {
          if (users) {
            this.followingUsers = users.filter((user) => user !== null);
          }
        })
        .catch((error) => {
          console.error("❌ Error fetching following users:", error);
        });
    },
    methods: {
      getPictureSource(profilePicture) {
        if (!profilePicture) {
          return "https://via.placeholder.com/48";
        }
        if (
          profilePicture.startsWith("http") ||
          profilePicture.startsWith("data:")
        ) {
          return profilePicture;
        }
        return "data:image/png;base64," + profilePicture;
      },
      async saveCircle() {
        if (!this.circleName.trim()) {
          alert("Please enter a circle name.");
          return;
        }
  
        const circleMembers = [this.currentUserId, ...this.selectedUserIds];
  
        try {
          const circlesCollection = collection(db, "circles");
          const snapshot = await getDocs(circlesCollection);
          const newCircleId = snapshot.size + 1;
  
          const newCircle = {
            circle_id: newCircleId,
            circle_name: this.circleName,
            circle_members: circleMembers,
            circle_posts: [],
          };
  
          await addDoc(circlesCollection, newCircle);
          console.log("✅ Circle created successfully:", newCircle);
  
          const updates = circleMembers.map(async (userId) => {
            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const data = userSnap.data();
              const currentCircles = Array.isArray(data.user_circles)
                ? data.user_circles
                : [];
              const updatedCircles = currentCircles.includes(newCircleId)
                ? currentCircles
                : [...currentCircles, newCircleId];
              await updateDoc(userRef, { user_circles: updatedCircles });
              console.log(`✅ Updated user ${userId}'s circles.`);
            }
          });
  
          await Promise.all(updates);
  
          // Reset and redirect
          this.circleName = "";
          this.selectedUserIds = [];
          this.$router.push("/profile");
        } catch (error) {
          console.error("❌ Error creating circle or updating users:", error);
        }
      },
    },
  };
  </script>
  
  <style scoped>
  .create-circle-container {
    padding: 40px 20px;
    max-width: 700px;
    margin: 0 auto;
  }
  
  .form-content {
    background-color: white;
    padding: 24px;
    border-radius: 8px;
    border: 1px solid #ddd;
  }
  
  .form-content h2 {
    margin-top: 0;
    color: #734f96;
  }
  
  .form-content label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }
  
  .form-content input[type="text"] {
    width: 100%;
    padding: 8px;
    margin-bottom: 20px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  
  .form-content h3 {
    color: #734f96;
    margin-bottom: 10px;
  }
  
  .profile-img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    margin-right: 10px;
  }
  
  .checkbox-item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
  }
  
  .checkbox-item input[type="checkbox"] {
    margin-right: 10px;
  }
  
  .search-wrapper {
    flex-grow: 1;
    cursor: pointer;
  }
  
  .button-group {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }
  
  .save-circle-button {
    padding: 8px 16px;
    background-color: #734f96;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .save-circle-button:hover {
    background-color: #5b3e7a;
  }
  </style>
  