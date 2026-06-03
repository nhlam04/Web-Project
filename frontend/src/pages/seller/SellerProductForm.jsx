import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Card, ErrorState, Input, Select, Skeleton, Toast } from '../../components/shared/designSystem';
import { useAuth } from '../../components/auth/AuthProvider';
import { catalogService } from '../../services/catalogService';

const initialForm = {
  name: '',
  price: '',
  shortDesc: '',
  detailDesc: '',
  quantity: '',
  images: '',
  catalog_id: '',
};

function normalizeImages(value) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function productToForm(product) {
  const images = Array.isArray(product.images)
    ? product.images.join('\n')
    : typeof product.images === 'string'
      ? product.images
      : '';
  const detailDesc = typeof product.detailDesc === 'string'
    ? product.detailDesc
    : JSON.stringify(product.detailDesc || {}, null, 2);

  return {
    name: product.name || '',
    price: String(product.price ?? ''),
    shortDesc: product.shortDesc || '',
    detailDesc,
    quantity: String(product.quantity ?? ''),
    images,
    catalog_id: String(product.catalog_id ?? ''),
  };
}

export default function SellerProductForm() {
  const { productId } = useParams();
  const isEdit = Boolean(productId);
  const auth = useAuth();
  const sellerId = auth.user?.id || '';
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    catalogService.listCategories()
      .then((payload) => setCategories(Array.isArray(payload) ? payload : []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!isEdit) return;

    let active = true;
    setLoading(true);
    setError('');
    catalogService.getProduct(productId)
      .then((product) => {
        if (!active) return;
        if (String(product.shopId) !== String(sellerId)) {
          setError('Bạn không có quyền sửa sản phẩm của seller khác.');
          return;
        }
        setForm(productToForm(product));
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isEdit, productId, sellerId]);

  const canSubmit = useMemo(() => (
    sellerId &&
    form.name.trim() &&
    Number(form.price) > 0 &&
    form.shortDesc.trim() &&
    form.detailDesc.trim() &&
    Number(form.quantity) >= 0 &&
    Number(form.catalog_id) > 0
  ), [form, sellerId]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function buildPayload() {
    let detailDesc;
    try {
      detailDesc = JSON.parse(form.detailDesc);
    } catch (_error) {
      detailDesc = form.detailDesc;
    }

    return {
      name: form.name.trim(),
      price: Number(form.price),
      shortDesc: form.shortDesc.trim(),
      detailDesc,
      quantity: Number(form.quantity),
      images: normalizeImages(form.images),
      catalog_id: Number(form.catalog_id),
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) {
      setError('Vui lòng nhập đầy đủ thông tin sản phẩm hợp lệ.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload = buildPayload();
      if (isEdit) {
        await catalogService.updateSellerProduct(sellerId, productId, payload);
        setMessage('Đã cập nhật sản phẩm.');
      } else {
        const created = await catalogService.createSellerProduct(sellerId, payload);
        setMessage('Đã tạo sản phẩm.');
        navigate(`/seller/products/${created.id}/edit`, { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ops-stack">
      <header className="ops-header">
        <div>
          <h1>{isEdit ? 'Sửa sản phẩm' : 'Tạo sản phẩm'}</h1>
          <p>{sellerId ? `Seller ID: ${sellerId}` : 'Cần tài khoản SELLER để lưu sản phẩm.'}</p>
        </div>
        <Button as={Link} variant="secondary" to="/seller/products">Danh sách sản phẩm</Button>
      </header>

      {loading ? <Skeleton className="card" /> : null}
      {message ? <Toast>{message}</Toast> : null}
      {error ? <ErrorState title="Không thể lưu sản phẩm" description={error} /> : null}

      {!loading ? (
        <Card>
          <form className="ops-stack" onSubmit={handleSubmit}>
            <div className="ops-grid">
              <Input label="Tên sản phẩm" value={form.name} onChange={(event) => updateField('name', event.target.value)} />
              <Input label="Giá" type="number" min="1" value={form.price} onChange={(event) => updateField('price', event.target.value)} />
              <Input label="Tồn kho" type="number" min="0" value={form.quantity} onChange={(event) => updateField('quantity', event.target.value)} />
              <Select label="Danh mục" value={form.catalog_id} onChange={(event) => updateField('catalog_id', event.target.value)}>
                <option value="">Chọn danh mục</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.product_type || category.name || `Danh mục ${category.id}`}
                  </option>
                ))}
              </Select>
            </div>

            <label className="ops-label">
              Mô tả ngắn
              <textarea className="ops-input" rows="3" value={form.shortDesc} onChange={(event) => updateField('shortDesc', event.target.value)} />
            </label>

            <label className="ops-label">
              Mô tả chi tiết
              <textarea className="ops-input" rows="6" value={form.detailDesc} onChange={(event) => updateField('detailDesc', event.target.value)} />
            </label>

            <label className="ops-label">
              Ảnh sản phẩm, mỗi URL một dòng
              <textarea className="ops-input" rows="4" value={form.images} onChange={(event) => updateField('images', event.target.value)} />
            </label>

            <div className="ops-actions">
              <Button type="submit" disabled={!canSubmit || saving}>{saving ? 'Đang lưu...' : (isEdit ? 'Cập nhật sản phẩm' : 'Tạo sản phẩm')}</Button>
              <Button as={Link} variant="ghost" to="/seller/products">Hủy</Button>
            </div>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
