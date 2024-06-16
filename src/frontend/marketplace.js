document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    const productGrid = document.querySelector('.product-listings .product-grid');
    const cartItemCount = document.getElementById('cartItemCount');
    const homeButton = document.getElementById('homeButton');
    const searchInput = document.querySelector('.search-bar');

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

    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            const searchQuery = searchInput.value.trim().toLowerCase();
            if (searchQuery) {
                window.location.href = `search-results.html?query=${encodeURIComponent(searchQuery)}`;
            }
        }
    });

    async function saveSearchHistory(userId, searchQuery) {
        try {
            const response = await fetch('http://localhost:3000/api/search-history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId, searchQuery })
            });
            const data = await response.json();
            if (!data.success) {
                console.error('Failed to save search history');
            }
        } catch (error) {
            console.error('Error saving search history:', error);
        }
    }

    // Function to save items to localStorage
    function saveItemsToLocalStorage(items) {
        localStorage.setItem('products', JSON.stringify(items));
    }

    // Function to get items from localStorage
    function getItemsFromLocalStorage() {
        const products = localStorage.getItem('products');
        return products ? JSON.parse(products) : [];
    }

    // Function to add sample items to localStorage
    function addSampleItemsToLocalStorage() {
        const sampleItems = [
            {
                id: 1,
                name: "Black Tux",
                description: "A sleek and stylish black tuxedo, perfect for any formal event.",
                price: 299.99,
                image_url: "https://cdn.suitsupply.com/image/upload/b_rgb:efefef,bo_300px_solid_rgb:efefef,c_pad,w_2600/b_rgb:efefef,c_pad,dpr_1,w_850,h_1530,f_auto,q_auto,fl_progressive/products/Waistcoats/default/Winter/W1199_1.jpg"
            },
            {
                id: 2,
                name: "Sample Product 2",
                description: "Description for product 2",
                price: 20.00,
                image_url: "https://via.placeholder.com/150"
            },
            {
                id: 3,
                name: "Sample Product 3",
                description: "Description for product 3",
                price: 30.00,
                image_url: "https://via.placeholder.com/150"
            },
            {
                id: 4,
                name: "Sample Product 4",
                description: "Description for product 4",
                price: 40.00,
                image_url: "https://via.placeholder.com/150"
            },
            {
                id: 5,
                name: "Sample Product 5",
                description: "Description for product 5",
                price: 50.00,
                image_url: "https://via.placeholder.com/150"
            },
            {
                id: 6,
                name: "Sample Product 6",
                description: "Description for product 6",
                price: 60.00,
                image_url: "https://via.placeholder.com/150"
            },
            {
                id: 7,
                name: "Sample Product 7",
                description: "Description for product 7",
                price: 70.00,
                image_url: "https://via.placeholder.com/150"
            },
            {
                id: 8,
                name: "Sample Product 8",
                description: "Description for product 8",
                price: 80.00,
                image_url: "https://via.placeholder.com/150"
            },
            {
                id: 9,
                name: "Sample Product 9",
                description: "Description for product 9",
                price: 90.00,
                image_url: "https://via.placeholder.com/150"
            }
        ];
        saveItemsToLocalStorage(sampleItems);
    }

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
            const response = await fetch(`http://localhost:3000/api/cart?userId=${userId}`);
            const data = await response.json();
            return data.items;
        } catch (error) {
            console.error('Error fetching cart items:', error);
            return [];
        }
    };

    // Function to add an item to the cart
    async function addToCart(productId, quantity) {
        const userId = localStorage.getItem('userId'); // Ensure this is defined
    
        console.log('Adding to cart:', { userId, productId, quantity });
    
        try {
            const response = await fetch('http://localhost:3000/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId, productId, quantity })
            });
            const data = await response.json();
            if (data.success) {
                updateCartItemCount();
                alert('Item added to cart!');
            } else {
                alert('Failed to add item to cart.');
            }
        } catch (error) {
            console.error('Error adding item to cart:', error);
            alert('Error adding item to cart.');
        }
    }

    // Function to display products
    async function displayProducts() {
        let products = getItemsFromLocalStorage();
        console.log('Products to display from localStorage:', products);

        if (!products.length) {
            products = await fetchProducts();
            saveItemsToLocalStorage(products);
        }

        if (!products.length) {
            productGrid.innerHTML = '<p>No products available.</p>';
            return;
        }

        productGrid.innerHTML = '';
        products.forEach(product => {
            const productElement = document.createElement('div');
            productElement.className = 'product';
            productElement.innerHTML = `
                <img src="${product.image_url}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <p>$${product.price.toFixed(2)}</p>
                <input type="number" class="quantity-input" data-id="${product.id}" min="1" value="1">
                <button class="add-to-cart" data-id="${product.id}">Add to Cart</button>
                <button class="view-details" data-id="${product.id}">View Details</button>
            `;
            productGrid.appendChild(productElement);
        });

        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', (event) => {
                const productId = event.target.getAttribute('data-id');
                const quantityInput = document.querySelector(`.quantity-input[data-id='${productId}']`);
                const quantity = parseInt(quantityInput.value, 10);
                addToCart(productId, quantity);
            });
        });

        document.querySelectorAll('.view-details').forEach(button => {
            button.addEventListener('click', (event) => {
                const productId = event.target.getAttribute('data-id');
                window.location.href = `product-details.html?id=${productId}`;
            });
        });

        console.log('Total products displayed:', products.length);
    }

    // Function to update cart item count
    async function updateCartItemCount() {
        const cartItems = await fetchCartItems();
        cartItemCount.textContent = cartItems.length;
    }

    localStorage.removeItem('products');
    addSampleItemsToLocalStorage();
    console.log('localStorage after adding sample items:', getItemsFromLocalStorage());

    displayProducts();
    updateCartItemCount();
});
