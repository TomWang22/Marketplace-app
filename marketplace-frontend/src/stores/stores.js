// src/stores/stores.js
import { writable } from 'svelte/store';

export const user = writable(null);
export const cartItemCount = writable(0);
export const products = writable([]);
export const notifications = writable([]);
export const receivedSupplies = writable([]);
export const searchQuery = writable('');
export const cartItems = writable([]);
export const totalCost = writable(0);
export const supplyRequests = writable([]);
export const supplyRequestsVisible = writable(false);
export const chatMessages = writable([]);
export const supplies = writable([]); // Add this line
