<template>
  <nav class="navbar">
    <div class="navbar-left">
      <h1 class="navbar-title">गफ Circle</h1>
    </div>
    <div class="navbar-center">
      <router-link class="nav-link" to="/feed">Feed</router-link>
      <router-link class="nav-link" to="/profile">Profile</router-link>
    </div>
    <div class="navbar-right">
      <input
        type="text"
        placeholder="Search..."
        v-model="searchQuery"
        @input="handleSearch"
      />
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
  background-color: #734f96; /* Lavender shade */
  color: white; /* Default text color is white */
  padding: 10px 20px;
}
.navbar-left {
  flex: 1;
}
.navbar-center {
  flex: 1;
  display: flex;
  flex-direction: row;
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
  color: black; /* Active pill text color is black */
  border-radius: 20px;  /* Pill shape */
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
