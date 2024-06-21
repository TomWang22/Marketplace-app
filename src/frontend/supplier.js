document.addEventListener('DOMContentLoaded', async () => {
    const addSupplyButton = document.getElementById('addSupplyButton');
    const addSupplyByIdButton = document.getElementById('addSupplyByIdButton');
    const sendSuppliesButton = document.getElementById('sendSuppliesButton');
    const notificationsList = document.getElementById('notificationsList');
    const supplyRequestsList = document.getElementById('supplyRequestsList');
    const viewRequestsButton = document.getElementById('viewRequestsButton');
    const chatInput = document.getElementById('chatInput');
    const chatSendButton = document.getElementById('chatSendButton');
    const chatList = document.getElementById('chatList');
    const logoutButton = document.getElementById('logoutButton');
    const accountButton = document.getElementById('accountButton');
    const homeButton = document.getElementById('homeButton');
    const supplierAccountSection = document.getElementById('supplier-account-section');
    const supplierUsername = document.getElementById('supplierUsername');
    const supplierBalance = document.getElementById('supplierBalance');

    const supplierId = localStorage.getItem('userId');
    if (!supplierId) {
        console.error('Supplier ID is not set in local storage');
        return;
    }

    const socket = io('http://localhost:3000', {
        transports: ['websocket'],
        query: { userId: supplierId }
    });

    let requestsVisible = false;

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

    chatSendButton.addEventListener('click', () => {
        const message = chatInput.value;
        if (message) {
            socket.emit('sendMessage', { message, userId: supplierId, role: 'supplier' });
            chatInput.value = '';
        }
    });

    function displayNotification(message) {
        const listItem = document.createElement('li');
        listItem.textContent = message;
        notificationsList.appendChild(listItem);
    }

    viewRequestsButton.addEventListener('click', async () => {
        requestsVisible = !requestsVisible;
        if (requestsVisible) {
            await fetchSupplyRequests();
            supplyRequestsList.style.display = 'block';
        } else {
            supplyRequestsList.style.display = 'none';
        }
    });

    async function fetchSupplyRequests() {
        try {
            const response = await fetch('http://localhost:3000/api/supply-requests');
            const data = await response.json();
            supplyRequestsList.innerHTML = '';

            data.requests.forEach(request => {
                const listItem = document.createElement('div');
                listItem.className = 'request-item';
                listItem.innerHTML = `
                    <div>
                        <img src="${request.image_url}" alt="${request.name}" width="50" height="50">
                        <span>${request.name} - ${request.description} - Quantity: ${request.quantity} - Requested by Merchant ID: ${request.merchant_id}</span>
                        <button class="fulfillRequestButton" data-merchant-id="${request.merchant_id}" data-product-id="${request.product_id}" data-quantity="${request.quantity}">Fulfill</button>
                    </div>
                `;
                supplyRequestsList.appendChild(listItem);
            });

            document.querySelectorAll('.fulfillRequestButton').forEach(button => {
                button.addEventListener('click', (event) => {
                    const merchantId = button.getAttribute('data-merchant-id');
                    const productId = button.getAttribute('data-product-id');
                    const quantity = button.getAttribute('data-quantity');
                    sendSupplies(merchantId, productId, quantity);
                });
            });
        } catch (error) {
            console.error('Error fetching supply requests:', error);
        }
    }

    async function sendSupplies(merchantId, productId, quantity) {
        const supplierId = localStorage.getItem('userId');
        try {
            const response = await fetch('http://localhost:3000/api/send-supplies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ supplierId, merchantId, productId, quantity })
            });
            const data = await response.json();
            if (data.success) {
                displayNotification(`Sent ${quantity} units of product ID ${productId} to merchant ID ${merchantId}`);
                clearSendSuppliesForm();
                await fetchSupplyRequests(); // Refresh the supply requests list to show updated status
            } else {
                displayNotification(`Failed to send supplies: ${data.message}`);
                alert(`Failed to send supplies: ${data.message}`);
            }
        } catch (error) {
            console.error('Error sending supplies:', error);
            displayNotification('An error occurred while sending supplies.');
            alert('An error occurred while sending supplies.');
        }
    }

    function clearSendSuppliesForm() {
        document.getElementById('merchantId').value = '';
        document.getElementById('productIdToSupply').value = '';
        document.getElementById('quantityToSupply').value = '';
    }

    if (sendSuppliesButton) {
        sendSuppliesButton.addEventListener('click', () => {
            const merchantId = document.getElementById('merchantId').value;
            const productId = document.getElementById('productIdToSupply').value;
            const quantity = parseInt(document.getElementById('quantityToSupply').value);
            sendSupplies(merchantId, productId, quantity);
        });
    }

    async function addSupply(name, description, price, cost, stock, image_url) {
        const merchantId = localStorage.getItem('userId');
        try {
            const response = await fetch('http://localhost:3000/api/supplies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ name, description, price, cost, stock, image_url, merchantId })
            });
            const data = await response.json();
            if (data.success) {
                displayNotification(`Supply "${name}" added successfully.`);
                clearAddSupplyForm();
                alert(`Supply "${name}" added successfully.`);
            } else {
                displayNotification(`Failed to add supply: ${data.message}`);
                alert(`Failed to add supply: ${data.message}`);
            }
        } catch (error) {
            console.error('Error adding supply:', error);
            displayNotification('An error occurred while adding supply.');
            alert('An error occurred while adding supply.');
        }
    }

    async function addSupplyById(id, quantity) {
        try {
            const response = await fetch('http://localhost:3000/api/add-supply-by-id', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ id, quantity })
            });
            const data = await response.json();
            if (data.success) {
                displayNotification(`Supply with ID "${id}" added successfully.`);
                clearAddSupplyByIdForm();
                alert(`Supply with ID "${id}" added successfully.`);
            } else {
                displayNotification(`Failed to add supply: ${data.message}`);
                alert(`Failed to add supply: ${data.message}`);
            }
        } catch (error) {
            console.error('Error adding supply by ID:', error);
            displayNotification('An error occurred while adding supply by ID.');
            alert('An error occurred while adding supply by ID.');
        }
    }

    function clearAddSupplyForm() {
        document.getElementById('supplyName').value = '';
        document.getElementById('supplyDescription').value = '';
        document.getElementById('supplyPrice').value = '';
        document.getElementById('supplyCost').value = '';
        document.getElementById('supplyStock').value = '';
        document.getElementById('supplyImageUrl').value = '';
    }

    function clearAddSupplyByIdForm() {
        document.getElementById('supplyId').value = '';
        document.getElementById('supplyQuantity').value = '';
    }

    if (addSupplyButton) {
        addSupplyButton.addEventListener('click', () => {
            const name = document.getElementById('supplyName').value;
            const description = document.getElementById('supplyDescription').value;
            const price = parseFloat(document.getElementById('supplyPrice').value);
            const cost = parseFloat(document.getElementById('supplyCost').value);
            const stock = parseInt(document.getElementById('supplyStock').value);
            const image_url = document.getElementById('supplyImageUrl').value;
            addSupply(name, description, price, cost, stock, image_url);
        });
    }

    if (addSupplyByIdButton) {
        addSupplyByIdButton.addEventListener('click', () => {
            const id = document.getElementById('supplyId').value;
            const quantity = parseInt(document.getElementById('supplyQuantity').value);
            addSupplyById(id, quantity);
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('userId');
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            window.location.href = 'login.html';
        });
    }

    if (homeButton) {
        homeButton.addEventListener('click', () => {
            window.location.href = 'marketplace.html';
        });
    }

    if (accountButton) {
        accountButton.addEventListener('click', async () => {
            await displaySupplierAccountInfo();
        });
    }

    async function fetchSupplierData(supplierId) {
        try {
            const response = await fetch(`http://localhost:3000/api/account-info?userId=${supplierId}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            if (data.success) {
                return data.account;
            } else {
                console.error('Failed to fetch supplier data:', data.message);
                return null;
            }
        } catch (error) {
            console.error('Error fetching supplier data:', error);
            return null;
        }
    }

    async function displaySupplierAccountInfo() {
        const supplierData = await fetchSupplierData(supplierId);
        if (supplierData) {
            supplierUsername.textContent = supplierData.username || 'N/A';
            const balance = parseFloat(supplierData.balance);
            supplierBalance.textContent = isNaN(balance) ? '0.00' : balance.toFixed(2);
            // Add more account details here if needed
        } else {
            supplierUsername.textContent = 'N/A';
            supplierBalance.textContent = '0.00';
        }

        // Show account section and hide other sections if necessary
        supplierAccountSection.style.display = 'block';
        document.getElementById('send-supplies-section').style.display = 'none';
        document.getElementById('add-supplies-section').style.display = 'none';
        document.getElementById('view-requests-section').style.display = 'none';
        document.getElementById('add-supplies-id-quantity-section').style.display = 'none';
        chatContainer.style.display = 'none';
    }
});
