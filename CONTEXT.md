# Project Context

Last verified: 2026-05-28, local Docker compose environment.

Base URLs used for verification:

- Gateway: `http://localhost:8080`
- Frontend through gateway: `http://localhost:8080`
- Frontend direct container: `http://localhost:3000`

All API items below are APIs that were called successfully in the current Docker setup unless explicitly marked otherwise.

## Running Services Verified

- `api-gateway`: running, `http://localhost:8080` returns `200`.
- `frontend`: running, `http://localhost:3000` returns `200`.
- `catalog-service`: running, product/catalog APIs return data.
- `ordering-service`: running, `GET /health` returns OK.
- `fulfillment-service`: running, creates fulfillment from `OrderPlaced` and accepts seller status transitions.
- `notification-service`: running, creates notifications from order/fulfillment events.
- `iam-service`: running, register/login/me work through gateway after gateway restart.
- `mysql`, `postgres`, `rabbitmq`: running and healthy.

## Tested APIs

### Gateway And Frontend

| Method | URL | Result |
|---|---|---|
| `GET` | `/` | `200`, serves React app |
| `GET` | `/product-list` | `200`, serves React route |
| `GET` | `/product-detail/id=1` | `200`, serves React route |
| `GET` | `/catalogs/1` | `200`, serves React route |

### IAM

| Method | URL | Result |
|---|---|---|
| `GET` | `/api/auth/health` | OK, DB connected |
| `POST` | `/api/auth/register` | OK, returns `userId` |
| `POST` | `/api/auth/login` | OK, returns `accessToken` and `refreshToken` |
| `GET` | `/api/auth/me` | OK with bearer token, returns current user |

Verified flow:

```text
register -> login -> me
```

Current frontend status: no page/form uses these APIs yet.

### Catalog

| Method | URL | Result |
|---|---|---|
| `GET` | `/api/catalog/api/v1/catalogs/` | OK, returns seeded categories |
| `GET` | `/api/catalog/api/v1/catalogs/1` | OK, returns one category |
| `GET` | `/api/catalog/api/v1/catalogs/1/products` | OK, returns products in category |
| `GET` | `/api/catalog/api/v1/products/` | OK, returns product list |
| `GET` | `/api/catalog/api/v1/products/?skip=0&limit=8` | OK, returns paged product list |
| `GET` | `/api/catalog/api/v1/products/1` | OK, returns product detail |
| `GET` | `/api/catalog/api/v1/products/1/availability` | Implemented and expected usable by Ordering/manual tests |

Important note:

- Use trailing slash for list catalogs: `/api/v1/catalogs/`.
- Calling `/api/v1/catalogs` without trailing slash returns FastAPI `307`. Frontend source has been fixed to use `/catalogs/`.

### Ordering

| Method | URL | Result |
|---|---|---|
| `GET` | `/api/ordering/health` | OK |
| `POST` | `/api/ordering/api/v1/carts` | OK, creates active cart |
| `GET` | `/api/ordering/api/v1/carts/:cartId` | OK, returns cart |
| `POST` | `/api/ordering/api/v1/carts/:cartId/items` | OK, adds item |
| `PATCH` | `/api/ordering/api/v1/carts/:cartId/items/:productId` | Implemented, not used by frontend |
| `POST` | `/api/ordering/api/v1/orders/checkout` | OK, creates `PLACED` order and publishes `OrderPlaced` |
| `GET` | `/api/ordering/api/v1/orders/:orderId` | OK, returns order and status |
| `GET` | `/api/ordering/api/v1/orders?userId=:userId` | Implemented, not used by frontend |
| `POST` | `/api/ordering/api/v1/orders/:orderId/cancel` | Implemented, not used by frontend |

Verified flow:

```text
create cart -> add item -> checkout -> order status PLACED
```

### Fulfillment

