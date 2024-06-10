document.addEventListener('DOMContentLoaded', () => {
    // Removed login requirement for testing
    // const userId = localStorage.getItem('userId');
    // const token = localStorage.getItem('token');

     /*
    if (!userId || !token) {
        alert('User not logged in!');
        window.location.href = '/login.html';
        return;
    }
    */


    const productGrid = document.querySelector('.product-listings .product-grid');
    const cartItemCount = document.getElementById('cartItemCount');

    // Function to fetch products from the database
    async function fetchProducts() {
        try {
            const response = await fetch('http://localhost:3000/api/products', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                    // 'Authorization': `Bearer ${token}` // Removed for testing
                }
            });
            const data = await response.json();
            console.log('Fetched products:', data);  // Add this log
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
        console.log('Products to display:', products);  // Add this log
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
