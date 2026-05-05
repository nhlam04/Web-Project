-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th5 05, 2026 lúc 02:29 AM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `qlbanhang`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `catalog`
--

CREATE TABLE `catalog` (
  `id` int(11) NOT NULL,
  `product_type` varchar(255) NOT NULL,
  `brand` longtext NOT NULL,
  `location` longtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `catalog`
--

INSERT INTO `catalog` (`id`, `product_type`, `brand`, `location`) VALUES
(1, 'Thiết bị Điện tử & Công nghệ', '{\'Asus\', \'Dell\', \'HP\', \'Lenovo\', \'Apple\', \'Acer\', \'MSI\'}', '{\'Hà Nội\', \'TP. Hồ Chí Minh\', \'Đà Nẵng\'}'),
(2, 'Thời trang & Phụ kiện', '', ''),
(3, 'Nhà cửa & Đời sống', '', ''),
(4, 'Sức khỏe & Sắc đẹp', '', ''),
(5, 'Mẹ & Bé', '', ''),
(6, 'Thể thao & Dã ngoại', '', ''),
(7, 'Sách, VPP & Quà tặng', '', ''),
(8, 'Bách hóa Online', '', '');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `comments`
--

CREATE TABLE `comments` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  `content` text NOT NULL,
  `translatedContent` text DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `message` varchar(255) NOT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `totalPrice` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `orders`
--

INSERT INTO `orders` (`id`, `userId`, `totalPrice`) VALUES
(19, 2, 0),
(20, 3, 1),
(21, 21, 12390200);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_delivery`
--

CREATE TABLE `order_delivery` (
  `id` int(11) NOT NULL,
  `orderSellerId` int(11) NOT NULL,
  `path` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`path`)),
  `createdAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `order_delivery`
--

INSERT INTO `order_delivery` (`id`, `orderSellerId`, `path`, `createdAt`) VALUES
(1, 4, '[\"Lào Cai\",\"Yên Bái\",\"Vĩnh Phúc\",\"Hà Nội\"]', '2026-01-16 19:43:15');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_product`
--

CREATE TABLE `order_product` (
  `orderId` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_seller`
--

CREATE TABLE `order_seller` (
  `id` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `buyer` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `totalPrice` int(11) NOT NULL,
  `status` enum('cho_xac_nhan','dang_van_chuyen','da_huy','thanh_cong') NOT NULL DEFAULT 'cho_xac_nhan'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `order_seller`
--

INSERT INTO `order_seller` (`id`, `productId`, `userId`, `buyer`, `quantity`, `totalPrice`, `status`) VALUES
(1, 13, 28, 3, 1, 1, 'cho_xac_nhan'),
(2, 14, 28, 3, 1, 2, 'cho_xac_nhan'),
(3, 13, 28, 3, 1, 1, 'cho_xac_nhan'),
(4, 13, 28, 3, 1, 1, 'thanh_cong'),
(5, 5, 2, 21, 1, 12390000, 'cho_xac_nhan'),
(6, 7, 2, 21, 1, 100, 'cho_xac_nhan'),
(7, 8, 2, 21, 1, 100, 'cho_xac_nhan');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `price` int(11) NOT NULL,
  `shortDesc` varchar(255) NOT NULL,
  `detailDesc` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`detailDesc`)),
  `quantity` int(11) NOT NULL,
  `sold` int(11) NOT NULL,
  `shopId` int(11) NOT NULL,
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`images`)),
  `ranking` int(11) NOT NULL,
  `totalComments` int(11) NOT NULL,
  `StarCount` int(11) NOT NULL,
  `totalRates` int(11) NOT NULL,
  `catalog_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `products`
--

INSERT INTO `products` (`id`, `name`, `price`, `shortDesc`, `detailDesc`, `quantity`, `sold`, `shopId`, `images`, `ranking`, `totalComments`, `StarCount`, `totalRates`, `catalog_id`) VALUES
(5, 'Asus ExpertBook BM1', 12390000, 'BM1403CDA-S60974W', '{\"CPU\":\"AMD Ryzen™ 5 7535HS\",\"GPU\":\"AMD Radeon™ 660M\",\"RAM\":\"16GB DDR5 SO-DIMM\",\"memory\":\"4.0-inch, FHD (1920 x 1080) 16:9\",\"OS\":\"Windows 11\",\"screen\":\"512GB M.2 2280 NVMe™ PCIe® 4.0 SSD\",\"factory\":\"Asus\"}', 100, 0, 2, '[\"https://surfaceviet.vn/wp-content/uploads/2024/03/Surface-Laptop-6-Platinum.png\"]', 1, 10, 4, 100, 1),
(7, 'Asus', 100, '', '{}', 100, 1, 2, '[\"https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/g/r/group_744_1_29.png\"]', 0, 0, 0, 0, 1),
(8, 'Asus', 100, '', '{}', 100, 1, 2, '[\"https://cdnv2.tgdd.vn/mwg-static/tgdd/Products/Images/44/311178/asus-vivobook-go-15-e1504fa-r5-nj776w-140225-100949-251-600x600.jpg\"]', 0, 0, 0, 0, 2),
(9, 'Asus', 100, '', '{}', 100, 1, 2, '[\"https://cdn2.fptshop.com.vn/unsafe/HP_15_fd0305_TU_vang_1_525c47b289.jpg\"]', 0, 0, 0, 0, 3),
(10, 'Asus', 100, '', '{}', 100, 1, 2, '[]', 0, 0, 0, 0, 4),
(11, 'Asus', 100, '', '{}', 100, 1, 2, '[]', 0, 0, 0, 0, 5),
(12, 'Asus', 100, '', '{}', 100, 1, 2, '[]', 0, 0, 0, 0, 6),
(13, '2', 1, '1', '{\"CPU\":\"1\",\"GPU\":\"1\",\"RAM\":\"1\",\"memory\":\"1\",\"OS\":\"1\",\"screen\":\"1\",\"factory\":\"1\"}', 0, 1, 28, '[\"https://laptop88.vn/media/product/9440__new_100___laptop_msi_modern_15_f13mg_082vn.jpg\",\"https://laptop88.vn/media/product/8242_a2.jpg\",\"https://laptop88.vn/media/product/9440_20597_msi_modern_15_f13mg__5.jpg\"]', 0, 0, 0, 0, 7),
(14, '2', 2, '2', '{\"CPU\":\"2\",\"GPU\":\"2\",\"RAM\":\"2\",\"memory\":\"2\",\"OS\":\"2\",\"screen\":\"2\",\"factory\":\"2\"}', 2, 0, 28, '[\"\",\"\",\"\"]', 0, 0, 0, 0, 8);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `ratings`
--

CREATE TABLE `ratings` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  `star` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `roles`
--

INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'user', ''),
(2, 'admin', ''),
(3, 'seller', '');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `fullName` varchar(255) NOT NULL,
  `gmail` varchar(255) NOT NULL,
  `address` varchar(255) NOT NULL,
  `phone` varchar(255) NOT NULL,
  `accountType` varchar(255) NOT NULL,
  `avatar` varchar(1000) NOT NULL,
  `roleId` int(11) NOT NULL,
  `totalPrice` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `fullName`, `gmail`, `address`, `phone`, `accountType`, `avatar`, `roleId`, `totalPrice`) VALUES
(1, 'phong', '123', 'phonghung', 'a@gmail.com', '', '', '', '', 2, 12390205),
(2, 'admin', '123', 'admin', 'admin@gmail.com', '', '', '', '', 2, 0),
(3, 'kaze', '123', 'kamikaze', 'kaze@gmail.com', 'Hà Nội', '', '', '', 1, 5),
(21, 'phong1', '123', 'phong1', 'phong1@gmail.com', 'Vĩnh Phúc', '', 'Kim Cương', '', 1, 112390200),
(22, 'phong2', '123', 'phong2', 'phong2@gmail.com', 'Hà Nội', '', '', '', 1, 0),
(23, 'phong3', '123', 'phong3', 'phong3@gmail.com', 'Đà Nẵng', '', '', '', 1, 0),
(24, 'hung', '123', 'hung', 'hung@gmail.com', 'Hà Nội', '', '', '', 1, 0),
(25, 'aaa', '123', 'aaa', 'aaa@gmail.com', 'Hà Nội', '', '', '', 1, 0),
(26, 'bbb', '123', 'bbb', 'bbb@gmail.com', 'Hà Nội', '', '', '', 1, 0),
(27, 'tao', '123', 'tao', 'aloalo@gmail.com', '', '012301230', '', '', 1, 0),
(28, 'seller1', '123', 'Seller1', 'seller1@gmail.com', 'Lào Cai', '0132245689', 'Bạc', '', 3, 6),
(29, '1', '1', '1', '1', '1', '', '', '', 3, 0),
(30, 'seller2', '123', 'Seller2', 'seller2@gmail.com', 'Bình Thuận', '', '', '', 3, 0),
(32, 'seller3', '123', 'Seller3', 'seller3@gmail.com', 'Thanh Hoá', '', '', '', 3, 0),
(33, 'kkk', '123', 'ddd', 'ddd', 'ddd', 'ddd', 'ddd', '', 1, 0);

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `catalog`
--
ALTER TABLE `catalog`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `comments_ibfk_1` (`userId`),
  ADD KEY `comments_ibfk_2` (`productId`);

--
-- Chỉ mục cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_ibfk_1` (`userId`);

