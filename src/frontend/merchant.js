document.addEventListener("DOMContentLoaded", async () => {
  // Define your variables and DOM elements
  const showOrdersButton = document.getElementById("showOrdersButton");
  const ordersList = document.getElementById("ordersList");
  const notificationsList = document.getElementById("notificationsList");
  const chatInput = document.getElementById("chatInput");
  const chatSendButton = document.getElementById("chatSendButton");
  const chatList = document.getElementById("chatList");
  const toggleSupplyRequestsButton = document.getElementById(
    "toggleSupplyRequestsButton"
  );
  const supplyRequestsContainer = document.getElementById(
    "supplyRequestsContainer"
  );
  const supplyRequestsList = document.getElementById("supplyRequestsList");
  const merchantAccountSection = document.getElementById(
    "merchant-account-section"
  );
  const merchantUsername = document.getElementById("merchantUsername");
  const merchantBalance = document.getElementById("merchantBalance");
  const merchantProductListings = document.getElementById(
    "merchantProductListings"
  );
  const merchantOrderHistory = document.getElementById("merchantOrderHistory");
  const requestSupplyButton = document.getElementById("requestSupplyButton");
  const logoutButton = document.getElementById("logoutButton");
  const homeButton = document.getElementById("homeButton");
  const accountButton = document.getElementById("accountButton");
  const addProductButton = document.getElementById("addProductButton");
  const showReceivedSuppliesButton = document.getElementById(
    "showReceivedSuppliesButton"
  );
  const listAllProductsButton = document.getElementById(
    "listAllProductsButton"
  );
  const sendMerchandiseButton = document.getElementById(
    "sendMerchandiseButton"
  );
  const receivedSuppliesList = document.getElementById("receivedSuppliesList");
  const productList = document.getElementById("productList");
  const merchantId = localStorage.getItem("userId");

  if (!merchantId) {
    console.error("Merchant ID is not set in local storage");
    return;
  }

  const socket = io("http://localhost:3000", {
    transports: ["websocket"],
    query: { userId: merchantId },
  });

  let ordersVisible = false;
  let suppliesVisible = false;
  let productsVisible = false;

  socket.on("previousChats", (chats) => {
    chatList.innerHTML = "";
    chats.forEach((chat) => {
      const chatItem = document.createElement("li");
      chatItem.textContent = `${chat.username} (${chat.role}, ID: ${chat.user_id}): ${chat.message} (${chat.timestamp})`;
      chatList.appendChild(chatItem);
    });
  });

  socket.on("receiveMessage", (chat) => {
    const chatItem = document.createElement("li");
    chatItem.textContent = `${chat.username} (${chat.role}, ID: ${chat.user_id}): ${chat.message} (${chat.timestamp})`;
    chatList.appendChild(chatItem);
  });

  socket.on("newSupplyRequest", (supply) => {
    displaySupplyRequest(supply);
  });

  chatSendButton.addEventListener("click", () => {
    const message = chatInput.value;
    if (message) {
      socket.emit("sendMessage", {
        message,
        userId: merchantId,
        role: "merchant",
      });
      chatInput.value = "";
    }
  });

  function displayNotification(message) {
    if (!notificationsList) {
      console.error("notificationsList element not found");
      return;
    }
    const listItem = document.createElement("li");
    listItem.textContent = message;
    notificationsList.appendChild(listItem);
  }

  showOrdersButton.addEventListener("click", async (event) => {
    event.preventDefault();
    ordersVisible = !ordersVisible;
    if (ordersVisible) {
      await displayUnfulfilledOrders();
      ordersList.style.display = "block";
      showOrdersButton.textContent = "Hide Orders";
    } else {
      ordersList.style.display = "none";
      showOrdersButton.textContent = "Show Orders";
    }
  });

  async function fetchUnfulfilledOrders() {
    try {
      const response = await fetch(
        "http://localhost:3000/api/unfulfilled-orders"
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.orders;
    } catch (error) {
      console.error("Error fetching unfulfilled orders:", error);
      return [];
    }
  }

  async function displayUnfulfilledOrders() {
    const orders = await fetchUnfulfilledOrders();
    ordersList.innerHTML = "";
    orders.forEach((order) => {
      const listItem = document.createElement("div");
      listItem.className = "order-item";
      listItem.innerHTML = `
                  <div>
                      <span>Order ID: ${order.id} - Product ID: ${order.product_id} - Quantity: ${order.quantity}</span>
                      <button class="fulfill-button" data-order-id="${order.id}" data-product-id="${order.product_id}" data-quantity="${order.quantity}">Fulfill Order</button>
                  </div>
              `;
      ordersList.appendChild(listItem);
    });

    document.querySelectorAll(".fulfill-button").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const orderId = button.getAttribute("data-order-id");
        const productId = button.getAttribute("data-product-id");
        const quantity = button.getAttribute("data-quantity");
        const listItem = button.parentElement; // Get the parent element to remove it later
        await fulfillOrder(orderId, productId, quantity, listItem);
      });
    });
  }

  async function fulfillOrder(orderId, productId, quantity, listItem) {
    try {
      console.log("Fulfilling order with payload:", {
        orderId,
        productId,
        quantity,
      }); // Log the payload
      const response = await fetch("http://localhost:3000/api/fulfill-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId, productId, quantity }),
      });
      const data = await response.json();
      if (data.success) {
        displayNotification("Order fulfilled successfully.");
        listItem.remove(); // Remove the list item from the UI
      } else {
        displayNotification("Failed to fulfill order: " + data.message);
        alert("Failed to fulfill order: " + data.message);
      }
    } catch (error) {
      console.error("Error fulfilling order:", error);
      displayNotification("An error occurred while fulfilling the order.");
      alert("An error occurred while fulfilling the order.");
    }
  }

  async function fetchSupplyRequests() {
    try {
      const response = await fetch(
        `http://localhost:3000/api/merchant-supply-requests?merchantId=${merchantId}`
      );
      const data = await response.json();
      supplyRequestsList.innerHTML = "";
      data.requests.forEach((request) => {
        displaySupplyRequest(request);
      });
    } catch (error) {
      console.error("Error fetching supply requests:", error);
    }
  }

  function displaySupplyRequest(request) {
    const listItem = document.createElement("li");
    listItem.textContent = `${request.product_name} - Quantity: ${
      request.quantity
    } - Requested on: ${new Date(
      request.request_date
    ).toLocaleString()} - Status: ${request.status}`;
    supplyRequestsList.appendChild(listItem);
  }

  async function requestSupply(productId, quantity) {
    try {
      const response = await fetch("http://localhost:3000/api/request-supply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ merchantId, productId, quantity }),
      });
      const data = await response.json();
      if (data.success) {
        displayNotification(
          `Requested ${quantity} units of product ID ${productId}`
        );
        socket.emit("newSupplyRequest", data.request); // Emit new supply request

        // Clear the input fields
        document.getElementById("productIdToRequest").value = "";
        document.getElementById("quantityToRequest").value = "";
      } else {
        displayNotification(`Failed to request supply: ${data.message}`);
      }
    } catch (error) {
      console.error("Error requesting supply:", error);
      displayNotification("An error occurred while requesting supply.");
    }
  }

  requestSupplyButton.addEventListener("click", (event) => {
    event.preventDefault();
    const productId = document.getElementById("productIdToRequest").value;
    const quantity = parseInt(
      document.getElementById("quantityToRequest").value
    );
    if (productId && quantity) {
      requestSupply(productId, quantity);
    } else {
      displayNotification("Please enter a valid product ID and quantity.");
    }
  });

  function clearInputFields() {
    document.getElementById("productName").value = "";
    document.getElementById("productDescription").value = "";
    document.getElementById("productPrice").value = "";
    document.getElementById("productStock").value = "";
    document.getElementById("productImageUrl").value = "";
  }

  logoutButton.addEventListener("click", () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "login.html";
  });

  homeButton.addEventListener("click", () => {
    window.location.href = "marketplace.html";
  });

  accountButton.addEventListener("click", async () => {
    await displayMerchantAccountInfo();
  });

  async function fetchMerchantData(merchantId) {
    try {
      const response = await fetch(
        `http://localhost:3000/api/account-info?userId=${merchantId}`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      if (data.success) {
        return data.account;
      } else {
        console.error("Failed to fetch merchant data:", data.message);
        return null;
      }
    } catch (error) {
      console.error("Error fetching merchant data:", error);
      return null;
    }
  }

  async function displayMerchantAccountInfo() {
    const merchantData = await fetchMerchantData(merchantId);
    if (merchantData) {
      merchantUsername.textContent = merchantData.username || "N/A";
      const balance = parseFloat(merchantData.balance);
      merchantBalance.textContent = isNaN(balance)
        ? "0.00"
        : balance.toFixed(2);
      merchantProductListings.innerHTML = ""; // Assuming you might want to add product listings here
      merchantOrderHistory.innerHTML = ""; // Assuming you might want to add order history here
    } else {
      merchantUsername.textContent = "N/A";
      merchantBalance.textContent = "0.00";
      merchantProductListings.innerHTML = "<li>No products found.</li>";
      merchantOrderHistory.innerHTML = "<li>No order history found.</li>";
    }

    // Show account section and hide other sections if necessary
    merchantAccountSection.style.display = "block";
    document.getElementById("addProductContainer").style.display = "none";
    document.getElementById("requestSupplyContainer").style.display = "none";
    document.getElementById("sendMerchandiseContainer").style.display = "none";
    chatContainer.style.display = "none";
  }

  async function addProduct(name, description, price, stock, imageUrl) {
    try {
      const response = await fetch("http://localhost:3000/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          price,
          stock,
          image_url: imageUrl,
        }),
      });
      const data = await response.json();
      if (data.success) {
        displayNotification(`Product "${name}" added successfully.`);
        clearInputFields();
      } else {
        displayNotification(`Failed to add product: ${data.message}`);
      }
    } catch (error) {
      console.error("Error adding product:", error);
    }
  }

  async function fetchReceivedSupplies() {
    try {
      const response = await fetch(
        "http://localhost:3000/api/received-supplies",
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await response.json();
      return data.supplies;
    } catch (error) {
      console.error("Error fetching received supplies:", error);
      return [];
    }
  }

  async function displayReceivedSupplies() {
    const supplies = await fetchReceivedSupplies();
    receivedSuppliesList.innerHTML = "";
    supplies.forEach((supply) => {
      const price = parseFloat(supply.price);
      const listItem = document.createElement("div");
      listItem.className = "supply-item";
      listItem.innerHTML = `
                  <div>
                      <img src="${supply.image_url}" alt="${
        supply.name
      }" width="50" height="50">
                      <span>${supply.name} - ${supply.description} - $${
        !isNaN(price) ? price.toFixed(2) : "N/A"
      } - Stock: ${supply.stock}</span>
                  </div>
              `;
      receivedSuppliesList.appendChild(listItem);
    });
    receivedSuppliesList.style.display = "block";
  }

  async function fetchAllProducts() {
    try {
      const response = await fetch("http://localhost:3000/api/products", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      return data.products;
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  }

  async function displayAllProducts() {
    const products = await fetchAllProducts();
    productList.innerHTML = "";
    if (products && products.length > 0) {
      products.forEach((product) => {
        const price = parseFloat(product.price);
        const productItem = document.createElement("div");
        productItem.className = "product-item";
        productItem.innerHTML = `
                      <div>
                          <img src="${product.image_url}" alt="${
          product.name
        }" width="50" height="50">
                          <span>${product.name} - ${product.description} - $${
          !isNaN(price) ? price.toFixed(2) : "N/A"
        } - Stock: ${product.stock}</span>
                      </div>
                  `;
        productList.appendChild(productItem);
      });
    } else {
      productList.innerHTML = "<p>No products found.</p>";
    }
    productList.style.display = "block";
  }

  async function fetchPurchasedItems() {
    try {
      const response = await fetch("http://localhost:3000/api/purchased-items");
      const data = await response.json();
      return data.items;
    } catch (error) {
      console.error("Error fetching purchased items:", error);
      return [];
    }
  }

  async function displayPurchasedItems() {
    const items = await fetchPurchasedItems();
    ordersList.innerHTML = "";
    items.forEach((item) => {
      const listItem = document.createElement("div");
      listItem.className = "order-item";
      listItem.innerHTML = `
                  <div>
                      <span>Order ID: ${item.id} - Product ID: ${item.product_id} - Quantity: ${item.quantity} - Spent: $${item.spent}</span>
                      <button class="fulfill-button" data-order-id="${item.id}" data-product-id="${item.product_id}" data-quantity="${item.quantity}">Fulfill Order</button>
                  </div>
              `;
      ordersList.appendChild(listItem);
    });

    document.querySelectorAll(".fulfill-button").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const orderId = button.getAttribute("data-order-id");
        const productId = button.getAttribute("data-product-id");
        const quantity = button.getAttribute("data-quantity");
        const listItem = button.parentElement; // Get the parent element to remove it later
        await fulfillOrder(orderId, productId, quantity, listItem);
      });
    });

    ordersList.style.display = "block";
  }

  addProductButton.addEventListener("click", (event) => {
    event.preventDefault();
    const name = document.getElementById("productName").value;
    const description = document.getElementById("productDescription").value;
    const price = parseFloat(document.getElementById("productPrice").value);
    const stock = parseInt(document.getElementById("productStock").value);
    const imageUrl = document.getElementById("productImageUrl").value;
    addProduct(name, description, price, stock, imageUrl);
  });

  showReceivedSuppliesButton.addEventListener("click", (event) => {
    event.preventDefault();
    suppliesVisible = !suppliesVisible;
    if (suppliesVisible) {
      displayReceivedSupplies();
    } else {
      receivedSuppliesList.style.display = "none";
    }
  });

  listAllProductsButton.addEventListener("click", async (event) => {
    event.preventDefault();
    productsVisible = !productsVisible;
    if (productsVisible) {
      await displayAllProducts();
      listAllProductsButton.textContent = "Hide All Products";
    } else {
      productList.style.display = "none";
      listAllProductsButton.textContent = "List All Products";
    }
  });

  sendMerchandiseButton.addEventListener("click", (event) => {
    event.preventDefault();
    const customerId = document.getElementById("customerId").value;
    const productId = document.getElementById("productIdToSend").value;
    const quantity = parseInt(document.getElementById("quantityToSend").value);
    sendMerchandise(customerId, productId, quantity);
  });

  async function sendMerchandise(customerId, productId, quantity) {
    try {
      const response = await fetch(
        "http://localhost:3000/api/send-merchandise",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ customerId, productId, quantity }),
        }
      );
      const data = await response.json();
      if (data.success) {
        displayNotification(
          `Sent ${quantity} units of product ID ${productId} to customer ID ${customerId}`
        );
        // Clear the input fields
        document.getElementById("customerId").value = "";
        document.getElementById("productIdToSend").value = "";
        document.getElementById("quantityToSend").value = "";
      } else {
        displayNotification(`Failed to send merchandise: ${data.message}`);
      }
    } catch (error) {
      console.error("Error sending merchandise:", error);
      displayNotification("An error occurred while sending merchandise.");
    }
  }

  async function displayReceivedSupplies() {
    const supplies = await fetchReceivedSupplies();
    receivedSuppliesList.innerHTML = "";
    supplies.forEach((supply) => {
      const price = parseFloat(supply.price);
      const listItem = document.createElement("div");
      listItem.className = "supply-item";
      listItem.innerHTML = `
                  <div>
                      <img src="${supply.image_url}" alt="${
        supply.name
      }" width="50" height="50">
                      <span>${supply.name} - ${supply.description} - $${
        !isNaN(price) ? price.toFixed(2) : "N/A"
      } - Stock: ${supply.stock}</span>
                  </div>
              `;
      receivedSuppliesList.appendChild(listItem);
    });
    receivedSuppliesList.style.display = "block";
  }

  // Initial fetch of supply requests
  fetchSupplyRequests();
});
