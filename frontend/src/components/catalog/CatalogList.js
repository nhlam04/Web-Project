import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CATALOG_BASE_URL = process.env.REACT_APP_CATALOG_URL || 'http://127.0.0.1:8000';

const CatalogList = () => {
  const [catalogs, setCatalogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCatalogs();
  }, []);

  const fetchCatalogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${CATALOG_BASE_URL}/api/v1/catalogs/`);
      if (!response.ok) {
        throw new Error('Không thể tải danh mục');
      }
      const data = await response.json();
      setCatalogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="catalog-loading">Đang tải danh mục...</div>;
  }

  if (error) {
    return <div className="catalog-error">Lỗi: {error}</div>;
  }

  return (
    <div className="catalog-container">
      <style>{`
        .catalog-container {
          max-width: var(--app-content-max);
          margin: 0 auto;
          padding: var(--app-section-gap) var(--app-page-pad);
          font-family: 'Segoe UI', Tahoma, sans-serif;
        }
        .catalog-header {
          text-align: center;
          margin-bottom: 40px;
        }
        .catalog-title {
          font-size: 32px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 10px;
        }
        .catalog-subtitle {
          color: #6b7280;
          font-size: 16px;
        }
        .catalog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
        }
        .catalog-card {
          background: white;
          border-radius: 12px;
          padding: 25px 20px;
          text-align: center;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
          border: 1px solid #f3f4f6;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 120px;
        }
        .catalog-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
          border-color: #4f46e5;
        }
        .catalog-name {
          font-size: 18px;
          font-weight: 600;
          color: #374151;
        }
        .catalog-loading, .catalog-error {
          text-align: center;
          padding: 100px;
          font-size: 18px;
        }
        .catalog-error {
          color: #ef4444;
        }
      `}</style>

      <div className="catalog-header">
        <h2 className="catalog-title">Danh mục sản phẩm</h2>
        <p className="catalog-subtitle">Khám phá các sản phẩm theo danh mục</p>
      </div>

      {catalogs.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#6b7280' }}>Chưa có danh mục nào.</div>
      ) : (
        <div className="catalog-grid">
          {catalogs.map((catalog) => (
            <div
              key={catalog.id}
              className="catalog-card"
              onClick={() => navigate(`/catalogs/${catalog.id}`)}
              title={`Xem các sản phẩm trong ${catalog.product_type}`}
            >
              <div className="catalog-name">{catalog.product_type}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CatalogList;
