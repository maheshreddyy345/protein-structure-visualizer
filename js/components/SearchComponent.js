/**
 * Search component for handling protein search functionality
 */
class SearchComponent {
    constructor(apiService) {
        this.apiService = apiService;
        this.searchForm = document.getElementById('search-form');
        this.searchInput = document.getElementById('search-input');
        this.searchButton = document.getElementById('search-button');
        this.resultsContainer = document.getElementById('search-results');
        
        this.initializeEventListeners();
    }

    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        this.searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSearch();
        });
    }

    /**
     * Handle search form submission
     */
    async handleSearch() {
        const query = this.searchInput.value.trim();
        
        // Validate input
        if (!this.validateSearchInput(query)) {
            return;
        }

        console.log(`Search initiated for: ${query}`);
        
        // Show loading state
        this.setLoadingState(true);
        this.clearResults();
        
        try {
            await this.searchProtein(query);
        } catch (error) {
            console.error('Search error:', error);
            this.showDetailedError(error);
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Validate search input
     * @param {string} query - Search query
     * @returns {boolean} True if valid
     */
    validateSearchInput(query) {
        if (!query || !query.trim()) {
            this.showError('Please enter a protein name or UniProt ID to search.');
            return false;
        }

        if (query.length < 2) {
            this.showError('Search query must be at least 2 characters long.');
            return false;
        }

        if (query.length > 200) {
            this.showError('Search query is too long. Please enter a shorter search term.');
            return false;
        }

        // Check for potentially harmful characters
        const dangerousChars = /[<>'"&]/;
        if (dangerousChars.test(query)) {
            this.showError('Search query contains invalid characters. Please use only letters, numbers, and basic punctuation.');
            return false;
        }

        return true;
    }

    /**
     * Search for protein by name or UniProt ID
     * @param {string} query - Search query
     */
    async searchProtein(query) {
        console.log(`Searching for protein: ${query}`);
        
        try {
            // Create safe progress callback that won't throw errors
            const progressCallback = (progress) => {
                try {
                    this.updateSearchProgress(progress);
                } catch (progressError) {
                    console.warn('Progress callback error:', progressError);
                }
            };

            const results = await this.apiService.searchUniProt(query, progressCallback);
            this.displaySearchResults(results);
        } catch (error) {
            console.error('UniProt search failed:', error);
            throw error; // Re-throw to be handled by handleSearch
        }
    }

    /**
     * Update search progress display
     * @param {Object} progress - Progress information
     */
    updateSearchProgress(progress) {
        const button = this.searchButton;
        
        switch (progress.type) {
            case 'search_start':
                button.textContent = 'Searching...';
                break;
            case 'retry':
                button.textContent = `Retrying... (${progress.attempt}/${progress.maxAttempts})`;
                break;
            case 'retry_delay':
                button.textContent = `Retrying in ${Math.round(progress.delay / 1000)}s...`;
                break;
            case 'search_processing':
                button.textContent = 'Processing...';
                break;
            case 'search_complete':
                button.textContent = 'Search';
                break;
            default:
                button.textContent = 'Searching...';
        }
    }

    /**
     * Display search results
     * @param {Array} results - Array of protein results
     */
    displaySearchResults(results) {
        this.resultsContainer.style.display = 'block';
        
        if (results.length === 0) {
            this.resultsContainer.innerHTML = `
                <div class="no-results">
                    <p>No results found. Try searching with:</p>
                    <ul>
                        <li>Protein name (e.g., "hemoglobin")</li>
                        <li>UniProt ID (e.g., "P69905")</li>
                    </ul>
                </div>
            `;
            return;
        }

        // Create results list
        const resultsList = results.map(protein => {
            const geneNames = protein.geneNames && protein.geneNames.length > 0 
                ? ` (${protein.geneNames.join(', ')})` 
                : '';
            
            return `
                <div class="result-item" data-uniprot-id="${protein.uniprotId}">
                    <div class="result-header">
                        <h3 class="protein-name">${this.escapeHtml(protein.proteinName)}${geneNames}</h3>
                        <span class="uniprot-id">${protein.uniprotId}</span>
                    </div>
                    <div class="result-details">
                        <p class="organism"><strong>Organism:</strong> ${this.escapeHtml(protein.organism)}</p>
                        ${protein.sequenceLength ? `<p class="sequence-length"><strong>Length:</strong> ${protein.sequenceLength} amino acids</p>` : ''}
                    </div>
                    <button class="select-protein-btn" data-uniprot-id="${protein.uniprotId}">
                        Select Protein
                    </button>
                </div>
            `;
        }).join('');

        this.resultsContainer.innerHTML = `
            <div class="results-header">
                <h3>Search Results (${results.length} found)</h3>
            </div>
            <div class="results-list">
                ${resultsList}
            </div>
        `;

        // Add click event listeners to select buttons
        this.addResultEventListeners();
    }

    /**
     * Add event listeners to search result items
     */
    addResultEventListeners() {
        const selectButtons = this.resultsContainer.querySelectorAll('.select-protein-btn');
        selectButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const proteinId = e.target.getAttribute('data-uniprot-id');
                this.selectProtein(proteinId);
            });
        });
    }

    /**
     * Handle protein selection from results
     * @param {string} proteinId - Selected protein ID
     */
    selectProtein(proteinId) {
        console.log(`Protein selected: ${proteinId}`);
        
        // Dispatch custom event for other components to listen to
        const event = new CustomEvent('proteinSelected', {
            detail: { proteinId }
        });
        document.dispatchEvent(event);
        
        // Hide search results after selection
        this.resultsContainer.style.display = 'none';
    }

    /**
     * Clear search results
     */
    clearResults() {
        this.resultsContainer.innerHTML = '';
        this.resultsContainer.style.display = 'none';
    }

    /**
     * Escape HTML to prevent XSS attacks
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Set loading state for search
     * @param {boolean} isLoading - Loading state
     */
    setLoadingState(isLoading) {
        this.searchButton.disabled = isLoading;
        this.searchButton.textContent = isLoading ? 'Searching...' : 'Search';
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        const errorContainer = document.getElementById('error-container');
        const errorMessage = document.getElementById('error-message');
        
        errorMessage.textContent = message;
        errorContainer.style.display = 'flex';
    }

    /**
     * Show detailed error with user guidance
     * @param {Error} error - Error object
     */
    showDetailedError(error) {
        // Try to extract structured error information
        let errorMessage = error.message || 'Search failed. Please try again.';
        let userAction = 'Please try again.';
        
        // Check if this is a structured error from APIService
        if (error.message && error.message.includes('Unable to search UniProt database')) {
            userAction = 'Please check your internet connection and try again.';
        } else if (error.message && error.message.includes('not found in UniProt database')) {
            userAction = 'Please check the spelling or try a different search term.';
        } else if (error.message && error.message.includes('timed out')) {
            userAction = 'The server may be busy. Please wait a moment and try again.';
        }

        // Show error in results area with helpful guidance
        this.resultsContainer.style.display = 'block';
        this.resultsContainer.innerHTML = `
            <div class="search-error">
                <div class="error-icon">⚠️</div>
                <div class="error-content">
                    <h3>Search Error</h3>
                    <p class="error-message">${errorMessage}</p>
                    <p class="error-action">${userAction}</p>
                    <div class="error-suggestions">
                        <h4>Search Tips:</h4>
                        <ul>
                            <li>Try searching with a protein name (e.g., "hemoglobin", "insulin")</li>
                            <li>Use a UniProt ID (e.g., "P69905", "P01308")</li>
                            <li>Check your spelling and try different terms</li>
                            <li>Make sure you have an internet connection</li>
                        </ul>
                    </div>
                    <button class="retry-search-btn" onclick="this.closest('.search-error').style.display='none'">
                        Try Again
                    </button>
                </div>
            </div>
        `;
    }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchComponent;
}