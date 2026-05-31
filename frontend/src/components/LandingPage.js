import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';
import { useCart } from './cart/CartProvider';
import { Button, EmptyState, Skeleton, Toast } from './shared/designSystem';
import PageShell from './shared/PageShell';
import { formatPrice, getProductImage } from '../utils/formatters';

const CATALOG_BASE_URL = process.env.REACT_APP_CATALOG_URL || '/api/catalog';

const LandingPage = () => {
  const navigate = useNavigate();
  const featuredRef = useRef(null);
  const { addProduct, isBusy: isCartBusy, openCart } = useCart();
  const auth = useAuth();
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [categoryError, setCategoryError] = useState('');
  const [productError, setProductError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      setLoadingCategories(true);
      setCategoryError('');
      try {
        const response = await fetch(`${CATALOG_BASE_URL}/api/v1/catalogs/`);
        if (!response.ok) throw new Error('Không thể tải danh mục.');
        const data = await response.json();
        if (active) setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        if (active) setCategoryError(error.message);
      } finally {
        if (active) setLoadingCategories(false);
      }
    }

    async function loadFeaturedProducts() {
      setLoadingProducts(true);
      setProductError('');
      try {
        const response = await fetch(`${CATALOG_BASE_URL}/api/v1/products/?skip=0&limit=8`);
        if (!response.ok) throw new Error('Không thể tải sản phẩm nổi bật.');
        const data = await response.json();
        if (active) setFeaturedProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        if (active) setProductError(error.message);
      } finally {
        if (active) setLoadingProducts(false);
      }
    }

    loadCategories();
    loadFeaturedProducts();

    return () => {
      active = false;
    };
  }, []);

  const heroProduct = useMemo(() => featuredProducts[0] || null, [featuredProducts]);

  async function handleBuyNow() {
    if (auth.isGuest) {
      setStatusMessage('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.');
      return;
    }

    if (auth.isSeller) {
      setStatusMessage('Tài khoản SELLER không thể mua hàng bằng giỏ hàng khách hàng.');
      return;
    }

    if (!heroProduct) {
      navigate('/product-list');
      return;
    }

    try {
      await addProduct(heroProduct, 1);
      setStatusMessage('');
      await openCart();
    } catch (error) {
      setStatusMessage(error.message);
    }
  }

  function handlePromotionClick() {
    featuredRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function handleAddToCart(product) {
    if (auth.isGuest) {
      setStatusMessage('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.');
      return;
    }

    if (auth.isSeller) {
      setStatusMessage('Tài khoản SELLER không thể thêm sản phẩm vào giỏ hàng khách hàng.');
      return;
    }

    try {
      await addProduct(product, 1);
      setStatusMessage('');
    } catch (error) {
      setStatusMessage(error.message);
    }
  }

  function openProduct(product) {
    navigate(`/product-detail/id=${product.id}`);
  }

  return (
    <PageShell title="Catalog" compact hideHeader fullBleed>
      <style>{`
        .landing-page { background: #f8fafc; color: #111827; width: 100%; min-height: calc(100vh - 64px); display: flex; flex-direction: column; }
        .landing-hero { min-height: 520px; display: grid; align-items: center; background: #eff6ff; }
        .landing-hero-inner { max-width: var(--app-content-max); width: 100%; margin: 0 auto; padding: clamp(42px, 7vw, 72px) var(--app-page-pad); display: grid; grid-template-columns: minmax(0, 1fr) minmax(320px, 460px); gap: 44px; align-items: center; }
        .landing-copy { display: grid; gap: 20px; }
        .landing-eyebrow { width: fit-content; padding: 6px 10px; border-radius: 999px; background: #dbeafe; color: #1d4ed8; font-size: 13px; font-weight: 900; }
        .landing-copy h1 { margin: 0; color: #0f172a; font-size: 52px; line-height: 1.05; letter-spacing: 0; }
        .landing-copy p { max-width: 620px; margin: 0; color: #475569; font-size: 18px; line-height: 1.65; }
        .landing-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .landing-hero-card { background: #ffffff; border: 1px solid #dbeafe; border-radius: 8px; overflow: hidden; box-shadow: 0 20px 45px rgba(15, 23, 42, .12); }
        .landing-hero-media { aspect-ratio: 4 / 3; background: #f8fafc; }
        .landing-hero-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .landing-hero-info { padding: 18px; display: grid; gap: 8px; }
        .landing-hero-info h2 { margin: 0; font-size: 20px; color: #0f172a; }
        .landing-section { width: 100%; max-width: var(--app-content-max); margin: 0 auto; padding: var(--app-section-gap) var(--app-page-pad); }
        .landing-section-head { display: flex; justify-content: space-between; gap: 20px; align-items: end; margin-bottom: 22px; flex-wrap: wrap; }
        .landing-section-head h2 { margin: 0 0 6px; color: #0f172a; font-size: 30px; letter-spacing: 0; }
        .landing-section-head p { margin: 0; color: #64748b; }
        .landing-category-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px; }
        .landing-category-card { display: grid; gap: 8px; padding: 18px; min-height: 112px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer; text-align: left; }
        .landing-category-card:hover { border-color: #93c5fd; box-shadow: 0 10px 24px rgba(15, 23, 42, .08); }
        .landing-category-card strong { color: #0f172a; font-size: 18px; }
        .landing-category-card span { color: #64748b; font-size: 14px; }
        .landing-product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr)); gap: 24px; align-items: stretch; }
        .landing-product-card { display: flex; flex-direction: column; min-height: 100%; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
        .landing-product-card:hover { border-color: #93c5fd; box-shadow: 0 12px 24px rgba(15, 23, 42, .08); }
        .landing-product-media { aspect-ratio: 4 / 3; background: #f8fafc; position: relative; overflow: hidden; }
        .landing-product-media img { width: 100%; height: 100%; object-fit: contain; display: block; transition: transform 180ms ease; }
        .landing-product-card:hover img { transform: scale(1.04); }
        .landing-product-body { padding: 16px; display: grid; grid-template-rows: auto auto 1fr auto; gap: 10px; flex: 1; }
        .landing-product-body h3 { min-height: 44px; margin: 0; color: #111827; font-size: 16px; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .landing-price { margin: 0; color: #2563eb; font-weight: 900; font-size: 18px; }
        .landing-product-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: auto; }
        .landing-footer { width: 100%; margin-top: auto; background: #111827; color: #d1d5db; padding: 46px var(--app-page-pad) 20px; }
        .landing-footer-inner { max-width: var(--app-content-max); margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 32px; }
        .landing-footer h2, .landing-footer h3 { margin: 0 0 12px; color: #ffffff; }
        .landing-footer p, .landing-footer li { line-height: 1.6; }
        .landing-footer ul { padding: 0; margin: 0; list-style: none; display: grid; gap: 8px; }
        .landing-newsletter { display: flex; gap: 0; }
        .landing-newsletter input { min-width: 0; flex: 1; padding: 10px 12px; border: 0; border-radius: 6px 0 0 6px; }
        .landing-newsletter button { border: 0; padding: 10px 16px; border-radius: 0 6px 6px 0; background: #2563eb; color: #ffffff; font-weight: 800; cursor: pointer; }
        .landing-footer-bottom { max-width: var(--app-content-max); margin: 32px auto 0; padding-top: 18px; border-top: 1px solid #374151; font-size: 14px; text-align: center; }
        @media (max-width: 820px) {
          .landing-hero-inner { grid-template-columns: 1fr; padding: 38px 16px; }
          .landing-copy h1 { font-size: 38px; }
          .landing-product-actions { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="landing-page">
        <section className="landing-hero">
          <div className="landing-hero-inner">
            <div className="landing-copy">
              <span className="landing-eyebrow">Marketplace nhóm 16</span>
              <h1>Mua sắm nhanh, rõ trạng thái, giao hàng dễ theo dõi</h1>
              <p>
                Khám phá danh mục sản phẩm đang có trong catalog, thêm vào giỏ hàng,
                checkout COD và theo dõi đơn hàng trong cùng một giao diện.
              </p>
              <div className="landing-actions">
                <Button type="button" onClick={handleBuyNow} disabled={isCartBusy}>
                  {isCartBusy ? 'Đang xử lý...' : 'Mua ngay'}
                </Button>
                <Button type="button" variant="secondary" onClick={handlePromotionClick}>
                  Xem khuyến mãi
                </Button>
                <Button type="button" variant="ghost" onClick={() => navigate('/product-list')}>
                  Xem tất cả sản phẩm
                </Button>
              </div>
            </div>

            <div className="landing-hero-card">
              <div className="landing-hero-media">
                <img
                  src={heroProduct ? getProductImage(heroProduct) : 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=700&q=80'}
                  alt={heroProduct?.name || 'Sản phẩm nổi bật'}
                />
              </div>
              <div className="landing-hero-info">
                <h2>{heroProduct?.name || 'Catalog sản phẩm'}</h2>
                <p className="landing-price">{heroProduct ? formatPrice(heroProduct.price || heroProduct.unitPrice) : 'Đang tải sản phẩm'}</p>
              </div>
            </div>
          </div>
        </section>

        {statusMessage ? (
          <div className="landing-section">
            <Toast variant="error">
              <div className="ops-stack">
                <span>{statusMessage}</span>
                {auth.isGuest ? (
                  <div className="ops-actions">
                    <Button as={Link} to="/login" variant="secondary">Đăng nhập</Button>
                    <Button as={Link} to="/register" variant="ghost">Đăng ký</Button>
                  </div>
                ) : null}
              </div>
            </Toast>
          </div>
        ) : null}

        <section className="landing-section" id="categories">
          <div className="landing-section-head">
            <div>
              <h2>Danh mục sản phẩm</h2>
              <p>Dữ liệu được tải từ Catalog Service.</p>
            </div>
            <Button variant="ghost" onClick={() => navigate('/product-list')}>Xem sản phẩm</Button>
          </div>

          {categoryError ? <Toast variant="error">{categoryError}</Toast> : null}
          {loadingCategories ? (
            <div className="landing-category-grid">
              {Array.from({ length: 4 }).map((_, index) => <Skeleton className="card" key={index} />)}
            </div>
          ) : null}
          {!loadingCategories && !categories.length ? (
            <EmptyState title="Chưa có danh mục" description="Không tải được danh mục hoặc catalog hiện đang trống." />
          ) : null}
          {!loadingCategories && categories.length ? (
            <div className="landing-category-grid">
              {categories.map((category) => (
                <button
                  className="landing-category-card"
                  key={category.id}
                  type="button"
                  onClick={() => navigate(`/catalogs/${category.id}`)}
                >
                  <strong>{category.product_type || category.name || `Danh mục ${category.id}`}</strong>
                  <span>Xem sản phẩm trong danh mục</span>
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <section className="landing-section" id="featured" ref={featuredRef}>
          <div className="landing-section-head">
            <div>
              <h2>Sản phẩm nổi bật</h2>
              <p>Tải từ endpoint sản phẩm đầu tiên của Catalog Service.</p>
            </div>
          </div>

          {productError ? <Toast variant="error">{productError}</Toast> : null}
          {loadingProducts ? (
            <div className="landing-product-grid">
              {Array.from({ length: 4 }).map((_, index) => <Skeleton className="card" key={index} />)}
            </div>
          ) : null}
          {!loadingProducts && !featuredProducts.length ? (
            <EmptyState
              title="Chưa có sản phẩm nổi bật"
              description="Bạn vẫn có thể mở trang tất cả sản phẩm để kiểm tra dữ liệu catalog."
              action={<Button onClick={() => navigate('/product-list')}>Mở danh sách sản phẩm</Button>}
            />
          ) : null}
          {!loadingProducts && featuredProducts.length ? (
            <div className="landing-product-grid">
              {featuredProducts.map((product) => (
                <article className="landing-product-card" key={product.id}>
                  <div className="landing-product-media">
                    <img src={getProductImage(product)} alt={product.name} />
                  </div>
                  <div className="landing-product-body">
                    <h3>{product.name}</h3>
                    <p className="landing-price">{formatPrice(product.price || product.unitPrice)}</p>
                    <div className="landing-product-actions">
                      <Button type="button" variant="ghost" onClick={() => openProduct(product)}>
                        Xem chi tiết
                      </Button>
                      {auth.isCustomer ? (
                        <Button type="button" onClick={() => handleAddToCart(product)} disabled={isCartBusy}>
                          {isCartBusy ? 'Đang thêm...' : 'Thêm vào giỏ'}
                        </Button>
                      ) : null}
                      {auth.isGuest ? (
                        <Button as={Link} to="/login" variant="secondary">
                          Đăng nhập để mua
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        <footer id="about" className="landing-footer">
          <div className="landing-footer-inner">
            <div>
              <h2>Project Web nhóm 16</h2>
              <p>Một giao diện marketplace tối giản cho catalog, giỏ hàng, đơn hàng, fulfillment và thông báo.</p>
            </div>
            <div>
              <h3>Hỗ trợ khách hàng</h3>
              <ul>
                <li>Chính sách đổi trả</li>
                <li>Chính sách bảo mật</li>
                <li>Hướng dẫn mua hàng</li>
              </ul>
            </div>
            <div>
              <h3>Đăng ký nhận tin</h3>
              <p>Nhận thông tin về sản phẩm và trạng thái đơn hàng mới.</p>
              <div className="landing-newsletter">
                <input type="email" placeholder="Email của bạn..." />
                <button type="button">Gửi</button>
              </div>
            </div>
          </div>
          <div className="landing-footer-bottom">
            &copy; 2026 Project Web nhóm 16. All rights reserved.
          </div>
        </footer>
      </div>
    </PageShell>
  );
};

export default LandingPage;
