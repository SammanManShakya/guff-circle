<template>
    <div class="chat-container">
      <aside class="chat-sidebar">
        <ul class="followers-list">
          <li
            v-for="follower in followersList"
            :key="follower.id"
            class="follower-item"
            @click="startChat(follower)"
          >
            <img
              :src="follower.profilePicture"
              alt="Profile pic"
              class="profile-pic"
            />
            <span class="username">{{ follower.username }}</span>
          </li>
        </ul>
      </aside>
  
      <section class="chat-main">
        <p>Main Chat Area</p>
      </section>
    </div>
  </template>
  
  <script>
  import { auth } from "../firebase/init.js";
  import db from "../firebase/init.js";
  import {
    doc,
    getDoc,
    collection,
    addDoc,
    updateDoc,
    arrayUnion
  } from "firebase/firestore";
  
  export default {
    name: "Chat",
    data() {
      return {
        followersList: []
      };
    },
    async mounted() {
      await this.loadFollowers();
    },
    methods: {
      async loadFollowers() {
        try {
          const currentUser = auth.currentUser;
          if (!currentUser) return;
  
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (!userDoc.exists()) return;
  
          const { followers = [] } = userDoc.data();
          const snaps = await Promise.all(
            followers.map((id) => getDoc(doc(db, "users", id)))
          );
          this.followersList = snaps
            .filter((snap) => snap.exists())
            .map((snap) => ({
              id: snap.id,
              username: snap.data().username,
              profilePicture: snap.data().profilePicture
            }));
        } catch (error) {
          console.error("Error loading followers:", error);
        }
      },
  
      async startChat(follower) {
        try {
          const currentUid = auth.currentUser.uid;
          // Load current user's chat IDs
          const userSnap = await getDoc(doc(db, "users", currentUid));
          const existingChats = userSnap.exists() && userSnap.data().chats ? userSnap.data().chats : [];
  
          // Check existing chats for a chat with this follower
          for (const chatId of existingChats) {
            const chatSnap = await getDoc(doc(db, "chats", chatId));
            if (chatSnap.exists()) {
              const members = chatSnap.data().members || [];
              // if both users are in this chat
              if (members.includes(follower.id) && members.includes(currentUid)) {
                console.log(`Chat already exists: ${chatId}`);
                return; // don't create duplicate
              }
            }
          }
  
          // No existing chat found, create a new one
          const chatRef = await addDoc(collection(db, "chats"), {
            members: [currentUid, follower.id],
            messages: []
          });
          const newChatId = chatRef.id;
  
          // Add new chat ID to both users
          const userIds = [currentUid, follower.id];
          await Promise.all(
            userIds.map((uid) =>
              updateDoc(doc(db, "users", uid), {
                chats: arrayUnion(newChatId)
              })
            )
          );
  
          console.log(`Created new chat ${newChatId} with members`, userIds);
        } catch (error) {
          console.error("Error starting chat:", error);
        }
      }
    }
  };
  </script>
  
  <style scoped>
  .chat-container {
    display: flex;
    width: 100%;
    height: 100%;
  }
  
  .chat-sidebar {
    flex: 0 0 20%;
    max-width: 20%;
    border-right: 1px solid #ccc;
    padding: 1rem;
    box-sizing: border-box;
    overflow-y: auto;
  }
  
  .followers-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  
  .follower-item {
    display: flex;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid #eee;
    cursor: pointer;
  }
  
  .profile-pic {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    margin-right: 0.75rem;
  }
  
  .username {
    font-size: 1rem;
    font-weight: bold;
    color: #333;
  }
  
  .chat-main {
    flex: 0 0 80%;
    max-width: 80%;
    padding: 1rem;
    box-sizing: border-box;
    overflow-y: auto;
  }
  </style>
  