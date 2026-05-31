# Project Context

Last verified: 2026-05-31, local Docker compose environment.

Base URLs used for verification:

- Gateway: `http://localhost:8080`
- Frontend through gateway: `http://localhost:8080`
- Frontend direct container: `http://localhost:3000`
- Adminer database GUI: `http://localhost:8081`

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
- `adminer`: running, `http://localhost:8081` returns `200`.

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
| `POST` | `/api/auth/register` | OK, accepts `CUSTOMER`/`SELLER` role and returns `userId` |
| `POST` | `/api/auth/login` | OK, returns `accessToken` and `refreshToken` |
| `GET` | `/api/auth/me` | OK with bearer token, returns current user including `role` |

Verified flow:

```text
register -> login -> me
```

Current frontend status: auth pages exist at `/login`, `/register`, and `/profile`. Register includes Customer/Seller account type selection.

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

Current frontend status: seller fulfillment page exists at `/seller/orders`.

### Notification

| Method | URL | Result |
|---|---|---|
| `GET` | `/api/notification/api/v1/notifications?userId=:userId` | OK, returns notifications created from events |
| `PATCH` | `/api/notification/api/v1/notifications/:notificationId/read` | Implemented, not used by frontend |

Verified behavior:

- Checkout creates an `OrderPlaced` notification.
- Full seller flow through complete produced 5 notifications for the tested user.

Current frontend status: notification page exists at `/notifications`.

## Tested Business Flows

### Flow 1: Auth

Status: backend API verified and frontend auth UI exists.

```text
POST /api/auth/register
-> POST /api/auth/login
-> GET /api/auth/me with Bearer token
```

Verified result:

- Register returned `userId` and role.
- Login returned JWT tokens.
- Me returned the registered username and role.

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

Status: backend API verified and frontend seller UI exists.

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

All items from this section have frontend pages as of 2026-05-31.

- Auth pages:
  - `/login` login form calls `POST /api/auth/login`.
  - `/register` register form calls `POST /api/auth/register` with `CUSTOMER` or `SELLER`.
  - `/profile` current user page calls `GET /api/auth/me` when an access token exists and displays role.
- Order pages:
  - `/orders` lists user orders using `GET /api/ordering/api/v1/orders?userId=:userId`.
  - `/orders/:orderId` shows order detail and status history using `GET /api/ordering/api/v1/orders/:orderId`.
  - `/orders/:orderId` includes cancel support using `POST /api/ordering/api/v1/orders/:orderId/cancel`.
- Seller pages:
  - `/seller/orders` lists seller fulfillments using `GET /api/fulfillment/seller/orders`.
  - `/seller/orders` supports confirm, ship, deliver, and complete actions through the seller fulfillment PATCH APIs.
  - `/seller/orders` uses the logged-in IAM seller user's `id` as `sellerId` and blocks non-seller users.
- Notification pages:
  - `/notifications` lists notifications using `GET /api/notification/api/v1/notifications?userId=:userId`.
  - `/notifications` marks one notification read using `PATCH /api/notification/api/v1/notifications/:notificationId/read`.
  - `/notifications` also supports mark-all-read using `PATCH /api/notification/api/v1/notifications/read-all?userId=:userId`.
- Fulfillment tracking page:
  - `/fulfillment-tracking/:orderId` displays fulfillment status, carrier, tracking code, and milestone timestamps from `GET /api/fulfillment/fulfillments?orderId=:orderId`.

Limitations:

- `/orders` and `/notifications` expose editable `userId` fields so local demo data can be inspected.
- New seller accounts use their IAM `userId` as `sellerId`. Existing seeded catalog/demo products still use fixed seller IDs such as `seller-001`, so newly registered sellers only see fulfillments for orders whose item `sellerId` matches their IAM user ID.
- Auth tokens are stored in `localStorage` for MVP frontend integration.
- The new pages use ASCII Vietnamese text to avoid adding more mojibake while older landing/catalog files still contain encoding issues.

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

- Adminer is available for inspecting Docker databases:

```text
URL: http://localhost:8081
MySQL server: mysql
PostgreSQL server: postgres
Username: admin
Password: password123
MySQL databases: iam, catalog, fulfillment, review
PostgreSQL database: microservices_db
```

