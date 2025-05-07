<template>
  <form @submit.prevent="login" class="login-form">
    <h1>Login</h1>
    <input
      type="email"
      placeholder="Email"
      required
      v-model="email"
      class="text-input"
    />
    <input
      type="password"
      placeholder="Password"
      required
      v-model="password"
      class="text-input"
    />
    <button type="submit" class="btn primary">Log in</button>
    <button type="button" @click="signInWithGoogle" class="btn google">
      Log in with Google
    </button>
  </form>
</template>

<script>
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { auth } from "../firebase/init.js";
import db from "../firebase/init.js";
import { setDoc, doc, getDoc } from "firebase/firestore";
import blankProfile from "../assets/blank_profile.png";

export default {
  name: "LoginForm",
  emits: ["loggedIn"],
  data() {
    return {
      email: "",
      password: ""
    };
  },
  methods: {
    login() {
      signInWithEmailAndPassword(auth, this.email, this.password)
        .then(() => {
          this.$emit("loggedIn");
        })
        .catch((error) => {
          console.error("Error during login:", error);
          alert("Username or password incorrect");
        });
    },
    signInWithGoogle() {
      const provider = new GoogleAuthProvider();
      signInWithPopup(auth, provider)
        .then((result) => {
          const user = result.user;
          const userDocRef = doc(db, "users", user.uid);
          return getDoc(userDocRef).then((docSnap) => {
            if (!docSnap.exists()) {
              return setDoc(userDocRef, {
                user_id: user.uid,
                username: user.displayName || "Anonymous",
                profilePicture: user.photoURL || blankProfile,
                followers: [],
                following: [],
                posts: [],
                user_circles: [],
                chats: []
              });
            }
          });
        })
        .then(() => {
          this.$emit("loggedIn");
          this.$router.push("/feed");
        })
        .catch((error) => {
          console.error("Google sign in error:", error);
          alert("Error signing in with Google");
        });
    }
  }
};
</script>

<style scoped>
.login-form {
  max-width: 360px;
  margin: 4rem auto;
  padding: 2rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-sizing: border-box;
  background: #fff;
}

.login-form h1 {
  text-align: center;
  margin-bottom: 1.5rem;
}

.text-input {
  display: block;
  width: 100%;
  margin-bottom: 1rem;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

.btn {
  display: block;
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
  font-size: 1rem;
  border-radius: 4px;
  cursor: pointer;
  text-align: center;
  box-sizing: border-box;
}

.btn.primary {
  background-color: #734f96;
  color: #fff;
  border: none;
}

.btn.primary:hover {
  background-color: #5b3e7a;
}

.btn.google {
  background-color: #fff;
  color: #444;
  border: 1px solid #ccc;
}

.btn.google:hover {
  background-color: #f5f5f5;
}
</style>
