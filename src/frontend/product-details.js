document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    async function fetchProductDetails(productId) {
        const products = JSON.parse(localStorage.getItem('products'));
        return products.find(product => product.id == productId);
    }

    async function fetchProductReviews(productId) {
        const reviews = JSON.parse(localStorage.getItem('reviews'));
        return reviews.filter(review => review.productId == productId);
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
            <label for="sizeSelect">Select Size:</label>
            <select id="sizeSelect">
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
            </select>
            <button id="addToCartButton">Add to Cart</button>
        `;

        document.getElementById('addToCartButton').addEventListener('click', async () => {
            await addToCart(product.id);
        });

        // Display additional product details like specifications, reviews, and related products
        displayProductSpecifications(product);
        displayProductReviews(productId);
        displayRelatedProducts(product);
    }

    async function addToCart(productId) {
        const userId = localStorage.getItem('userId');
        const size = document.getElementById('sizeSelect').value;
        try {
            const response = await fetch('http://localhost:3000/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId, productId, quantity: 1, size })
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

    function displayProductSpecifications(product) {
        const specificationsList = document.getElementById('specifications-list');
        specificationsList.innerHTML = `
            <li><strong>Material:</strong> Cotton</li>
            <li><strong>Color:</strong> ${product.name.split(' ')[1]}</li>
            <li><strong>Size:</strong> S, M, L, XL</li>
            <li><strong>Weight:</strong> 200g</li>
            <!-- Add more specifications as needed -->
        `;
    }

    function highlightKeywords(reviewText, keywords) {
        let highlightedText = reviewText;
        keywords.forEach(keyword => {
            const regex = new RegExp(`(${keyword})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<span class="highlight">$1</span>');
        });
        return highlightedText;
    }

    async function displayProductReviews(productId) {
        const reviewsList = document.getElementById('reviews-list');
        const reviewsSummary = document.getElementById('reviews-summary');
        const reviews = await fetchProductReviews(productId);

        if (reviews.length === 0) {
            reviewsList.innerHTML = '<p>No reviews available.</p>';
            reviewsSummary.innerHTML = '<p>Average Rating: N/A</p><p>Total Reviews: 0</p>';
            return;
        }

        // Sort reviews by date (newest first)
        reviews.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Calculate average rating
        const averageRating = (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(2);

        reviewsSummary.innerHTML = `<p>Average Rating: ${averageRating}</p><p>Total Reviews: ${reviews.length}</p>`;

        reviewsList.innerHTML = '';
        reviews.forEach(review => {
            const reviewElement = document.createElement('div');
            reviewElement.className = 'review';
            reviewElement.innerHTML = `
                <p><strong>${review.username}:</strong> ${highlightKeywords(review.text, ['great', 'good', 'bad', 'excellent'])}</p>
                <p>${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</p>
                <p><small>${new Date(review.date).toLocaleDateString()}</small></p>
            `;
            reviewsList.appendChild(reviewElement);
        });
    }

    function displayRelatedProducts(product) {
        const relatedProductsList = document.getElementById('related-products-list');
        const products = JSON.parse(localStorage.getItem('products')).filter(p => p.id !== product.id);
        
        relatedProductsList.innerHTML = products.slice(0, 3).map(relatedProduct => `
            <div class="related-product">
                <img src="${relatedProduct.image_url}" alt="${relatedProduct.name}">
                <p>${relatedProduct.name}</p>
                <p>$${relatedProduct.price.toFixed(2)}</p>
            </div>
        `).join('');
    }

    // Example of adding reviews to localStorage
    function addSampleReviewsToLocalStorage() {
        const sampleReviews = [
            {
                productId: 1,
                username: 'John Doe',
                text: 'Great product, highly recommend!',
                rating: 5,
                date: '2023-06-01'
            },
            {
                productId: 1,
                username: 'Jane Smith',
                text: 'Good value for the price.',
                rating: 4,
                date: '2023-05-20'
            },
            {
                productId: 2,
                username: 'Alice Johnson',
                text: 'Not satisfied with the quality.',
                rating: 2,
                date: '2023-04-15'
            }
            // Add more reviews as needed
        ];
        localStorage.setItem('reviews', JSON.stringify(sampleReviews));
    }

    // Call this function to add sample reviews if not already in localStorage
    if (!localStorage.getItem('reviews')) {
        addSampleReviewsToLocalStorage();
    }

    displayProductDetails();
});
