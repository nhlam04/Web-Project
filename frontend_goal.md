Mình đề xuất nâng cấp **frontend của `Web-Project` theo hướng “port kiến trúc + UX pattern” từ `KhuongVAnh/e-commerce`**, thay vì copy nguyên file, vì backend/API của hai repo không giống nhau.

## Kết luận nhanh

Repo `e-commerce` có frontend hiện đại hơn: dùng **Vite**, `React Router`, `Tailwind`, `axios`, `zustand`, `react-hot-toast`, `lucide-react`, `recharts`… ([GitHub][1]) Trong khi `Web-Project` vẫn đang dùng **Create React App / react-scripts** và dependency frontend còn khá cơ bản. ([GitHub][2])

Điểm yếu lớn nhất của `Web-Project` hiện tại là `App.js` gần như chỉ render `LandingPage`, chưa gom các module auth/cart/catalog/orders/seller… thành routing app hoàn chỉnh. ([GitHub][3]) Dù vậy, repo này đã có khá nhiều component rời như `auth`, `cart`, `catalog`, `chat`, `notifications`, `orders`, `reviews`, `seller`, `shared`, nên nền tảng để nâng cấp là có sẵn. ([GitHub][4])

---

## 1. Mục tiêu nâng cấp frontend

Nên biến frontend của `Web-Project` thành app có cấu trúc gần giống `e-commerce` như sau:

```txt
frontend/
  src/
    assets/
    components/
      admin/
      auth/
      cart/
      catalog/
      notifications/
      shared/
      seller/
      ProtectedRoute.jsx
      ToastProvider.jsx
      NotificationBell.jsx

    layouts/
      CustomerLayout.jsx
      DashboardLayout.jsx

    pages/
      auth/
        LoginPage.jsx
        RegisterPage.jsx
        ProfilePage.jsx

      customer/
        Home.jsx
        ProductList.jsx
        ProductDetail.jsx
        Cart.jsx
        Checkout.jsx
        OrderList.jsx
        OrderDetail.jsx
        Categories.jsx
        About.jsx
        Help.jsx

      admin/
        AdminDashboard.jsx
        ProductManagement.jsx
        CategoryManagement.jsx
        OrderManagement.jsx
        UserManagement.jsx
        ShopManagement.jsx

      seller/
        SellerDashboard.jsx
        SellerOrdersPage.jsx
        SellerProductsPage.jsx
        ShopForm.jsx

      notifications/
        NotificationPage.jsx

    services/
      apiClient.js
      authService.js
      catalogService.js
      orderService.js
      cartService.js
      notificationService.js
      reviewService.js

    store/
      useAuthStore.js
      useCartStore.js
      useNotificationStore.js

    utils/
      formatCurrency.js
      formatDate.js
      constants.js

    App.jsx
    main.jsx
    index.css
```

Lý do: repo `e-commerce` đã tách rõ `components`, `layouts`, `pages`, `services`, `store`, `utils`. ([GitHub][5]) Ngoài ra, nó có layout riêng cho khách hàng và dashboard (`CustomerLayout`, `DashboardLayout`), pages chia theo role như `auth`, `customer`, `admin`, `seller`, `notifications`, service layer và Zustand store. ([GitHub][6])

---

## 2. Các phần nên nâng cấp theo thứ tự ưu tiên

### Ưu tiên 1: Chuyển từ CRA sang Vite

`Web-Project` đang dùng `react-scripts`, còn repo mẫu dùng Vite. ([GitHub][2]) Nên đổi sang Vite để frontend giống repo mẫu hơn, build nhanh hơn và dùng cùng kiểu entry `main.jsx`.

Nên thêm các dependency tương tự repo mẫu:

```bash
npm install @vitejs/plugin-react vite axios zustand react-hot-toast lucide-react recharts
```

