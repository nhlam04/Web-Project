import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { addProductToCart, formatVnd, getOrCreateCart } from '../../utils/orderingApi';

const CATALOG_BASE_URL = process.env.REACT_APP_CATALOG_URL || 'http://127.0.0.1:8000';

const AVAILABLE_BRANDS = ['Asus', 'Dell', 'HP', 'Lenovo', 'Apple', 'Acer', 'MSI'];
const AVAILABLE_LOCATIONS = ['Ha Noi', 'TP. Ho Chi Minh', 'Da Nang'];
const PRICE_RANGES = [
  { label: 'Tat ca muc gia', value: '' },
  { label: 'Duoi 10 trieu', value: '0-10000000' },
  { label: '10 - 20 trieu', value: '10000000-20000000' },
  { label: '20 - 30 trieu', value: '20000000-30000000' },
  { label: 'Tren 30 trieu', value: '30000000-999999999' },
];

const CatalogProductList = () => {
  const { catalogId } = useParams();
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 8;
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedPrice, setSelectedPrice] = useState('');
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [isCartBusy, setIsCartBusy] = useState(false);

  useEffect(() => {
    fetchCatalogInfo();
    fetchAllProducts();
  }, [catalogId]);

  useEffect(() => {
    let result = [...allProducts];

    if (selectedBrands.length > 0) {
      result = result.filter((product) => selectedBrands.includes(product.brand));
    }

    if (selectedLocations.length > 0) {
      result = result.filter((product) => selectedLocations.includes(product.location));
    }

    if (selectedPrice) {
      const [minStr, maxStr] = selectedPrice.split('-');
      const min = parseInt(minStr, 10);
      const max = parseInt(maxStr, 10);
      result = result.filter((product) => product.price >= min && product.price <= max);
    }

    setFilteredProducts(result);
    setPage(1);
  }, [allProducts, selectedBrands, selectedLocations, selectedPrice]);

  const fetchCatalogInfo = async () => {
    try {
      const response = await fetch(`${CATALOG_BASE_URL}/api/v1/catalogs/${catalogId}`);
      if (response.ok) {
        const data = await response.json();
        setCatalog(data);
      }
    } catch (_error) {
      setStatusMessage('Khong the tai thong tin danh muc.');
    }
  };

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${CATALOG_BASE_URL}/api/v1/catalogs/${catalogId}/products`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();

      setAllProducts(data);
      setFilteredProducts(data);
    } catch (_error) {
      setStatusMessage('Khong the tai san pham.');
    } finally {
      setLoading(false);
    }
  };

  const handleBrandChange = (brand) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((item) => item !== brand) : [...prev, brand],
    );
  };

  const handleLocationChange = (location) => {
    setSelectedLocations((prev) =>
      prev.includes(location) ? prev.filter((item) => item !== location) : [...prev, location],
    );
  };

  const clearFilters = () => {
    setSelectedBrands([]);
    setSelectedPrice('');
    setSelectedLocations([]);
  };

  const handleAddToCart = async (event, product) => {
    event.stopPropagation();
    setIsCartBusy(true);
    try {
      const cart = await getOrCreateCart();
      await addProductToCart(cart.id, product, 1);
      setStatusMessage(`Da them ${product.name} vao gio hang`);
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setIsCartBusy(false);
    }
  };

  const totalPages = Math.ceil(filteredProducts.length / limit);
  const startIndex = (page - 1) * limit;
  const currentDisplayedProducts = filteredProducts.slice(startIndex, startIndex + limit);

  return (
    <>
      <style>{`
        .page-container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, sans-serif; }
        .list-header { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; }
        .back-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: #4b5563; transition: color 0.2s; padding: 0; }
        .back-btn:hover { color: #4f46e5; }
        .list-header h2 { font-size: 32px; color: #111827; margin: 0; }
        .layout-wrapper { display: flex; gap: 30px; align-items: flex-start; }
        .sidebar { width: 260px; flex-shrink: 0; background: white; padding: 20px; border-radius: 12px; border: 1px solid #f3f4f6; }
        .filter-section { margin-bottom: 25px; }
        .filter-section h4 { margin: 0 0 15px 0; font-size: 16px; color: #111827; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px; }
        .filter-item { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; cursor: pointer; color: #4b5563; font-size: 14px; }
        .filter-item input { cursor: pointer; accent-color: #4f46e5; width: 16px; height: 16px; }
        .btn-clear { width: 100%; padding: 10px; background: #f3f4f6; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; color: #4b5563; transition: all 0.2s; }
        .btn-clear:hover { background: #e5e7eb; color: #111827; }
        .main-content { flex-grow: 1; min-width: 0; }
        .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 24px; }
        .product-card { background: white; border-radius: 12px; border: 1px solid #f3f4f6; overflow: hidden; transition: box-shadow 0.3s; display: flex; flex-direction: column; cursor: pointer; }
        .product-card:hover { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
        .product-image { height: 200px; position: relative; overflow: hidden; background-color: #f3f4f6; padding: 10px; }
        .product-image img { width: 100%; height: 100%; object-fit: contain; transition: transform 0.5s; }
        .product-card:hover .product-image img { transform: scale(1.05); }
        .product-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s; }
        .product-card:hover .product-overlay { opacity: 1; }
        .btn-detail { padding: 10px 20px; background: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; color: #111827; }
        .product-info { padding: 20px; display: flex; flex-direction: column; flex-grow: 1; }
        .product-brand { font-size: 12px; font-weight: bold; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; }
        .product-info h3 { font-size: 16px; margin: 0 0 10px 0; color: #111827; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; line-height: 1.4; height: 44px; }
        .price { color: #4f46e5; font-weight: bold; margin-bottom: 15px; font-size: 18px; }
        .btn-add-cart { margin-top: auto; padding: 10px; background-color: #eef2ff; color: #4f46e5; border: 1px solid #e0e7ff; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.3s; width: 100%; }
        .btn-add-cart:hover { background-color: #4f46e5; color: white; }
        .btn-add-cart:disabled { opacity: 0.6; cursor: not-allowed; }
        .pagination { display: flex; justify-content: center; gap: 10px; margin-top: 40px; }
        .page-btn { padding: 8px 16px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-weight: 500; transition: all 0.2s; }
        .page-btn:hover:not(:disabled) { border-color: #4f46e5; color: #4f46e5; }
        .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .loading { text-align: center; padding: 40px; font-size: 18px; color: #6b7280; width: 100%; }
        .empty-state { text-align: center; padding: 40px; color: #6b7280; font-size: 16px; background: white; border-radius: 12px; border: 1px dashed #d1d5db; }
        .filter-stats { margin-bottom: 15px; font-size: 14px; color: #6b7280; }
        .status-message { margin: 0 0 20px; padding: 10px 14px; border-radius: 8px; background-color: #ecfeff; color: #0f766e; border: 1px solid #99f6e4; }
        @media (max-width: 768px) { .layout-wrapper { flex-direction: column; } .sidebar { width: 100%; } }
      `}</style>

      <div className="page-container">
        <div className="list-header">
          <button className="back-btn" onClick={() => navigate(-1)} title="Quay lai">
            &larr;
          </button>
          <h2>{catalog ? catalog.product_type : 'Danh muc san pham'}</h2>
        </div>

        {statusMessage ? <div className="status-message">{statusMessage}</div> : null}

        <div className="layout-wrapper">
          <aside className="sidebar">
            <div className="filter-section">
              <h4>Muc gia</h4>
              {PRICE_RANGES.map((range) => (
                <label key={range.value} className="filter-item">
                  <input
                    type="radio"
                    name="price"
                    value={range.value}
                    checked={selectedPrice === range.value}
                    onChange={(event) => setSelectedPrice(event.target.value)}
                  />
                  {range.label}
                </label>
              ))}
            </div>

            <div className="filter-section">
              <h4>Thuong hieu</h4>
              {AVAILABLE_BRANDS.map((brand) => (
                <label key={brand} className="filter-item">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => handleBrandChange(brand)}
                  />
                  {brand}
                </label>
              ))}
            </div>

            <div className="filter-section">
              <h4>Noi ban</h4>
              {AVAILABLE_LOCATIONS.map((loc) => (
                <label key={loc} className="filter-item">
                  <input
                    type="checkbox"
                    checked={selectedLocations.includes(loc)}
                    onChange={() => handleLocationChange(loc)}
                  />
                  {loc}
                </label>
              ))}
            </div>

            {(selectedBrands.length > 0 || selectedPrice || selectedLocations.length > 0) && (
              <button className="btn-clear" onClick={clearFilters}>
                Xoa tat ca bo loc
              </button>
            )}
          </aside>

          <main className="main-content">
            {loading ? (
              <div className="loading">Dang tai toan bo san pham...</div>
            ) : (
              <>
                <div className="filter-stats">
                  Hien thi <strong>{currentDisplayedProducts.length}</strong> tren tong so{' '}
                  <strong>{filteredProducts.length}</strong> san pham phu hop.
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="empty-state">
                    Khong tim thay san pham nao phu hop voi tieu chi loc cua ban.
                    <br /><br />
                    <button className="btn-clear" style={{ width: 'auto', padding: '10px 20px' }} onClick={clearFilters}>
                      Xoa bo loc de xem lai
                    </button>
                  </div>
                ) : (
                  <div className="product-grid">
                    {currentDisplayedProducts.map((product) => {
                      let imageSrc = 'https://via.placeholder.com/250?text=No+Image';
                      if (product.images && product.images.length > 0) {
                        let firstImage = typeof product.images === 'string' ? null : product.images[0];
                        if (typeof product.images === 'string') {
                          try {
                            const parsed = JSON.parse(product.images);
                            if (Array.isArray(parsed) && parsed.length > 0) firstImage = parsed[0];
                          } catch (_error) {
                            // ignore invalid JSON
                          }
                        }
                        if (firstImage) imageSrc = firstImage;
                      }

                      return (
                        <div
                          key={product.id}
                          className="product-card"
                          onClick={() => navigate(`/product-detail/id=${product.id}`)}
                        >
                          <div className="product-image">
                            <img src={imageSrc} alt={product.name} />
                            <div className="product-overlay">
                              <button className="btn-detail">Xem chi tiet</button>
                            </div>
                          </div>
                          <div className="product-info">
                            {product.brand && <div className="product-brand">{product.brand}</div>}
                            <h3>{product.name}</h3>
                            <p className="price">{formatVnd(Number(product.price))}</p>
                            <button
                              className="btn-add-cart"
                              onClick={(event) => handleAddToCart(event, product)}
                              disabled={isCartBusy}
                            >
                              {isCartBusy ? 'Dang xu ly...' : 'Them vao gio'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="page-btn"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Trang truoc
                    </button>
                    <span style={{ padding: '8px 16px', fontWeight: 'bold' }}>
                      Trang {page} / {totalPages}
                    </span>
                    <button
                      className="page-btn"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages}
                    >
                      Trang sau
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default CatalogProductList;
