/**
 * Print Reports Module — SHIELDPLAN AI
 * Handles "Print as PDF" functionality for report cards.
 * Automatically injects print buttons into all report card headers.
 */

(function () {
    'use strict';

    /** Inject a print button into a report header if one is missing */
    function injectPrintButton(header) {
        if (!header || header.querySelector('.btn-print')) return;

        const toggleBtn = header.querySelector('.report-toggle');
        if (!toggleBtn) return;

        const printBtn = document.createElement('button');
        printBtn.className = 'btn-ghost btn-print';
        printBtn.title = 'Print as PDF';
        printBtn.textContent = '\uD83D\uDDA8\uFE0F'; // 🖨️
        printBtn.onclick = function () {
            printReportAsPDF(this);
        };

        toggleBtn.insertAdjacentElement('afterend', printBtn);
    }

    /** Inject print buttons into all existing report cards */
    function injectAllPrintButtons() {
        document.querySelectorAll('.report-header').forEach(injectPrintButton);
    }

    /**
     * Print a report card as a formatted PDF document.
     * Opens a new window with a print-optimized version of the report.
     */
    window.printReportAsPDF = function (btn) {
        const card = btn.closest('.report-item');
        if (!card) return;

        const header = card.querySelector('.report-header');
        const title = header ? header.querySelector('h3')?.textContent || 'Report' : 'Report';
        const statusEl = card.querySelector('.report-badge');
        const status = statusEl ? statusEl.textContent : '';
        const dateEl = card.querySelector('.report-date');
        const date = dateEl ? dateEl.textContent : '';
        const details = card.querySelector('.report-details');

        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) {
            if (window.showToast) {
                window.showToast('Please allow pop-ups to print reports', 'warning');
            }
            return;
        }

        // Gather styles from the main document
        const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
        let styleHTML = '';
        styles.forEach(function (s) {
            styleHTML += s.outerHTML + '\n';
        });

        // Clone details and unhide them for printing
        let detailsHTML = '';
        if (details) {
            const clone = details.cloneNode(true);
            clone.classList.remove('hidden');
            detailsHTML = clone.outerHTML;
        }

        printWindow.document.write(
            '<!DOCTYPE html><html><head><title>Print: ' + title + '</title>' +
            styleHTML +
            '<style>' +
                '@page { margin: 1.5cm; }' +
                'body { background: #fff !important; color: #111 !important; font-family: Inter, sans-serif; padding: 0; margin: 0; }' +
                '.print-report-header { border-bottom: 2px solid #1a73e8; padding-bottom: 1rem; margin-bottom: 1.5rem; }' +
                '.print-report-header h1 { font-size: 1.3rem; margin: 0 0 0.3rem; color: #1a1a2e; }' +
                '.print-report-header .print-meta { font-size: 0.8rem; color: #555; }' +
                '.print-report-header .print-status { display: inline-block; padding: 0.15rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }' +
                '.print-report-header .print-status.safe { background: #e8f5e9; color: #2e7d32; }' +
                '.print-report-header .print-status.warning { background: #fff3e0; color: #e65100; }' +
                '.print-report-header .print-status.danger { background: #ffebee; color: #c62828; }' +
                '.report-section { page-break-inside: avoid; margin-bottom: 1.2rem; }' +
                '.report-section h4 { color: #1a1a2e !important; font-size: 0.95rem; }' +
                '.report-section .section-num { display: inline-flex; align-items: center; justify-content: center; width: 1.5rem; height: 1.5rem; border-radius: 50%; background: #1a73e8; color: #fff; font-size: 0.7rem; margin-right: 0.4rem; }' +
                '.report-desc { color: #333 !important; font-size: 0.8rem; line-height: 1.5; }' +
                '.report-data-table { width: 100%; border-collapse: collapse; font-size: 0.75rem; margin: 0.5rem 0; }' +
                '.report-data-table th { background: #f5f5f5; color: #333 !important; padding: 0.4rem 0.5rem; text-align: left; border-bottom: 1px solid #ddd; }' +
                '.report-data-table td { padding: 0.35rem 0.5rem; border-bottom: 1px solid #eee; color: #333 !important; }' +
                '.exec-summary-box { display: flex; gap: 0.6rem; flex-wrap: wrap; margin: 0.6rem 0; }' +
                '.exec-card { flex: 1; min-width: 120px; padding: 0.5rem; border-radius: 6px; background: #f8f9fa; border: 1px solid #e0e0e0; }' +
                '.exec-label { display: block; font-size: 0.65rem; color: #666; margin-bottom: 0.2rem; }' +
                '.exec-value { font-size: 0.85rem; font-weight: 600; color: #1a1a2e; }' +
                '.exec-value.safe-text { color: #2e7d32; }' +
                '.exec-value.warning-text { color: #e65100; }' +
                '.exec-value.danger-text { color: #c62828; }' +
                '.exec-card.exec-safe { border-left: 3px solid #2e7d32; }' +
                '.exec-card.exec-warning { border-left: 3px solid #e65100; }' +
                '.exec-card.exec-danger { border-left: 3px solid #c62828; }' +
                '.exec-card.exec-primary { border-left: 3px solid #1a73e8; }' +
                '.report-footer { border-top: 1px solid #ddd; padding-top: 0.5rem; font-size: 0.65rem; color: #888; margin-top: 1rem; }' +
                '.report-equation { background: #f5f5f5; padding: 0.5rem; border-radius: 4px; font-family: Courier New, monospace; font-size: 0.72rem; color: #333; margin: 0.4rem 0; }' +
                '.report-badge, .report-toggle, .btn-print, .btn-ghost, .holographic-card::before,' +
                '.report-summary-banner, .reports-toolbar, .page-header-row .page-subtitle { display: none !important; }' +
                '.holographic-card { background: none !important; border: none !important; box-shadow: none !important; padding: 0 !important; }' +
                '.status-safe { color: #2e7d32 !important; }' +
                '.status-danger { color: #c62828 !important; }' +
                '.report-details { display: block !important; }' +
                '.report-item { margin-bottom: 1.5rem; }' +
                '@media print { .no-print { display: none !important; } }' +
            '</style></head><body>' +
            '<div class="print-report-header">' +
                '<h1>' + title + '</h1>' +
                '<div class="print-meta">' +
                    '<span class="print-status ' + status.toLowerCase() + '">' + status + '</span>' +
                    ' &middot; Generated: ' + date +
                '</div>' +
            '</div>' +
            detailsHTML +
            '<p style="text-align:center;font-size:0.65rem;color:#aaa;margin-top:1.5rem;border-top:1px solid #eee;padding-top:0.5rem;">' +
                'Generated by SHIELDPLAN AI &mdash; Engineering Reference Document' +
            '</p>' +
            '<script>window.onload = function() { window.print(); };<' + '/script>' +
            '</body></html>'
        );
        printWindow.document.close();
    };

    // --- Initialization ---

    // Inject into existing report cards once DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectAllPrintButtons);
    } else {
        injectAllPrintButtons();
    }

    // Watch for dynamically added report cards (via MutationObserver)
    var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            mutation.addedNodes.forEach(function (node) {
                if (node.nodeType === 1) {
                    // Check if the added node itself is a report header
                    if (node.matches && node.matches('.report-header')) {
                        injectPrintButton(node);
                    }
                    // Check for report headers within the added node
                    if (node.querySelectorAll) {
                        node.querySelectorAll('.report-header').forEach(injectPrintButton);
                    }
                }
            });
        });
    });

    // Target the reports list container specifically for efficiency
    var reportsList = document.getElementById('reports-list');
    if (reportsList) {
        observer.observe(reportsList, {
            childList: true,
            subtree: true,
        });
    }
})();
