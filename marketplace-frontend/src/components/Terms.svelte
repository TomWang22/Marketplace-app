<script>
    import { onMount } from 'svelte';

    // Function to handle user logout
    function logout() {
        localStorage.removeItem('userId');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = 'login.html';
    }

    // Add event listener for logout button on component mount
    onMount(() => {
        const logoutButton = document.getElementById('logoutButton');
        logoutButton.addEventListener('click', logout);
    });
</script>

<style>
    /* Add your styles here */
</style>

<header>
    <div class="logo">Marketplace</div>
    <nav>
        <a href="marketplace.html">Home</a>
        <a href="about.html">About Us</a>
        <a href="contact.html">Contact</a>
        <a href="privacy.html">Privacy Policy</a>
        <a href="terms.html">Terms of Service</a>
        <button id="logoutButton">Logout</button>
    </nav>
</header>

<main>
    <h1>Terms of Service</h1>
    <section>
        <p>Our terms of service include...</p>
        <h2>License</h2>
        <p>Unless otherwise stated, we and/or our licensors own the intellectual property rights for all material on the website. All intellectual property rights are reserved.</p>
        <h2>User Comments</h2>
        <p>Certain parts of this website offer the opportunity for users to post and exchange opinions, information, material, and data ('Comments'). We do not screen, edit, publish, or review Comments prior to their appearance on the website.</p>
    </section>
</main>

<footer>
    <nav>
        <a href="about.html">About Us</a>
        <a href="contact.html">Contact</a>
        <a href="privacy.html">Privacy Policy</a>
        <a href="terms.html">Terms of Service</a>
    </nav>
</footer>
