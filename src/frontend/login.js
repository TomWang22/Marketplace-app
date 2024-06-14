document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        console.log('Submitting login:', { username, password });

        try {
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            console.log('Response status:', response.status);

            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok && data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.role);
                localStorage.setItem('userId', data.userId);

                alert('Login successful!');

                // Redirect the user based on their role
                if (data.role === 'merchant') {
                    console.log('Redirecting to merchant.html');
                    window.location.href = 'merchant.html'; // Ensure correct path
                } else if (data.role === 'supplier') {
                    console.log('Redirecting to supplier.html');
                    window.location.href = 'supplier.html'; // Ensure correct path
                } else if (data.role === 'shopper') {
                    console.log('Redirecting to shopper.html');
                    window.location.href = 'shopper.html'; // Ensure correct path
                } else {
                    console.log('Redirecting to dashboard.html');
                    window.location.href = 'dashboard.html'; // Default redirection
                }
            } else {
                console.error('Login failed:', data.message);
                alert('Login failed: ' + data.message);
            }
        } catch (error) {
            console.error('Login failed:', error);
            alert('An error occurred during login.');
        }
    });

    document.getElementById('createAccountBtn').addEventListener('click', () => {
        window.location.href = 'createaccount.html'; // Ensure correct path
    });
});
