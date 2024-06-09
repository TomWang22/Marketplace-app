document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    if (!userId || !token) {
        alert('User not logged in!');
        window.location.href = '/login.html';
        return;
    }

    const productGrid = document.querySelector('.product-listings .product-grid');

    // Function to fetch products from the database
    async function fetchProducts() {
        try {
            const response = await fetch('http://localhost:3000/api/products', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            return data.products;
        } catch (error) {
            console.error('Error fetching products:', error);
            return [];
        }
    }

    // Function to display products
    async function displayProducts() {
        const products = await fetchProducts();

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

    displayProducts();
});
