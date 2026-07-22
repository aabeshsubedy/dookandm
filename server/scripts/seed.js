/* eslint-disable no-console */
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { normalizePhone } from '@dokaandm/shared';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { encryptSecret } from '../src/lib/crypto.js';
import {
  Seller,
  Channel,
  Customer,
  Conversation,
  Message,
  Order,
  Reminder,
  Product,
} from '../src/models/index.js';
import { refreshCustomerRisk } from '../src/services/riskService.js';

const DEMO_EMAIL = 'demo@dokaandm.app';
const DEMO_PASSWORD = 'password123';

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const toPaisa = (npr) => Math.round(npr * 100);

// [name, priceNpr, category, stock (null = untracked)]
const PRODUCTS = [
  ['Cotton Kurta', 1400, 'Apparel', 24],
  ['Pashmina Shawl', 3200, 'Apparel', 3],
  ['Beaded Earrings', 650, 'Jewellery', 40],
  ['Leather Sandals', 2100, 'Footwear', 12],
  ['Handmade Soap Set', 900, 'Home & Living', null],
  ['Dhaka Topi', 800, 'Apparel', 2],
];

const NAMES = [
  ['Sita Sharma', '9812345670'],
  ['Ramesh Karki', '9812345671'],
  ['Anjali Gurung', '9812345672'],
  ['Bikash Thapa', '9812345673'],
  ['Puja Shrestha', '9812345674'],
  ['Nabin Rai', '9812345675'],
  ['Sunita Magar', '9812345676'],
  ['Kiran Adhikari', '9812345677'],
];

const CUSTOMER_MESSAGES = [
  'Hi, is this available?',
  'Dai, price kati ho?',
  'Can you deliver to Pokhara?',
  'I want 2 pieces please',
  'COD available?',
  'When will you ship?',
  'Do you have other colors?',
  'Thank you! 🙏',
];

