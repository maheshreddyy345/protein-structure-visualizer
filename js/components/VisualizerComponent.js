/**
 * Visualizer component for handling 3D protein structure visualization
 */
class VisualizerComponent {
    constructor(apiService) {
        this.apiService = apiService;
        this.visualizationSection = document.getElementById('visualization-section');
        this.viewerContainer = document.getElementById('viewer-container');
        this.controlsContainer = document.getElementById('visualization-controls');
        this.legendContainer = document.getElementById('confidence-legend');
        this.viewer = null;
        this.currentProtein = null;
    }

    /**
     * Load and render protein structure
     * @param {string} uniprotId - UniProt ID
     */
    async loadStructure(uniprotId) {
        console.log(`Loading structure for: ${uniprotId}`);
        
        try {
            // Show loading state
            this.showLoadingState();
            
            // Initialize viewer first
            await this.initializeViewer();
            
            // Fetch PDB structure data from AlphaFold
            const pdbData = await this.apiService.fetchAlphaFoldStructure(uniprotId);
            
            // Render the structure
            this.renderStructure(pdbData);
            
            // Store current protein ID
            this.currentProtein = uniprotId;
            
            // Show the visualization section
            this.visualizationSection.style.display = 'block';
            
            console.log(`Successfully loaded structure for: ${uniprotId}`);
            
        } catch (error) {
            console.error('Error loading structure:', error);
            this.showError(error.message || 'Failed to load protein structure');
        }
    }

    /**
     * Initialize 3Dmol.js viewer
     */
    async initializeViewer() {
        // Check if 3Dmol is available
        if (typeof $3Dmol === 'undefined') {
            throw new Error('3Dmol.js library not loaded');
        }
        
        // Clear existing viewer
        this.viewerContainer.innerHTML = '';
        
        // Create viewer element
        const viewerElement = document.createElement('div');
        viewerElement.id = 'mol-viewer';
        viewerElement.style.width = '100%';
        viewerElement.style.height = '100%';
        this.viewerContainer.appendChild(viewerElement);
        
        // Initialize 3Dmol viewer
        this.viewer = $3Dmol.createViewer(viewerElement, {
            defaultcolors: $3Dmol.rasmolElementColors
        });
        
        console.log('3Dmol.js viewer initialized successfully');
        
        // Add basic controls
        this.setupControls();
    }

    /**
     * Setup visualization controls
     */
    setupControls() {
        this.controlsContainer.innerHTML = `
            <h3>Visualization Controls</h3>
            <div class="control-group">
                <label>Style:</label>
                <select id="style-selector">
                    <option value="cartoon">Cartoon</option>
                    <option value="surface">Surface</option>
                    <option value="stick">Stick</option>
                </select>
            </div>
            <div class="control-group">
                <label>
                    <input type="checkbox" id="confidence-colors" checked>
                    Show Confidence Colors
                </label>
            </div>
            <div class="control-group">
                <button id="reset-view">Reset View</button>
            </div>
        `;
        
        // Add event listeners for visualization controls
        const styleSelector = document.getElementById('style-selector');
        styleSelector.addEventListener('change', (e) => {
            this.updateVisualizationStyle(e.target.value);
        });
    }

    /**
     * Render protein structure
     * @param {string} pdbData - PDB file content
     */
    renderStructure(pdbData) {
        if (!this.viewer) {
            throw new Error('3Dmol viewer not initialized');
        }
        
        if (!pdbData || typeof pdbData !== 'string') {
            throw new Error('Invalid PDB data provided');
        }
        
        try {
            // Clear any existing models
            this.viewer.clear();
            
            // Add the PDB data to the viewer
            this.viewer.addModel(pdbData, 'pdb');
            
            // Parse confidence scores from PDB data
            this.confidenceData = this.parseConfidenceScores(pdbData);
            
            // Set default cartoon style with confidence-based coloring
            this.applyConfidenceColoring('cartoon');
            
            // Set up basic lighting and background
            this.viewer.setBackgroundColor('white');
            
            // Zoom to fit the structure
            this.viewer.zoomTo();
            
            // Render the scene
            this.viewer.render();
            
            // Setup camera controls and interactions
            this.setupCameraControls();
            
            // Show confidence legend
            this.showConfidenceLegend();
            
            console.log('Protein structure rendered successfully');
            console.log(`Confidence data parsed: ${this.confidenceData.length} residues`);
            
        } catch (error) {
            console.error('Error rendering structure:', error);
            throw new Error('Failed to render protein structure: ' + error.message);
        }
    }

