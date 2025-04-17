<template>
    <div class="chat-container">
      <aside class="chat-sidebar">
        <!-- Sidebar content (contacts, channels, etc.) -->
        <p>Sidebar (20%)</p>
      </aside>
      <section class="chat-main">
        <!-- Main chat area -->
        <p>Main Chat Area (80%)</p>
      </section>
    </div>
  </template>
  
  <script>
  export default {
    name: "Chat"
  };
  </script>
  
  <style scoped>
  .chat-container {
    display: flex;
    height: 100vh; /* full viewport height */
  }
  
  .chat-sidebar {
    width: 20%;
    border-right: 1px solid #ccc;
    padding: 1rem;
    box-sizing: border-box;
  }
  
  .chat-main {
    width: 80%;
    padding: 1rem;
    box-sizing: border-box;
  }
  </style>
  