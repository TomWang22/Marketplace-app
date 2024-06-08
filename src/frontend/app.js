// app.js

// Fetch products function
async function fetchProducts() {
    try {
        const response = await fetch('/api/products');
        const products = await response.json();
        console.log(products);
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

// Login function
async function login(username, password) {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        // Store token in localStorage or sessionStorage for future authentication
        localStorage.setItem('token', data.token);
        // Redirect or update UI after successful login
    } catch (error) {
        console.error('Login failed:', error);
    }
}

// Event listener for login form submission
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginForm').addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Call the login function with username and password
        await login(username, password);
    });

    // Fetch products when the DOM content is loaded
    fetchProducts();
});