    /**
     * Parse confidence scores from PDB B-factor data
     * @param {string} pdbData - PDB file content
     * @returns {Array} Array of confidence data for each residue
     */
    parseConfidenceScores(pdbData) {
        const confidenceData = [];
        const lines = pdbData.split('\n');
        
        for (const line of lines) {
            // Parse ATOM records which contain B-factor (confidence) data
            if (line.startsWith('ATOM') && line.length >= 66) {
                try {
                    // Extract relevant fields from PDB ATOM record
                    const atomName = line.substring(12, 16).trim();
                    const residueName = line.substring(17, 20).trim();
                    const chainId = line.substring(21, 22).trim();
                    const residueNumber = parseInt(line.substring(22, 26).trim());
                    const bFactor = parseFloat(line.substring(60, 66).trim());
                    
                    // Only process CA (alpha carbon) atoms to avoid duplicates
                    if (atomName === 'CA' && !isNaN(bFactor) && !isNaN(residueNumber)) {
                        confidenceData.push({
                            residueNumber,
                            residueName,
                            chainId,
                            bFactor,
                            confidenceScore: bFactor, // In AlphaFold PDBs, B-factor = confidence score
                            confidenceLevel: this.getConfidenceLevel(bFactor)
                        });
                    }
                } catch (error) {
                    // Skip malformed lines
                    continue;
                }
            }
        }
        
        console.log(`Parsed confidence data for ${confidenceData.length} residues`);
        return confidenceData;
    }

    /**
     * Get confidence level from score
     * @param {number} score - Confidence score (0-100)
     * @returns {string} Confidence level
     */
    getConfidenceLevel(score) {
        if (score >= 90) return 'very_high';
        if (score >= 70) return 'confident';
        if (score >= 50) return 'low';
        return 'very_low';
    }

    /**
     * Get color for confidence score
     * @param {number} score - Confidence score (0-100)
     * @returns {string} Hex color code
     */
    getConfidenceColor(score) {
        // AlphaFold color scheme
        if (score >= 90) return '#0053D6'; // Very High - Dark Blue
        if (score >= 70) return '#65CBF3'; // Confident - Light Blue
        if (score >= 50) return '#FFDB13'; // Low - Yellow
        return '#FF7D45'; // Very Low - Orange
    }

    /**
     * Apply confidence-based coloring to the structure
     * @param {string} style - Visualization style (cartoon, surface, stick)
     */
    applyConfidenceColoring(style) {
        if (!this.viewer || !this.confidenceData) return;
        
        try {
            // Create color function based on confidence scores
            const colorFunction = (atom) => {
                // Find confidence data for this residue
                const residueData = this.confidenceData.find(data => 
                    data.residueNumber === atom.resi && 
                    data.chainId === atom.chain
                );
                
                if (residueData) {
                    return this.getConfidenceColor(residueData.confidenceScore);
                }
                
                // Default color for residues without confidence data
                return '#CCCCCC';
            };
            
            // Apply the style with confidence-based coloring
            const styleOptions = {};
            styleOptions[style] = {
                colorfunc: colorFunction
            };
            
            // Add opacity for surface style
            if (style === 'surface') {
                styleOptions[style].opacity = 0.8;
            }
            
            this.viewer.setStyle({}, styleOptions);
            console.log(`Applied confidence-based ${style} coloring`);
            
        } catch (error) {
            console.error('Error applying confidence coloring:', error);
            // Fallback to spectrum coloring
            const fallbackStyle = {};
            fallbackStyle[style] = { color: 'spectrum' };
            this.viewer.setStyle({}, fallbackStyle);
        }
    }

