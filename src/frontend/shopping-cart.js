document.addEventListener('DOMContentLoaded', async () => {
    const cartList = document.getElementById('cartList');
    const cartTotal = document.getElementById('cartTotal');
    const placeOrderButton = document.getElementById('placeOrderButton');

    const userId = localStorage.getItem('userId'); // Get user ID from local storage

    async function fetchCartItems() {
        try {
            const response = await fetch(`http://localhost:3000/api/cart?userId=${userId}`);
            const data = await response.json();
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
                    <span>Product: ${item.product} - Quantity: ${item.quantity} - Price: $${parseFloat(item.price).toFixed(2)}</span>
                    <button class="removeButton" data-id="${item.id}">Remove</button>
                </div>
            `;
            cartList.appendChild(cartItem);
            total += parseFloat(item.price) * item.quantity;
        });

        cartTotal.innerHTML = `Total: $${total.toFixed(2)}`;

        // Add event listeners for remove buttons
        document.querySelectorAll('.removeButton').forEach(button => {
            button.addEventListener('click', async (event) => {
                const itemId = event.target.getAttribute('data-id');
                await removeCartItem(itemId);
                displayCartItems();
            });
        });
    }

    async function removeCartItem(itemId) {
        try {
            await fetch(`http://localhost:3000/api/cart/${itemId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Error removing cart item:', error);
        }
    }

    async function placeOrder() {
        const cartItems = await fetchCartItems();
        if (cartItems.length === 0) {
            alert('Your cart is empty.');
            return;
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
