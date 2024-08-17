<script>
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { io } from 'socket.io-client';
    import { chatMessages } from '../stores/stores';

    let userId = localStorage.getItem('userId');
    let accountInfo = writable({ username: '', balance: 0 });
    let supplyRequestsVisible = writable(false);
    let supplyRequests = writable([]);
    let notifications = writable([]);
    let supplies = writable([]);
    let suppliesVisible = writable(false);
    let chatMessage = '';
    let productIdToSend = '';
    let quantityToSend = '';
    let productPricePerUnit = 0;
    let profit = 0;
    let merchantId = '';
    let socket;

    $: profit = quantityToSend ? parseInt(quantityToSend) * parseFloat(productPricePerUnit) : 0;

    if (!userId) {
        window.location.hash = '#/login';
    }

    async function fetchAccountInfo() {
        try {
            const response = await fetch(`http://localhost:4001/api/account-info?userId=${userId}`);
            const data = await response.json();
            if (data.success) {
                accountInfo.set(data.account);
            } else {
                console.error('Error fetching account info:', data.message);
            }
        } catch (error) {
            console.error('Error fetching account info:', error);
        }
    }

    async function fetchSupplyRequests() {
        try {
            const response = await fetch('http://localhost:4006/api/supply-requests', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            supplyRequests.set(data.requests);
        } catch (error) {
            console.error('Error fetching supply requests:', error);
            supplyRequests.set([]);
        }
    }

    async function fetchSupplies() {
        try {
            const response = await fetch('http://localhost:4006/api/supplies', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            if (data.success) {
                supplies.set(data.supplies);
            } else {
                alert('Failed to fetch supplies: ' + data.message);
            }
        } catch (error) {
            console.error('Error fetching supplies:', error);
            alert('An error occurred while fetching supplies.');
        }
    }

    function toggleSupplies() {
        suppliesVisible.update(isVisible => {
            if (!isVisible) fetchSupplies();
            return !isVisible;
        });
    }

    async function fetchProductPrice(productId) {
        try {
            const response = await fetch(`http://localhost:4002/api/products/${productId}`);
            const data = await response.json();
            if (data.success) {
                productPricePerUnit = data.product.price || 0;
            } else {
                console.error('Failed to fetch product price:', data.message);
                productPricePerUnit = 0;
            }
        } catch (error) {
            console.error('Error fetching product price:', error);
            productPricePerUnit = 0;
        }
    }

    $: if (productIdToSend) {
        fetchProductPrice(productIdToSend);
    }

    async function sendSupplies(merchantId, productId, quantity) {
    try {
        const response = await fetch('http://localhost:4006/api/fulfill-supply-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ supplierId: userId, merchantId, productId, quantity })
        });
        const data = await response.json();
        if (data.success) {
            const calculatedProfit = quantity * parseFloat(productPricePerUnit);

            // Update the balance on the server using the add-funds endpoint
            await addFundsToAccount(calculatedProfit);

            notifications.update(n => [...n, `Sent ${quantity} units of product ID ${productId} to Merchant ID ${merchantId}`]);
            alert(`Supplies successfully sent: ${quantity} units of Product ID ${productId} to Merchant ID ${merchantId}`);

            // Clear the input fields after sending supplies
            clearInputFields();

            // Update the specific supply's stock immediately
            supplies.update(currentSupplies => {
                return currentSupplies.map(supply => {
                    if (supply.id === productId) {
                        return { ...supply, stock: supply.stock - quantity };
                    }
                    return supply;
                });
            });

            // Remove the fulfilled request from the supplyRequests list
            supplyRequests.update(requests => {
                return requests.filter(request => !(request.merchant_id === merchantId && request.product_id === productId));
            });

            // Refresh account info to reflect the updated balance
            await fetchAccountInfo();
            await fetchSupplies();

        } else {
            notifications.update(n => [...n, `Failed to send supplies: ${data.message}`]);
            alert(`Failed to send supplies: ${data.message}`);
        }
    } catch (error) {
        console.error('Error sending supplies:', error);
        notifications.update(n => [...n, 'An error occurred while sending supplies.']);
        alert('An error occurred while sending supplies.');
    }
}

// Function to add funds to the account using the add-funds endpoint
async function addFundsToAccount(amount) {
    try {
        const response = await fetch('http://localhost:4001/api/add-funds', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, amount })
        });
        const data = await response.json();
        if (!data.success) {
            console.error('Failed to add funds:', data.message);
        }
    } catch (error) {
        console.error('Error adding funds:', error);
    }
}
    function clearInputFields() {
        productIdToSend = '';
        quantityToSend = '';
        merchantId = '';
    }

    const logout = () => {
        localStorage.removeItem("userId");
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.location.hash = '#/login';
    };

    function sendMessage() {
        if (chatMessage) {
            socket.emit("sendMessage", { message: chatMessage, userId, role: "supplier" });
            chatMessage = "";
        }
    }

    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    }

    onMount(async () => {
        if (!userId) {
            window.location.hash = '#/login';
            return;
        }

        await fetchAccountInfo();
        await fetchSupplyRequests();

        socket = io("http://localhost:4004", {
            transports: ["websocket"],
            query: { userId },
        });

        socket.on("previousChats", (chats) => {
            chatMessages.set(chats);
        });

        socket.on("receiveMessage", (chat) => {
            chatMessages.update(messages => [...messages, chat]);
        });

        socket.on("newSupply", (data) => {
            notifications.update(n => [...n, data.message]);

            supplies.update(currentSupplies => {
                return currentSupplies.map(supply => {
                    if (supply.id === data.newSupply.id) {
                        return { ...supply, stock: data.newSupply.stock };
                    }
                    return supply;
                });
            });

            fetchAccountInfo();
        });

        return () => {
            socket.disconnect();
        };
    });
