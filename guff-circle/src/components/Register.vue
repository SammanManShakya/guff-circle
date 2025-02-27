<!-- src/components/Register.vue -->
<template>
    <form @submit.prevent="register">
      <h1>Create an Account</h1>
      <input type="text" placeholder="Username" required v-model="username" />
      <input type="email" placeholder="Email" required v-model="email" />
      <input type="password" placeholder="Password (6+ characters)" required v-model="password" />
      <button type="submit">Register</button>
      <button type="button" @click="signInWithGoogle">Sign Up with Google</button>
    </form>
  </template>
  
  <script>
  import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
  import { auth } from "../firebase/init.js";
  
  export default {
    name: "SignupForm",
    emits: ['loggedIn'],
    data() {
      return {
        username: '',
        email: '',
        password: ''
      }
    },
    methods: {
      register() {
        createUserWithEmailAndPassword(auth, this.email, this.password)
          .then((userCredential) => {
            return updateProfile(userCredential.user, { displayName: this.username })
              .then(() => {
                console.log("Successfully registered and profile updated.");
                this.$emit('loggedIn');
              });
          })
          .catch((error) => {
            console.error("Error during registration:", error);
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
  