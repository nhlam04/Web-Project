from app.models.catalog import Catalog
from app.models.product import Product


LOCATIONS = "{'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng'}"


CATALOG_DEFINITIONS = [
    {
        "id": 1,
        "product_type": "Thời Trang Nam",
        "brand": "{'Routine', 'Coolmate', 'Owen', 'An Phước', 'Yody'}",
    },
    {
        "id": 2,
        "product_type": "Thời Trang Nữ",
        "brand": "{'Canifa', 'IVY moda', 'Elise', 'Lamer', 'Yody'}",
    },
    {
        "id": 3,
        "product_type": "Điện Thoại & Phụ Kiện",
        "brand": "{'Apple', 'Samsung', 'Xiaomi', 'OPPO', 'Anker'}",
    },
    {
        "id": 4,
        "product_type": "Mẹ & Bé",
        "brand": "{'Huggies', 'Pampers', 'Moony', 'Combi', 'Chicco'}",
    },
    {
        "id": 5,
        "product_type": "Thiết Bị Điện Tử",
        "brand": "{'Sony', 'Samsung', 'LG', 'Panasonic', 'Philips'}",
    },
    {
        "id": 6,
        "product_type": "Nhà Cửa & Đời Sống",
        "brand": "{'Lock&Lock', 'Sunhouse', 'Elmich', 'Tefal', 'Điện Quang'}",
    },
    {
        "id": 7,
        "product_type": "Máy Tính & Laptop",
        "brand": "{'Asus', 'Dell', 'HP', 'Lenovo', 'Apple', 'Acer', 'MSI'}",
    },
    {
        "id": 8,
        "product_type": "Sắc Đẹp",
        "brand": "{'L’Oréal', 'Maybelline', 'Innisfree', 'La Roche-Posay', 'Cocoon'}",
    },
    {
        "id": 9,
        "product_type": "Máy Ảnh & Máy Quay Phim",
        "brand": "{'Canon', 'Sony', 'Nikon', 'Fujifilm', 'GoPro'}",
    },
    {
        "id": 10,
        "product_type": "Sức Khỏe",
        "brand": "{'Omron', 'Microlife', 'Blackmores', 'Nature Made', 'Beurer'}",
    },
]