- IAM is the source of truth for users; catalog user records were imported into IAM on 2026-05-31.
  - IAM now includes `user_profiles` to preserve legacy catalog user fields.
  - Catalog `users` has a nullable `iamUserId` link column.
  - Imported catalog users are locked (no valid password hash) until a reset flow is implemented.
- Catalog users API is deprecated (returns HTTP 410); IAM should be used for user management.
- Catalog `products.shopId` now stores IAM user IDs (UUID string), and the FK to `catalog.users` was removed.
- Demo seller identity was migrated to IAM `seller_test` (password `seller123456`), and the old `demo-seller` IAM account was removed.

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

Frontend Docker build verification on 2026-05-31:

```powershell
docker compose build frontend
```

Result: succeeds. Only the three pre-existing catalog hook dependency warnings remain.

Frontend layout/navigation update on 2026-05-31:

- Added a shared `PageShell` layout for implemented operational pages and catalog browse/detail pages.
- Shared layout includes persistent top navigation, active page state, breadcrumbs, account status, logout/login action, page actions, and a right-side travel panel.
- Primary navigation links: Catalog, Orders, Notifications, Seller, Profile.
- Catalog product list, catalog-specific product list, and product detail now use the shared navigation frame.
- Tables on order and seller pages are wrapped for horizontal scrolling on narrow screens.
- Gateway route smoke checks returned `200` for `/`, `/product-list`, `/orders`, `/seller/orders`, and `/notifications`.

Frontend design-system update on 2026-05-31:

- Added minimal reusable design-system files:
  - `frontend/src/components/shared/designSystem.js`
  - `frontend/src/components/shared/designSystem.css`
  - `frontend/src/utils/formatters.js`
- Reusable frontend primitives now include Button, Card, Badge, Input, Select, Skeleton, EmptyState, ErrorState, Toast, price formatter, OrderStatusBadge, and ProductCard.
- Product list and catalog product list now use shared ProductCard, Skeleton, EmptyState, Toast, Button, Input/Select styles where safe.
- Order list, order detail, fulfillment tracking, seller orders, and notification pages now use shared cards, buttons, states, status badges, and notification messages where safe.
- Price display is centralized through `formatPrice`; existing `formatVnd` now delegates to the shared formatter to preserve existing imports.
- Docker frontend build verification:

```powershell
docker compose build frontend
```

Result: succeeds. The same three catalog hook dependency warnings remain in `CatalogProductList.js`, `ProductDetail.js`, and `ProductList.js`.

Frontend PageShell polish on 2026-05-31:

- `PageShell` now provides the persistent top navigation for `/` as well as catalog, product, order, seller, notification, auth, and fulfillment pages.
- Primary navigation has route-group active states:
  - Home: `/`
  - Products: `/product-list`, `/product-detail/:slug`, `/catalogs/:catalogId`
  - Orders, Notifications, Seller, Profile use their existing route paths.
- Account area shows guest/login or logged-in username, role badge, and logout.
- Product-related routes show a cart entry point in the top bar. The cart drawer loads the current cart with the existing Ordering cart APIs and keeps checkout on the existing `POST /api/ordering/api/v1/orders/checkout` API.
- Breadcrumbs are hidden on `/` and shortened for product, catalog, order detail, and fulfillment tracking routes.
- Layout is responsive: top navigation scrolls horizontally on narrow widths, account actions wrap cleanly, and the right-side quick-link panel collapses below the content.
- Landing page now uses `PageShell` in compact mode; its previous standalone header is hidden to avoid duplicate navigation.
- Docker frontend build verification:

```powershell
docker compose build frontend
```

Result: succeeds. The same three catalog hook dependency warnings remain in `CatalogProductList.js`, `ProductDetail.js`, and `ProductList.js`.

Frontend unified cart update on 2026-05-31:

- Added centralized cart state with `frontend/src/components/cart/CartProvider.js`.
- Added shared cart drawer with `frontend/src/components/cart/CartDrawer.js` and `frontend/src/components/cart/cartDrawer.css`.
- `frontend/src/view/App.js` now wraps existing routes in `CartProvider`.
- `PageShell` now consumes shared cart state for the cart button, badge count, add-to-cart feedback, checkout messages, and shared `CartDrawer`.
- Landing page, product list, product detail, and catalog product list now add products through the shared cart provider.
- Checkout COD still calls the existing Ordering checkout API through `checkoutCart`; backend API contracts and route paths were not changed.
- Removed the landing page's active legacy cart drawer path so customer catalog pages share one cart drawer implementation.
- Docker frontend build verification:

