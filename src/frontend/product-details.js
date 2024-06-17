document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    const cartItemCount = document.getElementById('cartItemCount');

    // Fetch product details from local storage
    async function fetchProductDetails(productId) {
        const products = JSON.parse(localStorage.getItem('products'));
        return products.find(product => product.id == productId);
    }

    // Fetch product reviews from local storage
    async function fetchProductReviews(productId) {
        const reviews = JSON.parse(localStorage.getItem('reviews'));
        return reviews.filter(review => review.productId == productId);
    }

    // Fetch cart items count
    async function fetchCartItems() {
        const userId = localStorage.getItem('userId');
        try {
            const response = await fetch(`http://localhost:3000/api/cart?userId=${userId}`);
            const data = await response.json();
            if (data.success) {
                return data.items;
            } else {
                console.error('Failed to fetch cart items:', data.message);
                return [];
            }
        } catch (error) {
            console.error('Error fetching cart items:', error);
            return [];
        }
    }

    // Update cart item count
    async function updateCartItemCount() {
        const cartItems = await fetchCartItems();
        console.log('Cart Items:', cartItems); // Debugging log
        cartItemCount.textContent = cartItems.length;
    }

    // Display product details on the page
    async function displayProductDetails() {
        try {
            const product = await fetchProductDetails(productId);
            if (!product) throw new Error('Product not found');
            const productDetailsSection = document.querySelector('#product-details');
            productDetailsSection.innerHTML = `
                <img src="${product.image_url}" alt="${product.name}">
                <h1>${product.name}</h1>
                <p>${product.description}</p>
                <p>$${product.price.toFixed(2)}</p>
                <label for="sizeSelect">Select Size:</label>
                <select id="sizeSelect">${getSizeOptions(product.name).map(size => `<option value="${size}">${size}</option>`).join('')}</select>
                <label for="quantityInput">Quantity:</label>
                <input type="number" id="quantityInput" min="1" value="1">
                <button id="addToCartButton">Add to Cart</button>
            `;
            document.getElementById('addToCartButton').addEventListener('click', async () => {
                await addToCart(product.id);
            });

            displayProductSpecifications(product);
            displayProductReviews(productId);
            displayRelatedProducts(product);
        } catch (error) {
            console.error('Error displaying product details:', error);
        }
    }

    // Add product to cart
    async function addToCart(productId) {
        const userId = localStorage.getItem('userId');
        const size = document.getElementById('sizeSelect').value;
        const quantity = parseInt(document.getElementById('quantityInput').value, 10);
        try {
            const response = await fetch('http://localhost:3000/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId, productId, quantity, size })
            });
            const data = await response.json();
            if (data.success) {
                await updateCartItemCount(); // Update cart item count after adding item
                alert('Item added to cart');
            } else {
                alert('Failed to add item to cart');
            }
        } catch (error) {
            console.error('Error adding item to cart:', error);
            alert('Error adding item to cart');
        }
    }

    // Display product specifications
    function displayProductSpecifications(product) {
        const specificationsList = document.getElementById('specifications-list');
        specificationsList.innerHTML = `
            <li><strong>Material:</strong> Cotton</li>
            <li><strong>Color:</strong> ${product.name.split(' ')[1]}</li>
            <li><strong>Size:</strong> S, M, L, XL</li>
            <li><strong>Weight:</strong> 200g</li>
        `;
    }

    // Highlight keywords in review text
    function highlightKeywords(reviewText, keywords) {
        let highlightedText = reviewText;
        keywords.forEach(keyword => {
            const regex = new RegExp(`(${keyword})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<span class="highlight">$1</span>');
        });
        return highlightedText;
    }

    // Display product reviews
    async function displayProductReviews(productId) {
        const reviewsList = document.getElementById('reviews-list');
        const reviewsSummary = document.getElementById('reviews-summary');
        try {
            const reviews = await fetchProductReviews(productId);

            if (reviews.length === 0) {
                reviewsList.innerHTML = '<p>No reviews available.</p>';
                reviewsSummary.innerHTML = '<p>Average Rating: N/A</p><p>Total Reviews: 0</p>';
                return;
            }

            reviews.sort((a, b) => new Date(b.date) - new Date(a.date));

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
        } catch (error) {
            console.error('Error displaying reviews:', error);
        }
    }

    // Display related products
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

    // Generate size options based on product type
    function getSizeOptions(productType) {
        const sizeOptionsMap = {
            "suit": ["36 Short", "36 Regular", "36 Long", "38 Short", "38 Regular", "38 Long", "40 Short", "40 Regular", "40 Long", "42 Short", "42 Regular", "42 Long", "44 Short", "44 Regular", "44 Long", "46 Short", "46 Regular", "46 Long", "48 Short", "48 Regular", "48 Long", "50 Short", "50 Regular", "50 Long"],
            "tux": ["36 Short", "36 Regular", "36 Long", "38 Short", "38 Regular", "38 Long", "40 Short", "40 Regular", "40 Long", "42 Short", "42 Regular", "42 Long", "44 Short", "44 Regular", "44 Long", "46 Short", "46 Regular", "46 Long", "48 Short", "48 Regular", "48 Long", "50 Short", "50 Regular", "50 Long"],
            "black tux": ["36 Short", "36 Regular", "36 Long", "38 Short", "38 Regular", "38 Long", "40 Short", "40 Regular", "40 Long", "42 Short", "42 Regular", "42 Long", "44 Short", "44 Regular", "44 Long", "46 Short", "46 Regular", "46 Long", "48 Short", "48 Regular", "48 Long", "50 Short", "50 Regular", "50 Long"],
            "tuxedo": ["36 Short", "36 Regular", "36 Long", "38 Short", "38 Regular", "38 Long", "40 Short", "40 Regular", "40 Long", "42 Short", "42 Regular", "42 Long", "44 Short", "44 Regular", "44 Long", "46 Short", "46 Regular", "46 Long", "48 Short", "48 Regular", "48 Long", "50 Short", "50 Regular", "50 Long"],
            "sport coat": ["36 Short", "36 Regular", "36 Long", "38 Short", "38 Regular", "38 Long", "40 Short", "40 Regular", "40 Long", "42 Short", "42 Regular", "42 Long", "44 Short", "44 Regular", "44 Long", "46 Short", "46 Regular", "46 Long", "48 Short", "48 Regular", "48 Long", "50 Short", "50 Regular", "50 Long"],
            "dress suit": ["36 Short", "36 Regular", "36 Long", "38 Short", "38 Regular", "38 Long", "40 Short", "40 Regular", "40 Long", "42 Short", "42 Regular", "42 Long", "44 Short", "44 Regular", "44 Long", "46 Short", "46 Regular", "46 Long", "48 Short", "48 Regular", "48 Long", "50 Short", "50 Regular", "50 Long"],
            "blazer": ["36 Short", "36 Regular", "36 Long", "38 Short", "38 Regular", "38 Long", "40 Short", "40 Regular", "40 Long", "42 Short", "42 Regular", "42 Long", "44 Short", "44 Regular", "44 Long", "46 Short", "46 Regular", "46 Long", "48 Short", "48 Regular", "48 Long", "50 Short", "50 Regular", "50 Long"],
            
            "dress shirt": ["XS", "S", "M", "L", "XL"],
            "short sleeve shirt": ["XS", "S", "M", "L", "XL"],
            "short sleeve dress shirt": ["XS", "S", "M", "L", "XL"]
        };
    
        // Clean and normalize product type
        const cleanedProductType = productType.toLowerCase().trim();
        console.log('Cleaned Product Type:', cleanedProductType);  // Debugging log
    
        // Iterate over the keys in sizeOptionsMap to find a matching keyword
        for (const keyword in sizeOptionsMap) {
            if (cleanedProductType.includes(keyword)) {
                console.log('Matched Size Options:', sizeOptionsMap[keyword]);  // Debugging log
                return sizeOptionsMap[keyword];
            }
        }
    
        console.log('No match found for Product Type:', cleanedProductType);  // Debugging log
        return ["One Size"];
    }

    // Add sample reviews to local storage
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
        ];
        localStorage.setItem('reviews', JSON.stringify(sampleReviews));
    }

    if (!localStorage.getItem('reviews')) {
        addSampleReviewsToLocalStorage();
    }

    displayProductDetails();
    updateCartItemCount(); // Initial cart item count update on page load
});
