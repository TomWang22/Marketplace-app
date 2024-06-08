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
                window.location.href = '/login.html';
            } else {
                console.error('Registration failed:', data.message);
                alert('Registration failed: ' + data.message);
            }
        } catch (error) {
            console.error('Registration failed:', error);
            alert('An error occurred during registration.');
        }
    });

    document.getElementById('loginForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        console.log('Submitting login:', { username, password });

        try {
            const response = await axios.post('http://localhost:3000/api/login', {
                username,
                password
            });

            console.log('Response status:', response.status);

            const data = response.data;
            console.log('Response data:', data);

            if (response.status === 200 && data.success) {
                alert('Login successful!');
                window.location.href = '/home.html';
            } else {
                console.error('Login failed:', data.message);
                alert('Login failed: ' + data.message);
            }
        } catch (error) {
            console.error('Login failed:', error);
            alert('An error occurred during login.');
        }
    });
});