| Method | URL | Result |
|---|---|---|
| `GET` | `/api/fulfillment/fulfillments?orderId=:orderId` | OK, returns fulfillment created from `OrderPlaced` |
| `GET` | `/api/fulfillment/fulfillments/:id` | Implemented |
| `GET` | `/api/fulfillment/seller/orders` | Implemented |
| `PATCH` | `/api/fulfillment/seller/orders/:id/confirm` | OK, fulfillment `CONFIRMED`, order `SELLER_CONFIRMED` |
| `PATCH` | `/api/fulfillment/seller/orders/:id/ship` | OK, fulfillment `SHIPPED`, order `IN_DELIVERY` |
| `PATCH` | `/api/fulfillment/seller/orders/:id/deliver` | OK, fulfillment `DELIVERED`, order `DELIVERED` |
| `PATCH` | `/api/fulfillment/seller/orders/:id/complete` | OK, fulfillment `COMPLETED`, order `COMPLETED` |

Verified flow:

```text
OrderPlaced event -> fulfillment PENDING
seller confirm -> SellerOrderConfirmed event -> Ordering updates to SELLER_CONFIRMED
seller ship -> DeliveryUpdated event -> Ordering updates to IN_DELIVERY
seller deliver -> DeliveryUpdated event -> Ordering updates to DELIVERED
seller complete -> OrderCompleted event -> Ordering updates to COMPLETED
```

Current frontend status: no seller fulfillment page uses these APIs yet.

### Notification

| Method | URL | Result |
|---|---|---|
| `GET` | `/api/notification/api/v1/notifications?userId=:userId` | OK, returns notifications created from events |
| `PATCH` | `/api/notification/api/v1/notifications/:notificationId/read` | Implemented, not used by frontend |

Verified behavior:

- Checkout creates an `OrderPlaced` notification.
- Full seller flow through complete produced 5 notifications for the tested user.

Current frontend status: no notification page uses these APIs yet.

## Tested Business Flows

### Flow 1: Auth

Status: backend API verified, no frontend UI.

```text
POST /api/auth/register
-> POST /api/auth/login
-> GET /api/auth/me with Bearer token
```

Verified result:

- Register returned `userId`.
- Login returned JWT tokens.
- Me returned the registered username.

### Flow 2: Catalog Browse

Status: backend API verified and frontend pages exist.

```text
GET /api/catalog/api/v1/catalogs/
GET /api/catalog/api/v1/products/
GET /api/catalog/api/v1/products/:id
GET /api/catalog/api/v1/catalogs/:id/products
```

Verified result:

- Seeded categories exist: `Electronics`, `Fashion`.
- Seeded products exist: `Tai nghe Chong on Pro`, `Dong ho The thao`.

### Flow 3: Cart And Checkout

Status: backend API verified and frontend cart/checkout exists.

```text
Frontend add item
-> POST /api/ordering/api/v1/carts
-> POST /api/ordering/api/v1/carts/:cartId/items
-> POST /api/ordering/api/v1/orders/checkout
-> OrderPlaced event
-> Fulfillment creates PENDING fulfillment
-> Notification creates notification
```

Verified result:

- Cart created as `ACTIVE`.
- Checkout returned order status `PLACED`.
- Fulfillment count was `1`, first fulfillment status `PENDING`.
- Notification count was `1` after checkout.

### Flow 4: Seller Fulfillment Status Updates

Status: backend API verified, no frontend UI.

```text
PATCH /api/fulfillment/seller/orders/:id/confirm
-> order SELLER_CONFIRMED

PATCH /api/fulfillment/seller/orders/:id/ship
-> order IN_DELIVERY

PATCH /api/fulfillment/seller/orders/:id/deliver
-> order DELIVERED

PATCH /api/fulfillment/seller/orders/:id/complete
-> order COMPLETED
```

Verified result:

- Fulfillment status transitions: `PENDING -> CONFIRMED -> SHIPPED -> DELIVERED -> COMPLETED`.
- Ordering consumed fulfillment events and updated order status correctly.
- Notification service created notifications during the flow.

## Frontend Pages And Working Functions

### `/` - Landing Page

