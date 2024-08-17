<script>
  import { onMount } from 'svelte';
  import { user } from '../stores/stores'; // Importing the store

  export let title = "About Us"; // Prop for title
  export let description = "This online marketplace app is designed to connect merchants and shoppers..."; // Prop for description

  let userName = '';

  // Subscribing to the user store
  $: userName = $user ? $user.username : 'Guest';

  onMount(() => {
    console.log(`${title} page loaded`);
  });

  function navigateTo(url) {
    window.location.href = url;
  }

  function handleKeyDown(event, url) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigateTo(url);
    }
  }
</script>

<style>
  /* Import your global CSS or include specific styles here */
  @import '../styles/global.css';

  header {
    display: flex;
    justify-content: space-between;
    padding: 1em;
    background-color: #333;
    color: #fff;
  }

  nav a {
    color: #fff;
    text-decoration: none;
    margin: 0 1em;
  }

  nav a:hover {
    text-decoration: underline;
  }

  main {
    padding: 2em;
  }

  footer {
    background-color: #f1f1f1;
    padding: 1em;
    text-align: center;
  }

  footer nav a {
    color: #333;
    text-decoration: none;
    margin: 0 1em;
  }

  footer nav a:hover {
    text-decoration: underline;
  }

  .logo {
    cursor: pointer;
  }
</style>

<header>
  <div class="logo"
    tabindex="0"
    role="button"
    on:click={() => navigateTo('marketplace.html')}
    on:keydown={(event) => handleKeyDown(event, 'marketplace.html')}
  >
    Marketplace
  </div>
  <nav>
    <a href="marketplace.html">Home</a>
    <span>Welcome, {userName}!</span>
  </nav>
</header>

<main>
  <h1>{title}</h1>
  <p>{description}</p>
</main>

<footer>
  <nav>
    <a href="about.html">About Us</a>
    <a href="contact.html">Contact</a>
    <a href="privacy.html">Privacy Policy</a>
    <a href="terms.html">Terms of Service</a>
  </nav>
</footer>
