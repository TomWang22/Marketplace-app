document.addEventListener('DOMContentLoaded', async () => {
    const cartList = document.getElementById('cartList');
    const cartTotal = document.getElementById('cartTotal');
    const placeOrderButton = document.getElementById('placeOrderButton');

    const userId = localStorage.getItem('userId'); // Get user ID from local storage

    async function fetchCartItems() {
        const userId = localStorage.getItem('userId');
        try {
            const response = await fetch(`http://localhost:3000/api/cart?userId=${userId}`);
            const data = await response.json();
            console.log('Fetched cart items:', data.items);  // Log fetched items for debugging
            return data.items;
        } catch (error) {
            console.error('Error fetching cart items:', error);
            return [];
        }
    }
    
    

    async function displayCartItems() {
        const cartItems = await fetchCartItems();
        cartList.innerHTML = '';
        let total = 0;
    
        cartItems.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div>
                    <img src="${item.image_url}" alt="${item.product}" width="50">
                    <span>Product: ${item.product} - Quantity: ${item.quantity} - Price: $${parseFloat(item.price).toFixed(2)}</span>
                    <button class="removeButton" data-id="${item.id}" data-quantity="${item.quantity}">Remove</button>
                </div>
            `;
            cartList.appendChild(cartItem);
            total += parseFloat(item.price) * parseInt(item.quantity, 10);
        });
    
        cartTotal.innerHTML = `Total: $${total.toFixed(2)}`;
    
        // Add event listeners for remove buttons
        document.querySelectorAll('.removeButton').forEach(button => {
            button.addEventListener('click', async (event) => {
                const itemId = event.target.getAttribute('data-id');
                const currentQuantity = parseInt(event.target.getAttribute('data-quantity'), 10);
                await removeCartItem(itemId, currentQuantity);
                displayCartItems();
            });
        });
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

    async function removeCartItem(itemId, currentQuantity) {
        if (currentQuantity > 1) {
            await updateCartItemQuantity(itemId, currentQuantity - 1);
        } else {
            try {
                await fetch(`http://localhost:3000/api/cart/${itemId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            } catch (error) {
                console.error('Error removing item from cart:', error);
            }
        }
    }

    async function placeOrder() {
        const userId = localStorage.getItem('userId'); // Ensure userId is set
        const cartItems = await fetchCartItems();
    
        // Log the cart items to check their structure and contents
        console.log('Cart items before placing order:', cartItems);
    
        if (cartItems.length === 0) {
            alert('Your cart is empty.');
            return;
        }
    
        // Ensure each cart item has a product_id
        for (const item of cartItems) {
            if (!item.product_id) {
                alert('One of the items in your cart is missing a product ID.');
                return;
            }
        }
    
        try {
            const response = await fetch('http://localhost:3000/api/place-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId, cartItems })
            });
            const data = await response.json();
            if (data.success) {
                alert('Order placed successfully!');
                displayCartItems(); // Refresh cart items
            } else {
                alert(`Failed to place order: ${data.message}`);
            }
        } catch (error) {
            console.error('Error placing order:', error);
        }
    }
    

    placeOrderButton.addEventListener('click', placeOrder);

    displayCartItems();
});
