<template>
  <form @submit.prevent="login">
    <h1>Login</h1>
    <input type="email" placeholder="Email" required v-model="email" />
    <input type="password" placeholder="Password" required v-model="password" />
    <button type="submit">Log in</button>
    <button type="button" @click="signInWithGoogle">Log in with Google</button>
  </form>
</template>

<script>
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase/init.js";
import db from "../firebase/init.js";
import { setDoc, doc, getDoc } from "firebase/firestore";

export default {
  name: "LoginForm",
  emits: ['loggedIn'],
  data() {
    return {
      email: '',
      password: ''
    }
  },
  methods: {
    login() {
      signInWithEmailAndPassword(auth, this.email, this.password)
        .then(() => {
          console.log("Successfully logged in.");
          this.$emit('loggedIn');
        })
        .catch((error) => {
          console.error("Error during login:", error);
          alert("Username or Password incorrect");
        });
    },
    signInWithGoogle() {
      const provider = new GoogleAuthProvider();
      signInWithPopup(auth, provider)
        .then((result) => {
          console.log("Google sign in result:", result.user);
          const userDocRef = doc(db, "users", result.user.uid);
          // Check if the user already exists
          return getDoc(userDocRef).then((docSnap) => {
            if (!docSnap.exists()) {
              // New user: create a document with default values including an empty chats array
              return setDoc(
                userDocRef,
                {
                  user_id: result.user.uid,
                  username: result.user.displayName || "Anonymous",
                  followers: [],
                  following: [],
                  posts: [],
                  user_circles: [],
                  chats: []  // initialize chats as empty array
                }
              );
            }
            // Existing user: do not modify existing data
            return Promise.resolve();
          });
        })
        .then(() => {
          this.$emit('loggedIn');
          this.$router.push("/feed");
        })
        .catch((error) => {
          console.error("Google sign in error:", error);
          alert("Error signing in with Google");
        });
    }
  }
}
</script>

<style scoped>
form {
  border: 1px solid #ccc;
  padding: 20px;
  margin-bottom: 1rem;
}
input {
  display: block;
  width: 90%;
  margin: 10px auto;
  padding: 8px;
}
button {
  padding: 8px 16px;
  margin: 5px;
}
</style>
