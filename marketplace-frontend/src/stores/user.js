// src/stores/user.js
import { writable } from 'svelte/store';

export const user = writable({
    userId: localStorage.getItem('userId') || null,
    token: localStorage.getItem('token') || null,
    role: localStorage.getItem('role') || null
});

// Listen to changes in the store and update localStorage accordingly
user.subscribe((value) => {
    if (value.userId) {
        localStorage.setItem('userId', value.userId);
        localStorage.setItem('token', value.token);
        localStorage.setItem('role', value.role);
    } else {
        localStorage.removeItem('userId');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
    }
});
