# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Stripe + Supabase setup

1. Run SQL migrations in `supabase/migrations` (including Stripe and RPC migrations).
2. Set Supabase Edge Function secrets:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PRICE_ID_ANNUAL`
   - `STRIPE_PRICE_ID_MONTHLY`
3. Deploy functions:
   - `supabase functions deploy create-checkout-session`
   - `supabase functions deploy stripe-webhook`
4. Configure Stripe webhook endpoint URL:
   - `https://<PROJECT_REF>.functions.supabase.co/stripe-webhook`
   - Event: `checkout.session.completed`
