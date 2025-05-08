<template>
  <form @submit.prevent="register" class="signup-form">
    <h1>Create an Account</h1>

    <input
      type="text"
      placeholder="Username"
      required
      v-model="username"
      class="text-input"
    />

    <input
      type="email"
      placeholder="Email"
      required
      v-model="email"
      class="text-input"
    />

    <input
      type="password"
      placeholder="Password (6+ characters)"
      required
      v-model="password"
      class="text-input"
    />

    <button type="submit" class="btn primary">Register</button>
    <button type="button" @click="signInWithGoogle" class="btn google">
      Sign Up with Google
    </button>
  </form>
</template>

<script>
import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { auth } from "../firebase/init.js";
import db from "../firebase/init.js";
import { setDoc, doc } from "firebase/firestore";
import blankProfile from "../assets/blank_profile.png";

export default {
  name: "SignupForm",
  emits: ["loggedIn"],
  data() {
    return {
      username: "",
      email: "",
      password: "",
      profilePicture: ""
    };
  },
  methods: {
    register() {
      createUserWithEmailAndPassword(auth, this.email, this.password)
        .then((userCredential) => {
          const user = userCredential.user;
          // Update displayName
          return updateProfile(user, { displayName: this.username }).then(
            () => {
              // convert blankProfile to base64
              return fetch(blankProfile).then((res) => res.blob());
            }
          ).then((blob) => {
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          }).then((base64data) => {
            this.profilePicture = base64data;
            return setDoc(doc(db, "users", user.uid), {
              user_id: user.uid,
              username: this.username,
              profilePicture: this.profilePicture,
              followers: [],
              following: [],
              posts: [],
              user_circles: [],
              chats: []
            });
          });
        })
        .then(() => {
          this.$emit("loggedIn");
        })
        .catch((error) => {
          console.error("Error during registration:", error);
          alert("Registration failed");
        });
    },
    signInWithGoogle() {
      const provider = new GoogleAuthProvider();
      signInWithPopup(auth, provider)
        .then((result) => {
          const user = result.user;
          return setDoc(
            doc(db, "users", user.uid),
            {
              user_id: user.uid,
              username: user.displayName || "Anonymous",
              profilePicture: user.photoURL || blankProfile,
              followers: [],
              following: [],
              posts: [],
              user_circles: [],
              chats: []
            },
            { merge: true }
          );
        })
        .then(() => {
          this.$emit("loggedIn");
          this.$router.push("/feed");
        })
        .catch((error) => {
          console.error("Google sign up error:", error);
          alert("Error signing up with Google");
        });
    }
  }
};
</script>

<style scoped>
.signup-form {
  max-width: 360px;
  margin: 4rem auto;
  padding: 2rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-sizing: border-box;
  background: #fff;
}

.signup-form h1 {
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