```powershell
docker compose build frontend
```

Result: succeeds. The same three catalog hook dependency warnings remain in `CatalogProductList.js`, `ProductDetail.js`, and `ProductList.js`.

- Restarted the rebuilt frontend container with:

```powershell
docker compose up -d --no-deps frontend
```

- Gateway smoke checks returned `200` for `/`, `/product-list`, `/product-detail/id=1`, `/catalogs/1`, `/orders`, `/seller/orders`, `/notifications`, and `/fulfillment-tracking/test-order`.

Frontend landing page API refactor on 2026-05-31:

- `LandingPage` now loads categories from `GET /api/catalog/api/v1/catalogs/`.
- `LandingPage` now loads featured products from `GET /api/catalog/api/v1/products/?skip=0&limit=8`.
- Removed hardcoded featured product data from the landing page where API data is available.
- Replaced mojibake landing/footer/customer-facing copy with readable Vietnamese text.
- Landing CTA behavior:
  - `Mua ngay` adds the first loaded featured product to the shared cart and opens the shared cart drawer; if no product is loaded, it navigates to `/product-list`.
  - `Xem khuyen mai` scrolls to the featured products section.
  - `Xem chi tiet` on featured products navigates to `/product-detail/id=:id`.
- Landing page keeps graceful error/empty states if catalog or product APIs fail.
- Docker frontend build verification:

```powershell
docker compose build frontend
```

Result: succeeds. The same three catalog hook dependency warnings remain in `CatalogProductList.js`, `ProductDetail.js`, and `ProductList.js`.

Frontend customer order flow polish on 2026-05-31:

- `/orders` now uses the logged-in IAM user from stored auth state by default.
- The editable `userId` field is hidden for logged-in users.
- A small demo `Demo User ID` field remains only for guest/local demo inspection.
- `/orders` uses shared `Skeleton`, `EmptyState`, `ErrorState`, `Button`, `Card`, and `OrderStatusBadge`.
- `/orders/:orderId` now emphasizes:
  - order summary
  - status badge
  - item table
  - created date
  - payment method
  - fulfillment tracking link
- `/orders/:orderId` only renders the cancel panel/button when the current order status is cancellable by the existing API.
- Docker frontend build verification:

```powershell
docker compose build frontend
```

Result: succeeds. The same three catalog hook dependency warnings remain in `CatalogProductList.js`, `ProductDetail.js`, and `ProductList.js`.

Frontend seller fulfillment dashboard polish on 2026-05-31:

- `/seller/orders` now presents seller fulfillment as an operational dashboard.
- Summary KPI cards show visible counts for `PENDING`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, and `COMPLETED` fulfillments.
- Seller orders are shown in a table with fulfillment ID, order/customer IDs, status badge, item summary, total, carrier/tracking, and a clear next action.
- Next action is selected from the current fulfillment status:
  - `PENDING -> confirm`
  - `CONFIRMED -> ship`
  - `SHIPPED -> deliver`
  - `DELIVERED -> complete`
  - terminal statuses show no action.
- Impossible seller actions are not rendered as active buttons.
- Existing SELLER role guard remains in place.
- Fulfillment API paths were not changed.
- Docker frontend build verification:

```powershell
docker compose build frontend
```

Result: succeeds. The same three catalog hook dependency warnings remain in `CatalogProductList.js`, `ProductDetail.js`, and `ProductList.js`.

Frontend layout consistency polish on 2026-05-31:

- Added shared layout sizing variables in `frontend/src/index.css`:
  - `--app-content-max: 1280px`
  - `--app-readable-max: 1200px`
  - `--app-page-pad: clamp(16px, 4vw, 48px)`
  - `--app-section-gap: clamp(36px, 6vw, 72px)`
- Updated `PageShell` so the app shell uses `min-height: 100vh`, flex column layout, full-width page background, centered max-width content, and responsive horizontal padding.
- Added `fullBleed` support to `PageShell`; the landing page uses this so hero/footer backgrounds span full viewport width while inner content stays centered.
- Updated shared product grid/card CSS so product cards stretch evenly, use responsive `auto-fill` columns, and keep actions aligned at the bottom.
- Removed extra nested max-width/padding constraints from product list, catalog product list, and product detail containers so they align with the shared shell width.
- Updated catalog list and landing sections/footer to use the shared width and padding variables.
- Docker frontend build verification:

