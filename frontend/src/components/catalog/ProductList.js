import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const limit = 8;

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const skip = (page - 1) * limit;
      const response = await fetch(`http://127.0.0.1:8000/api/v1/products/?skip=${skip}&limit=${limit}`);
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Lỗi khi tải sản phẩm:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <style>{`
        .list-container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, sans-serif; }
        .list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; flex-wrap: wrap; gap: 20px; }
        .list-header h2 { font-size: 32px; color: #111827; }
        .search-box { display: flex; align-items: center; }
        .search-input { padding: 10px 15px; border: 1px solid #d1d5db; border-radius: 6px; width: 300px; outline: none; transition: border-color 0.3s; }
        .search-input:focus { border-color: #4f46e5; }
        
        .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 30px; }
        .product-card { background: white; border-radius: 12px; border: 1px solid #f3f4f6; overflow: hidden; transition: box-shadow 0.3s; display: flex; flex-direction: column; cursor: pointer; }
        .product-card:hover { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
        .product-image { height: 250px; position: relative; overflow: hidden; background-color: #f3f4f6; }
        .product-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
        .product-card:hover .product-image img { transform: scale(1.05); }
        .product-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s; }
        .product-card:hover .product-overlay { opacity: 1; }
        
        .btn-detail { padding: 10px 20px; background: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; color: #111827; }
        .product-info { padding: 20px; display: flex; flex-direction: column; flex-grow: 1; }
        .product-info h3 { font-size: 18px; margin-bottom: 5px; color: #111827; }
        .price { color: #4f46e5; font-weight: bold; margin-bottom: 15px; font-size: 18px; }
        .btn-add-cart { margin-top: auto; padding: 10px; background-color: #eef2ff; color: #4f46e5; border: 1px solid #e0e7ff; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.3s; width: 100%; }
        .btn-add-cart:hover { background-color: #4f46e5; color: white; }
        
        .pagination { display: flex; justify-content: center; gap: 10px; margin-top: 40px; }
        .page-btn { padding: 8px 16px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-weight: 500; transition: all 0.2s; }
        .page-btn:hover:not(:disabled) { border-color: #4f46e5; color: #4f46e5; }
        .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .loading { text-align: center; padding: 40px; font-size: 18px; color: #6b7280; }
        .empty-state { text-align: center; padding: 40px; color: #6b7280; }
      `}</style>
      
      <div className="list-container">
        <div className="list-header">
          <h2>Danh Sách Sản Phẩm</h2>
          <div className="search-box">
            <input 
              type="text" 
              className="search-input" 
              placeholder="Tìm kiếm theo tên..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading">Đang tải sản phẩm...</div>
        ) : (
          <>
            {filteredProducts.length === 0 ? (
              <div className="empty-state">Không tìm thấy sản phẩm nào.</div>
            ) : (
              <div className="product-grid">
                {filteredProducts.map((product) => {
                  const imageSrc = product.images && product.images.length > 0 
                     ? (typeof product.images === 'string' ? JSON.parse(product.images)[0] || product.images[0] : product.images[0])
                     : "https://via.placeholder.com/250?text=No+Image";
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
                        <h3>{product.name}</h3>
                        <p className="price">{product.price.toLocaleString('vi-VN')}đ</p>
                        <button 
                          className="btn-add-cart"
                          onClick={(e) => { e.stopPropagation(); alert('Đã thêm ' + product.name + ' vào giỏ'); }}
                        >
                          Thêm vào giỏ
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="pagination">
              <button 
                className="page-btn" 
                disabled={page === 1} 
                onClick={() => setPage(page - 1)}
              >
                Trang trước
              </button>
              <span style={{ padding: '8px 16px', fontWeight: 'bold' }}>Trang {page}</span>
              <button 
                className="page-btn" 
                onClick={() => setPage(page + 1)}
                disabled={products.length < limit}
              >
                Trang sau
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ProductList;
