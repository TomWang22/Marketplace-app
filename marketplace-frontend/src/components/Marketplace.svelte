<script>
  import { onMount } from 'svelte';
  import { user, cartItemCount, products, searchQuery, notifications } from '../stores/stores'; // Store imports
  import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';

  let userId = '';
  let role = '';
  let currentPage = 1;
  let itemsPerPage = 24;
  let filteredProducts = [];
  let accountInfo = {};
  let shoppingHistory = [];
  let searchHistory = [];

  // Subscribing to the user store
  $: {
    userId = $user?.userId || localStorage.getItem('userId');
    role = $user?.role || localStorage.getItem('role');
  }

  function navigateToHome() {
    switch (role) {
      case 'shopper':
        window.location.hash = '#/shopper';
        break;
      case 'supplier':
        window.location.hash = '#/supplier';
        break;
      case 'merchant':
        window.location.hash = '#/merchant';
        break;
      default:
        window.location.hash = '#/marketplace';
        break;
    }
  }

  function navigateToAccount() {
    fetchAccountInfo();
    document.getElementById('marketplace-section').style.display = 'none';
    document.getElementById('account-section').style.display = 'block';
  }

  function logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    user.set(null); // Updating the store
    window.location.hash = '#/login';
  }

  async function saveSearchHistory(userId, searchQueryValue) {
    await fetch('http://localhost:4001/api/search-history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, searchQuery: searchQueryValue })
    });
  }

  function handleSearch(event) {
    if (event.key === 'Enter') {
      const searchQueryValue = event.target.value.trim().toLowerCase();
      if (searchQueryValue) {
        saveSearchHistory(userId, searchQueryValue);
        searchQuery.set(searchQueryValue);
        window.location.hash = `#/search-results?query=${encodeURIComponent(searchQueryValue)}`;
      }
    }
  }

  async function fetchProducts() {
    try {
      const response = await fetch('http://localhost:4002/api/products', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        products.set(data.products);
        filteredProducts = data.products;
        displayProducts();
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }

  function filterAndDisplayProducts() {
    const priceRange = document.getElementById('priceFilter').value;
    products.subscribe(value => {
      filteredProducts = value.filter(product => {
        const price = parseFloat(product.price);
        switch (priceRange) {
          case '0-50':
            return price >= 0 && price <= 50;
          case '51-100':
            return price >= 51 && price <= 100;
          case '101-200':
            return price >= 101 && price <= 200;
          case '200+':
            return price > 200;
          default:
            return true;
        }
      });
      displayProducts();
    });
  }

  function displayProducts() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const productsToDisplay = filteredProducts.slice(start, end);

    const productGrid = document.querySelector('.product-grid');
    productGrid.innerHTML = '';
    productsToDisplay.forEach(product => {
      const price = product.price ? parseFloat(product.price).toFixed(2) : 'N/A';
      const productElement = document.createElement('div');
      productElement.className = 'product';
      productElement.innerHTML = `
        <img src="${product.image_url}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p>$${price}</p>
        <button class="view-details" data-id="${product.id}">View Details</button>
      `;
      productGrid.appendChild(productElement);
    });

    document.querySelectorAll('.view-details').forEach(button => {
      button.addEventListener('click', (event) => {
        const productId = event.target.getAttribute('data-id');
        window.location.hash = `#/product-details/${productId}`;
      });
    });

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    document.getElementById('pageIndicator').textContent = `Page ${currentPage} of ${totalPages}`;
  }

  async function fetchAccountInfo() {
    try {
      const response = await fetch(`http://localhost:4001/api/users/${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        accountInfo = data.user;
        shoppingHistory = data.user.shoppingHistory;
        searchHistory = data.user.searchHistory;
        const balance = accountInfo.balance ? parseFloat(accountInfo.balance) : 0;
        document.getElementById('userBalance').textContent = balance.toFixed(2);
        displayHistory('shoppingHistory', shoppingHistory);
        displayHistory('searchHistory', searchHistory);
      } else {
        console.error("Failed to fetch account info:", data.message);
      }
    } catch (error) {
      console.error("Error fetching account info:", error);
    }
  }

  function displayHistory(elementId, history) {
    const historyElement = document.getElementById(elementId);
    historyElement.innerHTML = '';
    history.forEach(item => {
      const listItem = document.createElement('li');
      listItem.textContent = `${item.search_query || item.product_id} - Date: ${new Date(item.search_date || item.purchase_date).toLocaleDateString()}`;
      historyElement.appendChild(listItem);
    });
  }

  onMount(() => {
    fetchProducts();
  });
</script>

<style>
  body {
    font-family: 'Roboto', sans-serif;
    background-color: #fafafa;
    margin: 0;
    padding: 0;
}

/* Header */
.container {
    background-color: #283593;
    color: white;
    padding: 15px 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
}

.logo {
    font-size: 1.8rem;
    font-weight: bold;
}

.search-bar {
    flex-grow: 1;
    margin: 0 20px;
    padding: 10px 20px;
    font-size: 1rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    max-width: 600px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

nav ul {
    list-style: none;
    display: flex;
    align-items: center;
    margin: 0;
    padding: 0;
}

nav ul li {
    margin-left: 20px;
}

nav a, nav button {
    color: white;
    text-decoration: none;
    font-size: 1rem;
    background: linear-gradient(135deg, #039be5, #0277bd);
    padding: 10px 20px;
    border-radius: 8px;
    transition: background 0.3s ease, box-shadow 0.3s ease;
    margin: 0 5px;
}

nav a:hover, nav button:hover {
    background: linear-gradient(135deg, #0277bd, #039be5);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}

.cart-icon {
    margin-left: 20px;
    cursor: pointer;
    font-size: 1.5rem;
    position: relative;
}

/* Optional: Badge for Cart Icon */
.cart-icon::after {
    content: "{$cartItemCount}";
    position: absolute;
    top: -10px;
    right: -10px;
    background: red;
    color: white;
    border-radius: 50%;
    padding: 4px 8px;
    font-size: 0.75rem;
}

/* Main Layout */
main {
    max-width: 1200px;
    margin: 30px auto;
    padding: 30px;
    background-color: #ffffff;
    border-radius: 12px;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
}

h1, h2 {
    color: #424242;
    margin-bottom: 20px;
}

.product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    padding: 1rem;
}

.product {
    border: 1px solid #e0e0e0;
    padding: 1rem;
    text-align: center;
    border-radius: 4px;
    background-color: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease-in-out;
}

.product img {
    max-width: 100%;
    height: auto;
    border-bottom: 1px solid #e0e0e0;
    margin-bottom: 1rem;
    border-radius: 8px;
}

.product:hover {
    transform: scale(1.05);
}

.product h3 {
    font-size: 1.25rem;
    margin: 0.5rem 0;
    color: #1a237e;
}

.product p {
    font-size: 1rem;
    color: #333;
}

#filters {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: #f8f9fa;
    border-bottom: 1px solid #e0e0e0;
}

#pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
}

#pagination button {
    padding: 0.5rem 1rem;
    font-size: 1rem;
    border: none;
    background: linear-gradient(135deg, #039be5, #0277bd);
    color: white;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.3s ease, box-shadow 0.3s ease;
}

#pagination button:hover {
    background: linear-gradient(135deg, #0277bd, #039be5);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}

#pageIndicator {
    font-size: 1rem;
    color: #424242;
}

#notificationsList li {
    list-style-type: none;
    padding: 0.5rem;
    background-color: #f8f9fa;
    border: 1px solid #e0e0e0;
    margin: 0.5rem 0;
    border-radius: 4px;
}

/* Footer */
footer {
    background-color: #333;
    color: white;
    padding: 20px;
    text-align: center;
    border-radius: 0 0 12px 12px;
}

footer nav a {
    color: white;
    text-decoration: none;
    margin: 0 15px;
}

footer nav a:hover {
    text-decoration: underline;
}

#filters {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background-color: #ffffff;
    border-radius: 12px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
}

#filters label {
    font-size: 1rem;
    color: #424242;
    margin-right: 10px;
}

#filters select {
    padding: 10px;
    font-size: 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-right: 20px;
    appearance: none;
    background-color: #f8f9fa;
}

#filters select:focus {
    outline: none;
    border-color: #039be5;
}

#filters select option {
    padding: 10px;
}

#pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background-color: #ffffff;
    border-radius: 12px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
}

#pagination button {
    padding: 10px 20px;
    font-size: 1rem;
    border: none;
    background-color: #039be5;
    color: white;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.3s ease, box-shadow 0.3s ease;
}

#pagination button:hover {
    background-color: #0277bd;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}

#pagination #pageIndicator {
    font-size: 1rem;
    color: #424242;
}
</style>

<div class="container">
  <div class="logo">Marketplace</div>
  <button id="homeButton" on:click={navigateToHome} on:keydown={(e) => e.key === 'Enter' && navigateToHome()}>Home</button>
  <button id="accountButton" on:click={navigateToAccount} on:keydown={(e) => e.key === 'Enter' && navigateToAccount()}>Account</button>
  <button id="logoutButton" on:click={logout} on:keydown={(e) => e.key === 'Enter' && logout()}>Logout</button>
  <div id="cartItemCount">{$cartItemCount}</div>
  <FontAwesomeIcon class="cart-icon" icon={faShoppingCart} on:click={() => window.location.hash = '#/shopping-cart'} />
</div>

<main>
  <section id="marketplace-section">
    <section id="filters">
      <label for="priceFilter">Filter by price:</label>
      <select id="priceFilter" on:change={filterAndDisplayProducts}>
        <option value="all">All</option>
        <option value="0-50">$0 - $50</option>
        <option value="51-100">$51 - $100</option>
        <option value="101-200">$101 - $200</option>
        <option value="200+">Above $200</option>
      </select>

      <label for="itemsPerPage">Items per page:</label>
      <select id="itemsPerPage" bind:value={itemsPerPage} on:change={displayProducts}>
        <option value="24">24</option>
        <option value="48">48</option>
        <option value="72">72</option>
      </select>
    </section>
    <section id="product-listings" class="product-listings">
      <div class="product-grid"></div>
    </section>
    <section id="pagination">
      <button id="prevPage" on:click={() => { if (currentPage > 1) { currentPage--; displayProducts(); } }}>Previous</button>
      <span id="pageIndicator"></span>
      <button id="nextPage" on:click={() => { const totalPages = Math.ceil(filteredProducts.length / itemsPerPage); if (currentPage < totalPages) { currentPage++; displayProducts(); } }}>Next</button>
    </section>
  </section>

  <section id="account-section" style="display: none;">
    <h1>Account Information</h1>
    <div>
      <p><strong>Balance:</strong> $<span id="userBalance">0.00</span></p>
      <h2>Shopping History</h2>
      <ul id="shoppingHistory"></ul>
    </div>
  </section>
</main>
