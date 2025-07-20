/**
 * Tests for VisualizerComponent interactive features
 */

// Mock 3Dmol.js
global.$3Dmol = {
    createViewer: jest.fn(() => ({
        clear: jest.fn(),
        addModel: jest.fn(),
        setStyle: jest.fn(),
        addStyle: jest.fn(),
        removeStyle: jest.fn(),
        setBackgroundColor: jest.fn(),
        zoomTo: jest.fn(),
        render: jest.fn(),
        setHoverable: jest.fn(),
        setClickable: jest.fn()
    })),
    rasmolElementColors: {}
};

// Mock DOM elements
const mockElements = {
    'visualization-section': { style: { display: 'none' } },
    'viewer-container': { innerHTML: '', appendChild: jest.fn() },
    'visualization-controls': { innerHTML: '' },
    'confidence-legend': { innerHTML: '', style: { display: 'none' } },
    'style-selector': { value: 'cartoon', addEventListener: jest.fn() },
    'confidence-colors': { checked: true, addEventListener: jest.fn() },
    'show-helices': { checked: true, addEventListener: jest.fn() },
    'show-sheets': { checked: true, addEventListener: jest.fn() },
    'show-loops': { checked: true, addEventListener: jest.fn() },
    'reset-view': { addEventListener: jest.fn() },
    'clear-selection': { addEventListener: jest.fn() }
};

// Create mock functions that can be spied on
const mockGetElementById = jest.fn((id) => mockElements[id] || null);
const mockCreateElement = jest.fn(() => ({
    id: '',
    className: '',
    innerHTML: '',
    style: {},
    appendChild: jest.fn(),
    remove: jest.fn(),
    closest: jest.fn(() => ({ remove: jest.fn() })),
    contains: jest.fn(() => false)
}));

global.document = {
    getElementById: mockGetElementById,
    createElement: mockCreateElement,
    body: {
        appendChild: jest.fn()
    },
    addEventListener: jest.fn()
};

// Mock API Service
const mockApiService = {
    fetchAlphaFoldStructure: jest.fn()
};

// Import the component
const VisualizerComponent = require('../js/components/VisualizerComponent');

