/**
 * Tests for VisualizerComponent
 */

// Mock DOM elements that will be returned by getElementById
const createMockElement = () => ({
    innerHTML: '',
    style: { display: 'none' },
    appendChild: jest.fn(),
    addEventListener: jest.fn()
});

// Create specific mock elements
const mockElements = {
    'visualization-section': createMockElement(),
    'viewer-container': createMockElement(),
    'visualization-controls': createMockElement(),
    'confidence-legend': createMockElement(),
    'reset-view': { addEventListener: jest.fn() },
    'style-selector': { addEventListener: jest.fn(), value: 'cartoon' },
    'confidence-colors': { addEventListener: jest.fn() }
};

// Ensure all elements have the required properties
Object.values(mockElements).forEach(element => {
    if (!element.addEventListener) {
        element.addEventListener = jest.fn();
    }
});

// Setup global mocks before importing
global.document = {
    getElementById: jest.fn((id) => mockElements[id] || createMockElement()),
    createElement: jest.fn(() => createMockElement())
};

global.$3Dmol = {
    createViewer: jest.fn(() => ({
        clear: jest.fn(),
        addModel: jest.fn(),
        setStyle: jest.fn(),
        setBackgroundColor: jest.fn(),
        zoomTo: jest.fn(),
        render: jest.fn()
    })),
    rasmolElementColors: {}
};

// Import the classes
const VisualizerComponent = require('../js/components/VisualizerComponent.js');
const APIService = require('../js/services/APIService.js');

