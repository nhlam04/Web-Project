import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { formatVnd } from '../../utils/orderingApi';
import { useCart } from '../cart/CartProvider';
import PageShell from '../shared/PageShell';
import { Button, Card } from '../shared/designSystem';
import { useAuth } from '../auth/AuthProvider';
import ProductReviews from '../reviews/ProductReviews';
import { API_BASES } from '../../utils/constants';

const CATALOG_BASE_URL = API_BASES.catalog || 'http://127.0.0.1:8000';

const ProductDetail = () => {
  const { slug } = useParams();
  const productId = slug ? slug.replace('id=', '') : null;
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const { addProduct, isBusy: isCartBusy } = useCart();
  const auth = useAuth();

  useEffect(() => {
    if (productId) {
      fetchProductDetail();
    }
  }, [productId]);

  const fetchProductDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${CATALOG_BASE_URL}/api/v1/products/${productId}`);
      if (!response.ok) throw new Error('Product not found');
      const data = await response.json();

      let parsedImages = [];
      if (Array.isArray(data.images)) {
        parsedImages = data.images;
      } else if (typeof data.images === 'string') {
        try {
          const parsed = JSON.parse(data.images);
          parsedImages = Array.isArray(parsed) ? parsed : [data.images];
        } catch (_err) {
          parsedImages = [data.images];
        }
      }

      data.images = Array.isArray(parsedImages) ? parsedImages : [];

      if (data.images.length > 0) {
        setMainImage(data.images[0]);
      } else {
        setMainImage('https://via.placeholder.com/500?text=No+Image');
      }

      let parsedDesc = data.detailDesc;
      if (typeof parsedDesc === 'string') {
        try {
          parsedDesc = JSON.parse(parsedDesc);
        } catch (_err) {}
      }
      data.detailDesc = parsedDesc;

      setProduct(data);
    } catch (_error) {
      setStatusMessage('Không thể tải chi tiết sản phẩm.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) {
      return;
    }

    try {
      await addProduct(product, quantity);
      setStatusMessage('');
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  if (loading) {
    return (
      <PageShell title="Chi tiết sản phẩm">
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500">Đang tải thông tin sản phẩm...</div>
      </PageShell>
    );
  }

  if (!product) {
    return (
      <PageShell title="Chi tiết sản phẩm">
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500">Không tìm thấy sản phẩm.</div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={product.name}
      subtitle={`Giá: ${formatVnd(Number(product.price))}`}
    >
      <div className="w-full mx-auto py-6">
        {statusMessage ? (
          <div className="mb-6 p-4 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            {statusMessage}
          </div>
        ) : null}

        <div className="flex flex-col md:flex-row gap-8 bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-100 mb-8">
          <div className="w-full md:w-[450px] shrink-0 flex flex-col gap-4">
            <div className="w-full aspect-square relative rounded-xl overflow-hidden bg-slate-50 border border-slate-100 group">
              <img src={mainImage} alt={product.name} className="absolute inset-0 w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110" />
            </div>
            {Array.isArray(product.images) && product.images.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                {product.images?.map((img, index) => (
                  <div
                    key={index}
                    className={`shrink-0 w-20 h-20 relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all snap-start ${mainImage === img ? 'border-brand-600' : 'border-transparent hover:border-slate-300'} bg-slate-50`}
                    onClick={() => setMainImage(img)}
                  >
                    <img src={img} alt={`${product.name} ảnh ${index + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col">
            <h1 className="text-2xl font-bold text-slate-900 leading-tight mb-4">{product.name}</h1>

            <div className="flex items-center gap-4 mb-6 text-sm text-slate-600">
              <div className="flex items-center gap-1 text-amber-400">
                {'★'.repeat(product.StarCount || 5)}{'☆'.repeat(5 - (product.StarCount || 5))}
              </div>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span>{product.totalRates} Đánh giá</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span>Đã bán {product.sold}</span>
            </div>

            <div className="bg-slate-50 p-6 rounded-xl flex items-center gap-2 mb-8 border border-slate-100">
              <span className="text-xl font-medium text-brand-600">₫</span>
              <span className="text-4xl font-bold text-brand-600">{Number(product.price).toLocaleString('vi-VN')}</span>
            </div>

            <p className="text-slate-600 text-base leading-relaxed mb-8 whitespace-pre-wrap">{product.shortDesc}</p>

            {auth.isCustomer ? (
              <div className="flex flex-col gap-8 mt-auto">
                <div className="flex items-center gap-6 text-slate-600">
                  <span className="font-medium">Số Lượng</span>
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm h-11">
                    <button
                      className="w-11 h-full flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50"
                      onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                    >−</button>
                    <input
                      type="text"
                      className="w-14 h-full text-center border-none font-medium text-slate-900 focus:outline-none"
                      value={quantity}
                      onChange={(event) => setQuantity(Math.max(1, parseInt(event.target.value, 10) || 1))}
                    />
                    <button
                      className="w-11 h-full flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50"
                      onClick={() => setQuantity((value) => Math.min(product.quantity, value + 1))}
                    >+</button>
                  </div>
                  <span className="text-sm">{product.quantity} sản phẩm có sẵn</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    className="flex-1 h-14 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleAddToCart} 
                    disabled={isCartBusy}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    {isCartBusy ? 'Đang xử lý...' : 'Thêm Vào Giỏ'}
                  </button>
                  <button 
                    className="flex-1 h-14 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => {
                      handleAddToCart();
                      // openCart would be called here if available
                    }} 
                    disabled={isCartBusy}
                  >
                    Mua Ngay
                  </button>
                </div>
              </div>
            ) : null}
            
            {auth.isGuest ? (
              <Card className="flex flex-col gap-4 mt-auto border-brand-100 bg-brand-50/30">
                <h3 className="m-0 text-lg font-bold text-slate-900">Đăng nhập để mua hàng</h3>
                <p className="m-0 text-slate-600">Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.</p>
                <div className="flex gap-3 mt-2">
                  <Button as={Link} to="/login">Đăng nhập</Button>
                  <Button as={Link} variant="secondary" to="/register">Đăng ký</Button>
                </div>
              </Card>
            ) : null}
            
            {auth.isSeller ? (
              <Card className="mt-auto bg-slate-50 border-slate-200">
                <p className="m-0 text-slate-600 text-sm">Tài khoản SELLER có thể xem catalog nhưng không có thao tác mua hàng.</p>
              </Card>
            ) : null}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-slate-50 px-8 py-5 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 m-0 uppercase tracking-wide">Chi tiết sản phẩm</h3>
          </div>
          <div className="p-8">
            <div className="prose prose-slate max-w-none text-slate-700 leading-loose">
              {typeof product.detailDesc === 'string'
                ? <div dangerouslySetInnerHTML={{ __html: product.detailDesc.replace(/\n/g, '<br/>') }} />
                : (
                  <div className="flex flex-col gap-4">
                    {product.detailDesc && Object.entries(product.detailDesc).map(([key, value], idx) => {
                      let renderValue;
                      if (value !== null && typeof value === 'object') {
                        if (Array.isArray(value)) {
                          renderValue = Array.isArray(value) ? value.map((item, i) => <div key={i}>{item}</div>) : null;
                        } else {
                          renderValue = JSON.stringify(value);
                        }
                      } else {
                        renderValue = String(value).split('\n').map((line, i) => <div key={i}>{line}</div>);
                      }
                      return (
                        <div className="flex border-b border-slate-100 pb-4 last:border-0 last:pb-0" key={idx}>
                          <div className="w-[200px] shrink-0 text-slate-500 font-medium">{key}</div>
                          <div className="flex-1 text-slate-900">{renderValue}</div>
                        </div>
                      );
                    })}
                  </div>
                )
              }
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default ProductDetail;