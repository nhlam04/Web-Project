import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, EmptyState, ErrorState, Skeleton, Toast } from '../../components/shared/designSystem';
import { useAuth } from '../../components/auth/AuthProvider';
import { catalogService } from '../../services/catalogService';
import { formatPrice } from '../../utils/formatters';

export default function SellerProductsPage() {
  const auth = useAuth();
  const sellerId = auth.user?.id || '';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message] = useState('');

  const loadProducts = useCallback(async () => {
    if (!sellerId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = await catalogService.listSellerProducts(sellerId);
      setProducts(Array.isArray(payload) ? payload : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return (
    <div className="ops-stack">
      <header className="ops-header">
        <div>
          <h1>Sản phẩm của seller</h1>
          <p>{sellerId ? `Seller ID: ${sellerId}` : 'Cần tài khoản SELLER để quản lý sản phẩm.'}</p>
        </div>
        <div className="ops-actions">
          <Button as={Link} to="/seller/products/new">Tạo sản phẩm</Button>
          <Button variant="secondary" onClick={loadProducts} disabled={loading}>Tải lại</Button>
        </div>
      </header>

      {message ? <Toast>{message}</Toast> : null}
      {error ? <ErrorState title="Không thể tải sản phẩm seller" description={error} /> : null}
      {loading ? <Skeleton className="card" /> : null}

      {!loading && !products.length ? (
        <EmptyState
          title="Chưa có sản phẩm"
          description="Tạo sản phẩm đầu tiên để catalog gắn shopId với tài khoản seller hiện tại."
          action={<Button as={Link} to="/seller/products/new">Tạo sản phẩm</Button>}
        />
      ) : null}

      {!loading && products.length ? (
        <Card>
          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên sản phẩm</th>
                  <th>Giá</th>
                  <th>Tồn kho</th>
                  <th>Đã bán</th>
                  <th>Danh mục</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td>
                      <strong>{product.name}</strong>
                      <div className="ops-muted ops-small">{product.shortDesc}</div>
                    </td>
                    <td>{formatPrice(product.price)}</td>
                    <td>{product.quantity}</td>
                    <td>{product.sold || 0}</td>
                    <td>{product.catalog_id}</td>
                    <td>
                      <div className="ops-actions">
                        <Button as={Link} variant="ghost" to={`/products/id=${product.id}`}>Xem</Button>
                        <Button as={Link} variant="secondary" to={`/seller/products/${product.id}/edit`}>Sửa</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
