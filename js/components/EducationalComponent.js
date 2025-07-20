/**
 * Educational component for providing user guidance and explanations
 */
class EducationalComponent {
    constructor() {
        this.tooltips = new Map();
        this.glossaryTerms = this.initializeGlossaryTerms();
        this.hideTimeout = null;
        
        this.initializeEducationalFeatures();
    }

    /**
     * Initialize educational features
     */
    initializeEducationalFeatures() {
        try {
            this.createGlossaryModal();
            this.setupGlobalTooltipSystem();
            this.addEducationalButtons();
            this.setupKeyboardShortcuts();
            console.log('Educational features initialized successfully');
        } catch (error) {
            console.error('Error initializing educational features:', error);
            // Continue without educational features rather than breaking the app
        }
    }

    /**
     * Initialize glossary terms with definitions
     * @returns {Map} Map of terms and their definitions
     */
    initializeGlossaryTerms() {
        const terms = new Map();
        
        terms.set('protein', {
            definition: 'Large molecules composed of amino acids that perform essential functions in living organisms.',
            category: 'Basic Concepts'
        });
        
        terms.set('amino acid', {
            definition: 'The building blocks of proteins. There are 20 standard amino acids, each with unique properties.',
            category: 'Basic Concepts'
        });
        
        terms.set('alpha helix', {
            definition: 'A common secondary structure where the protein backbone forms a right-handed spiral stabilized by hydrogen bonds.',
            category: 'Secondary Structure'
        });
        
        terms.set('beta sheet', {
            definition: 'A secondary structure where protein strands are arranged side-by-side, connected by hydrogen bonds.',
            category: 'Secondary Structure'
        });
        
        terms.set('confidence score', {
            definition: 'A measure (0-100) indicating how reliable AlphaFold\'s structure prediction is for each residue.',
            category: 'AlphaFold'
        });
        
        terms.set('alphafold', {
            definition: 'An AI system developed by DeepMind that predicts protein structures with high accuracy.',
            category: 'AlphaFold'
        });
        
        return terms;
    }