--
-- Chỉ mục cho bảng `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usedId` (`userId`);

--
-- Chỉ mục cho bảng `order_delivery`
--
ALTER TABLE `order_delivery`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_delivery_ibfk_1` (`orderSellerId`);

--
-- Chỉ mục cho bảng `order_product`
--
ALTER TABLE `order_product`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `orderId` (`orderId`,`productId`),
  ADD KEY `productId` (`productId`);

--
-- Chỉ mục cho bảng `order_seller`
--
ALTER TABLE `order_seller`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_seller_ibfk_1` (`productId`),
  ADD KEY `order_seller_ibfk_2` (`userId`),
  ADD KEY `order_seller_ibfk_3` (`buyer`);

--
-- Chỉ mục cho bảng `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_ibfk` (`shopId`);

--
-- Chỉ mục cho bảng `ratings`
--
ALTER TABLE `ratings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ratings_ibfk_1` (`userId`),
  ADD KEY `ratings_ibfk_2` (`productId`);

--
-- Chỉ mục cho bảng `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `roleId` (`roleId`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `catalog`
--
ALTER TABLE `catalog`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT cho bảng `comments`
--
ALTER TABLE `comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT cho bảng `order_delivery`
--
ALTER TABLE `order_delivery`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `order_product`
--
ALTER TABLE `order_product`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT cho bảng `order_seller`
--
ALTER TABLE `order_seller`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT cho bảng `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT cho bảng `ratings`
--
ALTER TABLE `ratings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `comments`
--
ALTER TABLE `comments`
  ADD CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`productId`) REFERENCES `products` (`id`);

