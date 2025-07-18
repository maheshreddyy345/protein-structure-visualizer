/**
 * Unit tests for protein utility functions
 */

// Import utility functions (assuming they're available globally or via require)
// In a real test environment, you'd use proper module imports

describe('Protein Utilities Tests', () => {
    describe('isValidUniProtId', () => {
        test('should validate correct UniProt ID formats', () => {
            expect(isValidUniProtId('P69905')).toBe(true);
            expect(isValidUniProtId('Q9Y6R7')).toBe(true);
            expect(isValidUniProtId('A0A0B4J2F0')).toBe(true);
            expect(isValidUniProtId('p69905')).toBe(true); // case insensitive
            expect(isValidUniProtId('  P69905  ')).toBe(true); // with whitespace
        });

        test('should reject invalid UniProt ID formats', () => {
            expect(isValidUniProtId('')).toBe(false);
            expect(isValidUniProtId(null)).toBe(false);
            expect(isValidUniProtId(undefined)).toBe(false);
            expect(isValidUniProtId('123')).toBe(false); // too short
            expect(isValidUniProtId('TOOLONGID123')).toBe(false); // too long
            expect(isValidUniProtId('P@#$%')).toBe(false); // invalid characters
            expect(isValidUniProtId(12345)).toBe(false); // not a string
        });
    });

    describe('formatUniProtId', () => {
        test('should format UniProt ID correctly', () => {
            expect(formatUniProtId('p69905')).toBe('P69905');
            expect(formatUniProtId('q9y6r7')).toBe('Q9Y6R7');
            expect(formatUniProtId('  P69905  ')).toBe('P69905');
        });

        test('should handle invalid input', () => {
            expect(formatUniProtId('')).toBe('');
            expect(formatUniProtId(null)).toBe('');
            expect(formatUniProtId(undefined)).toBe('');
        });
    });

    describe('isValidProteinName', () => {
        test('should validate correct protein names', () => {
            expect(isValidProteinName('Hemoglobin')).toBe(true);
            expect(isValidProteinName('Cytochrome c oxidase')).toBe(true);
            expect(isValidProteinName('ATP synthase subunit alpha')).toBe(true);
        });

        test('should reject invalid protein names', () => {
            expect(isValidProteinName('')).toBe(false);
            expect(isValidProteinName('   ')).toBe(false);
            expect(isValidProteinName(null)).toBe(false);
            expect(isValidProteinName(undefined)).toBe(false);
            expect(isValidProteinName('a'.repeat(201))).toBe(false); // too long
        });
    });

    describe('formatConfidenceScore', () => {
        test('should format confidence scores correctly', () => {
            expect(formatConfidenceScore(95.7)).toBe('96%');
            expect(formatConfidenceScore(85.2)).toBe('85%');
            expect(formatConfidenceScore(70)).toBe('70%');
            expect(formatConfidenceScore(0)).toBe('0%');
        });

        test('should handle invalid scores', () => {
            expect(formatConfidenceScore(null)).toBe('Unknown');
            expect(formatConfidenceScore(undefined)).toBe('Unknown');
            expect(formatConfidenceScore('invalid')).toBe('Invalid');
            expect(formatConfidenceScore(NaN)).toBe('Invalid');
        });
    });

    describe('getConfidenceLevel', () => {
        test('should return correct confidence levels', () => {
            expect(getConfidenceLevel(95)).toBe('high');
            expect(getConfidenceLevel(90)).toBe('high');
            expect(getConfidenceLevel(85)).toBe('medium');
            expect(getConfidenceLevel(70)).toBe('medium');
            expect(getConfidenceLevel(65)).toBe('low');
            expect(getConfidenceLevel(0)).toBe('low');
        });

        test('should handle invalid scores', () => {
            expect(getConfidenceLevel(null)).toBe('unknown');
            expect(getConfidenceLevel(undefined)).toBe('unknown');
            expect(getConfidenceLevel('invalid')).toBe('unknown');
        });
    });

    describe('isValidSequenceLength', () => {
        test('should validate correct sequence lengths', () => {
            expect(isValidSequenceLength(100)).toBe(true);
            expect(isValidSequenceLength(1)).toBe(true);
            expect(isValidSequenceLength(10000)).toBe(true);
        });

        test('should reject invalid sequence lengths', () => {
            expect(isValidSequenceLength(0)).toBe(false);
            expect(isValidSequenceLength(-1)).toBe(false);
            expect(isValidSequenceLength(1.5)).toBe(false); // not integer
            expect(isValidSequenceLength('100')).toBe(false); // not number
            expect(isValidSequenceLength(null)).toBe(false);
        });
    });

    describe('formatSequenceLength', () => {
        test('should format sequence lengths correctly', () => {
            expect(formatSequenceLength(100)).toBe('100 amino acids');
            expect(formatSequenceLength(1000)).toBe('1,000 amino acids');
            expect(formatSequenceLength(1)).toBe('1 amino acids');
        });

        test('should handle invalid lengths', () => {
            expect(formatSequenceLength(0)).toBe('Unknown');
            expect(formatSequenceLength(-1)).toBe('Unknown');
            expect(formatSequenceLength('invalid')).toBe('Unknown');
            expect(formatSequenceLength(null)).toBe('Unknown');
        });
    });

    describe('sanitizeDescription', () => {
        test('should sanitize descriptions correctly', () => {
            expect(sanitizeDescription('  Valid description  ')).toBe('Valid description');
            expect(sanitizeDescription('Normal description')).toBe('Normal description');
        });

        test('should limit description length', () => {
            const longDescription = 'a'.repeat(600);
            const result = sanitizeDescription(longDescription);
            expect(result.length).toBe(500);
        });

        test('should handle invalid input', () => {
            expect(sanitizeDescription('')).toBe('');
            expect(sanitizeDescription(null)).toBe('');
            expect(sanitizeDescription(undefined)).toBe('');
        });
    });

    describe('parseOrganismName', () => {
        test('should parse organism names correctly', () => {
            expect(parseOrganismName('Homo sapiens (Human)')).toBe('Homo sapiens');
            expect(parseOrganismName('Escherichia coli (strain K12)')).toBe('Escherichia coli');
            expect(parseOrganismName('Saccharomyces cerevisiae')).toBe('Saccharomyces cerevisiae');
        });

        test('should handle invalid input', () => {
            expect(parseOrganismName('')).toBe('');
            expect(parseOrganismName(null)).toBe('');
            expect(parseOrganismName(undefined)).toBe('');
        });
    });
});