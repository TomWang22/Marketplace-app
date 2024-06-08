document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');

    const createAccountForm = document.getElementById('createAccountForm');

    if (createAccountForm) {
        console.log('Create account form found');

        createAccountForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            console.log('Form submission prevented');

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

                console.log('Response received with status:', response.status);

                if (response.status === 405) {
                    console.error('Method Not Allowed');
                } else {
                    const data = await response.json();
                    console.log('Response data:', data);

                    if (response.ok) {
                        alert('Account created successfully!');
                        window.location.href = '/login.html';
                    } else {
                        console.error('Registration failed:', data.message);
                        alert('Registration failed: ' + data.message);
                    }
                }
            } catch (error) {
                console.error('Registration failed:', error);
                alert('An error occurred during registration.');
            }
        });
    } else {
        console.error('Create account form not found');
    }
});
