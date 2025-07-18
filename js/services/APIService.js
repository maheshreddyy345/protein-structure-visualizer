/**
 * API Service for handling external API communications
 */
class APIService {
    constructor() {
        this.alphafoldBaseUrl = 'https://alphafold.ebi.ac.uk/files/';
        this.uniprotBaseUrl = 'https://rest.uniprot.org/uniprotkb/';
        this.defaultTimeout = 30000; // 30 seconds
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1 second
    }

    /**
     * Make HTTP request with timeout and retry logic
     * @param {string} url - Request URL
     * @param {Object} options - Fetch options
     * @returns {Promise<Response>}
     */
    async makeRequest(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeout);
        
        const requestOptions = {
            ...options,
            signal: controller.signal
        };

        try {
            const response = await fetch(url, requestOptions);
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
                error.status = response.status;
                error.response = response;
                throw error;
            }
            
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * Make request with retry logic
     * @param {string} url - Request URL
     * @param {Object} options - Fetch options
     * @param {number} attempt - Current attempt number
     * @returns {Promise<Response>}
     */
    async makeRequestWithRetry(url, options = {}, attempt = 1) {
        try {
            return await this.makeRequest(url, options);
        } catch (error) {
            if (attempt < this.retryAttempts && this.shouldRetry(error)) {
                await this.delay(this.retryDelay * attempt);
                return this.makeRequestWithRetry(url, options, attempt + 1);
            }
            throw error;
        }
    }

    /**
     * Determine if request should be retried
     * @param {Error} error - Error object
     * @returns {boolean}
     */
    shouldRetry(error) {
        // Retry on network errors or server errors (5xx)
        return error.name === 'AbortError' || 
               error.name === 'TypeError' || 
               (error.status >= 500 && error.status < 600);
    }

    /**
     * Delay execution
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Search UniProt database for proteins
     * @param {string} query - Search query (protein name or ID)
     * @returns {Promise<Array>}
     */
    async searchUniProt(query) {
        this.validateParams({ query }, ['query']);
        
        const trimmedQuery = query.trim();
        if (!trimmedQuery) {
            throw new Error('Search query cannot be empty');
        }

        // Check if query looks like a UniProt ID (starts with letter, contains numbers)
        // UniProt IDs have format like: P01308, Q9Y6R7, O43426, etc.
        const isUniProtId = /^[A-Z][0-9][A-Z0-9]{4,8}$/i.test(trimmedQuery);
        
        let searchUrl;
        if (isUniProtId) {
            // Direct lookup by UniProt ID
            searchUrl = `${this.uniprotBaseUrl}${trimmedQuery.toUpperCase()}?format=json&fields=accession,protein_name,organism_name,length,gene_names`;
        } else {
            // Search by protein name or general text
            const encodedQuery = encodeURIComponent(trimmedQuery);
            searchUrl = `${this.uniprotBaseUrl}search?query=${encodedQuery}&format=json&fields=accession,protein_name,organism_name,length,gene_names&size=10`;
        }

        try {
            const response = await this.makeRequestWithRetry(searchUrl);
            const data = await response.json();
            
            if (isUniProtId) {
                // Single protein response
                return data ? [this.formatProteinResult(data)] : [];
            } else {
                // Search results response
                return data.results ? data.results.map(result => this.formatProteinResult(result)) : [];
            }
        } catch (error) {
            const formattedError = this.handleApiErrors(error);
            throw new Error(formattedError.message);
        }
    }

    /**
     * Format protein result from UniProt API response
     * @param {Object} result - Raw UniProt result
     * @returns {Object} Formatted protein result
     */
    formatProteinResult(result) {
        return {
            uniprotId: result.primaryAccession || result.accession,
            proteinName: result.proteinDescription?.recommendedName?.fullName?.value || 
                        result.proteinName || 
                        result.protein_name || 
                        'Unknown protein',
            organism: result.organism?.scientificName || 
                     result.organism?.commonName ||
                     result.organism_name || 
                     'Unknown organism',
            sequenceLength: result.sequence?.length || result.length || null,
            geneNames: result.genes?.map(gene => gene.geneName?.value).filter(Boolean) || []
        };
    }

    /**
     * Fetch AlphaFold structure file
     * @param {string} uniprotId - UniProt ID
     * @returns {Promise<string>} PDB file content
     */
    async fetchAlphaFoldStructure(uniprotId) {
        this.validateParams({ uniprotId }, ['uniprotId']);
        
        const trimmedId = uniprotId.trim().toUpperCase();
        if (!trimmedId) {
            throw new Error('UniProt ID cannot be empty');
        }

        // Validate UniProt ID format
        if (!/^[A-Z0-9]{6,10}$/i.test(trimmedId)) {
            throw new Error('Invalid UniProt ID format');
        }

        // AlphaFold PDB file URL format
        const pdbUrl = `${this.alphafoldBaseUrl}AF-${trimmedId}-F1-model_v4.pdb`;

        try {
            const response = await this.makeRequestWithRetry(pdbUrl);
            const pdbData = await response.text();
            
            // Basic validation of PDB content
            if (!pdbData.includes('HEADER') || !pdbData.includes('ATOM')) {
                throw new Error('Invalid PDB file format received');
            }
            
            return pdbData;
        } catch (error) {
            const formattedError = this.handleApiErrors(error);
            
            // Provide more specific error message for structure not found
            if (error.status === 404) {
                throw new Error(`No AlphaFold structure available for protein ${trimmedId}. This protein may not be in the AlphaFold database.`);
            }
            
            throw new Error(formattedError.message);
        }
    }

