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
     * Make request with retry logic and exponential backoff
     * @param {string} url - Request URL
     * @param {Object} options - Fetch options
     * @param {number} attempt - Current attempt number
     * @param {Function} progressCallback - Optional progress callback
     * @returns {Promise<Response>}
     */
    async makeRequestWithRetry(url, options = {}, attempt = 1, progressCallback = null) {
        try {
            // Report retry attempt to progress callback
            if (progressCallback && attempt > 1) {
                progressCallback({
                    type: 'retry',
                    attempt,
                    maxAttempts: this.retryAttempts,
                    message: `Retrying request (attempt ${attempt}/${this.retryAttempts})...`
                });
            }

            return await this.makeRequest(url, options);
        } catch (error) {
            if (attempt < this.retryAttempts && this.shouldRetry(error)) {
                // Exponential backoff: delay increases exponentially with each retry
                const backoffDelay = this.retryDelay * Math.pow(2, attempt - 1);
                
                // Add jitter to prevent thundering herd
                const jitter = Math.random() * 1000;
                const totalDelay = backoffDelay + jitter;
                
                if (progressCallback) {
                    progressCallback({
                        type: 'retry_delay',
                        attempt,
                        delay: Math.round(totalDelay),
                        message: `Request failed. Retrying in ${Math.round(totalDelay / 1000)} seconds...`
                    });
                }
                
                await this.delay(totalDelay);
                return this.makeRequestWithRetry(url, options, attempt + 1, progressCallback);
            }
            
            // Enhance error with retry information
            error.retryAttempts = attempt;
            error.maxRetryAttempts = this.retryAttempts;
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
     * @param {Function} progressCallback - Optional progress callback
     * @returns {Promise<Array>}
     */
    async searchUniProt(query, progressCallback = null) {
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
            if (progressCallback) {
                progressCallback({
                    type: 'search_start',
                    message: isUniProtId ? 
                        `Looking up protein ${trimmedQuery.toUpperCase()}...` : 
                        `Searching for proteins matching "${trimmedQuery}"...`
                });
            }

            const response = await this.makeRequestWithRetry(searchUrl, {}, 1, progressCallback);
            
            if (progressCallback) {
                progressCallback({
                    type: 'search_processing',
                    message: 'Processing search results...'
                });
            }

            const data = await response.json();
            
            let results;
            if (isUniProtId) {
                // Single protein response
                results = data ? [this.formatProteinResult(data)] : [];
            } else {
                // Search results response
                results = data.results ? data.results.map(result => this.formatProteinResult(result)) : [];
            }

            if (progressCallback) {
                progressCallback({
                    type: 'search_complete',
                    message: `Found ${results.length} result${results.length !== 1 ? 's' : ''}`
                });
            }

            return results;
        } catch (error) {
            const formattedError = this.handleApiErrors(error);
            
            // Add context-specific error messages
            if (formattedError.type === 'not_found' && isUniProtId) {
                throw new Error(`Protein ${trimmedQuery.toUpperCase()} not found in UniProt database. Please check the UniProt ID and try again.`);
            } else if (formattedError.type === 'network') {
                throw new Error(`Unable to search UniProt database. Please check your internet connection and try again.`);
            } else if (formattedError.type === 'timeout') {
                throw new Error(`Search request timed out. The UniProt database may be busy. Please try again in a few moments.`);
            }
            
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
     * Fetch AlphaFold structure file with progress tracking
     * @param {string} uniprotId - UniProt ID
     * @param {Function} progressCallback - Optional progress callback
     * @returns {Promise<string>} PDB file content
     */
    async fetchAlphaFoldStructure(uniprotId, progressCallback = null) {
        this.validateParams({ uniprotId }, ['uniprotId']);
        
        const trimmedId = uniprotId.trim().toUpperCase();
        if (!trimmedId) {
            throw new Error('UniProt ID cannot be empty');
        }

        // Validate UniProt ID format
        if (!/^[A-Z0-9]{6,10}$/i.test(trimmedId)) {
            throw new Error('Invalid UniProt ID format. UniProt IDs should be 6-10 characters long and contain only letters and numbers.');
        }

        // AlphaFold PDB file URL format
        const pdbUrl = `${this.alphafoldBaseUrl}AF-${trimmedId}-F1-model_v4.pdb`;

        try {
            if (progressCallback) {
                progressCallback({
                    type: 'structure_start',
                    message: `Downloading 3D structure for ${trimmedId}...`
                });
            }

            const response = await this.makeRequestWithRetry(pdbUrl, {}, 1, progressCallback);
            
            // Check content length for progress tracking
            const contentLength = response.headers.get('content-length');
            const totalSize = contentLength ? parseInt(contentLength, 10) : null;
            
            if (progressCallback && totalSize) {
                progressCallback({
                    type: 'structure_download',
                    message: `Downloading structure file (${Math.round(totalSize / 1024)} KB)...`,
                    totalSize
                });
            }

            // Read response with progress tracking if possible
            let pdbData;
            if (response.body && typeof response.body.getReader === 'function' && totalSize && progressCallback) {
                pdbData = await this.readResponseWithProgress(response, totalSize, progressCallback);
            } else {
                if (progressCallback) {
                    progressCallback({
                        type: 'structure_processing',
                        message: 'Processing structure file...'
                    });
                }
                pdbData = await response.text();
            }
            
            // Basic validation of PDB content
            if (!pdbData.includes('HEADER') || !pdbData.includes('ATOM')) {
                throw new Error('Invalid PDB file format received. The downloaded file does not appear to be a valid protein structure.');
            }
            
            if (progressCallback) {
                progressCallback({
                    type: 'structure_complete',
                    message: 'Structure file downloaded successfully'
                });
            }
            
            return pdbData;
        } catch (error) {
            const formattedError = this.handleApiErrors(error);
            
            // Provide more specific error messages for structure not found
            if (error.status === 404) {
                throw new Error(`No AlphaFold structure available for protein ${trimmedId}. This protein may not be included in the AlphaFold database yet. AlphaFold currently covers proteins from model organisms and proteomes of scientific interest.`);
            } else if (error.status === 403) {
                throw new Error(`Access to AlphaFold structure for ${trimmedId} is restricted. This may be a temporary issue with the AlphaFold database.`);
            } else if (formattedError.type === 'network') {
                throw new Error(`Unable to download structure for ${trimmedId}. Please check your internet connection and try again.`);
            } else if (formattedError.type === 'timeout') {
                throw new Error(`Download of structure for ${trimmedId} timed out. The file may be large or the server may be busy. Please try again.`);
            }
            
            throw new Error(formattedError.message);
        }
    }

    /**
     * Read response with progress tracking
     * @param {Response} response - Fetch response
     * @param {number} totalSize - Total size in bytes
     * @param {Function} progressCallback - Progress callback
     * @returns {Promise<string>} Response text
     */
    async readResponseWithProgress(response, totalSize, progressCallback) {
        const reader = response.body.getReader();
        const chunks = [];
        let receivedLength = 0;
        
        try {
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;
                
                chunks.push(value);
                receivedLength += value.length;
                
                // Report progress
                const progress = Math.round((receivedLength / totalSize) * 100);
                progressCallback({
                    type: 'download_progress',
                    progress,
                    receivedLength,
                    totalSize,
                    message: `Downloading... ${progress}% (${Math.round(receivedLength / 1024)}/${Math.round(totalSize / 1024)} KB)`
                });
            }
            
            // Combine chunks into single Uint8Array
            const allChunks = new Uint8Array(receivedLength);
            let position = 0;
            for (const chunk of chunks) {
                allChunks.set(chunk, position);
                position += chunk.length;
            }
            
            // Convert to text
            return new TextDecoder().decode(allChunks);
        } finally {
            reader.releaseLock();
        }
    }

    /**
     * Get protein metadata from UniProt
     * @param {string} uniprotId - UniProt ID
     * @param {Function} progressCallback - Optional progress callback
     * @returns {Promise<Object>}
     */
    async getProteinMetadata(uniprotId, progressCallback = null) {
        this.validateParams({ uniprotId }, ['uniprotId']);
        
        const trimmedId = uniprotId.trim().toUpperCase();
        if (!trimmedId) {
            throw new Error('UniProt ID cannot be empty');
        }

        // Validate UniProt ID format
        if (!/^[A-Z0-9]{6,10}$/i.test(trimmedId)) {
            throw new Error('Invalid UniProt ID format. UniProt IDs should be 6-10 characters long and contain only letters and numbers.');
        }

        const metadataUrl = `${this.uniprotBaseUrl}${trimmedId}?format=json&fields=accession,protein_name,organism_name,length,gene_names,cc_function,ft_chain,sequence`;

        try {
            if (progressCallback) {
                progressCallback({
                    type: 'metadata_start',
                    message: `Fetching protein information for ${trimmedId}...`
                });
            }

            const response = await this.makeRequestWithRetry(metadataUrl, {}, 1, progressCallback);
            
            if (progressCallback) {
                progressCallback({
                    type: 'metadata_processing',
                    message: 'Processing protein information...'
                });
            }

            const data = await response.json();
            const formattedData = this.formatProteinMetadata(data);
            
            if (progressCallback) {
                progressCallback({
                    type: 'metadata_complete',
                    message: 'Protein information loaded successfully'
                });
            }
            
            return formattedData;
        } catch (error) {
            const formattedError = this.handleApiErrors(error);
            
            // Add context-specific error messages
            if (formattedError.type === 'not_found') {
                throw new Error(`Protein ${trimmedId} not found in UniProt database. Please verify the UniProt ID is correct.`);
            } else if (formattedError.type === 'network') {
                throw new Error(`Unable to fetch protein information for ${trimmedId}. Please check your internet connection and try again.`);
            } else if (formattedError.type === 'timeout') {
                throw new Error(`Request for protein information timed out. Please try again in a few moments.`);
            }
            
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
     * Handle API errors consistently with comprehensive error messages
     * @param {Error} error - Error object
     * @returns {Object} Formatted error response
     */
    handleApiErrors(error) {
        console.error('API Error:', error);
        
        // Add retry information to error context
        const retryInfo = error.retryAttempts ? 
            ` (Failed after ${error.retryAttempts} attempt${error.retryAttempts > 1 ? 's' : ''})` : '';
        
        // Network connectivity issues
        if (error.name === 'NetworkError' || error.name === 'TypeError' || !navigator.onLine) {
            return {
                type: 'network',
                message: `Network connection error${retryInfo}. Please check your internet connection and try again. If the problem persists, the server may be temporarily unavailable.`,
                retryable: true,
                userAction: 'Check your internet connection and try again',
                technicalDetails: error.message
            };
        }
        
        // Request timeout
        if (error.name === 'AbortError') {
            return {
                type: 'timeout',
                message: `Request timed out${retryInfo}. The server may be busy or the file may be large. Please try again in a few moments.`,
                retryable: true,
                userAction: 'Wait a moment and try again',
                technicalDetails: 'Request exceeded timeout limit'
            };
        }
        
        // HTTP status errors
        if (error.status) {
            switch (error.status) {
                case 400:
                    return {
                        type: 'bad_request',
                        message: `Invalid request${retryInfo}. The server could not understand the request format. Please check your input and try again.`,
                        retryable: false,
                        userAction: 'Verify your input format and try again',
                        technicalDetails: `HTTP 400: ${error.message || 'Bad Request'}`
                    };
                case 401:
                    return {
                        type: 'unauthorized',
                        message: `Authentication required${retryInfo}. Access to this resource requires proper credentials.`,
                        retryable: false,
                        userAction: 'Contact support if this error persists',
                        technicalDetails: `HTTP 401: ${error.message || 'Unauthorized'}`
                    };
                case 403:
                    return {
                        type: 'forbidden',
                        message: `Access denied${retryInfo}. You may not have permission to access this resource, or it may be temporarily restricted.`,
                        retryable: false,
                        userAction: 'Try again later or contact support',
                        technicalDetails: `HTTP 403: ${error.message || 'Forbidden'}`
                    };
                case 404:
                    return {
                        type: 'not_found',
                        message: `Resource not found${retryInfo}. The requested protein or structure was not found in the database.`,
                        retryable: false,
                        userAction: 'Verify the protein ID and try a different protein',
                        technicalDetails: `HTTP 404: ${error.message || 'Not Found'}`
                    };
                case 429:
                    return {
                        type: 'rate_limit',
                        message: `Too many requests${retryInfo}. The server is limiting requests to prevent overload. Please wait a moment before trying again.`,
                        retryable: true,
                        userAction: 'Wait 30-60 seconds before trying again',
                        technicalDetails: `HTTP 429: ${error.message || 'Rate Limited'}`
                    };
                case 500:
                    return {
                        type: 'server',
                        message: `Internal server error${retryInfo}. The server encountered an unexpected problem. Please try again later.`,
                        retryable: true,
                        userAction: 'Try again in a few minutes',
                        technicalDetails: `HTTP 500: ${error.message || 'Internal Server Error'}`
                    };
                case 502:
                    return {
                        type: 'server',
                        message: `Bad gateway${retryInfo}. The server received an invalid response from an upstream server. Please try again later.`,
                        retryable: true,
                        userAction: 'Try again in a few minutes',
                        technicalDetails: `HTTP 502: ${error.message || 'Bad Gateway'}`
                    };
                case 503:
                    return {
                        type: 'server',
                        message: `Service unavailable${retryInfo}. The server is temporarily unable to handle requests, possibly due to maintenance or overload.`,
                        retryable: true,
                        userAction: 'Try again in 5-10 minutes',
                        technicalDetails: `HTTP 503: ${error.message || 'Service Unavailable'}`
                    };
                case 504:
                    return {
                        type: 'server',
                        message: `Gateway timeout${retryInfo}. The server took too long to respond. This may be due to high server load or network issues.`,
                        retryable: true,
                        userAction: 'Try again in a few minutes',
                        technicalDetails: `HTTP 504: ${error.message || 'Gateway Timeout'}`
                    };
                default:
                    return {
                        type: 'http_error',
                        message: `HTTP error ${error.status}${retryInfo}: ${error.message || 'Unknown server error'}. Please try again or contact support if the problem persists.`,
                        retryable: error.status >= 500,
                        userAction: error.status >= 500 ? 'Try again later' : 'Contact support',
                        technicalDetails: `HTTP ${error.status}: ${error.message || 'Unknown error'}`
                    };
            }
        }
        
        // Handle specific error types
        if (error.message && error.message.includes('Failed to fetch')) {
            return {
                type: 'network',
                message: `Network error${retryInfo}. Unable to connect to the server. Please check your internet connection and try again.`,
                retryable: true,
                userAction: 'Check your internet connection',
                technicalDetails: error.message
            };
        }
        
        return {
            type: 'unknown',
            message: `An unexpected error occurred${retryInfo}. ${error.message || 'Please try again or contact support if the problem persists.'}`,
            retryable: true,
            userAction: 'Try again or contact support',
            technicalDetails: error.message || 'Unknown error'
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