```powershell
docker compose build frontend
```

Result: succeeds. The same three catalog hook dependency warnings remain in `CatalogProductList.js`, `ProductDetail.js`, and `ProductList.js`.

- Restarted frontend with `docker compose up -d --no-deps frontend`.
- Gateway smoke checks returned `200` for `/`, `/product-list`, `/product-detail/id=1`, `/catalogs/1`, `/orders`, `/seller/orders`, `/notifications`, and `/profile`.

Auth role verification on 2026-05-31:

- `POST /api/auth/register` with `role=SELLER` returned `role: SELLER`.
- `POST /api/auth/register` with `role=CUSTOMER` returned `role: CUSTOMER`.
- `GET /api/auth/me` returned the stored role for both account types.
- Authenticated `GET /api/ordering/api/v1/orders?userId=:userId` returned `200`.

Frontend role-based UI visibility on 2026-05-31:

- Added shared auth state through `AuthProvider` / `useAuth`.
- `useAuth()` exposes `user`, `role`, `isAuthenticated`, `isGuest`, `isCustomer`, `isSeller`, `loading`, `refreshUser`, and `logout`.
- Added route guards:
  - `RequireAuth`
  - `RequireRole`
  - `GuestOnly`
- Protected route behavior:
  - `/orders` requires `CUSTOMER`.
  - `/orders/:orderId` requires `CUSTOMER`.
  - `/fulfillment-tracking/:orderId` requires `CUSTOMER`.
  - `/seller/orders` requires `SELLER`.
  - `/notifications` requires an authenticated user.
  - `/profile` requires an authenticated user.
  - `/login` and `/register` redirect authenticated users to `/profile`.
- `PageShell` navigation is generated from the active role:
  - Guest: Home, Products, Login, Register.
  - Customer: Home, Products, Cart on product routes, Orders, Notifications, Profile, Logout.
  - Seller: Seller, Notifications, Profile, Logout.
- Product purchase actions are role-aware:
  - Guest sees login purchase prompts and does not create/fetch carts.
  - Customer can add products to cart and checkout COD.
  - Seller can browse products/catalogs but customer purchase actions are hidden.
- `CartProvider` no longer creates or fetches carts for guest/seller roles and checkout requires `CUSTOMER`.
- Docker frontend build verification:

```powershell
docker compose build frontend
```

Result: succeeds. The same three catalog hook dependency warnings remain in `CatalogProductList.js`, `ProductDetail.js`, and `ProductList.js`.

Frontend Vietnamese text cleanup on 2026-05-31:

- Updated frontend customer-facing text and system feedback messages to Vietnamese with accents across shared layout, auth pages, cart, catalog/product pages, order pages, seller dashboard, notifications, landing page, chat widget, and frontend API helper fallback errors.
- Replaced remaining mojibake in `LandingPage`, `CartProvider`, `designSystem`, and `ChatWidget` paths that affected visible Vietnamese text.
- Route paths and backend API contracts were not changed.
- Docker frontend build verification:

```powershell
docker compose build frontend
```

Result: succeeds. The same three catalog hook dependency warnings remain in `CatalogProductList.js`, `ProductDetail.js`, and `ProductList.js`.

## Completion Plan For Remaining Business Flows

Planned on 2026-05-31. Goal: finish the business flows described in the basic business-flow document while keeping current API routes, Docker/gateway assumptions, and existing verified MVP flows stable.

### Phase 1: Review Service In Docker And Gateway

Status on 2026-05-31: implemented and API-smoke-tested.

Scope:

- Added `review-service` to Docker compose.
- Added review service environment variables and MySQL/RabbitMQ dependencies.
- Added gateway routes for `/api/reviews` and `/api/reviews/`.
- Verified review health and existing review endpoints through gateway.
- Keep existing frontend routes unchanged.

Expected frontend testability:

- Not meaningful from current frontend yet.
- Manual API test through gateway should be possible after this phase.

Verification target:

```text
GET /api/reviews/health
GET /api/reviews?productId=:productId
GET /api/reviews/eligibility?customerId=:id&orderId=:id&productId=:id
```

Verified commands/results:

