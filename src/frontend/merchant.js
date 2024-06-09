document.addEventListener('DOMContentLoaded', () => {
    const addProductButton = document.getElementById('addProductButton');
    const receiveSuppliesButton = document.getElementById('receiveSuppliesButton');
    const sendMerchandiseButton = document.getElementById('sendMerchandiseButton');

    // Function to add a new product
    async function addProduct(name, description, price, stock) {
        try {
            const response = await fetch('http://localhost:3000/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, description, price, stock })
            });
            const data = await response.json();
            if (data.success) {
                displayNotification(`Product "${name}" added successfully.`);
            } else {
                displayNotification(`Failed to add product: ${data.message}`);
            }
        } catch (error) {
            console.error('Error adding product:', error);
        }
    }

    // Function to receive supplies
    async function receiveSupplies(productId, quantity) {
        try {
            const response = await fetch('http://localhost:3000/api/receive-supplies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ productId, quantity })
            });
            const data = await response.json();
            if (data.success) {
                displayNotification(`Received ${quantity} units of product ID ${productId}`);
            } else {
                displayNotification(`Failed to receive supplies: ${data.message}`);
            }
        } catch (error) {
            console.error('Error receiving supplies:', error);
        }
    }

    // Function to send merchandise
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

    // Function to display notifications
    function displayNotification(message) {
        const notificationsList = document.getElementById('notificationsList');
        const listItem = document.createElement('li');
        listItem.textContent = message;
        notificationsList.appendChild(listItem);
    }

    // Add event listeners for buttons
    addProductButton.addEventListener('click', () => {
        const name = document.getElementById('productName').value;
        const description = document.getElementById('productDescription').value;
        const price = document.getElementById('productPrice').value;
        const stock = document.getElementById('productStock').value;
        addProduct(name, description, price, stock);
    });

    receiveSuppliesButton.addEventListener('click', () => {
        const productId = document.getElementById('productId').value;
        const quantity = document.getElementById('quantity').value;
        receiveSupplies(productId, quantity);
    });

    sendMerchandiseButton.addEventListener('click', () => {
        const customerId = document.getElementById('customerId').value;
        const productId = document.getElementById('productIdToSend').value;
        const quantity = document.getElementById('quantityToSend').value;
        sendMerchandise(customerId, productId, quantity);
    });
});
