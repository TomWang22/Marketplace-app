# Marketplace Application

## Project Overview
This project is a web-based marketplace application designed to manage and facilitate transactions between merchants, suppliers, and shoppers. It provides distinct dashboards and functionalities for different user roles, ensuring a seamless and user-friendly experience.

## Features
- **Multi-View User Interface**: Separate dashboards for merchants, suppliers, and shoppers.
- **Merchants**: Manage products, view received supplies, and send merchandise.
- **Suppliers**: Add supplies and send supplies to merchants.
- **Shoppers**: Manage shopping cart, add funds, and return merchandise.
- **Local Storage**: Persistent user sessions and data storage.
- **Dynamic DOM and UI Updates**: Real-time updates based on user interactions.
- **Event Handling**: Responsive handling of user actions like clicks and inputs.
- **CSS and Visual Design**: Enhanced visual design and responsiveness using a CSS framework.

## Technologies Used
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Session Management**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **CSS Framework**: Bootstrap

## Installation
1. Clone the Repository:
    ```sh
    git clone https://github.com/TomWang22/Marketplace-app.git
    cd Marketplace-app
    ```
2. Install Dependencies:
    ```sh
    npm install
    ```
3. Set Up PostgreSQL Database:
    - Create a database named `marketplace`.
    - Run the SQL scripts provided in the `db` directory:
    ```sh
    psql -U postgres -d marketplace -f db/scripts.sql
    ```
4. Set Up Redis:
    - Ensure Redis is installed and running on your machine.
    - Update the Redis connection settings in `server.js` if necessary.
5. Start the Server:
    ```sh
    npm start
    ```

## Usage
1. Start the backend server:
    ```sh
    npm start
    ```
2. Open your browser and navigate to `http://localhost:3000`.

## User Roles and Functionality
### Merchant
- **Add New Products**: Add new products with details like name, description, price, stock, and image URL.
- **View and Manage Received Supplies**: View a list of supplies received.
- **Send Merchandise**: Send merchandise to customers.

### Supplier
- **Add New Supplies**: Add new supplies to the inventory.
- **Send Supplies**: Send supplies to merchants.

### Shopper
- **Add Funds**: Add funds to their account.
- **Return Merchandise**: Return merchandise.
- **View and Manage Shopping Cart**: Manage items in their shopping cart.
- **Purchase Products**: Purchase products from the marketplace.

## API Endpoints
### User Endpoints
- **User Registration**: `POST /api/register`
- **User Login**: `POST /api/login`

### Shopping Cart Endpoints
- **Fetch Cart Items**: `GET /api/cart`
- **Update Cart Item Quantity**: `PUT /api/cart/:id`
- **Remove Cart Item**: `DELETE /api/cart/:id`

### Order Endpoints
- **Place Order**: `POST /api/place-order`
- **Return Merchandise**: `POST /api/return-merchandise`

### Supply Endpoints
- **Receive Supplies**: `POST /api/receive-supplies`
- **Fetch Received Supplies**: `GET /api/received-supplies`

### Product Endpoints
- **Add New Product**: `POST /api/products`
- **Fetch Products**: `GET /api/products`

### Funds Endpoints
- **Add Funds**: `POST /api/add-funds`

