document.addEventListener('DOMContentLoaded', async () => {
    const sendSuppliesButton = document.getElementById('sendSuppliesButton');
    const addSupplyButton = document.getElementById('addSupplyButton');
    const notificationsList = document.getElementById('notificationsList');
    const usernameSpan = document.getElementById('username');
    const viewRequestsButton = document.getElementById('viewRequestsButton');
    const supplyRequestsList = document.getElementById('supplyRequestsList');


    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    const logoutButton = document.getElementById('logoutButton');

    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('userId');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = 'login.html';
    });

    async function fetchSupplyRequests() {
        try {
            const response = await fetch('http://localhost:3000/api/supply-requests', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            return data.requests;
        } catch (error) {
            console.error('Error fetching supply requests:', error);
            return [];
        }
    }
   // Function to display supply requests
   async function displaySupplyRequests() {
    const requests = await fetchSupplyRequests();
    supplyRequestsList.innerHTML = '';

    requests.forEach(request => {
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
}

    // Add event listener for the view requests button
    viewRequestsButton.addEventListener('click', async (event) => {
        event.preventDefault();
        if (supplyRequestsList.style.display === 'none' || supplyRequestsList.style.display === '') {
            await displaySupplyRequests();
            supplyRequestsList.style.display = 'block';
        } else {
            supplyRequestsList.style.display = 'none';
        }
    });
    
    async function getCurrentUser() {
        try {
            const response = await fetch('http://localhost:3000/api/current-user', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching current user:', error);
            return null;
        }
    }

    function displayNotification(message) {
        const listItem = document.createElement('li');
        listItem.textContent = message;
        notificationsList.appendChild(listItem);
    }

    async function addSupply(name, description, price, cost, stock, image_url) {
        try {
            const response = await fetch('http://localhost:3000/api/supplies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, description, price, cost, stock, image_url })
            });
            const data = await response.json();
            if (data.success) {
                displayNotification(`Supply "${name}" added successfully.`);
            } else {
                displayNotification(`Failed to add supply: ${data.message}`);
            }
        } catch (error) {
            console.error('Error adding supply:', error);
            displayNotification('An error occurred while adding supply.');
        }
    }

    async function sendSupplies(merchantId, productId, quantity) {
        try {
            const response = await fetch('http://localhost:3000/api/receive-supplies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ merchantId, productId, quantity })
            });
            const data = await response.json();
            if (data.success) {
                displayNotification(`Sent ${quantity} units of product ID ${productId} to merchant ID ${merchantId}`);
            } else {
                displayNotification(`Failed to send supplies: ${data.message}`);
            }
        } catch (error) {
            console.error('Error sending supplies:', error);
            displayNotification('An error occurred while sending supplies.');
        }
    }

    const user = await getCurrentUser();
    if (user) {
        usernameSpan.textContent = user.username;
    }

    addSupplyButton.addEventListener('click', () => {
        const name = document.getElementById('supplyName').value;
        const description = document.getElementById('supplyDescription').value;
        const price = document.getElementById('supplyPrice').value;
        const cost = document.getElementById('supplyCost').value;
        const stock = document.getElementById('supplyStock').value;
        const image_url = document.getElementById('supplyImageUrl').value;
        addSupply(name, description, price, cost, stock, image_url);
    });

    sendSuppliesButton.addEventListener('click', () => {
        const merchantId = document.getElementById('merchantId').value;
        const productId = document.getElementById('productIdToSupply').value;
        const quantity = document.getElementById('quantityToSupply').value;
        sendSupplies(merchantId, productId, quantity);
    });
});
