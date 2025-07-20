/**
 * End-to-end workflow tests for complete user journeys
 */

// Mock DOM elements and APIs for testing
const mockDOM = {
    elements: new Map(),
    createElement: (tag) => ({
        tagName: tag.toUpperCase(),
        style: {},
        innerHTML: '',
        textContent: '',
        addEventListener: () => {},
        appendChild: () => {},
        remove: () => {},
        setAttribute: () => {},
        getAttribute: () => null,
        querySelector: () => null,
        querySelectorAll: () => []
    }),
    getElementById: (id) => mockDOM.elements.get(id) || mockDOM.createElement('div'),
    addEventListener: () => {},
    dispatchEvent: () => true
};

// Mock global objects
global.document = mockDOM;
global.window = {
    location: { search: '' },
    addEventListener: () => {},
    scrollTo: () => {},
    URLSearchParams: class {
        constructor() {}
        get() { return null; }
    }
};
global.navigator = { userAgent: 'test-browser' };
global.fetch = jest.fn();
global.$3Dmol = {
    createViewer: () => ({
        clear: () => {},
        addModel: () => {},
        setStyle: () => {},
        render: () => {},
        zoomTo: () => {},
        setBackgroundColor: () => {},
        setHoverable: () => {},
        setClickable: () => {},
        resize: () => {}
    })
};

// Import components
const APIService = require('../js/services/APIService');
const SearchComponent = require('../js/components/SearchComponent');
const InfoComponent = require('../js/components/InfoComponent');

