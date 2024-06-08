document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginForm').addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission behavior

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Send login credentials to the server for verification
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();

            if (response.ok && data.token) {
                // If login is successful, store the token and role in localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.role);

                // Redirect the user based on their role
                if (data.role === 'merchant') {
                    window.location.href = '/merchant.html';
                } else if (data.role === 'supplier') {
                    window.location.href = '/supplier.html';
                } else if (data.role === 'shopper') {
                    window.location.href = '/shopper.html';
                } else {
                    window.location.href = '/dashboard.html'; // default redirection
                }
            } else {
                // Handle login failure (e.g., display error message to the user)
                console.error('Login failed:', data.message);
                alert('Login failed: ' + data.message);
            }
        } catch (error) {
            console.error('Login failed:', error);
            // Handle login failure (e.g., display error message to the user)
            alert('An error occurred during login.');
        }
    });

    // Add event listener for the "Create Account" button
    document.getElementById('createAccountBtn').addEventListener('click', () => {
        window.location.href = 'create-account.html';
    });
});
