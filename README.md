# Marketplace Application

## Table of Contents
- [Project Overview](#project-overview)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [File Structure](#file-structure)
- [API Endpoints](#api-endpoints)
- [User Roles and Functionality](#user-roles-and-functionality)
- [Local Storage Usage](#local-storage-usage)
- [CSS and Visual Design](#css-and-visual-design)
- [Contributing](#contributing)
- [License](#license)

## Project Overview
This project is a web-based marketplace application designed to manage and facilitate transactions between merchants, suppliers, and shoppers. It provides distinct dashboards and functionalities for different user roles, ensuring a seamless and user-friendly experience. The primary goal is to offer a platform where various users can interact with the marketplace according to their roles, making the buying and selling process efficient and streamlined.

## Features
- Multi-View User Interface: Separate dashboards for merchants, suppliers, and shoppers.
- Merchants: Can manage products, view received supplies, and send merchandise.
- Suppliers: Can add supplies and send supplies to merchants.
- Shoppers: Can manage their shopping cart, add funds, and return merchandise.
- Local Storage Implementation: Persistent user sessions and data storage.
- Dynamic DOM and UI Updates: Real-time updates to the UI based on user interactions.
- Event Handling: Responsive handling of user actions like clicks and inputs.
- CSS and Visual Design: Enhanced visual design and responsiveness using a CSS framework.

## Technologies Used
- **Frontend:** Svelte, JavaScript, HTML, CSS
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Session Management:** Redis
- **Authentication:** JWT (JSON Web Tokens)
- **Containerization:** Docker, Docker Compose

## Installation
### Clone the Repository
```sh
git clone https://github.com/yourusername/marketplace.git
cd marketplace
```

### Install Dependencies
```sh
npm install
```

### Set Up PostgreSQL Database
- Create a database named `marketplace`.
- Run the SQL scripts provided in the `db` directory to set up the necessary tables:
```sh
psql -U postgres -d marketplace -f db/scripts.sql
```

### Set Up Redis
- Ensure Redis is installed and running on your machine.
- Update the Redis connection settings in `server.js` if necessary.

### Start the Docker Containers
- Ensure Docker and Docker Compose are installed.
- Start the containers:
```sh
docker-compose up --build
```

## Usage
### Running the Application
- Open your browser and navigate to `http://localhost:5001`.

## File Structure
```plaintext
marketplace/
├── db/
│   └── scripts.sql
├── marketplace-frontend/
│   ├── node_modules/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── About.svelte
│   │   │   ├── Contact.svelte
│   │   │   ├── CreateAccount.svelte
│   │   │   ├── Login.svelte
│   │   │   ├── Marketplace.svelte
│   │   │   ├── Merchant.svelte
│   │   │   ├── SearchResults.svelte
│   │   │   ├── Shopper.svelte
│   │   │   ├── ShoppingCart.svelte
│   │   │   ├── Supplier.svelte
│   │   │   ├── Terms.svelte
│   │   ├── stores/
│   │   │   ├── stores.js
│   │   ├── App.svelte
│   │   ├── global.css
│   │   ├── main.js
│   ├── Dockerfile
│   ├── package.json
│   ├── rollup.config.js
├── services/
│   ├── cart-service/
│   │   ├── src/
│   │   │   └── index.js
│   │   ├── Dockerfile
│   │   ├── ecosystem.config.js
│   │   ├── package.json
│   ├── chat-service/
│   ├── merchant-service/
│   ├── order-service/
│   ├── product-service/
│   ├── supply-service/
│   ├── user-service/
├── docker-compose.yml
├── marketplace_dump.sql
├── package-lock.json
├── package.json
├── README.md
```

## API Endpoints
The backend API provides the following endpoints:

### User Endpoints
- User Registration: `POST /api/register`
- User Login: `POST /api/login`

### Shopping Cart Endpoints
- Fetch Cart Items: `GET /api/cart?userId=:userId`
- Update Cart Item Quantity: `PUT /api/cart/:id`
- Remove Cart Item: `DELETE /api/cart/:id`

### Order Endpoints
- Place Order: `POST /api/place-order`
- Return Merchandise: `POST /api/return-merchandise`

### Supply Endpoints
- Receive Supplies: `POST /api/receive-supplies`
- Fetch Received Supplies: `GET /api/received-supplies`

### Product Endpoints
- Add New Product: `POST /api/products`
- Fetch Products: `GET /api/products`

### Funds Endpoints
- Add Funds: `POST /api/add-funds`

## User Roles and Functionality
### Merchant
- Add New Products: Merchants can add new products with details like name, description, price, stock, and image URL.
- View and Manage Received Supplies: Merchants can view a list of supplies they have received.
- Send Merchandise: Merchants can send merchandise to customers by providing the customer ID, product ID, and quantity.

### Supplier
- Add New Supplies: Suppliers can add new supplies to their inventory.
- Send Supplies: Suppliers can send supplies to merchants based on requests, specifying the merchant ID, product ID, and quantity.

### Shopper
- Add Funds: Shoppers can add funds to their account by specifying the amount.
- Return Merchandise: Shoppers can return merchandise by providing the product ID and quantity.
- View and Manage Shopping Cart: Shoppers can view and manage items in their shopping cart, adjust quantities, and remove items.
- Purchase Products: Shoppers can purchase products from the marketplace.

## Local Storage Usage
The application uses local storage to manage user sessions and persist data across sessions. Key usage includes:
- User Authentication Tokens: Store JWT tokens to maintain user sessions.
- User Roles and IDs: Persist the role and ID of the logged-in user to manage access and functionality.
- Shopping Cart Items: Save the state of the shopper's cart to ensure persistence across sessions.

## CSS and Visual Design
The application uses a custom CSS file (`global.css`) to ensure a cohesive and visually appealing design. Bootstrap is integrated to enhance the responsiveness and styling of the UI components. Key styles include:
- Responsive Layouts: Ensures the application looks good on all devices.
- Button Styles: Custom styles for buttons to enhance user experience.
- Form Elements: Styled input fields and forms for a consistent look and feel.

## Contributing
Contributions are welcome! Please fork the repository and create a pull request with your changes. Ensure that your code adheres to the existing style and conventions used in the project.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.
```

Make sure to update any specific paths or details to match your actual project setup and replace placeholders like `yourusername` with your actual GitHub username or relevant information. This README file now reflects the usage of Svelte for the frontend and the inclusion of microservices.