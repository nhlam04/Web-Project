import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Dữ liệu mẫu cho bộ lọc
const AVAILABLE_BRANDS = ['Asus', 'Dell', 'HP', 'Lenovo', 'Apple', 'Acer', 'MSI'];
const AVAILABLE_LOCATIONS = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng'];
const PRICE_RANGES = [
  { label: 'Tất cả mức giá', value: '' },
  { label: 'Dưới 10 triệu', value: '0-10000000' },
  { label: '10 - 20 triệu', value: '10000000-20000000' },
  { label: '20 - 30 triệu', value: '20000000-30000000' },
  { label: 'Trên 30 triệu', value: '30000000-999999999' }
];

const CatalogProductList = () => {
  const { catalogId } = useParams();
  const navigate = useNavigate();

  // --- Data States ---
  const [catalog, setCatalog] = useState(null);
  const [allProducts, setAllProducts] = useState([]); // Chứa TẤT CẢ sản phẩm gốc từ API
  const [filteredProducts, setFilteredProducts] = useState([]); // Chứa sản phẩm SAU KHI LỌC
  const [loading, setLoading] = useState(true);

  // --- Pagination States ---
  const [page, setPage] = useState(1);
  const limit = 8;

  // --- Filter States ---
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedPrice, setSelectedPrice] = useState('');
  const [selectedLocations, setSelectedLocations] = useState([]);

  // Fetch dữ liệu khi vào trang
  useEffect(() => {
    fetchCatalogInfo();
    fetchAllProducts();
  }, [catalogId]);

  // LOGIC LỌC FRONTEND: Chạy lại mỗi khi allProducts hoặc các tiêu chí lọc thay đổi
  useEffect(() => {
    let result = [...allProducts];

    // Lọc theo Thương hiệu
    if (selectedBrands.length > 0) {
      result = result.filter(product => selectedBrands.includes(product.brand));
    }

    // Lọc theo Nơi bán
    if (selectedLocations.length > 0) {
      result = result.filter(product => selectedLocations.includes(product.location));
    }

    // Lọc theo Giá
    if (selectedPrice) {
      const [minStr, maxStr] = selectedPrice.split('-');
      const min = parseInt(minStr, 10);
      const max = parseInt(maxStr, 10);
      result = result.filter(product => product.price >= min && product.price <= max);
    }

    setFilteredProducts(result);
    setPage(1); // Reset về trang 1 mỗi khi đổi bộ lọc
  }, [allProducts, selectedBrands, selectedLocations, selectedPrice]);

  const fetchCatalogInfo = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/catalogs/${catalogId}`);
      if (response.ok) {
        const data = await response.json();
        setCatalog(data);
      }
    } catch (error) {
      console.error("Lỗi khi tải thông tin danh mục:", error);
    }
  };

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      // Thay đổi: Xóa skip/limit để lấy toàn bộ dữ liệu (hoặc đặt limit rất lớn nếu Backend bắt buộc)
      const response = await fetch(`http://127.0.0.1:8000/api/v1/catalogs/${catalogId}/products`);
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();

      setAllProducts(data);
      setFilteredProducts(data); // Ban đầu danh sách lọc = toàn bộ danh sách
    } catch (error) {
      console.error("Lỗi khi tải sản phẩm:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers cho bộ lọc ---
  const handleBrandChange = (brand) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const handleLocationChange = (location) => {
    setSelectedLocations(prev =>
      prev.includes(location) ? prev.filter(l => l !== location) : [...prev, location]
    );
  };

  const clearFilters = () => {
    setSelectedBrands([]);
    setSelectedPrice('');
    setSelectedLocations([]);
  };

  // --- Tính toán phân trang phía Frontend ---
  const totalPages = Math.ceil(filteredProducts.length / limit);
  const startIndex = (page - 1) * limit;
  const currentDisplayedProducts = filteredProducts.slice(startIndex, startIndex + limit);

  return (
    <>
      {/* Giữ nguyên phần CSS từ code cũ */}
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
        .product-brand { font-size: 12px; font-weight: bold; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;}
        .product-info h3 { font-size: 16px; margin: 0 0 10px 0; color: #111827; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; line-height: 1.4; height: 44px; }
        .price { color: #4f46e5; font-weight: bold; margin-bottom: 15px; font-size: 18px; }
        .btn-add-cart { margin-top: auto; padding: 10px; background-color: #eef2ff; color: #4f46e5; border: 1px solid #e0e7ff; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.3s; width: 100%; }
        .btn-add-cart:hover { background-color: #4f46e5; color: white; }
        .pagination { display: flex; justify-content: center; gap: 10px; margin-top: 40px; }
        .page-btn { padding: 8px 16px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-weight: 500; transition: all 0.2s; }
        .page-btn:hover:not(:disabled) { border-color: #4f46e5; color: #4f46e5; }
        .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .loading { text-align: center; padding: 40px; font-size: 18px; color: #6b7280; width: 100%; }
        .empty-state { text-align: center; padding: 40px; color: #6b7280; font-size: 16px; background: white; border-radius: 12px; border: 1px dashed #d1d5db; }
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

        <div className="layout-wrapper">
          {/* CỘT TRÁI: SIDEBAR LỌC */}
          <aside className="sidebar">
            <div className="filter-section">
              <h4>Mức giá</h4>
              {PRICE_RANGES.map((range) => (
                <label key={range.value} className="filter-item">
                  <input
                    type="radio"
                    name="price"
                    value={range.value}
                    checked={selectedPrice === range.value}
                    onChange={(e) => setSelectedPrice(e.target.value)}
                  />
                  {range.label}
                </label>
              ))}
            </div>

            <div className="filter-section">
              <h4>Thương hiệu</h4>
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
              <h4>Nơi bán</h4>
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
                Xóa tất cả bộ lọc
              </button>
            )}
          </aside>

          {/* CỘT PHẢI: DANH SÁCH SẢN PHẨM */}
          <main className="main-content">
            {loading ? (
              <div className="loading">Đang tải toàn bộ sản phẩm...</div>
            ) : (
              <>
                <div className="filter-stats">
                  Hiển thị <strong>{currentDisplayedProducts.length}</strong> trên tổng số <strong>{filteredProducts.length}</strong> sản phẩm phù hợp.
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="empty-state">
                    Không tìm thấy sản phẩm nào phù hợp với tiêu chí lọc của bạn.
                    <br /><br />
                    <button className="btn-clear" style={{ width: 'auto', padding: '10px 20px' }} onClick={clearFilters}>
                      Xóa bộ lọc để xem lại
                    </button>
                  </div>
                ) : (
                  <div className="product-grid">
                    {/* Render currentDisplayedProducts thay vì products */}
                    {currentDisplayedProducts.map((product) => {
                      let imageSrc = "https://via.placeholder.com/250?text=No+Image";
                      if (product.images && product.images.length > 0) {
                        let firstImage = typeof product.images === 'string' ? null : product.images[0];
                        if (typeof product.images === 'string') {
                          try {
                            const parsed = JSON.parse(product.images);
                            if (Array.isArray(parsed) && parsed.length > 0) firstImage = parsed[0];
                          } catch (e) { }
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
                              <button className="btn-detail">Xem chi tiết</button>
                            </div>
                          </div>
                          <div className="product-info">
                            {product.brand && <div className="product-brand">{product.brand}</div>}
                            <h3>{product.name}</h3>
                            <p className="price">{product.price.toLocaleString('vi-VN')}đ</p>
                            <button
                              className="btn-add-cart"
                              onClick={(e) => { e.stopPropagation(); alert('Đã thêm thành công'); }}
                            >
                              Thêm vào giỏ
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Logic Pagination Frontend */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="page-btn"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Trang trước
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