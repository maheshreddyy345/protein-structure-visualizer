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
        this.selectedResidue = null;
        this.hoveredResidue = null;
    }

    /**
     * Show loading state for structure loading
     */
    showLoadingState() {
        this.viewerContainer.innerHTML = `
            <div class="loading-structure" style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: #666;
            ">
                <div class="loading-message" style="margin-bottom: 1rem; font-size: 1.1rem;">
                    Preparing 3D viewer...
                </div>
                <div class="progress-bar" style="
                    width: 200px;
                    height: 4px;
                    background: #e2e8f0;
                    border-radius: 2px;
                    overflow: hidden;
                    display: none;
                ">
                    <div class="progress-bar-fill" style="
                        height: 100%;
                        background: #0066ff;
                        transition: width 0.3s ease;
                        width: 0%;
                    "></div>
                </div>
            </div>
        `;
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
            
            // Create progress callback for structure loading
            const progressCallback = (progress) => {
                this.updateStructureProgress(progress);
            };
            
            // Fetch PDB structure data from AlphaFold
            const pdbData = await this.apiService.fetchAlphaFoldStructure(uniprotId, progressCallback);
            
            // Render the structure
            this.renderStructure(pdbData);
            
            // Store current protein ID
            this.currentProtein = uniprotId;
            
            // Show the visualization section
            this.visualizationSection.style.display = 'block';
            
            console.log(`Successfully loaded structure for: ${uniprotId}`);
            
        } catch (error) {
            console.error('Error loading structure:', error);
            this.showDetailedError(error, uniprotId);
        }
    }

    /**
     * Show detailed error message
     * @param {Error} error - Error object
     * @param {string} uniprotId - UniProt ID that failed
     */
    showDetailedError(error, uniprotId) {
        this.viewerContainer.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: #721c24;
                background: #f8d7da;
                border-radius: 8px;
                padding: 2rem;
                text-align: center;
            ">
                <h3 style="margin-bottom: 1rem; color: #721c24;">
                    ⚠️ Unable to Load 3D Structure
                </h3>
                <p style="margin-bottom: 1rem;">
                    Could not load the 3D structure for protein <strong>${uniprotId}</strong>
                </p>
                <p style="margin-bottom: 1.5rem; font-size: 0.9rem; color: #856404;">
                    ${error.message || 'An unexpected error occurred'}
                </p>
                <div style="display: flex; gap: 1rem;">
                    <button onclick="location.reload()" style="
                        background: #007bff;
                        color: white;
                        border: none;
                        padding: 0.5rem 1rem;
                        border-radius: 4px;
                        cursor: pointer;
                    ">Try Again</button>
                    <button onclick="this.closest('.section').style.display='none'" style="
                        background: #6c757d;
                        color: white;
                        border: none;
                        padding: 0.5rem 1rem;
                        border-radius: 4px;
                        cursor: pointer;
                    ">Hide Section</button>
                </div>
            </div>
        `;
    }

    /**
     * Update structure loading progress
     * @param {Object} progress - Progress information
     */
    updateStructureProgress(progress) {
        const loadingContainer = this.viewerContainer.querySelector('.loading-structure');
        if (!loadingContainer) return;
        
        const messageElement = loadingContainer.querySelector('.loading-message');
        const progressBar = loadingContainer.querySelector('.progress-bar-fill');
        
        if (messageElement) {
            messageElement.textContent = progress.message || 'Loading structure...';
        }
        
        // Update progress bar for download progress
        if (progress.type === 'download_progress' && progressBar) {
            progressBar.style.width = `${progress.progress}%`;
        }
        
        // Show/hide progress bar based on progress type
        const progressBarContainer = loadingContainer.querySelector('.progress-bar');
        if (progressBarContainer) {
            const showProgressBar = ['structure_download', 'download_progress'].includes(progress.type);
            progressBarContainer.style.display = showProgressBar ? 'block' : 'none';
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
        
        // Create viewer element with explicit dimensions and containment
        const viewerElement = document.createElement('div');
        viewerElement.id = 'mol-viewer';
        viewerElement.style.cssText = `
            width: 100%;
            height: 100%;
            position: relative;
            overflow: hidden;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: white;
        `;
        this.viewerContainer.appendChild(viewerElement);
        
        // Small delay to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        try {
            // Initialize 3Dmol viewer with better configuration
            this.viewer = $3Dmol.createViewer(viewerElement, {
                defaultcolors: $3Dmol.rasmolElementColors,
                backgroundColor: 'white'
            });
            
            // Force the viewer to stay within its container
            const canvas = viewerElement.querySelector('canvas');
            if (canvas) {
                canvas.style.position = 'relative';
                canvas.style.maxWidth = '100%';
                canvas.style.maxHeight = '100%';
            }
            
            console.log('3Dmol.js viewer initialized successfully');
            
            // Trigger containment fix
            if (window.fixViewerContainment) {
                setTimeout(() => {
                    window.fixViewerContainment();
                }, 200);
            }
            
            // Dispatch event for containment fix
            document.dispatchEvent(new CustomEvent('viewerInitialized'));
            
            // Add basic controls
            this.setupControls();
            
            return true;
        } catch (error) {
            console.error('Error creating 3Dmol viewer:', error);
            throw new Error(`Failed to create 3D viewer: ${error.message}`);
        }
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
                <h4>Structural Elements</h4>
                <label data-edu-tooltip="alpha-helix">
                    <input type="checkbox" id="show-helices" checked>
                    Show Alpha Helices
                </label>
                <label data-edu-tooltip="beta-sheet">
                    <input type="checkbox" id="show-sheets" checked>
                    Show Beta Sheets
                </label>
                <label data-edu-tooltip="loop-region">
                    <input type="checkbox" id="show-loops" checked>
                    Show Loops/Coils
                </label>
            </div>
            <div class="control-group">
                <button id="reset-view">Reset View</button>
                <button id="clear-selection">Clear Selection</button>
            </div>
        `;
        
        // Add event listeners for visualization controls
        const styleSelector = document.getElementById('style-selector');
        styleSelector.addEventListener('change', (e) => {
            this.updateVisualizationStyle(e.target.value);
        });

        // Add event listeners for structural element controls
        const helicesToggle = document.getElementById('show-helices');
        const sheetsToggle = document.getElementById('show-sheets');
        const loopsToggle = document.getElementById('show-loops');
        const clearSelectionBtn = document.getElementById('clear-selection');

        if (helicesToggle) {
            helicesToggle.addEventListener('change', (e) => {
                this.toggleStructuralElement('helix', e.target.checked);
            });
        }

        if (sheetsToggle) {
            sheetsToggle.addEventListener('change', (e) => {
                this.toggleStructuralElement('sheet', e.target.checked);
            });
        }

        if (loopsToggle) {
            loopsToggle.addEventListener('change', (e) => {
                this.toggleStructuralElement('loop', e.target.checked);
            });
        }

        if (clearSelectionBtn) {
            clearSelectionBtn.addEventListener('click', () => {
                this.clearSelection();
            });
        }
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
            
            // Validate PDB data
            if (!pdbData.includes('HEADER') || !pdbData.includes('ATOM')) {
                throw new Error('Invalid PDB file format - missing required sections');
            }
            
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
            console.log(`Confidence data parsed: ${this.confidenceData ? this.confidenceData.length : 0} residues`);
            
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
            // Clear existing styles AND surfaces first
            this.viewer.setStyle({}, {});
            this.viewer.removeAllSurfaces();
            
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
            if (style === 'surface') {
                // Surface style needs special handling with addSurface
                this.viewer.setStyle({}, {cartoon: {hidden: true}});
                
                // Create surface with confidence-based coloring
                this.viewer.addSurface($3Dmol.SurfaceType.MS, {
                    opacity: 0.85,
                    colorscheme: {
                        prop: 'b', // Use B-factor (confidence score)
                        map: (val) => {
                            // Map confidence score to color
                            if (val >= 90) return '#0053D6'; // Very High - Dark Blue
                            if (val >= 70) return '#65CBF3'; // Confident - Light Blue  
                            if (val >= 50) return '#FFDB13'; // Low - Yellow
                            return '#FF7D45'; // Very Low - Orange
                        }
                    }
                });
            } else {
                // For cartoon and stick styles, use regular setStyle
                const styleOptions = {};
                
                if (style === 'cartoon') {
                    styleOptions.cartoon = {
                        colorfunc: colorFunction,
                        hidden: false  // Explicitly ensure cartoon is not hidden
                    };
                } else if (style === 'stick') {
                    styleOptions.stick = {
                        colorfunc: colorFunction
                    };
                }
                
                this.viewer.setStyle({}, styleOptions);
            }
            
            // Render with appropriate timing
            if (style === 'surface') {
                // Surface needs more time to generate
                setTimeout(() => {
                    this.viewer.render();
                }, 200);
            } else {
                this.viewer.render();
            }
            
            console.log(`Applied confidence-based ${style} coloring`);
            
        } catch (error) {
            console.error('Error applying confidence coloring:', error);
            // Fallback to spectrum coloring
            this.applyFallbackStyle(style);
        }
    }
    
    /**
     * Apply fallback style when confidence coloring fails
     * @param {string} style - Visualization style
     */
    applyFallbackStyle(style) {
        try {
            // Clear existing styles AND surfaces first
            this.viewer.setStyle({}, {});
            this.viewer.removeAllSurfaces();
            
            if (style === 'surface') {
                // Surface fallback using addSurface
                this.viewer.setStyle({}, {cartoon: {hidden: true}});
                this.viewer.addSurface($3Dmol.SurfaceType.MS, {
                    opacity: 0.8,
                    colorscheme: 'spectrum'
                });
                
                setTimeout(() => {
                    this.viewer.render();
                }, 200);
            } else {
                // For cartoon and stick styles
                const fallbackStyle = {};
                
                if (style === 'cartoon') {
                    fallbackStyle.cartoon = { 
                        color: 'spectrum',
                        hidden: false  // Explicitly ensure cartoon is not hidden
                    };
                } else if (style === 'stick') {
                    fallbackStyle.stick = { 
                        color: 'spectrum' 
                    };
                }
                
                this.viewer.setStyle({}, fallbackStyle);
                this.viewer.render();
            }
            
            console.log(`Applied fallback ${style} style`);
        } catch (error) {
            console.error('Error applying fallback style:', error);
            // Ultimate fallback to cartoon
            if (style !== 'cartoon') {
                this.viewer.setStyle({}, {cartoon: {color: 'spectrum', hidden: false}});
                this.viewer.render();
            }
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
        
        // Setup interactive features
        this.setupInteractiveFeatures();
        
        console.log('Camera controls setup complete');
    }

    /**
     * Setup interactive features for structure exploration
     */
    setupInteractiveFeatures() {
        if (!this.viewer) return;
        
        // Setup hover functionality
        this.viewer.setHoverable({}, true, (atom, viewer, event, container) => {
            this.handleAtomHover(atom, event);
        }, (viewer) => {
            this.handleHoverEnd();
        });
        
        // Setup click functionality
        this.viewer.setClickable({}, true, (atom, viewer, event, container) => {
            this.handleAtomClick(atom, event);
        });
        
        console.log('Interactive features setup complete');
    }

    /**
     * Handle atom hover events
     * @param {Object} atom - 3Dmol atom object
     * @param {Event} event - Mouse event
     */
    handleAtomHover(atom, event) {
        if (!atom || !this.confidenceData) return;
        
        // Find residue data for the hovered atom
        const residueData = this.confidenceData.find(data => 
            data.residueNumber === atom.resi && 
            data.chainId === atom.chain
        );
        
        if (residueData && residueData !== this.hoveredResidue) {
            this.hoveredResidue = residueData;
            this.showResidueTooltip(residueData, event);
        }
    }

    /**
     * Handle end of hover events
     */
    handleHoverEnd() {
        this.hoveredResidue = null;
        this.hideResidueTooltip();
    }

    /**
     * Handle atom click events
     * @param {Object} atom - 3Dmol atom object
     * @param {Event} event - Mouse event
     */
    handleAtomClick(atom, event) {
        if (!atom || !this.confidenceData) return;
        
        // Find residue data for the clicked atom
        const residueData = this.confidenceData.find(data => 
            data.residueNumber === atom.resi && 
            data.chainId === atom.chain
        );
        
        if (residueData) {
            // Clear previous selection
            if (this.selectedResidue) {
                this.clearResidueHighlight(this.selectedResidue);
            }
            
            // Set new selection
            this.selectedResidue = residueData;
            this.highlightResidue(residueData);
            this.showResidueDetails(residueData, event);
            
            console.log(`Selected residue: ${residueData.residueName}${residueData.residueNumber}`);
        }
    }

    /**
     * Show residue tooltip on hover
     * @param {Object} residueData - Residue information
     * @param {Event} event - Mouse event for positioning
     */
    showResidueTooltip(residueData, event) {
        // Remove existing tooltip
        this.hideResidueTooltip();
        
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.id = 'residue-tooltip';
        tooltip.className = 'residue-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-content">
                <strong>${residueData.residueName}${residueData.residueNumber}</strong>
                <div class="tooltip-info">
                    <span>Chain: ${residueData.chainId}</span>
                    <span>Confidence: ${residueData.confidenceScore.toFixed(1)}%</span>
                    <span class="confidence-level ${residueData.confidenceLevel}">
                        ${this.getConfidenceLevelText(residueData.confidenceLevel)}
                    </span>
                </div>
            </div>
        `;
        
        // Position tooltip near mouse cursor
        tooltip.style.position = 'absolute';
        tooltip.style.left = (event.pageX + 10) + 'px';
        tooltip.style.top = (event.pageY - 10) + 'px';
        tooltip.style.zIndex = '1000';
        
        document.body.appendChild(tooltip);
    }

    /**
     * Hide residue tooltip
     */
    hideResidueTooltip() {
        const existingTooltip = document.getElementById('residue-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
    }

    /**
     * Show detailed residue information popup
     * @param {Object} residueData - Residue information
     * @param {Event} event - Mouse event for positioning
     */
    showResidueDetails(residueData, event) {
        // Remove existing popup
        this.hideResidueDetails();
        
        // Create detailed popup
        const popup = document.createElement('div');
        popup.id = 'residue-details-popup';
        popup.className = 'residue-details-popup';
        
        const aminoAcidInfo = this.getAminoAcidInfo(residueData.residueName);
        
        popup.innerHTML = `
            <div class="popup-content">
                <div class="popup-header">
                    <h4>${aminoAcidInfo.fullName} (${residueData.residueName})</h4>
                    <button class="popup-close" onclick="document.getElementById('residue-details-popup').remove()">×</button>
                </div>
                <div class="popup-body">
                    <div class="residue-info-grid">
                        <div class="info-item">
                            <label>Position</label>
                            <span>${residueData.residueNumber}</span>
                        </div>
                        <div class="info-item">
                            <label>Chain</label>
                            <span>${residueData.chainId}</span>
                        </div>
                        <div class="info-item">
                            <label>Confidence Score</label>
                            <span class="confidence-score">${residueData.confidenceScore.toFixed(1)}%</span>
                        </div>
                        <div class="info-item">
                            <label>Confidence Level</label>
                            <span class="confidence-level ${residueData.confidenceLevel}">
                                ${this.getConfidenceLevelText(residueData.confidenceLevel)}
                            </span>
                        </div>
                    </div>
                    <div class="amino-acid-info">
                        <h5>Amino Acid Properties</h5>
                        <div class="properties-grid">
                            <div class="property-item">
                                <label>Type</label>
                                <span>${aminoAcidInfo.type}</span>
                            </div>
                            <div class="property-item">
                                <label>Polarity</label>
                                <span>${aminoAcidInfo.polarity}</span>
                            </div>
                            <div class="property-item">
                                <label>Charge</label>
                                <span>${aminoAcidInfo.charge}</span>
                            </div>
                        </div>
                        <p class="amino-acid-description">${aminoAcidInfo.description}</p>
                    </div>
                    <div class="confidence-explanation">
                        <h5>Confidence Score Meaning</h5>
                        <p>${this.getConfidenceExplanation(residueData.confidenceScore)}</p>
                    </div>
                </div>
            </div>
        `;
        
        // Position popup
        popup.style.position = 'fixed';
        popup.style.left = '50%';
        popup.style.top = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.zIndex = '1001';
        
        document.body.appendChild(popup);
        
        // Add multiple ways to close the popup
        const closeButton = popup.querySelector('.popup-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                popup.remove();
            });
        }
        
        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                popup.remove();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
        
        // Close on click outside
        setTimeout(() => {
            const outsideClickHandler = (event) => {
                if (!popup.contains(event.target)) {
                    popup.remove();
                    document.removeEventListener('click', outsideClickHandler);
                }
            };
            document.addEventListener('click', outsideClickHandler);
        }, 100);
    }

    /**
     * Hide residue details popup
     */
    hideResidueDetails() {
        const existingPopup = document.getElementById('residue-details-popup');
        if (existingPopup) {
            existingPopup.remove();
        }
    }

    /**
     * Handle clicks outside the popup to close it
     * @param {Event} event - Click event
     */
    handlePopupOutsideClick(event) {
        const popup = document.getElementById('residue-details-popup');
        if (popup && !popup.contains(event.target)) {
            popup.remove();
        }
    }

    /**
     * Highlight specific residue
     * @param {Object} residueData - Residue data to highlight
     */
    highlightResidue(residueData) {
        if (!this.viewer || !residueData) return;
        
        try {
            // Create selection for the specific residue
            const selection = {
                resi: residueData.residueNumber,
                chain: residueData.chainId
            };
            
            // Add highlight style (sphere representation with bright color)
            this.viewer.addStyle(selection, {
                sphere: {
                    color: '#FF0000',
                    radius: 1.5,
                    opacity: 0.8
                }
            });
            
            this.viewer.render();
            console.log(`Highlighted residue: ${residueData.residueName}${residueData.residueNumber}`);
            
        } catch (error) {
            console.error('Error highlighting residue:', error);
        }
    }

    /**
     * Clear residue highlight
     * @param {Object} residueData - Residue data to clear highlight from
     */
    clearResidueHighlight(residueData) {
        if (!this.viewer || !residueData) return;
        
        try {
            // Remove sphere style from the specific residue
            const selection = {
                resi: residueData.residueNumber,
                chain: residueData.chainId
            };
            
            this.viewer.removeStyle(selection, { sphere: {} });
            this.viewer.render();
            
            console.log(`Cleared highlight from residue: ${residueData.residueName}${residueData.residueNumber}`);
            
        } catch (error) {
            console.error('Error clearing residue highlight:', error);
        }
    }

    /**
     * Toggle structural elements visibility
     * @param {string} elementType - Type of structural element (helix, sheet, loop)
     * @param {boolean} visible - Whether to show the element
     */
    toggleStructuralElement(elementType, visible) {
        if (!this.viewer) return;
        
        try {
            // Get current style
            const styleSelector = document.getElementById('style-selector');
            const currentStyle = styleSelector ? styleSelector.value : 'cartoon';
            
            // Define secondary structure selections
            let selection = {};
            switch (elementType) {
                case 'helix':
                    selection = { ss: 'h' }; // Alpha helix
                    break;
                case 'sheet':
                    selection = { ss: 's' }; // Beta sheet
                    break;
                case 'loop':
                    selection = { ss: 'c' }; // Coil/loop
                    break;
                default:
                    console.warn(`Unknown structural element type: ${elementType}`);
                    return;
            }
            
            if (visible) {
                // Show the structural element with current style
                const confidenceToggle = document.getElementById('confidence-colors');
                const useConfidenceColors = confidenceToggle ? confidenceToggle.checked : true;
                
                if (useConfidenceColors && this.confidenceData) {
                    // Apply confidence-based coloring
                    const colorFunction = (atom) => {
                        const residueData = this.confidenceData.find(data => 
                            data.residueNumber === atom.resi && 
                            data.chainId === atom.chain
                        );
                        return residueData ? this.getConfidenceColor(residueData.confidenceScore) : '#CCCCCC';
                    };
                    
                    const styleOptions = {};
                    styleOptions[currentStyle] = { colorfunc: colorFunction };
                    if (currentStyle === 'surface') {
                        styleOptions[currentStyle].opacity = 0.8;
                    }
                    
                    this.viewer.addStyle(selection, styleOptions);
                } else {
                    // Use default coloring
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
                    }
                    this.viewer.addStyle(selection, styleOptions);
                }
            } else {
                // Hide the structural element
                this.viewer.removeStyle(selection);
            }
            
            this.viewer.render();
            console.log(`${elementType} ${visible ? 'shown' : 'hidden'}`);
            
        } catch (error) {
            console.error(`Error toggling ${elementType}:`, error);
        }
    }

    /**
     * Clear current selection
     */
    clearSelection() {
        if (this.selectedResidue) {
            this.clearResidueHighlight(this.selectedResidue);
            this.selectedResidue = null;
        }
        
        // Hide any open popups
        this.hideResidueDetails();
        this.hideResidueTooltip();
        
        console.log('Selection cleared');
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
                    <span><strong>Very High (90-100%)</strong><br>Very confident prediction</span>
                    <span class="confidence-count">${stats.veryHigh} residues (${stats.veryHighPercent}%)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #65CBF3;"></div>
                    <span><strong>Confident (70-90%)</strong><br>Generally accurate backbone</span>
                    <span class="confidence-count">${stats.confident} residues (${stats.confidentPercent}%)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #FFDB13;"></div>
                    <span><strong>Low (50-70%)</strong><br>Backbone generally accurate</span>
                    <span class="confidence-count">${stats.low} residues (${stats.lowPercent}%)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #FF7D45;"></div>
                    <span><strong>Very Low (0-50%)</strong><br>Low confidence regions</span>
                    <span class="confidence-count">${stats.veryLow} residues (${stats.veryLowPercent}%)</span>
                </div>
            </div>
            <div class="confidence-stats">
                <p><strong>Overall Statistics:</strong></p>
                <p>Average Confidence: <strong>${stats.averageConfidence}%</strong></p>
                <p>Total Residues: <strong>${stats.totalResidues}</strong></p>
                <p>High Confidence Regions: <strong>${stats.highConfidencePercent}%</strong> (≥70)</p>
            </div>
            <p class="legend-note">
                Colors represent AlphaFold's confidence in the predicted structure. Higher confidence regions are more reliable for structural analysis.
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
            console.log(`Updating visualization style to: ${style}`);
            
            // Clear current style AND surfaces
            this.viewer.setStyle({}, {});
            this.viewer.removeAllSurfaces();
            
            // Check if confidence colors are enabled
            const confidenceToggle = document.getElementById('confidence-colors');
            const useConfidenceColors = confidenceToggle ? confidenceToggle.checked : true;
            
            if (useConfidenceColors && this.confidenceData) {
                // Apply confidence-based coloring with the new style
                this.applyConfidenceColoring(style);
            } else {
                // Apply style with default coloring
                this.applyDefaultStyle(style);
            }
            
            console.log(`Visualization style updated to: ${style}`);
            
        } catch (error) {
            console.error('Error updating visualization style:', error);
            // Try fallback
            this.applyDefaultStyle(style);
        }
    }
    
    /**
     * Apply default style without confidence coloring
     * @param {string} style - Visualization style
     */
    applyDefaultStyle(style) {
        try {
            // Clear existing styles AND surfaces first
            this.viewer.setStyle({}, {});
            this.viewer.removeAllSurfaces();
            
            if (style === 'surface') {
                // Surface style needs special handling with addSurface
                this.viewer.setStyle({}, {cartoon: {hidden: true}});
                
                // Add surface with default spectrum coloring
                this.viewer.addSurface($3Dmol.SurfaceType.MS, {
                    opacity: 0.85,
                    colorscheme: 'whiteCarbon'
                });
            } else {
                // For cartoon and stick styles, use regular setStyle
                const styleOptions = {};
                
                switch (style) {
                    case 'cartoon':
                        styleOptions.cartoon = { 
                            color: 'spectrum',
                            hidden: false  // Explicitly ensure cartoon is not hidden
                        };
                        break;
                    case 'stick':
                        styleOptions.stick = { color: 'spectrum' };
                        break;
                    default:
                        styleOptions.cartoon = { 
                            color: 'spectrum',
                            hidden: false  // Explicitly ensure cartoon is not hidden
                        };
                }
                
                this.viewer.setStyle({}, styleOptions);
            }
            
            // Render with appropriate timing
            if (style === 'surface') {
                // Surface needs more time to generate
                setTimeout(() => {
                    this.viewer.render();
                }, 200);
            } else {
                this.viewer.render();
            }
            
            console.log(`Applied default ${style} style`);
            
        } catch (error) {
            console.error('Error applying default style:', error);
        }
    }

    /**
     * Get confidence level text for display
     * @param {string} level - Confidence level
     * @returns {string} Human-readable confidence level
     */
    getConfidenceLevelText(level) {
        const levelTexts = {
            'very_high': 'Very High',
            'confident': 'Confident',
            'low': 'Low',
            'very_low': 'Very Low'
        };
        return levelTexts[level] || 'Unknown';
    }

    /**
     * Get amino acid information
     * @param {string} residueName - Three-letter amino acid code
     * @returns {Object} Amino acid properties
     */
    getAminoAcidInfo(residueName) {
        const aminoAcids = {
            'ALA': { fullName: 'Alanine', type: 'Nonpolar', polarity: 'Hydrophobic', charge: 'Neutral', description: 'Small, nonpolar amino acid that provides flexibility to protein structures.' },
            'ARG': { fullName: 'Arginine', type: 'Basic', polarity: 'Hydrophilic', charge: 'Positive', description: 'Positively charged amino acid important for protein-protein interactions.' },
            'ASN': { fullName: 'Asparagine', type: 'Polar', polarity: 'Hydrophilic', charge: 'Neutral', description: 'Polar amino acid that can form hydrogen bonds and is often found on protein surfaces.' },
            'ASP': { fullName: 'Aspartic Acid', type: 'Acidic', polarity: 'Hydrophilic', charge: 'Negative', description: 'Negatively charged amino acid important for enzyme active sites and metal binding.' },
            'CYS': { fullName: 'Cysteine', type: 'Polar', polarity: 'Hydrophilic', charge: 'Neutral', description: 'Contains sulfur and can form disulfide bonds that stabilize protein structure.' },
            'GLN': { fullName: 'Glutamine', type: 'Polar', polarity: 'Hydrophilic', charge: 'Neutral', description: 'Polar amino acid that can form hydrogen bonds and is common in protein loops.' },
            'GLU': { fullName: 'Glutamic Acid', type: 'Acidic', polarity: 'Hydrophilic', charge: 'Negative', description: 'Negatively charged amino acid important for enzyme catalysis and protein stability.' },
            'GLY': { fullName: 'Glycine', type: 'Nonpolar', polarity: 'Neutral', charge: 'Neutral', description: 'Smallest amino acid that provides maximum flexibility to protein backbone.' },
            'HIS': { fullName: 'Histidine', type: 'Basic', polarity: 'Hydrophilic', charge: 'Positive', description: 'Can be positively charged and is often found in enzyme active sites.' },
            'ILE': { fullName: 'Isoleucine', type: 'Nonpolar', polarity: 'Hydrophobic', charge: 'Neutral', description: 'Branched, hydrophobic amino acid important for protein core stability.' },
            'LEU': { fullName: 'Leucine', type: 'Nonpolar', polarity: 'Hydrophobic', charge: 'Neutral', description: 'Hydrophobic amino acid commonly found in protein cores and alpha helices.' },
            'LYS': { fullName: 'Lysine', type: 'Basic', polarity: 'Hydrophilic', charge: 'Positive', description: 'Positively charged amino acid important for DNA binding and protein interactions.' },
            'MET': { fullName: 'Methionine', type: 'Nonpolar', polarity: 'Hydrophobic', charge: 'Neutral', description: 'Contains sulfur and is often the first amino acid in protein synthesis.' },
            'PHE': { fullName: 'Phenylalanine', type: 'Nonpolar', polarity: 'Hydrophobic', charge: 'Neutral', description: 'Aromatic amino acid important for protein stability and protein-protein interactions.' },
            'PRO': { fullName: 'Proline', type: 'Nonpolar', polarity: 'Neutral', charge: 'Neutral', description: 'Unique cyclic structure that introduces kinks and turns in protein chains.' },
            'SER': { fullName: 'Serine', type: 'Polar', polarity: 'Hydrophilic', charge: 'Neutral', description: 'Polar amino acid that can be phosphorylated and is important for enzyme regulation.' },
            'THR': { fullName: 'Threonine', type: 'Polar', polarity: 'Hydrophilic', charge: 'Neutral', description: 'Polar amino acid that can be phosphorylated and forms hydrogen bonds.' },
            'TRP': { fullName: 'Tryptophan', type: 'Nonpolar', polarity: 'Hydrophobic', charge: 'Neutral', description: 'Largest amino acid with aromatic ring, important for protein stability.' },
            'TYR': { fullName: 'Tyrosine', type: 'Polar', polarity: 'Hydrophilic', charge: 'Neutral', description: 'Aromatic amino acid that can be phosphorylated and is important for signaling.' },
            'VAL': { fullName: 'Valine', type: 'Nonpolar', polarity: 'Hydrophobic', charge: 'Neutral', description: 'Branched, hydrophobic amino acid important for protein core structure.' }
        };

        return aminoAcids[residueName] || {
            fullName: 'Unknown', type: 'Unknown', polarity: 'Unknown', charge: 'Unknown', description: 'Unknown amino acid type.'
        };
    }

    /**
     * Get confidence explanation based on score
     * @param {number} score - Confidence score
     * @returns {string} Explanation of the confidence score
     */
    getConfidenceExplanation(score) {
        if (score >= 90) {
            return 'Very high confidence: The predicted structure is very reliable and can be used with confidence for most applications.';
        } else if (score >= 70) {
            return 'Confident: The backbone prediction is generally accurate, though some side chain positions may be uncertain.';
        } else if (score >= 50) {
            return 'Low confidence: The backbone is generally accurate, but the overall structure should be treated with caution.';
        } else {
            return 'Very low confidence: This region has high uncertainty and should not be used for detailed structural analysis.';
        }
    }

    /**
     * Show loading state with progress tracking
     */
    showLoadingState() {
        this.viewerContainer.innerHTML = `
            <div class="loading-structure">
                <div class="spinner"></div>
                <p class="loading-message">Initializing 3D viewer...</p>
                <div class="progress-bar" style="display: none;">
                    <div class="progress-bar-fill" style="width: 0%;"></div>
                </div>
                <div class="loading-details">
                    <small>This may take a moment for large protein structures</small>
                </div>
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
     * Show detailed error with user guidance for structure loading
     * @param {Error} error - Error object
     * @param {string} uniprotId - UniProt ID that failed
     */
    showDetailedError(error, uniprotId) {
        let errorMessage = error.message || 'Failed to load protein structure';
        let userAction = 'Please try again or select a different protein.';
        let suggestions = [];
        let isStructureUnavailable = false;

        // Provide specific guidance based on error type
        if (error.message && error.message.includes('No AlphaFold structure available')) {
            isStructureUnavailable = true;
            userAction = 'This protein structure is not available in the AlphaFold database.';
            suggestions = [
                'Try a different protein that may have a predicted structure',
                'Check the AlphaFold database directly for availability',
                'Some proteins may not be included due to size or complexity limitations'
            ];
        } else if (error.message && error.message.includes('Invalid PDB file format')) {
            userAction = 'The downloaded structure file appears to be corrupted.';
            suggestions = [
                'Try downloading the structure again',
                'Check your internet connection stability',
                'Contact support if the problem persists'
            ];
        } else if (error.message && error.message.includes('network') || error.message.includes('connection')) {
            userAction = 'Please check your internet connection and try again.';
            suggestions = [
                'Check your internet connection',
                'Try refreshing the page',
                'Large structure files may take longer to download'
            ];
        } else if (error.message && error.message.includes('timeout') || error.message.includes('timed out')) {
            userAction = 'The structure download timed out. This may be due to a large file size.';
            suggestions = [
                'Try again - large structures can take time to download',
                'Check your internet connection speed',
                'Wait a moment and retry'
            ];
        } else if (error.message && error.message.includes('3Dmol')) {
            userAction = 'There was a problem with the 3D visualization library.';
            suggestions = [
                'Try refreshing the page',
                'Check if your browser supports WebGL',
                'Update your browser to the latest version'
            ];
        }

        this.viewerContainer.innerHTML = `
            <div class="viewer-error-detailed">
                <div class="error-header">
                    <div class="error-icon">${isStructureUnavailable ? '📊' : '⚠️'}</div>
                    <h3>${isStructureUnavailable ? 'Structure Not Available' : 'Structure Loading Error'}</h3>
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
                        ${isStructureUnavailable ? `
                            <p><strong>Note:</strong> AlphaFold provides predicted structures for millions of proteins, 
                            but not all proteins are included. Coverage focuses on model organisms and proteins of 
                            scientific interest.</p>
                        ` : ''}
                    </div>
                </div>
                <div class="error-actions">
                    ${!isStructureUnavailable ? `
                        <button class="retry-btn" onclick="window.proteinApp.visualizerComponent.loadStructure('${uniprotId}')">
                            Try Again
                        </button>
                    ` : ''}
                    <button class="close-btn" onclick="this.closest('.viewer-error-detailed').parentElement.parentElement.style.display='none'">
                        Close
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Get confidence level text for display
     * @param {string} level - Confidence level
     * @returns {string} Human-readable text
     */
    getConfidenceLevelText(level) {
        const levelTexts = {
            'very_high': 'Very High Confidence',
            'confident': 'Confident',
            'low': 'Low Confidence',
            'very_low': 'Very Low Confidence'
        };
        return levelTexts[level] || 'Unknown';
    }

    /**
     * Get confidence explanation for a score
     * @param {number} score - Confidence score
     * @returns {string} Explanation text
     */
    getConfidenceExplanation(score) {
        if (score >= 90) {
            return 'This region is predicted with very high accuracy. The backbone and side chain positions are highly reliable and can be trusted for detailed structural analysis.';
        } else if (score >= 70) {
            return 'This region has a confident prediction. The backbone is likely correct, but some side chain positions may be less accurate. Good for understanding overall protein architecture.';
        } else if (score >= 50) {
            return 'This region has low confidence. The general fold is likely correct, but specific atomic positions should be interpreted with caution.';
        } else {
            return 'This region has very low confidence and may be disordered or the prediction may be unreliable. Use with extreme caution.';
        }
    }

    /**
     * Get amino acid information
     * @param {string} residueName - Three-letter amino acid code
     * @returns {Object} Amino acid information
     */
    getAminoAcidInfo(residueName) {
        const aminoAcids = {
            'ALA': {
                fullName: 'Alanine',
                type: 'Nonpolar',
                polarity: 'Hydrophobic',
                charge: 'Neutral',
                description: 'Small, simple amino acid often found in protein cores and flexible regions.'
            },
            'ARG': {
                fullName: 'Arginine',
                type: 'Basic',
                polarity: 'Hydrophilic',
                charge: 'Positive',
                description: 'Large, positively charged amino acid often involved in protein-protein interactions.'
            },
            'ASN': {
                fullName: 'Asparagine',
                type: 'Polar',
                polarity: 'Hydrophilic',
                charge: 'Neutral',
                description: 'Polar amino acid that can form hydrogen bonds, often found on protein surfaces.'
            },
            'ASP': {
                fullName: 'Aspartic Acid',
                type: 'Acidic',
                polarity: 'Hydrophilic',
                charge: 'Negative',
                description: 'Negatively charged amino acid often involved in enzyme active sites and metal binding.'
            },
            'CYS': {
                fullName: 'Cysteine',
                type: 'Polar',
                polarity: 'Hydrophilic',
                charge: 'Neutral',
                description: 'Contains sulfur and can form disulfide bonds, important for protein stability.'
            },
            'GLN': {
                fullName: 'Glutamine',
                type: 'Polar',
                polarity: 'Hydrophilic',
                charge: 'Neutral',
                description: 'Polar amino acid that can form hydrogen bonds, often found in protein loops.'
            },
            'GLU': {
                fullName: 'Glutamic Acid',
                type: 'Acidic',
                polarity: 'Hydrophilic',
                charge: 'Negative',
                description: 'Negatively charged amino acid often involved in enzyme catalysis and protein interactions.'
            },
            'GLY': {
                fullName: 'Glycine',
                type: 'Nonpolar',
                polarity: 'Neutral',
                charge: 'Neutral',
                description: 'Smallest amino acid, provides flexibility and is often found in protein turns.'
            },
            'HIS': {
                fullName: 'Histidine',
                type: 'Basic',
                polarity: 'Hydrophilic',
                charge: 'Positive',
                description: 'Can be positively charged, often found in enzyme active sites and metal binding.'
            },
            'ILE': {
                fullName: 'Isoleucine',
                type: 'Nonpolar',
                polarity: 'Hydrophobic',
                charge: 'Neutral',
                description: 'Branched hydrophobic amino acid often found in protein cores.'
            },
            'LEU': {
                fullName: 'Leucine',
                type: 'Nonpolar',
                polarity: 'Hydrophobic',
                charge: 'Neutral',
                description: 'Hydrophobic amino acid commonly found in protein cores and alpha helices.'
            },
            'LYS': {
                fullName: 'Lysine',
                type: 'Basic',
                polarity: 'Hydrophilic',
                charge: 'Positive',
                description: 'Positively charged amino acid often found on protein surfaces and in binding sites.'
            },
            'MET': {
                fullName: 'Methionine',
                type: 'Nonpolar',
                polarity: 'Hydrophobic',
                charge: 'Neutral',
                description: 'Contains sulfur and is often the first amino acid in proteins (start codon).'
            },
            'PHE': {
                fullName: 'Phenylalanine',
                type: 'Nonpolar',
                polarity: 'Hydrophobic',
                charge: 'Neutral',
                description: 'Large aromatic amino acid often found in protein cores and binding sites.'
            },
            'PRO': {
                fullName: 'Proline',
                type: 'Nonpolar',
                polarity: 'Neutral',
                charge: 'Neutral',
                description: 'Unique cyclic structure that introduces kinks in protein chains and breaks helices.'
            },
            'SER': {
                fullName: 'Serine',
                type: 'Polar',
                polarity: 'Hydrophilic',
                charge: 'Neutral',
                description: 'Small polar amino acid that can be phosphorylated and is often found in active sites.'
            },
            'THR': {
                fullName: 'Threonine',
                type: 'Polar',
                polarity: 'Hydrophilic',
                charge: 'Neutral',
                description: 'Polar amino acid that can be phosphorylated and forms hydrogen bonds.'
            },
            'TRP': {
                fullName: 'Tryptophan',
                type: 'Nonpolar',
                polarity: 'Hydrophobic',
                charge: 'Neutral',
                description: 'Largest amino acid with an aromatic ring, often found in protein-membrane interfaces.'
            },
            'TYR': {
                fullName: 'Tyrosine',
                type: 'Polar',
                polarity: 'Hydrophilic',
                charge: 'Neutral',
                description: 'Aromatic amino acid that can be phosphorylated and is involved in signaling.'
            },
            'VAL': {
                fullName: 'Valine',
                type: 'Nonpolar',
                polarity: 'Hydrophobic',
                charge: 'Neutral',
                description: 'Branched hydrophobic amino acid often found in protein cores and beta sheets.'
            }
        };

        return aminoAcids[residueName] || {
            fullName: 'Unknown',
            type: 'Unknown',
            polarity: 'Unknown',
            charge: 'Unknown',
            description: 'Unknown amino acid residue.'
        };
    }

    /**
     * Hide visualization section
     */
    hide() {
        if (this.visualizationSection) {
            this.visualizationSection.style.display = 'none';
        }
        
        // Clear current protein
        this.currentProtein = null;
        
        // Clear selection
        this.selectedResidue = null;
        this.hoveredResidue = null;
        
        // Hide tooltips and popups
        this.hideResidueTooltip();
        this.hideResidueDetails();
    }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VisualizerComponent;
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VisualizerComponent;
}