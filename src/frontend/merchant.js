document.addEventListener('DOMContentLoaded', async () => {
    const addProductButton = document.getElementById('addProductButton');
    const showReceivedSuppliesButton = document.getElementById('showReceivedSuppliesButton');
    const listAllProductsButton = document.getElementById('listAllProductsButton');
    const sendMerchandiseButton = document.getElementById('sendMerchandiseButton');
    const notificationsList = document.getElementById('notificationsList');
    const receivedSuppliesList = document.getElementById('receivedSuppliesList');
    const productList = document.getElementById('productList');
    const logoutButton = document.getElementById('logoutButton');
    const homeButton = document.getElementById('homeButton');
    const accountButton = document.getElementById('accountButton');
    const requestSupplyButton = document.getElementById('requestSupplyButton');
    const chatContainer = document.getElementById('chatContainer');
    const chatInput = document.getElementById('chatInput');
    const chatSendButton = document.getElementById('chatSendButton');
    const chatList = document.getElementById('chatList');
    const toggleSupplyRequestsButton = document.getElementById('toggleSupplyRequestsButton');
    const supplyRequestsContainer = document.getElementById('supplyRequestsContainer');
    const supplyRequestsList = document.getElementById('supplyRequestsList');
    const chatSupplierContainer = document.getElementById('chatSupplierContainer');
    const chatSupplierInput = document.getElementById('chatSupplierInput');
    const chatSupplierSendButton = document.getElementById('chatSupplierSendButton');
    const chatSupplierList = document.getElementById('chatSupplierList');
    const merchantId = localStorage.getItem('userId');
    if (!merchantId) {
        console.error('Merchant ID is not set in local storage');
        return;
    }

    const socket = io('http://localhost:3000', {
        transports: ['websocket'],
        query: { userId: merchantId }
    });

    let suppliesVisible = false;
    let productsVisible = false;

    socket.on('previousChats', (chats) => {
        chatList.innerHTML = '';
        chats.forEach(chat => {
            const chatItem = document.createElement('li');
            chatItem.textContent = `${chat.username} (${chat.role}, ID: ${chat.user_id}): ${chat.message} (${chat.timestamp})`;
            chatList.appendChild(chatItem);
        });
    });

    socket.on('receiveMessage', (chat) => {
        const chatItem = document.createElement('li');
        chatItem.textContent = `${chat.username} (${chat.role}, ID: ${chat.user_id}): ${chat.message} (${chat.timestamp})`;
        chatList.appendChild(chatItem);
    });

    if (chatSendButton) {
        chatSendButton.addEventListener('click', () => {
            const message = chatInput.value;
            if (message) {
                socket.emit('sendMessage', { message, userId: merchantId, role: 'merchant' });
                chatInput.value = '';
            }
        });
    }

    socket.on('previousSupplierChats', (chats) => {
        chatSupplierList.innerHTML = '';
        chats.forEach(chat => {
            const chatItem = document.createElement('li');
            chatItem.textContent = `${chat.username} (${chat.role}, ID: ${chat.user_id}): ${chat.message} (${chat.timestamp})`;
            chatSupplierList.appendChild(chatItem);
        });
    });

    socket.on('receiveSupplierMessage', (chat) => {
        const chatItem = document.createElement('li');
        chatItem.textContent = `${chat.username} (${chat.role}, ID: ${chat.user_id}): ${chat.message} (${chat.timestamp})`;
        chatSupplierList.appendChild(chatItem);
    });

    if (chatSupplierSendButton) {
        chatSupplierSendButton.addEventListener('click', () => {
            const message = chatSupplierInput.value;
            if (message) {
                socket.emit('sendSupplierMessage', { message, userId: merchantId, role: 'merchant' });
                chatSupplierInput.value = '';
            }
        });
    }

    function displayNotification(message) {
        const listItem = document.createElement('li');
        listItem.textContent = message;
        notificationsList.appendChild(listItem);
    }

    toggleSupplyRequestsButton.addEventListener('click', async () => {
        if (supplyRequestsContainer.style.display === 'none') {
            supplyRequestsContainer.style.display = 'block';
            toggleSupplyRequestsButton.textContent = 'Hide Supply Requests';
            await fetchSupplyRequests();
        } else {
            supplyRequestsContainer.style.display = 'none';
            toggleSupplyRequestsButton.textContent = 'Show Supply Requests';
        }
    });

    async function fetchSupplyRequests() {
        try {
            const response = await fetch('http://localhost:3000/api/supply-requests');
            const data = await response.json();

            supplyRequestsList.innerHTML = '';

            data.requests.forEach(request => {
                const listItem = document.createElement('li');
                listItem.textContent = `${request.name} - Quantity: ${request.quantity} - Requested by Merchant ID: ${request.merchant_id}`;
                supplyRequestsList.appendChild(listItem);
            });
        } catch (error) {
            console.error('Error fetching supply requests:', error);
        }
    }

    async function requestSupply(productId, quantity) {
        const merchantId = localStorage.getItem('userId');
        try {
            const response = await fetch('http://localhost:3000/api/request-supply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ merchantId, productId, quantity })
            });
            const data = await response.json();
            if (data.success) {
                displayNotification(`Requested ${quantity} units of product ID ${productId}`);
            } else {
                displayNotification(`Failed to request supply: ${data.message}`);
            }
        } catch (error) {
            console.error('Error requesting supply:', error);
        }
    }

    requestSupplyButton.addEventListener('click', (event) => {
        event.preventDefault();
        const productId = document.getElementById('productIdToRequest').value;
        const quantity = parseInt(document.getElementById('quantityToRequest').value);
        requestSupply(productId, quantity);
    });

    function clearInputFields() {
        document.getElementById('productName').value = '';
        document.getElementById('productDescription').value = '';
        document.getElementById('productPrice').value = '';
        document.getElementById('productStock').value = '';
        document.getElementById('productImageUrl').value = '';
    }

    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('userId');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = 'login.html';
    });

    homeButton.addEventListener('click', () => {
        window.location.href = 'marketplace.html';
    });

    accountButton.addEventListener('click', () => {
        window.location.href = 'account.html';
    });

    async function addProduct(name, description, price, stock, imageUrl) {
        try {
            const response = await fetch('http://localhost:3000/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, description, price, stock, image_url: imageUrl })
            });
            const data = await response.json();
            if (data.success) {
                displayNotification(`Product "${name}" added successfully.`);
                clearInputFields();
            } else {
                displayNotification(`Failed to add product: ${data.message}`);
            }
        } catch (error) {
            console.error('Error adding product:', error);
        }
    }

    async function fetchReceivedSupplies() {
        try {
            const response = await fetch('http://localhost:3000/api/received-supplies', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            return data.supplies;
        } catch (error) {
            console.error('Error fetching received supplies:', error);
            return [];
        }
    }

    async function displayReceivedSupplies() {
        const supplies = await fetchReceivedSupplies();
        receivedSuppliesList.innerHTML = '';
        supplies.forEach(supply => {
            const price = parseFloat(supply.price);
            const listItem = document.createElement('div');
            listItem.className = 'supply-item';
            listItem.innerHTML = `
                <div>
                    <img src="${supply.image_url}" alt="${supply.name}" width="50" height="50">
                    <span>${supply.name} - ${supply.description} - $${!isNaN(price) ? price.toFixed(2) : 'N/A'} - Stock: ${supply.stock}</span>
                </div>
            `;
            receivedSuppliesList.appendChild(listItem);
        });
        receivedSuppliesList.style.display = 'block';
    }

    async function fetchAllProducts() {
        try {
            const response = await fetch('http://localhost:3000/api/products', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            return data.products;
        } catch (error) {
            console.error('Error fetching products:', error);
            return [];
        }
    }

    async function displayAllProducts() {
        const products = await fetchAllProducts();
        productList.innerHTML = '';
        if (products && products.length > 0) {
            products.forEach(product => {
                const price = parseFloat(product.price);
                const productItem = document.createElement('div');
                productItem.className = 'product-item';
                productItem.innerHTML = `
                    <div>
                        <img src="${product.image_url}" alt="${product.name}" width="50" height="50">
                        <span>${product.name} - ${product.description} - $${!isNaN(price) ? price.toFixed(2) : 'N/A'} - Stock: ${product.stock}</span>
                    </div>
                `;
                productList.appendChild(productItem);
            });
        } else {
            productList.innerHTML = '<p>No products found.</p>';
        }
        productList.style.display = 'block';
    }

    async function sendMerchandise(customerId, productId, quantity) {
        try {
            const response = await fetch('http://localhost:3000/api/send-merchandise', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ customerId, productId, quantity })
            });
            const data = await response.json();
            if (data.success) {
                displayNotification(`Sent ${quantity} units of product ID ${productId} to customer ID ${customerId}`);
            } else {
                displayNotification(`Failed to send merchandise: ${data.message}`);
            }
        } catch (error) {
            console.error('Error sending merchandise:', error);
        }
    }

    addProductButton.addEventListener('click', (event) => {
        event.preventDefault();
        const name = document.getElementById('productName').value;
        const description = document.getElementById('productDescription').value;
        const price = parseFloat(document.getElementById('productPrice').value);
        const stock = parseInt(document.getElementById('productStock').value);
        const imageUrl = document.getElementById('productImageUrl').value;
        addProduct(name, description, price, stock, imageUrl);
    });

    showReceivedSuppliesButton.addEventListener('click', (event) => {
        event.preventDefault();
        suppliesVisible = !suppliesVisible;
        if (suppliesVisible) {
            displayReceivedSupplies();
        } else {
            receivedSuppliesList.style.display = 'none';
        }
    });

    listAllProductsButton.addEventListener('click', async (event) => {
        event.preventDefault();
        productsVisible = !productsVisible;
        if (productsVisible) {
            await displayAllProducts();
            listAllProductsButton.textContent = 'Hide All Products';
        } else {
            productList.style.display = 'none';
            listAllProductsButton.textContent = 'List All Products';
        }
    });

    sendMerchandiseButton.addEventListener('click', (event) => {
        event.preventDefault();
        const customerId = document.getElementById('customerId').value;
        const productId = document.getElementById('productIdToSend').value;
        const quantity = parseInt(document.getElementById('quantityToSend').value);
        sendMerchandise(customerId, productId, quantity);
    });
});
