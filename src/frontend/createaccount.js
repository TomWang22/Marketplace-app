document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('createAccountForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

        console.log('Submitting registration:', { username, password, role });

        try {
            const response = await axios.post('http://localhost:3000/api/register', {
                username,
                password,
                role
            });

            console.log('Response status:', response.status);

            const data = response.data;
            console.log('Response data:', data);

            if (response.status === 200 && data.success) {
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
