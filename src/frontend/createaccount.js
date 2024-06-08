document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('createAccountForm').addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission behavior

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const email = document.getElementById('email').value;

        // Send registration data to the server
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password, email })
            });
            const data = await response.json();

            if (data.success) {
                // If registration is successful, redirect to the login page
                alert('Account created successfully!');
                window.location.href = '/login.html';
            } else {
                // Handle registration failure (e.g., display error message to the user)
                console.error('Registration failed:', data.message);
                alert('Registration failed: ' + data.message);
            }
        } catch (error) {
            console.error('Registration failed:', error);
            // Handle registration failure (e.g., display error message to the user)
            alert('An error occurred during registration.');
        }
    });
});
