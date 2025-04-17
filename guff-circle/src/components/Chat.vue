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
        <div v-if="!currentChatId" class="no-chat">
          <p>Select a follower to start a chat.</p>
        </div>
        <div v-else class="chat-window">
          <!-- Messages list -->
          <div class="messages">
            <div
              v-for="(msg, idx) in messagesList"
              :key="idx"
              class="message-row"
              :class="{ own: msg.sender === currentUid }"
              :title="formatTimestamp(msg.timestamp)"
            >
              <img
                v-if="profiles[msg.sender]"
                :src="profiles[msg.sender]"
                alt="User pic"
                class="msg-profile-pic"
              />
              <div
                class="message-bubble"
                :class="{ own: msg.sender === currentUid }"
              >
                {{ msg.content }}
              </div>
            </div>
          </div>
  
          <!-- Message input area -->
          <div class="message-input">
            <input
              type="text"
              v-model="newMessage"
              placeholder="Type a message..."
              @keyup.enter="sendMessage"
            />
            <button @click="sendMessage">Send</button>
          </div>
        </div>
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
        followersList: [],
        profiles: {},
        currentChatId: null,
        newMessage: "",
        messagesList: []
      };
    },
    computed: {
      currentUid() {
        return auth.currentUser ? auth.currentUser.uid : null;
      }
    },
    async mounted() {
      await this.loadFollowers();
    },
    methods: {
      async loadFollowers() {
        try {
          const user = auth.currentUser;
          if (!user) return;
          // Load current user profile picture
          const selfSnap = await getDoc(doc(db, "users", user.uid));
          if (selfSnap.exists()) {
            this.profiles[user.uid] = selfSnap.data().profilePicture;
          }
          const followers = selfSnap.exists() ? selfSnap.data().followers || [] : [];
          // Load follower details
          const snaps = await Promise.all(
            followers.map((id) => getDoc(doc(db, "users", id)))
          );
          this.followersList = snaps
            .filter((snap) => snap.exists())
            .map((snap) => {
              const data = snap.data();
              this.profiles[snap.id] = data.profilePicture;
              return {
                id: snap.id,
                username: data.username,
                profilePicture: data.profilePicture
              };
            });
        } catch (err) {
          console.error("Error loading followers:", err);
        }
      },
  
      async startChat(follower) {
        try {
          const user = auth.currentUser;
          if (!user) return;
          // find existing chat or create new
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const existing = userDoc.exists() ? userDoc.data().chats || [] : [];
          for (const cId of existing) {
            const snap = await getDoc(doc(db, "chats", cId));
            if (snap.exists()) {
              const mem = snap.data().members || [];
              if (mem.includes(follower.id) && mem.includes(user.uid)) {
                this.currentChatId = cId;
                await this.loadMessages();
                return;
              }
            }
          }
          // create new chat
          const chatRef = await addDoc(collection(db, "chats"), {
            members: [user.uid, follower.id],
            messages: []
          });
          this.currentChatId = chatRef.id;
          await Promise.all(
            [user.uid, follower.id].map((uid) =>
              updateDoc(doc(db, "users", uid), {
                chats: arrayUnion(chatRef.id)
              })
            )
          );
          this.messagesList = [];
        } catch (err) {
          console.error("Error starting chat:", err);
        }
      },
  
      async loadMessages() {
        if (!this.currentChatId) return;
        try {
          const chatSnap = await getDoc(doc(db, "chats", this.currentChatId));
          if (!chatSnap.exists()) {
            this.messagesList = [];
            return;
          }
          const msgs = chatSnap.data().messages || [];
          this.messagesList = msgs.map((j) => {
            const [sender, content, timestamp] = JSON.parse(j);
            return { sender, content, timestamp };
          });
        } catch (err) {
          console.error("Error loading messages:", err);
        }
      },
  
      async sendMessage() {
        if (!this.currentChatId || !this.newMessage.trim()) return;
        try {
          const uid = auth.currentUser.uid;
          const ts = new Date().toISOString();
          const arr = [uid, this.newMessage.trim(), ts];
          const json = JSON.stringify(arr);
          await updateDoc(doc(db, "chats", this.currentChatId), {
            messages: arrayUnion(json)
          });
          this.newMessage = "";
          await this.loadMessages();
        } catch (err) {
          console.error("Error sending message:", err);
        }
      },
  
      formatTimestamp(ts) {
        return new Date(ts).toLocaleString();
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
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }
  .no-chat {
    margin: auto;
    color: #666;
  }
  .chat-window {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .messages {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem 2rem; /* vertical and horizontal padding */
  }
  /*. message row holds bubble and pic */
  .message-row {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    width: 100%;
    justify-content: flex-start;
  }
  .message-row.own {
    justify-content: flex-end;
    flex-direction: row-reverse;
  }
  .msg-profile-pic {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    object-fit: cover;
  }
  .message-bubble {
    max-width: 70%;
    padding: 0.5rem 1rem;
    border-radius: 12px;
    background: #f1f1f1;
    margin-left: 2rem;
    margin-right: auto;
  }
  .message-bubble.own {
    background: #d1e7dd;
    margin-left: auto;
    margin-right: 2rem;
  }
  .message-input {
    display: flex;
    gap: 0.5rem;
    padding: 0.5rem 0;
  }
  .message-input input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  .message-input button {
    padding: 0.5rem 1rem;
    border: none;
    background-color: #734f96;
    color: white;
    border-radius: 4px;
    cursor: pointer;
  }
  .message-input button:hover {
    background-color: #5a3b6d;
  }
  </style>
  