 Marketplace Application

## Table of Contents
1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Technologies Used](#technologies-used)
4. [Installation](#installation)
5. [Usage](#usage)
6. [File Structure](#file-structure)
7. [API Endpoints](#api-endpoints)
8. [User Roles and Functionality](#user-roles-and-functionality)
9. [Local Storage Usage](#local-storage-usage)
10. [CSS and Visual Design](#css-and-visual-design)
11. [Contributing](#contributing)
12. [License](#license)

## Project Overview
This project is a web-based marketplace application designed to manage and facilitate transactions between merchants, suppliers, and shoppers. It provides distinct dashboards and functionalities for different user roles, ensuring a seamless and user-friendly experience. The primary goal is to offer a platform where various users can interact with the marketplace according to their roles, making the buying and selling process efficient and streamlined.

## Features
- **Multi-View User Interface**: Separate dashboards for merchants, suppliers, and shoppers.
  - **Merchants**: Manage products, view received supplies, and send merchandise.
  - **Suppliers**: Add supplies and send supplies to merchants.
  - **Shoppers**: Manage shopping cart, add funds, and return merchandise.
- **Local Storage Implementation**: Persistent user sessions and data storage.
- **Dynamic DOM and UI Updates**: Real-time updates to the UI based on user interactions.
- **Event Handling**: Responsive handling of user actions like clicks and inputs.
- **CSS and Visual Design**: Enhanced visual design and responsiveness using a CSS framework.

## Technologies Used
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Session Management**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **CSS Framework**: Bootstrap (for enhanced styling)

## Installation

### 1. Clone the Repository
First, you need to clone the repository from GitHub to your local machine. Open your terminal and run:
```bash
git clone https://github.com/yourusername/marketplace.git
cd marketplace
2. Install Dependencies
Next, install all the necessary dependencies listed in your package.json file. This can be done using npm:

bash
Copy code
npm install
3. Set Up PostgreSQL Database
Ensure you have PostgreSQL installed on your machine. Create a new database named marketplace:

bash
Copy code
psql -U postgres -c "CREATE DATABASE marketplace;"
Run the SQL scripts provided in the db directory to set up the necessary tables:

bash
Copy code
psql -U postgres -d marketplace -f db/scripts.sql
4. Set Up Redis
Ensure Redis is installed and running on your machine. Typically, you can start Redis with the following command:

bash
Copy code
redis-server
Update the Redis connection settings in server.js if necessary. The default connection settings might look something like this:

javascript
Copy code
const redis = require('ioredis');
const redisClient = new redis({
  host: 'localhost',
  port: 6379
});
5. Start the Server
Start the backend server by running:

bash
Copy code
npm start
This will start the Express server, which will be listening on a port (typically 3000) for incoming requests.

Usage
Running the Application
Start the backend server:

bash
Copy code
npm start
Open your browser and navigate to http://localhost:3000.

You should now see the application running and can begin interacting with it.

Additional Information
Dependencies Overview
express: A web framework for Node.js, used to build the backend server.
body-parser: Middleware to parse incoming request bodies.
cors: Middleware to enable Cross-Origin Resource Sharing.
bcryptjs: Library to hash passwords for security.
jsonwebtoken: Library to create and verify JSON Web Tokens for authentication.
pg: PostgreSQL client for Node.js, used to interact with the PostgreSQL database.
ioredis: Redis client for Node.js, used for session management and caching.
connect-redis: Redis session store for Express.
socket.io: Library to enable real-time, bidirectional, event-based communication.
Ensure all these dependencies are installed and properly configured in your project to guarantee smooth operation of the marketplace application.

File Structure
plaintext
Copy code
marketplace/
├── db/
│   └── scripts.sql
├── src/
│   ├── backend/
│   │   └── server.js
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
API Endpoints
Authentication
Register
URL: /api/register
Method: POST
Description: Register a new user.
Request Body:
json
Copy code
{
  "username": "string",
  "password": "string",
  "role": "string"
}
Responses:
200 OK:
json
Copy code
{
  "success": true,
  "user": {
    "id": "integer",
    "username": "string",
    "role": "string",
    "balance": "number"
  }
}
400 Bad Request: Missing fields or username already exists.
500 Internal Server Error: Server error.
Login
URL: /api/login
Method: POST
Description: Login an existing user.
Request Body:
json
Copy code
{
  "username": "string",
  "password": "string"
}
Responses:
200 OK:
json
Copy code
{
  "success": true,
  "userId": "integer",
  "role": "string",
  "token": "string"
}
401 Unauthorized: Invalid credentials.
500 Internal Server Error: Server error.
User Information
Get Account Info
URL: /api/account-info
Method: GET
Description: Get account information of a user.
Query Parameters: userId
Responses:
200 OK:
json
Copy code
{
  "success": true,
  "account": {
    "username": "string",
    "balance": "number"
  }
}
500 Internal Server Error: Server error.
Get Purchase History
URL: /api/purchase-history
Method: GET
Description: Get purchase history of a user.
Query Parameters: userId
Responses:
200 OK:
json
Copy code
{
  "success": true,
  "history": [
    {
      "id": "integer",
      "product_id": "integer",
      "quantity": "integer",
      "purchase_date": "string"
    }
  ]
}
500 Internal Server Error: Server error.
Cart Operations
Get Cart Items
URL: /api/cart
Method: GET
Description: Get all items in a user's shopping cart.
Query Parameters: userId
Responses:
200 OK:
json
Copy code
{
  "success": true,
  "items": [
    {
      "id": "integer",
      "user_id": "integer",
      "product_id": "integer",
      "product": "string",
      "quantity": "integer",
      "price": "number"
    }
  ]
}
500 Internal Server Error: Server error.
Add Item to Cart
URL: /api/cart
Method: POST
Description: Add an item to the shopping cart.
Request Body:
json
Copy code
{
  "userId": "integer",
  "productId": "integer",
  "quantity": "integer"
}
Responses:
200 OK:
json
Copy code
{
  "success": true,
  "item": {
    "id": "integer",
    "user_id": "integer",
    "product_id": "integer",
    "product": "string",
    "quantity": "integer",
    "price": "number"
  }
}
400 Bad Request: Missing fields or product not found.
500 Internal Server Error: Server error.
Update Cart Item
URL: /api/cart/:id
Method: PUT
Description: Update the quantity of an item in the shopping cart.
Request Parameters: id
Request Body:
json
Copy code
{
  "quantity": "integer"
}
Responses:
200 OK:
json
Copy code
{
  "success": true
}
500 Internal Server Error: Server error.
Remove Item from Cart
URL: /api/cart/:id
Method: DELETE
Description: Remove an item from the shopping cart.
Request Parameters: id
Responses:
200 OK:
json
Copy code
{
  "success": true
}
500 Internal Server Error: Server error.
Order Operations
Place Order
URL: /api/place-order
Method: POST
Description: Place an order for items in the cart.
Request Body:
json
Copy code
{
  "userId": "integer",
  "cartItems": [
    {
      "product_id": "integer",
      "quantity": "integer",
      "price": "number"
    }
  ]
}
Responses:
200 OK:
json
Copy code
{
  "success": true,
  "message": "Order placed successfully."
}
400 Bad Request: Insufficient balance.
500 Internal Server Error: Server error.
Return Merchandise
URL: /api/return-merchandise
Method: POST
Description: Return purchased merchandise within the return period.
Request Body:
json
Copy code
{
  "userId": "integer",
  "productId": "integer",
  "quantity": "integer"
}
Responses:
200 OK:
json
Copy code
{
  "success": true,
  "message": "Merchandise returned and refunded successfully."
}
400 Bad Request: Return period expired or no purchase record found.
500 Internal Server Error: Server error.
Products
Get All Products
URL: /api/products
Method: GET
Description: Retrieve all products.
Responses:
200 OK:
json
Copy code
{
  "success": true,
  "products": [
    {
      "id": "integer",
      "name": "string",
      "description": "string",
      "price": "number",
      "stock": "integer",
      "image_url": "string"
    }
  ]
}
500 Internal Server Error: Server error.
Add New Product
URL: /api/products
Method: POST
Description: Add a new product.
Request Body:
json
Copy code
{
  "name": "string",
  "description": "string",
  "price": "number",
  "stock": "integer",
  "image_url": "string"
}
Responses:
200 OK:
json
Copy code
{
  "success": true,
  "product": {
    "id": "integer",
    "name": "string",
    "description": "string",
    "price": "number",
    "stock": "integer",
    "image_url": "string"
  }
}
500 Internal Server Error: Server error.
Supplies
Get All Supplies
URL: /api/supplies
Method: GET
Description: Retrieve all supplies.
Responses:
200 OK:
json
Copy code
{
  "success": true,
  "supplies": [
    {
      "id": "integer",
      "name": "string",
      "description": "string",
      "price": "number",
      "cost": "number",
      "stock": "integer",
      "image_url": "string"
    }
  ]
}
500 Internal Server Error: Server error.
Add New Supply
URL: /api/supplies
Method: POST
Description: Add a new supply.
Request Body:
json
Copy code
{
  "name": "string",
  "description": "string",
  "price": "number",
  "cost": "number",
  "stock": "integer",
  "image_url": "string"
}
Responses:
200 OK:
json
Copy code
{
  "success": true,
  "supply": {
    "id": "integer",
    "name": "string",
    "description": "string",
    "price": "number",
    "cost": "number",
    "stock": "integer",
    "image_url": "string"
  }
}
500 Internal Server Error: Server error.
Supply Requests
Request Supply
URL: /api/request-supply
Method: POST
Description: Request supplies from suppliers.
Request Body:
json
Copy code
{
  "merchantId": "integer",
  "productId": "integer",
  "quantity": "integer"
}
Responses:
200 OK:
json
Copy code
{
  "success": true,
  "request": {
    "id": "integer",
    "merchant_id": "integer",
    "product_id": "integer",
    "quantity": "integer",
    "request_date": "string"
  }
}
500 Internal Server Error: Server error.
Get Supply Requests
URL: /api/supply-requests
Method: GET
Description: Retrieve all supply requests.
Responses:
200 OK:
json
Copy code
{
  "success": true,
  "requests": [
    {
      "id": "integer",
      "merchant_id": "integer",
      "product_id": "integer",
      "quantity": "integer",
      "request_date": "string",
      "name": "string",
      "description": "string",
      "image_url": "string"
    }
  ]
}
500 Internal Server Error: Server error.
Send Supplies
URL: /api/send-supplies
Method: POST
Description: Send supplies to merchants.
Request Body:
json
Copy code
{
  "supplierId": "integer",
  "merchantId": "integer",
  "productId": "integer",
  "quantity": "integer"
}
Responses:
200 OK:
json
Copy code
{
  "success": true,
  "message": "Supplies sent and stock updated successfully."
}
500 Internal Server Error: Server error.
Funds
Add Funds
URL: /api/add-funds
Method: POST
Description: Add funds to a user's account.
Request Body:
json
Copy code
{
  "userId": "integer",
  "amount": "number"
}
Responses:
200 OK:
json
Copy code
{
  "success": true,
  "message": "Funds added successfully."
}
400 Bad Request: Amount must be greater than zero.
500 Internal Server Error: Server error.
Get Received Supplies
URL: /api/received-supplies
Method: GET
Description: Retrieve all received supplies.
Responses:
200 OK:
json
Copy code
{
  "success": true,
  "supplies": [
    {
      "id": "integer",
      "name": "string",
      "description": "string",
      "price": "number",
      "stock": "integer",
      "image_url": "string"
    }
  ]
}
500 Internal Server Error: Server error.
Users
Get User Data
URL: /api/users/:userId
Method: GET
Description: Get user data including shopping and search history.
Request Parameters: userId
Responses:
200 OK:
json
Copy code
{
  "success": true,
  "user": {
    "username": "string",
    "balance": "number",
    "shoppingHistory": [
      {
        "id": "integer",
        "product_id": "integer",
        "quantity": "integer",
        "purchase_date": "string"
      }
    ],
    "searchHistory": [
      {
        "id": "integer",
        "search_query": "string",
        "search_date": "string"
      }
    ]
  }
}
404 Not Found: User not found.
500 Internal Server Error: Server error.
Add Search History
URL: /api/search-history
Method: POST
Description: Add a search query to the user's search history.
Request Body:
json
Copy code
{
  "userId": "integer",
  "searchQuery": "string"
}
Responses:
200 OK:
json
Copy code
{
  "success": true
}
500 Internal Server Error: Server error.
Static Files and Pages
Serve Static Files
URL: /*
Method: GET
Description: Serve static files and HTML pages.
Responses:
200 OK: Serves the requested HTML page.
404 Not Found: Page not found.
User Roles and Functionality
Merchant
Add New Products: Merchants can add new products with details like name, description, price, stock, and image URL.
View and Manage Received Supplies: Merchants can view a list of supplies they have received.
Send Merchandise: Merchants can send merchandise to customers by providing the customer ID, product ID, and quantity.
Supplier
Add New Supplies: Suppliers can add new supplies to their inventory.
Send Supplies: Suppliers can send supplies to merchants based on requests, specifying the merchant ID, product ID, and quantity.
Shopper
Add Funds: Shoppers can add funds to their account by specifying the amount.
Return Merchandise: Shoppers can return merchandise by providing the product ID and quantity.
View and Manage Shopping Cart: Shoppers can view and manage items in their shopping cart, adjust quantities, and remove items.
Purchase Products: Shoppers can purchase products from the marketplace.
Local Storage Usage
The application uses local storage to manage user sessions and persist data across sessions. Key usage includes:

User Authentication Tokens: Store JWT tokens to maintain user sessions.
User Roles and IDs: Persist the role and ID of the logged-in user to manage access and functionality.
Shopping Cart Items: Save the state of the shopper's cart to ensure persistence across sessions.
CSS and Visual Design
The application uses a custom CSS file (styles.css) to ensure a cohesive and visually appealing design. Bootstrap is integrated to enhance the responsiveness and styling of the UI components. Key styles include:

Responsive Layouts: Ensures the application looks good on all devices.
Button Styles: Custom styles for buttons to enhance user experience.
Form Elements: Styled input fields and forms for a consistent look and feel.
Contributing
Contributions are welcome! Please fork the repository and create a pull request with your changes. Ensure that your code adheres to the existing style and conventions used in the project.

License
MIT