--
-- Các ràng buộc cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`);

--
-- Các ràng buộc cho bảng `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`);

--
-- Các ràng buộc cho bảng `order_delivery`
--
ALTER TABLE `order_delivery`
  ADD CONSTRAINT `order_delivery_ibfk_1` FOREIGN KEY (`orderSellerId`) REFERENCES `order_seller` (`id`);

--
-- Các ràng buộc cho bảng `order_product`
--
ALTER TABLE `order_product`
  ADD CONSTRAINT `order_product_ibfk_1` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`),
  ADD CONSTRAINT `order_product_ibfk_2` FOREIGN KEY (`productId`) REFERENCES `products` (`id`);

--
-- Các ràng buộc cho bảng `order_seller`
--
ALTER TABLE `order_seller`
  ADD CONSTRAINT `order_seller_ibfk_1` FOREIGN KEY (`productId`) REFERENCES `products` (`id`),
  ADD CONSTRAINT `order_seller_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `order_seller_ibfk_3` FOREIGN KEY (`buyer`) REFERENCES `users` (`id`);

--
-- Các ràng buộc cho bảng `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `product_ibfk` FOREIGN KEY (`shopId`) REFERENCES `users` (`id`);

--
-- Các ràng buộc cho bảng `ratings`
--
ALTER TABLE `ratings`
  ADD CONSTRAINT `ratings_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `ratings_ibfk_2` FOREIGN KEY (`productId`) REFERENCES `products` (`id`);

--
-- Các ràng buộc cho bảng `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