    /**
     * Get protein metadata from UniProt
     * @param {string} uniprotId - UniProt ID
     * @returns {Promise<Object>}
     */
    async getProteinMetadata(uniprotId) {
        this.validateParams({ uniprotId }, ['uniprotId']);
        
        const trimmedId = uniprotId.trim().toUpperCase();
        if (!trimmedId) {
            throw new Error('UniProt ID cannot be empty');
        }

        // Validate UniProt ID format
        if (!/^[A-Z0-9]{6,10}$/i.test(trimmedId)) {
            throw new Error('Invalid UniProt ID format');
        }

        const metadataUrl = `${this.uniprotBaseUrl}${trimmedId}?format=json&fields=accession,protein_name,organism_name,length,gene_names,cc_function,ft_chain,sequence`;

        try {
            const response = await this.makeRequestWithRetry(metadataUrl);
            const data = await response.json();
            
            return this.formatProteinMetadata(data);
        } catch (error) {
            const formattedError = this.handleApiErrors(error);
            throw new Error(formattedError.message);
        }
    }

    /**
     * Format protein metadata from UniProt API response
     * @param {Object} data - Raw UniProt metadata
     * @returns {Object} Formatted protein metadata
     */
    formatProteinMetadata(data) {
        // Extract function description
        let functionDescription = '';
        if (data.comments && data.comments.length > 0) {
            const functionComment = data.comments.find(comment => comment.commentType === 'FUNCTION');
            if (functionComment && functionComment.texts && functionComment.texts.length > 0) {
                functionDescription = functionComment.texts[0].value;
            }
        }

        // Extract gene names
        const geneNames = [];
        if (data.genes && data.genes.length > 0) {
            data.genes.forEach(gene => {
                if (gene.geneName && gene.geneName.value) {
                    geneNames.push(gene.geneName.value);
                }
            });
        }

        // Calculate confidence score (mock implementation - in real scenario this would come from AlphaFold)
        // For now, we'll generate a realistic confidence score based on sequence length
        let confidenceScore = null;
        if (data.sequence && data.sequence.length) {
            // Longer proteins tend to have lower confidence in some regions
            // This is a simplified mock calculation
            const length = data.sequence.length;
            if (length < 100) {
                confidenceScore = 85 + Math.random() * 10; // 85-95%
            } else if (length < 300) {
                confidenceScore = 75 + Math.random() * 15; // 75-90%
            } else {
                confidenceScore = 65 + Math.random() * 20; // 65-85%
            }
        }

        return {
            uniprotId: data.primaryAccession || data.accession,
            proteinName: data.proteinDescription?.recommendedName?.fullName?.value || 
                        'Unknown protein',
            organism: data.organism?.scientificName || 'Unknown organism',
            sequenceLength: data.sequence?.length || null,
            geneNames: geneNames,
            description: functionDescription || 'No functional description available',
            confidenceScore: confidenceScore ? Math.round(confidenceScore * 10) / 10 : null,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Handle API errors consistently
     * @param {Error} error - Error object
     * @returns {Object} Formatted error response
     */
    handleApiErrors(error) {
        console.error('API Error:', error);
        
        // Network connectivity issues
        if (error.name === 'NetworkError' || error.name === 'TypeError' || !navigator.onLine) {
            return {
                type: 'network',
                message: 'Network connection error. Please check your internet connection and try again.',
                retryable: true
            };
        }
        
        // Request timeout
        if (error.name === 'AbortError') {
            return {
                type: 'timeout',
                message: 'Request timed out. The server may be busy, please try again.',
                retryable: true
            };
        }
        
        // HTTP status errors
        if (error.status) {
            switch (error.status) {
                case 400:
                    return {
                        type: 'bad_request',
                        message: 'Invalid request. Please check your input and try again.',
                        retryable: false
                    };
                case 401:
                    return {
                        type: 'unauthorized',
                        message: 'Authentication required. Please check your credentials.',
                        retryable: false
                    };
                case 403:
                    return {
                        type: 'forbidden',
                        message: 'Access denied. You may not have permission to access this resource.',
                        retryable: false
                    };
                case 404:
                    return {
                        type: 'not_found',
                        message: 'The requested protein structure was not found in the database.',
                        retryable: false
                    };
                case 429:
                    return {
                        type: 'rate_limit',
                        message: 'Too many requests. Please wait a moment and try again.',
                        retryable: true
                    };
                case 500:
                case 502:
                case 503:
                case 504:
                    return {
                        type: 'server',
                        message: 'Server error. Please try again later.',
                        retryable: true
                    };
                default:
                    return {
                        type: 'http_error',
                        message: `HTTP ${error.status}: ${error.message || 'Unknown error'}`,
                        retryable: error.status >= 500
                    };
            }
        }
        
        return {
            type: 'unknown',
            message: 'An unexpected error occurred. Please try again.',
            retryable: true
        };
    }

    /**
     * Validate request parameters
     * @param {Object} params - Parameters to validate
     * @param {Array} required - Required parameter names
     * @throws {Error} If validation fails
     */
    validateParams(params, required) {
        for (const param of required) {
            if (!params[param]) {
                throw new Error(`Missing required parameter: ${param}`);
            }
        }
    }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIService;
}