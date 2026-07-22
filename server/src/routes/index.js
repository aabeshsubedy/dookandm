import { Router } from 'express';
import authRoutes from './auth.routes.js';
import channelRoutes from './channels.routes.js';
import webhookRoutes from './webhooks.routes.js';
import conversationRoutes from './conversations.routes.js';
import customerRoutes from './customers.routes.js';
import orderRoutes from './orders.routes.js';
import productRoutes from './products.routes.js';
import reminderRoutes from './reminders.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import planRoutes from './plan.routes.js';
import activityRoutes from './activity.routes.js';
import healthRoutes from './health.routes.js';
import eventRoutes from './events.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/channels', channelRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/conversations', conversationRoutes);
router.use('/customers', customerRoutes);
router.use('/orders', orderRoutes);
router.use('/products', productRoutes);
router.use('/reminders', reminderRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/plan', planRoutes);
router.use('/activity', activityRoutes);
router.use('/events', eventRoutes);

export default router;
