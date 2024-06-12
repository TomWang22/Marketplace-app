document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role'); // Assuming you store the user's role in localStorage

    const productGrid = document.querySelector('.product-listings .product-grid');
    const cartItemCount = document.getElementById('cartItemCount');
    const homeButton = document.getElementById('homeButton');

    homeButton.addEventListener('click', () => {
        if (role === 'merchant') {
            window.location.href = 'merchant.html';
        } else if (role === 'supplier') {
            window.location.href = 'supplier.html';
        } else if (role === 'shopper') {
            window.location.href = 'shopper.html';
        } else {
            alert('Unknown role. Cannot redirect.');
        }
    });

    // Function to fetch products from the database
    async function fetchProducts() {
        try {
            console.log('Fetching products...');
            const response = await fetch('http://localhost:3000/api/products', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            console.log('Fetched products:', data);
            return data.products;
        } catch (error) {
            console.error('Error fetching products:', error);
            return [];
        }
    }

    // Function to fetch cart items from the server
    const fetchCartItems = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/cart'); // Simplified for testing
            const data = await response.json();
            return data.items;
        } catch (error) {
            console.error('Error fetching cart items:', error);
            return [];
        }
    };

    // Function to display products
    async function displayProducts() {
        const products = await fetchProducts();
        console.log('Products to display:', products);
        if (!products.length) {
            productGrid.innerHTML = '<p>No products available.</p>';
            return;
        }
        products.forEach(product => {
            const productElement = document.createElement('div');
            productElement.className = 'product';
            productElement.innerHTML = `
                <img src="${product.image_url}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <p>$${product.price.toFixed(2)}</p>
                <button>Add to Cart</button>
                <button>View Details</button>
            `;
            console.log('Appending product element:', productElement);
            productGrid.appendChild(productElement);
        });
    }

    // Function to update cart item count
    async function updateCartItemCount() {
        const cartItems = await fetchCartItems();
        cartItemCount.textContent = cartItems.length;
    }

    displayProducts();
    updateCartItemCount();
});