## File Structure
```plaintext
marketplace/
├── db/
│   └── scripts.sql
├── src/
│   ├── backend/
│   │   ├── server.js
│   ├── frontend/
│   │   ├── createaccount.html
│   │   ├── login.html
│   │   ├── marketplace.html
│   │   ├── merchant.html
│   │   ├── shopper.html
│   │   ├── supplier.html
│   │   ├── styles.css
│   │   ├── createaccount.js
│   │   ├── login.js
│   │   ├── marketplace.js
│   │   ├── merchant.js
│   │   ├── shopper.js
│   │   ├── supplier.js
│   │   ├── shopping-cart.js
│   │   ├── shopping-cart.html
│   │   ├── privacy.js
│   │   ├── privacy.html
│   │   ├── contact.js
│   │   ├── contact.html
│   │   ├── about.js
│   │   ├── about.html

# API Documentation

## User Endpoints

### User Registration
- **URL**: `/api/register`
- **Method**: `POST`
- **Description**: Register a new user.
- **Request Body**:
    ```json
    {
        "username": "string",
        "password": "string",
        "role": "string"
    }
    ```
- **Response**:
    - `201 Created`: User registered successfully.
    - `400 Bad Request`: Validation error.

### User Login
- **URL**: `/api/login`
- **Method**: `POST`
- **Description**: Authenticate a user and return a JWT token.
- **Request Body**:
    ```json
    {
        "username": "string",
        "password": "string"
    }
    ```
- **Response**:
    - `200 OK`: Login successful, returns JWT token.
    - `401 Unauthorized`: Invalid credentials.

## Shopping Cart Endpoints

### Fetch Cart Items
- **URL**: `/api/cart`
- **Method**: `GET`
- **Description**: Fetch items in the user's shopping cart.
- **Query Parameters**:
    - `userId`: The ID of the user.
- **Response**:
    - `200 OK`: Returns an array of cart items.
    - `401 Unauthorized`: User not authenticated.

### Update Cart Item Quantity
- **URL**: `/api/cart/:id`
- **Method**: `PUT`
- **Description**: Update the quantity of an item in the cart.
- **Request Body**:
    ```json
    {
        "quantity": "number"
    }
    ```
- **Response**:
    - `200 OK`: Quantity updated successfully.
    - `400 Bad Request`: Validation error.
    - `401 Unauthorized`: User not authenticated.

### Remove Cart Item
- **URL**: `/api/cart/:id`
- **Method**: `DELETE`
- **Description**: Remove an item from the cart.
- **Response**:
    - `200 OK`: Item removed successfully.
    - `401 Unauthorized`: User not authenticated.

## Order Endpoints

### Place Order
- **URL**: `/api/place-order`
- **Method**: `POST`
- **Description**: Place an order for the items in the cart.
- **Request Body**:
    ```json
    {
        "userId": "string",
        "cartItems": [
            {
                "productId": "string",
                "quantity": "number",
                "price": "number"
            }
        ]
    }
    ```
- **Response**:
    - `201 Created`: Order placed successfully.
    - `400 Bad Request`: Validation error.
    - `401 Unauthorized`: User not authenticated.

### Return Merchandise
- **URL**: `/api/return-merchandise`
- **Method**: `POST`
- **Description**: Return purchased merchandise.
- **Request Body**:
    ```json
    {
        "userId": "string",
        "productId": "string",
        "quantity": "number"
    }
    ```
- **Response**:
    - `200 OK`: Merchandise returned successfully.
    - `400 Bad Request`: Validation error.
    - `401 Unauthorized`: User not authenticated.

## Supply Endpoints

### Receive Supplies
- **URL**: `/api/receive-supplies`
- **Method**: `POST`
- **Description**: Record receipt of supplies.
- **Request Body**:
    ```json
    {
        "merchantId": "string",
        "productId": "string",
        "quantity": "number"
    }
    ```
- **Response**:
    - `201 Created`: Supplies received successfully.
    - `400 Bad Request`: Validation error.
    - `401 Unauthorized`: User not authenticated.

### Fetch Received Supplies
- **URL**: `/api/received-supplies`
- **Method**: `GET`
- **Description**: Fetch a list of supplies received by merchants.
- **Response**:
    - `200 OK`: Returns an array of received supplies.
    - `401 Unauthorized`: User not authenticated.

## Product Endpoints

### Add New Product
- **URL**: `/api/products`
- **Method**: `POST`
- **Description**: Add a new product to the marketplace.
- **Request Body**:
    ```json
    {
        "name": "string",
        "description": "string",
        "price": "number",
        "stock": "number",
        "image_url": "string"
    }
    ```
- **Response**:
    - `201 Created`: Product added successfully.
    - `400 Bad Request`: Validation error.
    - `401 Unauthorized`: User not authenticated.

### Fetch Products
- **URL**: `/api/products`
- **Method**: `GET`
- **Description**: Fetch all products in the marketplace.
- **Response**:
    - `200 OK`: Returns an array of products.
    - `401 Unauthorized`: User not authenticated.

## Funds Endpoints

### Add Funds
- **URL**: `/api/add-funds`
- **Method**: `POST`
- **Description**: Add funds to a user's account.
- **Request Body**:
    ```json
    {
        "userId": "string",
        "amount": "number"
    }
    ```
- **Response**:
    - `200 OK`: Funds added successfully.
    - `400 Bad Request`: Validation error.
    - `401 Unauthorized`: User not authenticated.