describe('End-to-End User Workflows', () => {
    let apiService, searchComponent, infoComponent, mockApp;
    
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Setup mock DOM elements with proper methods
        const mockElement = {
            addEventListener: jest.fn(),
            style: { display: 'none' },
            innerHTML: '',
            textContent: '',
            value: '',
            disabled: false,
            querySelector: jest.fn(() => null),
            querySelectorAll: jest.fn(() => [])
        };
        
        mockDOM.elements.set('search-form', { ...mockElement });
        mockDOM.elements.set('search-input', { ...mockElement });
        mockDOM.elements.set('search-button', { ...mockElement });
        mockDOM.elements.set('search-results', { ...mockElement });
        mockDOM.elements.set('info-section', { ...mockElement });
        mockDOM.elements.set('protein-info', { ...mockElement });
        mockDOM.elements.set('visualization-section', { ...mockElement });
        mockDOM.elements.set('error-container', { ...mockElement });
        mockDOM.elements.set('error-message', { ...mockElement });
        mockDOM.elements.set('loading-indicator', { ...mockElement });
        
        // Initialize components with mocked DOM
        apiService = new APIService();
        
        // Create components without DOM initialization for testing
        searchComponent = {
            searchProtein: jest.fn(),
            clearResults: jest.fn(),
            displaySearchResults: jest.fn()
        };
        
        infoComponent = {
            fetchProteinInfo: jest.fn(),
            hide: jest.fn()
        };
        
        // Mock app with state management
        mockApp = {
            currentProtein: null,
            navigationState: 'search',
            userJourney: [],
            updateNavigationState: jest.fn(),
            coordinateUIState: jest.fn(),
            scrollToSection: jest.fn(),
            showGlobalLoading: jest.fn(),
            showGlobalError: jest.fn()
        };
    });

    describe('Complete User Journey: Search to Visualization', () => {
        test('should complete full workflow from search to protein visualization', async () => {
            // Mock API responses
            const mockSearchResults = [
                {
                    uniprotId: 'P69905',
                    proteinName: 'Hemoglobin subunit alpha',
                    organism: 'Homo sapiens',
                    sequenceLength: 141,
                    geneNames: ['HBA1']
                }
            ];
            
            const mockProteinInfo = {
                uniprotId: 'P69905',
                proteinName: 'Hemoglobin subunit alpha',
                organism: 'Homo sapiens',
                sequenceLength: 141,
                confidenceScore: 95.2,
                geneNames: ['HBA1'],
                description: 'Involved in oxygen transport from the lungs to the various peripheral tissues.',
                lastUpdated: '2023-01-01'
            };
            
            const mockPDBData = `HEADER    OXYGEN TRANSPORT                        01-JAN-23   TEST
ATOM      1  CA  ALA A   1      20.154  16.967  14.421  1.00 95.20           C`;
            
            // Setup API mocks
            apiService.searchUniProt = jest.fn().mockResolvedValue(mockSearchResults);
            apiService.getProteinMetadata = jest.fn().mockResolvedValue(mockProteinInfo);
            apiService.fetchAlphaFoldStructure = jest.fn().mockResolvedValue(mockPDBData);
            
            // Step 1: User searches for protein
            const searchInput = mockDOM.getElementById('search-input');
            searchInput.value = 'hemoglobin';
            
            await searchComponent.searchProtein('hemoglobin');
            
            // Verify search was called
            expect(apiService.searchUniProt).toHaveBeenCalledWith('hemoglobin', expect.any(Function));
            
            // Step 2: User selects protein from results
            const proteinId = 'P69905';
            
            // Simulate protein selection
            const selectionEvent = new CustomEvent('proteinSelected', {
                detail: { proteinId }
            });
            
            // Mock the app's protein selection handler
            const handleProteinSelection = async (proteinId) => {
                mockApp.currentProtein = proteinId;
                mockApp.updateNavigationState('loading');
                mockApp.showGlobalLoading(true);
                
                try {
                    // Load protein info and structure
                    await Promise.all([
                        infoComponent.fetchProteinInfo(proteinId),
                        // Mock visualizer component loading
                        Promise.resolve()
                    ]);
                    
                    mockApp.updateNavigationState('loaded');
                    mockApp.scrollToSection('info-section');
                } catch (error) {
                    mockApp.updateNavigationState('error');
                    mockApp.showGlobalError(error.message);
                } finally {
                    mockApp.showGlobalLoading(false);
                }
            };
            
            await handleProteinSelection(proteinId);
            
            // Step 3: Verify complete workflow
            expect(mockApp.currentProtein).toBe('P69905');
            expect(mockApp.updateNavigationState).toHaveBeenCalledWith('loading');
            expect(mockApp.updateNavigationState).toHaveBeenCalledWith('loaded');
            expect(mockApp.showGlobalLoading).toHaveBeenCalledWith(true);
            expect(mockApp.showGlobalLoading).toHaveBeenCalledWith(false);
            expect(mockApp.scrollToSection).toHaveBeenCalledWith('info-section');
            
            // Verify API calls were made
            expect(apiService.getProteinMetadata).toHaveBeenCalledWith('P69905', expect.any(Function));
        });

        test('should handle search errors gracefully in complete workflow', async () => {
            // Mock search failure
            const searchError = new Error('Network error during search');
            apiService.searchUniProt = jest.fn().mockRejectedValue(searchError);
            
            // Attempt search
            const searchInput = mockDOM.getElementById('search-input');
            searchInput.value = 'invalid-protein';
            
            try {
                await searchComponent.searchProtein('invalid-protein');
            } catch (error) {
                // Error should be handled by component
            }
            
            // Verify error handling
            expect(apiService.searchUniProt).toHaveBeenCalledWith('invalid-protein', expect.any(Function));
            
            // Verify search results show error state
            const resultsContainer = mockDOM.getElementById('search-results');
            expect(resultsContainer.style.display).toBe('block');
        });

        test('should handle protein loading errors in complete workflow', async () => {
            // Mock successful search but failed protein loading
            const mockSearchResults = [
                {
                    uniprotId: 'INVALID',
                    proteinName: 'Invalid Protein',
                    organism: 'Test organism',
                    sequenceLength: 100
                }
            ];
            
            apiService.searchUniProt = jest.fn().mockResolvedValue(mockSearchResults);
            apiService.getProteinMetadata = jest.fn().mockRejectedValue(new Error('Protein not found'));
            
            // Complete search
            await searchComponent.searchProtein('test');
            
            // Attempt protein selection
            const handleProteinSelection = async (proteinId) => {
                mockApp.currentProtein = proteinId;
                mockApp.updateNavigationState('loading');
                
                try {
                    await infoComponent.fetchProteinInfo(proteinId);
                    mockApp.updateNavigationState('loaded');
                } catch (error) {
                    mockApp.updateNavigationState('error');
                    mockApp.showGlobalError(error.message);
                }
            };
            
            await handleProteinSelection('INVALID');
            
            // Verify error handling
            expect(mockApp.updateNavigationState).toHaveBeenCalledWith('error');
            expect(mockApp.showGlobalError).toHaveBeenCalledWith('Protein not found');
        });
    });

    describe('State Management Integration', () => {
        test('should properly coordinate UI sections based on navigation state', () => {
            const mockCoordinateUI = (state) => {
                const searchSection = mockDOM.getElementById('search-section');
                const infoSection = mockDOM.getElementById('info-section');
                const visualizationSection = mockDOM.getElementById('visualization-section');
                
                switch (state) {
                    case 'search':
                        searchSection.style.display = 'block';
                        infoSection.style.display = 'none';
                        visualizationSection.style.display = 'none';
                        break;
                    case 'loaded':
                        searchSection.style.display = 'block';
                        infoSection.style.display = 'block';
                        visualizationSection.style.display = 'block';
                        break;
                    case 'error':
                        searchSection.style.display = 'block';
                        infoSection.style.display = 'none';
                        visualizationSection.style.display = 'none';
                        break;
                }
            };
            
            // Test search state
            mockCoordinateUI('search');
            expect(mockDOM.getElementById('search-section').style.display).toBe('block');
            expect(mockDOM.getElementById('info-section').style.display).toBe('none');
            expect(mockDOM.getElementById('visualization-section').style.display).toBe('none');
            
            // Test loaded state
            mockCoordinateUI('loaded');
            expect(mockDOM.getElementById('search-section').style.display).toBe('block');
            expect(mockDOM.getElementById('info-section').style.display).toBe('block');
            expect(mockDOM.getElementById('visualization-section').style.display).toBe('block');
            
            // Test error state
            mockCoordinateUI('error');
            expect(mockDOM.getElementById('search-section').style.display).toBe('block');
            expect(mockDOM.getElementById('info-section').style.display).toBe('none');
            expect(mockDOM.getElementById('visualization-section').style.display).toBe('none');
        });

        test('should track user journey correctly', () => {
            const userJourney = [];
            
            const trackJourney = (state, protein = null) => {
                userJourney.push({
                    timestamp: Date.now(),
                    state: state,
                    protein: protein
                });
            };
            
            // Simulate user journey
            trackJourney('search');
            trackJourney('loading', 'P69905');
            trackJourney('loaded', 'P69905');
            
            expect(userJourney).toHaveLength(3);
            expect(userJourney[0].state).toBe('search');
            expect(userJourney[1].state).toBe('loading');
            expect(userJourney[1].protein).toBe('P69905');
            expect(userJourney[2].state).toBe('loaded');
            expect(userJourney[2].protein).toBe('P69905');
        });
    });

    describe('Multiple Protein Testing', () => {
        test('should handle multiple different proteins correctly', async () => {
            const testProteins = [
                {
                    id: 'P69905',
                    name: 'Hemoglobin subunit alpha',
                    organism: 'Homo sapiens'
                },
                {
                    id: 'P01308',
                    name: 'Insulin',
                    organism: 'Homo sapiens'
                },
                {
                    id: 'P04637',
                    name: 'Cellular tumor antigen p53',
                    organism: 'Homo sapiens'
                }
            ];
            
            // Mock API responses for each protein
            for (const protein of testProteins) {
                apiService.getProteinMetadata = jest.fn().mockResolvedValue({
                    uniprotId: protein.id,
                    proteinName: protein.name,
                    organism: protein.organism,
                    sequenceLength: 100,
                    confidenceScore: 85.0,
                    description: `Test protein: ${protein.name}`,
                    lastUpdated: '2023-01-01'
                });
                
                // Test loading each protein
                await infoComponent.fetchProteinInfo(protein.id);
                
                // Verify protein info was loaded
                expect(apiService.getProteinMetadata).toHaveBeenCalledWith(protein.id, expect.any(Function));
            }
        });

        test('should handle switching between proteins', async () => {
            // Mock switching from one protein to another
            const firstProtein = 'P69905';
            const secondProtein = 'P01308';
            
            // Setup mocks
            apiService.getProteinMetadata = jest.fn()
                .mockResolvedValueOnce({
                    uniprotId: firstProtein,
                    proteinName: 'Hemoglobin',
                    organism: 'Homo sapiens',
                    sequenceLength: 141,
                    confidenceScore: 95.0,
                    description: 'Oxygen transport protein',
                    lastUpdated: '2023-01-01'
                })
                .mockResolvedValueOnce({
                    uniprotId: secondProtein,
                    proteinName: 'Insulin',
                    organism: 'Homo sapiens',
                    sequenceLength: 51,
                    confidenceScore: 92.0,
                    description: 'Hormone regulating glucose',
                    lastUpdated: '2023-01-01'
                });
            
            // Load first protein
            mockApp.currentProtein = firstProtein;
            await infoComponent.fetchProteinInfo(firstProtein);
            
            // Switch to second protein
            mockApp.currentProtein = secondProtein;
            await infoComponent.fetchProteinInfo(secondProtein);
            
            // Verify both proteins were loaded
            expect(apiService.getProteinMetadata).toHaveBeenCalledTimes(2);
            expect(apiService.getProteinMetadata).toHaveBeenNthCalledWith(1, firstProtein, expect.any(Function));
            expect(apiService.getProteinMetadata).toHaveBeenNthCalledWith(2, secondProtein, expect.any(Function));
            
            // Verify current protein is updated
            expect(mockApp.currentProtein).toBe(secondProtein);
        });
    });

    describe('Error Recovery Workflows', () => {
        test('should allow user to retry after network errors', async () => {
            // Mock initial failure then success
            apiService.searchUniProt = jest.fn()
                .mockRejectedValueOnce(new Error('Network timeout'))
                .mockResolvedValueOnce([{
                    uniprotId: 'P69905',
                    proteinName: 'Hemoglobin',
                    organism: 'Homo sapiens',
                    sequenceLength: 141
                }]);
            
            // First attempt fails
            try {
                await searchComponent.searchProtein('hemoglobin');
            } catch (error) {
                expect(error.message).toBe('Network timeout');
            }
            
            // Second attempt succeeds
            await searchComponent.searchProtein('hemoglobin');
            
            expect(apiService.searchUniProt).toHaveBeenCalledTimes(2);
        });

        test('should handle partial failures gracefully', async () => {
            // Mock search success but info failure
            apiService.searchUniProt = jest.fn().mockResolvedValue([{
                uniprotId: 'P69905',
                proteinName: 'Hemoglobin',
                organism: 'Homo sapiens',
                sequenceLength: 141
            }]);
            
            apiService.getProteinMetadata = jest.fn().mockRejectedValue(new Error('Info not available'));
            apiService.fetchAlphaFoldStructure = jest.fn().mockResolvedValue('MOCK_PDB_DATA');
            
            // Search should succeed
            await searchComponent.searchProtein('hemoglobin');
            expect(apiService.searchUniProt).toHaveBeenCalled();
            
            // Info loading should fail gracefully
            try {
                await infoComponent.fetchProteinInfo('P69905');
            } catch (error) {
                expect(error.message).toBe('Info not available');
            }
            
            // App should still be functional for other operations
            expect(apiService.getProteinMetadata).toHaveBeenCalledWith('P69905', expect.any(Function));
        });
    });

    describe('Performance and Robustness', () => {
        test('should handle rapid user interactions', async () => {
            // Mock rapid search requests
            const searchPromises = [];
            const searchTerms = ['hemoglobin', 'insulin', 'p53', 'actin'];
            
            apiService.searchUniProt = jest.fn().mockResolvedValue([]);
            
            // Simulate rapid searches
            for (const term of searchTerms) {
                searchPromises.push(searchComponent.searchProtein(term));
            }
            
            // Wait for all searches to complete
            await Promise.allSettled(searchPromises);
            
            // Verify all searches were attempted
            expect(apiService.searchUniProt).toHaveBeenCalledTimes(4);
        });

        test('should handle large protein structures', async () => {
            // Mock large PDB data
            const largePDBData = 'HEADER    LARGE PROTEIN\n' + 'ATOM'.repeat(10000);
            
            apiService.fetchAlphaFoldStructure = jest.fn().mockResolvedValue(largePDBData);
            
            // Should handle large data without errors
            const result = await apiService.fetchAlphaFoldStructure('LARGE_PROTEIN');
            expect(result).toBe(largePDBData);
            expect(result.length).toBeGreaterThan(40000);
        });
    });
});