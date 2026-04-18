const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
  const supabaseAdmin = (process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
    ? createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

  const sig = event.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    // stripeEvent.body might be base64 encoded if not configured correctly, 
    // but usually it's just a string.
    const body = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body;
    
    if (webhookSecret && sig) {
      stripeEvent = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      stripeEvent = JSON.parse(body);
    }
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return {
      statusCode: 400,
      body: `Webhook Error: ${err.message}`,
    };
  }

  // Handle the event
  switch (stripeEvent.type) {
    case "checkout.session.completed":
      const session = stripeEvent.data.object;
      const userId = session.client_reference_id;
      console.log(`Payment successful for user: ${userId}`);
      
      if (supabaseAdmin && userId) {
        try {
          const { data: row, error: fetchError } = await supabaseAdmin
            .from("user_app_data")
            .select("payload")
            .eq("id", userId)
            .maybeSingle();

          if (fetchError) throw fetchError;

          let payload = row?.payload || {};
          if (!payload.user) payload.user = {};
          payload.user.subscribed = true;
          payload.user.subscriptionDate = new Date().toISOString();

          const { error: updateError } = await supabaseAdmin
            .from("user_app_data")
            .upsert({ 
              id: userId, 
              payload, 
              updated_at: new Date().toISOString() 
            });

          if (updateError) throw updateError;
          console.log(`Supabase updated: User ${userId} is now subscribed.`);
        } catch (dbError) {
          console.error("Error updating Supabase subscription:", dbError);
        }
      }
      break;
    default:
      console.log(`Unhandled event type ${stripeEvent.type}`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true }),
  };
};
