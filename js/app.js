/**
 * Main application entry point
 */
class ProteinVisualizerApp {
    constructor() {
        this.apiService = new APIService();
        this.searchComponent = new SearchComponent(this.apiService);
        this.infoComponent = new InfoComponent(this.apiService);
        this.visualizerComponent = new VisualizerComponent(this.apiService);
        // Educational component will be initialized later after DOM is ready
        this.educationalComponent = null;
        
        // Application state management
        this.currentProtein = null;
        this.navigationState = 'search'; // search, loading, loaded, error
        this.userJourney = []; // Track user actions for analytics
        
        // Track shown errors to prevent duplicates
        this.shownErrors = new Set();
        this.lastErrorTime = 0;
        
        // Debug mode can be enabled by adding ?debug=true to URL
        this.debugMode = new URLSearchParams(window.location.search).get('debug') === 'true';
        
        // Browser compatibility information
        this.browserInfo = this.detectBrowser();
        
        this.initializeApp();
    }

    /**
     * Initialize the application
     */
    initializeApp() {
        console.log('Protein Visualizer App initialized');
        console.log('Browser info:', this.browserInfo);
        
        // Check browser compatibility
        this.checkBrowserCompatibility();
        
        // Setup global error handling
        this.setupErrorHandling();
        
        // Setup global event listeners
        this.setupGlobalEventListeners();
        
        // Setup responsive behavior
        this.setupResponsiveBehavior();
        
        // Verify 3Dmol.js is loaded
        this.verify3DmolLoading();
    }

    /**
     * Setup global error handling
     */
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            
            // In debug mode, show all errors
            if (this.debugMode) {
                this.showGlobalError(`Debug Error: ${event.error?.message || 'Unknown error'}`);
                return;
            }
            
            // Only show popup for critical errors, not minor ones
            if (this.isCriticalError(event.error)) {
                this.showGlobalError('An unexpected error occurred');
            }
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            
            // In debug mode, show all promise rejections
            if (this.debugMode) {
                this.showGlobalError(`Debug Promise Rejection: ${event.reason?.message || event.reason}`);
                return;
            }
            
