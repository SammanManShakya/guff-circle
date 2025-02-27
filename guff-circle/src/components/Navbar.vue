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
    background-color: #333;
    color: #fff;
    padding: 10px 20px;
  }
  .navbar-left {
    flex: 1;
  }
  .navbar-center {
    flex: 1;
    display: flex;           /* Use flexbox */
    flex-direction: row;     /* Arrange items side by side */
    justify-content: center; /* Center horizontally */
    align-items: center;     /* Center vertically */
  }
  .navbar-center .nav-link {
    margin: 0 10px;
    color: #fff;
    text-decoration: none;
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
  