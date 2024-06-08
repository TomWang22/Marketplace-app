document.addEventListener('DOMContentLoaded', () => {
    const shoppingCartButton = document.getElementById('shoppingCartButton');
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const cartItemsList = document.getElementById('cartItemsList');

    // Function to fetch cart items from the server
    const fetchCartItems = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/cart');
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

        // Clear the current list
        cartItemsList.innerHTML = '';

        // Populate the list with cart items
        cartItems.forEach(item => {
            const listItem = document.createElement('li');
            
            const itemDetails = document.createElement('div');
            itemDetails.className = 'cart-item-details';
            itemDetails.innerHTML = `<span>${item.name} - $${item.price.toFixed(2)}</span>`;

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
                    await updateCartItemQuantity(item.id, item.quantity - 1);
                    displayCartItems();
                }
            });

            // Event listener for quantity increase
            itemQuantity.querySelector('.quantity-increase').addEventListener('click', async () => {
                await updateCartItemQuantity(item.id, item.quantity + 1);
                displayCartItems();
            });

            // Event listener for remove button
            removeButton.addEventListener('click', async () => {
                await removeCartItem(item.id);
                displayCartItems();
            });
        });

        // Show the cart items container
        cartItemsContainer.style.display = 'block';
    };

    // Function to update item quantity in the cart
    const updateCartItemQuantity = async (itemId, quantity) => {
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
    };

    // Function to remove item from the cart
    const removeCartItem = async (itemId) => {
        try {
            await fetch(`http://localhost:3000/api/cart/${itemId}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Error removing item from cart:', error);
        }
    };

    // Event listener for shopping cart button
    shoppingCartButton.addEventListener('click', () => {
        displayCartItems();
    });
});
