<script>
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { cartItemCount } from '../stores/stores'; 
  import { push } from 'svelte-spa-router';

  let productId;
  let userId;
  let product = writable({});
  let reviews = writable([]);
  let averageRating = writable('N/A');
  let totalReviews = writable(0);
  let relatedProducts = writable([]);
  let reviewText = '';
  let reviewRating = '1';
  const keywords = ['great', 'good', 'bad', 'excellent'];

  onMount(async () => {
      window.addEventListener('hashchange', handleHashChange);
      await handleHashChange();
  });

  async function handleHashChange() {
      const hash = window.location.hash;
      const pathParts = hash.split('/');
      productId = pathParts[pathParts.length - 1];
      userId = localStorage.getItem('userId');

      if (!userId) {
          window.location.hash = '#/login';
          return;
      }

      if (!productId) {
          console.error('Product ID not found in URL');
          return;
      }

      await updateCartItemCount();
      await displayProductDetails();
  }

  async function fetchProductDetails(productId) {
      try {
          const response = await fetch(`http://localhost:4002/api/products/${productId}`);
          if (response.ok) {
              const data = await response.json();
              return data.product;
          } else {
              console.error('Error fetching product details:', response.statusText);
              return null;
          }
      } catch (error) {
          console.error('Error fetching product details:', error);
          return null;
      }
  }

  async function fetchProductReviews(productId) {
    try {
        const response = await fetch(`http://localhost:4002/api/reviews?productId=${productId}`);
        if (response.ok) {
            const data = await response.json();
            return data; // This should be an array of reviews
        } else {
            console.error('Error fetching product reviews:', response.statusText);
            return [];
        }
    } catch (error) {
        console.error('Error fetching product reviews:', error);
        return [];
    }
}


  async function fetchRelatedProducts(productKeywords) {
      try {
          const response = await fetch(`http://localhost:4002/api/products`);
          if (response.ok) {
              const data = await response.json();
              return data.products.filter(p => p.id !== productId && productKeywords.some(keyword => p.keywords.includes(keyword)));
          } else {
              console.error('Error fetching related products:', response.statusText);
              return [];
          }
      } catch (error) {
          console.error('Error fetching related products:', error);
          return [];
      }
  }

  async function fetchCartItems() {
      try {
          const response = await fetch(`http://localhost:4005/api/cart?userId=${userId}`);
          const data = await response.json();
          return data.items;
      } catch (error) {
          console.error('Error fetching cart items:', error);
          return [];
      }
  }

  async function updateCartItemCount() {
      const cartItems = await fetchCartItems();
      const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
      cartItemCount.set(itemCount);
  }

  async function displayProductDetails() {
      try {
          const prod = await fetchProductDetails(productId);
          if (!prod) throw new Error('Product not found');
          
          product.set(prod); 

          const prodReviews = await fetchProductReviews(productId);
          reviews.set(prodReviews);
          totalReviews.set(prodReviews.length);
          if (prodReviews.length > 0) {
              averageRating.set((prodReviews.reduce((sum, review) => sum + review.rating, 0) / prodReviews.length).toFixed(2));
          }

          const relatedProds = await fetchRelatedProducts(prod.keywords);
          relatedProducts.set(relatedProds);
      } catch (error) {
          console.error('Error displaying product details:', error);
      }
  }

  async function addToCart(productId, size, quantity) {
      try {
          const response = await fetch('http://localhost:4005/api/cart', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ userId, productId, quantity, size })
          });
          const data = await response.json();
          if (data.success) {
              await updateCartItemCount();
              alert('Item added to cart');
          } else {
              alert('Failed to add item to cart');
          }
      } catch (error) {
          console.error('Error adding item to cart:', error);
          alert('Error adding item to cart');
      }
  }

  async function submitReview() {
    try {
        const response = await fetch('http://localhost:4002/api/reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                product_id: productId, 
                username: userId, 
                text: reviewText, 
                rating: parseInt(reviewRating) 
            })
        });
        const data = await response.json();
        if (data.success) {
            alert('Review submitted successfully');

            reviews.update(reviews => [...reviews, data.review]);
            totalReviews.update(count => count + 1);
            averageRating.update(avg => ((avg * (totalReviews - 1) + data.review.rating) / totalReviews).toFixed(2));
            reviewText = '';
            reviewRating = '1';
        } else {
            alert('Failed to submit review');
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        alert('Error submitting review');
    }
}


  function highlightKeywords(reviewText, keywords) {
      let highlightedText = reviewText;
      keywords.forEach(keyword => {
          const regex = new RegExp(`(${keyword})`, 'gi');
          highlightedText = highlightedText.replace(regex, '<span class="highlight">$1</span>');
      });
      return highlightedText;
  }

  function getSizeOptions(productType) {
      const sizeOptionsMap = {
          "suit": ["36 Short", "36 Regular", "36 Long", "38 Short", "38 Regular", "38 Long", "40 Short", "40 Regular", "40 Long", "42 Short", "42 Regular", "42 Long", "44 Short", "44 Regular", "44 Long", "46 Short", "46 Regular", "46 Long", "48 Short", "48 Regular", "48 Long", "50 Short", "50 Regular", "50 Long"],
          "dress shirt": ["XS", "S", "M", "L", "XL"]
      };

      const cleanedProductType = productType.toLowerCase().trim();
      for (const keyword in sizeOptionsMap) {
          if (cleanedProductType.includes(keyword)) {
              return sizeOptionsMap[keyword];
          }
      }
      return ["One Size"];
  }

  function logout() {
      localStorage.removeItem('userId');
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      window.location.hash = '#/login';
  }
