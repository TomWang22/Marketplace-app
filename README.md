Marketplace API Documentation
=============================

Introduction
------------

This API allows users to interact with a marketplace platform. It includes endpoints for user registration, login, managing shopping carts, placing orders, handling product supplies, and more.

Base URL
--------

http://localhost:3000

Authentication
--------------

*   The API uses JWT for authentication.
    
*   Some endpoints require a valid JWT token in the Authorization header.
    

Endpoints
---------

### User Registration

#### POST /api/register

Registers a new user (shopper, merchant, or supplier).

**Request Body:**

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   jsonCopy code{    "username": "string",    "password": "string",    "role": "string" // 'shopper', 'merchant', or 'supplier'  }   `

**Response:**

*   200 OK on success.
    
*   400 Bad Request if the username already exists or fields are missing.
    

### User Login

#### POST /api/login

Logs in a user and returns a JWT token.

**Request Body:**

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   jsonCopy code{    "username": "string",    "password": "string"  }   `

**Response:**

*   200 OK on success.
    
*   401 Unauthorized if credentials are invalid.
    

### Shopping Cart

#### GET /api/cart

Retrieves the current user's shopping cart items.

**Query Parameters:**

*   userId: ID of the user.
    

**Response:**

*   200 OK on success.
    
*   500 Internal Server Error on failure.
    

#### POST /api/cart

Adds an item to the user's shopping cart.

**Request Body:**

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   jsonCopy code{    "userId": "integer",    "productId": "integer",    "quantity": "integer"  }   `

**Response:**

*   200 OK on success.
    
*   500 Internal Server Error on failure.
    

#### PUT /api/cart/:id

Updates the quantity of an item in the user's shopping cart.

**Request Parameters:**

*   id: ID of the cart item.
    

**Request Body:**

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   jsonCopy code{    "quantity": "integer"  }   `

**Response:**

*   200 OK on success.
    
*   500 Internal Server Error on failure.
    

#### DELETE /api/cart/:id

Removes an item from the user's shopping cart.

**Request Parameters:**

*   id: ID of the cart item.
    

**Response:**

*   200 OK on success.
    
*   500 Internal Server Error on failure.
    

### Orders

#### POST /api/place-order

Places an order with the items in the user's shopping cart.

**Request Body:**

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   jsonCopy code{    "userId": "integer",    "cartItems": [      {        "productId": "integer",        "quantity": "integer",        "price": "number"      }    ]  }   `

**Response:**

*   200 OK on success.
    
*   500 Internal Server Error on failure.
    

### Products

#### GET /api/products

Retrieves all products.

**Response:**

*   200 OK on success.
    
*   500 Internal Server Error on failure.
    

#### POST /api/products

Adds a new product.

**Request Body:**

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   json{    "name": "string",    "description": "string",    "price": "number",    "stock": "integer",    "image_url": "string"  }   `

**Response:**

*   200 OK on success.
    
*   500 Internal Server Error on failure.
    

### Supplies

#### GET /api/supplies

Retrieves all supplies.

**Response:**

*   200 OK on success.
    
*   500 Internal Server Error on failure.
    

#### POST /api/supplies

Adds a new supply.

**Request Body:**

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   json{    "name": "string",    "description": "string",    "price": "number",    "cost": "number",    "stock": "integer",    "image_url": "string"  }   `

**Response:**

*   200 OK on success.
    
*   500 Internal Server Error on failure.
    

### User Account

#### GET /api/account-info

Retrieves account information for a user.

**Query Parameters:**

*   userId: ID of the user.
    

**Response:**

*   200 OK on success.
    
*   500 Internal Server Error on failure.
    

### Purchase History

#### GET /api/purchase-history

Retrieves the purchase history for a user.

**Query Parameters:**

*   userId: ID of the user.
    

**Response:**

*   200 OK on success.
    
*   500 Internal Server Error on failure.
    

### Miscellaneous

#### POST /api/add-funds

Adds funds to a user's account.

**Request Body:**

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   json{    "userId": "integer",    "amount": "number"  }   `

**Response:**

*   200 OK on success.
    
*   500 Internal Server Error on failure.
    

#### GET /api/received-supplies

Retrieves the received supplies.

**Response:**

*   200 OK on success.
    
*   500 Internal Server Error on failure.
    

WebSocket Events
----------------

### Connection

Listens for client connections.

### sendMessage

Sends a message in the chat.

**Payload:**

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   json{    "message": "string",    "userId": "integer",    "role": "string"  }   `

### sendSupplierMessage

Sends a message from a supplier.

**Payload:**

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   json{    "message": "string",    "userId": "integer",    "role": "string"  }   `

### sendMerchantMessage

Sends a message from a merchant.

**Payload:**

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   json{    "message": "string",    "userId": "integer",    "role": "string"  }   `

### disconnect

Handles client disconnection.

Error Handling
--------------

*   Errors return a JSON response with a success flag and a message.
    

Notes
-----

*   Ensure the database and Redis server are running.
    
*   Replace your\_secret\_key with a secure key in production.
    

Authors
-------

*   Your Name
    
*   Contributors
    

To write this documentation into a file that can be converted to markdown, you can use the following Node.js script:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML``   javascriptCopy codeconst fs = require('fs');  const documentation = `  # Marketplace API Documentation  ## Introduction  This API allows users to interact with a marketplace platform. It includes endpoints for user registration, login, managing shopping carts, placing orders, handling product supplies, and more.  ## Base URL  \`http://localhost:3000\`  ## Authentication  - The API uses JWT for authentication.  - Some endpoints require a valid JWT token in the \`Authorization\` header.  ## Endpoints  ### User Registration  #### \`POST /api/register\`  Registers a new user (shopper, merchant, or supplier).  **Request Body:**  \`\`\`json  {    "username": "string",    "password": "string",    "role": "string" // 'shopper', 'merchant', or 'supplier'  }  \`\`\`  **Response:**  - \`200 OK\` on success.  - \`400 Bad Request\` if the username already exists or fields are missing.  ### User Login  #### \`POST /api/login\`  Logs in a user and returns a JWT token.  **Request Body:**  \`\`\`json  {    "username": "string",    "password": "string"  }  \`\`\`  **Response:**  - \`200 OK\` on success.  - \`401 Unauthorized\` if credentials are invalid.  ### Shopping Cart  #### \`GET /api/cart\`  Retrieves the current user's shopping cart items.  **Query Parameters:**  - \`userId\`: ID of the user.  **Response:**  - \`200 OK\` on success.  - \`500 Internal Server Error\` on failure.  #### \`POST /api/cart\`  Adds an item to the user's shopping cart.  **Request Body:**  \`\`\`json  {    "userId": "integer",    "productId": "integer",    "quantity": "integer"  }  \`\`\`  **Response:**  - \`200 OK\` on success.  - \`500 Internal Server Error\` on failure.  #### \`PUT /api/cart/:id\`  Updates the quantity of an item in the user's shopping cart.  **Request Parameters:**  - \`id\`: ID of the cart item.  **Request Body:**  \`\`\`json  {    "quantity": "integer"  }  \`\`\`  **Response:**  - \`200 OK\` on success.  - \`500 Internal Server Error\` on failure.  #### \`DELETE /api/cart/:id\`  Removes an item from the user's shopping cart.  **Request Parameters:**  - \`id\`: ID of the cart item.  **Response:**  - \`200 OK\` on success.  - \`500 Internal Server Error\` on failure.  ### Orders  #### \`POST /api/place-order\`  Places an order with the items in the user's shopping cart.  **Request Body:**  \`\`\`json  {    "userId": "integer",    "cartItems": [      {        "productId": "integer",        "quantity": "integer",        "price": "number"      }    ]  }  \`\`\`  **Response:**  - \`200 OK\` on success.  - \`500 Internal Server Error\` on failure.  ### Products  #### \`GET /api/products\`  Retrieves all products.  **Response:**  - \`200 OK\` on success.  - \`500 Internal Server Error\` on failure.  #### \`POST /api/products\`  Adds a new product.  **Request Body:**  \`\`\`json  {    "name": "string",    "description": "string",    "price": "number",    "stock": "integer",    "image_url": "string"  }  \`\`\`  **Response:**  - \`200 OK\` on success.  - \`500 Internal Server Error\` on failure.  ### Supplies  #### \`GET /api/supplies\`  Retrieves all supplies.  **Response:**  - \`200 OK\` on success.  - \`500 Internal Server Error\` on failure.  #### \`POST /api/supplies\`  Adds a new supply.  **Request Body:**  \`\`\`json  {    "name": "string",    "description": "string",    "price": "number",    "cost": "number",    "stock": "integer",    "image_url": "string"  }  \`\`\`  **Response:**  - \`200 OK\` on success.  - \`500 Internal Server Error\` on failure.  ### User Account  #### \`GET /api/account-info\`  Retrieves account information for a user.  **Query Parameters:**  - \`userId\`: ID of the user.  **Response:**  - \`200 OK\` on success.  - \`500 Internal Server Error\` on failure.  ### Purchase History  #### \`GET /api/purchase-history\`  Retrieves the purchase history for a user.  **Query Parameters:**  - \`userId\`: ID of the user.  **Response:**  - \`200 OK\` on success.  - \`500 Internal Server Error\` on failure.  ### Miscellaneous  #### \`POST /api/add-funds\`  Adds funds to a user's account.  **Request Body:**  \`\`\`json  {    "userId": "integer",    "amount": "number"  }  \`\`\`  **Response:**  - \`200 OK\` on success.  - \`500 Internal Server Error\` on failure.  #### \`GET /api/received-supplies\`  Retrieves the received supplies.  **Response:**  - \`200 OK\` on success.  - \`500 Internal Server Error\` on failure.  ## WebSocket Events  ### Connection  Listens for client connections.  ### \`sendMessage\`  Sends a message in the chat.  **Payload:**  \`\`\`json  {    "message": "string",    "userId": "integer",    "role": "string"  }  \`\`\`  ### \`sendSupplierMessage\`  Sends a message from a supplier.  **Payload:**  \`\`\`json  {    "message": "string",    "userId": "integer",    "role": "string"  }  \`\`\`  ### \`sendMerchantMessage\`  Sends a message from a merchant.  **Payload:**  \`\`\`json  {    "message": "string",    "userId": "integer",    "role": "string"  }  \`\`\`  ### \`disconnect\`  Handles client disconnection.  ## Error Handling  - Errors return a JSON response with a \`success\` flag and a \`message\`.  ## Notes  - Ensure the database and Redis server are running.  - Replace \`your_secret_key\` with a secure key in production.  ## Authors  - Your Name  - Contributors  `;  fs.writeFile('API_DOCUMENTATION.md', documentation, (err) => {    if (err) throw err;    console.log('Documentation has been saved!');  });   ``
