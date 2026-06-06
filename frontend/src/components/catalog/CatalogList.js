import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASES } from '../../utils/constants';

const CATALOG_BASE_URL = API_BASES.catalog || 'http://127.0.0.1:8000';

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
    return <div className="text-center p-24 text-lg text-slate-500">Đang tải danh mục...</div>;
  }

  if (error) {
    return <div className="text-center p-24 text-lg text-red-500">Lỗi: {error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Danh mục sản phẩm</h2>
        <p className="text-slate-500 text-lg">Khám phá các sản phẩm theo danh mục</p>
      </div>

      {catalogs.length === 0 ? (
        <div className="text-center text-slate-500">Chưa có danh mục nào.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {catalogs.map((catalog) => (
            <div
              key={catalog.id}
              className="bg-white rounded-xl p-6 text-center shadow-sm border border-slate-100 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-brand-500 flex flex-col items-center justify-center min-h-[120px]"
              onClick={() => navigate(`/catalogs/${catalog.id}`)}
              title={`Xem các sản phẩm trong ${catalog.product_type}`}
            >
              <div className="text-lg font-semibold text-slate-700">{catalog.product_type}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CatalogList;
