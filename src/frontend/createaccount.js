document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('createAccountForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

        console.log('Submitting registration:', { username, password, role });

        try {
            const response = await fetch('http://localhost:3000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password, role })
            });

            console.log('Response status:', response.status);

            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok && data.success) {
                alert('Account created successfully!');
                window.location.href = 'login.html'; // Ensure correct path
            } else {
                console.error('Registration failed:', data.message);
                alert('Registration failed: ' + data.message);
            }
        } catch (error) {
            console.error('Registration failed:', error);
            alert('An error occurred during registration.');
        }
    });
});