File: `frontend/src/components/LandingPage.js`

Working:

- Page loads.
- Header/nav anchors render.
- Catalog list renders using `GET /api/v1/catalogs/`.
- Featured product cards render from local hardcoded data.
- Cart icon opens cart drawer.
- On page load/open cart, frontend creates or loads cart through Ordering API.
- `Them vao gio` on featured products adds item to cart.
- Cart drawer shows item list, quantities, subtotal.
- `Checkout COD` calls checkout API and creates an order.

Limitations:

- `Mua ngay`, `Xem khuyen mai`, `Xem chi tiet` overlay buttons on featured products are visual only; they do not navigate or call APIs.
- Featured products are hardcoded, not loaded from Catalog API.
- Text encoding in this file has mojibake in several Vietnamese strings.

### `/product-list` - Product List

File: `frontend/src/components/catalog/ProductList.js`

Working:

- Loads products from `GET /api/v1/products/?skip=&limit=`.
- Search input filters products client-side by name.
- Pagination buttons change page and refetch products.
- Clicking product card navigates to `/product-detail/id=:id`.
- `Them vao gio` adds product to cart.

Limitations:

- Search is client-side only for currently loaded page.
- No cart drawer on this page, so user sees success message but cannot inspect/checkout cart here.

### `/product-detail/:slug` - Product Detail

File: `frontend/src/components/catalog/ProductDetail.js`

Working:

- Loads product detail from `GET /api/v1/products/:id`.
- Back button navigates back.
- Image gallery renders.
- Quantity plus/minus works.
- `Them vao gio hang` adds selected quantity to cart.

Limitations:

- No checkout button on this page.
- No review display or review submission UI.

### `/catalogs/:catalogId` - Catalog Product List

File: `frontend/src/components/catalog/CatalogProductList.js`

Working:

- Loads catalog info from `GET /api/v1/catalogs/:id`.
- Loads catalog products from `GET /api/v1/catalogs/:id/products`.
- Price filter works client-side.
- Brand/location filter UI works client-side.
- Product cards navigate to product detail.
- `Them vao gio` adds product to cart.

Limitations:

- Seeded products currently do not have `brand` and `location` fields, so brand/location filters may filter everything out.
- No cart drawer or checkout on this page.

## Frontend Functions Missing Backend Or Not Yet Wired

### Backend Exists But Frontend Page Missing

- Auth pages:
  - Login form
  - Register form
  - Current user/profile page
- Order pages:
  - User order list
  - User order detail/status tracking
  - Cancel order button
- Seller pages:
  - Seller order list
  - Confirm order
  - Ship order
  - Deliver order
  - Complete order
- Notification pages:
  - Notification list
  - Mark notification as read
- Fulfillment tracking page:
  - Display carrier/tracking code/status history

### Frontend UI Exists But Button Is Visual Only

- Landing page `Mua ngay`.
- Landing page `Xem khuyen mai`.
- Landing page featured product `Xem chi tiet` overlay.
- Footer customer support links.
- Newsletter email input and submit button.

### Backend/API Missing Or Not Wired Enough

- Review UI and API integration from frontend.
- Product review listing/submission in Product Detail.
- Payment beyond static `COD` checkout.
- Real stock reservation during add-to-cart/checkout. Current catalog stock update is asynchronous from events.
- Cart item update/delete from frontend. Ordering has update API, but UI has no quantity edit/remove controls inside the cart drawer.
- Product list server-side search/filter/sort. Current search/filtering is mostly client-side.

## Known Operational Notes

- After rebuilding backend services, restart gateway if routes return stale `502`:

```powershell
docker compose restart api-gateway
```

- Gateway nginx has been updated to use Docker DNS runtime resolver to avoid stale upstream IPs.
- Frontend nginx also uses Docker DNS runtime resolver.
- React build currently succeeds with warnings about missing hook dependencies in:
  - `CatalogProductList.js`
  - `ProductDetail.js`
  - `ProductList.js`