    /**
     * Setup camera controls and interactions
     */
    setupCameraControls() {
        if (!this.viewer) return;
        
        // 3Dmol.js automatically provides mouse controls:
        // - Left click + drag: rotate
        // - Right click + drag: translate/pan
        // - Mouse wheel: zoom
        
        // Add reset view functionality
        const resetButton = document.getElementById('reset-view');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                this.resetView();
            });
        }
        
        // Add style selector functionality
        const styleSelector = document.getElementById('style-selector');
        if (styleSelector) {
            styleSelector.addEventListener('change', (e) => {
                this.updateVisualizationStyle(e.target.value);
            });
        }
        
        // Add confidence colors toggle
        const confidenceToggle = document.getElementById('confidence-colors');
        if (confidenceToggle) {
            confidenceToggle.addEventListener('change', (e) => {
                this.toggleConfidenceColors(e.target.checked);
            });
        }
        
        console.log('Camera controls setup complete');
    }

    /**
     * Reset camera view to default position
     */
    resetView() {
        if (!this.viewer) return;
        
        try {
            this.viewer.zoomTo();
            this.viewer.render();
            console.log('View reset to default position');
        } catch (error) {
            console.error('Error resetting view:', error);
        }
    }

    /**
     * Show confidence legend with statistics
     */
    showConfidenceLegend() {
        this.legendContainer.style.display = 'block';
        
        // Calculate confidence statistics
        const stats = this.calculateConfidenceStatistics();
        
        this.legendContainer.innerHTML = `
            <h3>Confidence Score Legend</h3>
            <div class="legend-content">
                <div class="legend-item">
                    <div class="legend-color" style="background: #0053D6;"></div>
                    <span>Very High (90-100): Very confident prediction</span>
                    <span class="confidence-count">${stats.veryHigh} residues (${stats.veryHighPercent}%)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #65CBF3;"></div>
                    <span>Confident (70-90): Generally accurate backbone</span>
                    <span class="confidence-count">${stats.confident} residues (${stats.confidentPercent}%)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #FFDB13;"></div>
                    <span>Low (50-70): Backbone generally accurate</span>
                    <span class="confidence-count">${stats.low} residues (${stats.lowPercent}%)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #FF7D45;"></div>
                    <span>Very Low (0-50): Low confidence regions</span>
                    <span class="confidence-count">${stats.veryLow} residues (${stats.veryLowPercent}%)</span>
                </div>
            </div>
            <div class="confidence-stats">
                <p><strong>Overall Statistics:</strong></p>
                <p>Average Confidence: ${stats.averageConfidence}%</p>
                <p>Total Residues: ${stats.totalResidues}</p>
                <p>High Confidence Regions: ${stats.highConfidencePercent}% (≥70)</p>
            </div>
            <p class="legend-note">
                Colors represent AlphaFold's confidence in the predicted structure.
                Higher confidence regions are more reliable for structural analysis.
            </p>
        `;
    }

    /**
     * Calculate confidence statistics from parsed data
     * @returns {Object} Statistics about confidence distribution
     */
    calculateConfidenceStatistics() {
        if (!this.confidenceData || this.confidenceData.length === 0) {
            return {
                veryHigh: 0, confident: 0, low: 0, veryLow: 0,
                veryHighPercent: 0, confidentPercent: 0, lowPercent: 0, veryLowPercent: 0,
                averageConfidence: 0, totalResidues: 0, highConfidencePercent: 0
            };
        }

        const total = this.confidenceData.length;
        let veryHigh = 0, confident = 0, low = 0, veryLow = 0;
        let totalScore = 0;

        this.confidenceData.forEach(residue => {
            const score = residue.confidenceScore;
            totalScore += score;

            if (score >= 90) veryHigh++;
            else if (score >= 70) confident++;
            else if (score >= 50) low++;
            else veryLow++;
        });

        const averageConfidence = Math.round(totalScore / total * 10) / 10;
        const highConfidenceCount = veryHigh + confident;
        const highConfidencePercent = Math.round((highConfidenceCount / total) * 100);

        return {
            veryHigh,
            confident,
            low,
            veryLow,
            veryHighPercent: Math.round((veryHigh / total) * 100),
            confidentPercent: Math.round((confident / total) * 100),
            lowPercent: Math.round((low / total) * 100),
            veryLowPercent: Math.round((veryLow / total) * 100),
            averageConfidence,
            totalResidues: total,
            highConfidencePercent
        };
    }

    /**
     * Toggle confidence-based coloring
     * @param {boolean} enabled - Whether to show confidence colors
     */
    toggleConfidenceColors(enabled) {
        if (!this.viewer) return;
        
        try {
            // Get current style from the style selector
            const styleSelector = document.getElementById('style-selector');
            const currentStyle = styleSelector ? styleSelector.value : 'cartoon';
            
            if (enabled) {
                // Apply confidence-based coloring
                this.applyConfidenceColoring(currentStyle);
            } else {
                // Use single color based on style
                const styleOptions = {};
                switch (currentStyle) {
                    case 'cartoon':
                        styleOptions.cartoon = { color: 'lightblue' };
                        break;
                    case 'surface':
                        styleOptions.surface = { color: 'lightblue', opacity: 0.8 };
                        break;
                    case 'stick':
                        styleOptions.stick = { color: 'lightblue' };
                        break;
                    default:
                        styleOptions.cartoon = { color: 'lightblue' };
                }
                this.viewer.setStyle({}, styleOptions);
            }
            
            this.viewer.render();
            console.log(`Confidence colors ${enabled ? 'enabled' : 'disabled'}`);
        } catch (error) {
            console.error('Error toggling confidence colors:', error);
        }
    }

    /**
     * Update visualization style
     * @param {string} style - Visualization style (cartoon, surface, stick)
     */
    updateVisualizationStyle(style) {
        if (!this.viewer) return;
        
        try {
            // Clear current style
            this.viewer.setStyle({}, {});
            
            // Check if confidence colors are enabled
            const confidenceToggle = document.getElementById('confidence-colors');
            const useConfidenceColors = confidenceToggle ? confidenceToggle.checked : true;
            
            if (useConfidenceColors && this.confidenceData) {
                // Apply confidence-based coloring with the new style
                this.applyConfidenceColoring(style);
            } else {
                // Apply style with default coloring
                const styleOptions = {};
                switch (style) {
                    case 'cartoon':
                        styleOptions.cartoon = { color: 'lightblue' };
                        break;
                    case 'surface':
                        styleOptions.surface = { color: 'lightblue', opacity: 0.8 };
                        break;
                    case 'stick':
                        styleOptions.stick = { color: 'lightblue' };
                        break;
                    default:
                        styleOptions.cartoon = { color: 'lightblue' };
                }
                this.viewer.setStyle({}, styleOptions);
            }
            
            this.viewer.render();
            console.log(`Visualization style updated to: ${style}`);
            
        } catch (error) {
            console.error('Error updating visualization style:', error);
        }
    }

    /**
     * Highlight specific residue
     * @param {number} residueId - Residue ID to highlight
     */
    highlightResidue(residueId) {
        // Implementation will be added in later tasks
        console.log(`Highlighting residue: ${residueId}`);
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        this.viewerContainer.innerHTML = `
            <div class="viewer-loading">
                <div class="spinner"></div>
                <p>Loading 3D structure...</p>
            </div>
        `;
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.viewerContainer.innerHTML = `
            <div class="viewer-error">
                <p>${message}</p>
                <button onclick="this.parentElement.parentElement.style.display='none'">
                    Close
                </button>
            </div>
        `;
    }

    /**
     * Hide visualization section
     */
    hide() {
        this.visualizationSection.style.display = 'none';
    }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VisualizerComponent;
}