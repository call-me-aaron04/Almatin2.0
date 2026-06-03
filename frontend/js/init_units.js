/**
 * Initializer — runs after app.js is loaded.
 * Applies stored Metric/Imperial preference and initializes
 * the Room Usage Analysis engine on page load.
 * 
 * NOTE: This file is loaded after app.js in the HTML, so all
 * global functions (unitSystem, getStoredUnitSystem, applyUnitSystem,
 * initRoomUsageAnalysis) are guaranteed to be available.
 */
(function initOnLoad() {
    function run() {
        // Initialize unit system
        unitSystem = getStoredUnitSystem();
        applyUnitSystem();

        // Initialize room usage analysis
        if (typeof initRoomUsageAnalysis === 'function') {
            initRoomUsageAnalysis();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
