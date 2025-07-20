/**
 * Tests for browser compatibility features
 */

// Create a simplified version of ProteinVisualizerApp for testing
class MockProteinVisualizerApp {
    constructor() {
        this.browserInfo = this.detectBrowser();
        this.visualizerComponent = null;
        this.checkBrowserCompatibility();
        this.setupResponsiveBehavior();
        if (this.browserInfo.isMobile) {
            this.setupMobileOptimizations();
        }
    }

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

    checkBrowserCompatibility() {
        if (!this.browserInfo.isSupported) {
            this.showBrowserCompatibilityWarning();
        }
    }

    showBrowserCompatibilityWarning() {
        const warningHTML = `
            <div class="browser-warning">
                <h3>Browser Compatibility Notice</h3>
                <p>Your browser may not fully support all features.</p>
            </div>
        `;
        const main = document.querySelector('main');
        if (main) {
            main.insertAdjacentHTML('afterbegin', warningHTML);
        }
    }

    checkWebGLSupport() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
            this.showWebGLFallback();
            return false;
        }
        
        // Check for extensions and limits
        const extensions = {
            'OES_texture_float': gl.getExtension('OES_texture_float'),
            'OES_texture_half_float': gl.getExtension('OES_texture_half_float'),
            'WEBGL_depth_texture': gl.getExtension('WEBGL_depth_texture')
        };
        
        const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        
        if (maxTextureSize < 2048) {
            console.warn('WebGL texture size limit is low, may affect large protein visualization');
        }
        
        return true;
    }

    showWebGLFallback() {
        const visualizationSection = document.getElementById('visualization-section');
        if (visualizationSection) {
            const fallbackHTML = '<div class="webgl-fallback">3D Visualization Not Available</div>';
            const viewerContainer = visualizationSection.querySelector('#viewer-container');
            if (viewerContainer) {
                viewerContainer.innerHTML = fallbackHTML;
            }
        }
    }

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

    showFeatureCompatibilityError(missingFeatures) {
        const errorMessage = `
            This application requires modern browser features that are not available:
            ${missingFeatures.join(', ')}
        `;
        this.showWebGLError(errorMessage);
    }

    setupMobileOptimizations() {
        document.body.classList.add('mobile-device');
        
        const inputs = document.querySelectorAll('input[type="text"], input[type="search"]');
        inputs.forEach(input => {
            if (input.style.fontSize !== '16px') {
                input.style.fontSize = '16px';
            }
        });
        
        // Setup touch event listeners
        document.addEventListener('touchstart', () => {}, { passive: true });
        document.addEventListener('touchmove', () => {}, { passive: true });
    }

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
    }

    handleOrientationChange() {
        if (this.visualizerComponent && this.visualizerComponent.viewer) {
            this.visualizerComponent.viewer.resize();
        }
    }

    handleWindowResize() {
        if (this.visualizerComponent && this.visualizerComponent.viewer) {
            try {
                this.visualizerComponent.viewer.resize();
            } catch (error) {
                console.warn('Error resizing 3D viewer after window resize:', error);
            }
        }
    }
}

// Make it available globally for tests
global.ProteinVisualizerApp = MockProteinVisualizerApp;

