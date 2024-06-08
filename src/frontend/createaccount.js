document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('createAccountForm').addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission behavior

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

        console.log('Submitting registration:', { username, password, role });

        // Send registration data to the server
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password, role })
            });

            console.log('Response status:', response.status);

            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok) {
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

    document.getElementById('loginForm').addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission behavior

        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        console.log('Submitting login:', { username, password });

        // Send login data to the server
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            console.log('Response status:', response.status);

            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok) {
                // If login is successful, redirect to the home page
                alert('Login successful!');
                window.location.href = '/home.html';
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
});
