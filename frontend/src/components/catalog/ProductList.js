import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import PageShell from '../shared/PageShell';
import { Button, EmptyState, Input, ProductCard, Select, Skeleton, Toast } from '../shared/designSystem';
import { useCart } from '../cart/CartProvider';
import { API_BASES } from '../../utils/constants';

const CATALOG_BASE_URL = API_BASES.catalog || 'http://127.0.0.1:8000';
const FALLBACK_BRANDS = ['Asus', 'Dell', 'HP', 'Lenovo', 'Apple', 'Acer', 'MSI'];
const FALLBACK_LOCATIONS = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng'];

function uniqueValues(products, key, fallback) {
  const values = products.map((product) => product[key]).filter(Boolean);
  return values.length ? Array.from(new Set(values)).sort() : fallback;
}

const ProductList = () => {
  const navigate = useNavigate();
  const { catalogId: routeCatalogId } = useParams();
  const [searchParams] = useSearchParams();
  const initialCatalogId = routeCatalogId || searchParams.get('catalogId') || '';
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCatalogId, setSelectedCatalogId] = useState(initialCatalogId);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const { addProduct, isBusy: isCartBusy } = useCart();
  const limit = 8;

  useEffect(() => {
    if (routeCatalogId) {
      setSelectedCatalogId(routeCatalogId);
      navigate(`/products?catalogId=${routeCatalogId}`, { replace: true });
      return;
    }
    setSelectedCatalogId(searchParams.get('catalogId') || '');
  }, [navigate, routeCatalogId, searchParams]);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setStatusMessage('');
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          fetch(`${CATALOG_BASE_URL}/api/v1/products/?skip=0&limit=200`),
          fetch(`${CATALOG_BASE_URL}/api/v1/catalogs/`),
        ]);
        if (!productsResponse.ok) throw new Error('Không thể tải dữ liệu sản phẩm từ Catalog Service');
        if (!categoriesResponse.ok) throw new Error('Không thể tải danh mục từ Catalog Service');
        const [productData, categoryData] = await Promise.all([
          productsResponse.json(),
          categoriesResponse.json(),
        ]);
        if (!active) return;
        setProducts(Array.isArray(productData) ? productData : []);
        setCategories(Array.isArray(categoryData) ? categoryData : []);
      } catch (error) {
        if (active) setStatusMessage(error.message || 'Không thể tải sản phẩm.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const availableBrands = useMemo(() => uniqueValues(products, 'brand', FALLBACK_BRANDS), [products]);
  const availableLocations = useMemo(() => uniqueValues(products, 'location', FALLBACK_LOCATIONS), [products]);

  const filteredProducts = useMemo(() => {
    const min = priceFrom === '' ? null : Number(priceFrom);
    const max = priceTo === '' ? null : Number(priceTo);
    const keyword = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const productName = String(product.name || '').toLowerCase();
      const productPrice = Number(product.price || product.unitPrice || 0);
      const matchesSearch = !keyword || productName.includes(keyword);
      const matchesCatalog = !selectedCatalogId || String(product.catalog_id) === String(selectedCatalogId);
      const matchesBrand = !selectedBrands.length || selectedBrands.includes(product.brand);
      const matchesLocation = !selectedLocations.length || selectedLocations.includes(product.location);
      const matchesMin = min === null || !Number.isFinite(min) || productPrice >= min;
      const matchesMax = max === null || !Number.isFinite(max) || productPrice <= max;
      return matchesSearch && matchesCatalog && matchesBrand && matchesLocation && matchesMin && matchesMax;
    });
  }, [priceFrom, priceTo, products, searchTerm, selectedBrands, selectedCatalogId, selectedLocations]);

  useEffect(() => {
    setPage(1);
  }, [filteredProducts.length]);

  const selectedCategory = categories.find((category) => String(category.id) === String(selectedCatalogId));
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / limit));
  const startIndex = (page - 1) * limit;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + limit);
  const hasFilters = Boolean(searchTerm || selectedCatalogId || selectedBrands.length || selectedLocations.length || priceFrom || priceTo);

  function setCategoryFilter(value) {
    setSelectedCatalogId(value);
    navigate(value ? `/products?catalogId=${value}` : '/products', { replace: true });
  }

  function toggleBrand(brand) {
    setSelectedBrands((current) => (
      current.includes(brand) ? current.filter((item) => item !== brand) : [...current, brand]
    ));
  }

  function toggleLocation(location) {
    setSelectedLocations((current) => (
      current.includes(location) ? current.filter((item) => item !== location) : [...current, location]
    ));
  }

  function clearFilters() {
    setSearchTerm('');
    setSelectedCatalogId('');
    setSelectedBrands([]);
    setSelectedLocations([]);
    setPriceFrom('');
    setPriceTo('');
    navigate('/products', { replace: true });
  }

  const handleAddToCart = async (event, product) => {
    event.stopPropagation();
    try {
      await addProduct(product, 1);
      setStatusMessage('');
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  return (
    <PageShell
      title="Sản phẩm"
      subtitle={selectedCategory ? `Danh mục: ${selectedCategory.product_type || selectedCategory.name}` : 'Tìm kiếm và lọc sản phẩm trên toàn bộ catalog.'}
    >
      <style>{`
        .product-page { width: 100%; margin: 0 auto; padding: 18px 0 40px; }
        .product-head { display: flex; justify-content: space-between; align-items: end; gap: 16px; margin-bottom: 22px; flex-wrap: wrap; }
        .product-head h2 { font-size: 24px; color: #111827; margin: 0; }
        .product-search { width: min(100%, 360px); }
        .product-layout { display: flex; gap: 30px; align-items: flex-start; }
        .product-filter { width: 280px; flex-shrink: 0; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; }
        .filter-section { margin-bottom: 24px; }
        .filter-section h4 { margin: 0 0 14px; font-size: 16px; color: #111827; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px; }
        .filter-price-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .filter-item { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; color: #4b5563; font-size: 14px; cursor: pointer; }
        .filter-item input { width: 16px; height: 16px; accent-color: #4f46e5; cursor: pointer; }
        .product-main { flex: 1; min-width: 0; }
        .filter-stats { margin-bottom: 15px; font-size: 14px; color: #6b7280; }
        .pagination { display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 32px; }
        @media (max-width: 820px) {
          .product-layout { flex-direction: column; }
          .product-filter { width: 100%; }
        }
      `}</style>

      <div className="product-page">
        <div className="product-head">
          <h2>Danh sách sản phẩm</h2>
          <Input
            className="product-search"
            label="Tìm kiếm"
            type="text"
            placeholder="Tìm kiếm theo tên..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        {statusMessage ? <Toast variant="error">{statusMessage}</Toast> : null}

        <div className="product-layout">
          <aside className="product-filter">
            <div className="filter-section">
              <h4>Danh mục</h4>
              <Select label="Chọn danh mục" value={selectedCatalogId} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="">Tất cả danh mục</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.product_type || category.name || `Danh mục ${category.id}`}
                  </option>
                ))}
              </Select>
            </div>

            <div className="filter-section">
              <h4>Mức giá</h4>
              <div className="filter-price-grid">
                <Input label="Từ" type="number" min="0" placeholder="0" value={priceFrom} onChange={(event) => setPriceFrom(event.target.value)} />
                <Input label="Đến" type="number" min="0" placeholder="5000000" value={priceTo} onChange={(event) => setPriceTo(event.target.value)} />
              </div>
            </div>

            <div className="filter-section">
              <h4>Thương hiệu</h4>
              {availableBrands.map((brand) => (
                <label key={brand} className="filter-item">
                  <input type="checkbox" checked={selectedBrands.includes(brand)} onChange={() => toggleBrand(brand)} />
                  {brand}
                </label>
              ))}
            </div>

            <div className="filter-section">
              <h4>Nơi bán</h4>
              {availableLocations.map((location) => (
                <label key={location} className="filter-item">
                  <input type="checkbox" checked={selectedLocations.includes(location)} onChange={() => toggleLocation(location)} />
                  {location}
                </label>
              ))}
            </div>

            {hasFilters ? (
              <Button variant="ghost" onClick={clearFilters} style={{ width: '100%' }}>
                Xóa tất cả bộ lọc
              </Button>
            ) : null}
          </aside>

          <main className="product-main">
            {loading ? (
              <div className="ds-product-grid">
                {Array.from({ length: 4 }).map((_, index) => <Skeleton className="card" key={index} />)}
              </div>
            ) : (
              <>
                <div className="filter-stats">
                  Hiển thị <strong>{currentProducts.length}</strong> trên tổng số <strong>{filteredProducts.length}</strong> sản phẩm phù hợp.
                </div>

                {filteredProducts.length === 0 ? (
                  <EmptyState
                    title="Không có sản phẩm phù hợp"
                    description="Thử thay đổi từ khóa tìm kiếm hoặc nới rộng bộ lọc giá/danh mục."
                    action={<Button variant="ghost" onClick={clearFilters}>Xóa bộ lọc để xem lại</Button>}
                  />
                ) : (
                  <div className="ds-product-grid">
                    {currentProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        busy={isCartBusy}
                        onOpen={() => navigate(`/product-detail/id=${product.id}`)}
                        onAddToCart={handleAddToCart}
                      />
                    ))}
                  </div>
                )}

                {totalPages > 1 ? (
                  <div className="pagination">
                    <Button variant="ghost" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                      Trang trước
                    </Button>
                    <span style={{ padding: '8px 16px', fontWeight: 'bold' }}>Trang {page} / {totalPages}</span>
                    <Button variant="ghost" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
                      Trang sau
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </main>
        </div>
      </div>
    </PageShell>
  );
};

export default ProductList;
