<script>
  import { onMount } from 'svelte';
  import { cartItems, totalCost, cartItemCount, user } from '../stores/stores'; // Importing stores
  
  let userId;


  function navigateToAccount() {
    fetchAccountInfo();
    document.getElementById('marketplace-section').style.display = 'none';
    document.getElementById('account-section').style.display = 'block';
  }

  // Fetch cart items from the server
  async function fetchCartItems() {
    try {
      const response = await fetch(`http://localhost:4005/api/cart?userId=${userId}`);
      const data = await response.json();
      cartItems.set(data.items);
      return data.items;
    } catch (error) {
      console.error('Error fetching cart items:', error);
      return [];
    }
  }

  // Calculate total cost
  $: {
    cartItems.subscribe(items => {
      const total = items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
      totalCost.set(total);
    });
  }

  // Update item quantity
  async function updateCartItemQuantity(itemId, quantity) {
    try {
      await fetch(`http://localhost:4005/api/cart/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity })
      });
      fetchCartItems(); // Refresh cart items
    } catch (error) {
      console.error('Error updating item quantity:', error);
    }
  }

  // Remove item from the cart
  async function removeCartItem(itemId, currentQuantity) {
    if (currentQuantity > 1) {
      await updateCartItemQuantity(itemId, currentQuantity - 1);
    } else {
      try {
        await fetch(`http://localhost:4005/api/cart/${itemId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        fetchCartItems(); // Refresh cart items
      } catch (error) {
        console.error('Error removing item from cart:', error);
      }
    }
  }

  // Place order
  async function placeOrder() {
  const items = $cartItems; // Get the current value of cartItems
  if (items.length === 0) {
    alert('Your cart is empty.');
    return;
  }

  try {
    const response = await fetch('http://localhost:4003/api/place-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, cartItems: items })
    });
    const data = await response.json();

    if (data.success) {
      alert('Order placed successfully!');
      cartItems.set([]); // Clear cart items
      totalCost.set(0);  // Reset total cost
      fetchCartItems(); // Refresh cart items from the server (if needed)
    } else {
      alert(`Failed to place order: ${data.message}`);
    }
  } catch (error) {
    console.error('Error placing order:', error);
    alert('An error occurred while placing the order.');
  }
}

  // Logout function
  function logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    user.set(null);
    window.location.href = '/login';
  }

  onMount(() => {
    userId = localStorage.getItem('userId');


    fetchCartItems();
  });
</script>

<style>
  body {
      font-family: 'Roboto', sans-serif;
      background-color: #fafafa;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
  }

  header {
      background-color: #283593;
      color: white;
      padding: 15px 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  }

  header .logo {
      font-size: 1.8rem;
      font-weight: bold;
  }

  nav ul {
      list-style: none;
      display: flex;
      margin: 0;
      padding: 0;
  }

  nav ul li {
      margin-right: 20px;
  }

  nav a, nav button {
      color: white;
      text-decoration: none;
      font-size: 1rem;
      border: none;
      background: none;
      cursor: pointer;
      padding: 10px;
      border-radius: 5px;
      transition: background-color 0.3s ease, box-shadow 0.3s ease;
  }

  nav a:hover, nav button:hover {
      background-color: #3949ab;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  }

  main {
      max-width: 1200px;
      margin: 30px auto;
      padding: 30px;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
      flex-grow: 1;
  }

  h2 {
      color: #424242;
      margin-bottom: 20px;
  }

  .cart-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 15px;
      background-color: #e3f2fd;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      margin-bottom: 20px;
  }

  .cart-item img {
      border-radius: 6px;
      margin-right: 20px;
  }

  .cart-item span {
      flex-grow: 1;
      font-size: 1rem;
      color: #424242;
  }

  .cart-item button {
      padding: 10px 20px;
      background-color: #f44336;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: background-color 0.3s ease, box-shadow 0.3s ease;
  }

  .cart-item button:hover {
      background-color: #d32f2f;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  }

  #cartTotal {
      font-size: 1.2rem;
      font-weight: bold;
      margin-top: 20px;
      text-align: right;
      color: #424242;
  }

  #placeOrderButton {
      margin-top: 20px;
      padding: 14px 24px;
      background-color: #039be5;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1rem;
      display: block;
      width: 100%;
      transition: background-color 0.3s ease, box-shadow 0.3s ease;
  }

  #placeOrderButton:hover {
      background-color: #0277bd;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  }

  footer {
      background-color: #333;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 0 0 12px 12px;
      margin-top: auto;
  }

  footer nav a {
      color: white;
      text-decoration: none;
      margin: 0 15px;
  }

  footer nav a:hover {
      text-decoration: underline;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
      main {
          padding: 20px;
      }

      .cart-item {
          flex-direction: column;
          align-items: flex-start;
      }

      .cart-item img {
          margin-bottom: 10px;
      }

      #placeOrderButton {
          width: 100%;
      }
  }
</style>


<header>
  <div class="logo">Marketplace</div>
  <nav>
    <ul>
      <li><button id="viewProducts" on:click={() => window.location.href = '#/marketplace'}>home</button></li>
      <button id="accountButton" on:click={navigateToAccount} on:keydown={(e) => e.key === 'Enter' && navigateToAccount()}>Account</button>
      <li><a href="/shopping-cart">Cart</a></li>
      <li><button id="logoutButton" on:click={logout}>Logout</button></li>
    </ul>
  </nav>
</header>

<main>
  <section id="cartSection">
    <h2>Shopping Cart</h2>
    <div id="cartList">
      {#if $cartItems.length > 0}
        {#each $cartItems as item}
          <div class="cart-item">
            <img src={item.image_url} alt={item.product} width="50">
            <span>Product: {item.product} - Quantity: {item.quantity} - Price: ${parseFloat(item.price).toFixed(2)}</span>
            <button on:click={() => removeCartItem(item.id, item.quantity)}>Remove</button>
          </div>
        {/each}
      {:else}
        <p>Your cart is empty.</p>
      {/if}
    </div>
    <div id="cartTotal">Total: ${$totalCost.toFixed(2)}</div>
    <button id="placeOrderButton" on:click={placeOrder}>Place Order</button>
  </section>
</main>

<footer>
  <nav>
    <a href="/marketplace">Home</a>
    <a href="/contract">Contact</a>
  </nav>
</footer>
