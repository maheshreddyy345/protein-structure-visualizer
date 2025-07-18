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
            
            // Fetch protein metadata from UniProt API
            const proteinData = await this.apiService.getProteinMetadata(uniprotId);
            this.displayProteinDetails(proteinData);
            
        } catch (error) {
            console.error('Error fetching protein info:', error);
            this.showError(`Failed to load protein information: ${error.message}`);
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
                    <span class="uniprot-id-badge">${proteinData.uniprotId}</span>
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
     * Initialize tooltip functionality
     */
    initializeTooltips() {
        const tooltipTriggers = this.infoContainer.querySelectorAll('.tooltip-trigger');
        
        tooltipTriggers.forEach(trigger => {
            const tooltipId = trigger.getAttribute('data-tooltip');
            const tooltip = document.getElementById(tooltipId);
            
            if (tooltip) {
                trigger.addEventListener('mouseenter', () => {
                    this.showTooltip(tooltip, trigger);
                });
                
                trigger.addEventListener('mouseleave', () => {
                    this.hideTooltip(tooltip);
                });
                
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