/**
 * Unit tests for Protein model
 */

// Mock DOM environment for testing
if (typeof window === 'undefined') {
    global.window = {};
    global.document = {};
}

// Import the Protein class (assuming it's available globally or via require)
// In a real test environment, you'd use proper module imports

describe('Protein Model Tests', () => {
    describe('Constructor', () => {
        test('should create protein with valid UniProt ID', () => {
            const protein = new Protein('P69905', 'Hemoglobin', 'Homo sapiens');
            expect(protein.uniprotId).toBe('P69905');
            expect(protein.name).toBe('Hemoglobin');
            expect(protein.organism).toBe('Homo sapiens');
            expect(protein.lastUpdated).toBeInstanceOf(Date);
        });

        test('should throw error for missing UniProt ID', () => {
            expect(() => new Protein()).toThrow('UniProt ID is required');
            expect(() => new Protein('')).toThrow('UniProt ID is required');
            expect(() => new Protein(null)).toThrow('UniProt ID is required');
        });

        test('should throw error for invalid UniProt ID format', () => {
            expect(() => new Protein('123')).toThrow('Invalid UniProt ID format');
            expect(() => new Protein('TOOLONGID123')).toThrow('Invalid UniProt ID format'); // 12 chars, too long
            expect(() => new Protein('P@#$%')).toThrow('Invalid UniProt ID format');
        });

        test('should convert UniProt ID to uppercase', () => {
            const protein = new Protein('p69905');
            expect(protein.uniprotId).toBe('P69905');
        });
    });

    describe('updateMetadata', () => {
        let protein;

        beforeEach(() => {
            protein = new Protein('P69905');
        });

        test('should update protein metadata', () => {
            const metadata = {
                name: 'Hemoglobin subunit alpha',
                organism: 'Homo sapiens',
                sequenceLength: 141,
                confidenceScore: 95.5,
                description: 'Oxygen transport protein'
            };

            protein.updateMetadata(metadata);

            expect(protein.name).toBe(metadata.name);
            expect(protein.organism).toBe(metadata.organism);
            expect(protein.sequenceLength).toBe(metadata.sequenceLength);
            expect(protein.confidenceScore).toBe(metadata.confidenceScore);
            expect(protein.description).toBe(metadata.description);
        });

        test('should update lastUpdated timestamp', () => {
            const originalTime = protein.lastUpdated;
            // Wait a small amount to ensure timestamp difference
            setTimeout(() => {
                protein.updateMetadata({ name: 'Updated name' });
                expect(protein.lastUpdated).not.toEqual(originalTime);
            }, 10);
        });

        test('should handle partial metadata updates', () => {
            protein.updateMetadata({ name: 'Test Protein' });
            expect(protein.name).toBe('Test Protein');
            expect(protein.organism).toBe(''); // Should remain unchanged
        });
    });

    describe('getConfidenceLevel', () => {
        let protein;

        beforeEach(() => {
            protein = new Protein('P69905');
        });

        test('should return "high" for scores >= 90', () => {
            protein.confidenceScore = 95;
            expect(protein.getConfidenceLevel()).toBe('high');
            
            protein.confidenceScore = 90;
            expect(protein.getConfidenceLevel()).toBe('high');
        });

        test('should return "medium" for scores 70-89', () => {
            protein.confidenceScore = 85;
            expect(protein.getConfidenceLevel()).toBe('medium');
            
            protein.confidenceScore = 70;
            expect(protein.getConfidenceLevel()).toBe('medium');
        });

        test('should return "low" for scores < 70', () => {
            protein.confidenceScore = 65;
            expect(protein.getConfidenceLevel()).toBe('low');
            
            protein.confidenceScore = 0;
            expect(protein.getConfidenceLevel()).toBe('low');
        });

        test('should return "unknown" for null confidence score', () => {
            protein.confidenceScore = null;
            expect(protein.getConfidenceLevel()).toBe('unknown');
        });
    });

    describe('getSummary', () => {
        test('should return complete protein summary', () => {
            const protein = new Protein('P69905', 'Hemoglobin', 'Homo sapiens');
            protein.sequenceLength = 141;
            protein.confidenceScore = 95;
            protein.structureData = 'mock-structure-data';

            const summary = protein.getSummary();

            expect(summary).toEqual({
                uniprotId: 'P69905',
                name: 'Hemoglobin',
                organism: 'Homo sapiens',
                sequenceLength: 141,
                confidenceLevel: 'high',
                hasStructure: true,
                lastUpdated: expect.any(Date)
            });
        });
    });

    describe('hasCompleteMetadata', () => {
        let protein;

        beforeEach(() => {
            protein = new Protein('P69905');
        });

        test('should return true when all required metadata is present', () => {
            protein.name = 'Test Protein';
            protein.organism = 'Test Organism';
            protein.sequenceLength = 100;

            expect(protein.hasCompleteMetadata()).toBe(true);
        });

        test('should return false when metadata is incomplete', () => {
            expect(protein.hasCompleteMetadata()).toBe(false);
            
            protein.name = 'Test Protein';
            expect(protein.hasCompleteMetadata()).toBe(false);
            
            protein.organism = 'Test Organism';
            expect(protein.hasCompleteMetadata()).toBe(false);
        });
    });

    describe('Static Methods', () => {
        describe('isValidUniProtId', () => {
            test('should validate correct UniProt ID formats', () => {
                expect(Protein.isValidUniProtId('P69905')).toBe(true);
                expect(Protein.isValidUniProtId('Q9Y6R7')).toBe(true);
                expect(Protein.isValidUniProtId('A0A0B4J2F0')).toBe(true);
                expect(Protein.isValidUniProtId('p69905')).toBe(true); // case insensitive
            });

            test('should reject invalid UniProt ID formats', () => {
                expect(Protein.isValidUniProtId('')).toBe(false);
                expect(Protein.isValidUniProtId(null)).toBe(false);
                expect(Protein.isValidUniProtId(undefined)).toBe(false);
                expect(Protein.isValidUniProtId('123')).toBe(false); // too short
                expect(Protein.isValidUniProtId('TOOLONGID123')).toBe(false); // too long
                expect(Protein.isValidUniProtId('P@#$%')).toBe(false); // invalid characters
                expect(Protein.isValidUniProtId(12345)).toBe(false); // not a string
            });
        });

        describe('formatUniProtId', () => {
            test('should format UniProt ID to uppercase', () => {
                expect(Protein.formatUniProtId('p69905')).toBe('P69905');
                expect(Protein.formatUniProtId('q9y6r7')).toBe('Q9Y6R7');
            });

            test('should trim whitespace', () => {
                expect(Protein.formatUniProtId('  P69905  ')).toBe('P69905');
            });

            test('should handle invalid input', () => {
                expect(Protein.formatUniProtId('')).toBe('');
                expect(Protein.formatUniProtId(null)).toBe('');
                expect(Protein.formatUniProtId(undefined)).toBe('');
            });
        });
    });
});