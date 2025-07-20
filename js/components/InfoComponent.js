/**
 * Info component for displaying protein information
 */
class InfoComponent {
    constructor(apiService) {
        this.apiService = apiService;
        this.infoSection = document.getElementById('info-section');
        this.infoContainer = document.getElementById('protein-info');
        
        // Handle test environment where DOM elements might not exist
        if (!this.infoSection) {
            this.infoSection = { style: { display: 'none' } };
        }
        if (!this.infoContainer) {
            this.infoContainer = { innerHTML: '', querySelectorAll: () => [] };
        }
    }

    /**
     * Fetch and display protein information
     * @param {string} uniprotId - UniProt ID
     */
    async fetchProteinInfo(uniprotId) {
        if (!uniprotId) {
            this.showError('UniProt ID is required');
            return;
        }
        
        try {
            // Show loading state
            this.showLoadingState();
            
            // Create progress callback
            const progressCallback = (progress) => {
                this.updateInfoProgress(progress);
            };
            
            // Fetch protein metadata from UniProt API
            const proteinData = await this.apiService.getProteinMetadata(uniprotId, progressCallback);
            this.displayProteinDetails(proteinData);
            
        } catch (error) {
            console.error('Error fetching protein info:', error);
            this.showDetailedError(error, uniprotId);
        }
    }

    /**
     * Update info loading progress
     * @param {Object} progress - Progress information
     */
    updateInfoProgress(progress) {
        const loadingContainer = this.infoContainer.querySelector('.loading-info');
        if (!loadingContainer) return;
        
        const messageElement = loadingContainer.querySelector('p');
        if (messageElement) {
            messageElement.textContent = progress.message || 'Loading protein information...';
        }
    }

    /**
     * Display protein details
     * @param {Object} proteinData - Protein data object
     */
    displayProteinDetails(proteinData) {
        this.infoSection.style.display = 'block';
        
        const confidenceScoreHtml = this.formatConfidenceScore(proteinData.confidenceScore);
        const geneNamesHtml = proteinData.geneNames && proteinData.geneNames.length > 0 
            ? proteinData.geneNames.join(', ') 
            : 'Not available';
        
        this.infoContainer.innerHTML = `
            <div class="protein-details">
                <div class="protein-header">
                    <h3>${proteinData.proteinName}</h3>
                    <span class="uniprot-id-badge" data-edu-tooltip="uniprot-id">${proteinData.uniprotId}</span>
                </div>
                
                <div class="protein-info-grid">
                    <div class="info-item">
                        <label>Organism:</label>
                        <span>${proteinData.organism}</span>
                    </div>
                    
                    <div class="info-item">
                        <label>Sequence Length:</label>
                        <span>${proteinData.sequenceLength ? proteinData.sequenceLength + ' amino acids' : 'Not available'}</span>
                    </div>
                    
                    <div class="info-item">
                        <label>Gene Names:</label>
                        <span>${geneNamesHtml}</span>
                    </div>
                    
                    <div class="info-item">
                        <label>Structure Confidence:</label>
                        <span class="confidence-container">
                            ${confidenceScoreHtml}
                            <span class="tooltip-trigger" data-tooltip="confidence-explanation">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
                                </svg>
                            </span>
                        </span>
                    </div>
                </div>
                
                <div class="protein-description">
                    <label>Function:</label>
                    <p>${proteinData.description}</p>
                </div>
                
                <div class="protein-meta">
                    <small>Last updated: ${new Date(proteinData.lastUpdated).toLocaleDateString()}</small>
                </div>
            </div>
            
            <!-- Confidence Score Explanation Tooltip -->
            <div id="confidence-explanation" class="tooltip" style="display: none;">
                <div class="tooltip-content">
                    <h4>Structure Confidence Score</h4>
                    <p>This score indicates the reliability of the predicted protein structure:</p>
                    <ul>
                        <li><strong>High (90-100%):</strong> Very confident prediction, likely accurate</li>
                        <li><strong>Medium (70-90%):</strong> Moderately confident, generally reliable</li>
                        <li><strong>Low (&lt;70%):</strong> Less confident, use with caution</li>
                    </ul>
                    <p><small>Confidence scores are based on AlphaFold's prediction algorithms and training data.</small></p>
                </div>
            </div>
        `;
        
        // Add tooltip functionality
        this.initializeTooltips();
    }

    /**
     * Format confidence score with explanation
     * @param {number} score - Confidence score
     * @returns {string} Formatted confidence display
     */
    formatConfidenceScore(score) {
        if (score === null || score === undefined) {
            return 'Unknown';
        }
        
        let level = 'Low';
        let color = '#e74c3c';
        
        if (score >= 90) {
            level = 'High';
            color = '#27ae60';
        } else if (score >= 70) {
            level = 'Medium';
            color = '#f39c12';
        }
        
        return `
            <span class="confidence-score" style="color: ${color}">
                ${score.toFixed(1)}% (${level} Confidence)
            </span>
        `;
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        this.infoContainer.innerHTML = `
            <div class="loading-info">
                <div class="spinner-small"></div>
                <p>Loading protein information...</p>
            </div>
        `;
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.infoContainer.innerHTML = `
            <div class="error-info">
                <p>${message}</p>
                <button onclick="this.parentElement.parentElement.style.display='none'">
                    Close
                </button>
            </div>
        `;
    }