describe('VisualizerComponent', () => {
    let visualizerComponent;
    let mockApiService;
    let mockViewer;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Create mock API service
        mockApiService = {
            fetchAlphaFoldStructure: jest.fn()
        };
        
        // Create mock 3Dmol viewer
        mockViewer = {
            clear: jest.fn(),
            addModel: jest.fn(),
            setStyle: jest.fn(),
            setBackgroundColor: jest.fn(),
            zoomTo: jest.fn(),
            render: jest.fn()
        };
        
        // Setup global $3Dmol mock
        global.$3Dmol = {
            createViewer: jest.fn(() => mockViewer),
            rasmolElementColors: {}
        };
        
        // Create component instance
        visualizerComponent = new VisualizerComponent(mockApiService);
        
        // Mock the DOM elements directly on the component instance
        visualizerComponent.visualizationSection = createMockElement();
        visualizerComponent.viewerContainer = createMockElement();
        visualizerComponent.controlsContainer = createMockElement();
        visualizerComponent.legendContainer = createMockElement();
    });

    describe('Constructor', () => {
        test('should initialize with correct properties', () => {
            expect(visualizerComponent.apiService).toBe(mockApiService);
            expect(visualizerComponent.visualizationSection).toBeDefined();
            expect(visualizerComponent.viewerContainer).toBeDefined();
            expect(visualizerComponent.controlsContainer).toBeDefined();
            expect(visualizerComponent.legendContainer).toBeDefined();
            expect(visualizerComponent.viewer).toBeNull(); // Initially null until initialized
            expect(visualizerComponent.currentProtein).toBeNull();
        });
    });

    describe('initializeViewer', () => {
        test('should throw error if 3Dmol is not available', async () => {
            global.$3Dmol = undefined;
            
            await expect(visualizerComponent.initializeViewer())
                .rejects.toThrow('3Dmol.js library not loaded');
        });

        test('should initialize 3Dmol viewer successfully', async () => {
            global.$3Dmol = {
                createViewer: jest.fn(() => mockViewer),
                rasmolElementColors: {}
            };
            
            // Mock the setupControls method to avoid DOM issues in tests
            visualizerComponent.setupControls = jest.fn();
            
            await visualizerComponent.initializeViewer();
            
            expect(visualizerComponent.viewerContainer.innerHTML).toBe('');
            expect(global.$3Dmol.createViewer).toHaveBeenCalled();
            expect(visualizerComponent.viewer).toBe(mockViewer);
            expect(visualizerComponent.setupControls).toHaveBeenCalled();
        });
    });

    describe('loadStructure', () => {
        const testUniprotId = 'P69905';
        const mockPdbData = 'HEADER    OXYGEN STORAGE/TRANSPORT           22-MAY-96   1HHO\nATOM      1  N   VAL A   1      -8.901   4.127  -0.555  1.00 11.99           N';

        test('should load structure successfully', async () => {
            mockApiService.fetchAlphaFoldStructure.mockResolvedValue(mockPdbData);
            
            // Mock the methods that will be called
            visualizerComponent.showLoadingState = jest.fn();
            visualizerComponent.initializeViewer = jest.fn().mockResolvedValue();
            visualizerComponent.renderStructure = jest.fn();
            
            await visualizerComponent.loadStructure(testUniprotId);
            
            expect(visualizerComponent.showLoadingState).toHaveBeenCalled();
            expect(visualizerComponent.initializeViewer).toHaveBeenCalled();
            expect(mockApiService.fetchAlphaFoldStructure).toHaveBeenCalledWith(testUniprotId);
            expect(visualizerComponent.renderStructure).toHaveBeenCalledWith(mockPdbData);
            expect(visualizerComponent.currentProtein).toBe(testUniprotId);
            expect(visualizerComponent.visualizationSection.style.display).toBe('block');
        });

        test('should handle API errors gracefully', async () => {
            const errorMessage = 'No AlphaFold structure available';
            mockApiService.fetchAlphaFoldStructure.mockRejectedValue(new Error(errorMessage));
            
            visualizerComponent.showLoadingState = jest.fn();
            visualizerComponent.initializeViewer = jest.fn().mockResolvedValue();
            visualizerComponent.showError = jest.fn();
            
            await visualizerComponent.loadStructure(testUniprotId);
            
            expect(visualizerComponent.showError).toHaveBeenCalledWith(errorMessage);
        });

        test('should handle initialization errors', async () => {
            const errorMessage = '3Dmol.js library not loaded';
            visualizerComponent.showLoadingState = jest.fn();
            visualizerComponent.initializeViewer = jest.fn().mockRejectedValue(new Error(errorMessage));
            visualizerComponent.showError = jest.fn();
            
            await visualizerComponent.loadStructure(testUniprotId);
            
            expect(visualizerComponent.showError).toHaveBeenCalledWith(errorMessage);
        });
    });

    describe('renderStructure', () => {
        const mockPdbData = 'HEADER    OXYGEN STORAGE/TRANSPORT           22-MAY-96   1HHO\nATOM      1  N   VAL A   1      -8.901   4.127  -0.555  1.00 11.99           N';

        beforeEach(() => {
            visualizerComponent.viewer = mockViewer; // Set up viewer for tests
            visualizerComponent.setupCameraControls = jest.fn();
            visualizerComponent.showConfidenceLegend = jest.fn();
        });

        test('should render structure successfully', () => {
            visualizerComponent.renderStructure(mockPdbData);
            
            expect(mockViewer.clear).toHaveBeenCalled();
            expect(mockViewer.addModel).toHaveBeenCalledWith(mockPdbData, 'pdb');
            expect(mockViewer.setStyle).toHaveBeenCalledWith({}, expect.objectContaining({
                cartoon: expect.objectContaining({
                    colorfunc: expect.any(Function)
                })
            }));
            expect(mockViewer.setBackgroundColor).toHaveBeenCalledWith('white');
            expect(mockViewer.zoomTo).toHaveBeenCalled();
            expect(mockViewer.render).toHaveBeenCalled();
            expect(visualizerComponent.setupCameraControls).toHaveBeenCalled();
            expect(visualizerComponent.showConfidenceLegend).toHaveBeenCalled();
        });

        test('should throw error if viewer not initialized', () => {
            visualizerComponent.viewer = null;
            
            expect(() => visualizerComponent.renderStructure(mockPdbData))
                .toThrow('3Dmol viewer not initialized');
        });

        test('should throw error for invalid PDB data', () => {
            expect(() => visualizerComponent.renderStructure(null))
                .toThrow('Invalid PDB data provided');
            
            expect(() => visualizerComponent.renderStructure(''))
                .toThrow('Invalid PDB data provided');
            
            expect(() => visualizerComponent.renderStructure(123))
                .toThrow('Invalid PDB data provided');
        });

        test('should handle rendering errors', () => {
            mockViewer.addModel.mockImplementation(() => {
                throw new Error('Invalid PDB format');
            });
            
            expect(() => visualizerComponent.renderStructure(mockPdbData))
                .toThrow('Failed to render protein structure: Invalid PDB format');
        });
    });

    describe('updateVisualizationStyle', () => {
        beforeEach(() => {
            visualizerComponent.viewer = mockViewer; // Set up viewer for tests
        });

        test('should update to cartoon style', () => {
            visualizerComponent.updateVisualizationStyle('cartoon');
            
            expect(mockViewer.setStyle).toHaveBeenCalledWith({}, {});
            expect(mockViewer.setStyle).toHaveBeenCalledWith({}, {cartoon: {color: 'lightblue'}});
            expect(mockViewer.render).toHaveBeenCalled();
        });

        test('should update to surface style', () => {
            visualizerComponent.updateVisualizationStyle('surface');
            
            expect(mockViewer.setStyle).toHaveBeenCalledWith({}, {surface: {color: 'lightblue', opacity: 0.8}});
            expect(mockViewer.render).toHaveBeenCalled();
        });

        test('should update to stick style', () => {
            visualizerComponent.updateVisualizationStyle('stick');
            
            expect(mockViewer.setStyle).toHaveBeenCalledWith({}, {stick: {color: 'lightblue'}});
            expect(mockViewer.render).toHaveBeenCalled();
        });

        test('should default to cartoon for unknown style', () => {
            visualizerComponent.updateVisualizationStyle('unknown');
            
            expect(mockViewer.setStyle).toHaveBeenCalledWith({}, {cartoon: {color: 'lightblue'}});
            expect(mockViewer.render).toHaveBeenCalled();
        });

        test('should handle errors gracefully', () => {
            mockViewer.setStyle.mockImplementation(() => {
                throw new Error('Rendering error');
            });
            
            // Should not throw, just log error
            expect(() => visualizerComponent.updateVisualizationStyle('cartoon')).not.toThrow();
        });
    });

    describe('toggleConfidenceColors', () => {
        beforeEach(() => {
            visualizerComponent.viewer = mockViewer; // Set up viewer for tests
        });

        test('should enable confidence colors', () => {
            // Mock confidence data for the test
            visualizerComponent.confidenceData = [
                { residueNumber: 1, chainId: 'A', confidenceScore: 95 }
            ];
            visualizerComponent.applyConfidenceColoring = jest.fn();
            
            visualizerComponent.toggleConfidenceColors(true);
            
            expect(visualizerComponent.applyConfidenceColoring).toHaveBeenCalledWith('cartoon');
            expect(mockViewer.render).toHaveBeenCalled();
        });

        test('should disable confidence colors', () => {
            visualizerComponent.toggleConfidenceColors(false);
            
            expect(mockViewer.setStyle).toHaveBeenCalledWith({}, {cartoon: {color: 'lightblue'}});
            expect(mockViewer.render).toHaveBeenCalled();
        });
    });

    describe('resetView', () => {
        beforeEach(() => {
            visualizerComponent.viewer = mockViewer; // Set up viewer for tests
        });

        test('should reset view to default position', () => {
            visualizerComponent.resetView();
            
            expect(mockViewer.zoomTo).toHaveBeenCalled();
            expect(mockViewer.render).toHaveBeenCalled();
        });

        test('should handle errors gracefully', () => {
            mockViewer.zoomTo.mockImplementation(() => {
                throw new Error('Reset error');
            });
            
            expect(() => visualizerComponent.resetView()).not.toThrow();
        });
    });

    describe('showConfidenceLegend', () => {
        test('should display confidence legend', () => {
            visualizerComponent.showConfidenceLegend();
            
            expect(visualizerComponent.legendContainer.style.display).toBe('block');
            expect(visualizerComponent.legendContainer.innerHTML).toContain('Confidence Score Legend');
            expect(visualizerComponent.legendContainer.innerHTML).toContain('Very High (90-100)');
            expect(visualizerComponent.legendContainer.innerHTML).toContain('Confident (70-90)');
            expect(visualizerComponent.legendContainer.innerHTML).toContain('Low (50-70)');
            expect(visualizerComponent.legendContainer.innerHTML).toContain('Very Low (0-50)');
        });
    });

    describe('showLoadingState', () => {
        test('should display loading indicator', () => {
            visualizerComponent.showLoadingState();
            
            expect(visualizerComponent.viewerContainer.innerHTML).toContain('Loading 3D structure...');
            expect(visualizerComponent.viewerContainer.innerHTML).toContain('spinner');
        });
    });

    describe('showError', () => {
        test('should display error message', () => {
            const errorMessage = 'Test error message';
            visualizerComponent.showError(errorMessage);
            
            expect(visualizerComponent.viewerContainer.innerHTML).toContain(errorMessage);
            expect(visualizerComponent.viewerContainer.innerHTML).toContain('viewer-error');
        });
    });

    describe('hide', () => {
        test('should hide visualization section', () => {
            visualizerComponent.hide();
            
            expect(visualizerComponent.visualizationSection.style.display).toBe('none');
        });
    });

    describe('Confidence-Based Coloring', () => {
        const mockPdbDataWithConfidence = `HEADER    INSULIN                                 30-MAY-88   4INS
ATOM      1  N   PHE A   1      -8.901   4.127  -0.555  1.00 95.50           N  
ATOM      2  CA  PHE A   1      -8.608   3.135  -1.618  1.00 95.50           C  
ATOM      3  N   VAL A   2      -7.201   2.984  -1.378  1.00 85.25           N  
ATOM      4  CA  VAL A   2      -6.603   1.849  -0.648  1.00 85.25           C  
ATOM      5  N   ASN A   3      -5.195   2.202  -0.456  1.00 65.75           N  
ATOM      6  CA  ASN A   3      -4.347   1.256   0.289  1.00 65.75           C  
ATOM      7  N   GLN A   4      -2.993   1.831   0.456  1.00 45.30           N  
ATOM      8  CA  GLN A   4      -1.889   1.056   1.089  1.00 45.30           C  
END`;

        beforeEach(() => {
            visualizerComponent.viewer = mockViewer;
        });

        test('should parse confidence scores from PDB data', () => {
            const confidenceData = visualizerComponent.parseConfidenceScores(mockPdbDataWithConfidence);
            
            expect(confidenceData).toHaveLength(4);
            expect(confidenceData[0]).toEqual({
                residueNumber: 1,
                residueName: 'PHE',
                chainId: 'A',
                bFactor: 95.50,
                confidenceScore: 95.50,
                confidenceLevel: 'very_high'
            });
            expect(confidenceData[1].confidenceLevel).toBe('confident');
            expect(confidenceData[2].confidenceLevel).toBe('low');
            expect(confidenceData[3].confidenceLevel).toBe('very_low');
        });

        test('should get correct confidence level from score', () => {
            expect(visualizerComponent.getConfidenceLevel(95)).toBe('very_high');
            expect(visualizerComponent.getConfidenceLevel(85)).toBe('confident');
            expect(visualizerComponent.getConfidenceLevel(65)).toBe('low');
            expect(visualizerComponent.getConfidenceLevel(45)).toBe('very_low');
        });

        test('should get correct confidence color from score', () => {
            expect(visualizerComponent.getConfidenceColor(95)).toBe('#0053D6');
            expect(visualizerComponent.getConfidenceColor(85)).toBe('#65CBF3');
            expect(visualizerComponent.getConfidenceColor(65)).toBe('#FFDB13');
            expect(visualizerComponent.getConfidenceColor(45)).toBe('#FF7D45');
        });

        test('should calculate confidence statistics correctly', () => {
            visualizerComponent.confidenceData = [
                { confidenceScore: 95 },
                { confidenceScore: 85 },
                { confidenceScore: 65 },
                { confidenceScore: 45 }
            ];

            const stats = visualizerComponent.calculateConfidenceStatistics();
            
            expect(stats.veryHigh).toBe(1);
            expect(stats.confident).toBe(1);
            expect(stats.low).toBe(1);
            expect(stats.veryLow).toBe(1);
            expect(stats.totalResidues).toBe(4);
            expect(stats.averageConfidence).toBe(72.5);
            expect(stats.highConfidencePercent).toBe(50); // veryHigh + confident
        });

        test('should apply confidence coloring to structure', () => {
            visualizerComponent.confidenceData = [
                { residueNumber: 1, chainId: 'A', confidenceScore: 95 }
            ];

            visualizerComponent.applyConfidenceColoring('cartoon');
            
            expect(mockViewer.setStyle).toHaveBeenCalledWith({}, expect.objectContaining({
                cartoon: expect.objectContaining({
                    colorfunc: expect.any(Function)
                })
            }));
        });

        test('should handle empty confidence data gracefully', () => {
            visualizerComponent.confidenceData = [];
            
            const stats = visualizerComponent.calculateConfidenceStatistics();
            
            expect(stats.totalResidues).toBe(0);
            expect(stats.averageConfidence).toBe(0);
            expect(stats.veryHigh).toBe(0);
        });

        test('should handle malformed PDB data gracefully', () => {
            const malformedPdb = 'INVALID PDB DATA\nNOT A REAL ATOM RECORD';
            
            const confidenceData = visualizerComponent.parseConfidenceScores(malformedPdb);
            
            expect(confidenceData).toEqual([]);
        });
    });
});

