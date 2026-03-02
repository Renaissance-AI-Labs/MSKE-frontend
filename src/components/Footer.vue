<template>
    <footer class="section-footer">
        <div class="container">
            <div class="footer-content">
                <!-- Top: Logo & Info -->
                <div class="footer-top">
                    <div class="footer-brand">
                        <span class="brand-name">MSKE</span>
                    </div>
                </div>

                <!-- Bottom: Copyright -->
                <div class="footer-bottom">
                    <p class="copyright">© 2026 MSKE</p>
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
/* LAYOUT ONLY STYLES */

.section-footer {
    padding: 80px 0 40px;
    position: relative;
    z-index: 1;
    /* Visual styles removed */
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
}

.footer-content {
    display: flex;
    flex-direction: column;
}

.footer-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 60px;
    
    @media (max-width: 768px) {
        flex-direction: column;
        gap: 40px;
    }
}

.footer-brand {
    display: flex;
    align-items: center;
    gap: 16px;
}

.brand-name {
    font-size: 1.5rem;
    font-weight: bold;
}

.footer-bottom {
    display: flex;
    justify-content: center; /* Centered for simplicity in new design */
    align-items: center;
}

.copyright {
    font-size: 0.9rem;
}
</style>
