document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    const productGrid = document.querySelector('.product-listings .product-grid');
    const cartItemCount = document.getElementById('cartItemCount');
    const homeButton = document.getElementById('homeButton');
    const accountButton = document.getElementById('accountButton');
    const searchInput = document.querySelector('.search-bar');
    const priceFilter = document.getElementById('priceFilter');
    const itemsPerPageSelect = document.getElementById('itemsPerPage');
    const prevPageButton = document.getElementById('prevPage');
    const nextPageButton = document.getElementById('nextPage');
    const pageIndicator = document.getElementById('pageIndicator');
    const productList = document.getElementById('product-listings');
    const marketplaceSection = document.getElementById('marketplace-section');
    const accountSection = document.getElementById('account-section');
    const userBalance = document.getElementById('userBalance');
    const shoppingHistory = document.getElementById('shoppingHistory');
    const searchHistory = document.getElementById('searchHistory');

    let allProducts = [];
    let filteredProducts = [];
    let currentPage = 1;
    let itemsPerPage = parseInt(itemsPerPageSelect.value, 10);

    // Define URLs for different roles
    const homeUrls = {
        merchant: 'merchant.html',
        supplier: 'supplier.html',
        shopper: 'shopper.html'
    };

    homeButton.addEventListener('click', () => {
        // Redirect based on the user's role
        const homeUrl = homeUrls[role] || 'marktplace.html';
        window.location.href = homeUrl;
    });

    accountButton.addEventListener('click', async () => {
        marketplaceSection.style.display = 'none';
        accountSection.style.display = 'block';
        hideMarketplaceControls();
        await displayAccountInfo();
    });

    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            const searchQuery = searchInput.value.trim().toLowerCase();
            if (searchQuery) {
                window.location.href = `search-results.html?query=${encodeURIComponent(searchQuery)}`;
            }
        }
    });

    priceFilter.addEventListener('change', () => {
        currentPage = 1;
        filterAndDisplayProducts();
    });

    itemsPerPageSelect.addEventListener('change', () => {
        itemsPerPage = parseInt(itemsPerPageSelect.value, 10);
        currentPage = 1;
        displayProducts();
    });

    prevPageButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayProducts();
        }
    });

    nextPageButton.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            displayProducts();
        }
    });

    async function fetchUserData(userId) {
        try {
            const response = await fetch(`http://localhost:3000/api/users/${userId}`);
            const data = await response.json();
            if (data.success) {
                return data.user;
            } else {
                console.error('Failed to fetch user data:', data.message);
                return null;
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            return null;
        }
    }

    async function displayAccountInfo() {
        const userData = await fetchUserData(userId);
        if (userData) {
            const balance = parseFloat(userData.balance);
            userBalance.textContent = isNaN(balance) ? '0.00' : balance.toFixed(2);
            shoppingHistory.innerHTML = userData.shoppingHistory.map(item => `<li>Order #${item.id} - Product ID: ${item.product_id} - Quantity: ${item.quantity} - Date: ${item.purchase_date}</li>`).join('');
            searchHistory.innerHTML = userData.searchHistory.map(item => `<li>Search Query: ${item.search_query} - Date: ${item.search_date}</li>`).join('');
        } else {
            userBalance.textContent = '0.00';
            shoppingHistory.innerHTML = '<li>No shopping history found.</li>';
            searchHistory.innerHTML = '<li>No search history found.</li>';
        }
    }

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

    function saveItemsToLocalStorage(items) {
        localStorage.setItem('products', JSON.stringify(items));
    }

    function getItemsFromLocalStorage() {
        const products = localStorage.getItem('products');
        return products ? JSON.parse(products) : [];
    }

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
                name: "Short sleeve dress shirt",
                description:  "This stylish red and blue multi check short sleeve shirt is perfect for relaxed summer days. The relaxed slim fit is our most regular and flattering fit. It is gently tapered across the waist and chest, creating a relaxed yet defined silhouette. Made from the finest 2 ply 100s cotton, this shirt has been perfected with Hawes & Curtis' silk touch finish that makes it easier to iron. The result is a smooth, lavish texture that makes it feel even more opulent and exceptionally comfortable to wear. ⚫100% Cotton ⚫Short sleeve ⚫Semi-Cutaway Collar Slim Fit (Relaxed) The model is wearing a size Medium. Model is 6'1\"/185cm tall, with a 37\" / 94cm chest and a 31\" / 79cm waist.",
                price: 40.00,
                image_url: "https://handcmediastorage.blob.core.windows.net/productimages/CG/CGCFC003-L03-161755-800px-1040px.jpg"
            },
            {
                id: 3,
                name: "Tan color Suit",
                description: "This luxurious suit jacket is cut from a beautiful Italian fabric that blends breathable linen with silky soft viscose, for an elevated look with just a touch of shine. Here, we left the jacket unlined through the back for even better breathability. Tailored Slim Fit: More relaxed than our Slim Fit, this Italian cut style has a softer shoulder construction. Fabric from Italy's Lanificio Comatex. Notch lapel with 2-button front. Three exterior pockets, three interior pockets. Underarm shields to reduce the need for frequent dry cleaning. Lined sleeves, shoulders, and front body, unlined at back.",
                price: 400.00,
                image_url: "https://bananarepublic.gap.com/webcontent/0054/961/875/cn54961875.jpg"
            },
            {
                id: 4,
                name: "Blue suit jacket",
                description: "This timeless suit jacket is cut from an Italian wool fabric we love for its subtle twill texture. Designed to carry you through all seasons, this beautiful fabric is woven in a Super 120's weight--the perfect balance of fine handfeel, beautiful drape, and everyday durability. Wrinkle-Resistant, Breathable, Stretch. Tailored Slim Fit: More relaxed than our Slim Fit, this Italian cut style has a softer shoulder construction. Fabric from Italy's Lanificio Guabello. Notch lapel with 2-button front. Three exterior pockets, three interior pockets. Single back vent. Fully lined. #853050",
                price: 450.00,
                image_url: "https://bananarepublic.gap.com/webcontent/0054/898/805/cn54898805.jpg"
            },
            {
                id: 5,
                name: "dress shirt",
                description: "Designed for ease of wear and care, this sleek dress shirt employs a special cotton fabric with PUREPRESS™ cotton technology, a special process that smooths and protects the fabric, resulting in a wrinkle-resistant finish. Slim fit with darts at the back. Spread collar. Shirttail hem. #871242",
                price: 80.00,
                image_url: "https://bananarepublic.gap.com/webcontent/0055/250/853/cn55250853.jpg?q=h&w=480"
            },
            {
                id: 6,
                name: "white dress shirt",
                description: "This timeless tuxedo shirt has a cutaway collar and traditional French cuffs with linked buttons so you can replace with cuff links if you like. Slim fit. Cutaway collar. Long sleeves with French cuffs. Concealed button placket. Shirttail hem. #515724",
                price: 100.00,
                image_url: "https://bananarepublic.gap.com/webcontent/0053/531/075/cn53531075.jpg"
            },
            {
                id: 7,
                name: "standard white shirt",
                description: "This tuxedo dress shirt is cut from a refined cotton fabric, selected for its incredible softness and light structure, accented with the traditional pleated tuxedo bib detail. Standard fit. Wing collar and button front. Pleated bib detail. Shirttail hem. #430052",
                price: 200.00,
                image_url: "https://bananarepublic.gap.com/webcontent/0055/250/363/cn55250363.jpg?q=h&w=480"
            },
            {
                id: 8,
                name: "white cotten linen suit jacket",
                description: "Designed with warm climates in mind, this sleek white suit is cut from an Italian fabric that blends together soft cotton and luxurious linen. Here, we left the jacket unlined through the back for even better breathability. Tailored Slim fit. Fabric from Italy's Olimpias mill. Notch lapel. Two-button front. Exterior and interior pockets. Single vented back. Lined sleeves, unlined body. #815147",
                price: 350.00,
                image_url: "https://bananarepublic.gap.com/webcontent/0054/461/408/cn54461408.jpg"
            },
            {
                id: 9,
                name: "SLIM CASTELLO LINEN SHIRT",
                description: "Cut from 100% linen, we love this shirt for its beautiful, natural texture and ability to stay cool and crisp, even in heat and humidity. Slim fit. Spread collar with button-front closure. Shirttail hem. #804341",
                price: 85.00,
                image_url: "https://bananarepublic.gap.com/webcontent/0053/637/959/cn53637959.jpg?q=h&w=480"
            }
        ];
        saveItemsToLocalStorage(sampleItems);
    }

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

    async function addToCart(productId) {
        const userId = localStorage.getItem('userId');
        const cartItems = await fetchCartItems();
        const existingItem = cartItems.find(item => item.productId === productId);
    
        if (existingItem) {
            await updateCartItemQuantity(existingItem.id, existingItem.quantity + 1);
        } else {
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
    
        updateCartItemCount();
    }
    
    async function updateCartItemQuantity(itemId, quantity) {
        try {
            await fetch(`http://localhost:3000/api/cart/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ quantity })
            });
        } catch (error) {
            console.error('Error updating item quantity:', error);
        }
    }
    

    function filterAndDisplayProducts() {
        const priceRange = priceFilter.value;
        filteredProducts = allProducts.filter(product => {
            const price = product.price;
            switch (priceRange) {
                case '0-50':
                    return price >= 0 && price <= 50;
                case '51-100':
                    return price >= 51 && price <= 100;
                case '101-200':
                    return price >= 101 && price <= 200;
                case '200+':
                    return price > 200;
                default:
                    return true;
            }
        });
        displayProducts();
    }

    function displayProducts() {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const productsToDisplay = filteredProducts.slice(start, end);

        productGrid.innerHTML = '';
        productsToDisplay.forEach(product => {
            const productElement = document.createElement('div');
            productElement.className = 'product';
            productElement.innerHTML = `
                <img src="${product.image_url}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>$${product.price.toFixed(2)}</p>
                <button class="view-details" data-id="${product.id}">View Details</button>
            `;
            productGrid.appendChild(productElement);
        });

        document.querySelectorAll('.view-details').forEach(button => {
            button.addEventListener('click', (event) => {
                const productId = event.target.getAttribute('data-id');
                window.location.href = `product-details.html?id=${productId}`;
            });
        });

        const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
        pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
    }

    function hideMarketplaceControls() {
        priceFilter.style.display = 'none';
        itemsPerPageSelect.style.display = 'none';
        prevPageButton.style.display = 'none';
        nextPageButton.style.display = 'none';
        pageIndicator.style.display = 'none';
    }

    function showMarketplaceControls() {
        priceFilter.style.display = 'block';
        itemsPerPageSelect.style.display = 'block';
        prevPageButton.style.display = 'block';
        nextPageButton.style.display = 'block';
        pageIndicator.style.display = 'block';
    }

    async function init() {
        allProducts = getItemsFromLocalStorage();
        if (!allProducts.length) {
            allProducts = await fetchProducts();
            saveItemsToLocalStorage(allProducts);
        }
        filteredProducts = allProducts;
        filterAndDisplayProducts();
        displayProducts();
    }

    async function updateCartItemCount() {
        const cartItems = await fetchCartItems();
        cartItemCount.textContent = cartItems.length;
    }

    localStorage.removeItem('products');
    addSampleItemsToLocalStorage();
    console.log('localStorage after adding sample items:', getItemsFromLocalStorage());

    init();
    updateCartItemCount();
});
