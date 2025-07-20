/**
 * Fix for 3D viewer containment issues
 * This script ensures the 3Dmol.js viewer stays within its designated container
 */

function fixViewerContainment() {
    // Find the viewer container
    const viewerContainer = document.getElementById('viewer-container');
    if (!viewerContainer) {
        console.warn('Viewer container not found');
        return;
    }
    
    // Apply strict containment styles
    viewerContainer.style.cssText = `
        width: 100%;
        height: 500px;
        min-height: 400px;
        position: relative;
        overflow: hidden;
        border: 2px solid #e2e8f0;
        border-radius: 15px;
        background: white;
        z-index: 1;
    `;
    
    // Monitor for any canvas elements and constrain them
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Find any canvas elements
                    const canvases = node.querySelectorAll ? node.querySelectorAll('canvas') : [];
                    if (node.tagName === 'CANVAS') {
                        constrainCanvas(node);
                    }
                    canvases.forEach(constrainCanvas);
                    
                    // Find any 3Dmol viewer elements
                    const viewers = node.querySelectorAll ? node.querySelectorAll('[class*="mol"], [id*="mol"]') : [];
                    if (node.className && (node.className.includes('mol') || node.id.includes('mol'))) {
                        constrainElement(node);
                    }
                    viewers.forEach(constrainElement);
                }
            });
        });
    });
    
    // Start observing
    observer.observe(viewerContainer, {
        childList: true,
        subtree: true
    });
    
    // Also fix any existing elements
    setTimeout(() => {
        const existingCanvases = viewerContainer.querySelectorAll('canvas');
        existingCanvases.forEach(constrainCanvas);
        
        const existingViewers = viewerContainer.querySelectorAll('[class*="mol"], [id*="mol"]');
        existingViewers.forEach(constrainElement);
    }, 100);
    
    console.log('Viewer containment fix applied');
}

function constrainCanvas(canvas) {
    if (!canvas) return;
    
    canvas.style.cssText = `
        position: relative !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        height: 100% !important;
        max-width: 100% !important;
        max-height: 100% !important;
        z-index: 1 !important;
    `;
}

function constrainElement(element) {
    if (!element) return;
    
    element.style.cssText = `
        position: relative !important;
        width: 100% !important;
        height: 100% !important;
        max-width: 100% !important;
        max-height: 100% !important;
        overflow: hidden !important;
    `;
}

// Auto-apply the fix when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixViewerContainment);
} else {
    fixViewerContainment();
}

// Also apply when viewer is initialized
document.addEventListener('viewerInitialized', fixViewerContainment);

// Export for manual use
window.fixViewerContainment = fixViewerContainment;