import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

// Supabase Admin client for server-side operations (bypasses RLS)
const supabaseAdmin = (process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Support both legacy API paths and direct Netlify function paths in preview
  const handleCheckout = async (req: express.Request, res: express.Response) => {
    try {
      const { priceId: rawPriceId, userId, userEmail } = req.body;
      const priceId = rawPriceId ? String(rawPriceId).trim() : "";
      
      console.log(`[Stripe Preview] Session request: priceId=${priceId}, userId=${userId}`);

      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: "Stripe secret key not configured." });
      }

      let effectivePriceId = priceId;

      if (priceId.startsWith("prod_")) {
        const prices = await stripe.prices.list({ product: priceId, active: true, limit: 1 });
        if (prices.data.length > 0) effectivePriceId = prices.data[0].id;
      }

      let baseUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
      if (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);
      
      const sessionOptions: any = {
        payment_method_types: ["card"],
        line_items: [{ price: effectivePriceId, quantity: 1 }],
        mode: "subscription",
        success_url: `${baseUrl}/?checkout=success`,
        cancel_url: `${baseUrl}/?checkout=cancel`,
        client_reference_id: userId,
        metadata: { userId },
      };

      if (userEmail && typeof userEmail === "string" && userEmail.trim().includes("@")) {
        sessionOptions.customer_email = userEmail.trim();
      }

      const session = await stripe.checkout.sessions.create(sessionOptions);
      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      console.error("[Stripe Preview] Error:", error);
      res.status(500).json({ error: error.message });
    }
  };

  app.post("/api/create-checkout-session", handleCheckout);
  app.post("/.netlify/functions/create-checkout", handleCheckout);
  app.post("/.netlify/functions/create-checkout-session", handleCheckout);

  const handleSuggestions = async (req: express.Request, res: express.Response) => {
    try {
      if (!genAI) return res.status(500).json({ error: "Gemini API key not configured" });
      const { dim, existingGoals, userName } = req.body;
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const existing = existingGoals.filter(Boolean).join(", ") || "none set yet";
      const prompt = `You are a world-class life coach helping ${userName} set powerful ${dim} goals for their 90-day cycle. Return ONLY a JSON array of 3 strings.`;
      const result = await model.generateContent(prompt);
      const text = (await result.response).text();
      const clean = text.replace(/```json|```/g, "").trim();
      res.json(JSON.parse(clean));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  app.post("/api/ai/suggestions", handleSuggestions);
  app.post("/.netlify/functions/ai-suggestions", handleSuggestions);
  app.post("/.netlify/functions/ai/suggestions", handleSuggestions);

  // Stripe Webhook
  app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      if (webhookSecret && sig) {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } else {
        event = req.body;
      }
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        const userId = session.client_reference_id;
        console.log(`Payment successful for user: ${userId}`);
        
        if (supabaseAdmin && userId) {
          try {
            // Fetch current data to update the payload
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
      case "customer.subscription.deleted":
        const subscription = event.data.object;
        console.log(`Subscription deleted: ${subscription.id}`);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  });

  app.post("/api/ai/suggestions", async (req, res) => {
    try {
      if (!genAI) {
        return res.status(500).json({ error: "Gemini API key not configured" });
      }

      const { dim, existingGoals, userName } = req.body;
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const existing = existingGoals.filter(Boolean).join(", ") || "none set yet";
      const prompt = `You are a world-class life coach helping ${userName || "a driven professional"} set powerful ${dim} goals for their 90-day cycle.

Their current ${dim} goals: ${existing}

Generate exactly 3 fresh, specific, ambitious but achievable ${dim} goals for the next 90 days. 
Return ONLY a JSON array of 3 strings, no preamble, no markdown. Example: ["Goal one","Goal two","Goal three"]`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const clean = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);
        res.json(parsed);
      } catch (e) {
        console.error("AI Parsing Error:", text);
        res.status(500).json({ error: "Failed to parse AI response" });
      }
    } catch (error: any) {
      console.error("AI Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
