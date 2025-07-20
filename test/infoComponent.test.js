/**
 * Tests for InfoComponent
 */

// Import the class
const InfoComponent = require('../js/components/InfoComponent.js');

describe('InfoComponent', () => {
    let infoComponent;
    let mockApiService;

    beforeEach(() => {
        // Mock document and window for testing environment
        global.document = {
            getElementById: jest.fn(() => null)
        };
        global.window = {
            scrollY: 0,
            scrollX: 0
        };
        
        // Create mock API service
        mockApiService = {
            getProteinMetadata: jest.fn()
        };
        
        infoComponent = new InfoComponent(mockApiService);
    });

    describe('constructor', () => {
        test('should initialize with API service', () => {
            expect(infoComponent.apiService).toBe(mockApiService);
            expect(infoComponent.infoSection).toBeDefined();
            expect(infoComponent.infoContainer).toBeDefined();
        });
    });

    describe('fetchProteinInfo', () => {
        const mockProteinData = {
            uniprotId: 'P69905',
            proteinName: 'Hemoglobin subunit alpha',
            organism: 'Homo sapiens',
            sequenceLength: 141,
            geneNames: ['HBA1', 'HBA2'],
            description: 'Involved in oxygen transport from the lungs to the various peripheral tissues.',
            confidenceScore: 85.5,
            lastUpdated: '2023-01-01T00:00:00.000Z'
        };

        test('should call API service with correct UniProt ID', async () => {
            mockApiService.getProteinMetadata.mockResolvedValue(mockProteinData);
            
            await infoComponent.fetchProteinInfo('P69905');
            
            expect(mockApiService.getProteinMetadata).toHaveBeenCalledWith('P69905', expect.any(Function));
        });

        test('should handle API errors gracefully', async () => {
            const errorMessage = 'Network error';
            mockApiService.getProteinMetadata.mockRejectedValue(new Error(errorMessage));
            
            // Should not throw error
            await expect(infoComponent.fetchProteinInfo('P69905')).resolves.toBeUndefined();
        });

        test('should not call API for empty UniProt ID', async () => {
            await infoComponent.fetchProteinInfo('');
            
            expect(mockApiService.getProteinMetadata).not.toHaveBeenCalled();
        });

        test('should not call API for null UniProt ID', async () => {
            await infoComponent.fetchProteinInfo(null);
            
            expect(mockApiService.getProteinMetadata).not.toHaveBeenCalled();
        });
    });

    describe('formatConfidenceScore', () => {
        test('should format high confidence score', () => {
            const result = infoComponent.formatConfidenceScore(95.0);
            
            expect(result).toContain('95.0%');
            expect(result).toContain('High Confidence');
            expect(result).toContain('#27ae60'); // Green color
        });

        test('should format medium confidence score', () => {
            const result = infoComponent.formatConfidenceScore(80.0);
            
            expect(result).toContain('80.0%');
            expect(result).toContain('Medium Confidence');
            expect(result).toContain('#f39c12'); // Orange color
        });

        test('should format low confidence score', () => {
            const result = infoComponent.formatConfidenceScore(60.0);
            
            expect(result).toContain('60.0%');
            expect(result).toContain('Low Confidence');
            expect(result).toContain('#e74c3c'); // Red color
        });

        test('should handle null confidence score', () => {
            const result = infoComponent.formatConfidenceScore(null);
            
            expect(result).toBe('Unknown');
        });

        test('should handle undefined confidence score', () => {
            const result = infoComponent.formatConfidenceScore(undefined);
            
            expect(result).toBe('Unknown');
        });

        test('should round confidence score to one decimal place', () => {
            const result = infoComponent.formatConfidenceScore(85.67);
            
            expect(result).toContain('85.7%');
        });
    });

    describe('tooltip functionality', () => {
        let mockTrigger, mockTooltip;

        beforeEach(() => {
            mockTrigger = {
                getAttribute: jest.fn(() => 'confidence-explanation'),
                getBoundingClientRect: jest.fn(() => ({
                    bottom: 100,
                    left: 50
                })),
                addEventListener: jest.fn()
            };

            mockTooltip = {
                style: {
                    display: 'none',
                    position: '',
                    top: '',
                    left: '',
                    zIndex: ''
                }
            };
        });

        test('should show tooltip', () => {
            infoComponent.showTooltip(mockTooltip, mockTrigger);
            
            expect(mockTooltip.style.display).toBe('block');
            expect(mockTooltip.style.position).toBe('absolute');
            expect(mockTooltip.style.zIndex).toBe('1000');
        });

        test('should hide tooltip', () => {
            mockTooltip.style.display = 'block';
            
            infoComponent.hideTooltip(mockTooltip);
            
            expect(mockTooltip.style.display).toBe('none');
        });

        test('should toggle tooltip visibility', () => {
            // Initially hidden
            mockTooltip.style.display = 'none';
            infoComponent.toggleTooltip(mockTooltip, mockTrigger);
            expect(mockTooltip.style.display).toBe('block');
            
            // Now visible, should hide
            infoComponent.toggleTooltip(mockTooltip, mockTrigger);
            expect(mockTooltip.style.display).toBe('none');
        });
    });
});