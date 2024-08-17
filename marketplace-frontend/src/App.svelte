<script>
	import { user as userStore } from './stores/stores';
	import Router, { push } from 'svelte-spa-router';
	import About from './components/About.svelte';
	import Contact from './components/Contact.svelte';
	import CreateAccount from './components/CreateAccount.svelte';
	import Login from './components/Login.svelte';
	import Marketplace from './components/Marketplace.svelte';
	import Merchant from './components/Merchant.svelte';
	import Privacy from './components/Privacy.svelte';
	import ProductDetails from './components/ProductDetails.svelte';
	import ShoppingCart from './components/ShoppingCart.svelte';
	import Supplier from './components/Supplier.svelte';
	import Terms from './components/Terms.svelte';
	import Shopper from './components/Shopper.svelte';

	let isAuthenticated = false;

	userStore.subscribe(value => {
		isAuthenticated = value !== null && value.token !== null;
	});

	const routes = {
		'/': Login, // default to login
		'/about': About,
		'/contact': Contact,
		'/create-account': CreateAccount,
		'/login': Login,
		'/marketplace': Marketplace,
		'/merchant': Merchant,
		'/privacy': Privacy,
		'/product-details/:id': ProductDetails,
		'/shopping-cart': ShoppingCart,
		'/supplier': Supplier,
		'/terms': Terms,
		'/shopper': Shopper,
		'*': Login
	};

		const token = localStorage.getItem('token');
		const userId = localStorage.getItem('userId');
		const role = localStorage.getItem('role');
		const username = localStorage.getItem('username');

		if (token && userId && role) {
			userStore.set({
				userId: userId,
				username: username,
				role: role,
				token: token
			});

			// Redirect based on role using push from svelte-spa-router
			switch (role) {
				case 'shopper':

				push('/shopper');
				break;
				case 'supplier':
					push('/supplier');
					break;
				case 'merchant':
					push('/merchant');
					break;
				default:
					push('/login');
					break;
			}
		} else {
			push('/login');
		}

	
</script>

<body>
<Router {routes} />
</body>

<style>
	@import './styles/global.css'; /* Ensure this path is correct */
</style>
