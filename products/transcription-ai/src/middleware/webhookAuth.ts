import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

export function verifyZoomWebhookSignature(req: Request, res: Response, next: NextFunction): void {
  const webhookSecret = process.env.ZOOM_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('[WEBHOOK] ZOOM_WEBHOOK_SECRET not set - skipping verification in dev mode');
    return next();
  }

  const signature = req.headers['x-zoom-request-signature'] as string;
  const timestamp = req.headers['x-zoom-request-timestamp'] as string;

  if (!signature || !timestamp) {
    res.status(401).json({ error: 'Missing Zoom signature headers' });
    return;
  }

  const message = `v0:${timestamp}:${JSON.stringify(req.body)}`;
  const expectedSignature = `v0=${crypto
    .createHmac('sha256', webhookSecret)
    .update(message)
    .digest('hex')}`;

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    res.status(401).json({ error: 'Invalid webhook signature' });
    return;
  }

  next();
}