    /**
     * Create glossary modal
     */
    createGlossaryModal() {
        const modal = document.createElement('div');
        modal.id = 'glossary-modal';
        modal.className = 'educational-modal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            justify-content: center;
            align-items: center;
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="
                background: white;
                padding: 2rem;
                border-radius: 8px;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                margin: 20px;
            ">
                <div class="modal-header" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 1rem;
                ">
                    <h2 style="margin: 0;">Protein Structure Glossary</h2>
                    <button class="modal-close" onclick="document.getElementById('glossary-modal').remove()" style="
                        background: #ef4444 !important;
                        color: white !important;
                        border: none !important;
                        font-size: 18px !important;
                        cursor: pointer !important;
                        width: 30px !important;
                        height: 30px !important;
                        border-radius: 50% !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        font-weight: bold !important;
                    ">×</button>
                </div>
                <div id="glossary-content" class="glossary-content">
                    <!-- Terms will be populated here -->
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.populateGlossary();
        
        // Add multiple ways to close the modal
        const closeButton = modal.querySelector('.modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                modal.remove();
            });
        }
        
        // Close on click outside modal content
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    /**
     * Populate glossary with terms
     */
    populateGlossary() {
        const glossaryContent = document.getElementById('glossary-content');
        if (!glossaryContent) return;
        
        const terms = Array.from(this.glossaryTerms.entries()).sort(([a], [b]) => a.localeCompare(b));
        
        glossaryContent.innerHTML = terms.map(([term, data]) => `
            <div style="margin-bottom: 1.5rem; padding: 1rem; border: 1px solid #eee; border-radius: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <h4 style="margin: 0; color: #333;">${this.capitalizeWords(term)}</h4>
                    <span style="background: #f0f0f0; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">${data.category}</span>
                </div>
                <p style="margin: 0; color: #666;">${data.definition}</p>
            </div>
        `).join('');
    }

    /**
     * Setup global tooltip system
     */
    setupGlobalTooltipSystem() {
        try {
            // Create tooltip container
            const tooltipContainer = document.createElement('div');
            tooltipContainer.id = 'educational-tooltip';
            tooltipContainer.style.cssText = `
                display: none;
                position: absolute;
                background: #333;
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 14px;
                max-width: 300px;
                z-index: 1000;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            `;
            document.body.appendChild(tooltipContainer);
            
            // Setup event delegation for tooltip triggers
            document.addEventListener('mouseenter', (e) => {
                if (e.target.hasAttribute('data-edu-tooltip')) {
                    clearTimeout(this.hideTimeout);
                    this.showEducationalTooltip(e.target, e.target.getAttribute('data-edu-tooltip'));
                }
            }, true);
            
            document.addEventListener('mouseleave', (e) => {
                if (e.target.hasAttribute('data-edu-tooltip')) {
                    this.hideTimeout = setTimeout(() => {
                        this.hideEducationalTooltip();
                    }, 300);
                }
            }, true);
        } catch (error) {
            console.error('Error setting up tooltip system:', error);
        }
    }

    /**
     * Show educational tooltip
     */
    showEducationalTooltip(trigger, contentKey) {
        const tooltip = document.getElementById('educational-tooltip');
        if (!tooltip) return;
        
        const content = this.getTooltipContent(contentKey);
        if (!content) return;
        
        tooltip.innerHTML = `<strong>${content.title}</strong><br>${content.description}`;
        
        // Position tooltip
        const rect = trigger.getBoundingClientRect();
        tooltip.style.display = 'block';
        tooltip.style.left = (rect.left + window.scrollX) + 'px';
        tooltip.style.top = (rect.bottom + window.scrollY + 5) + 'px';
    }

    /**
     * Hide educational tooltip
     */
    hideEducationalTooltip() {
        const tooltip = document.getElementById('educational-tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }

    /**
     * Get tooltip content by key
     */
    getTooltipContent(key) {
        const tooltipContents = {
            'confidence-score': {
                title: 'Confidence Score',
                description: 'Indicates how reliable AlphaFold\'s prediction is for each part of the protein (0-100%).'
            },
            'alpha-helix': {
                title: 'Alpha Helix',
                description: 'A spiral protein structure stabilized by hydrogen bonds.'
            },
            'beta-sheet': {
                title: 'Beta Sheet',
                description: 'Extended protein strands arranged side-by-side in a sheet-like structure.'
            },
            'protein-visualization': {
                title: 'Protein Visualization',
                description: 'Different ways to display protein structures (cartoon, surface, stick).'
            }
        };
        
        return tooltipContents[key] || null;
    }

    /**
     * Add educational buttons to the interface
     */
    addEducationalButtons() {
        try {
            // Add help button to header
            const header = document.querySelector('header');
            if (header) {
                const helpButton = document.createElement('button');
                helpButton.id = 'help-button';
                helpButton.innerHTML = '? Help';
                helpButton.style.cssText = `
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: rgba(255,255,255,0.9) !important;
                    color: #1a365d !important;
                    border: 2px solid rgba(255,255,255,0.8) !important;
                    padding: 10px 18px !important;
                    border-radius: 25px !important;
                    cursor: pointer !important;
                    font-weight: bold !important;
                    font-size: 14px !important;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
                    z-index: 1000 !important;
                `;
                helpButton.onclick = () => this.showHelpOverlay();
                helpButton.onmouseover = () => {
                    helpButton.style.background = 'rgba(255,255,255,1) !important';
                    helpButton.style.transform = 'scale(1.05) !important';
                };
                helpButton.onmouseout = () => {
                    helpButton.style.background = 'rgba(255,255,255,0.9) !important';
                    helpButton.style.transform = 'scale(1) !important';
                };
                header.style.position = 'relative';
                header.appendChild(helpButton);
            }
            
            // Add glossary button
            const main = document.querySelector('main');
            if (main) {
                const glossaryButton = document.createElement('button');
                glossaryButton.id = 'glossary-button';
                glossaryButton.innerHTML = '📚 Glossary';
                glossaryButton.style.cssText = `
                    position: fixed !important;
                    bottom: 20px !important;
                    right: 20px !important;
                    background: #007bff !important;
                    color: white !important;
                    border: none !important;
                    padding: 15px 25px !important;
                    border-radius: 30px !important;
                    cursor: pointer !important;
                    box-shadow: 0 4px 15px rgba(0,123,255,0.3) !important;
                    z-index: 1000 !important;
                    font-size: 16px !important;
                    font-weight: 600 !important;
                    transition: all 0.3s ease !important;
                `;
                glossaryButton.onclick = () => this.showGlossary();
                glossaryButton.onmouseover = () => {
                    glossaryButton.style.background = '#0056b3 !important';
                    glossaryButton.style.transform = 'scale(1.05) !important';
                };
                glossaryButton.onmouseout = () => {
                    glossaryButton.style.background = '#007bff !important';
                    glossaryButton.style.transform = 'scale(1) !important';
                };
                document.body.appendChild(glossaryButton);
            }
        } catch (error) {
            console.error('Error adding educational buttons:', error);
        }
    }

    /**
     * Show glossary modal
     */
    showGlossary() {
        // Remove any existing modal first
        const existingModal = document.getElementById('glossary-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create a new modal
        this.createGlossaryModal();
        
        // Show the modal
        const modal = document.getElementById('glossary-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    /**
     * Show help overlay
     */
    showHelpOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'help-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1001;
            display: flex;
            justify-content: center;
            align-items: center;
        `;
        
        overlay.innerHTML = `
            <div style="
                background: white;
                padding: 2rem;
                border-radius: 8px;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                margin: 20px;
            ">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 1rem;
                ">
                    <h2 style="margin: 0;">How to Use the Protein Structure Visualizer</h2>
                    <button onclick="this.closest('.help-overlay').remove()" style="
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #666;
                    ">×</button>
                </div>
                <div>
                    <h3>🔍 Searching for Proteins</h3>
                    <ul>
                        <li>Enter a protein name (e.g., "hemoglobin") or UniProt ID (e.g., "P69905")</li>
                        <li>Select from the search results to load protein information</li>
                    </ul>
                    
                    <h3>📊 Understanding Confidence Scores</h3>
                    <ul>
                        <li><span style="color: #0053D6;">Blue (90-100%)</span>: Very high confidence</li>
                        <li><span style="color: #65CBF3;">Light blue (70-90%)</span>: Confident</li>
                        <li><span style="color: #FFDB13;">Yellow (50-70%)</span>: Low confidence</li>
                        <li><span style="color: #FF7D45;">Orange (0-50%)</span>: Very low confidence</li>
                    </ul>
                    
                    <h3>🧬 Exploring 3D Structures</h3>
                    <ul>
                        <li><strong>Mouse controls:</strong> Left-click drag to rotate, scroll to zoom</li>
                        <li><strong>Styles:</strong> Switch between cartoon, surface, and stick representations</li>
                    </ul>
                    
                    <div style="margin-top: 2rem; text-align: center;">
                        <button onclick="this.closest('.help-overlay').remove()" style="
                            background: #007bff;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 4px;
                            cursor: pointer;
                        ">Got it!</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        try {
            document.addEventListener('keydown', (e) => {
                // Escape to close modals
                if (e.key === 'Escape') {
                    // Remove all educational modals and overlays
                    const modals = document.querySelectorAll('.educational-modal, .help-overlay');
                    modals.forEach(modal => {
                        modal.remove();
                    });
                    
                    // Also remove by ID in case class selector doesn't work
                    const glossaryModal = document.getElementById('glossary-modal');
                    if (glossaryModal) {
                        glossaryModal.remove();
                    }
                }
            });
        } catch (error) {
            console.error('Error setting up keyboard shortcuts:', error);
        }
    }

    /**
     * Capitalize words
     */
    capitalizeWords(str) {
        return str.replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Initialize educational features after DOM is ready
     */
    static initialize() {
        if (typeof window !== 'undefined') {
            try {
                console.log('Initializing educational component...');
                window.educationalComponent = new EducationalComponent();
                console.log('Educational component initialized globally');
                
                // Force button creation after a delay to ensure DOM is ready
                setTimeout(() => {
                    if (window.educationalComponent) {
                        console.log('Re-adding educational buttons...');
                        window.educationalComponent.addEducationalButtons();
                    }
                }, 1000);
            } catch (error) {
                console.error('Error initializing educational component:', error);
            }
        }
    }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EducationalComponent;
}