document.addEventListener('DOMContentLoaded', () => {
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
                name: "Mens SS Shirt-Linen Blue Floral Print Cotton Linen Short Sleeve Shirt S / Blue Floral Linen",
                description: "Short sleeve dress shirt",
                price: 10.00,
                image_url: "https://www.jachsny.com/cdn/shop/products/K026-255-HT6_4.jpg?v=1651786465"
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
    async function addToCart(productId) {
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
                <button class="add-to-cart" data-id="${product.id}">Add to Cart</button>
                <button class="view-details" data-id="${product.id}">View Details</button>
            `;
            productGrid.appendChild(productElement);
        });

        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', (event) => {
                const productId = event.target.getAttribute('data-id');
                addToCart(productId);
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
