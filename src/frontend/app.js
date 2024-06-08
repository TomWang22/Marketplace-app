document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('testButton').addEventListener('click', () => {
        alert('Button clicked!');
    });
});

async function fetchProducts() {
    const response = await fetch('/api/products');
    const products = await response.json();
    console.log(products);
}

fetchProducts();
