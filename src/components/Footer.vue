<template>
  <footer class="footer" role="contentinfo">
    <div class="container">
      <div class="footer-panel">
        <div class="footer-top">
          <div class="footer-brand">
            <img src="/asset/images/logo/MSKE-logo-all.png" alt="MSKE Logo" class="footer-logo" />
            <p class="brand-tagline">Bitcoin Stamps | SRC-20</p>
          </div>

          <div class="social-links" aria-label="Social links">
            <a href="https://x.com/MskeDAO" target="_blank" rel="noopener noreferrer" class="social-link" title="X (Twitter)">
              <svg viewBox="0 0 24 24" fill="currentColor" class="social-icon">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 3.974H5.045z"/>
              </svg>
            </a>
            <a href="https://t.me/mskedao" target="_blank" rel="noopener noreferrer" class="social-link" title="Telegram">
              <svg viewBox="0 0 24 24" fill="currentColor" class="social-icon">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
            </a>
          </div>
        </div>

        <div class="footer-divider"></div>

        <article class="footer-intro" aria-label="MSKE Introduction">
          <p class="intro-text">
            <span class="drop-cap">M</span>
            {{ t('footer.intro') }}
          </p>
        </article>

        <div class="footer-bottom">
          <p class="copyright">© 2026 MSKE. All rights reserved.</p>
          <p class="env-version">Version {{ appVersion }}</p>
        </div>
      </div>
    </div>
  </footer>
</template>

<script>
import { APP_ENV } from '@/services/environment';
import { t } from '@/i18n';

export default {
    name: 'Footer',
    methods: {
        t
    },
    computed: {
        appVersion() {
            return APP_ENV === 'PROD' ? 'P-1.0' : 'T-1.0';
        }
    }
}
</script>

<style scoped lang="scss">
.footer {
  position: relative;
  margin-top: 50px;
  padding: 30px 0 calc(112px + env(safe-area-inset-bottom, 0px));
  background: rgba(7, 6, 6, 0.84);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
  color: #a0a0a0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.footer-panel {
  max-width: 900px;
  margin: 0 auto;
  padding: 16px 16px 14px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at top right, rgba(255, 69, 0, 0.08), rgba(255, 69, 0, 0) 48%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.01));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 8px 28px rgba(0, 0, 0, 0.35);
}

.footer-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.footer-brand {
  display: grid;
  gap: 7px;
}

.footer-logo {
  height: 32px;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 0 10px rgba(255, 69, 0, 0.2));
}

.brand-tagline {
  margin: 0;
  color: #b79d8a;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.social-links {
  display: flex;
  align-items: center;
  gap: 10px;
}

.social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.04);
  color: #a0a0a0;
  transition: all 0.25s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.social-link:hover {
  background: rgba(255, 69, 0, 0.1);
  color: #ff7f4a;
  border-color: rgba(255, 69, 0, 0.35);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(255, 69, 0, 0.15);
}

.social-icon {
  width: 16px;
  height: 16px;
}

.footer-divider {
  width: 100%;
  height: 1px;
  margin: 14px 0 14px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0),
    rgba(255, 255, 255, 0.13),
    rgba(255, 255, 255, 0)
  );
}

.footer-intro {
  margin: 0 0 12px;
  padding: 6px 2px 0;
  border: none;
  background: transparent;
}

.intro-text {
  margin: 0;
  color: #d0d0d0;
  font-size: 12.5px;
  line-height: 1.7;
  letter-spacing: 0.015em;
  word-break: break-word;
}

.drop-cap {
  float: left;
  margin: 2px 8px 0 0;
  color: #ff965f;
  font-size: 31px;
  line-height: 0.88;
  font-weight: 700;
  font-family: 'Georgia', 'Times New Roman', serif;
  text-shadow: 0 4px 16px rgba(255, 69, 0, 0.25);
}

.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.copyright {
  margin: 0;
  color: #aaaaaa;
  font-size: 12px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.env-version {
  margin: 0;
  color: #8a8a8a;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

@media (max-width: 768px) {
  .footer {
    padding: 18px 0 calc(104px + env(safe-area-inset-bottom, 0px));
  }

  .container {
    padding: 0 12px;
  }

  .footer-panel {
    padding: 10px 10px 9px;
    border-radius: 12px;
  }

  .footer-top {
    align-items: center;
    flex-direction: row;
    justify-content: space-between;
    gap: 8px;
  }

  .footer-brand {
    gap: 4px;
  }

  .footer-logo {
    height: 24px;
  }

  .brand-tagline {
    font-size: 10px;
    letter-spacing: 0.08em;
  }

  .social-links {
    gap: 8px;
  }

  .social-link {
    width: 30px;
    height: 30px;
  }

  .footer-divider {
    margin: 9px 0;
  }

  .footer-intro {
    margin-bottom: 10px;
    padding-top: 0;
  }

  .intro-text {
    font-size: 11px;
    line-height: 1.5;
  }

  .drop-cap {
    font-size: 24px;
    margin-right: 5px;
  }

  .footer-bottom {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }

  .copyright,
  .env-version {
    font-size: 10.5px;
  }
}
</style>