</script>

<style>
    body {
        font-family: 'Roboto', sans-serif;
        background-color: #fafafa;
        margin: 0;
        padding: 0;
    }
  
    header {
        background-color: #283593;
        color: #fff;
        padding: 15px 30px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }
  
    header .logo {
        font-size: 1.8rem;
        font-weight: bold;
    }
  
    nav a, nav button {
        color: #fff;
        text-decoration: none;
        margin: 0 1rem;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1rem;
    }
  
    nav a:hover, nav button:hover {
        text-decoration: underline;
    }
  
    #cartItemCount {
        background-color: red;
        border-radius: 50%;
        padding: 0.25rem 0.5rem;
        color: white;
        margin-left: 0.5rem;
    }
  
    main {
        max-width: 1200px;
        margin: 30px auto;
        padding: 30px;
        background-color: #ffffff;
        border-radius: 12px;
        box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
    }
  
    .product-details {
        background-color: #e3f2fd;
        padding: 25px;
        border-radius: 12px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        margin-bottom: 30px;
    }
  
    .product-details img {
        max-width: 100%;
        border-radius: 12px;
        margin-bottom: 20px;
    }
  
    .product-details h1 {
        font-size: 2rem;
        color: #1a237e;
        margin-bottom: 10px;
    }
  
    .product-details p {
        color: #555;
        margin-bottom: 10px;
    }
  
    .product-details label {
        display: block;
        margin-top: 20px;
        font-weight: bold;
        color: #333;
    }
  
    .product-details select, 
    .product-details input {
        width: 100%;
        padding: 12px;
        margin-top: 10px;
        border: 1px solid #cfd8dc;
        border-radius: 6px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  
    .product-details button {
        margin-top: 20px;
        padding: 14px 24px;
        background-color: #039be5;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 1rem;
        transition: background-color 0.3s ease, box-shadow 0.3s ease;
    }
  
    .product-details button:hover {
        background-color: #0277bd;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    }
  
    .product-reviews {
        background-color: #e3f2fd;
        padding: 25px;
        border-radius: 12px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        margin-bottom: 30px;
    }
  
    .product-reviews .review {
        margin-bottom: 20px;
        color: #1a237e;
    }
  
    .product-reviews textarea, 
    .product-reviews select {
        width: 100%;
        padding: 12px;
        margin-top: 10px;
        border: 1px solid #cfd8dc;
        border-radius: 6px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  
    .product-reviews button {
        margin-top: 20px;
        padding: 14px 24px;
        background-color: #039be5;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 1rem;
        transition: background-color 0.3s ease, box-shadow 0.3s ease;
    }
  
    .product-reviews button:hover {
        background-color: #0277bd;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    }
  
    footer {
        background-color: #333;
        color: #fff;
        padding: 20px;
        text-align: center;
        border-radius: 0 0 12px 12px;
    }
  
    footer nav a {
        color: #fff;
        text-decoration: none;
        margin: 0 15px;
    }
  
    footer nav a:hover {
        text-decoration: underline;
    }
  </style>
  
<header>
  <div class="logo">Marketplace</div>
  <nav>
    <button on:click={() => push('/marketplace')}>Home</button>
    <button on:click={() => push('/shopping-cart')}>Cart (<span>{$cartItemCount}</span>)</button>
  </nav>
</header>

<main>
  <section id="product-details" class="product-details">
      {#if $product.id}
          <img src={$product.image_url} alt={$product.name}>
          <h1>{$product.name}</h1>
          <p>{$product.description}</p>
          <p>${parseFloat($product.price).toFixed(2)}</p>
          <label for="sizeSelect">Select Size:</label>
          <select id="sizeSelect">
              {#each getSizeOptions($product.name) as size}
                  <option value={size}>{size}</option>
              {/each}
          </select>
          <label for="quantityInput">Quantity:</label>
          <input type="number" id="quantityInput" min="1" value="1">
          <button on:click={() => addToCart($product.id, document.getElementById('sizeSelect').value, parseInt(document.getElementById('quantityInput').value))}>Add to Cart</button>
      {/if}
  </section>

  <section id="product-reviews" class="product-reviews">
      <h2>Reviews</h2>
      <div>
          <p>Average Rating: {$averageRating}</p>
          <p>Total Reviews: {$totalReviews}</p>
      </div>
      <div>
          {#if $reviews.length === 0}
              <p>No reviews available.</p>
          {/if}
          {#each $reviews as review}
              <div class="review">
                  <p><strong>{review.username}:</strong> {@html highlightKeywords(review.text, keywords)}</p>
                  <p>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
                  <p><small>{new Date(review.date).toLocaleDateString()}</small></p>
              </div>
          {/each}
      </div>
      <div>
          <h3>Leave a Review</h3>
          <textarea bind:value={reviewText} placeholder="Write your review here..."></textarea>
          <label for="ratingSelect">Rating:</label>
          <select id="ratingSelect" bind:value={reviewRating}>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
          </select>
          <button on:click={submitReview}>Submit Review</button>
      </div>
  </section>
</main>

<footer>
  <nav>
      <a href="#/about">About Us</a>
      <a href="#/contact">Contact</a>
      <a href="#/privacy">Privacy Policy</a>
      <a href="#/terms">Terms of Service</a>
  </nav>
</footer>
