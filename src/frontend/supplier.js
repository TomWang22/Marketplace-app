document.addEventListener('DOMContentLoaded', async () => {
    const sendSuppliesButton = document.getElementById('sendSuppliesButton');
    const addSupplyButton = document.getElementById('addSupplyButton');
    const notificationsList = document.getElementById('notificationsList');
    const usernameSpan = document.getElementById('username');

    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

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