    /**
     * Show detailed error with user guidance
     * @param {Error} error - Error object
     * @param {string} uniprotId - UniProt ID that failed
     */
    showDetailedError(error, uniprotId) {
        let errorMessage = error.message || 'Failed to load protein information';
        let userAction = 'Please try again or select a different protein.';
        let suggestions = [];

        // Provide specific guidance based on error type
        if (error.message && error.message.includes('not found')) {
            userAction = 'This protein may not exist in the UniProt database.';
            suggestions = [
                'Verify the UniProt ID is correct',
                'Try searching for the protein by name instead',
                'Check if the protein ID was copied correctly'
            ];
        } else if (error.message && error.message.includes('network') || error.message.includes('connection')) {
            userAction = 'Please check your internet connection and try again.';
            suggestions = [
                'Check your internet connection',
                'Try refreshing the page',
                'Wait a moment and try again'
            ];
        } else if (error.message && error.message.includes('timeout')) {
            userAction = 'The server may be busy. Please try again in a few moments.';
            suggestions = [
                'Wait 30-60 seconds and try again',
                'Try a different protein',
                'Check if your connection is stable'
            ];
        }

        this.infoContainer.innerHTML = `
            <div class="error-info-detailed">
                <div class="error-header">
                    <div class="error-icon">⚠️</div>
                    <h3>Unable to Load Protein Information</h3>
                </div>
                <div class="error-content">
                    <p class="error-message"><strong>Error:</strong> ${errorMessage}</p>
                    <p class="error-action"><strong>What to do:</strong> ${userAction}</p>
                    ${suggestions.length > 0 ? `
                        <div class="error-suggestions">
                            <h4>Suggestions:</h4>
                            <ul>
                                ${suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    <div class="error-protein-info">
                        <p><strong>Protein ID:</strong> ${uniprotId}</p>
                    </div>
                </div>
                <div class="error-actions">
                    <button class="retry-btn" onclick="window.proteinApp.infoComponent.fetchProteinInfo('${uniprotId}')">
                        Try Again
                    </button>
                    <button class="close-btn" onclick="this.closest('.error-info-detailed').parentElement.parentElement.style.display='none'">
                        Close
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Initialize tooltip functionality with improved hover behavior
     */
    initializeTooltips() {
        const tooltipTriggers = this.infoContainer.querySelectorAll('.tooltip-trigger');
        
        tooltipTriggers.forEach(trigger => {
            const tooltipId = trigger.getAttribute('data-tooltip');
            const tooltip = document.getElementById(tooltipId);
            
            if (tooltip) {
                let hideTimeout;
                
                // Show tooltip on hover
                trigger.addEventListener('mouseenter', () => {
                    clearTimeout(hideTimeout);
                    this.showTooltip(tooltip, trigger);
                });
                
                // Hide tooltip with delay when leaving trigger
                trigger.addEventListener('mouseleave', () => {
                    hideTimeout = setTimeout(() => {
                        this.hideTooltip(tooltip);
                    }, 300); // 300ms delay
                });
                
                // Keep tooltip visible when hovering over it
                tooltip.addEventListener('mouseenter', () => {
                    clearTimeout(hideTimeout);
                });
                
                // Hide tooltip when leaving tooltip area
                tooltip.addEventListener('mouseleave', () => {
                    hideTimeout = setTimeout(() => {
                        this.hideTooltip(tooltip);
                    }, 100); // Shorter delay when leaving tooltip
                });
                
                // Toggle tooltip on click
                trigger.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggleTooltip(tooltip, trigger);
                });
            }
        });
    }

    /**
     * Show tooltip
     * @param {HTMLElement} tooltip - Tooltip element
     * @param {HTMLElement} trigger - Trigger element
     */
    showTooltip(tooltip, trigger) {
        const rect = trigger.getBoundingClientRect();
        tooltip.style.display = 'block';
        tooltip.style.position = 'absolute';
        tooltip.style.top = (rect.bottom + window.scrollY + 5) + 'px';
        tooltip.style.left = (rect.left + window.scrollX) + 'px';
        tooltip.style.zIndex = '1000';
    }

    /**
     * Hide tooltip
     * @param {HTMLElement} tooltip - Tooltip element
     */
    hideTooltip(tooltip) {
        tooltip.style.display = 'none';
    }

    /**
     * Toggle tooltip visibility
     * @param {HTMLElement} tooltip - Tooltip element
     * @param {HTMLElement} trigger - Trigger element
     */
    toggleTooltip(tooltip, trigger) {
        if (tooltip.style.display === 'none' || !tooltip.style.display) {
            this.showTooltip(tooltip, trigger);
        } else {
            this.hideTooltip(tooltip);
        }
    }

    /**
     * Hide info section
     */
    hide() {
        this.infoSection.style.display = 'none';
    }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InfoComponent;
}