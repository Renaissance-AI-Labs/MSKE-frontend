<template>
    <footer class="footer" role="contentinfo">
        <div class="container">
            <div class="footer-content">
                <!-- Top: Logo & Info -->
                <div class="footer-top">
                    <div class="footer-brand">
                        <img src="/asset/images/logo/MSKE-logo-all.png" alt="MSKE Logo" class="footer-logo" />
                    </div>
                    
                    <!-- Social Links -->
                    <div class="social-links">
                        <a href="https://x.com/mske_official?s=11" target="_blank" rel="noopener noreferrer" class="social-link" title="X (Twitter)">
                            <svg viewBox="0 0 24 24" fill="currentColor" class="social-icon">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 3.974H5.045z"/>
                            </svg>
                        </a>
                        <a href="https://t.me/mske_cn" target="_blank" rel="noopener noreferrer" class="social-link" title="Telegram">
                            <svg viewBox="0 0 24 24" fill="currentColor" class="social-icon">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                            </svg>
                        </a>
                    </div>
                </div>

                <!-- Divider -->
                <div class="footer-divider"></div>

                <!-- Bottom: Copyright -->
                <div class="footer-bottom">
                    <p class="copyright">© 2026 MSKE. All rights reserved.</p>
                </div>
            </div>
        </div>
    </footer>
</template>

<script>
export default {
    name: 'Footer'
}
</script>

<style scoped lang="scss">
.footer {
    position: relative;
    margin-top: 40px;
    padding: 40px 0 20px;
    background: rgba(15, 15, 15, 0.6);
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    overflow: hidden;
    color: #a0a0a0;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
}

.footer-content {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.footer-top {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin-bottom: 24px;
    width: 100%;
}

.footer-top > * {
    margin-bottom: 16px;
}

.footer-top > *:last-child {
    margin-bottom: 0;
}

.footer-brand {
    display: flex;
    align-items: center;
}

.footer-logo {
    height: 36px;
    width: auto;
    object-fit: contain;
    filter: drop-shadow(0 0 10px rgba(255, 69, 0, 0.2));
}

.social-links {
    display: flex;
    align-items: center;
}

.social-links > * {
    margin-right: 16px;
}

.social-links > *:last-child {
    margin-right: 0;
}

.social-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
    color: #a0a0a0;
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.social-link:hover {
    background: rgba(255, 69, 0, 0.1);
    color: #ff4500;
    border-color: rgba(255, 69, 0, 0.3);
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(255, 69, 0, 0.15);
}

.social-icon {
    width: 18px;
    height: 18px;
}

.footer-divider {
    width: 100%;
    height: 1px;
    background: linear-gradient(90deg, 
        transparent 0%, 
        rgba(255, 255, 255, 0.1) 50%, 
        transparent 100%);
    margin-bottom: 20px;
}

.footer-bottom {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
}

.copyright {
    font-size: 14px;
    letter-spacing: 0.05em;
}

@media (max-width: 768px) {
    .footer {
        padding: 30px 0 15px;
    }
    
    .footer-top {
        margin-bottom: 20px;
    }

    .footer-top > * {
        margin-bottom: 12px;
    }

    .footer-top > *:last-child {
        margin-bottom: 0;
    }
    
    .footer-logo {
        height: 28px;
    }
}
</style>