```text
docker compose build review-service -> succeeds
docker compose up -d --force-recreate review-service api-gateway -> succeeds
GET /api/reviews/health -> 200
GET /api/reviews?productId=1 -> 200 []
GET /api/reviews/eligibility?customerId=test&orderId=test&productId=1 -> 200 {}
```

### Phase 2: Review Eligibility From Completed Orders

Status on 2026-05-31: implemented and API-smoke-tested end to end.

Scope:

- Review consumer now binds `review.order_completed.q` to `fulfillment.order_completed`.
- Verified `fulfillment.order_completed` event reaches `review-service`.
- Verified `review-service` creates `review_eligibilities` records from `OrderCompleted`.
- Smoke verification covered:

```text
checkout -> seller complete -> OrderCompleted -> review eligibility exists
```

Expected frontend testability:

- Current frontend can drive checkout and seller completion.
- Eligibility result will still need API/manual check unless a small frontend indicator is added in Phase 3.

Verified smoke result:

```text
create cart -> add product 1 -> checkout COD
-> fulfillment PENDING
-> seller confirm/ship/deliver/complete
-> review eligibility exists with isEligible=true
```

Smoke IDs:

```text
customerId: review-smoke-1780239016
orderId: c47d790d-cd11-4560-aef2-c9ac69eaf92f
fulfillmentId: c4eac115-6aca-4200-8328-5d122f3244d3
sellerId: seller-001
reviewEligibilityId: 42ee4eea-0201-42ac-8ff2-9fb48a6c4991
```

### Phase 3: Product Review UI

Status on 2026-05-31: implemented and build/API-smoke-tested.

Scope:

- Added review listing to `/product-detail/:slug`.
- Added review submission panel to `/orders/:orderId` when the completed order has eligible products.
- Uses logged-in CUSTOMER identity for frontend usage.
- Shows loading, empty, error, and success states using shared UI components.
- Keeps review submission limited to completed/eligible orders through the existing Review API eligibility check.

Expected frontend testability:

- Yes. Customer can complete an order through existing flow, then open product/order page and submit a review.

Frontend routes to test:

```text
/product-detail/id=1
/orders/:orderId
```

Verified smoke result:

```text
POST /api/reviews -> created review dd818bcf-f2a6-40f4-ad0c-303aaa6c5ffc
GET /api/reviews?productId=1 -> returns the created rating=5 review
docker compose build frontend -> succeeds with the same three catalog hook dependency warnings
Gateway route smoke checks -> 200 for /, /product-list, /product-detail/id=1, /orders/:orderId
```

Current frontend testability:

- Yes. A CUSTOMER can complete an order, open `/orders/:orderId`, submit an eligible review, then see reviews on `/product-detail/id=1`.
- Local smoke data now includes one review for product `1`.

### Phase 4: Catalog Review Projection

Status on 2026-05-31: implemented and API-smoke-tested.

Scope:

- Catalog now consumes `review.created`.
- Product `StarCount`, `totalRates`, `totalComments`, and `ranking` are updated from review events.
- Existing catalog processed-event table is reused for review event idempotency.
- Product detail/list APIs reflect changed rating summary after review.

Expected frontend testability:

- Yes. After submitting a review, refresh product detail/list and confirm rating/count changes.

Verified smoke result:

```text
POST /api/reviews -> created review 537390b1-4a0f-4880-9922-d63da5dc5bcc
GET /api/catalog/api/v1/products/1 before review -> totalRates=0, totalComments=0, StarCount=0, ranking=0
GET /api/catalog/api/v1/products/1 after review.created projection -> totalRates=1, totalComments=1, StarCount=4, ranking=4
```

### Phase 5: Cancel Order End-To-End

Status on 2026-05-31: implemented and API-smoke-tested end to end.

Scope:

- Ordering `OrderCancelled` payload now includes order items.
- Catalog consumes `order.cancelled` and restores `quantity`.
- Fulfillment consumes `order.cancelled` and cancels fulfillments where current status allows transition to `CANCELLED`.
- Notification creates cancellation notification through its existing `order.*` subscription.
- Keep Ordering cancel API unchanged.

Expected frontend testability:

- Yes. Customer can cancel from `/orders/:orderId`, then verify order status, notification page, and product stock behavior.

Frontend routes to test:

```text
/orders
/orders/:orderId
/notifications
/product-detail/id=1
```

Verified smoke result:

