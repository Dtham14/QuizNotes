// Script to manually update a user's subscription in Supabase
// Usage: node scripts/fix-user-subscription.js <user_id> <plan> <subscription_id>

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
});

async function fixUserSubscription(userId, plan, subscriptionId) {
  console.log(`\n🔧 Fixing subscription for user: ${userId}\n`);

  try {
    // Get subscription details from Stripe
    console.log('1️⃣ Fetching subscription from Stripe...');
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    console.log(`✅ Found subscription: ${subscription.id}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Customer: ${subscription.customer}`);

    // Calculate expiration based on plan
    const expiresAt = new Date();
    if (plan === 'yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      // Monthly and student_premium both get 1 month
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    console.log('\n2️⃣ Updating Supabase database...');

    // Prepare update data
    const updateData = {
      subscription_status: 'active',
      subscription_plan: plan,
      subscription_expires_at: expiresAt.toISOString(),
      stripe_customer_id: subscription.customer,
      // Note: stripe_subscription_id omitted if column doesn't exist yet
    };

    // If user subscribed to teacher plan (monthly or yearly), upgrade their role to teacher
    if (plan === 'monthly' || plan === 'yearly') {
      updateData.role = 'teacher';
      console.log('   ⚠️  This is a teacher plan - will upgrade user role to "teacher"');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select();

    if (error) {
      console.error('❌ Error updating database:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.error('❌ User not found in database');
      return;
    }

    console.log('✅ Successfully updated user subscription!');
    console.log('\n📋 Updated fields:');
    console.log(`   - subscription_status: active`);
    console.log(`   - subscription_plan: ${plan}`);
    console.log(`   - subscription_expires_at: ${expiresAt.toISOString()}`);
    console.log(`   - stripe_customer_id: ${subscription.customer}`);
    console.log(`   - stripe_subscription_id: ${subscription.id}`);
    if (plan === 'monthly' || plan === 'yearly') {
      console.log(`   - role: teacher (upgraded from student)`);
    }

    console.log('\n✅ User should now have premium access!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

const userId = process.argv[2];
const plan = process.argv[3];
const subscriptionId = process.argv[4];

if (!userId || !plan || !subscriptionId) {
  console.error('Usage: node scripts/fix-user-subscription.js <user_id> <plan> <subscription_id>');
  console.error('Example: node scripts/fix-user-subscription.js eb48e909-aae6-41ae-9e00-8c680df88790 student_premium sub_1ShiUS2FjeegTNvVAR9syIGR');
  process.exit(1);
}

fixUserSubscription(userId, plan, subscriptionId);
