// src/main.js
import App from './App.svelte'; // Import the root Svelte component
import '@fortawesome/fontawesome-free/css/all.min.css';  
import './global.css'; // Import global CSS styles

// Initialize the Svelte app, mounting it to the document body
const app = new App({
    target: document.body, // The element to which the app is mounted
});

export default app; // Export the app instance for potential use elsewhere