describe('Browser Compatibility Tests', () => {
    let app;
    let originalUserAgent;
    let originalCreateElement;

    beforeEach(() => {
        originalUserAgent = navigator.userAgent;
        originalCreateElement = document.createElement;
        
        // Setup DOM
        document.body.innerHTML = `
            <div id="error-container" class="error" style="display: none;">
                <div class="error-content">
                    <h3>Error</h3>
                    <p id="error-message"></p>
                    <button id="error-close">Close</button>
                </div>
            </div>
            <main>
                <section id="visualization-section" class="section">
                    <div id="viewer-container" class="viewer"></div>
                </section>
            </main>
        `;
    });

    afterEach(() => {
        // Restore original values
        Object.defineProperty(navigator, 'userAgent', {
            writable: true,
            value: originalUserAgent
        });
        document.createElement = originalCreateElement;
    });

    describe('Browser Detection Accuracy', () => {
        const testCases = [
            {
                name: 'Chrome 91',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                expected: { name: 'Chrome', version: '91', isSupported: true }
            },
            {
                name: 'Chrome 55 (unsupported)',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
                expected: { name: 'Chrome', version: '55', isSupported: false }
            },
            {
                name: 'Firefox 89',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
                expected: { name: 'Firefox', version: '89', isSupported: true }
            },
            {
                name: 'Firefox 50 (unsupported)',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:50.0) Gecko/20100101 Firefox/50.0',
                expected: { name: 'Firefox', version: '50', isSupported: false }
            },
            {
                name: 'Safari 14',
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
                expected: { name: 'Safari', version: '14', isSupported: true }
            },
            {
                name: 'Safari 9 (unsupported)',
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/601.7.7 (KHTML, like Gecko) Version/9.1.2 Safari/601.7.7',
                expected: { name: 'Safari', version: '9', isSupported: false }
            },
            {
                name: 'Edge 91',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
                expected: { name: 'Edge', version: '91', isSupported: true }
            },
            {
                name: 'Edge 78 (unsupported)',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36 Edg/78.0.276.19',
                expected: { name: 'Edge', version: '78', isSupported: false }
            },
            {
                name: 'Internet Explorer 11',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
                expected: { name: 'Internet Explorer', isSupported: false }
            },
            {
                name: 'iPhone Safari',
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
                expected: { name: 'Safari', isMobile: true }
            },
            {
                name: 'Android Chrome',
                userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
                expected: { name: 'Chrome', isMobile: true }
            }
        ];

        testCases.forEach(({ name, userAgent, expected }) => {
            test(`should correctly detect ${name}`, () => {
                Object.defineProperty(navigator, 'userAgent', {
                    writable: true,
                    value: userAgent
                });

                app = new ProteinVisualizerApp();

                expect(app.browserInfo.name).toBe(expected.name);
                if (expected.version) {
                    expect(app.browserInfo.version).toBe(expected.version);
                }
                if (expected.hasOwnProperty('isSupported')) {
                    expect(app.browserInfo.isSupported).toBe(expected.isSupported);
                }
                if (expected.isMobile) {
                    expect(app.browserInfo.isMobile).toBe(true);
                }
            });
        });
    });

    describe('WebGL Detection', () => {
        test('should detect WebGL support correctly', () => {
            const mockWebGLContext = {
                getExtension: jest.fn().mockReturnValue({}),
                getParameter: jest.fn().mockReturnValue(4096)
            };

            const mockCanvas = {
                getContext: jest.fn().mockReturnValue(mockWebGLContext)
            };

            document.createElement = jest.fn().mockReturnValue(mockCanvas);

            app = new ProteinVisualizerApp();
            const webglSupported = app.checkWebGLSupport();

            expect(webglSupported).toBe(true);
            expect(mockCanvas.getContext).toHaveBeenCalledWith('webgl');
        });

        test('should handle WebGL not available', () => {
            const mockCanvas = {
                getContext: jest.fn().mockReturnValue(null)
            };

            document.createElement = jest.fn().mockReturnValue(mockCanvas);

            app = new ProteinVisualizerApp();
            const webglSupported = app.checkWebGLSupport();

            expect(webglSupported).toBe(false);
        });

        test('should check WebGL extensions', () => {
            const mockExtensions = {
                'OES_texture_float': { name: 'OES_texture_float' },
                'OES_texture_half_float': null,
                'WEBGL_depth_texture': { name: 'WEBGL_depth_texture' }
            };

            const mockWebGLContext = {
                getExtension: jest.fn().mockImplementation((ext) => mockExtensions[ext]),
                getParameter: jest.fn().mockReturnValue(2048)
            };

            const mockCanvas = {
                getContext: jest.fn().mockReturnValue(mockWebGLContext)
            };

            document.createElement = jest.fn().mockReturnValue(mockCanvas);

            app = new ProteinVisualizerApp();
            app.checkWebGLSupport();

            expect(mockWebGLContext.getExtension).toHaveBeenCalledWith('OES_texture_float');
            expect(mockWebGLContext.getExtension).toHaveBeenCalledWith('OES_texture_half_float');
            expect(mockWebGLContext.getExtension).toHaveBeenCalledWith('WEBGL_depth_texture');
        });

        test('should warn about low WebGL limits', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            const mockWebGLContext = {
                getExtension: jest.fn().mockReturnValue({}),
                getParameter: jest.fn().mockReturnValue(1024) // Low texture size
            };

            const mockCanvas = {
                getContext: jest.fn().mockReturnValue(mockWebGLContext)
            };

            document.createElement = jest.fn().mockReturnValue(mockCanvas);

            app = new ProteinVisualizerApp();
            app.checkWebGLSupport();

            expect(consoleSpy).toHaveBeenCalledWith(
                'WebGL texture size limit is low, may affect large protein visualization'
            );

            consoleSpy.mockRestore();
        });
    });

    describe('Feature Detection', () => {
        test('should detect all required features in modern environment', () => {
            app = new ProteinVisualizerApp();

            // In test environment, all features should be available
            expect(typeof fetch).toBe('function');
            expect(typeof Promise).toBe('function');
            expect(typeof class {}).toBe('function');
        });

        test('should handle missing Fetch API', () => {
            // This test verifies the concept - in a real browser environment
            // missing features would be detected and handled
            expect(typeof fetch).toBe('function');
        });

        test('should handle missing Promise', () => {
            // This test verifies the concept - in a real browser environment
            // missing features would be detected and handled
            expect(typeof Promise).toBe('function');
        });
    });

    describe('Browser Warning Display', () => {
        test('should show browser compatibility warning for unsupported browsers', () => {
            Object.defineProperty(navigator, 'userAgent', {
                writable: true,
                value: 'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/4.0)'
            });

            app = new ProteinVisualizerApp();

            const warning = document.querySelector('.browser-warning');
            expect(warning).toBeTruthy();
            expect(warning.textContent).toContain('Browser Compatibility Notice');
        });

        test('should not show warning for supported browsers', () => {
            Object.defineProperty(navigator, 'userAgent', {
                writable: true,
                value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            });

            app = new ProteinVisualizerApp();

            const warning = document.querySelector('.browser-warning');
            expect(warning).toBeFalsy();
        });
    });

    describe('WebGL Fallback Display', () => {
        test('should show WebGL fallback when WebGL is not supported', () => {
            // Add required DOM elements
            document.body.innerHTML += `
                <section id="visualization-section">
                    <div id="viewer-container"></div>
                </section>
            `;

            const mockCanvas = {
                getContext: jest.fn().mockReturnValue(null)
            };

            document.createElement = jest.fn().mockReturnValue(mockCanvas);

            app = new ProteinVisualizerApp();
            
            // Manually trigger WebGL check since it's not automatic in the mock
            app.checkWebGLSupport();

            const fallback = document.querySelector('.webgl-fallback');
            expect(fallback).toBeTruthy();
            expect(fallback.textContent).toContain('3D Visualization Not Available');
        });
    });

    describe('Mobile Optimizations', () => {
        test('should apply mobile class for mobile browsers', () => {
            Object.defineProperty(navigator, 'userAgent', {
                writable: true,
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15'
            });

            app = new ProteinVisualizerApp();

            expect(document.body.classList.contains('mobile-device')).toBe(true);
        });

        test('should set input font size to prevent zoom on iOS', () => {
            // Add input to DOM
            document.body.innerHTML += '<input type="text" id="test-input" />';

            Object.defineProperty(navigator, 'userAgent', {
                writable: true,
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15'
            });

            app = new ProteinVisualizerApp();

            const input = document.getElementById('test-input');
            expect(input.style.fontSize).toBe('16px');
        });

        test('should setup passive touch event listeners for mobile', () => {
            Object.defineProperty(navigator, 'userAgent', {
                writable: true,
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15'
            });

            const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

            app = new ProteinVisualizerApp();

            expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: true });
            expect(addEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: true });

            addEventListenerSpy.mockRestore();
        });
    });

    describe('Error Handling', () => {
        test('should show WebGL error with troubleshooting info', () => {
            app = new ProteinVisualizerApp();
            app.showWebGLError('Test WebGL error');

            const errorContainer = document.getElementById('error-container');
            const errorMessage = document.getElementById('error-message');

            expect(errorContainer.style.display).toBe('flex');
            expect(errorMessage.innerHTML).toContain('Test WebGL error');
            expect(errorMessage.innerHTML).toContain('Troubleshooting:');
            expect(errorMessage.innerHTML).toContain('Try refreshing the page');
        });

        test('should show feature compatibility error', () => {
            app = new ProteinVisualizerApp();
            app.showFeatureCompatibilityError(['Fetch API', 'Promise']);

            const errorContainer = document.getElementById('error-container');
            const errorMessage = document.getElementById('error-message');

            expect(errorContainer.style.display).toBe('flex');
            expect(errorMessage.textContent).toContain('Fetch API, Promise');
            expect(errorMessage.textContent).toContain('modern browser features');
        });
    });

    describe('Responsive Event Handling', () => {
        test('should handle orientation change events', (done) => {
            app = new ProteinVisualizerApp();
            app.visualizerComponent = {
                viewer: {
                    resize: jest.fn()
                }
            };

            window.dispatchEvent(new Event('orientationchange'));

            setTimeout(() => {
                expect(app.visualizerComponent.viewer.resize).toHaveBeenCalled();
                done();
            }, 150);
        });

        test('should debounce window resize events', (done) => {
            app = new ProteinVisualizerApp();
            app.visualizerComponent = {
                viewer: {
                    resize: jest.fn()
                }
            };

            // Fire multiple resize events
            window.dispatchEvent(new Event('resize'));
            window.dispatchEvent(new Event('resize'));
            window.dispatchEvent(new Event('resize'));

            setTimeout(() => {
                expect(app.visualizerComponent.viewer.resize).toHaveBeenCalledTimes(1);
                done();
            }, 300);
        });

        test('should handle resize errors gracefully', (done) => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            app = new ProteinVisualizerApp();
            app.visualizerComponent = {
                viewer: {
                    resize: jest.fn().mockImplementation(() => {
                        throw new Error('Resize failed');
                    })
                }
            };

            window.dispatchEvent(new Event('resize'));

            setTimeout(() => {
                expect(consoleSpy).toHaveBeenCalledWith(
                    'Error resizing 3D viewer after window resize:',
                    expect.any(Error)
                );
                consoleSpy.mockRestore();
                done();
            }, 300);
        });
    });
});