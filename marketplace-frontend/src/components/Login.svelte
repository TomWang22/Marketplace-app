<script>
  import { user } from '../stores/stores';
  import { push } from 'svelte-spa-router';

  export let loginEndpoint = 'http://localhost:4001/api/login';

  let username = '';
  let password = '';

  async function login(event) {
    event.preventDefault();

    console.log('Submitting login:', { username, password });

    try {
      const response = await fetch(loginEndpoint, {
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

        user.set({
          userId: data.userId,
          username: username,
          role: data.role,
          token: data.token
        });

        alert('Login successful!');

        switch(data.role) {
          case 'merchant':
            window.location.href = 'merchant.html';
            break;
          case 'supplier':
            window.location.href = 'supplier.html';
            break;
          case 'shopper':
            window.location.href = 'shopper.html';
            break;
          default:
            window.location.href = 'dashboard.html';
            break;
        }
      } else {
        console.error('Login failed:', data.message);
        alert('Login failed: ' + data.message);
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert('An error occurred during login.');
    }
  }

  function redirectToCreateAccount() {
    push('/create-account');
  }

  function handleKeyDown(event, callback) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      callback();
    }
  }
</script>

<style>
  @import '../global.css';

.container {
  max-width: 400px;
  margin: 0 auto;
  padding: 2em;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  margin-bottom: 1.5em;
  font-size: 1.8em;
  color: #333;
}

.form-group {
  margin-bottom: 1.5em;
}

.form-group label {
  display: block;
  margin-bottom: 0.5em;
  font-size: 1.1em;
  color: #555;
}

.form-group input {
  width: 100%;
  padding: 0.75em;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1em;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.form-group input:focus {
  border-color: #007BFF;
  box-shadow: 0 0 8px rgba(0, 123, 255, 0.25);
  outline: none;
}

button {
  width: 100%;
  padding: 0.75em;
  border: none;
  background: linear-gradient(to right, #007BFF, #0056b3);
  color: #fff;
  font-size: 1.2em;
  border-radius: 5px;
  cursor: pointer;
  margin-bottom: 0.5em;
  transition: background 0.3s ease, box-shadow 0.3s ease;
}

button:hover {
  background: linear-gradient(to right, #0056b3, #003d80);
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.15);
}

#loginForm {
  margin-bottom: 1em;
}

#loginForm .form-group {
  position: relative;
}

#loginForm .form-group input[type="text"],
#loginForm .form-group input[type="password"] {
  padding-left: 2.5em;
}

#loginForm .form-group label {
  font-size: 1em;
  color: #666;
}

#loginForm .form-group::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-family: 'FontAwesome';
  font-size: 1.2em;
  color: #666;
}

#loginForm .form-group#username::before {
  content: '\f007'; /* FontAwesome icon for user */
}

#loginForm .form-group#password::before {
  content: '\f023'; /* FontAwesome icon for lock */
}

@media (max-width: 500px) {
  .container {
    padding: 1.5em;
  }

  button {
    font-size: 1em;
    padding: 0.65em;
  }

  h2 {
    font-size: 1.5em;
  }

  .form-group input {
    font-size: 0.9em;
  }
}

</style>

<div class="container">
  <h2>Login</h2>
  <form id="loginForm" on:submit|preventDefault={login}>
    <div class="form-group">
      <label for="username">Username:</label>
      <input type="text" id="username" bind:value={username} required>
    </div>
    <div class="form-group">
      <label for="password">Password:</label>
      <input type="password" id="password" bind:value={password} required>
    </div>
    <button type="submit">Login</button>
  </form>
  <button 
    id="createAccountBtn" 
    on:click={redirectToCreateAccount} 
    tabindex="0" 
    on:keydown={(event) => handleKeyDown(event, redirectToCreateAccount)}
  >Create Account</button>
</div>
