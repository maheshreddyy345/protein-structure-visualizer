/**
 * Protein model class for managing protein data
 */
class Protein {
    constructor(uniprotId, name = '', organism = '') {
        if (!uniprotId) {
            throw new Error('UniProt ID is required');
        }
        if (!Protein.isValidUniProtId(uniprotId)) {
            throw new Error('Invalid UniProt ID format');
        }
        
        this.uniprotId = uniprotId.toUpperCase();
        this.name = name;
        this.organism = organism;
        this.sequenceLength = null;
        this.confidenceScore = null;
        this.description = null;
        this.structureData = null;
        this.lastUpdated = new Date();
    }

    /**
     * Load structure data for this protein
     * @returns {Promise<void>}
     */
    async loadStructure() {
        // Implementation will be added in later tasks
        console.log(`Loading structure for protein ${this.uniprotId}`);
    }

    /**
     * Get confidence level based on score
     * @returns {string} 'high', 'medium', or 'low'
     */
    getConfidenceLevel() {
        if (this.confidenceScore === null) return 'unknown';
        if (this.confidenceScore >= 90) return 'high';
        if (this.confidenceScore >= 70) return 'medium';
        return 'low';
    }

    /**
     * Update protein metadata
     * @param {Object} metadata - Protein metadata object
     */
    updateMetadata(metadata) {
        if (metadata.name) this.name = metadata.name;
        if (metadata.organism) this.organism = metadata.organism;
        if (metadata.sequenceLength) this.sequenceLength = metadata.sequenceLength;
        if (metadata.confidenceScore !== undefined) this.confidenceScore = metadata.confidenceScore;
        if (metadata.description) this.description = metadata.description;
        this.lastUpdated = new Date();
    }

    /**
     * Get a summary of the protein data
     * @returns {Object}
     */
    getSummary() {
        return {
            uniprotId: this.uniprotId,
            name: this.name,
            organism: this.organism,
            sequenceLength: this.sequenceLength,
            confidenceLevel: this.getConfidenceLevel(),
            hasStructure: this.structureData !== null,
            lastUpdated: this.lastUpdated
        };
    }

    /**
     * Check if protein has complete metadata
     * @returns {boolean}
     */
    hasCompleteMetadata() {
        return !!(this.name && this.organism && this.sequenceLength !== null);
    }

    /**
     * Validate UniProt ID format
     * @param {string} id - UniProt ID to validate
     * @returns {boolean}
     */
    static isValidUniProtId(id) {
        if (!id || typeof id !== 'string') return false;
        // UniProt ID format: 6-10 alphanumeric characters
        const uniprotRegex = /^[A-Z0-9]{6,10}$/i;
        return uniprotRegex.test(id);
    }

    /**
     * Format UniProt ID to standard format
     * @param {string} id - UniProt ID to format
     * @returns {string}
     */
    static formatUniProtId(id) {
        if (!id || typeof id !== 'string') return '';
        return id.trim().toUpperCase();
    }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Protein;
}