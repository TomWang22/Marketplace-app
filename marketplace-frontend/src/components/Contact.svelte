<script>
  import { user } from '../stores/stores'; // Importing the store

  function logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    user.set(null);
    window.location.href = 'login.html';
  }

  function handleKeyDown(event, callback) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      callback();
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

  nav a, nav button {
    color: #fff;
    text-decoration: none;
    margin: 0 1em;
    background: none;
    border: none;
    cursor: pointer;
  }

  nav a:hover, nav button:hover {
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
  <div 
    class="logo" 
    tabindex="0" 
    role="button" 
    on:click={() => window.location.href = 'marketplace.html'} 
    on:keydown={(event) => handleKeyDown(event, () => window.location.href = 'marketplace.html')}
  >
    Marketplace
  </div>
  <nav>
    <a href="marketplace.html">Home</a>
    <button id="logoutButton" on:click={logout}>Logout</button>
  </nav>
</header>

<main>
  <h1>Contact</h1>
  <p>Contact us at support@marketplace.com...</p>
</main>

<footer>
  <nav>
    <a href="about.html">About Us</a>
    <a href="contact.html">Contact</a>
    <a href="privacy.html">Privacy Policy</a>
    <a href="terms.html">Terms of Service</a>
  </nav>
</footer>
