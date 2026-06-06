import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageShell from '../shared/PageShell';
import { Button, EmptyState, ProductCard, Skeleton, Toast } from '../shared/designSystem';
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
  const [appliedPriceFrom, setAppliedPriceFrom] = useState(null);
  const [appliedPriceTo, setAppliedPriceTo] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const { addProduct, isBusy: isCartBusy } = useCart();
  const limit = 8;

  useEffect(() => {
    fetchCatalogInfo();
    fetchAllProducts();
  }, [catalogId]);

  useEffect(() => {
    let result = [...allProducts];

    const min = appliedPriceFrom;
    const max = appliedPriceTo;
    if (min !== null && Number.isFinite(min)) {
      result = result.filter((product) => Number(product.price) >= min);
    }
    if (max !== null && Number.isFinite(max)) {
      result = result.filter((product) => Number(product.price) <= max);
    }

    setFilteredProducts(result);
    setPage(1);
  }, [allProducts, appliedPriceFrom, appliedPriceTo]);

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
    setAppliedPriceFrom(null);
    setAppliedPriceTo(null);
  };

  const applyPriceFilter = () => {
    setAppliedPriceFrom(priceFrom === '' ? null : Number(priceFrom));
    setAppliedPriceTo(priceTo === '' ? null : Number(priceTo));
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
      <div className="w-full mx-auto py-6">
        {statusMessage ? <Toast variant="error">{statusMessage}</Toast> : null}

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <aside className="w-full lg:w-[240px] shrink-0">
            <div className="flex items-center gap-2 text-base font-bold text-slate-900 uppercase mb-4">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 15 15"><g><path d="M15 1.1h-15l5.5 6.4v5l4-2.9v-2.1z"></path></g></svg>
              Bộ lọc tìm kiếm
            </div>
            
            <div className="mb-6 pb-6 border-b border-slate-200">
              <h4 className="m-0 mb-3 text-sm font-medium text-slate-900">Khoảng Giá</h4>
              <div className="flex items-center justify-between gap-2 mb-3">
                <input 
                  type="number" 
                  min="0" 
                  placeholder="Từ" 
                  value={priceFrom} 
                  onChange={(event) => setPriceFrom(event.target.value)} 
                  className="w-full h-8 px-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-shadow"
                />
                <span className="text-slate-400 text-sm">-</span>
                <input 
                  type="number" 
                  min="0" 
                  placeholder="Đến" 
                  value={priceTo} 
                  onChange={(event) => setPriceTo(event.target.value)} 
                  className="w-full h-8 px-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-shadow"
                />
              </div>
              <button 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white border-none py-2 rounded text-sm font-medium uppercase transition-colors cursor-pointer"
                onClick={applyPriceFilter}
              >
                Áp dụng
              </button>
            </div>

            {hasFilters ? (
              <button 
                className="w-full border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2 rounded text-sm font-medium uppercase transition-colors cursor-pointer"
                onClick={clearFilters}
              >
                Xóa tất cả
              </button>
            ) : null}
          </aside>

          <main className="flex-1 min-w-0">
            {catalog && (
               <div className="text-base text-slate-600 mb-4">
                 Sản phẩm trong danh mục '<strong className="text-slate-900 font-semibold">{catalog.product_type}</strong>'
               </div>
            )}

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-[280px] rounded-xl" />)}
              </div>
            ) : (
              <>
                {filteredProducts.length === 0 ? (
                  <EmptyState
                    title="Không có sản phẩm phù hợp"
                    description="Không có sản phẩm nào phù hợp với mức giá bạn chọn."
                    action={<Button variant="ghost" onClick={clearFilters}>Xóa bộ lọc để xem lại</Button>}
                  />
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
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
                  <div className="flex justify-center items-center gap-4 mt-10">
                    <button 
                      className="text-xl text-slate-600 hover:text-brand-600 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors bg-transparent border-none cursor-pointer"
                      disabled={page === 1} 
                      onClick={() => setPage((value) => Math.max(1, value - 1))}
                    >
                      &lt;
                    </button>
                    <span className="text-sm text-slate-600"><strong className="text-slate-900">{page}</strong> / {totalPages}</span>
                    <button 
                      className="text-xl text-slate-600 hover:text-brand-600 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors bg-transparent border-none cursor-pointer"
                      disabled={page >= totalPages} 
                      onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                    >
                      &gt;
                    </button>
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
