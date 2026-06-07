import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageShell from '../shared/PageShell';
import { Button, EmptyState, Input, ProductCard, Skeleton, Toast } from '../shared/designSystem';
import { useCart } from '../cart/CartProvider';
import { API_BASES } from '../../utils/constants';

const CATALOG_BASE_URL = API_BASES.catalog || 'http://127.0.0.1:8000';


const CatalogProductList = () => {
  const { catalogId } = useParams();
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const { addProduct, isBusy: isCartBusy } = useCart();
  const limit = 8;

  useEffect(() => {
    fetchCatalogInfo();
    fetchAllProducts();
  }, [catalogId]);

  useEffect(() => {
    let result = [...allProducts];

    const min = priceFrom === '' ? null : Number(priceFrom);
    const max = priceTo === '' ? null : Number(priceTo);
    if (min !== null && Number.isFinite(min)) {
      result = result.filter((product) => Number(product.price) >= min);
    }
    if (max !== null && Number.isFinite(max)) {
      result = result.filter((product) => Number(product.price) <= max);
    }

    setFilteredProducts(result);
    setPage(1);
  }, [allProducts, priceFrom, priceTo]);

  const fetchCatalogInfo = async () => {
    try {
      const response = await fetch(`${CATALOG_BASE_URL}/api/v1/catalogs/${catalogId}`);
      if (response.ok) {
        const data = await response.json();
        setCatalog(data);
      }
    } catch (_error) {
      setStatusMessage('Không thể tải thông tin danh mục.');
    }
  };

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${CATALOG_BASE_URL}/api/v1/catalogs/${catalogId}/products`);
      if (!response.ok) throw new Error('Không thể tải dữ liệu từ Catalog Service');
      const data = await response.json();
      setAllProducts(data);
      setFilteredProducts(data);
    } catch (_error) {
      setStatusMessage('Không thể tải sản phẩm.');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setPriceFrom('');
    setPriceTo('');
  };

  const handleAddToCart = async (event, product) => {
    event.stopPropagation();
    try {
      await addProduct(product, 1);
      setStatusMessage('');
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const totalPages = Math.ceil(filteredProducts.length / limit);
  const startIndex = (page - 1) * limit;
  const currentDisplayedProducts = filteredProducts.slice(startIndex, startIndex + limit);
  const hasFilters = priceFrom || priceTo;

  return (
    <PageShell
      title={catalog ? catalog.product_type : 'Danh mục sản phẩm'}
      subtitle={`${filteredProducts.length} sản phẩm phù hợp`}
    >
      <style>{`
        .page-container { width: 100%; margin: 0 auto; padding: 18px 0 40px; }
        .list-header { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; }
        .back-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: #4b5563; transition: color 0.2s; padding: 0; }
        .back-btn:hover { color: #4f46e5; }
        .list-header h2 { font-size: 24px; color: #111827; margin: 0; }
        .layout-wrapper { display: flex; gap: 30px; align-items: flex-start; }
        .sidebar { width: 280px; flex-shrink: 0; background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; }
        .filter-section { margin-bottom: 25px; }
        .filter-section h4 { margin: 0 0 15px 0; font-size: 16px; color: #111827; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px; }
        .filter-price-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .filter-item { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; cursor: pointer; color: #4b5563; font-size: 14px; }
        .filter-item input { cursor: pointer; accent-color: #4f46e5; width: 16px; height: 16px; }
        .main-content { flex-grow: 1; min-width: 0; }
        .pagination { display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 32px; }
        .filter-stats { margin-bottom: 15px; font-size: 14px; color: #6b7280; }
        @media (max-width: 768px) { .layout-wrapper { flex-direction: column; } .sidebar { width: 100%; } }
      `}</style>

      <div className="page-container">
        <div className="list-header">
          <button className="back-btn" onClick={() => navigate(-1)} title="Quay lại">
            &larr;
          </button>
          <h2>{catalog ? catalog.product_type : 'Danh mục sản phẩm'}</h2>
        </div>

        {statusMessage ? <Toast>{statusMessage}</Toast> : null}

        <div className="layout-wrapper">
          <aside className="sidebar">
            <div className="filter-section">
              <h4>Mức giá</h4>
              <div className="filter-price-grid">
                <Input
                  label="Từ"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={priceFrom}
                  onChange={(event) => setPriceFrom(event.target.value)}
                />
                <Input
                  label="Đến"
                  type="number"
                  min="0"
                  placeholder="5000000"
                  value={priceTo}
                  onChange={(event) => setPriceTo(event.target.value)}
                />
              </div>
            </div>


            {hasFilters ? (
              <Button variant="ghost" onClick={clearFilters} style={{ width: '100%' }}>
                Xóa tất cả bộ lọc
              </Button>
            ) : null}
          </aside>

          <main className="main-content">
            {loading ? (
              <div className="ds-product-grid">
                {Array.from({ length: 4 }).map((_, index) => <Skeleton className="card" key={index} />)}
              </div>
            ) : (
              <>
                <div className="filter-stats">
                  Hiển thị <strong>{currentDisplayedProducts.length}</strong> trên tổng số{' '}
                  <strong>{filteredProducts.length}</strong> sản phẩm phù hợp.
                </div>

                {filteredProducts.length === 0 ? (
                  <EmptyState
                    title="Không có sản phẩm phù hợp"
                    description="Dữ liệu sản phẩm hiện tại có thể chưa có thương hiệu hoặc nơi bán."
                    action={<Button variant="ghost" onClick={clearFilters}>Xóa bộ lọc để xem lại</Button>}
                  />
                ) : (
                  <div className="ds-product-grid">
                    {currentDisplayedProducts.map((product) => (
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
                    <Button variant="ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>
                      Trang trước
                    </Button>
                    <span style={{ padding: '8px 16px', fontWeight: 'bold' }}>
                      Trang {page} / {totalPages}
                    </span>
                    <Button variant="ghost" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
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

export default CatalogProductList;
