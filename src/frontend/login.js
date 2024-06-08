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

            if (data.token) {
                // If login is successful, store the token in localStorage
                localStorage.setItem('token', data.token);

                // Redirect the user to another page or perform other actions
                window.location.href = '/dashboard.html';
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
        window.location.href = '/create-account.html';
    });
});
