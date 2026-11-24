# Café Menu

A mobile-first digital menu for a café. Customers scan a QR code at the table, browse the menu, customise drinks, and place an order.

## Features
- Sticky category bar that highlights as you scroll
- Search and a "Veg only" filter
- Item sheet with sizes, add-ons, special requests and quantity
- Cart with quantity controls, tax and total; remembered across reloads
- Order confirmation with table number
- Automatic dark mode

## Run it
No build step. Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

## Customise
Edit `menu.js` to change the café name, currency, categories, items, sizes and add-ons.

Deploy the folder to any static host (GitHub Pages, Netlify, Vercel), then print a QR code that points to the URL.

## Table service (`table-service/`)

A restaurant table-ordering website, published as a live Claude artifact. Guests open `#table-5` (a QR code or NFC tag per table), order from a photo menu, share one order and bill across phones at the same table, call the waiter, play a game with table and restaurant leaderboards, and pay at the table. Staff open `#staff` to see the whole floor, send orders to the kitchen with one tap, mark items served and clear tables.

Payments are simulated. Hook the pay buttons to a provider such as Razorpay or Stripe for real use.

### Admin (`#admin`)

For the owner and editors:
- **Tables & QR codes:** a printable QR card per table (download one, or all on one sheet), copy each table's link for NFC tags.
- **Menu:** add, edit and delete dishes, change prices, mark items sold out, upload real photos.
- **Settings:** restaurant name, number of tables, GST, Wi-Fi, and the guest link the QR codes open (set this to your own domain once hosted).

The QR library loads from cdnjs (`qrcode-generator` 1.4.4).

## Deploying to Vercel

`site/index.html` is the standalone build of `table-service/index.html`. After changing the app, rebuild it:

```sh
python3 scripts/build-site.py
```

In Vercel, set the project's **Root Directory** to `site` (no build command, no framework). On a normal website the app runs in demo mode: orders are saved on each device only. Syncing orders between phones and the staff screen needs a backend (for example Supabase).
