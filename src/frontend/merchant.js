document.addEventListener('DOMContentLoaded', async () => {
    const addProductButton = document.getElementById('addProductButton');
    const showReceivedSuppliesButton = document.getElementById('showReceivedSuppliesButton');
    const listAllProductsButton = document.getElementById('listAllProductsButton');
    const sendMerchandiseButton = document.getElementById('sendMerchandiseButton');
    const notificationsList = document.getElementById('notificationsList');
    const receivedSuppliesList = document.getElementById('receivedSuppliesList');
    const productList = document.getElementById('productList');

    // Function to display notifications
    function displayNotification(message) {
        const listItem = document.createElement('li');
        listItem.textContent = message;
        notificationsList.appendChild(listItem);
    }

    // Function to clear input fields
    function clearInputFields() {
        document.getElementById('productName').value = '';
        document.getElementById('productDescription').value = '';
        document.getElementById('productPrice').value = '';
        document.getElementById('productStock').value = '';
        document.getElementById('productImageUrl').value = '';
    }

    // Function to add a new product
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
            const listItem = document.createElement('div');
            listItem.className = 'supply-item';
            listItem.innerHTML = `
                <div>
                    <img src="${supply.image_url}" alt="${supply.name}" width="50" height="50">
                    <span>${supply.name} - ${supply.description} - $${supply.price.toFixed(2)} - Stock: ${supply.stock}</span>
                </div>
            `;
            receivedSuppliesList.appendChild(listItem);
        });

        receivedSuppliesList.style.display = 'block';
    }

    // Function to fetch all products from the database
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

    // Function to display all products
    async function displayAllProducts() {
        const products = await fetchAllProducts();
        productList.innerHTML = ''; // Clear existing items

        products.forEach(product => {
            const productItem = document.createElement('div');
            productItem.className = 'product-item';
            productItem.innerHTML = `
                <div>
                    <img src="${product.image_url}" alt="${product.name}" width="50" height="50">
                    <span>${product.name} - ${product.description} - $${product.price.toFixed(2)} - Stock: ${product.stock}</span>
                </div>
            `;
            productList.appendChild(productItem);
        });

        productList.style.display = 'block';
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
    addProductButton.addEventListener('click', (event) => {
        event.preventDefault();
        const name = document.getElementById('productName').value;
        const description = document.getElementById('productDescription').value;
        const price = parseFloat(document.getElementById('productPrice').value);
        const stock = parseInt(document.getElementById('productStock').value);
        const imageUrl = document.getElementById('productImageUrl').value;
        addProduct(name, description, price, stock, imageUrl);
    });

    showReceivedSuppliesButton.addEventListener('click', displayReceivedSupplies);

    listAllProductsButton.addEventListener('click', displayAllProducts);

    sendMerchandiseButton.addEventListener('click', (event) => {
        event.preventDefault();
        const customerId = document.getElementById('customerId').value;
        const productId = document.getElementById('productIdToSend').value;
        const quantity = parseInt(document.getElementById('quantityToSend').value);
        sendMerchandise(customerId, productId, quantity);
    });
});
