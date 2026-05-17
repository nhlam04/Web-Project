import React from 'react';
import CatalogList from './catalog/CatalogList';

const featuredProducts = [
  { id: 1, name: "Tai nghe Chống ồn Pro", price: "2.490.000đ", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80" },
  { id: 2, name: "Đồng hồ Thể thao", price: "3.150.000đ", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80" },
  { id: 3, name: "Kính mát Thời trang", price: "850.000đ", image: "https://images.unsplash.com/photo-1572635196237-14b3f281501f?w=500&q=80" },
  { id: 4, name: "Loa Bluetooth Mini", price: "1.200.000đ", image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&q=80" },
];

const LandingPage = () => {
  return (
    <div className="font-sans bg-gray-50 text-gray-900 min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
            Dự án Nhóm 16
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#home" className="font-medium text-gray-600 hover:text-indigo-600 transition-colors duration-300">Trang chủ</a>
            <a href="#products" className="font-medium text-gray-600 hover:text-indigo-600 transition-colors duration-300">Sản phẩm</a>
            <a href="#about" className="font-medium text-gray-600 hover:text-indigo-600 transition-colors duration-300">Về chúng tôi</a>
          </nav>
          <div>
            <button className="relative p-2 text-gray-600 hover:text-indigo-600 transition-colors duration-300 group">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full">3</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="relative bg-gradient-to-br from-indigo-50 via-white to-violet-50 overflow-hidden">
        <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-200/40 via-transparent to-transparent pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight">
              Định hình phong cách <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">của riêng bạn</span>
            </h1>
            <p className="text-lg lg:text-xl text-gray-600 mb-10 max-w-2xl mx-auto lg:mx-0">
              Khám phá bộ sưu tập mới nhất với hàng ngàn ưu đãi hấp dẫn. Miễn phí vận chuyển cho đơn hàng từ 500k. Nâng tầm cuộc sống với những sản phẩm công nghệ tinh tế.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold shadow-lg shadow-indigo-200 transform hover:-translate-y-1 transition-all duration-300">
                Mua ngay hôm nay
              </button>
              <button className="px-8 py-4 bg-white hover:bg-gray-50 text-indigo-600 border border-indigo-100 rounded-full font-semibold shadow-sm hover:shadow-md transform hover:-translate-y-1 transition-all duration-300">
                Xem khuyến mãi
              </button>
            </div>
          </div>
          <div className="flex-1 w-full flex justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-200 to-violet-200 rounded-[3rem] transform rotate-3 scale-105 opacity-50 blur-xl"></div>
            <img
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80"
              alt="Fashion Hero"
              className="relative w-full max-w-md h-[500px] object-cover rounded-[2rem] shadow-2xl border-4 border-white transform hover:scale-[1.02] transition-transform duration-500"
            />
          </div>
        </div>
      </section>

      <div className="bg-white">
        <CatalogList />
      </div>

      {/* Products Section */}
      <section id="products" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 relative inline-block">
              Sản Phẩm Nổi Bật
              <div className="absolute -bottom-2 left-1/4 right-1/4 h-1 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full"></div>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto mt-4">Những mặt hàng được yêu thích nhất trong tuần qua. Chọn ngay món đồ phù hợp với phong cách của bạn.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <div key={product.id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-300 flex flex-col">
                <div className="relative h-64 overflow-hidden bg-gray-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                    <button className="px-6 py-2 bg-white/90 hover:bg-white text-gray-900 font-semibold rounded-full transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
                      Xem chi tiết
                    </button>
                  </div>
                  <div className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md text-gray-400 hover:text-red-500 transition-colors cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-1">{product.name}</h3>
                  <div className="text-xl font-extrabold text-indigo-600 mb-6">{product.price}</div>
                  <button className="mt-auto w-full py-3 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl font-semibold transition-colors duration-300 flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Thêm vào giỏ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="bg-gray-900 text-gray-300 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 lg:col-span-1">
              <h2 className="text-2xl font-bold text-white mb-6">Dự án Nhóm 16</h2>
              <p className="text-gray-400 leading-relaxed mb-6">Mang đến cho bạn những sản phẩm chất lượng nhất với dịch vụ chăm sóc khách hàng tận tâm. Mua sắm dễ dàng, an toàn và nhanh chóng.</p>
              <div className="flex space-x-4">
                {/* Social Icons Placeholder */}
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-indigo-600 transition-colors cursor-pointer">
                  <span className="text-white">FB</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-indigo-600 transition-colors cursor-pointer">
                  <span className="text-white">IG</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-6 uppercase tracking-wider text-sm">Hỗ trợ khách hàng</h3>
              <ul className="space-y-4">
                <li><a href="/" className="hover:text-white transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Chính sách đổi trả</a></li>
                <li><a href="/" className="hover:text-white transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Chính sách bảo mật</a></li>
                <li><a href="/" className="hover:text-white transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Hướng dẫn mua hàng</a></li>
                <li><a href="/" className="hover:text-white transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Câu hỏi thường gặp</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-6 uppercase tracking-wider text-sm">Liên hệ</h3>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Soict - HUST</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>0123 456 789</span>
                </li>
              </ul>
            </div>

            <div className="col-span-1 lg:col-span-1">
              <h3 className="text-lg font-semibold text-white mb-6 uppercase tracking-wider text-sm">Đăng ký nhận tin</h3>
              <p className="mb-4 text-gray-400">Nhận ngay thông tin về các ưu đãi mới nhất.</p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Email của bạn..."
                  className="px-4 py-3 bg-gray-800 border-none rounded-l-lg outline-none focus:ring-2 focus:ring-indigo-500 flex-1 text-white"
                />
                <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-r-lg transition-colors">
                  Gửi
                </button>
              </div>
            </div>
          </div>

          <div className="text-center pt-8 border-t border-gray-800 text-gray-500 text-sm">
            &copy; 2026 Project Web nhóm 16. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;