PRODUCT_BLUEPRINTS = [
    {
        "catalog_id": 1,
        "items": [
            ("Áo thun nam cotton basic", 159000, "Áo thun cổ tròn mềm nhẹ, dễ phối đồ", {"brand": "Coolmate", "material": "Cotton compact", "size": "M/L/XL", "color": "Đen", "style": "Basic", "origin": "Việt Nam"}, "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=700"),
            ("Áo sơ mi nam Oxford", 329000, "Sơ mi dài tay form regular lịch sự", {"brand": "Owen", "material": "Oxford cotton", "size": "M/L/XL", "color": "Trắng", "style": "Office", "origin": "Việt Nam"}, "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=700"),
            ("Quần jean nam slim fit", 499000, "Jean co giãn nhẹ, dáng slim hiện đại", {"brand": "Routine", "material": "Denim stretch", "size": "30/31/32/34", "color": "Xanh đậm", "style": "Slim fit", "origin": "Việt Nam"}, "https://images.unsplash.com/photo-1542272604-787c3835535d?w=700"),
            ("Áo khoác bomber nam", 620000, "Bomber chống gió nhẹ, phù hợp đi làm/đi chơi", {"brand": "Yody", "material": "Polyester", "size": "M/L/XL", "color": "Xanh navy", "style": "Casual", "origin": "Việt Nam"}, "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=700"),
            ("Quần short kaki nam", 269000, "Quần short kaki thoáng mát cho mùa hè", {"brand": "An Phước", "material": "Kaki cotton", "size": "M/L/XL", "color": "Be", "style": "Casual", "origin": "Việt Nam"}, "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=700"),
            ("Áo polo nam thể thao", 289000, "Polo co giãn, thấm hút mồ hôi tốt", {"brand": "Coolmate", "material": "Poly pique", "size": "M/L/XL", "color": "Xám", "style": "Sport", "origin": "Việt Nam"}, "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=700"),
            ("Thắt lưng da nam", 350000, "Dây lưng da bò khóa kim sang trọng", {"brand": "Routine", "material": "Da bò", "size": "Free size", "color": "Nâu", "style": "Formal", "origin": "Việt Nam"}, "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=700"),
            ("Giày sneaker nam trắng", 790000, "Sneaker tối giản, đế êm dễ đi hằng ngày", {"brand": "Yody", "material": "Da tổng hợp", "size": "40/41/42/43", "color": "Trắng", "style": "Streetwear", "origin": "Việt Nam"}, "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=700"),
        ],
    },
    {
        "catalog_id": 2,
        "items": [
            ("Đầm midi hoa nhí", 459000, "Đầm midi nhẹ nhàng, phù hợp đi chơi và công sở", {"brand": "IVY moda", "material": "Voan lụa", "size": "S/M/L", "color": "Kem hoa", "style": "Feminine", "origin": "Việt Nam"}, "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=700"),
            ("Áo blouse nữ tay phồng", 299000, "Blouse tay phồng thanh lịch", {"brand": "Elise", "material": "Lụa polyester", "size": "S/M/L", "color": "Trắng", "style": "Office", "origin": "Việt Nam"}, "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=700"),
            ("Chân váy chữ A", 350000, "Chân váy chữ A tôn dáng", {"brand": "Lamer", "material": "Tweed", "size": "S/M/L", "color": "Đen", "style": "Classic", "origin": "Việt Nam"}, "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=700"),
            ("Quần culottes nữ", 389000, "Culottes ống rộng thoải mái", {"brand": "Canifa", "material": "Rayon pha", "size": "S/M/L/XL", "color": "Nâu", "style": "Minimal", "origin": "Việt Nam"}, "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=700"),
            ("Áo cardigan len mỏng", 420000, "Cardigan len mềm, mặc khoác nhẹ", {"brand": "Yody", "material": "Len acrylic", "size": "Free size", "color": "Be", "style": "Casual", "origin": "Việt Nam"}, "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=700"),
            ("Túi xách nữ mini", 590000, "Túi mini đeo chéo phong cách", {"brand": "Elise", "material": "Da PU", "size": "Mini", "color": "Đen", "style": "Chic", "origin": "Việt Nam"}, "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=700"),
            ("Giày cao gót mũi nhọn", 650000, "Cao gót 5cm dễ đi", {"brand": "Lamer", "material": "Da tổng hợp", "size": "35-39", "color": "Nude", "style": "Formal", "origin": "Việt Nam"}, "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=700"),
            ("Áo thun nữ oversize", 199000, "Áo thun oversize trẻ trung", {"brand": "Canifa", "material": "Cotton", "size": "S/M/L", "color": "Hồng pastel", "style": "Streetwear", "origin": "Việt Nam"}, "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=700"),
        ],
    },
    {
        "catalog_id": 3,
        "items": [
            ("iPhone 15 128GB", 19990000, "Điện thoại Apple chip A16, camera 48MP", {"brand": "Apple", "screen": "6.1 inch OLED", "storage": "128GB", "ram": "6GB", "battery": "3349mAh", "warranty": "12 tháng"}, "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=700"),
            ("Samsung Galaxy A55 5G", 9690000, "Smartphone 5G màn hình Super AMOLED", {"brand": "Samsung", "screen": "6.6 inch AMOLED", "storage": "256GB", "ram": "8GB", "battery": "5000mAh", "warranty": "12 tháng"}, "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=700"),
            ("Xiaomi Redmi Note 13 Pro", 7290000, "Camera 200MP, sạc nhanh 67W", {"brand": "Xiaomi", "screen": "6.67 inch AMOLED", "storage": "256GB", "ram": "8GB", "battery": "5100mAh", "warranty": "18 tháng"}, "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=700"),
            ("OPPO Reno11 F", 8490000, "Thiết kế mỏng nhẹ, camera chân dung", {"brand": "OPPO", "screen": "6.7 inch AMOLED", "storage": "256GB", "ram": "8GB", "battery": "5000mAh", "warranty": "12 tháng"}, "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=700"),
            ("Tai nghe Bluetooth Anker Soundcore", 1290000, "Tai nghe chống ồn, pin lâu", {"brand": "Anker", "screen": "N/A", "storage": "N/A", "ram": "N/A", "battery": "40 giờ", "warranty": "18 tháng"}, "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700"),
            ("Ốp lưng MagSafe iPhone", 390000, "Ốp lưng trong suốt hỗ trợ MagSafe", {"brand": "Apple", "screen": "N/A", "storage": "N/A", "ram": "N/A", "battery": "N/A", "warranty": "6 tháng"}, "https://images.unsplash.com/photo-1603313011101-320f26a4f6f6?w=700"),
            ("Sạc nhanh GaN 65W", 790000, "Củ sạc 3 cổng USB-C/USB-A", {"brand": "Anker", "screen": "N/A", "storage": "N/A", "ram": "N/A", "battery": "N/A", "warranty": "18 tháng"}, "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=700"),
            ("Cáp USB-C to USB-C 100W", 250000, "Cáp sạc nhanh bọc dù 1.8m", {"brand": "Anker", "screen": "N/A", "storage": "N/A", "ram": "N/A", "battery": "N/A", "warranty": "12 tháng"}, "https://images.unsplash.com/photo-1603539444875-76e7684265f6?w=700"),
        ],
    },
    {
        "catalog_id": 4,
        "items": [
            ("Tã quần Huggies size L", 329000, "Tã quần thấm hút tốt cho bé 9-14kg", {"brand": "Huggies", "ageRange": "9-14kg", "material": "Bông mềm", "safety": "Không hương liệu", "origin": "Việt Nam"}, "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=700"),
            ("Sữa tắm gội Chicco Baby", 219000, "Sữa tắm gội dịu nhẹ cho bé", {"brand": "Chicco", "ageRange": "0+", "material": "Chiết xuất yến mạch", "safety": "Dermatologically tested", "origin": "Ý"}, "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=700"),
            ("Xe đẩy em bé Combi", 3290000, "Xe đẩy gấp gọn, tựa lưng nhiều nấc", {"brand": "Combi", "ageRange": "0-36 tháng", "material": "Khung nhôm", "safety": "Đai 5 điểm", "origin": "Nhật Bản"}, "https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=700"),
            ("Bình sữa chống đầy hơi", 189000, "Bình sữa cổ rộng 240ml", {"brand": "Chicco", "ageRange": "0+", "material": "PP an toàn", "safety": "BPA Free", "origin": "Ý"}, "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=700"),
            ("Khăn ướt Moony", 45000, "Khăn ướt không mùi, mềm mại", {"brand": "Moony", "ageRange": "0+", "material": "Vải không dệt", "safety": "Không cồn", "origin": "Nhật Bản"}, "https://images.unsplash.com/photo-1546015720-b8b30df5aa27?w=700"),
            ("Ghế ăn dặm gấp gọn", 890000, "Ghế ăn dặm có khay tháo rời", {"brand": "Combi", "ageRange": "6-36 tháng", "material": "Nhựa PP", "safety": "Đai an toàn", "origin": "Nhật Bản"}, "https://images.unsplash.com/photo-1604881991720-f91add269bed?w=700"),
            ("Đồ chơi xúc xắc cho bé", 99000, "Bộ xúc xắc nhiều màu kích thích giác quan", {"brand": "Chicco", "ageRange": "3 tháng+", "material": "Nhựa ABS", "safety": "BPA Free", "origin": "Ý"}, "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=700"),
            ("Kem chống hăm em bé", 159000, "Kem bảo vệ da vùng tã", {"brand": "Pampers", "ageRange": "0+", "material": "Zinc oxide", "safety": "Không paraben", "origin": "Mỹ"}, "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=700"),
        ],
    },
    {
        "catalog_id": 5,
        "items": [
            ("Smart TV Samsung 55 inch 4K", 11990000, "TV 4K Crystal UHD, hệ điều hành Tizen", {"brand": "Samsung", "power": "150W", "warranty": "24 tháng", "feature": "4K HDR, Smart Hub", "origin": "Việt Nam"}, "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=700"),
            ("Loa Bluetooth Sony XB100", 1290000, "Loa di động chống nước IP67", {"brand": "Sony", "power": "5W", "warranty": "12 tháng", "feature": "Extra Bass", "origin": "Trung Quốc"}, "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=700"),
            ("Máy lọc không khí LG PuriCare", 5990000, "Lọc bụi mịn PM2.5 cho phòng 40m2", {"brand": "LG", "power": "45W", "warranty": "12 tháng", "feature": "HEPA, cảm biến bụi", "origin": "Hàn Quốc"}, "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=700"),
            ("Nồi chiên không dầu Philips", 2690000, "Nồi chiên 4.1L công nghệ Rapid Air", {"brand": "Philips", "power": "1400W", "warranty": "24 tháng", "feature": "Rapid Air", "origin": "Trung Quốc"}, "https://images.unsplash.com/photo-1649096295289-05d84f8b2dbd?w=700"),
            ("Máy xay sinh tố Panasonic", 1190000, "Máy xay 2 cối lưỡi dao thép không gỉ", {"brand": "Panasonic", "power": "450W", "warranty": "12 tháng", "feature": "2 cối xay", "origin": "Malaysia"}, "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=700"),
            ("Robot hút bụi thông minh", 4990000, "Robot hút bụi lau nhà điều khiển app", {"brand": "Samsung", "power": "55W", "warranty": "12 tháng", "feature": "Mapping, app control", "origin": "Trung Quốc"}, "https://images.unsplash.com/photo-1603618090561-412154b4bd1b?w=700"),
            ("Máy sấy tóc ion âm", 790000, "Máy sấy tóc 2 chiều nóng/lạnh", {"brand": "Philips", "power": "1600W", "warranty": "12 tháng", "feature": "Ion âm", "origin": "Trung Quốc"}, "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=700"),
            ("Dàn âm thanh Soundbar LG", 3990000, "Soundbar 2.1 kênh kèm subwoofer", {"brand": "LG", "power": "300W", "warranty": "12 tháng", "feature": "Bluetooth, HDMI ARC", "origin": "Việt Nam"}, "https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=700"),
        ],
    },
    {
        "catalog_id": 6,
        "items": [
            ("Bộ hộp thủy tinh Lock&Lock", 499000, "Bộ 5 hộp thủy tinh chịu nhiệt", {"brand": "Lock&Lock", "material": "Thủy tinh borosilicate", "dimension": "5 hộp nhiều cỡ", "color": "Trong suốt", "origin": "Hàn Quốc"}, "https://images.unsplash.com/photo-1584473457409-cef4d8486e35?w=700"),
            ("Chảo chống dính Tefal 28cm", 690000, "Chảo đáy từ phủ chống dính Titanium", {"brand": "Tefal", "material": "Hợp kim nhôm", "dimension": "28cm", "color": "Đen", "origin": "Pháp"}, "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=700"),
            ("Nồi inox Elmich 20cm", 590000, "Nồi inox 304 dùng mọi loại bếp", {"brand": "Elmich", "material": "Inox 304", "dimension": "20cm", "color": "Bạc", "origin": "CH Séc"}, "https://images.unsplash.com/photo-1584990347449-a70d8f5b05db?w=700"),
            ("Đèn bàn LED Điện Quang", 399000, "Đèn học LED chống cận, 3 mức sáng", {"brand": "Điện Quang", "material": "Nhựa ABS", "dimension": "35cm", "color": "Trắng", "origin": "Việt Nam"}, "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=700"),
            ("Bộ ga gối cotton", 899000, "Bộ ga gối cotton 100% cho giường 1m6", {"brand": "Lock&Lock", "material": "Cotton", "dimension": "160x200cm", "color": "Xanh pastel", "origin": "Việt Nam"}, "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=700"),
            ("Kệ sách 5 tầng", 1290000, "Kệ gỗ công nghiệp phủ melamine", {"brand": "Sunhouse", "material": "Gỗ MDF", "dimension": "60x24x160cm", "color": "Vân gỗ", "origin": "Việt Nam"}, "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=700"),
            ("Máy lọc nước Sunhouse", 4990000, "Máy lọc RO 10 lõi", {"brand": "Sunhouse", "material": "Vỏ thép sơn tĩnh điện", "dimension": "Tủ đứng", "color": "Đen", "origin": "Việt Nam"}, "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=700"),
            ("Bình giữ nhiệt 500ml", 250000, "Bình inox giữ nóng/lạnh 8 giờ", {"brand": "Lock&Lock", "material": "Inox 304", "dimension": "500ml", "color": "Xanh navy", "origin": "Hàn Quốc"}, "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=700"),
        ],
    },
    {
        "catalog_id": 7,
        "items": [
            ("Asus Vivobook 15 OLED", 15990000, "Laptop OLED mỏng nhẹ cho học tập và văn phòng", {"CPU": "Intel Core i5-13500H", "GPU": "Intel Iris Xe", "RAM": "16GB DDR4", "memory": "512GB SSD", "OS": "Windows 11", "screen": "15.6 inch OLED FHD", "factory": "Asus"}, "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=700"),
            ("MacBook Air M2 13 inch", 24490000, "MacBook Air chip M2, pin cả ngày", {"CPU": "Apple M2", "GPU": "Apple GPU 8-core", "RAM": "8GB unified", "memory": "256GB SSD", "OS": "macOS", "screen": "13.6 inch Liquid Retina", "factory": "Apple"}, "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=700"),
            ("Dell Inspiron 14", 13990000, "Laptop văn phòng bền bỉ", {"CPU": "Intel Core i5-1335U", "GPU": "Intel Iris Xe", "RAM": "16GB DDR5", "memory": "512GB SSD", "OS": "Windows 11", "screen": "14 inch FHD", "factory": "Dell"}, "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=700"),
            ("Lenovo Legion 5 Gaming", 28990000, "Laptop gaming RTX mạnh mẽ", {"CPU": "AMD Ryzen 7 7840HS", "GPU": "NVIDIA RTX 4060", "RAM": "16GB DDR5", "memory": "1TB SSD", "OS": "Windows 11", "screen": "15.6 inch 165Hz", "factory": "Lenovo"}, "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=700"),
            ("HP Pavilion 15", 14990000, "Laptop phổ thông hiệu năng ổn định", {"CPU": "Intel Core i5-1235U", "GPU": "Intel Iris Xe", "RAM": "8GB DDR4", "memory": "512GB SSD", "OS": "Windows 11", "screen": "15.6 inch FHD", "factory": "HP"}, "https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=700"),
            ("Acer Aspire 7", 17990000, "Laptop đồ họa/gaming cơ bản", {"CPU": "AMD Ryzen 5 5500U", "GPU": "NVIDIA GTX 1650", "RAM": "8GB DDR4", "memory": "512GB SSD", "OS": "Windows 11", "screen": "15.6 inch FHD", "factory": "Acer"}, "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=700"),
            ("MSI Modern 14", 12990000, "Laptop mỏng nhẹ cho sinh viên", {"CPU": "Intel Core i5-1235U", "GPU": "Intel Iris Xe", "RAM": "8GB DDR4", "memory": "512GB SSD", "OS": "Windows 11", "screen": "14 inch FHD", "factory": "MSI"}, "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=700"),
            ("Màn hình Dell 24 inch", 3690000, "Màn hình IPS 75Hz cho làm việc", {"CPU": "N/A", "GPU": "N/A", "RAM": "N/A", "memory": "N/A", "OS": "N/A", "screen": "24 inch IPS FHD", "factory": "Dell"}, "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=700"),
        ],
    },
    {
        "catalog_id": 8,
        "items": [
            ("Kem chống nắng La Roche-Posay", 449000, "Kem chống nắng SPF50+ cho da dầu", {"brand": "La Roche-Posay", "skinType": "Da dầu/nhạy cảm", "volume": "50ml", "ingredient": "Mexoryl, Niacinamide", "origin": "Pháp"}, "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=700"),
            ("Son Maybelline SuperStay", 239000, "Son lì lâu trôi màu đỏ đất", {"brand": "Maybelline", "skinType": "Mọi loại da", "volume": "5ml", "ingredient": "Color stay polymer", "origin": "Mỹ"}, "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=700"),
            ("Serum Cocoon bí đao", 295000, "Serum hỗ trợ giảm dầu và mụn", {"brand": "Cocoon", "skinType": "Da dầu mụn", "volume": "70ml", "ingredient": "Bí đao, BHA", "origin": "Việt Nam"}, "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=700"),
            ("Nước tẩy trang L’Oréal", 199000, "Tẩy trang dịu nhẹ 3-in-1", {"brand": "L’Oréal", "skinType": "Mọi loại da", "volume": "400ml", "ingredient": "Micellar water", "origin": "Pháp"}, "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=700"),
            ("Mặt nạ giấy Innisfree", 29000, "Mặt nạ dưỡng ẩm chiết xuất trà xanh", {"brand": "Innisfree", "skinType": "Da khô", "volume": "25ml", "ingredient": "Green tea", "origin": "Hàn Quốc"}, "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=700"),
            ("Sữa rửa mặt dịu nhẹ", 279000, "Sữa rửa mặt pH cân bằng", {"brand": "La Roche-Posay", "skinType": "Da nhạy cảm", "volume": "200ml", "ingredient": "Thermal water", "origin": "Pháp"}, "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=700"),
            ("Mascara Maybelline Lash Sensational", 229000, "Mascara làm dày và cong mi", {"brand": "Maybelline", "skinType": "Mọi loại da", "volume": "9.5ml", "ingredient": "Wax blend", "origin": "Mỹ"}, "https://images.unsplash.com/photo-1631214524020-7e18db9a8f92?w=700"),
            ("Kem dưỡng ẩm Cocoon rau má", 345000, "Kem dưỡng phục hồi hàng rào da", {"brand": "Cocoon", "skinType": "Da nhạy cảm", "volume": "50ml", "ingredient": "Rau má, ceramide", "origin": "Việt Nam"}, "https://images.unsplash.com/photo-1617897903246-719242758050?w=700"),
        ],
    },
    {
        "catalog_id": 9,
        "items": [
            ("Canon EOS R50 kit", 18990000, "Máy ảnh mirrorless nhỏ gọn cho creator", {"brand": "Canon", "sensor": "APS-C CMOS", "resolution": "24.2MP", "lens": "RF-S 18-45mm", "video": "4K 30fps", "warranty": "24 tháng"}, "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=700"),
            ("Sony ZV-E10", 16990000, "Máy ảnh vlog thay ống kính", {"brand": "Sony", "sensor": "APS-C Exmor", "resolution": "24.2MP", "lens": "16-50mm", "video": "4K 30fps", "warranty": "24 tháng"}, "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=700"),
            ("Fujifilm X-S20", 32990000, "Máy ảnh hybrid chống rung trong thân", {"brand": "Fujifilm", "sensor": "APS-C X-Trans", "resolution": "26.1MP", "lens": "Body only", "video": "6.2K 30fps", "warranty": "24 tháng"}, "https://images.unsplash.com/photo-1500634245200-e5245c7574ef?w=700"),
            ("Nikon Z30 kit", 17990000, "Mirrorless cho quay vlog và livestream", {"brand": "Nikon", "sensor": "APS-C CMOS", "resolution": "20.9MP", "lens": "16-50mm", "video": "4K 30fps", "warranty": "24 tháng"}, "https://images.unsplash.com/photo-1495707902641-75cac588d2e9?w=700"),
            ("GoPro HERO12 Black", 10990000, "Action camera chống nước, HyperSmooth", {"brand": "GoPro", "sensor": "1/1.9 inch", "resolution": "27MP", "lens": "Wide", "video": "5.3K 60fps", "warranty": "12 tháng"}, "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=700"),
            ("Ống kính Sony 35mm F1.8", 9990000, "Lens prime khẩu lớn chụp chân dung", {"brand": "Sony", "sensor": "Full-frame", "resolution": "N/A", "lens": "35mm F1.8", "video": "N/A", "warranty": "12 tháng"}, "https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=700"),
            ("Tripod máy ảnh du lịch", 790000, "Chân máy gọn nhẹ cao 1.5m", {"brand": "Canon", "sensor": "N/A", "resolution": "N/A", "lens": "N/A", "video": "N/A", "warranty": "6 tháng"}, "https://images.unsplash.com/photo-1495121553079-4c61bcce1894?w=700"),
            ("Thẻ nhớ SD 128GB UHS-I", 490000, "Thẻ nhớ tốc độ cao cho quay 4K", {"brand": "Nikon", "sensor": "N/A", "resolution": "N/A", "lens": "N/A", "video": "4K ready", "warranty": "60 tháng"}, "https://images.unsplash.com/photo-1615555365265-990c0f31dc3e?w=700"),
        ],
    },
    {
        "catalog_id": 10,
        "items": [
            ("Máy đo huyết áp Omron HEM-7120", 890000, "Máy đo huyết áp bắp tay tự động", {"brand": "Omron", "usage": "Đo huyết áp tại nhà", "ingredient": "Thiết bị điện tử y tế", "certification": "ISO 13485", "origin": "Nhật Bản"}, "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=700"),
            ("Nhiệt kế điện tử Microlife", 190000, "Nhiệt kế đo nhanh, đầu mềm", {"brand": "Microlife", "usage": "Đo thân nhiệt", "ingredient": "Cảm biến điện tử", "certification": "CE", "origin": "Thụy Sĩ"}, "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=700"),
            ("Vitamin D3 Nature Made", 320000, "Viên uống bổ sung vitamin D3", {"brand": "Nature Made", "usage": "Bổ sung vitamin", "ingredient": "Vitamin D3 1000IU", "certification": "USP Verified", "origin": "Mỹ"}, "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=700"),
            ("Blackmores Fish Oil", 450000, "Dầu cá hỗ trợ tim mạch", {"brand": "Blackmores", "usage": "Bổ sung Omega-3", "ingredient": "Fish oil 1000mg", "certification": "GMP", "origin": "Úc"}, "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=700"),
            ("Cân sức khỏe điện tử Beurer", 690000, "Cân điện tử mặt kính chịu lực", {"brand": "Beurer", "usage": "Theo dõi cân nặng", "ingredient": "Kính cường lực", "certification": "CE", "origin": "Đức"}, "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=700"),
            ("Máy massage cổ vai gáy", 1290000, "Massage nhiệt giảm mỏi cơ", {"brand": "Beurer", "usage": "Massage thư giãn", "ingredient": "Motor massage", "certification": "CE", "origin": "Đức"}, "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=700"),
            ("Khẩu trang y tế 4 lớp", 59000, "Hộp 50 khẩu trang kháng khuẩn", {"brand": "Omron", "usage": "Bảo vệ hô hấp", "ingredient": "Vải không dệt", "certification": "TCCS", "origin": "Việt Nam"}, "https://images.unsplash.com/photo-1584634731339-252c581abfc5?w=700"),
            ("Gel rửa tay khô", 39000, "Gel rửa tay nhanh hương trà xanh", {"brand": "Microlife", "usage": "Vệ sinh tay", "ingredient": "Alcohol 70%", "certification": "GMP", "origin": "Việt Nam"}, "https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=700"),
        ],
    },
]


def make_catalogs():
    return [
        Catalog(
            id=item["id"],
            product_type=item["product_type"],
            brand=item["brand"],
            location=LOCATIONS,
        )
        for item in CATALOG_DEFINITIONS
    ]


def make_products(seed_seller_id: str):
    products = []
    product_id = 1

    for group in PRODUCT_BLUEPRINTS:
        catalog_id = group["catalog_id"]
        for index, (name, price, short_desc, detail_desc, image) in enumerate(group["items"]):
            star_count = 3 + ((product_id + index) % 3)
            total_rates = 12 + ((product_id * 7) % 90)
            sold = (product_id * 3) % 45

            products.append(
                Product(
                    id=product_id,
                    name=name,
                    price=price,
                    shortDesc=short_desc,
                    detailDesc=detail_desc,
                    quantity=40 + ((product_id * 5) % 80),
                    sold=sold,
                    shopId=seed_seller_id,
                    images=[image],
                    ranking=star_count,
                    totalComments=max(1, total_rates // 3),
                    StarCount=star_count,
                    totalRates=total_rates,
                    catalog_id=catalog_id,
                )
            )
            product_id += 1

    return products