<script>
  import { user } from '../stores/stores';

  // Define props
  export let registerEndpoint = 'http://localhost:4001/api/register';
  export let username = '';  // Prop for username
  export let password = '';  // Prop for password
  export let role = 'merchant';  // Prop for role

  async function createAccount(event) {
    event.preventDefault();

    console.log('Submitting registration:', { username, password, role });

    try {
      const response = await fetch(registerEndpoint, {
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
        // Set the user store with the new user's data
        user.set({
          userId: data.userId,
          username: username,
          role: data.role,
          token: data.token
        });
        window.location.href = 'login.html';
      } else {
        console.error('Registration failed:', data.message);
        alert('Registration failed: ' + data.message);
      }
    } catch (error) {
      console.error('Registration failed:', error);
      alert('An error occurred during registration.');
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

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75em;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1em;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.form-group input:focus,
.form-group select:focus {
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
  margin-top: 1em;
  transition: background 0.3s ease, box-shadow 0.3s ease;
}

button:hover {
  background: linear-gradient(to right, #0056b3, #003d80);
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.15);
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

  .form-group input,
  .form-group select {
    font-size: 0.9em;
  }
}

.form-group select {
  width: 100%;
  padding: 0.75em;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1em;
  background-color: #f8f9fa;
  color: #333;
  transition: border-color 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease;
  appearance: none;
  -webkit-appearance: none; /* For Safari */
  -moz-appearance: none; /* For Firefox */
}

.form-group select:focus {
  border-color: #007BFF;
  box-shadow: 0 0 8px rgba(0, 123, 255, 0.25);
  outline: none;
}

.form-group select::-ms-expand {
  display: none; /* Remove the default arrow in IE and Edge */
}

/* Custom dropdown arrow */
.form-group {
  position: relative;
}

.form-group::after {
  content: '\25BC'; /* Unicode character for downward arrow */
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  pointer-events: none;
  font-size: 0.9em;
  color: #333;
}
</style>

<div class="container">
  <h2>Create Account</h2>
  <form on:submit={createAccount}>
    <div class="form-group">
      <label for="username">Username:</label>
      <input type="text" id="username" bind:value={username} required>
    </div>
    <div class="form-group">
      <label for="password">Password:</label>
      <input type="password" id="password" bind:value={password} required>
    </div>
    <div class="form-group">
      <label for="role">Role:</label>
      <select id="role" bind:value={role} required>
        <option value="merchant">Merchant</option>
        <option value="supplier">Supplier</option>
        <option value="shopper">Shopper</option>
      </select>
    </div>
    <button type="submit">Create Account</button>
  </form>
</div>