async function run() {
  await connectDb();
  console.log('🌱 Seeding DokaanDM demo data…');

  // Wipe existing demo sellers (and their data) so the seed is fully idempotent.
  const demoSellers = await Seller.find({
    email: { $in: [DEMO_EMAIL, 'other@dokaandm.app'] },
  }).select('_id');
  if (demoSellers.length) {
    const tenantIds = demoSellers.map((s) => s._id);
    await Promise.all([
      Channel.deleteMany({ seller: { $in: tenantIds } }),
      Customer.deleteMany({ seller: { $in: tenantIds } }),
      Conversation.deleteMany({ seller: { $in: tenantIds } }),
      Message.deleteMany({ seller: { $in: tenantIds } }),
      Order.deleteMany({ seller: { $in: tenantIds } }),
      Reminder.deleteMany({ seller: { $in: tenantIds } }),
      Product.deleteMany({ seller: { $in: tenantIds } }),
      Seller.deleteMany({ _id: { $in: tenantIds } }),
    ]);
    console.log('  cleared previous demo tenants');
  }

  // 1) Demo seller (on Starter so all features are visible in the demo).
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const seller = await Seller.create({
    fullName: 'Aabesh Demo',
    businessName: 'Himalaya Handmade',
    email: DEMO_EMAIL,
    phone: '9800000000',
    passwordHash,
    plan: 'starter',
    planStatus: 'active',
  });
  const tenantId = seller._id;

  // A second seller proves tenant isolation in the UI/demo.
  await Seller.create({
    fullName: 'Other Seller',
    businessName: 'Other Shop',
    email: 'other@dokaandm.app',
    passwordHash,
    plan: 'free',
  });

  // 2) Channels (fake tokens — encrypted the same way real ones are).
  const fbChannel = await Channel.create({
    seller: tenantId,
    type: 'facebook',
    externalId: 'demo_fb_page_1',
    name: 'Himalaya Handmade',
    pageAccessTokenEnc: encryptSecret('demo-fb-token'),
    webhookSubscribed: true,
    status: 'active',
  });
  const igChannel = await Channel.create({
    seller: tenantId,
    type: 'instagram',
    externalId: 'demo_ig_1',
    name: 'himalaya.handmade',
    pageAccessTokenEnc: encryptSecret('demo-ig-token'),
    igLinkedPageId: 'demo_fb_page_1',
    webhookSubscribed: true,
    status: 'active',
  });

  // 2b) Product catalog. Keyed by name so order items can link to real products.
  const productByName = new Map();
  for (let p = 0; p < PRODUCTS.length; p += 1) {
    const [pname, price, category, stock] = PRODUCTS[p];
    const tracked = stock !== null;
    const product = await Product.create({
      seller: tenantId,
      name: pname,
      sku: `DKN-P-${String(p + 1).padStart(6, '0')}`,
      pricePaisa: toPaisa(price),
      costPaisa: toPaisa(Math.round(price * 0.6)),
      category,
      trackInventory: tracked,
      stock: tracked ? stock : 0,
      status: 'active',
    });
    productByName.set(pname, product);
  }

  // 3) Customers + conversations + messages + orders.
  let orderSeq = 0;
  for (let i = 0; i < NAMES.length; i += 1) {
    const [name, rawPhone] = NAMES[i];
    const phone = normalizePhone(rawPhone);
    const channel = i % 2 === 0 ? igChannel : fbChannel;
    const externalUserId = `${channel.type}_user_${i}`;

    const customer = await Customer.create({
      seller: tenantId,
      name,
      phones: [phone],
      isProvisional: false,
      channelIdentities: [
        { channel: channel._id, type: channel.type, externalUserId, handle: name },
      ],
      tags: i === 0 ? ['VIP'] : i === 3 ? ['risky'] : [],
      notes:
        i === 0
          ? [{ body: 'Repeat customer — prefers cash on delivery. Follow up on new stock.' }]
          : [],
    });

    const conversation = await Conversation.create({
      seller: tenantId,
      channel: channel._id,
      channelType: channel.type,
      kind: 'dm',
      externalThreadId: externalUserId,
      customer: customer._id,
      participantHandle: name,
      participantExternalId: externalUserId,
      lastMessageAt: daysAgo(i % 5),
      unread: i < 3,
      unreadCount: i < 3 ? 1 : 0,
    });

    // A few messages back and forth.
    const msgCount = 2 + (i % 3);
    let lastText = '';
    for (let m = 0; m < msgCount; m += 1) {
      const inbound = m % 2 === 0;
      lastText = inbound ? rand(CUSTOMER_MESSAGES) : 'Yes! It is available. Shall I confirm your order?';
      await Message.create({
        seller: tenantId,
        conversation: conversation._id,
        channelType: channel.type,
        direction: inbound ? 'inbound' : 'outbound',
        text: lastText,
        status: inbound ? 'received' : 'delivered',
        sentAt: daysAgo(i % 5),
        createdAt: new Date(daysAgo(i % 5).getTime() + m * 60000),
      });
    }
    conversation.lastMessageSnippet = lastText.slice(0, 200);
    conversation.lastMessageDirection = 'inbound';
    await conversation.save();

    // 4) Orders per customer with varied statuses (drives risk + dashboard).
    const numOrders = 1 + (i % 3);
    for (let o = 0; o < numOrders; o += 1) {
      const [productName, price] = rand(PRODUCTS);
      const linkedProduct = productByName.get(productName);
      const qty = 1 + (o % 2);
      orderSeq += 1;
      const subtotalPaisa = toPaisa(price) * qty;
      const shippingPaisa = toPaisa(100);

      // Bikash (i===3) is the "risky" customer — give him returns.
      let status = rand(['delivered', 'delivered', 'confirmed', 'pending', 'shipped']);
      if (i === 3) status = o === 0 ? 'returned' : rand(['returned', 'delivered']);
      if (i === 0) status = 'delivered'; // VIP always reliable

      await Order.create({
        seller: tenantId,
        orderNumber: `DKN-${String(orderSeq).padStart(6, '0')}`,
        customer: customer._id,
        conversation: conversation._id,
        channelType: channel.type,
        items: [
          {
            product: linkedProduct?._id,
            sku: linkedProduct?.sku,
            productName,
            qty,
            unitPricePaisa: toPaisa(price),
          },
        ],
        subtotalPaisa,
        shippingPaisa,
        totalPaisa: subtotalPaisa + shippingPaisa,
        paymentType: rand(['cod', 'cod', 'esewa', 'khalti']),
        phone,
        address: rand(['Kathmandu', 'Lalitpur', 'Pokhara', 'Bhaktapur']),
        status,
        statusHistory: [{ to: status, at: daysAgo(o), by: seller._id }],
        createdAt: daysAgo(o + i),
        updatedAt: daysAgo(o),
      });

      if (linkedProduct) {
        await Product.updateOne(
          { _id: linkedProduct._id },
          { $inc: { 'stats.unitsSold': qty, 'stats.revenuePaisa': subtotalPaisa } }
        );
      }
    }

    conversation.hasOrder = true;
    await conversation.save();

    await refreshCustomerRisk(tenantId, customer._id);
  }

  // 5) Reminders (follow-ups) surfaced on the dashboard.
  const vip = await Customer.findOne({ seller: tenantId, tags: 'VIP' });
  await Reminder.create({
    seller: tenantId,
    customer: vip?._id,
    title: 'Ping Sita when new Pashmina stock arrives',
    dueAt: daysAgo(-1), // due tomorrow
  });
  await Reminder.create({
    seller: tenantId,
    title: 'Follow up on pending COD confirmations',
    dueAt: daysAgo(0),
  });

  // Set the order counter to reflect seeded orders.
  await Seller.updateOne({ _id: tenantId }, { $set: { orderCountThisPeriod: orderSeq } });

  console.log(
    `✅ Seeded ${NAMES.length} customers, ${orderSeq} orders, ${PRODUCTS.length} products, 2 channels.`
  );
  console.log('');
  console.log('   Demo login:');
  console.log(`     email:    ${DEMO_EMAIL}`);
  console.log(`     password: ${DEMO_PASSWORD}`);
  console.log('');

  await disconnectDb();
  await mongoose.connection.close();
  process.exit(0);
}

run().catch(async (err) => {
  console.error('Seed failed:', err);
  await disconnectDb().catch(() => {});
  process.exit(1);
});
