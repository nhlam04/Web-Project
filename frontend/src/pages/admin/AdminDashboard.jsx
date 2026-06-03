import React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '../../components/shared/designSystem';

const chartData = [
  { name: 'Catalog', value: 42 },
  { name: 'Orders', value: 18 },
  { name: 'Users', value: 12 },
  { name: 'Shops', value: 5 },
];

export default function AdminDashboard() {
  return (
    <div className="ops-stack">
      <header className="ops-header">
        <div>
          <h1>Admin dashboard</h1>
          <p>Quản lý catalog, order, user và shop trên một mặt bằng.</p>
        </div>
      </header>
      <div className="ops-grid">
        {chartData.map((item) => (
          <Card className="ops-kpi" key={item.name}>
            <span className="ops-muted">{item.name}</span>
            <strong>{item.value}</strong>
          </Card>
        ))}
      </div>
      <Card>
        <h2>Hoạt động hệ thống</h2>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
