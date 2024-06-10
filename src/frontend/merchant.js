document.addEventListener('DOMContentLoaded', async () => {
    const addProductButton = document.getElementById('addProductButton');
    const viewReceivedSuppliesButton = document.getElementById('viewReceivedSuppliesButton');
    const sendMerchandiseButton = document.getElementById('sendMerchandiseButton');
    const notificationsList = document.getElementById('notificationsList');
    const receivedSuppliesList = document.getElementById('receivedSuppliesList');

    // Function to display notifications
    function displayNotification(message) {
        const listItem = document.createElement('li');
        listItem.textContent = message;
        notificationsList.appendChild(listItem);
    }

    // Function to add a new product
    async function addProduct(name, description, price, stock, image_url) {
        try {
            const response = await fetch('http://localhost:3000/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, description, price, stock, image_url })
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

    // Function to fetch received supplies from the database
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

    // Function to display received supplies
    async function displayReceivedSupplies() {
        const supplies = await fetchReceivedSupplies();
        receivedSuppliesList.innerHTML = ''; // Clear existing items

        supplies.forEach(supply => {
            const listItem = document.createElement('li');
            listItem.className = 'supply-item';
            listItem.innerHTML = `
                <div>
                    <img src="${supply.image_url}" alt="${supply.name}" width="50" height="50">
                    <span>${supply.name} - ${supply.description} - $${supply.price.toFixed(2)} - Stock: ${supply.stock}</span>
                </div>
                <div class="supply-details" style="display: none;">
                    <p>${supply.description}</p>
                    <p>Price: $${supply.price.toFixed(2)}</p>
                    <p>Stock: ${supply.stock}</p>
                </div>
            `;
            receivedSuppliesList.appendChild(listItem);

            listItem.addEventListener('click', () => {
                const details = listItem.querySelector('.supply-details');
                details.style.display = details.style.display === 'none' ? 'block' : 'none';
            });
        });
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

    // Add event listeners for buttons
    addProductButton.addEventListener('click', () => {
        const name = document.getElementById('productName').value;
        const description = document.getElementById('productDescription').value;
        const price = document.getElementById('productPrice').value;
        const stock = document.getElementById('productStock').value;
        const image_url = document.getElementById('productImageUrl').value;
        addProduct(name, description, price, stock, image_url);
    });

    viewReceivedSuppliesButton.addEventListener('click', displayReceivedSupplies);

    sendMerchandiseButton.addEventListener('click', () => {
        const customerId = document.getElementById('customerId').value;
        const productId = document.getElementById('productIdToSend').value;
        const quantity = document.getElementById('quantityToSend').value;
        sendMerchandise(customerId, productId, quantity);
    });
});
