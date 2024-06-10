document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    /*
    if (!userId || !token) {
        alert('User not logged in!');
        window.location.href = '/login.html';
        return;
    }
    */

    const productGrid = document.querySelector('.product-grid');
    const cartItemCount = document.getElementById('cartItemCount');

    // Function to fetch products from the database
    async function fetchProducts() {
        try {
            const response = await fetch('http://localhost:3000/api/products', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            if (data.success) {
                return data.products;
            } else {
                console.error('Failed to fetch products:', data.message);
                return [];
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            return [];
        }
    }

    // Function to fetch cart items from the server
    const fetchCartItems = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/cart?userId=${userId}`);
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

        if (products.length === 0) {
            productGrid.innerHTML = '<p>No products available.</p>';
            return;
        }

        products.forEach(product => {
            const productElement = document.createElement('div');
            productElement.className = 'product';
            productElement.innerHTML = `
                <img src="${product.image}" alt="${product.name}">
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
