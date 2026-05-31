import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../shared/PageShell';
import { Button, EmptyState, Input, ProductCard, Skeleton, Toast } from '../shared/designSystem';
import { useCart } from '../cart/CartProvider';

const CATALOG_BASE_URL = process.env.REACT_APP_CATALOG_URL || 'http://127.0.0.1:8000';

const ProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const { addProduct, isBusy: isCartBusy } = useCart();
  const limit = 8;

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const skip = (page - 1) * limit;
      const response = await fetch(`${CATALOG_BASE_URL}/api/v1/products/?skip=${skip}&limit=${limit}`);
      if (!response.ok) throw new Error('Không thể tải dữ liệu từ Catalog Service');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      setStatusMessage('Không thể tải sản phẩm.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
      title="Tất cả sản phẩm"
      subtitle="Duyệt sản phẩm trên toàn bộ catalog."
      actions={[{ label: 'Catalog', to: '/' }, { label: 'Đơn hàng', to: '/orders' }]}
      context={(
        <div className="ops-grid">
          <div className="ops-kpi">
            <span className="ops-muted">Đã tải</span>
            <strong>{products.length}</strong>
          </div>
          <div className="ops-kpi">
            <span className="ops-muted">Phù hợp</span>
            <strong>{filteredProducts.length}</strong>
          </div>
        </div>
      )}
    >
      <style>{`
        .list-container { width: 100%; margin: 0 auto; padding: 18px 0 40px; }
        .list-header { display: flex; justify-content: space-between; align-items: end; margin-bottom: 22px; flex-wrap: wrap; gap: 16px; }
        .list-header h2 { font-size: 24px; color: #111827; margin: 0; }
        .search-field { width: min(100%, 320px); }
        .pagination { display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 32px; }
      `}</style>

      <div className="list-container">
        <div className="list-header">
          <h2>Danh sách sản phẩm</h2>
          <Input
            className="search-field"
            label="Tìm kiếm"
            type="text"
            placeholder="Tìm kiếm theo tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {statusMessage ? <Toast>{statusMessage}</Toast> : null}

        {loading ? (
          <div className="ds-product-grid">
            {Array.from({ length: 4 }).map((_, index) => <Skeleton className="card" key={index} />)}
          </div>
        ) : (
          <>
            {filteredProducts.length === 0 ? (
              <EmptyState title="Không tìm thấy sản phẩm" description="Thử thay đổi từ khóa tìm kiếm hoặc quay lại trang đầu tiên." />
            ) : (
              <div className="ds-product-grid">
                {filteredProducts.map((product) => (
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

            <div className="pagination">
              <Button
                variant="ghost"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Trang trước
              </Button>
              <span style={{ padding: '8px 16px', fontWeight: 'bold' }}>Trang {page}</span>
              <Button
                variant="ghost"
                onClick={() => setPage(page + 1)}
                disabled={products.length < limit}
              >
                Trang sau
              </Button>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
};

export default ProductList;
