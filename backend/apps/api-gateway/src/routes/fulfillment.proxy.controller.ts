import {
  All,
  Controller,
  Req,
  Res,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import http from 'http';

const FULFILLMENT_SERVICE_URL =
  process.env.FULFILLMENT_SERVICE_URL ?? 'http://localhost:3002';

@Controller('api/fulfillments')
export class FulfillmentProxyController {
  private readonly logger = new Logger(FulfillmentProxyController.name);

  @All()
  proxyRoot(@Req() req: Request, @Res() res: Response) {
    return this.proxy(req, res);
  }

  @All('*path')
  proxyAll(@Req() req: Request, @Res() res: Response) {
    return this.proxy(req, res);
  }

  private proxy(req: Request, res: Response) {
    // Rewrite /api/fulfillments/... → /fulfillments/...
    const targetPath = req.originalUrl.replace(/^\/api/, '');
    const url = new URL(targetPath, FULFILLMENT_SERVICE_URL);

    this.logger.log(`Proxying ${req.method} ${req.originalUrl} → ${url.href}`);

    const options: http.RequestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: req.method,
      headers: {
        ...req.headers,
        host: url.host,
      },
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.status(proxyRes.statusCode ?? 500);
      Object.entries(proxyRes.headers).forEach(([key, value]) => {
        if (value) res.setHeader(key, value);
      });
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      this.logger.error('Proxy error', err);
      res.status(502).json({ error: 'Bad Gateway', message: err.message });
    });

    req.pipe(proxyReq);
  }
}
