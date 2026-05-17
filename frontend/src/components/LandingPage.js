import React, { useEffect, useMemo, useState } from 'react';
import CatalogList from './catalog/CatalogList';
import { addProductToCart, formatVnd, getOrCreateCart } from '../utils/orderingApi';

// Dữ liệu mẫu cho sản phẩm
const featuredProducts = [
  { id: 1, sellerId: 'seller-001', name: 'Tai nghe Chống ồn Pro', unitPrice: 2490000, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80' },
  { id: 2, sellerId: 'seller-002', name: 'Đồng hồ Thể thao', unitPrice: 3150000, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80' },
  { id: 3, sellerId: 'seller-003', name: 'Kính mát Thời trang', unitPrice: 850000, image: 'https://images.unsplash.com/photo-1572635196237-14b3f281501f?w=500&q=80' },
  { id: 4, sellerId: 'seller-001', name: 'Loa Bluetooth Mini', unitPrice: 1200000, image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&q=80' },
];


const LandingPage = () => {
  const [cart, setCart] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCartBusy, setIsCartBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const cartCount = useMemo(() => {
    if (!cart?.totals?.totalQuantity) {
      return 0;
    }
    return cart.totals.totalQuantity;
  }, [cart]);

  useEffect(() => {
    let active = true;

    async function syncCart() {
      try {
        const currentCart = await getOrCreateCart();
        if (active) {
          setCart(currentCart);
        }
      } catch (error) {
        if (active) {
          setStatusMessage('Không thể tải giỏ hàng. Vui lòng kiểm tra Ordering Service.');
        }
      }
    }

    syncCart();

    return () => {
      active = false;
    };
  }, []);

  async function handleOpenCart() {
    setIsCartOpen(true);
    setIsCartBusy(true);
    try {
      const currentCart = await getOrCreateCart();
      setCart(currentCart);
      setStatusMessage('');
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setIsCartBusy(false);
    }
  }

  async function handleAddToCart(product) {
    setIsCartBusy(true);
    try {
      const currentCart = cart || (await getOrCreateCart());
      const nextCart = await addProductToCart(currentCart.id, product);
      setCart(nextCart);
      setStatusMessage(`Đã thêm ${product.name} vào giỏ hàng`);
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setIsCartBusy(false);
    }
  }

  return (
    <>
      {/* CHÈN CSS TRỰC TIẾP VÀO COMPONENT */}
      <style>{`
        /* Tổng quan */
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; color: #333; }
        a { text-decoration: none; color: inherit; }

        /* Header */
        .header { background-color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.05); position: sticky; top: 0; z-index: 100; }
        .header-content { max-width: 1200px; margin: 0 auto; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; }
        .logo { font-size: 24px; font-weight: 900; color: #4f46e5; }
        .nav-links { display: flex; gap: 30px; }
        .nav-links a { font-weight: 500; color: #4b5563; transition: color 0.3s; }
        .nav-links a:hover { color: #4f46e5; }
        .cart-btn { background: none; border: none; font-size: 20px; cursor: pointer; position: relative; }
        .cart-badge { position: absolute; top: -8px; right: -10px; background-color: #ef4444; color: white; font-size: 12px; font-weight: bold; padding: 2px 6px; border-radius: 50%; }
        .status-message { max-width: 1200px; margin: 14px auto 0; padding: 10px 14px; border-radius: 8px; background-color: #ecfeff; color: #0f766e; border: 1px solid #99f6e4; }

        /* Hero Section */
        .hero { background-color: #eef2ff; padding: 60px 20px; }
        .hero-content { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 40px; }
        .hero-text { flex: 1; }
        .hero-text h1 { font-size: 48px; line-height: 1.2; margin-bottom: 20px; color: #111827; }
        .highlight { color: #4f46e5; }
        .hero-text p { font-size: 18px; color: #4b5563; margin-bottom: 30px; line-height: 1.6; }
        .hero-buttons { display: flex; gap: 15px; }
        .btn { padding: 12px 24px; font-size: 16px; font-weight: 600; border-radius: 6px; cursor: pointer; border: none; transition: all 0.3s; }
        .btn-primary { background-color: #4f46e5; color: white; }
        .btn-primary:hover { background-color: #4338ca; }
        .btn-secondary { background-color: white; color: #4f46e5; border: 1px solid #c7d2fe; }
        .btn-secondary:hover { background-color: #e0e7ff; }
        .hero-image { flex: 1; display: flex; justify-content: center; }
        .hero-image img { width: 100%; max-width: 400px; height: 400px; object-fit: cover; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }

        /* Products Section */
        .products-section { max-width: 1200px; margin: 0 auto; padding: 80px 20px; }
        .products-header { text-align: center; margin-bottom: 50px; }
        .products-header h2 { font-size: 32px; color: #111827; margin-bottom: 10px; }
        .products-header p { color: #6b7280; }
        .product-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px; }
        .product-card { background: white; border-radius: 12px; border: 1px solid #f3f4f6; overflow: hidden; transition: box-shadow 0.3s; display: flex; flex-direction: column; }
        .product-card:hover { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
        .product-image { height: 250px; position: relative; overflow: hidden; }
        .product-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
        .product-card:hover .product-image img { transform: scale(1.05); }
        .product-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s; }
        .product-card:hover .product-overlay { opacity: 1; }
        .btn-detail { padding: 10px 20px; background: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; }
        .product-info { padding: 20px; display: flex; flex-direction: column; flex-grow: 1; }
        .product-info h3 { font-size: 18px; margin-bottom: 5px; }
        .price { color: #4f46e5; font-weight: bold; margin-bottom: 15px; }
        .btn-add-cart { margin-top: auto; padding: 10px; background-color: #eef2ff; color: #4f46e5; border: 1px solid #e0e7ff; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.3s; }
        .btn-add-cart:hover { background-color: #4f46e5; color: white; }

        /* Footer */
        .footer { background-color: #111827; color: #d1d5db; padding: 60px 20px 20px; }
        .footer-content { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 40px; margin-bottom: 40px; }
        .footer-col h2 { color: white; margin-bottom: 15px; }
        .footer-col h3 { color: white; margin-bottom: 15px; font-size: 18px; }
        .footer-col p { line-height: 1.6; margin-bottom: 15px; }
        .footer-col ul { list-style: none; }
        .footer-col ul li { margin-bottom: 10px; }
        .footer-col ul li a:hover { color: white; }
        .newsletter { display: flex; }
        .newsletter input { padding: 10px; border: none; border-radius: 4px 0 0 4px; outline: none; flex: 1; }
        .newsletter button { padding: 10px 20px; background-color: #4f46e5; color: white; border: none; border-radius: 0 4px 4px 0; cursor: pointer; }
        .newsletter button:hover { background-color: #4338ca; }
        .footer-bottom { text-align: center; padding-top: 20px; border-top: 1px solid #374151; font-size: 14px; }

        /* Cart drawer */
        .cart-overlay { position: fixed; inset: 0; background: rgba(17, 24, 39, 0.45); z-index: 120; display: flex; justify-content: flex-end; }
        .cart-panel { width: min(100%, 420px); background: #ffffff; height: 100%; display: flex; flex-direction: column; box-shadow: -10px 0 30px rgba(0, 0, 0, 0.12); }
        .cart-panel-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; border-bottom: 1px solid #e5e7eb; }
        .cart-panel-header h3 { font-size: 20px; color: #111827; }
        .close-btn { border: 0; background: #f3f4f6; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; }
        .cart-panel-body { padding: 16px 18px; overflow: auto; flex: 1; }
        .cart-item { padding: 10px 0; border-bottom: 1px dashed #e5e7eb; }
        .cart-item-row { display: flex; justify-content: space-between; gap: 12px; }
        .cart-item-name { font-weight: 600; color: #1f2937; }
        .cart-item-meta { font-size: 13px; color: #6b7280; margin-top: 4px; }
        .cart-total { margin-top: 14px; padding: 12px; border-radius: 8px; background: #eef2ff; color: #1f2937; font-weight: 700; }
        .cart-empty { color: #6b7280; }

        /* Responsive */
        @media (max-width: 768px) {
          .hero-content { flex-direction: column; text-align: center; }
          .nav-links { display: none; }
          .hero-buttons { justify-content: center; }
        }
      `}</style>

      <div className="app-container">
        {/* Header */}
        <header className="header">
          <div className="header-content">
            <div className="logo">Project Web nhóm 16</div>
            <nav className="nav-links">
              <a href="#home">Trang chủ</a>
              <a href="#products">Sản phẩm</a>
              <a href="#about">Về chúng tôi</a>
            </nav>
            <div className="header-actions">
              <button className="cart-btn" onClick={handleOpenCart}>
                🛒 <span className="cart-badge">{cartCount}</span>
              </button>
            </div>
          </div>
        </header>

        {statusMessage ? <div className="status-message">{statusMessage}</div> : null}

        {/* Hero Section */}
        <section id="home" className="hero">
          <div className="hero-content">
            <div className="hero-text">
              <h1>Định hình phong cách <br /> <span className="highlight">của riêng bạn</span></h1>
              <p>Khám phá bộ sưu tập mới nhất với hàng ngàn ưu đãi hấp dẫn. Miễn phí vận chuyển cho đơn hàng từ 500k.</p>
              <div className="hero-buttons">
                <button className="btn btn-primary">Mua ngay</button>
                <button className="btn btn-secondary">Xem khuyến mãi</button>
              </div>
            </div>
            <div className="hero-image">
              <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80" alt="Fashion Hero" />
            </div>
          </div>
        </section>

        <CatalogList />

        {/* Featured Products */}
        <section id="products" className="products-section">
          <div className="products-header">
            <h2>Sản Phẩm Nổi Bật</h2>
            <p>Những mặt hàng được yêu thích nhất trong tuần qua.</p>
          </div>
          <div className="product-grid">
            {featuredProducts.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-image">
                  <img src={product.image} alt={product.name} />
                  <div className="product-overlay">
                    <button className="btn-detail">Xem chi tiết</button>
                  </div>
                </div>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="price">{formatVnd(product.unitPrice)}</p>
                  <button className="btn-add-cart" onClick={() => handleAddToCart(product)} disabled={isCartBusy}>
                    {isCartBusy ? 'Đang xử lý...' : 'Thêm vào giỏ'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {isCartOpen ? (
          <div className="cart-overlay" onClick={() => setIsCartOpen(false)}>
            <aside className="cart-panel" onClick={(event) => event.stopPropagation()}>
              <div className="cart-panel-header">
                <h3>Giỏ hàng của bạn</h3>
                <button className="close-btn" onClick={() => setIsCartOpen(false)}>x</button>
              </div>
              <div className="cart-panel-body">
                {isCartBusy ? <p>Đang tải giỏ hàng...</p> : null}
                {!isCartBusy && cart?.items?.length ? (
                  <>
                    {cart.items.map((item) => (
                      <div key={item.productId} className="cart-item">
                        <div className="cart-item-row">
                          <div>
                            <p className="cart-item-name">{item.name}</p>
                            <p className="cart-item-meta">Số lượng: {item.quantity}</p>
                          </div>
                          <p>{formatVnd(item.unitPrice * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                    <div className="cart-total">
                      Tổng SL: {cart.totals?.totalQuantity || 0} | Tạm tính: {formatVnd(cart.totals?.subtotal || 0)}
                    </div>
                  </>
                ) : null}
                {!isCartBusy && !cart?.items?.length ? <p className="cart-empty">Giỏ hàng đang trống.</p> : null}
              </div>
            </aside>
          </div>
        ) : null}

        {/* Footer */}
        <footer id="about" className="footer">
          <div className="footer-content">
            <div className="footer-col">
              <h2>Project Web nhóm 16</h2>
              <p>Mang đến cho bạn những sản phẩm chất lượng nhất với dịch vụ chăm sóc khách hàng tận tâm. Mua sắm dễ dàng, an toàn và nhanh chóng.</p>
            </div>
            <div className="footer-col">
              <h3>Hỗ trợ khách hàng</h3>
              <ul>
                <li><a href="/">Chính sách đổi trả</a></li>
                <li><a href="/">Chính sách bảo mật</a></li>
                <li><a href="/">Hướng dẫn mua hàng</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h3>Đăng ký nhận tin</h3>
              <p>Nhận ngay thông tin về các ưu đãi mới nhất.</p>
              <div className="newsletter">
                <input type="email" placeholder="Email của bạn..." />
                <button>Gửi</button>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            &copy; 2026 Project Web nhóm 16. All rights reserved.
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;