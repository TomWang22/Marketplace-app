--
-- PostgreSQL database dump
--

-- Dumped from database version 14.12 (Homebrew)
-- Dumped by pg_dump version 14.12 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: calculate_profit(numeric, numeric, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calculate_profit(price numeric, cost numeric, stock integer) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN (price - cost) * stock;
END;
$$;


ALTER FUNCTION public.calculate_profit(price numeric, cost numeric, stock integer) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: chat; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat (
    id integer NOT NULL,
    user_id integer NOT NULL,
    role character varying(20) NOT NULL,
    message text NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    username character varying(50) NOT NULL
);


ALTER TABLE public.chat OWNER TO postgres;

--
-- Name: chat_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chat_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.chat_id_seq OWNER TO postgres;

--
-- Name: chat_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chat_id_seq OWNED BY public.chat.id;


--
-- Name: inventory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory (
    id integer NOT NULL,
    user_id integer NOT NULL,
    product character varying(255) NOT NULL,
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL,
    product_id integer NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.inventory OWNER TO postgres;

--
-- Name: inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.inventory_id_seq OWNER TO postgres;

--
-- Name: inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventory_id_seq OWNED BY public.inventory.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.order_items_id_seq OWNER TO postgres;

--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: order_summary; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_summary (
    id integer NOT NULL,
    order_id integer NOT NULL,
    total_cost numeric(10,2) NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    user_id integer NOT NULL,
    status character varying(20) NOT NULL
);


ALTER TABLE public.order_summary OWNER TO postgres;

--
-- Name: order_summary_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_summary_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.order_summary_id_seq OWNER TO postgres;

--
-- Name: order_summary_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_summary_id_seq OWNED BY public.order_summary.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    user_id integer NOT NULL,
    total_cost numeric(10,2) NOT NULL,
    order_date timestamp with time zone DEFAULT now() NOT NULL,
    status character varying(20) NOT NULL
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.orders_id_seq OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text NOT NULL,
    price numeric(10,2) NOT NULL,
    stock integer NOT NULL,
    image_url character varying(255)
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.products_id_seq OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: purchase_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_history (
    id integer NOT NULL,
    user_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL,
    purchase_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.purchase_history OWNER TO postgres;

--
-- Name: purchase_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.purchase_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.purchase_history_id_seq OWNER TO postgres;

--
-- Name: purchase_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.purchase_history_id_seq OWNED BY public.purchase_history.id;


--
-- Name: received_supplies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.received_supplies (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text NOT NULL,
    price numeric(10,2) NOT NULL,
    stock integer NOT NULL,
    image_url character varying(255),
    merchant_id integer NOT NULL
);


ALTER TABLE public.received_supplies OWNER TO postgres;

--
-- Name: received_supplies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.received_supplies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.received_supplies_id_seq OWNER TO postgres;

--
-- Name: received_supplies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.received_supplies_id_seq OWNED BY public.received_supplies.id;


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    product_id integer NOT NULL,
    username character varying(50) NOT NULL,
    text text NOT NULL,
    rating integer NOT NULL,
    date timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.reviews_id_seq OWNER TO postgres;

--
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- Name: search_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.search_history (
    id integer NOT NULL,
    user_id integer NOT NULL,
    search_query character varying(255) NOT NULL,
    search_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.search_history OWNER TO postgres;

--
-- Name: search_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.search_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.search_history_id_seq OWNER TO postgres;

--
-- Name: search_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.search_history_id_seq OWNED BY public.search_history.id;


--
-- Name: shopping_cart; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shopping_cart (
    id integer NOT NULL,
    user_id integer NOT NULL,
    product_id integer NOT NULL,
    product character varying(255) NOT NULL,
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL,
    size character varying(50),
    image_url character varying(255)
);


ALTER TABLE public.shopping_cart OWNER TO postgres;

--
-- Name: shopping_cart_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.shopping_cart_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.shopping_cart_id_seq OWNER TO postgres;

--
-- Name: shopping_cart_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shopping_cart_id_seq OWNED BY public.shopping_cart.id;


--
-- Name: supplies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.supplies (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text NOT NULL,
    price numeric(10,2) NOT NULL,
    cost numeric(10,2) NOT NULL,
    stock integer NOT NULL,
    profit numeric(10,2) DEFAULT 0,
    image_url character varying(255)
);


ALTER TABLE public.supplies OWNER TO postgres;

--
-- Name: supplies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.supplies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.supplies_id_seq OWNER TO postgres;

--
-- Name: supplies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.supplies_id_seq OWNED BY public.supplies.id;


--
-- Name: supply_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.supply_requests (
    id integer NOT NULL,
    merchant_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    request_date timestamp with time zone DEFAULT now() NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying
);


ALTER TABLE public.supply_requests OWNER TO postgres;

--
-- Name: supply_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.supply_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.supply_requests_id_seq OWNER TO postgres;

--
-- Name: supply_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.supply_requests_id_seq OWNED BY public.supply_requests.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(20) NOT NULL,
    balance numeric(10,2) DEFAULT 0
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: chat id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat ALTER COLUMN id SET DEFAULT nextval('public.chat_id_seq'::regclass);


--
-- Name: inventory id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory ALTER COLUMN id SET DEFAULT nextval('public.inventory_id_seq'::regclass);


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: order_summary id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_summary ALTER COLUMN id SET DEFAULT nextval('public.order_summary_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: purchase_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_history ALTER COLUMN id SET DEFAULT nextval('public.purchase_history_id_seq'::regclass);


--
-- Name: received_supplies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.received_supplies ALTER COLUMN id SET DEFAULT nextval('public.received_supplies_id_seq'::regclass);


--
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- Name: search_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.search_history ALTER COLUMN id SET DEFAULT nextval('public.search_history_id_seq'::regclass);


--
-- Name: shopping_cart id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shopping_cart ALTER COLUMN id SET DEFAULT nextval('public.shopping_cart_id_seq'::regclass);


--
-- Name: supplies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplies ALTER COLUMN id SET DEFAULT nextval('public.supplies_id_seq'::regclass);


--
-- Name: supply_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supply_requests ALTER COLUMN id SET DEFAULT nextval('public.supply_requests_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: chat; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat (id, user_id, role, message, "timestamp", username) FROM stdin;
\.


--
-- Data for Name: inventory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory (id, user_id, product, quantity, price, product_id, "timestamp") FROM stdin;
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, order_id, product_id, quantity, price) FROM stdin;
\.


--
-- Data for Name: order_summary; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_summary (id, order_id, total_cost, product_id, quantity, user_id, status) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, user_id, total_cost, order_date, status) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, name, description, price, stock, image_url) FROM stdin;
1	Linen-Cotton Suit Blazer	Lightweight linen-cotton blend. Notch lapel. Long sleeves with button cuffs. Button-front closure. Front welt pockets.	198.00	1000	https://bananarepublic.gap.com/webcontent/0055/978/529/cn55978529.jpg
2	Slim Italian Wool Suit Jacket	Luxuriously soft, Italian wool. Notch lapel. Long sleeves with button cuffs. Two-button front. Front flap pockets.	398.00	1000	https://bananarepublic.gap.com/webcontent/0055/665/121/cn55665121.jpg
3	Emerson Chino Suit Pant	Lightweight, stretch cotton-blend. Zip fly with button closure. Front slant pockets. Back welt pockets.	98.50	1000	https://bananarepublic.gap.com/webcontent/0055/982/690/cn55982690.jpg
4	Slim Italian Wool Suit Pant	Luxuriously soft, Italian wool. Zip fly with button closure. Front slant pockets. Back welt pockets.	198.00	1000	https://bananarepublic.gap.com/webcontent/0055/768/792/cn55768792.jpg
5	Linen-Cotton Suit Pant	Lightweight linen-cotton blend. Zip fly with button closure. Front slant pockets. Back welt pockets.	128.00	1000	https://bananarepublic.gap.com/webcontent/0055/860/378/cn55860378.jpg
6	Italian Wool Suit	A refined, classic suit made from luxurious Italian wool. Notch lapel, long sleeves with button cuffs. Two-button front. Front flap pockets.	498.00	1000	https://bananarepublic.gap.com/webcontent/0055/860/180/cn55860180.jpg
7	Modern-Fit Italian Wool Suit	Modern fit, made from Italian wool. Notch lapel, long sleeves with button cuffs. Two-button front. Front flap pockets.	398.00	1000	https://bananarepublic.gap.com/webcontent/0055/860/180/cn55860180.jpg
8	Linen Suit Jacket	Linen fabric. Notch lapel. Long sleeves with button cuffs. Two-button front. Front flap pockets.	248.00	1000	https://bananarepublic.gap.com/webcontent/0055/069/306/cn55069306.jpg
9	Wool Suit Jacket	Wool fabric. Notch lapel. Long sleeves with button cuffs. Two-button front. Front flap pockets.	298.00	1000	https://bananarepublic.gap.com/webcontent/0055/338/333/cn55338333.jpg
10	Cotton Blazer	Cotton fabric. Notch lapel. Long sleeves with button cuffs. Two-button front. Front flap pockets.	198.00	1000	https://bananarepublic.gap.com/webcontent/0055/250/788/cn55250788.jpg
11	Linen-Cotton Blazer	Lightweight linen-cotton blend. Notch lapel. Long sleeves with button cuffs. Two-button front. Front flap pockets.	248.00	1000	https://bananarepublic.gap.com/webcontent/0055/201/810/cn55201810.jpg
12	Wool-Blend Blazer	Wool blend fabric. Notch lapel. Long sleeves with button cuffs. Two-button front. Front flap pockets.	298.00	1000	https://bananarepublic.gap.com/webcontent/0055/201/870/cn55201870.jpg
13	Cotton Suit Jacket	Cotton fabric. Notch lapel. Long sleeves with button cuffs. Two-button front. Front flap pockets.	198.00	1000	https://bananarepublic.gap.com/webcontent/0054/898/918/cn54898918.jpg
14	Linen Blazer	Linen fabric. Notch lapel. Long sleeves with button cuffs. Two-button front. Front flap pockets.	248.00	1000	https://bananarepublic.gap.com/webcontent/0054/898/777/cn54898777.jpg
15	Wool Blazer	Wool fabric. Notch lapel. Long sleeves with button cuffs. Two-button front. Front flap pockets.	298.00	1000	https://bananarepublic.gap.com/webcontent/0055/764/979/cn55764979.jpg
16	Cotton-Linen Blazer	Lightweight cotton-linen blend. Notch lapel. Long sleeves with button cuffs. Two-button front. Front flap pockets.	198.00	1000	https://bananarepublic.gap.com/webcontent/0055/764/989/cn55764989.jpg
\.


--
-- Data for Name: purchase_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchase_history (id, user_id, product_id, quantity, price, purchase_date) FROM stdin;
\.


--
-- Data for Name: received_supplies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.received_supplies (id, name, description, price, stock, image_url, merchant_id) FROM stdin;
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reviews (id, product_id, username, text, rating, date) FROM stdin;
\.


--
-- Data for Name: search_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.search_history (id, user_id, search_query, search_date) FROM stdin;
\.


--
-- Data for Name: shopping_cart; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shopping_cart (id, user_id, product_id, product, quantity, price, size, image_url) FROM stdin;
\.


--
-- Data for Name: supplies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.supplies (id, name, description, price, cost, stock, profit, image_url) FROM stdin;
1	Linen-Cotton Suit Blazer	Lightweight linen-cotton blend. Notch lapel. Long sleeves with button cuffs. Button-front closure. Front welt pockets.	198.00	98.00	1000	100000.00	https://bananarepublic.gap.com/webcontent/0055/978/529/cn55978529.jpg
2	Slim Italian Wool Suit Jacket	Luxuriously soft, Italian wool. Notch lapel. Long sleeves with button cuffs. Two-button front. Front flap pockets.	398.00	298.00	1000	100000.00	https://bananarepublic.gap.com/webcontent/0055/665/121/cn55665121.jpg
3	Emerson Chino Suit Pant	Lightweight, stretch cotton-blend. Zip fly with button closure. Front slant pockets. Back welt pockets.	98.50	48.50	1000	50000.00	https://bananarepublic.gap.com/webcontent/0055/982/690/cn55982690.jpg
4	Slim Italian Wool Suit Pant	Luxuriously soft, Italian wool. Zip fly with button closure. Front slant pockets. Back welt pockets.	198.00	98.00	1000	100000.00	https://bananarepublic.gap.com/webcontent/0055/768/792/cn55768792.jpg
5	Linen-Cotton Suit Pant	Lightweight linen-cotton blend. Zip fly with button closure. Front slant pockets. Back welt pockets.	128.00	28.00	1000	100000.00	https://bananarepublic.gap.com/webcontent/0055/860/378/cn55860378.jpg
6	Italian Wool Suit	A refined, classic suit made from luxurious Italian wool. Notch lapel, long sleeves with button cuffs. Two-button front. Front flap pockets.	498.00	398.00	1000	100000.00	https://bananarepublic.gap.com/webcontent/0055/860/180/cn55860180.jpg
7	Modern-Fit Italian Wool Suit	Modern fit, made from Italian wool. Notch lapel, long sleeves with button cuffs. Two-button front. Front flap pockets.	398.00	298.00	1000	100000.00	https://bananarepublic.gap.com/webcontent/0055/860/180/cn55860180.jpg
8	Linen Suit Jacket	Linen fabric. Notch lapel. Long sleeves with button cuffs. Two-button front. Front flap pockets.	248.00	148.00	1000	100000.00	https://bananarepublic.gap.com/webcontent/0055/069/306/cn55069306.jpg
9	Wool Suit Jacket	Wool fabric. Notch lapel. Long sleeves with button cuffs. Two-button front. Front flap pockets.	298.00	198.00	1000	100000.00	https://bananarepublic.gap.com/webcontent/0055/338/333/cn55338333.jpg
10	Cotton Blazer	Cotton fabric. Notch lapel. Long sleeves with button cuffs. Two-button front. Front flap pockets.	198.00	98.00	1000	100000.00	https://bananarepublic.gap.com/webcontent/0055/250/788/cn55250788.jpg
11	Linen-Cotton Blazer	Lightweight linen-cotton blend. Notch lapel. Long sleeves with button cuffs. Two-button front. Front flap pockets.	248.00	148.00	1000	100000.00	https://bananarepublic.gap.com/webcontent/0055/201/810/cn55201810.jpg
12	Wool-Blend Blazer	Wool blend fabric. Notch lapel. Long sleeves with button cuffs. Two-button front. Front flap pockets.	298.00	198.00	1000	100000.00	https://bananarepublic.gap.com/webcontent/0055/201/870/cn55201870.jpg
13	Cotton Suit Jacket	Cotton fabric. Notch lapel. Long sleeves with button cuffs. Two-button front. Front flap pockets.	198.00	98.00	1000	100000.00	https://bananarepublic.gap.com/webcontent/0054/898/918/cn54898918.jpg
14	Linen Blazer	Linen fabric. Notch lapel. Long sleeves with button cuffs. Two-button front. Front flap pockets.	248.00	148.00	1000	100000.00	https://bananarepublic.gap.com/webcontent/0054/898/777/cn54898777.jpg
15	Wool Blazer	Wool fabric. Notch lapel. Long sleeves with button cuffs. Two-button front. Front flap pockets.	298.00	198.00	1000	100000.00	https://bananarepublic.gap.com/webcontent/0055/764/979/cn55764979.jpg
16	Cotton-Linen Blazer	Lightweight cotton-linen blend. Notch lapel. Long sleeves with button cuffs. Two-button front. Front flap pockets.	198.00	98.00	1000	100000.00	https://bananarepublic.gap.com/webcontent/0055/764/989/cn55764989.jpg
\.


--
-- Data for Name: supply_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.supply_requests (id, merchant_id, product_id, quantity, request_date, status) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password, role, balance) FROM stdin;
1	shopper1	shopper1	shopper	50000.00
2	shopper2	shopper2	shopper	50000.00
3	supplier1	supplier1	supplier	50000.00
4	supplier2	supplier2	supplier	50000.00
5	merchant1	merchant1	merchant	50000.00
6	merchant2	merchant2	merchant	50000.00
\.


--
-- Name: chat_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chat_id_seq', 1, false);


--
-- Name: inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventory_id_seq', 1, false);


--
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_items_id_seq', 1, false);


--
-- Name: order_summary_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_summary_id_seq', 1, false);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 1, false);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 16, true);


--
-- Name: purchase_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.purchase_history_id_seq', 1, false);


--
-- Name: received_supplies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.received_supplies_id_seq', 1, false);


--
-- Name: reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reviews_id_seq', 1, false);


--
-- Name: search_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.search_history_id_seq', 1, false);


--
-- Name: shopping_cart_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shopping_cart_id_seq', 1, false);


--
-- Name: supplies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.supplies_id_seq', 16, true);


--
-- Name: supply_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.supply_requests_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 6, true);


--
-- Name: chat chat_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat
    ADD CONSTRAINT chat_pkey PRIMARY KEY (id);


--
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: order_summary order_summary_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_summary
    ADD CONSTRAINT order_summary_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: purchase_history purchase_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_history
    ADD CONSTRAINT purchase_history_pkey PRIMARY KEY (id);


--
-- Name: received_supplies received_supplies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.received_supplies
    ADD CONSTRAINT received_supplies_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: search_history search_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.search_history
    ADD CONSTRAINT search_history_pkey PRIMARY KEY (id);


--
-- Name: shopping_cart shopping_cart_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shopping_cart
    ADD CONSTRAINT shopping_cart_pkey PRIMARY KEY (id);


--
-- Name: supplies supplies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplies
    ADD CONSTRAINT supplies_pkey PRIMARY KEY (id);


--
-- Name: supply_requests supply_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supply_requests
    ADD CONSTRAINT supply_requests_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: chat chat_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat
    ADD CONSTRAINT chat_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: inventory inventory_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: order_summary order_summary_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_summary
    ADD CONSTRAINT order_summary_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: order_summary order_summary_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_summary
    ADD CONSTRAINT order_summary_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: purchase_history purchase_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_history
    ADD CONSTRAINT purchase_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: received_supplies received_supplies_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.received_supplies
    ADD CONSTRAINT received_supplies_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.users(id);


--
-- Name: reviews reviews_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: search_history search_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.search_history
    ADD CONSTRAINT search_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: shopping_cart shopping_cart_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shopping_cart
    ADD CONSTRAINT shopping_cart_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: shopping_cart shopping_cart_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shopping_cart
    ADD CONSTRAINT shopping_cart_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: supply_requests supply_requests_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supply_requests
    ADD CONSTRAINT supply_requests_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

