document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    async function fetchProductDetails(productId) {
        const products = JSON.parse(localStorage.getItem('products'));
        return products.find(product => product.id == productId);
    }

    async function displayProductDetails() {
        const product = await fetchProductDetails(productId);
        const productDetailsSection = document.querySelector('#product-details');

        if (!product) {
            productDetailsSection.innerHTML = '<p>Product not found.</p>';
            return;
        }

        productDetailsSection.innerHTML = `
            <img src="${product.image_url}" alt="${product.name}">
            <h1>${product.name}</h1>
            <p>${product.description}</p>
            <p>$${product.price.toFixed(2)}</p>
            <button id="addToCartButton">Add to Cart</button>
        `;

        document.getElementById('addToCartButton').addEventListener('click', async () => {
            await addToCart(product.id);
        });
    }

    async function addToCart(productId) {
        const userId = localStorage.getItem('userId');
        try {
            const response = await fetch('http://localhost:3000/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId, productId, quantity: 1 })
            });
            const data = await response.json();
            if (data.success) {
                alert('Item added to cart!');
            } else {
                alert('Failed to add item to cart.');
            }
        } catch (error) {
            console.error('Error adding item to cart:', error);
            alert('Error adding item to cart.');
        }
    }

    displayProductDetails();
});
