import { C } from "../../theme/colors.js";
import { GFONTS } from "../../lib/appConstants.js";

export function GlobalStyles() {
  return (
    <style>{`
      @import url('${GFONTS}');
      *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }
      html, body { background:#F9F9F7; overscroll-behavior:none; -webkit-tap-highlight-color:transparent; font-family: 'Plus Jakarta Sans', sans-serif; }
      ::-webkit-scrollbar { width:3px; } ::-webkit-scrollbar-thumb { background:${C.faint}; border-radius:2px; }
      input, textarea, button { font-family:'Plus Jakarta Sans', sans-serif; }
      input::placeholder, textarea::placeholder { color:${C.faint}; }
      textarea { resize:none; }

      @keyframes riseUp  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
      @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
      @keyframes popIn   { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }
      @keyframes slideR  { from{opacity:0;transform:translateX(28px)} to{opacity:1;transform:translateX(0)} }
      @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
      @keyframes gradShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
      @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      @keyframes cardPulse { 0%,100%{box-shadow:0 0 0px transparent} 50%{box-shadow:0 0 20px ${C.sunrise}33} }

      .rise  { animation: riseUp 0.5s cubic-bezier(.22,1,.36,1) both; }
      .fadein{ animation: fadeIn 0.4s ease both; }
      .popin { animation: popIn  0.35s cubic-bezier(.22,1,.36,1) both; }
      .slR   { animation: slideR 0.38s cubic-bezier(.22,1,.36,1) both; }
      .float { animation: float 5s ease-in-out infinite; }

      .tap { transition:transform .14s,opacity .14s; cursor:pointer; }
      .tap:active { transform:scale(0.96); opacity:.78; }
      .lift { box-shadow:0 10px 32px rgba(0,0,0,.45); }

      .grad-text {
        background: linear-gradient(90deg,${C.sunrise},${C.gold});
        -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
      }
      .il {
        width:100%; background:transparent; border:none;
        border-bottom:1px solid #F3F4F6; color:#111827;
        font-size:14px; font-family:'Plus Jakarta Sans', sans-serif;
        font-weight: 600;
        padding:10px 2px; outline:none; transition:border-color .2s;
      }
      .il:focus { border-bottom-color:${C.forest}; }
      .decl-card { animation: cardPulse 3s ease-in-out infinite; }

      /* ── Web app shell (responsive; wider on desktop) ── */
      .app-font { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }
      .app-root {
        min-height: 100vh;
        min-height: 100dvh;
        display: flex;
        flex-direction: column;
        align-items: center;
        background: #F9F9F7;
        color: ${C.text};
      }
      .app-auth-wrap {
        width: 100%;
        max-width: 440px;
        margin: 0 auto;
        padding: 0 20px 48px;
        min-height: 100vh;
        min-height: 100dvh;
        box-sizing: border-box;
      }
      @media (min-width: 640px) {
        .app-auth-wrap { max-width: 480px; padding: 0 32px 56px; }
      }
      .app-frame {
        width: 100%;
        max-width: 480px;
        flex: 1;
        display: flex;
        flex-direction: column;
        position: relative;
        background: #F9F9F7;
      }
      .app-frame, .app-modal-sheet { max-width: 480px; }
      @media (min-width: 640px) and (max-width: 767px) {
        .app-frame, .app-modal-sheet { max-width: 600px; }
      }
      @media (min-width: 768px) {
        .app-modal-sheet { max-width: min(560px, 92vw); }
      }
      .app-root--mobile-shell {
        height: 100dvh;
        max-height: 100dvh;
        overflow: hidden;
        box-sizing: border-box;
      }
      .app-root--mobile-shell .app-frame {
        flex: 1 1 auto;
        min-height: 0;
        max-height: 100%;
        overflow: hidden;
      }
      .app-root--mobile-shell .app-scroll {
        flex: 1 1 auto;
        min-height: 0;
        overflow-x: hidden;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }
      .app-root--mobile-shell .app-nav-dock { flex-shrink: 0; position: sticky; bottom: 0; }
      .app-root--wide {
        align-items: stretch;
        height: 100dvh;
        max-height: 100dvh;
        overflow: hidden;
        box-sizing: border-box;
      }
      .app-wide {
        flex: 1 1 auto;
        width: 100%;
        min-width: 0;
        min-height: 0;
        max-height: 100%;
        height: 100%;
        display: flex;
        flex-direction: row;
        align-items: stretch;
        background: #F9F9F7;
        overflow: hidden;
      }
      .app-wide-sidebar {
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        background: #14532D;
        border-right: none;
        min-height: 0;
        align-self: stretch;
        position: sticky;
        top: 0;
        max-height: 100dvh;
        overflow: hidden;
        overscroll-behavior: contain;
      }
      .app-wide--tablet .app-wide-sidebar { width: 80px; align-items: center; }
      .app-wide--desktop .app-wide-sidebar { width: 268px; }
      .app-wide-sidebar__nav {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
        overflow-y: auto;
        min-height: 0;
        margin-top: 8px;
      }
      .app-wide--tablet .app-wide-sidebar__nav { align-items: center; width: 100%; }
      .app-wide-body {
        flex: 1;
        min-width: 0;
        min-height: 0;
        max-height: 100%;
        display: flex;
        flex-direction: column;
        background: #F9F9F7;
        overflow: hidden;
      }
      .app-wide-body .app-header { flex-shrink: 0; }
      .app-wide-body .app-scroll { flex: 1 1 auto; min-height: 0; }
      @media (min-width: 768px) and (max-width: 1279px) {
        .app-wide-body .app-scroll { padding: 22px 24px 32px; }
      }
      @media (min-width: 1280px) {
        .app-wide-body .app-scroll {
          padding: 28px 40px 48px;
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          box-sizing: border-box;
        }
      }
      .app-header {
        position: sticky;
        top: 0;
        z-index: 50;
        background: rgba(249, 249, 247, 0.92);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-bottom: 1px solid ${C.border};
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      @media (min-width: 900px) {
        .app-header { padding: 14px 24px; }
      }
      .app-scroll {
        flex: 1 1 auto;
        overflow-x: hidden;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        padding: 20px 16px 28px;
        box-sizing: border-box;
      }
      @media (min-width: 900px) {
        .app-scroll { padding: 28px 32px 32px; }
      }
      .app-nav-dock {
        flex-shrink: 0;
        width: 100%;
        z-index: 50;
        background: transparent;
        border-top: 0;
        padding: 10px 14px max(18px, env(safe-area-inset-bottom, 0px));
        display: flex;
        justify-content: center;
        box-sizing: border-box;
      }
      .app-nav-dock__inner{
        width: min(520px, 100%);
        background: ${C.surface};
        border: 1px solid ${C.border};
        border-radius: 26px;
        padding: 10px 12px;
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 6px;
        box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12), 0 2px 8px rgba(15, 23, 42, 0.06);
      }
      .app-nav-dock__btn{
        background: transparent;
        border: none;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 8px 6px;
        border-radius: 18px;
        transition: all 0.2s ease;
      }
      .app-nav-dock__btn--active {
        background: ${C.agroLight};
      }
      .app-nav-dock__lbl{
        font-size: 11px;
        font-weight: 500;
        letter-spacing: 0.2px;
        color: ${C.faint};
        line-height: 1.1;
      }
      .app-nav-dock__btn--active .app-nav-dock__lbl{ color: ${C.agroGreen}; font-weight: 700; }
      @media (min-width: 900px) {
        .app-nav-dock { padding: 10px 0 max(20px, env(safe-area-inset-bottom, 0px)); }
      }
    `}</style>
  );
}

