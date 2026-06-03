# Frontend

React frontend migrated from Create React App to Vite.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
```

- `npm run dev` starts Vite on http://localhost:3000.
- `npm run build` writes the production bundle to `dist/`.
- `npm run preview` serves the built bundle locally.

## Environment

Vite reads client variables with the `VITE_` prefix:

```bash
VITE_AUTH_URL=/api/auth
VITE_CATALOG_URL=/api/catalog
VITE_ORDERING_URL=/api/ordering
VITE_FULFILLMENT_URL=/api/fulfillment
VITE_NOTIFICATION_URL=/api/notification
VITE_REVIEW_URL=/api/reviews
VITE_CHAT_API_URL=http://localhost:8000
VITE_CHAT_WS_URL=ws://localhost:8000
```

The Docker build defaults to gateway-relative API paths.

## Frontend Structure

```txt
src/
  components/
    customer/
  layouts/
  pages/
    auth/
    customer/
    admin/
    seller/
    notifications/
  services/
  store/
  utils/
  App.jsx
  main.jsx
```

Existing component modules remain in `src/components`; customer home sections live in `src/components/customer`, while `src/pages` provides route-level wrappers and new dashboard/cart/checkout pages.
