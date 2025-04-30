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
      messagesList: [],
      unsubscribeChat: null
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
      try {
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
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const existingChats = userDoc.exists() ? userDoc.data().chats || [] : [];
        for (const chatId of existingChats) {
          const snap = await getDoc(doc(db, "chats", chatId));
          if (snap.exists()) {
            const members = snap.data().members || [];
            if (members.includes(user.uid) && members.includes(follower.id)) {
              this.currentChatId = chatId;
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
      } catch (err) {
        console.error("Error starting chat:", err);
      }
    },

    subscribeToMessages(chatId) {
      const chatDoc = doc(db, "chats", chatId);
      this.unsubscribeChat = onSnapshot(
        chatDoc,
        (snap) => {
          if (!snap.exists()) {
            this.messagesList = [];
            return;
          }
          const msgs = snap.data().messages || [];
          this.messagesList = msgs.map((j) => {
            const [sender, content, timestamp] = JSON.parse(j);
            return { sender, content, timestamp };
          });
        },
        (err) => {
          console.error("Real-time update error:", err);
        }
      );
    },

    async sendMessage() {
      if (!this.currentChatId || !this.newMessage.trim()) return;
      try {
        const uid = auth.currentUser.uid;
        const ts = new Date().toISOString();
        const payload = JSON.stringify([uid, this.newMessage.trim(), ts]);
        await updateDoc(doc(db, "chats", this.currentChatId), {
          messages: arrayUnion(payload)
        });
        this.newMessage = "";
      } catch (err) {
        console.error("Error sending message:", err);
      }
    },

    formatTimestamp(ts) {
      return new Date(ts).toLocaleString();
    }
  },
  beforeUnmount() {
    if (this.unsubscribeChat) this.unsubscribeChat();
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
  width: 250px;
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
  margin-right: 0;
  margin-left: 0.5rem;
}
.message-bubble {
  max-width: 70%;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  background: #f1f1f1;
}
.message-bubble.own {
  background: #d1e7dd;
  margin-left: auto;
}
.message-input {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
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
