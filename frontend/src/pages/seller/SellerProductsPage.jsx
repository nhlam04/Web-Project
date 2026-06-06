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
    <div className="flex flex-col gap-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 m-0 mb-1">Sản phẩm của seller</h1>
          <p className="text-slate-500 m-0">{sellerId ? `Seller ID: ${sellerId}` : 'Cần tài khoản SELLER để quản lý sản phẩm.'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button as={Link} to="/seller/products/new">Tạo sản phẩm</Button>
          <Button variant="secondary" onClick={loadProducts} disabled={loading}>Tải lại</Button>
        </div>
      </header>

      {message ? <Toast>{message}</Toast> : null}
      {error ? <ErrorState title="Không thể tải sản phẩm seller" description={error} /> : null}
      {loading ? <Skeleton className="h-[400px]" /> : null}

      {!loading && !products.length ? (
        <EmptyState
          title="Chưa có sản phẩm"
          description="Tạo sản phẩm đầu tiên để catalog gắn shopId với tài khoản seller hiện tại."
          action={<Button as={Link} to="/seller/products/new">Tạo sản phẩm</Button>}
        />
      ) : null}

      {!loading && products.length ? (
        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Tên sản phẩm</th>
                <th className="px-4 py-3">Giá</th>
                <th className="px-4 py-3">Tồn kho</th>
                <th className="px-4 py-3">Đã bán</th>
                <th className="px-4 py-3">Danh mục</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-4 text-slate-900">{product.id}</td>
                  <td className="px-4 py-4">
                    <strong className="block text-slate-900 mb-0.5 max-w-[250px] truncate">{product.name}</strong>
                    <div className="text-xs text-slate-500 max-w-[250px] truncate">{product.shortDesc}</div>
                  </td>
                  <td className="px-4 py-4 font-medium text-brand-600">{formatPrice(product.price)}</td>
                  <td className="px-4 py-4 text-slate-700">{product.quantity}</td>
                  <td className="px-4 py-4 text-slate-700">{product.sold || 0}</td>
                  <td className="px-4 py-4 text-slate-700">{product.catalog_id}</td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button as={Link} variant="ghost" to={`/products/id=${product.id}`}>Xem</Button>
                      <Button as={Link} variant="secondary" to={`/seller/products/${product.id}/edit`}>Sửa</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