            // Only show popup for critical promise rejections
            if (this.isCriticalError(event.reason)) {
                this.showGlobalError('An unexpected error occurred');
            }
        });
    }

    /**
     * Determine if an error is critical enough to show a popup
     * @param {Error} error - The error to check
     * @returns {boolean} True if the error is critical
     */
    isCriticalError(error) {
        if (!error) return false;
        
        const errorMessage = error.message || error.toString();
        const errorStack = error.stack || '';
        
        // Don't show popup for these non-critical errors:
        const nonCriticalPatterns = [
            // 3Dmol.js internal errors
            '3Dmol',
            'WebGL',
            'canvas',
            // Network errors that are handled elsewhere
            'fetch',
            'XMLHttpRequest',
            'NetworkError',
            // Educational component non-critical errors
            'tooltip',
            'glossary',
            'educational',
            // Browser extension errors
            'extension',
            'chrome-extension',
            'moz-extension',
            // Minor DOM errors
            'ResizeObserver',
            'Non-Error promise rejection captured'
        ];
        
        // Check if error matches any non-critical patterns
        for (const pattern of nonCriticalPatterns) {
            if (errorMessage.toLowerCase().includes(pattern.toLowerCase()) ||
                errorStack.toLowerCase().includes(pattern.toLowerCase())) {
                return false;
            }
        }
        
        // Show popup for critical errors like:
        // - Component initialization failures
        // - Critical API failures
        // - Syntax errors
        const criticalPatterns = [
            'ReferenceError',
            'TypeError: Cannot read',
            'TypeError: Cannot set',
            'SyntaxError',
            'Failed to initialize'
        ];
        
        for (const pattern of criticalPatterns) {
            if (errorMessage.includes(pattern) || errorStack.includes(pattern)) {
                return true;
            }
        }
        
        // Default to not showing popup for unknown errors
        return false;
    }

    /**
     * Setup global event listeners
     */
    setupGlobalEventListeners() {
        // Error dialog close button
        const errorClose = document.getElementById('error-close');
        errorClose.addEventListener('click', () => {
            document.getElementById('error-container').style.display = 'none';
        });

        // Close error dialog on escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                document.getElementById('error-container').style.display = 'none';
                document.getElementById('loading-indicator').style.display = 'none';
            }
        });

        // Listen for protein selection events from SearchComponent
        document.addEventListener('proteinSelected', (event) => {
            const proteinId = event.detail.proteinId;
            console.log(`App received protein selection: ${proteinId}`);
            this.handleProteinSelection(proteinId);
        });
    }

    /**
     * Handle protein selection from search results
     * @param {string} proteinId - Selected protein UniProt ID
     */
    async handleProteinSelection(proteinId) {
        console.log(`Loading protein data for: ${proteinId}`);
        
        try {
            // Update application state
            this.currentProtein = proteinId;
            this.updateNavigationState('loading');
            
            // Show global loading indicator
            this.showGlobalLoading(true);
            
            // Load protein information and 3D structure in parallel
            const promises = [
                this.infoComponent.fetchProteinInfo(proteinId),
                this.visualizerComponent.loadStructure(proteinId)
            ];
            
            await Promise.all(promises);
            
            // Update navigation state to show loaded protein
            this.updateNavigationState('loaded');
            
            // Scroll to protein info section for better UX
            this.scrollToSection('info-section');
            
            console.log(`Successfully loaded protein: ${proteinId}`);
            
        } catch (error) {
            console.error('Error loading protein:', error);
            this.updateNavigationState('error');
            this.showGlobalError(`Failed to load protein data: ${error.message}`);
        } finally {
            // Hide global loading indicator
            this.showGlobalLoading(false);
        }
    }

    /**
     * Verify 3Dmol.js library is loaded correctly and check WebGL support
     */
    verify3DmolLoading() {
        // Check if 3Dmol.js is loaded
        if (typeof $3Dmol !== 'undefined') {
            console.log('3Dmol.js library loaded successfully');
            console.log('3Dmol version:', $3Dmol.version || 'Unknown');
            
            // Check WebGL support
            this.checkWebGLSupport();
        } else {
            console.error('3Dmol.js library failed to load');
            this.showWebGLError('3D visualization library failed to load. Please refresh the page.');
        }
    }

    /**
     * Check WebGL capability and show fallback if not supported
     */
    checkWebGLSupport() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
            console.warn('WebGL not supported');
            this.showWebGLFallback();
            return false;
        }
        
        // Check for common WebGL extensions
        const extensions = {
            'OES_texture_float': gl.getExtension('OES_texture_float'),
            'OES_texture_half_float': gl.getExtension('OES_texture_half_float'),
            'WEBGL_depth_texture': gl.getExtension('WEBGL_depth_texture')
        };
        
        console.log('WebGL supported with extensions:', extensions);
        
        // Check WebGL context limits
        const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        const maxRenderbufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
        
        console.log('WebGL limits:', {
            maxTextureSize,
            maxRenderbufferSize
        });
        
        // Warn if limits are too low for complex proteins
        if (maxTextureSize < 2048) {
            console.warn('WebGL texture size limit is low, may affect large protein visualization');
        }
        
        return true;
    }

    /**
     * Show WebGL fallback message
     */
    showWebGLFallback() {
        const visualizationSection = document.getElementById('visualization-section');
        if (visualizationSection) {
            const fallbackHTML = `
                <div class="webgl-fallback" style="
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 8px;
                    padding: 2rem;
                    text-align: center;
                    margin: 1rem 0;
                ">
                    <h3 style="color: #856404; margin-bottom: 1rem;">
                        🖥️ 3D Visualization Not Available
                    </h3>
                    <p style="color: #856404; margin-bottom: 1rem;">
                        Your browser doesn't support WebGL, which is required for 3D protein visualization.
                    </p>
                    <div style="background: white; padding: 1rem; border-radius: 6px; margin: 1rem 0;">
                        <h4 style="color: #333; margin-bottom: 0.5rem;">Recommended Browsers:</h4>
                        <ul style="list-style: none; padding: 0; margin: 0;">
                            <li>✅ Chrome 56+ (recommended)</li>
                            <li>✅ Firefox 51+</li>
                            <li>✅ Safari 10+</li>
                            <li>✅ Edge 79+</li>
                        </ul>
                    </div>
                    <p style="color: #856404; font-size: 0.9rem;">
                        You can still search for proteins and view their information.
                    </p>
                </div>
            `;
            
            const viewerContainer = visualizationSection.querySelector('#viewer-container');
            if (viewerContainer) {
                viewerContainer.innerHTML = fallbackHTML;
            }
        }
    }

    /**
     * Show WebGL-related error with helpful information
     */
    showWebGLError(message) {
        const errorContainer = document.getElementById('error-container');
        const errorMessage = document.getElementById('error-message');
        
        if (errorContainer && errorMessage) {
            errorMessage.innerHTML = `
                <div style="text-align: left;">
                    <p style="margin-bottom: 1rem;">${message}</p>
                    <div style="background: #f8f9fa; padding: 1rem; border-radius: 6px; margin: 1rem 0;">
                        <h4 style="margin-bottom: 0.5rem;">Troubleshooting:</h4>
                        <ul style="margin: 0; padding-left: 1.2rem;">
                            <li>Try refreshing the page</li>
                            <li>Update your browser to the latest version</li>
                            <li>Enable hardware acceleration in browser settings</li>
                            <li>Try a different browser (Chrome recommended)</li>
                        </ul>
                    </div>
                </div>
            `;
            errorContainer.style.display = 'flex';
        }
    }

    /**
     * Detect browser information
     */
    detectBrowser() {
        const userAgent = navigator.userAgent;
        const browserInfo = {
            name: 'Unknown',
            version: 'Unknown',
            isSupported: true,
            warnings: []
        };

        // Chrome
        if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
            const match = userAgent.match(/Chrome\/(\d+)/);
            browserInfo.name = 'Chrome';
            browserInfo.version = match ? match[1] : 'Unknown';
            browserInfo.isSupported = !match || parseInt(match[1]) >= 56;
            if (!browserInfo.isSupported) {
                browserInfo.warnings.push('Chrome 56+ recommended for best performance');
            }
        }
        // Firefox
        else if (userAgent.includes('Firefox')) {
            const match = userAgent.match(/Firefox\/(\d+)/);
            browserInfo.name = 'Firefox';
            browserInfo.version = match ? match[1] : 'Unknown';
            browserInfo.isSupported = !match || parseInt(match[1]) >= 51;
            if (!browserInfo.isSupported) {
                browserInfo.warnings.push('Firefox 51+ recommended for best performance');
            }
        }
        // Safari
        else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            const match = userAgent.match(/Version\/(\d+)/);
            browserInfo.name = 'Safari';
            browserInfo.version = match ? match[1] : 'Unknown';
            browserInfo.isSupported = !match || parseInt(match[1]) >= 10;
            if (!browserInfo.isSupported) {
                browserInfo.warnings.push('Safari 10+ recommended for best performance');
            }
        }
        // Edge
        else if (userAgent.includes('Edg')) {
            const match = userAgent.match(/Edg\/(\d+)/);
            browserInfo.name = 'Edge';
            browserInfo.version = match ? match[1] : 'Unknown';
            browserInfo.isSupported = !match || parseInt(match[1]) >= 79;
            if (!browserInfo.isSupported) {
                browserInfo.warnings.push('Edge 79+ recommended for best performance');
            }
        }
        // Internet Explorer (not supported)
        else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
            browserInfo.name = 'Internet Explorer';
            browserInfo.isSupported = false;
            browserInfo.warnings.push('Internet Explorer is not supported. Please use Chrome, Firefox, Safari, or Edge.');
        }

        // Check for mobile browsers
        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
            browserInfo.isMobile = true;
            browserInfo.warnings.push('Mobile browsers may have limited 3D visualization performance');
        }

        return browserInfo;
    }

    /**
     * Check browser compatibility and show warnings if needed
     */
    checkBrowserCompatibility() {
        if (!this.browserInfo.isSupported) {
            this.showBrowserCompatibilityWarning();
        } else if (this.browserInfo.warnings.length > 0) {
            console.warn('Browser compatibility warnings:', this.browserInfo.warnings);
        }

        // Check for required features
        const requiredFeatures = {
            'Fetch API': typeof fetch !== 'undefined',
            'Promise': typeof Promise !== 'undefined',
            'ES6 Classes': typeof class {} === 'function',
            'Arrow Functions': (() => true)(),
            'Template Literals': `${true}` === 'true'
        };

        const missingFeatures = Object.entries(requiredFeatures)
            .filter(([name, supported]) => !supported)
            .map(([name]) => name);

        if (missingFeatures.length > 0) {
            console.error('Missing required features:', missingFeatures);
            this.showFeatureCompatibilityError(missingFeatures);
        }
    }

    /**
     * Show browser compatibility warning
     */
    showBrowserCompatibilityWarning() {
        const warningHTML = `
            <div class="browser-warning" style="
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 8px;
                padding: 1.5rem;
                margin: 1rem 0;
                text-align: center;
            ">
                <h3 style="color: #856404; margin-bottom: 1rem;">
                    ⚠️ Browser Compatibility Notice
                </h3>
                <p style="color: #856404; margin-bottom: 1rem;">
                    Your browser (${this.browserInfo.name} ${this.browserInfo.version}) may not fully support all features.
                </p>
                <div style="background: white; padding: 1rem; border-radius: 6px; margin: 1rem 0;">
                    <h4 style="color: #333; margin-bottom: 0.5rem;">Recommended Browsers:</h4>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        <li>✅ Chrome 56+ (recommended)</li>
                        <li>✅ Firefox 51+</li>
                        <li>✅ Safari 10+</li>
                        <li>✅ Edge 79+</li>
                    </ul>
                </div>
                <button onclick="this.parentElement.style.display='none'" style="
                    background: #667eea;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    cursor: pointer;
                ">Continue Anyway</button>
            </div>
        `;

        const main = document.querySelector('main');
        if (main) {
            main.insertAdjacentHTML('afterbegin', warningHTML);
        }
    }

    /**
     * Show feature compatibility error
     */
    showFeatureCompatibilityError(missingFeatures) {
        const errorMessage = `
            This application requires modern browser features that are not available:
            ${missingFeatures.join(', ')}
            
            Please update your browser or use a modern browser like Chrome, Firefox, Safari, or Edge.
        `;
        
        this.showGlobalError(errorMessage);
    }

    /**
     * Setup responsive behavior
     */
    setupResponsiveBehavior() {
        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });

        // Handle window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleWindowResize();
            }, 250);
        });

        // Setup touch event handling for mobile
        if (this.browserInfo.isMobile) {
            this.setupMobileOptimizations();
        }
    }

    /**
     * Handle orientation change
     */
    handleOrientationChange() {
        console.log('Orientation changed');
        
        // Trigger resize on 3D viewer if it exists
        if (this.visualizerComponent && this.visualizerComponent.viewer) {
            try {
                this.visualizerComponent.viewer.resize();
            } catch (error) {
                console.warn('Error resizing 3D viewer after orientation change:', error);
            }
        }
    }

    /**
     * Handle window resize
     */
    handleWindowResize() {
        // Trigger resize on 3D viewer if it exists
        if (this.visualizerComponent && this.visualizerComponent.viewer) {
            try {
                this.visualizerComponent.viewer.resize();
            } catch (error) {
                console.warn('Error resizing 3D viewer after window resize:', error);
            }
        }
    }

    /**
     * Setup mobile-specific optimizations
     */
    setupMobileOptimizations() {
        console.log('Setting up mobile optimizations');
        
        // Prevent zoom on input focus (iOS)
        const inputs = document.querySelectorAll('input[type="text"], input[type="search"]');
        inputs.forEach(input => {
            if (input.style.fontSize !== '16px') {
                input.style.fontSize = '16px';
            }
        });

        // Add touch-friendly classes
        document.body.classList.add('mobile-device');
        
        // Optimize touch interactions
        document.addEventListener('touchstart', () => {}, { passive: true });
        document.addEventListener('touchmove', () => {}, { passive: true });
    }

    /**
     * Show global error message
     * @param {string} message - Error message
     */
    showGlobalError(message) {
        const now = Date.now();
        const errorKey = message.substring(0, 50); // Use first 50 chars as key
        
        // Prevent showing the same error multiple times within 5 seconds
        if (this.shownErrors.has(errorKey) && (now - this.lastErrorTime) < 5000) {
            console.log('Suppressing duplicate error popup:', message);
            return;
        }
        
        // Don't show error popup if one is already visible
        const errorContainer = document.getElementById('error-container');
        if (errorContainer && errorContainer.style.display === 'flex') {
            console.log('Error popup already visible, suppressing:', message);
            return;
        }
        
        this.shownErrors.add(errorKey);
        this.lastErrorTime = now;
        
        // Clean up old errors after 30 seconds
        setTimeout(() => {
            this.shownErrors.delete(errorKey);
        }, 30000);
        
        const errorMessage = document.getElementById('error-message');
        if (errorContainer && errorMessage) {
            errorMessage.textContent = message;
            errorContainer.style.display = 'flex';
        }
    }

    /**
     * Show global loading indicator
     * @param {boolean} show - Whether to show loading indicator
     */
    showGlobalLoading(show) {
        const loadingIndicator = document.getElementById('loading-indicator');
        loadingIndicator.style.display = show ? 'flex' : 'none';
    }

    /**
     * Update navigation state and coordinate UI sections
     * @param {string} state - Navigation state (search, loading, loaded, error)
     */
    updateNavigationState(state) {
        const previousState = this.navigationState;
        this.navigationState = state;
        
        // Track user journey
        this.userJourney.push({
            timestamp: Date.now(),
            state: state,
            protein: this.currentProtein
        });
        
        console.log(`Navigation state changed: ${previousState} -> ${state}`);
        
        // Update UI based on state
        this.coordinateUIState(state);
    }

    /**
     * Coordinate UI sections based on current state
     * @param {string} state - Current navigation state
     */
    coordinateUIState(state) {
        const searchSection = document.getElementById('search-section');
        const infoSection = document.getElementById('info-section');
        const visualizationSection = document.getElementById('visualization-section');
        
        switch (state) {
            case 'search':
                // Show search, hide others
                searchSection.style.display = 'block';
                infoSection.style.display = 'none';
                visualizationSection.style.display = 'none';
                break;
                
            case 'loading':
                // Keep search visible, prepare other sections
                searchSection.style.display = 'block';
                infoSection.style.display = 'none';
                visualizationSection.style.display = 'none';
                break;
                
            case 'loaded':
                // Show all sections with loaded data
                searchSection.style.display = 'block';
                infoSection.style.display = 'block';
                visualizationSection.style.display = 'block';
                break;
                
            case 'error':
                // Keep search visible, hide others
                searchSection.style.display = 'block';
                infoSection.style.display = 'none';
                visualizationSection.style.display = 'none';
                break;
        }
        
        // Update page title based on state
        this.updatePageTitle(state);
    }

    /**
     * Update page title based on current state
     * @param {string} state - Current navigation state
     */
    updatePageTitle(state) {
        const baseTitle = 'Protein Structure Visualizer';
        
        switch (state) {
            case 'loaded':
                if (this.currentProtein) {
                    document.title = `${this.currentProtein} - ${baseTitle}`;
                }
                break;
            case 'loading':
                document.title = `Loading... - ${baseTitle}`;
                break;
            default:
                document.title = baseTitle;
        }
    }

    /**
     * Smooth scroll to a specific section
     * @param {string} sectionId - ID of the section to scroll to
     */
    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    /**
     * Get current application state for debugging
     * @returns {Object} Current application state
     */
    getApplicationState() {
        return {
            currentProtein: this.currentProtein,
            navigationState: this.navigationState,
            userJourney: this.userJourney,
            browserInfo: this.browserInfo,
            debugMode: this.debugMode,
            componentsLoaded: {
                search: !!this.searchComponent,
                info: !!this.infoComponent,
                visualizer: !!this.visualizerComponent,
                educational: !!this.educationalComponent
            }
        };
    }

    /**
     * Reset application to initial state
     */
    resetApplication() {
        console.log('Resetting application to initial state');
        
        // Clear current protein
        this.currentProtein = null;
        
        // Reset navigation state
        this.updateNavigationState('search');
        
        // Clear search results
        if (this.searchComponent) {
            this.searchComponent.clearResults();
        }
        
        // Hide info and visualization sections
        if (this.infoComponent) {
            this.infoComponent.hide();
        }
        
        if (this.visualizerComponent) {
            this.visualizerComponent.hide();
        }
        
        // Clear any error messages
        const errorContainer = document.getElementById('error-container');
        if (errorContainer) {
            errorContainer.style.display = 'none';
        }
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        console.log('Application reset complete');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('Initializing Protein Visualizer App...');
        
        // Check if all required classes are available
        console.log('APIService available:', typeof APIService !== 'undefined');
        console.log('SearchComponent available:', typeof SearchComponent !== 'undefined');
        console.log('InfoComponent available:', typeof InfoComponent !== 'undefined');
        console.log('VisualizerComponent available:', typeof VisualizerComponent !== 'undefined');
        console.log('EducationalComponent available:', typeof EducationalComponent !== 'undefined');
        
        window.proteinApp = new ProteinVisualizerApp();
        
        // Initialize educational features after a short delay to ensure DOM is ready
        setTimeout(() => {
            if (typeof EducationalComponent !== 'undefined') {
                try {
                    EducationalComponent.initialize();
                    console.log('Educational features initialized');
                } catch (eduError) {
                    console.error('Error initializing educational features:', eduError);
                    console.error('Educational error details:', eduError.message);
                    console.error('Educational error stack:', eduError.stack);
                    // Don't show popup for educational component errors - they're not critical
                }
            }
        }, 100);
        
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Failed to initialize app:', error);
        console.error('Error details:', error.message);
        console.error('Stack trace:', error.stack);
        
        // Show user-friendly error
        const errorContainer = document.getElementById('error-container');
        const errorMessage = document.getElementById('error-message');
        if (errorContainer && errorMessage) {
            errorMessage.textContent = 'Failed to initialize the application. Please refresh the page.';
            errorContainer.style.display = 'flex';
        }
    }
});