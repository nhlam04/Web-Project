import React from 'react';
import { Link } from 'react-router-dom';

export default function CustomerFooter() {
  return (
    <footer id="about" className="landing-footer">
      <div className="landing-footer-inner">
        <div>
          <h2>Project Web nhóm 16</h2>
          <p>Một giao diện marketplace tối giản cho catalog, giỏ hàng, đơn hàng, fulfillment và thông báo.</p>
        </div>
        <div>
          <h3>Hỗ trợ khách hàng</h3>
          <ul>
            <li><Link to="/return-policy">Chính sách đổi trả</Link></li>
            <li><Link to="/privacy-policy">Chính sách bảo mật</Link></li>
            <li><Link to="/buying-guide">Hướng dẫn mua hàng</Link></li>
          </ul>
        </div>
        <div>
          <h3>Đăng ký nhận tin</h3>
          <p>Nhận thông tin về sản phẩm và trạng thái đơn hàng mới.</p>
          <div className="landing-newsletter">
            <input type="email" placeholder="Email của bạn..." />
            <button type="button">Gửi</button>
          </div>
        </div>
      </div>
      <div className="landing-footer-bottom">
        &copy; 2026 Project Web nhóm 16. All rights reserved.
      </div>
    </footer>
  );
}