```text
checkout -> order PLACED -> fulfillment PENDING -> product quantity 13 to 12
POST /api/ordering/api/v1/orders/:orderId/cancel -> order CANCELLED
Catalog projection restored product quantity 12 to 13
Fulfillment status changed PENDING to CANCELLED
Notification events for user: order.placed, order.cancelled
```

Smoke IDs:

```text
customerId: cancel-smoke-1780239641
orderId: 57d0e831-e6e8-467e-b9e7-6002d5d1758d
```

### Phase 6: Cart Quantity And Remove Controls

Status on 2026-05-31: implemented and build/API-smoke-tested.

Scope:

- Wired current Ordering cart item update/delete APIs into `CartDrawer`.
- Added quantity stepper and remove action in shared cart drawer.
- Preserved role rules: only CUSTOMER can mutate cart.

Expected frontend testability:

- Yes. Customer can add item, update quantity, remove item, and checkout from cart drawer.

Frontend routes to test:

```text
/
/product-list
/product-detail/id=1
/catalogs/1
```

Verified smoke result:

```text
POST /api/ordering/api/v1/carts/:cartId/items -> totalQuantity 1
PATCH /api/ordering/api/v1/carts/:cartId/items/1 with quantity=3 -> totalQuantity 3
DELETE /api/ordering/api/v1/carts/:cartId/items/1 -> totalQuantity 0, items 0
docker compose build frontend -> succeeds with the same three catalog hook dependency warnings
```

### Phase 7: Checkout Availability And Price Validation

Status on 2026-05-31: implemented and API-smoke-tested.

Scope:

- Added Ordering-side validation against Catalog availability and price before checkout.
- Checkout rejects unavailable products, insufficient stock, and price changes.
- Existing checkout API path is preserved.

Expected frontend testability:

- Partly. Normal checkout should still work through frontend.
- Out-of-stock/price-change paths may need seeded/manual API setup.

Verified smoke result:

```text
Checkout quantity=1 -> order PLACED
Checkout quantity=999 -> 409 insufficient stock
```

Smoke ID:

```text
successful orderId: 48e87404-32e8-4df7-a7c0-384cef8a9e73
```

### Phase 8: Seller Product Management

Scope:

- Add seller-only product management backend rules for Catalog product create/update/delete.
- Enforce seller ownership using IAM seller `userId` and product seller/shop ID.
- Add seller frontend page for product management without changing existing route paths; use a nested or additional seller route if needed.
- Optionally emit `ProductCreated`, `ProductUpdated`, and `ProductDeleted` events.

Expected frontend testability:

- Yes. Seller can create/edit/delete own products through frontend after this phase.

### Phase 9: Server-Side Catalog Search Filter Sort

Scope:

- Add backend query params for search, price range, brand/location, and sort.
- Add DB indexes where useful.
- Update product list/catalog frontend to call server-side filters instead of filtering only current page.

Expected frontend testability:

- Yes. Search/filter/sort can be tested directly on product list and catalog pages.

Frontend routes to test:

```text
/product-list
/catalogs/1
```

### Phase 10: Chat Through Gateway And Notifications

Scope:

- Add gateway route/config for chat endpoints and websocket.
- Configure frontend chat URLs to gateway-relative paths in Docker.
- Emit `MessageSent` from chat service if not already emitted.
- Verify Notification consumes chat message events.

Expected frontend testability:

- Yes, if two demo users are available from chat service.
- Notification side may require manual/event verification depending on chat user mapping.

### Phase 11: Payment Beyond COD

Scope:

- Add payment data model and order payment status.
- Keep COD as default.
- Add mock CARD/WALLET flow if real provider is out of scope.
- Add events such as `PaymentAuthorized`, `PaymentFailed`, and optional refund events.

Expected frontend testability:

- Yes after frontend checkout supports selecting payment method.
- This should be last because current assignment MVP already works with COD.

### Recommended Order

1. Phase 1
2. Phase 2
3. Phase 3
4. Phase 4
5. Phase 5
6. Phase 6
7. Phase 7
8. Phase 8
9. Phase 9
10. Phase 10
11. Phase 11

Rationale:

- Review completion depends on review service wiring first.
- Catalog rating projection depends on review events.
- Cancel end-to-end is the next highest-risk consistency gap.
- Cart controls and checkout validation improve the already-working purchase path.
- Seller product management, server-side search, chat, and payment broaden the product after the core order lifecycle is consistent.
