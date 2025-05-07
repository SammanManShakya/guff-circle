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
              <img
                v-if="isImage(msg.content)"
                :src="msg.content"
                alt="Sent image"
                class="chat-image"
              />
              <span v-else>{{ msg.content }}</span>
            </div>
          </div>
        </div>

        <!-- Image preview above the input -->
        <div v-if="pendingImage" class="pending-image">
          <button class="remove-image" @click="removeImage">×</button>
          <img :src="pendingImage" class="pending-img-preview" />
        </div>

        <!-- Message input area -->
        <div class="message-input">
          <label for="file-input" class="camera-button" title="Attach image">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20" height="20"
              fill="currentColor"
              class="bi bi-camera"
              viewBox="0 0 16 16"
            >
              <path
                d="M9.5 2h-3l-.447 1.342A.5.5 0 0 1 6 
                   3.5H4a.5.5 0 0 0-.492.41L3 5H1.5A1.5 
                   1.5 0 0 0 0 6.5v7A1.5 1.5 0 0 0 1.5 15h13
                   a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 
                   0 0 14.5 5H13l-.508-1.59A.5.5 0 0 
                   0 12 3.5z"
              />
              <path
                d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 
                   6zm0-1a2 2 0 1 0 0-4 2 2 0 0 0 
                   0 4z"
              />
            </svg>
          </label>
          <input
            id="file-input"
            type="file"
            accept="image/*"
            @change="onFileSelected"
            class="file-input"
          />

          <input
            type="text"
            v-model="newMessage"
            placeholder="Type a message..."
            :disabled="!!pendingImage"
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
  arrayUnion,
  onSnapshot
} from "firebase/firestore";

export default {
  name: "Chat",
  data() {
    return {
      followersList: [],
      profiles: {},
      currentChatId: null,
      newMessage: "",
      pendingImage: null,
      messagesList: [],
      unsubscribeChat: null
    };
  },
  computed: {
    currentUid() {
      return auth.currentUser?.uid || null;
    }
  },
  async mounted() {
    await this.loadFollowers();
  },
  beforeUnmount() {
    if (this.unsubscribeChat) this.unsubscribeChat();
  },
  watch: {
    currentChatId(newId) {
      if (this.unsubscribeChat) {
        this.unsubscribeChat();
        this.unsubscribeChat = null;
      }
      if (newId) {
        this.subscribeToMessages(newId);
      } else {
        this.messagesList = [];
      }
    }
  },
  methods: {
    async loadFollowers() {
      const user = auth.currentUser;
      if (!user) return;

      const selfSnap = await getDoc(doc(db, "users", user.uid));
      if (!selfSnap.exists()) return;

      this.profiles[user.uid] = selfSnap.data().profilePicture;
      const followers = selfSnap.data().followers || [];
      const snaps = await Promise.all(
        followers.map((id) => getDoc(doc(db, "users", id)))
      );

      this.followersList = snaps
        .filter((snap) => snap.exists())
        .map((snap) => {
          this.profiles[snap.id] = snap.data().profilePicture;
          return {
            id: snap.id,
            username: snap.data().username,
            profilePicture: snap.data().profilePicture
          };
        });
    },

    async startChat(follower) {
      const user = auth.currentUser;
      if (!user) return;

      const meSnap = await getDoc(doc(db, "users", user.uid));
      const existing = meSnap.exists() ? meSnap.data().chats || [] : [];

      for (const cid of existing) {
        const snap = await getDoc(doc(db, "chats", cid));
        if (snap.exists()) {
          const mem = snap.data().members || [];
          if (mem.includes(user.uid) && mem.includes(follower.id)) {
            this.currentChatId = cid;
            return;
          }
        }
      }

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
    },

    subscribeToMessages(chatId) {
      const chatRef = doc(db, "chats", chatId);
      this.unsubscribeChat = onSnapshot(chatRef, (snap) => {
        if (!snap.exists()) {
          this.messagesList = [];
          return;
        }
        const msgs = snap.data().messages || [];
        this.messagesList = msgs.map((j) => {
          const [sender, content, timestamp] = JSON.parse(j);
          return { sender, content, timestamp };
        });
      });
    },

    onFileSelected(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        this.pendingImage = reader.result;
      };
      reader.readAsDataURL(file);
      e.target.value = null;
    },

    removeImage() {
      this.pendingImage = null;
    },

    async sendMessage() {
      if (!this.currentChatId) return;
      const uid = auth.currentUser.uid;
      const ts = new Date().toISOString();

      let content = null;
      if (this.pendingImage) {
        content = this.pendingImage;
      } else if (this.newMessage.trim()) {
        content = this.newMessage.trim();
      } else {
        return;
      }

      const payload = JSON.stringify([uid, content, ts]);
      await updateDoc(doc(db, "chats", this.currentChatId), {
        messages: arrayUnion(payload)
      });

      this.newMessage = "";
      this.pendingImage = null;
    },

    isImage(content) {
      return typeof content === "string" && content.startsWith("data:");
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
  flex: 0 0 250px;
  padding: 1rem;
  border-right: 1px solid #ccc;
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
  font-weight: bold;
  color: #333;
}
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.no-chat {
  margin: auto;
  color: #666;
}
.chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.messages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 0;
}
.message-row {
  display: flex;
  align-items: flex-end;
  padding: 0 2rem;
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
  margin-right: 0.5rem;
}
.message-row.own .msg-profile-pic {
  margin-left: 0.5rem;
  margin-right: 0;
}

.message-bubble {
  max-width: 70%;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  background: #f1f1f1;
  overflow: hidden;
}
.message-bubble.own {
  background: #d1e7dd;
  margin-left: auto;
}

/* image inside bubble */
.chat-image {
  max-width: 100%;
  max-height: 200px;
  display: block;
  border-radius: 8px;
}

/* pending-image preview */
.pending-image {
  display: flex;
  align-items: center;
  padding: 0.5rem 2rem;
}
.pending-img-preview {
  max-width: 60px;
  max-height: 60px;
  border-radius: 4px;
}
.remove-image {
  margin-right: 0.5rem;
  background: rgba(0,0,0,0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 1.2rem;
  height: 1.2rem;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
}

.message-input {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
}
.message-input input[type="text"] {
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

/* camera button */
.camera-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
}
.file-input {
  display: none;
}
</style>
