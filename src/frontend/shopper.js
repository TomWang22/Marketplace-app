document.addEventListener('DOMContentLoaded', () => {
    const shoppingCartButton = document.getElementById('shoppingCartButton');
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const cartItemsList = document.getElementById('cartItemsList');
    const addFundsButton = document.getElementById('addFundsButton');
    const fundsAmountInput = document.getElementById('fundsAmount');
    const returnMerchandiseButton = document.getElementById('returnMerchandiseButton');
    const productIdInput = document.getElementById('productId');
    const returnQuantityInput = document.getElementById('returnQuantity');
    const shopButton = document.getElementById('shopButton');
    const cartItemCount = document.getElementById('cartItemCount');

    // Retrieve the userId from local storage
    const userId = localStorage.getItem('userId');
    /*
    if (!userId) {
        alert('User not logged in!');
        window.location.href = '/login.html';
        return;
    }
    */
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

    // Function to display cart items
    const displayCartItems = async () => {
        const cartItems = await fetchCartItems();

        // Update cart item count
        cartItemCount.textContent = cartItems.length;

        // Clear the current list
        cartItemsList.innerHTML = '';

        // Populate the list with cart items
        cartItems.forEach(item => {
            const listItem = document.createElement('li');
            
            const itemDetails = document.createElement('div');
            itemDetails.className = 'cart-item-details';
            itemDetails.innerHTML = `<span>${item.product} - $${item.price.toFixed(2)}</span>`;

            const itemQuantity = document.createElement('div');
            itemQuantity.className = 'cart-item-quantity';
            itemQuantity.innerHTML = `
                <button class="quantity-decrease">-</button>
                <span>${item.quantity}</span>
                <button class="quantity-increase">+</button>
            `;

            const removeButton = document.createElement('button');
            removeButton.className = 'remove-button';
            removeButton.textContent = 'Remove';

            listItem.appendChild(itemDetails);
            listItem.appendChild(itemQuantity);
            listItem.appendChild(removeButton);
            cartItemsList.appendChild(listItem);

            // Event listener for quantity decrease
            itemQuantity.querySelector('.quantity-decrease').addEventListener('click', async () => {
                if (item.quantity > 1) {
                    await updateCartItemQuantity(item.id, item.quantity - 1, userId);
                    displayCartItems();
                }
            });

            // Event listener for quantity increase
            itemQuantity.querySelector('.quantity-increase').addEventListener('click', async () => {
                await updateCartItemQuantity(item.id, item.quantity + 1, userId);
                displayCartItems();
            });

            // Event listener for remove button
            removeButton.addEventListener('click', async () => {
                await removeCartItem(item.id, userId);
                displayCartItems();
            });
        });

        // Show the cart items container
        cartItemsContainer.style.display = 'block';
    };

    // Function to update item quantity in the cart
    const updateCartItemQuantity = async (itemId, quantity, userId) => {
        try {
            await fetch(`http://localhost:3000/api/cart/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ quantity, userId })
            });
        } catch (error) {
            console.error('Error updating item quantity:', error);
        }
    };

    // Function to remove item from the cart
    const removeCartItem = async (itemId, userId) => {
        try {
            await fetch(`http://localhost:3000/api/cart/${itemId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId })
            });
        } catch (error) {
            console.error('Error removing item from cart:', error);
        }
    };

    // Function to add funds
    const addFunds = async () => {
        const amount = parseFloat(fundsAmountInput.value);

        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/add-funds', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId, amount })
            });

            const data = await response.json();
            if (data.success) {
                alert('Funds added successfully.');
            } else {
                alert('Failed to add funds: ' + data.message);
            }
        } catch (error) {
            console.error('Error adding funds:', error);
            alert('An error occurred while adding funds.');
        }
    };

    // Function to return merchandise
    const returnMerchandise = async () => {
        const productId = parseInt(productIdInput.value);
        const quantity = parseInt(returnQuantityInput.value);

        if (isNaN(productId) || isNaN(quantity) || quantity <= 0) {
            alert('Please enter valid product ID and quantity');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/return-merchandise', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId, productId, quantity })
            });

            const data = await response.json();
            if (data.success) {
                alert('Merchandise returned successfully.');
            } else {
                alert('Failed to return merchandise: ' + data.message);
            }
        } catch (error) {
            console.error('Error returning merchandise:', error);
            alert('An error occurred while returning merchandise.');
        }
    };

    // Event listeners for buttons
    addFundsButton.addEventListener('click', addFunds);
    returnMerchandiseButton.addEventListener('click', returnMerchandise);
    shoppingCartButton.addEventListener('click', () => {
        displayCartItems();
    });

    shopButton.addEventListener('click', () => {
        window.location.href = 'marketplace.html';
    });

    // Update cart item count on page load
    displayCartItems();
});
