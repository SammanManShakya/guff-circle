<!-- src/App.vue -->
<template>
  <div class="app-container">
    <!-- Authentication forms (when not logged in) -->
    <div v-if="!isLoggedIn">
      <div v-if="showLogin">
        <LoginForm @loggedIn="handleLoggedIn" />
        <p>
          Don't have an account?
          <a href="#" @click.prevent="toggleForm">Register</a>
        </p>
      </div>
      <div v-else>
        <SignupForm @loggedIn="handleLoggedIn" />
        <p>
          Already have an account?
          <a href="#" @click.prevent="toggleForm">Log in</a>
        </p>
      </div>
    </div>
    <!-- When logged in, show the Navbar and member area -->
    <div v-else>
      <Navbar />
      <div class="content">
        <h1>This is content in app, everything below is Feed.vue. Remove content above feed later.</h1>
        <button @click="signOutUser">Sign Out</button>
        <!-- router-view for Feed, Profile, etc. -->
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script>
import LoginForm from "./components/Login.vue";
import SignupForm from "./components/Register.vue";
import Navbar from "./components/Navbar.vue";
import { signOut } from "firebase/auth";
import { auth } from "./firebase/init.js";

export default {
  name: "App",
  components: {
    LoginForm,
    SignupForm,
    Navbar
  },
  data() {
    return {
      isLoggedIn: false,
      showLogin: true,
      displayName: ''
    }
  },
  methods: {
    toggleForm() {
      this.showLogin = !this.showLogin;
    },
    handleLoggedIn() {
      this.isLoggedIn = true;
      if (auth.currentUser && auth.currentUser.displayName) {
        this.displayName = auth.currentUser.displayName;
      }
      this.$router.push("/feed");
    },
    signOutUser() {
      signOut(auth)
        .then(() => {
          this.isLoggedIn = false;
          this.showLogin = true;
          this.displayName = '';
          console.log("User signed out");
          this.$router.push("/login");
        })
        .catch((error) => {
          console.error("Error signing out:", error);
          alert(error.message);
        });
    }
  },
  beforeUpdate() {
    if (auth.currentUser && auth.currentUser.displayName) {
      this.displayName = auth.currentUser.displayName;
    }
  }
}
</script>

<style scoped>
.app-container {
  max-width: 800px;
  margin: auto;
  text-align: center;
  /* Add top padding to ensure content isn't hidden behind the fixed navbar */
  padding-top: 70px;
}
.content {
  padding: 20px;
}
a {
  cursor: pointer;
  color: blue;
  text-decoration: underline;
}
</style>
