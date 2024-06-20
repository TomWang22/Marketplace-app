Marketplace Application

Table of Contents
-----------------

[](https://github.com/TomWang22/Marketplace-app/blob/main/README.md#table-of-contents)

1.  [Project Overview](https://github.com/TomWang22/Marketplace-app/blob/main/README.md#project-overview)
2.  [Features](https://github.com/TomWang22/Marketplace-app/blob/main/README.md#features)
3.  [Technologies Used](https://github.com/TomWang22/Marketplace-app/blob/main/README.md#technologies-used)
4.  [Installation](https://github.com/TomWang22/Marketplace-app/blob/main/README.md#installation)
5.  [Usage](https://github.com/TomWang22/Marketplace-app/blob/main/README.md#usage)
6.  [File Structure](https://github.com/TomWang22/Marketplace-app/blob/main/README.md#file-structure)
7.  [API Endpoints](https://github.com/TomWang22/Marketplace-app/blob/main/README.md#api-endpoints)
8.  [User Roles and Functionality](https://github.com/TomWang22/Marketplace-app/blob/main/README.md#user-roles-and-functionality)
9.  [Local Storage Usage](https://github.com/TomWang22/Marketplace-app/blob/main/README.md#local-storage-usage)
10. [CSS and Visual Design](https://github.com/TomWang22/Marketplace-app/blob/main/README.md#css-and-visual-design)
11. [Contributing](https://github.com/TomWang22/Marketplace-app/blob/main/README.md#contributing)
12. [License](https://github.com/TomWang22/Marketplace-app/blob/main/README.md#license)

Project Overview
----------------

[](https://github.com/TomWang22/Marketplace-app/blob/main/README.md#project-overview)

This project is a web-based marketplace application designed to manage and facilitate transactions between merchants, suppliers, and shoppers. It provides distinct dashboards and functionalities for different user roles, ensuring a seamless and user-friendly experience. The primary goal is to offer a platform where various users can interact with the marketplace according to their roles, making the buying and selling process efficient and streamlined.

Features
--------

[](https://github.com/TomWang22/Marketplace-app/blob/main/README.md#features)

-   Multi-View User Interface: Separate dashboards for merchants, suppliers, and shoppers.
    -   Merchants: Manage products, view received supplies, and send merchandise.
    -   Suppliers: Add supplies and send supplies to merchants.
    -   Shoppers: Manage shopping cart, add funds, and return merchandise.
-   Local Storage Implementation: Persistent user sessions and data storage.
-   Dynamic DOM and UI Updates: Real-time updates to the UI based on user interactions.
-   Event Handling: Responsive handling of user actions like clicks and inputs.
-   CSS and Visual Design: Enhanced visual design and responsiveness using a CSS framework.

Technologies Used
-----------------

[](https://github.com/TomWang22/Marketplace-app/blob/main/README.md#technologies-used)

-   Frontend: HTML, CSS, JavaScript
-   Backend: Node.js, Express.js
-   Database: PostgreSQL
-   Session Management: Redis
-   Authentication: JWT (JSON Web Tokens)
-   CSS Framework: Bootstrap (for enhanced styling)

Installation
------------

[](https://github.com/TomWang22/Marketplace-app/blob/main/README.md#installation)

### 1\. Clone the Repository

[](https://github.com/TomWang22/Marketplace-app/blob/main/README.md#1-clone-the-repository)

First, you need to clone the repository from GitHub to your local machine. Open your terminal and run:

```source-shell
git clone https://github.com/yourusername/marketplace.git
cd marketplace
2. Install Dependencies
Next, install all the necessary dependencies listed in your package.json file. This can be done using npm:

bash

npm install
3. Set Up PostgreSQL Database
Ensure you have PostgreSQL installed on your machine. Create a new database named marketplace:

bash

psql -U postgres -c "CREATE DATABASE marketplace;"
Run the SQL scripts provided in the db directory to set up the necessary tables:

bash

psql -U postgres -d marketplace -f db/scripts.sql
4. Set Up Redis
Ensure Redis is installed and running on your machine. Typically, you can start Redis with the following command:

bash

redis-server
Update the Redis connection settings in server.js if necessary. The default connection settings might look something like this:

javascript

const redis = require('ioredis');
const redisClient = new redis({
  host: 'localhost',
  port: 6379
});
5\. Start the Server
Start the backend server by running:

bash

npm start
This will start the Express server, which will be listening on a port (typically 3000) for incoming requests.

Usage
Running the Application
Start the backend server:

bash

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
javascriptCopy codeconst fs = require('fs');


const documentation = `
# Marketplace API Documentation


## Introduction
This API allows users to interact with a marketplace platform. It includes endpoints for user registration, login, managing shopping carts, placing orders, handling product supplies, and more.


## Base URL
\`http://localhost:3000\`


## Authentication
- The API uses JWT for authentication.
- Some endpoints require a valid JWT token in the \`Authorization\` header.


## Endpoints


### User Registration


#### \`POST /api/register\`
Registers a new user (shopper, merchant, or supplier).


**Request Body:**
\`\`\`json
{
  "username": "string",
  "password": "string",
  "role": "string" // 'shopper', 'merchant', or 'supplier'
}
\`\`\`


**Response:**
- \`200 OK\` on success.
- \`400 Bad Request\` if the username already exists or fields are missing.


### User Login


#### \`POST /api/login\`
Logs in a user and returns a JWT token.


**Request Body:**
\`\`\`json
{
  "username": "string",
  "password": "string"
}
\`\`\`


**Response:**
- \`200 OK\` on success.
- \`401 Unauthorized\` if credentials are invalid.


### Shopping Cart


#### \`GET /api/cart\`
Retrieves the current user's shopping cart items.


**Query Parameters:**
- \`userId\`: ID of the user.


**Response:**
- \`200 OK\` on success.
- \`500 Internal Server Error\` on failure.


#### \`POST /api/cart\`
Adds an item to the user's shopping cart.


**Request Body:**
\`\`\`json
{
  "userId": "integer",
  "productId": "integer",
  "quantity": "integer"
}
\`\`\`


**Response:**
- \`200 OK\` on success.
- \`500 Internal Server Error\` on failure.


#### \`PUT /api/cart/:id\`
Updates the quantity of an item in the user's shopping cart.


**Request Parameters:**
- \`id\`: ID of the cart item.


**Request Body:**
\`\`\`json
{
  "quantity": "integer"
}
\`\`\`


**Response:**
- \`200 OK\` on success.
- \`500 Internal Server Error\` on failure.


#### \`DELETE /api/cart/:id\`
Removes an item from the user's shopping cart.


**Request Parameters:**
- \`id\`: ID of the cart item.


**Response:**
- \`200 OK\` on success.
- \`500 Internal Server Error\` on failure.


### Orders


#### \`POST /api/place-order\`
Places an order with the items in the user's shopping cart.


**Request Body:**
\`\`\`json
{
  "userId": "integer",
  "cartItems": [
    {
      "productId": "integer",
      "quantity": "integer",
      "price": "number"
    }
  ]
}
\`\`\`


**Response:**
- \`200 OK\` on success.
- \`500 Internal Server Error\` on failure.


### Products


#### \`GET /api/products\`
Retrieves all products.


**Response:**
- \`200 OK\` on success.
- \`500 Internal Server Error\` on failure.


#### \`POST /api/products\`
Adds a new product.


**Request Body:**
\`\`\`json
{
  "name": "string",
  "description": "string",
  "price": "number",
  "stock": "integer",
  "image_url": "string"
}
\`\`\`


**Response:**
- \`200 OK\` on success.
- \`500 Internal Server Error\` on failure.


### Supplies


#### \`GET /api/supplies\`
Retrieves all supplies.


**Response:**
- \`200 OK\` on success.
- \`500 Internal Server Error\` on failure.


#### \`POST /api/supplies\`
Adds a new supply.


**Request Body:**
\`\`\`json
{
  "name": "string",
  "description": "string",
  "price": "number",
  "cost": "number",
  "stock": "integer",
  "image_url": "string"
}
\`\`\`


**Response:**
- \`200 OK\` on success.
- \`500 Internal Server Error\` on failure.


### User Account


#### \`GET /api/account-info\`
Retrieves account information for a user.


**Query Parameters:**
- \`userId\`: ID of the user.


**Response:**
- \`200 OK\` on success.
- \`500 Internal Server Error\` on failure.


### Purchase History


#### \`GET /api/purchase-history\`
Retrieves the purchase history for a user.


**Query Parameters:**
- \`userId\`: ID of the user.


**Response:**
- \`200 OK\` on success.
- \`500 Internal Server Error\` on failure.


### Miscellaneous


#### \`POST /api/add-funds\`
Adds funds to a user's account.


**Request Body:**
\`\`\`json
{
  "userId": "integer",
  "amount": "number"
}
\`\`\`


**Response:**
- \`200 OK\` on success.
- \`500 Internal Server Error\` on failure.


#### \`GET /api/received-supplies\`
Retrieves the received supplies.


**Response:**
- \`200 OK\` on success.
- \`500 Internal Server Error\` on failure.


## WebSocket Events


### Connection
Listens for client connections.


### \`sendMessage\`
Sends a message in the chat.


**Payload:**
\`\`\`json
{
  "message": "string",
  "userId": "integer",
  "role": "string"
}
\`\`\`


### \`sendSupplierMessage\`
Sends a message from a supplier.


**Payload:**
\`\`\`json
{
  "message": "string",
  "userId": "integer",
  "role": "string"
}
\`\`\`


### \`sendMerchantMessage\`
Sends a message from a merchant.


**Payload:**
\`\`\`json
{
  "message": "string",
  "userId": "integer",
  "role": "string"
}
\`\`\`


### \`disconnect\`
Handles client disconnection.


## Error Handling
- Errors return a JSON response with a \`success\` flag and a \`message\`.


## Notes
- Ensure the database and Redis server are running.
- Replace \`your_secret_key\` with a secure key in production.


## Authors
- Your Name
- Contributors
`;


fs.writeFile('API_DOCUMENTATION.md', documentation, (err) => {
  if (err) throw err;
  console.log('Documentation has been saved!');
});



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
```
