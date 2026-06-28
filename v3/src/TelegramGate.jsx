import React, { useEffect, useRef, useState } from 'react';

const BOT_USERNAME =
  (import.meta.env.VITE_TELEGRAM_BOT_USERNAME || window.__V3_TELEGRAM_BOT_USERNAME || '')
    .replace(/^@/, '')
    .trim();
const GATE_ENABLED = /^(1|true|yes|on)$/i.test(String(
  import.meta.env.VITE_TELEGRAM_GATE_ENABLED || window.__V3_TELEGRAM_GATE_ENABLED || ''
));

async function readJson(res) {
  try {
    return await res.json();
  } catch (_) {
    return {};
  }
}

export default function TelegramGate({ children, force = false }) {
  if (!GATE_ENABLED && !force) return children;

  const widgetRef = useRef(null);
  const [state, setState] = useState({ loading: true, user: null, error: '' });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/telegram-auth', { credentials: 'include' })
      .then(async res => {
        const data = await readJson(res);
        if (!cancelled) setState({ loading: false, user: data.ok ? data.user : null, error: '' });
      })
      .catch(() => {
        if (!cancelled) setState({ loading: false, user: null, error: 'Could not check Telegram login.' });
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (state.loading || state.user || !BOT_USERNAME || !widgetRef.current) return undefined;

    const callbackName = '__v3TelegramLogin';
    window[callbackName] = async (telegramUser) => {
      setState(prev => ({ ...prev, error: '' }));
      try {
        const res = await fetch('/api/telegram-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(telegramUser),
        });
        const data = await readJson(res);
        if (!res.ok || !data.ok) throw new Error(data.message || 'Telegram login failed.');
        setState({ loading: false, user: data.user, error: '' });
      } catch (err) {
        setState({ loading: false, user: null, error: err.message || 'Telegram login failed.' });
      }
    };

    const container = widgetRef.current;
    container.innerHTML = '';
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', BOT_USERNAME);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-userpic', 'false');
    script.setAttribute('data-onauth', `window.${callbackName}(user)`);
    container.appendChild(script);

    return () => {
      container.innerHTML = '';
      delete window[callbackName];
    };
  }, [state.loading, state.user]);

  if (state.loading) {
    return (
      <main style={styles.shell} aria-busy="true">
        <section style={styles.card}>
          <p style={styles.eyebrow}>V3 access</p>
          <h1 style={styles.title}>Checking Telegram login</h1>
          <p style={styles.copy}>Please wait while V3 verifies your session.</p>
        </section>
      </main>
    );
  }

  if (state.user) return children;

  return (
    <main style={styles.shell}>
      <section style={styles.card} aria-labelledby="telegram-gate-title">
        <p style={styles.eyebrow}>V3 private access</p>
        <h1 id="telegram-gate-title" style={styles.title}>Sign in with Telegram</h1>
        <p style={styles.copy}>
          V3 is gated while the agentic workflow is being shaped. Sign in with Telegram to continue.
        </p>
        {!BOT_USERNAME && (
          <div role="alert" style={styles.alert}>
            Telegram login is not configured. Set VITE_TELEGRAM_BOT_USERNAME for the V3 build.
          </div>
        )}
        {state.error && (
          <div role="alert" style={styles.alert}>
            {state.error}
          </div>
        )}
        <div ref={widgetRef} style={styles.widget} aria-label="Telegram login button" />
      </section>
    </main>
  );
}

const styles = {
  shell: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: 20,
    background: '#eaf0f8',
    color: '#162235',
    fontFamily: 'Arial, sans-serif',
  },
  card: {
    width: 'min(100%, 420px)',
    border: '1px solid #c9d6e6',
    borderRadius: 8,
    background: '#ffffff',
    boxShadow: '0 18px 40px rgba(22, 34, 53, 0.13)',
    padding: '24px 22px',
  },
  eyebrow: {
    margin: '0 0 8px',
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontWeight: 800,
    color: '#2354d6',
  },
  title: {
    margin: '0 0 10px',
    fontSize: 24,
    lineHeight: 1.15,
    color: '#162235',
  },
  copy: {
    margin: '0 0 18px',
    fontSize: 14,
    lineHeight: 1.6,
    color: '#42526b',
  },
  widget: {
    minHeight: 44,
    display: 'flex',
    alignItems: 'center',
  },
  alert: {
    margin: '0 0 14px',
    border: '1px solid #f0b45d',
    borderRadius: 6,
    background: '#fff8ed',
    color: '#7a4b08',
    padding: '10px 12px',
    fontSize: 13,
    lineHeight: 1.5,
  },
};
