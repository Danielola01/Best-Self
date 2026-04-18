const Stripe = require("stripe");

exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
  
  try {
    const { priceId: rawPriceId, userId, userEmail } = JSON.parse(event.body);
    const priceId = rawPriceId ? String(rawPriceId).trim() : "";
    const isTestKey = (process.env.STRIPE_SECRET_KEY || "").startsWith("sk_test_");
    
    console.log(`[Stripe] Session request: priceId=${priceId}, userId=${userId}, mode=${isTestKey ? "TEST" : "LIVE"}`);

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("[Stripe] Missing STRIPE_SECRET_KEY");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Stripe secret key not configured." }),
      };
    }

    let effectivePriceId = priceId;

    // Handle Product IDs
    if (priceId.startsWith("prod_")) {
      console.log(`[Stripe] Resolving Product ID: ${priceId}`);
      try {
        const prices = await stripe.prices.list({
          product: priceId,
          active: true,
          limit: 1,
        });
        
        if (prices.data.length > 0) {
          effectivePriceId = prices.data[0].id;
          console.log(`[Stripe] Resolved ${priceId} -> ${effectivePriceId}`);
        } else {
          console.error(`[Stripe] No active prices for product ${priceId}`);
          return {
            statusCode: 400,
            body: JSON.stringify({ 
              error: `Your Stripe Product (${priceId}) has no active prices.` 
            }),
          };
        }
      } catch (lookupErr) {
        console.error("[Stripe] Price lookup failed:", lookupErr);
        return {
          statusCode: 400,
          body: JSON.stringify({ error: `Stripe Lookup Error: ${lookupErr.message}` }),
        };
      }
    }

    if (!effectivePriceId || (!effectivePriceId.startsWith("price_") && !effectivePriceId.startsWith("prod_"))) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "The provided ID must start with 'price_' or 'prod_'." }),
      };
    }

    // On Netlify, we can use the environment variable or the referral
    let baseUrl = process.env.URL || process.env.APP_URL; 
    if (!baseUrl) {
      // Fallback to referrer if available
      const referrer = event.headers.referer || event.headers.referrer;
      if (referrer) {
        const url = new URL(referrer);
        baseUrl = `${url.protocol}//${url.host}`;
      }
    }
    
    if (baseUrl && baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);
    
    const sessionOptions = {
      payment_method_types: ["card"],
      line_items: [
        {
          price: effectivePriceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${baseUrl || ""}/?checkout=success`,
      cancel_url: `${baseUrl || ""}/?checkout=cancel`,
      client_reference_id: userId,
      metadata: {
        userId: userId,
      },
    };

    if (userEmail && typeof userEmail === "string" && userEmail.trim().includes("@")) {
      sessionOptions.customer_email = userEmail.trim();
    }

    const session = await stripe.checkout.sessions.create(sessionOptions);
    console.log(`[Stripe] Session created: ${session.id}`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ id: session.id, url: session.url }),
    };
  } catch (error) {
    console.error("[Stripe] Checkout Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
