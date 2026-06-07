import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';
import { useCart } from './cart/CartProvider';
import { Button, Toast } from './shared/designSystem';
import PageShell from './shared/PageShell';
import CategorySection from './customer/CategorySection';
import CustomerFooter from './customer/CustomerFooter';
import FeaturedProducts from './customer/FeaturedProducts';
import HeroSection from './customer/HeroSection';
import { API_BASES } from '../utils/constants';

const CATALOG_BASE_URL = API_BASES.catalog;

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

  useEffect(() => {
    if (window.location.hash === '#categories') {
      requestAnimationFrame(() => {
        document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
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
      navigate('/products');
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

  function openCategory(category) {
    navigate(`/products?catalogId=${category.id}`);
  }

  return (
    <PageShell title="Catalog" compact hideHeader fullBleed>
      <style>{`
        .landing-page { background: #f8fafc; color: #111827; width: 100%; min-height: calc(100vh - 64px); display: flex; flex-direction: column; font-family: "Inter", "Segoe UI", Arial, sans-serif; }
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
        .landing-category-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 18px; }
        .landing-category-card { --tone: #2563eb; --tone-soft: #dbeafe; position: relative; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 14px; min-height: 116px; padding: 18px; overflow: hidden; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border: 1px solid #e2e8f0; border-radius: 18px; cursor: pointer; text-align: left; box-shadow: 0 12px 30px rgba(15, 23, 42, .06); transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease; }
        .landing-category-card::before { content: ""; position: absolute; inset: auto -34px -44px auto; width: 128px; height: 128px; border-radius: 999px; background: var(--tone-soft); opacity: .8; transition: transform 180ms ease, opacity 180ms ease; }
        .landing-category-card:hover { transform: translateY(-4px); border-color: color-mix(in srgb, var(--tone) 45%, #ffffff); box-shadow: 0 20px 38px rgba(15, 23, 42, .12); }
        .landing-category-card:hover::before { transform: scale(1.08); opacity: 1; }
        .landing-category-icon { position: relative; z-index: 1; width: 56px; height: 56px; display: inline-grid; place-items: center; border-radius: 16px; color: var(--tone); background: var(--tone-soft); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .75); }
        .landing-category-content { position: relative; z-index: 1; display: grid; gap: 5px; min-width: 0; }
        .landing-category-content strong { color: #0f172a; font-size: 17px; line-height: 1.25; }
        .landing-category-content small { color: #64748b; font-size: 13px; font-weight: 700; }
        .landing-category-arrow { position: relative; z-index: 1; width: 34px; height: 34px; display: inline-grid; place-items: center; border-radius: 999px; color: var(--tone); background: #ffffff; font-size: 20px; font-weight: 900; box-shadow: 0 8px 20px rgba(15, 23, 42, .08); transition: transform 180ms ease; }
        .landing-category-card:hover .landing-category-arrow { transform: translateX(3px); }
        .landing-category-skeleton { min-height: 116px; border-radius: 18px; }
        .landing-category-card.tone-blue { --tone: #2563eb; --tone-soft: #dbeafe; }
        .landing-category-card.tone-pink { --tone: #db2777; --tone-soft: #fce7f3; }
        .landing-category-card.tone-cyan { --tone: #0891b2; --tone-soft: #cffafe; }
        .landing-category-card.tone-amber { --tone: #d97706; --tone-soft: #fef3c7; }
        .landing-category-card.tone-indigo { --tone: #4f46e5; --tone-soft: #e0e7ff; }
        .landing-category-card.tone-emerald { --tone: #059669; --tone-soft: #d1fae5; }
        .landing-category-card.tone-violet { --tone: #7c3aed; --tone-soft: #ede9fe; }
        .landing-category-card.tone-rose { --tone: #e11d48; --tone-soft: #ffe4e6; }
        .landing-category-card.tone-slate { --tone: #475569; --tone-soft: #e2e8f0; }
        .landing-category-card.tone-red { --tone: #dc2626; --tone-soft: #fee2e2; }
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
        .landing-footer a { color: #dbeafe; text-decoration: none; }
        .landing-footer a:hover { color: #ffffff; text-decoration: underline; }
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
        <HeroSection
          heroProduct={heroProduct}
          isCartBusy={isCartBusy}
          onBuyNow={handleBuyNow}
          onPromotionClick={handlePromotionClick}
          onBrowseProducts={() => navigate('/products')}
        />

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

        <CategorySection
          categories={categories}
          error={categoryError}
          loading={loadingCategories}
          onBrowseProducts={() => navigate('/products')}
          onOpenCategory={openCategory}
        />

        <FeaturedProducts
          auth={auth}
          error={productError}
          featuredRef={featuredRef}
          isCartBusy={isCartBusy}
          loading={loadingProducts}
          products={featuredProducts}
          onAddToCart={handleAddToCart}
          onBrowseProducts={() => navigate('/products')}
          onOpenProduct={openProduct}
        />

        <CustomerFooter />
      </div>
    </PageShell>
  );
};

export default LandingPage;
