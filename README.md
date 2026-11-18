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
