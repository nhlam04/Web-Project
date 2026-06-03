import React from 'react';
import PageShell from '../../components/shared/PageShell';
import { Card } from '../../components/shared/designSystem';

export default function About() {
  return (
    <PageShell title="Về dự án" subtitle="Marketplace microservices cho môn Web.">
      <Card className="ops-stack">
        <h2>Project Web nhóm 16</h2>
        <p className="ops-muted">Frontend này kết nối IAM, Catalog, Ordering, Fulfillment, Notification và Review thông qua gateway.</p>
      </Card>
    </PageShell>
  );
}
