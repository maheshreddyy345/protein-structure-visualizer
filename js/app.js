/**
 * Main application entry point
 */
class ProteinVisualizerApp {
    constructor() {
        this.apiService = new APIService();
        this.searchComponent = new SearchComponent(this.apiService);
        this.infoComponent = new InfoComponent(this.apiService);
        this.visualizerComponent = new VisualizerComponent(this.apiService);
        
        this.initializeApp();
    }

    /**
     * Initialize the application
     */
    initializeApp() {
        console.log('Protein Visualizer App initialized');
        
        // Setup global error handling
        this.setupErrorHandling();
        
        // Setup global event listeners
        this.setupGlobalEventListeners();
        
        // Verify 3Dmol.js is loaded
        this.verify3DmolLoading();
    }

    /**
     * Setup global error handling
     */
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.showGlobalError('An unexpected error occurred');
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.showGlobalError('An unexpected error occurred');
        });
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
            // Show global loading indicator
            this.showGlobalLoading(true);
            
            // Load protein information and 3D structure in parallel
            const promises = [
                this.infoComponent.fetchProteinInfo(proteinId),
                this.visualizerComponent.loadStructure(proteinId)
            ];
            
            await Promise.all(promises);
            
            console.log(`Successfully loaded protein: ${proteinId}`);
            
        } catch (error) {
            console.error('Error loading protein:', error);
            this.showGlobalError(`Failed to load protein data: ${error.message}`);
        } finally {
            // Hide global loading indicator
            this.showGlobalLoading(false);
        }
    }

    /**
     * Verify 3Dmol.js library is loaded correctly
     */
    verify3DmolLoading() {
        if (typeof $3Dmol !== 'undefined') {
            console.log('3Dmol.js library loaded successfully');
            console.log('3Dmol version:', $3Dmol.version || 'Unknown');
        } else {
            console.error('3Dmol.js library failed to load');
            this.showGlobalError('3D visualization library failed to load. Please refresh the page.');
        }
    }

    /**
     * Show global error message
     * @param {string} message - Error message
     */
    showGlobalError(message) {
        const errorContainer = document.getElementById('error-container');
        const errorMessage = document.getElementById('error-message');
        
        errorMessage.textContent = message;
        errorContainer.style.display = 'flex';
    }

    /**
     * Show global loading indicator
     * @param {boolean} show - Whether to show loading indicator
     */
    showGlobalLoading(show) {
        const loadingIndicator = document.getElementById('loading-indicator');
        loadingIndicator.style.display = show ? 'flex' : 'none';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('Initializing Protein Visualizer App...');
        window.proteinApp = new ProteinVisualizerApp();
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