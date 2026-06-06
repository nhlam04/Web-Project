import React from 'react';
import { Link } from 'react-router-dom';

export default function CustomerFooter() {
  return (
    <footer id="about" className="bg-white border-t border-slate-200 pt-16 pb-8">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Project Web Nhóm 16</h2>
            <p className="text-slate-500 leading-relaxed">Một giao diện marketplace tối giản cho catalog, giỏ hàng, đơn hàng, fulfillment và thông báo.</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Hỗ trợ khách hàng</h3>
            <ul className="flex flex-col gap-3">
              <li><Link to="/return-policy" className="text-slate-500 hover:text-brand-600 transition-colors">Chính sách đổi trả</Link></li>
              <li><Link to="/privacy-policy" className="text-slate-500 hover:text-brand-600 transition-colors">Chính sách bảo mật</Link></li>
              <li><Link to="/buying-guide" className="text-slate-500 hover:text-brand-600 transition-colors">Hướng dẫn mua hàng</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Đăng ký nhận tin</h3>
            <p className="text-slate-500 mb-4">Nhận thông tin về sản phẩm và trạng thái đơn hàng mới.</p>
            <div className="flex gap-2">
              <input type="email" placeholder="Email của bạn..." className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-shadow" />
              <button type="button" className="px-6 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">Gửi</button>
            </div>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-100 text-center text-sm text-slate-400">
          &copy; 2026 Project Web Nhóm 16. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