describe('VisualizerComponent Interactive Features', () => {
    let visualizer;
    let mockPdbData;

    beforeEach(() => {
        jest.clearAllMocks();
        visualizer = new VisualizerComponent(mockApiService);
        
        // Mock PDB data with confidence scores
        mockPdbData = `ATOM      1  CA  ALA A   1      20.154  16.967  14.421  1.00 95.50           C
ATOM      2  CA  VAL A   2      23.498  18.649  16.130  1.00 87.25           C
ATOM      3  CA  LEU A   3      26.984  16.991  18.324  1.00 72.10           C
ATOM      4  CA  GLY A   4      30.112  19.456  20.147  1.00 45.75           C`;
        
        // Initialize viewer
        visualizer.viewer = global.$3Dmol.createViewer();
        visualizer.confidenceData = [
            { residueNumber: 1, residueName: 'ALA', chainId: 'A', confidenceScore: 95.50, confidenceLevel: 'very_high' },
            { residueNumber: 2, residueName: 'VAL', chainId: 'A', confidenceScore: 87.25, confidenceLevel: 'confident' },
            { residueNumber: 3, residueName: 'LEU', chainId: 'A', confidenceScore: 72.10, confidenceLevel: 'confident' },
            { residueNumber: 4, residueName: 'GLY', chainId: 'A', confidenceScore: 45.75, confidenceLevel: 'low' }
        ];
    });

    describe('Interactive Setup', () => {
        test('should setup interactive features', () => {
            visualizer.setupInteractiveFeatures();
            
            expect(visualizer.viewer.setHoverable).toHaveBeenCalledWith(
                {},
                true,
                expect.any(Function),
                expect.any(Function)
            );
            
            expect(visualizer.viewer.setClickable).toHaveBeenCalledWith(
                {},
                true,
                expect.any(Function)
            );
        });

        test('should initialize interaction state', () => {
            visualizer.setupInteractiveFeatures();
            
            expect(visualizer.selectedResidue).toBeNull();
            expect(visualizer.hoveredResidue).toBeNull();
        });
    });

    describe('Hover Functionality', () => {
        test('should handle atom hover events', () => {
            const mockAtom = { resi: 1, chain: 'A' };
            const mockEvent = { pageX: 100, pageY: 200 };
            
            visualizer.showResidueTooltip = jest.fn();
            visualizer.handleAtomHover(mockAtom, mockEvent);
            
            expect(visualizer.hoveredResidue).toEqual(visualizer.confidenceData[0]);
            expect(visualizer.showResidueTooltip).toHaveBeenCalledWith(
                visualizer.confidenceData[0],
                mockEvent
            );
        });

        test('should handle hover end events', () => {
            visualizer.hoveredResidue = visualizer.confidenceData[0];
            visualizer.hideResidueTooltip = jest.fn();
            
            visualizer.handleHoverEnd();
            
            expect(visualizer.hoveredResidue).toBeNull();
            expect(visualizer.hideResidueTooltip).toHaveBeenCalled();
        });

        test('should not handle hover for invalid atoms', () => {
            visualizer.showResidueTooltip = jest.fn();
            
            visualizer.handleAtomHover(null, {});
            visualizer.handleAtomHover({ resi: 999, chain: 'Z' }, {});
            
            expect(visualizer.showResidueTooltip).not.toHaveBeenCalled();
        });
    });

    describe('Click Functionality', () => {
        test('should handle atom click events', () => {
            const mockAtom = { resi: 2, chain: 'A' };
            const mockEvent = { pageX: 150, pageY: 250 };
            
            visualizer.clearResidueHighlight = jest.fn();
            visualizer.highlightResidue = jest.fn();
            visualizer.showResidueDetails = jest.fn();
            
            visualizer.handleAtomClick(mockAtom, mockEvent);
            
            expect(visualizer.selectedResidue).toEqual(visualizer.confidenceData[1]);
            expect(visualizer.highlightResidue).toHaveBeenCalledWith(visualizer.confidenceData[1]);
            expect(visualizer.showResidueDetails).toHaveBeenCalledWith(
                visualizer.confidenceData[1],
                mockEvent
            );
        });

        test('should clear previous selection when clicking new residue', () => {
            const previousResidue = visualizer.confidenceData[0];
            const newAtom = { resi: 2, chain: 'A' };
            
            visualizer.selectedResidue = previousResidue;
            visualizer.clearResidueHighlight = jest.fn();
            visualizer.highlightResidue = jest.fn();
            visualizer.showResidueDetails = jest.fn();
            
            visualizer.handleAtomClick(newAtom, {});
            
            expect(visualizer.clearResidueHighlight).toHaveBeenCalledWith(previousResidue);
            expect(visualizer.selectedResidue).toEqual(visualizer.confidenceData[1]);
        });

        test('should not handle click for invalid atoms', () => {
            visualizer.highlightResidue = jest.fn();
            
            visualizer.handleAtomClick(null, {});
            visualizer.handleAtomClick({ resi: 999, chain: 'Z' }, {});
            
            expect(visualizer.highlightResidue).not.toHaveBeenCalled();
        });
    });

    describe('Residue Highlighting', () => {
        test('should highlight residue with sphere style', () => {
            const residueData = visualizer.confidenceData[0];
            
            visualizer.highlightResidue(residueData);
            
            expect(visualizer.viewer.addStyle).toHaveBeenCalledWith(
                { resi: 1, chain: 'A' },
                {
                    sphere: {
                        color: '#FF0000',
                        radius: 1.5,
                        opacity: 0.8
                    }
                }
            );
            expect(visualizer.viewer.render).toHaveBeenCalled();
        });

        test('should clear residue highlight', () => {
            const residueData = visualizer.confidenceData[0];
            
            visualizer.clearResidueHighlight(residueData);
            
            expect(visualizer.viewer.removeStyle).toHaveBeenCalledWith(
                { resi: 1, chain: 'A' },
                { sphere: {} }
            );
            expect(visualizer.viewer.render).toHaveBeenCalled();
        });

        test('should handle highlighting errors gracefully', () => {
            visualizer.viewer.addStyle.mockImplementation(() => {
                throw new Error('3Dmol error');
            });
            
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            expect(() => {
                visualizer.highlightResidue(visualizer.confidenceData[0]);
            }).not.toThrow();
            
            expect(consoleSpy).toHaveBeenCalledWith('Error highlighting residue:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });

    describe('Structural Element Controls', () => {
        test('should toggle helix visibility', () => {
            visualizer.toggleStructuralElement('helix', true);
            
            expect(visualizer.viewer.addStyle).toHaveBeenCalledWith(
                { ss: 'h' },
                expect.any(Object)
            );
            expect(visualizer.viewer.render).toHaveBeenCalled();
        });

        test('should toggle sheet visibility', () => {
            visualizer.toggleStructuralElement('sheet', false);
            
            expect(visualizer.viewer.removeStyle).toHaveBeenCalledWith({ ss: 's' });
            expect(visualizer.viewer.render).toHaveBeenCalled();
        });

        test('should toggle loop visibility', () => {
            visualizer.toggleStructuralElement('loop', true);
            
            expect(visualizer.viewer.addStyle).toHaveBeenCalledWith(
                { ss: 'c' },
                expect.any(Object)
            );
            expect(visualizer.viewer.render).toHaveBeenCalled();
        });

        test('should handle unknown structural element types', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            visualizer.toggleStructuralElement('unknown', true);
            
            expect(consoleSpy).toHaveBeenCalledWith('Unknown structural element type: unknown');
            expect(visualizer.viewer.addStyle).not.toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });

        test('should apply confidence coloring to structural elements', () => {
            mockElements['confidence-colors'].checked = true;
            
            visualizer.toggleStructuralElement('helix', true);
            
            expect(visualizer.viewer.addStyle).toHaveBeenCalledWith(
                { ss: 'h' },
                expect.objectContaining({
                    cartoon: expect.objectContaining({
                        colorfunc: expect.any(Function)
                    })
                })
            );
        });
    });

    describe('Selection Management', () => {
        test('should clear current selection', () => {
            const selectedResidue = visualizer.confidenceData[0];
            visualizer.selectedResidue = selectedResidue;
            
            visualizer.clearResidueHighlight = jest.fn();
            visualizer.hideResidueDetails = jest.fn();
            visualizer.hideResidueTooltip = jest.fn();
            
            visualizer.clearSelection();
            
            expect(visualizer.clearResidueHighlight).toHaveBeenCalledWith(selectedResidue);
            expect(visualizer.selectedResidue).toBeNull();
            expect(visualizer.hideResidueDetails).toHaveBeenCalled();
            expect(visualizer.hideResidueTooltip).toHaveBeenCalled();
        });

        test('should handle clearing selection when no residue selected', () => {
            visualizer.selectedResidue = null;
            visualizer.clearResidueHighlight = jest.fn();
            
            expect(() => {
                visualizer.clearSelection();
            }).not.toThrow();
            
            expect(visualizer.clearResidueHighlight).not.toHaveBeenCalled();
        });
    });

    describe('Amino Acid Information', () => {
        test('should return correct amino acid information', () => {
            const alanineInfo = visualizer.getAminoAcidInfo('ALA');
            
            expect(alanineInfo).toEqual({
                fullName: 'Alanine',
                type: 'Nonpolar',
                polarity: 'Hydrophobic',
                charge: 'Neutral',
                description: 'Small, simple amino acid often found in protein cores and flexible regions.'
            });
        });

        test('should return unknown for invalid amino acid codes', () => {
            const unknownInfo = visualizer.getAminoAcidInfo('XXX');
            
            expect(unknownInfo).toEqual({
                fullName: 'Unknown',
                type: 'Unknown',
                polarity: 'Unknown',
                charge: 'Unknown',
                description: 'Unknown amino acid residue.'
            });
        });

        test('should handle all standard amino acids', () => {
            const standardAminoAcids = [
                'ALA', 'ARG', 'ASN', 'ASP', 'CYS', 'GLN', 'GLU', 'GLY',
                'HIS', 'ILE', 'LEU', 'LYS', 'MET', 'PHE', 'PRO', 'SER',
                'THR', 'TRP', 'TYR', 'VAL'
            ];
            
            standardAminoAcids.forEach(code => {
                const info = visualizer.getAminoAcidInfo(code);
                expect(info.fullName).not.toBe('Unknown');
                expect(info.type).not.toBe('Unknown');
                expect(info.description).not.toBe('Unknown amino acid type.');
            });
        });
    });

    describe('Confidence Explanations', () => {
        test('should provide correct confidence explanations', () => {
            expect(visualizer.getConfidenceExplanation(95)).toContain('very high accuracy');
            expect(visualizer.getConfidenceExplanation(80)).toContain('confident prediction');
            expect(visualizer.getConfidenceExplanation(60)).toContain('low confidence');
            expect(visualizer.getConfidenceExplanation(30)).toContain('very low confidence');
        });

        test('should provide appropriate confidence level text', () => {
            expect(visualizer.getConfidenceLevelText('very_high')).toBe('Very High Confidence');
            expect(visualizer.getConfidenceLevelText('confident')).toBe('Confident');
            expect(visualizer.getConfidenceLevelText('low')).toBe('Low Confidence');
            expect(visualizer.getConfidenceLevelText('very_low')).toBe('Very Low Confidence');
            expect(visualizer.getConfidenceLevelText('unknown')).toBe('Unknown');
        });
    });

    describe('Tooltip and Popup Management', () => {
        test('should handle tooltip creation without errors', () => {
            const residueData = visualizer.confidenceData[0];
            const mockEvent = { pageX: 100, pageY: 200 };
            
            expect(() => {
                visualizer.showResidueTooltip(residueData, mockEvent);
            }).not.toThrow();
        });

        test('should handle tooltip hiding without errors', () => {
            expect(() => {
                visualizer.hideResidueTooltip();
            }).not.toThrow();
        });

        test('should handle popup creation without errors', () => {
            const residueData = visualizer.confidenceData[0];
            const mockEvent = { pageX: 100, pageY: 200 };
            
            expect(() => {
                visualizer.showResidueDetails(residueData, mockEvent);
            }).not.toThrow();
        });

        test('should handle popup hiding without errors', () => {
            expect(() => {
                visualizer.hideResidueDetails();
            }).not.toThrow();
        });

        test('should handle popup outside click without errors', () => {
            const mockEvent = { target: document.createElement('div') };
            
            expect(() => {
                visualizer.handlePopupOutsideClick(mockEvent);
            }).not.toThrow();
        });
    });

    describe('Error Handling', () => {
        test('should handle viewer errors gracefully', () => {
            visualizer.viewer = null;
            
            expect(() => {
                visualizer.setupInteractiveFeatures();
                visualizer.highlightResidue(visualizer.confidenceData[0]);
                visualizer.toggleStructuralElement('helix', true);
            }).not.toThrow();
        });

        test('should handle missing confidence data', () => {
            visualizer.confidenceData = null;
            
            expect(() => {
                visualizer.handleAtomHover({ resi: 1, chain: 'A' }, {});
                visualizer.handleAtomClick({ resi: 1, chain: 'A' }, {});
            }).not.toThrow();
        });

        test('should handle 3Dmol errors in structural element toggling', () => {
            visualizer.viewer.addStyle.mockImplementation(() => {
                throw new Error('3Dmol error');
            });
            
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            expect(() => {
                visualizer.toggleStructuralElement('helix', true);
            }).not.toThrow();
            
            expect(consoleSpy).toHaveBeenCalledWith('Error toggling helix:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });
});