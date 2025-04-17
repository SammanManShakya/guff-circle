<!-- src/App.vue -->
<template>
  <div class="app-container">
    <div v-if="!isLoggedIn">
      <div v-if="showLogin">
        <LoginForm @loggedIn="handleLoggedIn" />
        <p>
          Don't have an account?
          <a @click.prevent="toggleForm">Register</a>
        </p>
      </div>
      <div v-else>
        <SignupForm @loggedIn="handleLoggedIn" />
        <p>
          Already have an account?
          <a @click.prevent="toggleForm">Log in</a>
        </p>
      </div>
    </div>
    <div v-else>
      <Navbar />
      <div class="content">
        <router-view />
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
    };
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
};
</script>

<style>
/* remove the fixed max-width so children can fill the screen */
.app-container {
  width: 100%;
  margin: 0;
  max-width: none;
}

/* push everything below the fixed navbar and make it a flex container */
.content {
  padding-top: 60px;                  /* match your Navbar height */
  display: flex;                      /* so Chat.vue flex children work */
  height: calc(100vh - 60px);         /* fill remaining viewport height */
}

/* optional reset for your auth screens */
a {
  cursor: pointer;
  color: blue;
  text-decoration: underline;
}

</style>