Sau đó đổi script:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint ."
  }
}
```

---

### Ưu tiên 2: Viết lại routing trong `App.jsx`

Repo mẫu có routing đầy đủ cho customer, admin, seller, auth và notification, dùng `BrowserRouter`, `Routes`, `Route`, `ProtectedRoute`, `CustomerLayout`, `DashboardLayout`. ([GitHub][7]) `Web-Project` nên chuyển từ `App.js` đơn giản sang router kiểu này:

```jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CustomerLayout from "./layouts/CustomerLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/customer/Home";
import ProductList from "./pages/customer/ProductList";
import ProductDetail from "./pages/customer/ProductDetail";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ProfilePage from "./pages/auth/ProfilePage";

import AdminDashboard from "./pages/admin/AdminDashboard";
import SellerDashboard from "./pages/seller/SellerDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        </Route>

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/admin" element={<ProtectedRoute role="admin"><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
        </Route>

        <Route path="/seller" element={<ProtectedRoute role="seller"><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<SellerDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

---

### Ưu tiên 3: Tách `LandingPage` thành `Home` + layout chung

`LandingPage.js` của `Web-Project` hiện đang chứa cả dữ liệu mẫu sản phẩm và CSS lớn viết trực tiếp trong component. ([GitHub][8]) Nên tách lại:

```txt
LandingPage.js
→ pages/customer/Home.jsx
→ components/customer/HeroSection.jsx
→ components/customer/FeaturedProducts.jsx
→ components/customer/CategorySection.jsx
```

CSS inline nên chuyển sang Tailwind class hoặc file style chung. `Web-Project` đã có Tailwind directives trong `index.css`, nên có thể tận dụng ngay. ([GitHub][9])

---

### Ưu tiên 4: Thêm `CustomerLayout` giống repo mẫu

Layout khách hàng nên có:

```txt
Header
  - Logo
  - Search bar
  - Categories
  - Cart icon
  - Notification bell
  - User menu / Login button

Outlet

Footer
```

Repo mẫu có `CustomerLayout.jsx`, còn `Web-Project` hiện có `PageShell` và design system riêng. ([GitHub][6]) Vì vậy nên giữ lại `PageShell` nếu đang ổn, nhưng đổi vai trò của nó thành layout thật sự cho toàn bộ customer pages.

---

### Ưu tiên 5: Chuẩn hóa service layer

`e-commerce` có thư mục `services` riêng cho auth, order, notification, wake service. ([GitHub][10]) `Web-Project` nên thêm service layer để không gọi API trực tiếp trong component.

Ví dụ:

```txt
services/
  apiClient.js
  authService.js
  catalogService.js
  cartService.js
  orderService.js
  notificationService.js
```

Với backend hiện tại của `Web-Project`, nên bắt đầu từ auth trước vì README đã có các endpoint `/api/auth/register`, `/api/auth/login`, `/api/auth/me`. ([GitHub][11])

Ví dụ:

```js
// services/apiClient.js
import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost/api",
  withCredentials: true,
});
```

---

### Ưu tiên 6: Thêm Zustand store giống repo mẫu

Repo mẫu dùng store riêng như `useAuthStore` và `useCartStore`. ([GitHub][12]) `Web-Project` nên chuyển các provider rời rạc sang Zustand hoặc kết hợp: giữ `AuthProvider` nếu muốn, nhưng để giống repo mẫu thì Zustand hợp hơn.

Nên có:

```txt
store/
  useAuthStore.js
  useCartStore.js
  useNotificationStore.js
```

`useAuthStore` quản lý:

```txt
user
token
isAuthenticated
role
login()
register()
logout()
fetchMe()
```

`useCartStore` quản lý:

```txt
items
addItem()
removeItem()
updateQuantity()
clearCart()
totalPrice
```

---

## 3. Mapping từ frontend hiện tại sang frontend mới

| Hiện tại trong `Web-Project`            | Nên chuyển thành                                             | Mục tiêu                   |
| --------------------------------------- | ------------------------------------------------------------ | -------------------------- |
| `components/LandingPage.js`             | `pages/customer/Home.jsx`                                    | Trang chủ giống e-commerce |
| `components/catalog/ProductList.js`     | `pages/customer/ProductList.jsx`                             | Trang danh sách sản phẩm   |
| `components/catalog/ProductDetail.js`   | `pages/customer/ProductDetail.jsx`                           | Trang chi tiết sản phẩm    |
| `components/cart/CartDrawer.js`         | `components/cart/CartDrawer.jsx` + `pages/customer/Cart.jsx` | Giỏ hàng đầy đủ            |
| `components/auth/LoginPage.js`          | `pages/auth/LoginPage.jsx`                                   | Route `/login`             |
| `components/auth/RegisterPage.js`       | `pages/auth/RegisterPage.jsx`                                | Route `/register`          |
| `components/auth/ProfilePage.js`        | `pages/auth/ProfilePage.jsx`                                 | Route `/profile`           |
| `components/seller/SellerOrdersPage.js` | `pages/seller/SellerOrdersPage.jsx`                          | Seller dashboard           |
| `components/shared/PageShell.js`        | `layouts/CustomerLayout.jsx`                                 | Layout khách hàng          |

---

## 4. Giao diện nên làm giống repo mẫu ở những điểm nào?

Nên ưu tiên bắt chước các điểm này:

1. **Navbar cố định cho customer**: logo, search, menu, cart, notification, user dropdown.
2. **Home page dạng e-commerce đầy đủ**: hero, categories, featured products, shop list, call-to-action.
3. **Product card thống nhất**: ảnh, tên, giá, rating, nút add to cart.
4. **Product detail page**: ảnh lớn, thông tin, số lượng, add cart, review.
5. **Cart/Checkout flow**: cart page, checkout page, payment result page.
6. **Role-based dashboard**: admin và seller dùng `DashboardLayout`.
7. **Toast notification**: dùng `react-hot-toast` giống repo mẫu.
8. **Icon set thống nhất**: dùng `lucide-react` hoặc Material Symbols, không trộn quá nhiều kiểu icon.
9. **Empty state / loading state / error state** cho mọi trang gọi API.
10. **Responsive mobile**: navbar collapse, product grid 1–2–4 cột.

---

## 5. Admin/Seller nên bổ sung gì?

Repo mẫu có admin pages như dashboard, category management, order management, product management, shop management, user management. ([GitHub][13]) Trong khi `Web-Project` mới thấy seller module khá mỏng, chỉ có `SellerOrdersPage`. ([GitHub][14])

Nên thêm:

```txt
pages/admin/
  AdminDashboard.jsx
  ProductManagement.jsx
  CategoryManagement.jsx
  OrderManagement.jsx
  UserManagement.jsx
  ReviewManagement.jsx

pages/seller/
  SellerDashboard.jsx
  SellerProductsPage.jsx
  SellerOrdersPage.jsx
  SellerProductForm.jsx
  ShopProfile.jsx
```

Nếu backend chưa đủ API, có thể dựng UI trước bằng mock data, sau đó nối API dần.

---

## 6. Lộ trình triển khai đề xuất

### Giai đoạn 1 — Nền tảng

Làm trước:

```txt
- Chuyển CRA sang Vite
- Đổi src/index.js → src/main.jsx
- Đổi view/App.js → App.jsx
- Thêm BrowserRouter + Routes
- Thêm layouts/
- Thêm services/apiClient.js
- Thêm ToastProvider
- Thêm useAuthStore, useCartStore
```

### Giai đoạn 2 — Customer frontend

```txt
- Chuyển LandingPage thành Home
- Làm CustomerLayout
- Làm ProductList
- Làm ProductDetail
- Làm Cart page
- Làm Checkout page
- Làm OrderList / OrderDetail
```

### Giai đoạn 3 — Auth

```txt
- Nối login/register/me với IAM service
- Lưu token/user vào Zustand
- ProtectedRoute kiểm tra login
- Role-based route cho admin/seller
```

### Giai đoạn 4 — Admin/Seller dashboard

```txt
- DashboardLayout
- AdminDashboard
- ProductManagement
- CategoryManagement
- OrderManagement
- UserManagement
- SellerDashboard
- SellerOrdersPage
- SellerProductsPage
```

### Giai đoạn 5 — Polish UI

```txt
- Toast cho success/error
- Skeleton loading
- Empty state
- Confirm modal
- Responsive mobile
- Format tiền VNĐ
- Format ngày giờ
- Chart thống kê bằng Recharts
```

---

## Đề xuất ngắn gọn nhất

Muốn `Web-Project` giống `e-commerce` nhất, nên làm theo thứ tự:

```txt
1. Migrate frontend từ CRA sang Vite.
2. Tái cấu trúc src theo: components / layouts / pages / services / store / utils.
3. Viết lại App.jsx bằng React Router.
4. Tách LandingPage thành Home + component nhỏ.
5. Thêm CustomerLayout và DashboardLayout.
6. Dùng Zustand cho auth/cart.
7. Dùng axios service layer để gọi backend.
8. Bổ sung admin/seller pages giống repo mẫu.
9. Chuẩn hóa UI bằng Tailwind + toast + icon + responsive.
```

Ưu tiên thực tế nhất: **làm router + layout + service layer trước**, vì khi có khung giống repo mẫu rồi thì các trang catalog, cart, order, seller, admin có thể được migrate dần mà không làm vỡ toàn bộ frontend.

[1]: https://github.com/KhuongVAnh/e-commerce/blob/main/frontend/package.json "e-commerce/frontend/package.json at main · KhuongVAnh/e-commerce · GitHub"
[2]: https://github.com/kienlc102/Web-Project/blob/main/frontend/package.json "Web-Project/frontend/package.json at main · kienlc102/Web-Project · GitHub"
[3]: https://github.com/kienlc102/Web-Project/blob/main/frontend/src/view/App.js "Web-Project/frontend/src/view/App.js at main · kienlc102/Web-Project · GitHub"
[4]: https://github.com/kienlc102/Web-Project/tree/main/frontend/src/components "Web-Project/frontend/src/components at main · kienlc102/Web-Project · GitHub"
[5]: https://github.com/KhuongVAnh/e-commerce/tree/main/frontend/src "e-commerce/frontend/src at main · KhuongVAnh/e-commerce · GitHub"
[6]: https://github.com/KhuongVAnh/e-commerce/tree/main/frontend/src/layouts "e-commerce/frontend/src/layouts at main · KhuongVAnh/e-commerce · GitHub"
[7]: https://github.com/KhuongVAnh/e-commerce/blob/main/frontend/src/App.jsx "e-commerce/frontend/src/App.jsx at main · KhuongVAnh/e-commerce · GitHub"
[8]: https://github.com/kienlc102/Web-Project/blob/main/frontend/src/components/LandingPage.js "Web-Project/frontend/src/components/LandingPage.js at main · kienlc102/Web-Project · GitHub"
[9]: https://github.com/kienlc102/Web-Project/blob/main/frontend/src/index.css "Web-Project/frontend/src/index.css at main · kienlc102/Web-Project · GitHub"
[10]: https://github.com/KhuongVAnh/e-commerce/tree/main/frontend/src/services "e-commerce/frontend/src/services at main · KhuongVAnh/e-commerce · GitHub"
[11]: https://github.com/kienlc102/Web-Project "GitHub - kienlc102/Web-Project · GitHub"
[12]: https://github.com/KhuongVAnh/e-commerce/tree/main/frontend/src/store "e-commerce/frontend/src/store at main · KhuongVAnh/e-commerce · GitHub"
[13]: https://github.com/KhuongVAnh/e-commerce/tree/main/frontend/src/pages/admin "e-commerce/frontend/src/pages/admin at main · KhuongVAnh/e-commerce · GitHub"
[14]: https://github.com/kienlc102/Web-Project/tree/main/frontend/src/components/seller "Web-Project/frontend/src/components/seller at main · kienlc102/Web-Project · GitHub"