</script>

<style>
    /* Keeping the style the same as provided */
    ul {
        list-style-type: none;
        padding: 0;
    }

    li {
        margin-bottom: 10px;
    }

    .hidden {
        display: none;
    }

    .visible {
        display: block;
    }

    header {
        background-color: #283593;
        padding: 15px 30px;
        color: white;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
    }

    header .logo {
        font-size: 1.8em;
        font-weight: bold;
        letter-spacing: 0.05em;
    }

    header button {
        background-color: #f44336;
        border: none;
        padding: 12px 20px;
        border-radius: 5px;
        color: white;
        cursor: pointer;
        transition: background-color 0.3s ease, box-shadow 0.3s ease;
    }

    header button:hover {
        background-color: #d32f2f;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    }

    main {
        max-width: 1200px;
        margin: 30px auto;
        padding: 30px;
        background-color: #fafafa;
        border-radius: 12px;
        box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
    }

    h1, h2 {
        color: #424242;
        font-family: 'Roboto', sans-serif;
    }

    .account-info {
        margin-bottom: 40px;
        background-color: #e3f2fd;
        padding: 25px;
        border-radius: 12px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        font-family: 'Roboto', sans-serif;
    }

    .account-info p {
        margin: 10px 0;
        font-size: 1.1em;
        color: #1a237e;
    }

    section {
        margin-bottom: 50px;
    }

    form {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    input[type="text"], input[type="number"] {
        padding: 12px;
        border: 1px solid #cfd8dc;
        border-radius: 6px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        font-size: 1em;
    }

    button {
        display: inline-block;
        padding: 14px 24px;
        background-color: #039be5;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: background-color 0.3s ease, box-shadow 0.3s ease;
    }

    button:hover {
        background-color: #0277bd;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    }

    .request-item, .supply-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px;
        background-color: #f5f5f5;
        border-radius: 10px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        margin-bottom: 20px;
        font-family: 'Roboto', sans-serif;
    }

    .fulfilled {
        text-decoration: line-through;
        color: #9e9e9e;
    }

    #chatContainer {
        background-color: #eeeeee;
        padding: 20px;
        border-radius: 12px;
    }

    #chatContainer h2 {
        margin-bottom: 20px;
        color: #424242;
    }

    #chatContainer ul {
        max-height: 300px;
        overflow-y: auto;
        padding: 15px;
        border: 1px solid #cfd8dc;
        background-color: white;
        border-radius: 12px;
        margin-bottom: 30px;
    }

    #chatContainer ul li {
        margin-bottom: 15px;
        padding: 12px;
        border-radius: 10px;
    }

    .my-message {
        background-color: #b3e5fc;
        color: #0277bd;
        text-align: right;
    }

    .other-message {
        background-color: #e1f5fe;
        color: #01579b;
    }

    #chatContainer input[type="text"] {
        width: 100%;
        padding: 12px;
        border: 1px solid #cfd8dc;
        border-radius: 6px;
        margin-bottom: 15px;
        font-size: 1em;
    }
