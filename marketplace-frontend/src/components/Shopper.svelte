<script>
  import { onMount } from "svelte";
  import { io } from "socket.io-client";
  import { push } from 'svelte-spa-router';
  import { cartItemCount, chatMessages } from "../stores/stores";

  let fundsAmount = 0;
  let productId = 0;
  let returnQuantity = 0;
  let cartItems = [];
  let totalCost = 0;
  let inventoryItems = [];
  let inventoryVisible = false;
  let chatMessage = "";
  let userId = localStorage.getItem("userId");
  let accountInfo = {};


  const socket = io("http://localhost:4004", {
    transports: ["websocket"],
    query: { userId },
  });

  socket.on("previousChats", (chats) => {
    chatMessages.set(chats);
  });

  socket.on("receiveMessage", (chat) => {
    chatMessages.update(messages => [...messages, chat]);
  });

  const sendMessage = () => {
    if (chatMessage) {
      socket.emit("sendMessage", { message: chatMessage, userId, role: "shopper" });
      chatMessage = "";
    }
  };

  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString(); // Adjust based on your locale and preferences
  }

  const fetchCartItems = async () => {
    try {
      const response = await fetch(`http://localhost:4005/api/cart?userId=${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      cartItems = data.items || [];
      totalCost = cartItems.reduce((total, item) => total + parseFloat(item.price) * item.quantity, 0);
      cartItemCount.set(cartItems.length);
    } catch (error) {
      console.error("Error fetching cart items:", error);
    }
  };

  const updateCartItemQuantity = async (itemId, quantity) => {
    try {
      await fetch(`http://localhost:4005/api/cart/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity, userId }),
      });
      await fetchCartItems();
    } catch (error) {
      console.error("Error updating item quantity:", error);
    }
  };

  const removeCartItem = async (itemId) => {
    try {
      await fetch(`http://localhost:4005/api/cart/${itemId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });
      await fetchCartItems();
    } catch (error) {
      console.error("Error removing item from cart:", error);
    }
  };

  const addFunds = async () => {
    const amount = parseFloat(fundsAmount);

    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      const response = await fetch("http://localhost:4001/api/add-funds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, amount }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Funds added successfully. Amount: $${amount.toFixed(2)}`);
        fundsAmount = "";
        fetchAccountInfo(); // Refresh account info
      } else {
        alert("Failed to add funds: " + data.message);
      }
    } catch (error) {
      console.error("Error adding funds:", error);
      alert("An error occurred while adding funds.");
    }
  };

  const returnMerchandise = async () => {
    const product_id = parseInt(productId);
    const quantity = parseInt(returnQuantity);

    if (isNaN(product_id) || isNaN(quantity) || quantity <= 0) {
      alert("Please enter valid product ID and quantity");
      return;
    }

    try {
      const response = await fetch("http://localhost:4003/api/return-merchandise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, product_id, quantity }),
      });

      const data = await response.json();
      if (data.success) {
        alert("Merchandise returned successfully.");
      } else {
        alert("Failed to return merchandise: " + data.message);
      }
    } catch (error) {
      console.error("Error returning merchandise:", error);
      alert("An error occurred while returning merchandise.");
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const response = await fetch(`http://localhost:4003/api/inventory?userId=${userId}`);
      const data = await response.json();
      inventoryItems = data.items;
    } catch (error) {
      console.error("Error fetching inventory items:", error);
    }
  };

  const fetchAccountInfo = async () => {
    try {
      const response = await fetch(`http://localhost:4001/api/account-info?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        accountInfo = data.account;
      } else {
        alert("Failed to fetch account info: " + data.message);
      }
    } catch (error) {
      console.error("Error fetching account info:", error);
      alert("An error occurred while fetching account info.");
    }
  };

  const toggleInventoryVisibility = () => {
    inventoryVisible = !inventoryVisible;
    if (inventoryVisible && inventoryItems.length === 0) {
      fetchInventoryItems();
    }
  };

  onMount(() => {
    fetchCartItems();
    fetchAccountInfo();
  });

  const logout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.hash = '#/login';
  };
</script>

<style>
  /* General styling */
  html, body {
    height: 100%;
    margin: 0;
    font-family: 'Roboto', sans-serif;
    color: #333;
    background-color: #f5f5f5;
  }

  /* Header styling */
  header {
    background-color: #283593;
    padding: 15px 30px;
    color: white;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  }

  header .logo {
    font-size: 1.8em;
    font-weight: bold;
    letter-spacing: 0.05em;
  }

  header button {
    background-color: #f44336;
    border: none;
    padding: 12px 20px;
    border-radius: 5px;
    color: white;
    cursor: pointer;
    transition: background-color 0.3s ease, box-shadow 0.3s ease;
  }

  header button:hover {
    background-color: #d32f2f;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }

  /* Main content styling */
  main {
    max-width: 1200px;
    margin: 30px auto;
    padding: 30px;
    background-color: #fafafa;
    border-radius: 12px;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  }

  h1, h2 {
    color: #424242;
    font-family: 'Roboto', sans-serif;
  }

  .account-info {
    margin-bottom: 40px;
    background-color: #e3f2fd;
    padding: 25px;
    border-radius: 12px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    font-family: 'Roboto', sans-serif;
  }

  .account-info p {
    margin: 10px 0;
    font-size: 1.1em;
    color: #1a237e;
  }

  input[type="text"], input[type="number"] {
    width: 100%;
    padding: 12px;
    margin-bottom: 20px;
    border: 1px solid #cfd8dc;
    border-radius: 6px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    font-size: 1em;
  }

  button {
    display: inline-block;
    padding: 14px 24px;
    background-color: #039be5;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.3s ease, box-shadow 0.3s ease;
    font-family: 'Roboto', sans-serif;
  }

  button:hover {
    background-color: #0277bd;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  }

  .item-container {
    margin-bottom: 40px;
    background-color: #e3f2fd;
    padding: 25px;
    border-radius: 12px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    font-family: 'Roboto', sans-serif;
  }

  .item-container p, .item-container span {
    margin: 10px 0;
    font-size: 1.1em;
    color: #1a237e;
  }

  .item-container img {
    border-radius: 6px;
    margin-right: 15px;
  }

  #chatContainer {
    background-color: #eeeeee;
    padding: 20px;
    border-radius: 12px;
  }

  #chatContainer h2 {
    margin-bottom: 20px;
    color: #424242;
  }

  #chatContainer ul {
    max-height: 300px;
    overflow-y: auto;
    padding: 15px;
    border: 1px solid #cfd8dc;
    background-color: white;
    border-radius: 12px;
    margin-bottom: 30px;
    list-style-type: none;
  }

  #chatContainer ul li {
    margin-bottom: 15px;
    padding: 12px;
    border-radius: 10px;
    background-color: #e1f5fe;
    color: #0277bd;
  }

  #notificationsList {
    padding: 0;
    margin-top: 20px;
    list-style-type: none;
  }

  #notificationsList li {
    background-color: #039be5;
    color: white;
    padding: 12px;
    margin-bottom: 10px;
    border-radius: 6px;
  }

  button#logout {
    background-color: #f44336;
  }

  button#logout:hover {
    background-color: #d32f2f;
  }
</style>

<header>
  <div class="logo">Shopper Dashboard</div>
</header>

<main>
  <div class="account-info">
    <h2>Account Information</h2>
    <p><strong>Name:</strong> {accountInfo.username}</p>
    <p><strong>Balance:</strong> ${accountInfo.balance}</p>
  </div>

  <!-- Add Funds Section -->
  <section id="addFundsContainer" class="item-container">
    <h2>Add Funds</h2>
    <input type="number" bind:value={fundsAmount} placeholder="Enter amount" required>
    <button on:click={addFunds}>Add Funds</button>
  </section>

  <!-- Return Merchandise Section -->
  <section id="returnMerchandiseContainer" class="item-container">
    <h2>Return Merchandise</h2>
    <input type="number" bind:value={productId} placeholder="Product ID" required>
    <input type="number" bind:value={returnQuantity} placeholder="Quantity" required>
    <button on:click={returnMerchandise}>Return Merchandise</button>
  </section>

  <!-- Shopping Cart Button -->
  <button on:click={() => push('/shopping-cart')}>View Cart</button>
  
  <!-- Inventory Toggle Button -->
  <button class="inventory-toggle" on:click={toggleInventoryVisibility}>
    {inventoryVisible ? 'Hide Inventory' : 'View Inventory'}
  </button>

  <!-- Shop Button -->
  <button on:click={() => push('/marketplace')}>Shop</button>
  <button on:click={logout}>Logout</button>

  <!-- Container to display cart items -->
  {#if cartItems.length}
    <div id="cartItemsContainer" class="item-container">
      <h2>Shopping Cart</h2>
      <ul>
        {#each cartItems as item}
          <li>
            <div class="cart-item-details">
              <span>{item.product} - ${parseFloat(item.price).toFixed(2)}</span>
            </div>
            <div class="cart-item-quantity">
              <button on:click={() => updateCartItemQuantity(item.id, item.quantity - 1)}>-</button>
              <span>{item.quantity}</span>
              <button on:click={() => updateCartItemQuantity(item.id, item.quantity + 1)}>+</button>
            </div>
            <button class="remove-button" on:click={() => removeCartItem(item.id)}>Remove</button>
          </li>
        {/each}
      </ul>
      <p>Total: ${totalCost.toFixed(2)}</p>
    </div>
  {/if}

  <!-- Container to display inventory items -->
  {#if inventoryVisible}
    <div id="inventoryContainer" class="item-container">
      <h2>Inventory</h2>
      {#if inventoryItems.length}
        <ul>
          {#each inventoryItems as item}
            <li>{item.product} - ${parseFloat(item.price).toFixed(2)} - Quantity: {item.quantity}</li>
          {/each}
        </ul>
      {:else}
        <p>No items in inventory.</p>
      {/if}
    </div>
  {/if}

  <!-- Chat Section -->
  <div id="chatContainer" class="item-container">
    <h2>Chat with Merchants and Suppliers</h2>
    <ul>
      {#each $chatMessages as chat}
        <li>{chat.username} ({chat.role}, ID: {chat.user_id}): {chat.message} ({formatTimestamp(chat.timestamp)})</li>
      {/each}
    </ul>
    <input type="text" bind:value={chatMessage} placeholder="Type your message here">
    <button on:click={sendMessage}>Send</button>
  </div>
</main>
