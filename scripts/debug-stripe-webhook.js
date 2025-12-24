// Script to debug Stripe webhook issues
// Usage: node scripts/debug-stripe-webhook.js <email>

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
});

async function debugWebhook(email) {
  console.log(`\n🔍 Debugging Stripe webhook for: ${email}\n`);

  try {
    // 1. Find customer by email
    console.log('1️⃣ Searching for Stripe customer...');
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      console.log('❌ No Stripe customer found with this email');
      return;
    }

    const customer = customers.data[0];
    console.log(`✅ Found customer: ${customer.id}`);
    console.log(`   Name: ${customer.name || 'Not set'}`);
    console.log(`   Email: ${customer.email}`);

    // 2. Get subscriptions for this customer
    console.log('\n2️⃣ Checking subscriptions...');
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      limit: 10,
    });

    if (subscriptions.data.length === 0) {
      console.log('❌ No subscriptions found for this customer');
    } else {
      console.log(`✅ Found ${subscriptions.data.length} subscription(s):`);
      subscriptions.data.forEach((sub, index) => {
        console.log(`\n   Subscription ${index + 1}:`);
        console.log(`   - ID: ${sub.id}`);
        console.log(`   - Status: ${sub.status}`);
        console.log(`   - Current Period End: ${sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : 'Not set'}`);
        console.log(`   - Plan:`, sub.items.data[0]?.price?.id || 'Unknown');
        console.log(`   - Metadata:`, sub.metadata);
      });
    }

    // 3. Get recent checkout sessions
    console.log('\n3️⃣ Checking recent checkout sessions...');
    const sessions = await stripe.checkout.sessions.list({
      customer: customer.id,
      limit: 5,
    });

    if (sessions.data.length === 0) {
      console.log('❌ No checkout sessions found');
    } else {
      console.log(`✅ Found ${sessions.data.length} recent session(s):`);
      sessions.data.forEach((session, index) => {
        console.log(`\n   Session ${index + 1}:`);
        console.log(`   - ID: ${session.id}`);
        console.log(`   - Status: ${session.status}`);
        console.log(`   - Payment Status: ${session.payment_status}`);
        console.log(`   - Subscription ID: ${session.subscription || 'None'}`);
        console.log(`   - Created: ${new Date(session.created * 1000).toISOString()}`);
        console.log(`   - Metadata:`, session.metadata);
      });
    }

    // 4. Get recent events for this customer
    console.log('\n4️⃣ Checking recent webhook events...');
    const events = await stripe.events.list({
      limit: 20,
    });

    const customerEvents = events.data.filter(event => {
      const obj = event.data.object;
      return obj.customer === customer.id ||
             obj.id === customer.id ||
             (obj.metadata && obj.metadata.user_id);
    });

    if (customerEvents.length === 0) {
      console.log('⚠️  No recent events found for this customer');
    } else {
      console.log(`✅ Found ${customerEvents.length} relevant event(s):`);
      customerEvents.forEach((event, index) => {
        console.log(`\n   Event ${index + 1}:`);
        console.log(`   - Type: ${event.type}`);
        console.log(`   - ID: ${event.id}`);
        console.log(`   - Created: ${new Date(event.created * 1000).toISOString()}`);
        if (event.data.object.metadata) {
          console.log(`   - Metadata:`, event.data.object.metadata);
        }
      });
    }

    // 5. Check webhook configuration
    console.log('\n5️⃣ Checking webhook endpoints...');
    const webhooks = await stripe.webhookEndpoints.list({ limit: 10 });

    if (webhooks.data.length === 0) {
      console.log('❌ No webhook endpoints configured in Stripe!');
      console.log('   You need to add a webhook endpoint in the Stripe dashboard.');
    } else {
      console.log(`✅ Found ${webhooks.data.length} webhook endpoint(s):`);
      webhooks.data.forEach((webhook, index) => {
        console.log(`\n   Webhook ${index + 1}:`);
        console.log(`   - URL: ${webhook.url}`);
        console.log(`   - Status: ${webhook.status}`);
        console.log(`   - Enabled Events: ${webhook.enabled_events.join(', ')}`);
      });
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(80));
  console.log('💡 Next Steps:');
  console.log('1. Verify webhook endpoint is configured: https://dashboard.stripe.com/webhooks');
  console.log('2. Check that STRIPE_WEBHOOK_SECRET is set in .env.local');
  console.log('3. Ensure webhook URL points to: /api/webhooks/stripe');
  console.log('4. Check webhook delivery attempts in Stripe dashboard');
  console.log('='.repeat(80) + '\n');
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/debug-stripe-webhook.js <email>');
  process.exit(1);
}

debugWebhook(email);
