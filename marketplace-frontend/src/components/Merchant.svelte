<script>
  import { onMount } from 'svelte';
  import { user, products, notifications, receivedSupplies, chatMessages } from '../stores/stores';
  import { io } from 'socket.io-client';

  let suppliesVisible = false;
  let productsVisible = false;
  let ordersVisible = false;

  let productName = '';
  let productDescription = '';
  let productPrice = '';
  let productStock = '';
  let productImageUrl = '';

  let productIdToRequest = '';
  let quantityToRequest = '';

  let customerId = '';
  let productIdToSend = '';
  let quantityToSend = '';

  let chatMessage = "";
  let userId = localStorage.getItem('userId');
  let orders = [];
  let accountInfo = {};
  let pricePerUnit = 0;  // Initially set to 0, will be fetched based on the selected product
  let profit = 0;

  $: profit = quantityToSend ? parseInt(quantityToSend) * parseFloat(pricePerUnit) : 0;
  function displayNotification(message) {
    notifications.update(n => [...n, message]);
  }

  // Function to fetch the product price based on productIdToSend
  async function fetchProductPrice(productId) {
    try {
      const response = await fetch(`http://localhost:4002/api/products/${productId}`);
      const data = await response.json();
      if (data.success) {
        pricePerUnit = data.product.price || 0; // Update pricePerUnit with the fetched price
      } else {
        console.error('Failed to fetch product price:', data.message);
        pricePerUnit = 0; // Reset to 0 if there's an error
      }
    } catch (error) {
      console.error('Error fetching product price:', error);
      pricePerUnit = 0; // Reset to 0 if there's an error
    }
  }

  // Watch for changes in productIdToSend and fetch the corresponding product price
  $: if (productIdToSend) {
    fetchProductPrice(productIdToSend);
  }

  // Reactive profit calculation based on quantityToSend and pricePerUnit
  $: profit = quantityToSend ? parseInt(quantityToSend) * pricePerUnit : 0;

  async function requestSupply(productId, quantity) {
    const merchantId = userId;
    try {
      const response = await fetch('http://localhost:4007/api/request-supply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId, productId, quantity })
      });
      const data = await response.json();
      if (data.success) {
        displayNotification(`Requested ${quantity} units of product ID ${productId}`);
        alert('Supply request successful!');
        productIdToRequest = '';
        quantityToRequest = '';
      } else {
        displayNotification(`Failed to request supply: ${data.message}`);
      }
    } catch (error) {
      console.error('Error requesting supply:', error);
    }
  }

  function clearInputFields() {
    productName = '';
    productDescription = '';
    productPrice = '';
    productStock = '';
    productImageUrl = '';
  }

  const logout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.hash = '#/login';
  };

  async function addProduct(name, description, price, stock, imageUrl) {
    try {
      const response = await fetch('http://localhost:4002/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, price, stock, image_url: imageUrl })
      });
      const data = await response.json();
      if (data.success) {
        displayNotification(`Product "${name}" added successfully.`);
        alert('Product added successfully!');
        clearInputFields();
      } else {
        displayNotification(`Failed to add product: ${data.message}`);
        alert(`Failed to add product: ${data.message}`);
      }
    } catch (error) {
      console.error('Error adding product:', error);
      alert('An error occurred while adding the product.');
    }
  }

  async function fetchAccountInfo() {
    try {
      const response = await fetch(`http://localhost:4001/api/account-info?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        accountInfo = data.account;
      } else {
        console.error('Error fetching account info:', data.message);
      }
    } catch (error) {
      console.error('Error fetching account info:', error);
    }
  }

  async function fetchReceivedSupplies() {
    try {
      const response = await fetch(`http://localhost:4007/api/received-supplies?merchantId=${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      receivedSupplies.set(data.supplies);
    } catch (error) {
      console.error('Error fetching received supplies:', error);
    }
  }

  async function displayReceivedSupplies() {
    await fetchReceivedSupplies();
    suppliesVisible = true;
  }

  async function fetchAllProducts() {
    try {
      const response = await fetch('http://localhost:4002/api/products', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      products.set(data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }

  async function toggleProductsVisibility() {
    if (!productsVisible) {
      await fetchAllProducts();
    }
    productsVisible = !productsVisible;
  }

  async function fetchIncompleteOrders() {
  try {
    const response = await fetch(`http://localhost:4007/api/pending-orders?merchantId=${userId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    if (data.success) {
      // Here we are setting only the required fields
      orders = data.orders.map(order => ({
        product_id: order.product_id,
        quantity: order.quantity,
      }));
    }
  } catch (error) {
    console.error('Error fetching incomplete orders:', error);
  }
}

  async function toggleOrdersVisibility() {
    if (!ordersVisible) {
      await fetchIncompleteOrders();
    }
    ordersVisible = !ordersVisible;
  }

  // Function to fulfill an order
  async function fulfillOrder(orderSummaryId) {
    try {
      const response = await fetch('http://localhost:4007/api/fulfill-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderSummaryId })
      });

      const data = await response.json();

      if (data.success) {
        const { user_id, product_id, quantity } = data;
        displayNotification(`Order fulfilled successfully for Shopper ID: ${user_id}, Product ID: ${product_id}, Quantity: ${quantity}`);

        // Update or filter out the fulfilled order as needed in your frontend state
        orders = orders.filter(order => order.id !== orderSummaryId);

        // Optionally, refresh account information or other relevant data
        fetchAccountInfo();
      } else {
        displayNotification(`Failed to fulfill order: ${data.message}`);
      }
    } catch (error) {
      console.error('Error fulfilling order:', error);
      displayNotification('Failed to fulfill order due to an unexpected error.');
    }
  }

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

  socket.on("newSupply", (data) => {
    notifications.update(n => [...n, data.message]);

    // Update the specific supply in the store
    supplies.update(currentSupplies => {
      return currentSupplies.map(supply => {
        if (supply.id === data.newSupply.id) {
          return { ...supply, stock: data.newSupply.stock };
        }
        return supply;
      });
    });

    // Update the products store as well
    products.update(currentProducts => {
      return currentProducts.map(product => {
        if (product.id === data.newSupply.product_id) {
          return { ...product, stock: product.stock + data.newSupply.quantity };
        }
        return product;
      });
    });

    // Update the account balance as it might have changed due to the transaction
    fetchAccountInfo();
  });

  const sendMessage = () => {
    if (chatMessage) {
      socket.emit("sendMessage", { message: chatMessage, userId, role: "merchant" });
      chatMessage = "";
    }
  };

  onMount(() => {
    fetchAccountInfo();
  });

  // Function to send merchandise
  async function sendMerchandise() {
  try {
    const response = await fetch('http://localhost:4007/api/send-merchandise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, productId: productIdToSend, quantity: parseInt(quantityToSend) || 0 })
    });

    const data = await response.json();

    if (data.success) {
      displayNotification(`Merchandise sent successfully. Profit added to merchant's account.`);
      alert('Merchandise sent successfully!');

      // Update the balance with the profit immediately
      let currentBalance = parseFloat(accountInfo.balance);  // Ensure it's a number
      let calculatedProfit = parseFloat(profit);  // Ensure profit is a number

      accountInfo.balance = (currentBalance + calculatedProfit).toFixed(2);  // Add and format

      // Clear input fields
      clearInputFields2();
    } else {
      displayNotification(`Failed to send merchandise: ${data.message}`);
    }
  } catch (error) {
    console.error('Error sending merchandise:', error);
    displayNotification('Failed to send merchandise due to an unexpected error.');
  }
}

  function clearInputFields2() {
    // Clear the bound variables
    customerId = '';
    productIdToSend = '';
    quantityToSend = '';  // Empty the quantity field

    // Force update the DOM elements
    document.getElementById('customerIdInput').value = '';
    document.getElementById('productIdInput').value = '';
    document.getElementById('quantityInput').value = '';
  }

</script>

<style>
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
  <div class="logo">Merchant Dashboard</div>
  <button on:click={logout}>Logout</button>
</header>

<main>
  <div class="account-info">
    <h2>Account Information</h2>
    <p><strong>Name:</strong> {accountInfo.username}</p>
    <p><strong>Balance:</strong> {accountInfo.balance}</p>
  </div>

  <!-- Add Product Section -->
  <section id="addProductContainer" class="item-container">
    <h2>Add Product</h2>
    <input type="text" bind:value={productName} placeholder="Product Name" required>
    <input type="text" bind:value={productDescription} placeholder="Product Description" required>
    <input type="number" bind:value={productPrice} placeholder="Product Price" required>
    <input type="number" bind:value={productStock} placeholder="Stock" required>
    <input type="text" bind:value={productImageUrl} placeholder="Image URL" required>
    <button on:click={() => addProduct(productName, productDescription, parseFloat(productPrice), parseInt(productStock), productImageUrl)}>Add Product</button>
  </section>

  <!-- Request Supply Section -->
  <section id="requestSupplyContainer" class="item-container">
    <h2>Request Supply</h2>
    <input type="number" bind:value={productIdToRequest} placeholder="Product ID" required>
    <input type="number" bind:value={quantityToRequest} placeholder="Quantity" required>
    <button on:click={() => requestSupply(productIdToRequest, parseInt(quantityToRequest))}>Request Supply</button>
  </section>

  <!-- Received Supplies Section -->
  <button on:click={() => { suppliesVisible ? suppliesVisible = false : displayReceivedSupplies(); }}>Show Received Supplies</button>
  {#if suppliesVisible}
    <section id="receivedSuppliesList" class="item-container">
      {#each $receivedSupplies as supply}
        <div class="supply-item">
          <img src={supply.image_url} alt={supply.name} width="50" height="50">
          <span>{supply.name} - {supply.description} - ${supply.price ? parseFloat(supply.price).toFixed(2) : 'N/A'} - Stock: {supply.stock}</span>
        </div>
      {/each}
    </section>
  {/if}

  <!-- List All Products Section -->
  <button on:click={toggleProductsVisibility}>{productsVisible ? 'Hide All Products' : 'List All Products'}</button>
  {#if productsVisible}
    <section id="productList" class="item-container">
      {#each $products as product}
        <div class="product-item">
          <img src={product.image_url} alt={product.name} width="50" height="50">
          <span>{product.name} - {product.description} - ${product.price ? parseFloat(product.price).toFixed(2) : 'N/A'} - Stock: {product.stock}</span>
        </div>
      {/each}
    </section>
  {/if}

  <!-- List Incomplete Orders Section -->
  <button on:click={toggleOrdersVisibility}>{ordersVisible ? 'Hide Incomplete Orders' : 'List Incomplete Orders'}</button>
  {#if ordersVisible}
    <section id="orderList" class="item-container">
      {#each orders as order}
        <div class="order-item">
          <span>Order ID: {order.id} - Product ID: {order.product_id} - Quantity: {order.quantity} - Status: {order.status}</span>
          <button on:click={() => fulfillOrder(order.id)}>Fulfill Order</button>
        </div>
      {/each}
    </section>
  {/if}

  <!-- Send Merchandise Section -->
  <section id="sendMerchandiseContainer" class="item-container">
    <h2>Send Merchandise</h2>
    <input id="customerIdInput" type="text" bind:value={customerId} placeholder="Customer ID" required>
    <input id="productIdInput" type="text" bind:value={productIdToSend} placeholder="Product ID" required>
    <div class="quantity-input">
      <button on:click={() => quantityToSend = Math.max(1, parseInt(quantityToSend || '1') - 1)}>-</button>
      <input id="quantityInput" type="number" bind:value={quantityToSend} placeholder="Quantity" required>
      <button on:click={() => quantityToSend = parseInt(quantityToSend || '0') + 1}>+</button>
    </div>

    <!-- Display the calculated profit -->
    <p>Expected Profit: ${profit}</p>

    <!-- Display the updated balance -->
    <p>Current Balance: ${accountInfo.balance}</p>

    <button on:click={sendMerchandise}>Send Merchandise</button>
  </section>

  <!-- Chat Section -->
  <section id="chatContainer" class="item-container">
    <h2>Chat with Shopper and Suppliers</h2>
    <ul>
      {#each $chatMessages as chat}
        <li>{chat.username} ({chat.role}, ID: {chat.user_id}): {chat.message} ({new Date(chat.timestamp).toLocaleString()})</li>
      {/each}
    </ul>
    <input type="text" bind:value={chatMessage} placeholder="Type your message here">
    <button on:click={sendMessage}>Send</button>
  </section>

  <!-- Notifications List -->
  <ul id="notificationsList">
    {#each $notifications as notification}
      <li>{notification}</li>
    {/each}
  </ul>
</main>

<footer>
  <nav>
    <a href="#/contact">Contact</a>
  </nav>
</footer>