describe('Integration Tests', () => {
    let visualizerComponent;
    let apiService;

    beforeEach(() => {
        apiService = new APIService();
        visualizerComponent = new VisualizerComponent(apiService);
        
        // Mock the DOM elements directly on the component instance
        visualizerComponent.visualizationSection = createMockElement();
        visualizerComponent.viewerContainer = createMockElement();
        visualizerComponent.controlsContainer = createMockElement();
        visualizerComponent.legendContainer = createMockElement();
    });

    describe('Real API Integration', () => {
        test('should handle known protein structure loading', async () => {
            // Mock fetch for a known protein (hemoglobin)
            const mockPdbData = `HEADER    OXYGEN STORAGE/TRANSPORT           22-MAY-96   1HHO              
ATOM      1  N   VAL A   1      -8.901   4.127  -0.555  1.00 11.99           N  
ATOM      2  CA  VAL A   1      -8.608   3.135  -1.618  1.00 11.99           C  
END`;
            
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                text: () => Promise.resolve(mockPdbData)
            });
            
            visualizerComponent.showLoadingState = jest.fn();
            visualizerComponent.initializeViewer = jest.fn().mockResolvedValue();
            visualizerComponent.renderStructure = jest.fn();
            
            await visualizerComponent.loadStructure('P69905');
            
            expect(visualizerComponent.renderStructure).toHaveBeenCalledWith(mockPdbData);
        }, 10000);

        test('should handle structure not found error', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                status: 404,
                statusText: 'Not Found'
            });
            
            visualizerComponent.showLoadingState = jest.fn();
            visualizerComponent.initializeViewer = jest.fn().mockResolvedValue();
            visualizerComponent.showError = jest.fn();
            
            await visualizerComponent.loadStructure('INVALID');
            
            expect(visualizerComponent.showError).toHaveBeenCalledWith(
                expect.stringContaining('No AlphaFold structure available')
            );
        });
    });
});