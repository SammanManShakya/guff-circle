<template>
  <nav class="navbar">
    <div class="navbar-left">
      <h1 class="navbar-title">गफ Circle</h1>
    </div>
    <div class="navbar-center">
      <router-link class="nav-link" to="/feed">Feed</router-link>
      <router-link class="nav-link" to="/profile">Profile</router-link>
      <router-link class="nav-link" to="/chat">Chat</router-link>
    </div>
    <div class="navbar-right">
      <form @submit.prevent="goToSearchResults">
        <input
          type="text"
          placeholder="Search..."
          v-model="searchQuery"
          @input="handleSearch"
        />
      </form>
    </div>
  </nav>
</template>

<script>
export default {
  name: "Navbar",
  data() {
    return {
      searchQuery: ""
    }
  },
  methods: {
    handleSearch() {
      console.log("Search query:", this.searchQuery);
    },
    goToSearchResults() {
      console.log("Redirecting to SearchResults with query:", this.searchQuery);
      this.$router.push({ name: 'SearchResults', query: { q: this.searchQuery } });
      this.searchQuery = "";
    }
  },
  renderTracked(e) {
    if (e && e.key === 'searchQuery') {
      console.log("renderTracked hook: searchQuery =", this.searchQuery);
    }
  },
  renderTriggered(e) {
    if (e && e.key === 'searchQuery') {
      console.log("renderTriggered hook: searchQuery =", this.searchQuery);
    }
  }
}
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #734f96;
  color: white;
  padding: 10px 20px;
}
.navbar-left {
  flex: 1;
}
.navbar-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
.navbar-center .nav-link {
  margin: 0 10px;
  color: white;
  text-decoration: none;
}
.navbar-center .nav-link.router-link-active {
  background-color: white;
  color: black;
  border-radius: 20px;
  padding: 5px 10px;
}
.navbar-right {
  flex: 1;
  text-align: right;
}
.navbar-right input {
  padding: 5px;
  border: none;
  border-radius: 4px;
}
</style>
