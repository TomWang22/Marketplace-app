<script>
  import { onMount } from 'svelte';

  onMount(() => {
    console.log('Privacy page loaded');
  });
</script>

<style>
  @import './global.css';

  main {
    max-width: 800px;
    margin: 0 auto;
    padding: 2em;
    line-height: 1.6;
  }

  h1 {
    font-size: 2.5em;
    color: #333;
    text-align: center;
    margin-bottom: 1em;
  }

  p {
    font-size: 1.1em;
    color: #555;
    margin-bottom: 1.5em;
  }

  section {
    background: #f9f9f9;
    padding: 2em;
    border-radius: 10px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }
</style>

<main>
  <section>
    <h1>Privacy Policy</h1>
    <p>Your privacy is important to us. Here we explain how we handle your data.</p>
  </section>
</main>