</style>

<header>
    <div class="logo">Supplier Dashboard</div>
    <button on:click={logout}>Logout</button>
</header>

<main>
    <div class="account-info">
        <h2>Account Information</h2>
        <p><strong>Name:</strong> {$accountInfo.username}</p>
        <p><strong>Balance:</strong> ${$accountInfo.balance}</p>
    </div>

    <section id="send-supplies-section">
        <h2>Send Supplies</h2>
        <form>
            <input type="text" bind:value={merchantId} placeholder="Merchant ID">
            <input type="text" bind:value={productIdToSend} placeholder="Product ID">
            <input type="number" bind:value={quantityToSend} placeholder="Quantity">
            <button type="button" on:click={() => sendSupplies(merchantId, productIdToSend, parseInt(quantityToSend))}>Send Supplies</button>
        </form>
        <p>Expected Profit: ${profit}</p>
    </section>

    <section id="add-supplies-section">
        <h2>Add Supply</h2>
        <form>
            <input type="text" id="supplyName" placeholder="Supply Name">
            <input type="text" id="supplyDescription" placeholder="Supply Description">
            <input type="number" id="supplyPrice" placeholder="Supply Price">
            <input type="number" id="supplyCost" placeholder="Supply Cost">
            <input type="number" id="supplyStock" placeholder="Supply Stock">
            <input type="text" id="supplyImageUrl" placeholder="Supply Image URL">
            <button type="button" on:click={() => {
                const name = document.getElementById('supplyName').value;
                const description = document.getElementById('supplyDescription').value;
                const price = document.getElementById('supplyPrice').value;
                const cost = document.getElementById('supplyCost').value;
                const stock = document.getElementById('supplyStock').value;
                const image_url = document.getElementById('supplyImageUrl').value;
                addSupply(name, description, price, cost, stock, image_url);
            }}>Add Supply</button>
        </form>
    </section>

    <section id="view-requests-section">
        <button on:click={async () => {
            const visible = $supplyRequestsVisible;
            supplyRequestsVisible.set(!visible);
            if (!visible) {
                await fetchSupplyRequests();
            }
        }}>View Supply Requests</button>
        {#if $supplyRequestsVisible}
            <div id="supplyRequestsList">
                {#each $supplyRequests as request}
                    <div class="request-item {request.fulfilled ? 'fulfilled' : ''}">
                        <div>
                            <span>Merchant ID: {request.merchant_id} - Product ID: {request.product_id} - Quantity: {request.quantity}</span>
                            {#if !request.fulfilled}
                                <button on:click={() => sendSupplies(request.merchant_id, request.product_id, request.quantity)}>Fulfill</button>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </section>

    <section id="view-supplies-section">
        <button on:click={toggleSupplies}>View Supplies</button>
        {#if $suppliesVisible}
            <ul>
                {#each $supplies as supply}
                    <li class="supply-item">
                        <strong>{supply.name}</strong><br>
                        Description: {supply.description}<br>
                        Price: ${supply.price}<br>
                        Stock: {supply.stock}<br>
                        Image: <img src="{supply.image_url}" alt="{supply.name}" width="100">
                    </li>
                {/each}
            </ul>
        {/if}
    </section>

    <section id="chatContainer">
        <h2>Chat with Other Users</h2>
        <ul>
            {#each $chatMessages as chat}
                <li class="{chat.userId === userId ? 'my-message' : 'other-message'}">
                    {chat.username} ({chat.role}): {chat.message} ({formatTimestamp(chat.timestamp)})
                </li>
            {/each}
        </ul>
        <input type="text" bind:value={chatMessage} placeholder="Type your message here">
        <button on:click={sendMessage}>Send</button>
    </section>

    <section id="notifications-section">
        <ul id="notificationsList">
            {#each $notifications as notification}
                <li>{notification}</li>
            {/each}
        </ul>
    </section>
</main>

<footer>
    <nav>
        <a href="#/contact">Contact</a>
    </nav>
</footer>
