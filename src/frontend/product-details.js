document.addEventListener('DOMContentLoaded', async () => {
    const productDetails = document.getElementById('product-details');
    const productImage = document.getElementById('productImage');
    const productName = document.getElementById('productName');
    const productDescription = document.getElementById('productDescription');
    const productPrice = document.getElementById('productPrice');
    const sizeSelect = document.getElementById('size');
    const quantityInput = document.getElementById('quantity');
    const addToCartForm = document.getElementById('add-to-cart-form');
    const specificationsList = document.getElementById('specifications-list');
    const reviewsSummary = document.getElementById('reviews-summary');
    const reviewsList = document.getElementById('reviews-list');
    const relatedProductsList = document.getElementById('related-products-list');

    const productId = new URLSearchParams(window.location.search).get('id');

    async function fetchProductDetails(productId) {
        const response = await fetch(`http://localhost:3000/api/products/${productId}`);
        const product = await response.json();
        localStorage.setItem('productDetails', JSON.stringify(product));
        return product;
    }

    async function fetchRelatedProducts(productId) {
        const response = await fetch(`http://localhost:3000/api/products`);
        const products = await response.json();
        return products.filter(p => p.id !== productId);
    }

    const sizeOptionsMap = {
        "suit": ["36 Short", "36 Regular", "36 Long", "38 Short", "38 Regular", "38 Long", "40 Short", "40 Regular", "40 Long", "42 Short", "42 Regular", "42 Long", "44 Short", "44 Regular", "44 Long", "46 Short", "46 Regular", "46 Long", "48 Short", "48 Regular", "48 Long", "50 Short", "50 Regular", "50 Long"],
        "tux": ["36 Short", "36 Regular", "36 Long", "38 Short", "38 Regular", "38 Long", "40 Short", "40 Regular", "40 Long", "42 Short", "42 Regular", "42 Long", "44 Short", "44 Regular", "44 Long", "46 Short", "46 Regular", "46 Long", "48 Short", "48 Regular", "48 Long", "50 Short", "50 Regular", "50 Long"],
        "tuxedo": ["36 Short", "36 Regular", "36 Long", "38 Short", "38 Regular", "38 Long", "40 Short", "40 Regular", "40 Long", "42 Short", "42 Regular", "42 Long", "44 Short", "44 Regular", "44 Long", "46 Short", "46 Regular", "46 Long", "48 Short", "48 Regular", "48 Long", "50 Short", "50 Regular", "50 Long"],
        "sport coat": ["36 Short", "36 Regular", "36 Long", "38 Short", "38 Regular", "38 Long", "40 Short", "40 Regular", "40 Long", "42 Short", "42 Regular", "42 Long", "44 Short", "44 Regular", "44 Long", "46 Short", "46 Regular", "46 Long", "48 Short", "48 Regular", "48 Long", "50 Short", "50 Regular", "50 Long"],
        "dress suit": ["36 Short", "36 Regular", "36 Long", "38 Short", "38 Regular", "38 Long", "40 Short", "40 Regular", "40 Long", "42 Short", "42 Regular", "42 Long", "44 Short", "44 Regular", "44 Long", "46 Short", "46 Regular", "46 Long", "48 Short", "48 Regular", "48 Long", "50 Short", "50 Regular", "50 Long"],
        "blazer": ["36 Short", "36 Regular", "36 Long", "38 Short", "38 Regular", "38 Long", "40 Short", "40 Regular", "40 Long", "42 Short", "42 Regular", "42 Long", "44 Short", "44 Regular", "44 Long", "46 Short", "46 Regular", "46 Long", "48 Short", "48 Regular", "48 Long", "50 Short", "50 Regular", "50 Long"],
        "dress shirt": ["XS", "S", "M", "L", "XL"],
        "short sleeve shirt": ["XS", "S", "M", "L", "XL"]
    };

    function getSizeOptions(productType) {
        return sizeOptionsMap[productType] || ["One Size"];
    }

    function populateSizeOptions(productType) {
        const sizes = getSizeOptions(productType);
        sizeSelect.innerHTML = sizes.map(size => `<option value="${size}">${size}</option>`).join('');
    }

    function populateQuantityOptions(maxQuantity) {
        quantityInput.max = maxQuantity;
    }

    addToCartForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const size = sizeSelect.value;
        const quantity = parseInt(quantityInput.value, 10);
        const userId = localStorage.getItem('userId'); // Ensure this is defined

        const cartItem = {
            userId,
            productId,
            size,
            quantity
        };

        await fetch('http://localhost:3000/api/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cartItem)
        });

        alert('Item added to cart');
    });

    async function displayProductDetails() {
        const product = await fetchProductDetails(productId);
        productImage.src = product.image_url;
        productName.textContent = product.name;
        productDescription.textContent = product.description;
        productPrice.textContent = `$${product.price.toFixed(2)}`;

        populateSizeOptions(product.type);
        populateQuantityOptions(product.stock_quantity);

        specificationsList.innerHTML = product.specifications.map(spec => `<li>${spec}</li>`).join('');

        const reviews = JSON.parse(localStorage.getItem('reviews')) || [];
        const productReviews = reviews.filter(review => review.productId === product.id);

        const averageRating = productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length || 0;
        reviewsSummary.querySelector('#average-rating').textContent = `Average Rating: ${averageRating.toFixed(1)}`;
        reviewsSummary.querySelector('#total-reviews').textContent = `Total Reviews: ${productReviews.length}`;

        reviewsList.innerHTML = productReviews.map(review => `
            <div class="review">
                <p><strong>${review.username}</strong> (${review.date}):</p>
                <p>Rating: ${review.rating}</p>
                <p>${review.text}</p>
            </div>
        `).join('');

        const relatedProducts = await fetchRelatedProducts(product.id);
        relatedProductsList.innerHTML = relatedProducts.slice(0, 3).map(relatedProduct => `
            <div class="related-product">
                <img src="${relatedProduct.image_url}" alt="${relatedProduct.name}">
                <p>${relatedProduct.name}</p>
                <p>$${relatedProduct.price.toFixed(2)}</p>
            </div>
        `).join('');
    }

    displayProductDetails();
});
