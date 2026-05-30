import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from '../components/LandingPage';
import ProductList from '../components/catalog/ProductList';
import ProductDetail from '../components/catalog/ProductDetail';
import CatalogProductList from '../components/catalog/CatalogProductList';
import ChatWidget from '../components/chat/ChatWidget';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/product-list" element={<ProductList />} />
        <Route path="/product-detail/:slug" element={<ProductDetail />} />
        <Route path="/catalogs/:catalogId" element={<CatalogProductList />} />
      </Routes>
      <ChatWidget />
    </Router>
  );
}

export default App;
