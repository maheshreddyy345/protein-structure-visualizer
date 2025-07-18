/**
 * Utility functions for protein data handling
 */

/**
 * Validate UniProt ID format
 * @param {string} id - UniProt ID to validate
 * @returns {boolean}
 */
function isValidUniProtId(id) {
    if (!id || typeof id !== 'string') return false;
    // UniProt ID format: 6-10 alphanumeric characters
    const uniprotRegex = /^[A-Z0-9]{6,10}$/i;
    return uniprotRegex.test(id.trim());
}

/**
 * Format UniProt ID to standard format
 * @param {string} id - UniProt ID to format
 * @returns {string}
 */
function formatUniProtId(id) {
    if (!id || typeof id !== 'string') return '';
    return id.trim().toUpperCase();
}

/**
 * Validate protein name format
 * @param {string} name - Protein name to validate
 * @returns {boolean}
 */
function isValidProteinName(name) {
    if (!name || typeof name !== 'string') return false;
    // Basic validation: non-empty string with reasonable length
    const trimmed = name.trim();
    return trimmed.length > 0 && trimmed.length <= 200;
}

/**
 * Format confidence score for display
 * @param {number} score - Confidence score (0-100)
 * @returns {string}
 */
function formatConfidenceScore(score) {
    if (score === null || score === undefined) return 'Unknown';
    if (typeof score !== 'number' || isNaN(score)) return 'Invalid';
    return `${Math.round(score)}%`;
}

/**
 * Get confidence level from score
 * @param {number} score - Confidence score (0-100)
 * @returns {string}
 */
function getConfidenceLevel(score) {
    if (score === null || score === undefined || typeof score !== 'number') return 'unknown';
    if (score >= 90) return 'high';
    if (score >= 70) return 'medium';
    return 'low';
}

/**
 * Validate sequence length
 * @param {number} length - Sequence length
 * @returns {boolean}
 */
function isValidSequenceLength(length) {
    return typeof length === 'number' && length > 0 && Number.isInteger(length);
}

/**
 * Format sequence length for display
 * @param {number} length - Sequence length
 * @returns {string}
 */
function formatSequenceLength(length) {
    if (!isValidSequenceLength(length)) return 'Unknown';
    return `${length.toLocaleString()} amino acids`;
}

/**
 * Sanitize protein description text
 * @param {string} description - Raw description text
 * @returns {string}
 */
function sanitizeDescription(description) {
    if (!description || typeof description !== 'string') return '';
    // Remove excessive whitespace and limit length
    return description.trim().substring(0, 500);
}

/**
 * Parse organism name from UniProt format
 * @param {string} organism - Raw organism string
 * @returns {string}
 */
function parseOrganismName(organism) {
    if (!organism || typeof organism !== 'string') return '';
    // Extract scientific name from format like "Homo sapiens (Human)"
    const match = organism.match(/^([^(]+)/);
    return match ? match[1].trim() : organism.trim();
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isValidUniProtId,
        formatUniProtId,
        isValidProteinName,
        formatConfidenceScore,
        getConfidenceLevel,
        isValidSequenceLength,
        formatSequenceLength,
        sanitizeDescription,
        parseOrganismName
    };
}