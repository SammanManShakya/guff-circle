<template>
    <div class="search-item">
      <div class="profile">
        <slot name="profile-pic"></slot>
      </div>
      <div class="info">
        <router-link
          :to="{ name: 'VisitProfile', params: { userId: userId } }"
          class="username-link"
        >
          <span>
            <slot name="username"></slot>
          </span>
        </router-link>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: "SearchItem",
    props: {
      userId: {
        type: String,
        required: true
      }
    }
  };
  </script>
  
  <style scoped>
  .search-item {
    display: flex;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #ccc;
  }
  
  .profile {
    margin-right: 10px;
  }
  
  .info {
    flex: 1;
  }
  
  .username-link {
    font-size: 1.2rem;
    font-weight: bold;
    color: #734f96;
    text-decoration: none;
    cursor: pointer; /* Ensures the link displays as clickable */
  }
  
  .username-link:hover {
    text-decoration: underline;
  }
  </style>
  