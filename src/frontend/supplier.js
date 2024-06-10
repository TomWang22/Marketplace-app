document.addEventListener('DOMContentLoaded', async () => {
    const sendSuppliesButton = document.getElementById('sendSuppliesButton');
    const addSupplyButton = document.getElementById('addSupplyButton');
    const notificationsList = document.getElementById('notificationsList');

    // Function to display notifications
    function displayNotification(message) {
        const listItem = document.createElement('li');
        listItem.textContent = message;
        notificationsList.appendChild(listItem);
    }

    // Function to add a new supply
    async function addSupply(name, description, price, cost, stock, image_url) {
        try {
            const response = await fetch('http://localhost:3000/api/add-supply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
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
        }
    }

    // Function to send supplies to a merchant
    async function sendSupplies(merchantId, productId, quantity) {
        try {
            const response = await fetch('http://localhost:3000/api/send-supplies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
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
        }
    }

    // Add event listeners for buttons
    addSupplyButton.addEventListener('click', () => {
        const name = document.getElementById('supplyName').value;
        const description = document.getElementById('supplyDescription').value;
        const price = document.getElementById('supplyPrice').value;
        const cost = document.getElementById('supplyCost').value;
        const stock = document.getElementById('supplyStock').value;
        const image_url = document.getElementById('supplyImageURL').value;
        addSupply(name, description, price, cost, stock, image_url);
    });

    sendSuppliesButton.addEventListener('click', () => {
        const merchantId = document.getElementById('merchantId').value;
        const productId = document.getElementById('productIdToSend').value;
        const quantity = document.getElementById('quantityToSend').value;
        sendSupplies(merchantId, productId, quantity);
    });
});
