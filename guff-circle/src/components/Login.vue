<!-- src/components/Login.vue -->
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
            console.log(result.user);
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
  