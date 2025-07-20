/**
 * Unit tests for APIService
 */

// Mock fetch for testing
global.fetch = jest.fn();
global.AbortController = jest.fn(() => ({
    abort: jest.fn(),
    signal: {}
}));
global.setTimeout = jest.fn((fn) => fn());
global.clearTimeout = jest.fn();
global.TextDecoder = jest.fn().mockImplementation(() => ({
    decode: jest.fn((data) => 'HELLO WORLD')
}));

describe('APIService Tests', () => {
    let apiService;

    beforeEach(() => {
        apiService = new APIService();
        fetch.mockClear();
        jest.clearAllMocks();
    });

    describe('Constructor', () => {
        test('should initialize with correct default values', () => {
            expect(apiService.alphafoldBaseUrl).toBe('https://alphafold.ebi.ac.uk/files/');
            expect(apiService.uniprotBaseUrl).toBe('https://rest.uniprot.org/uniprotkb/');
            expect(apiService.defaultTimeout).toBe(30000);
            expect(apiService.retryAttempts).toBe(3);
            expect(apiService.retryDelay).toBe(1000);
        });
    });

    describe('makeRequest', () => {
        test('should make successful HTTP request', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: () => Promise.resolve({ data: 'test' })
            };
            fetch.mockResolvedValueOnce(mockResponse);

            const response = await apiService.makeRequest('https://example.com');
            
            expect(fetch).toHaveBeenCalledWith('https://example.com', {
                signal: expect.any(Object)
            });
            expect(response).toBe(mockResponse);
        });

        test('should throw error for HTTP error status', async () => {
            const mockResponse = {
                ok: false,
                status: 404,
                statusText: 'Not Found'
            };
            fetch.mockResolvedValueOnce(mockResponse);

            await expect(apiService.makeRequest('https://example.com'))
                .rejects.toThrow('HTTP 404: Not Found');
        });

        test('should handle network errors', async () => {
            const networkError = new Error('Network error');
            networkError.name = 'TypeError';
            fetch.mockRejectedValueOnce(networkError);

            await expect(apiService.makeRequest('https://example.com'))
                .rejects.toThrow('Network error');
        });
    });

    describe('makeRequestWithRetry', () => {
        test('should retry on retryable errors', async () => {
            const networkError = new Error('Network error');
            networkError.name = 'TypeError';
            
            fetch
                .mockRejectedValueOnce(networkError)
                .mockRejectedValueOnce(networkError)
                .mockResolvedValueOnce({ ok: true, status: 200 });

            const response = await apiService.makeRequestWithRetry('https://example.com');
            
            expect(fetch).toHaveBeenCalledTimes(3);
            expect(response.ok).toBe(true);
        });

        test('should not retry on non-retryable errors', async () => {
            const clientError = new Error('Bad Request');
            clientError.status = 400;
            fetch.mockRejectedValueOnce(clientError);

            await expect(apiService.makeRequestWithRetry('https://example.com'))
                .rejects.toThrow('Bad Request');
            
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        test('should give up after max retry attempts', async () => {
            const networkError = new Error('Network error');
            networkError.name = 'TypeError';
            fetch.mockRejectedValue(networkError);

            await expect(apiService.makeRequestWithRetry('https://example.com'))
                .rejects.toThrow('Network error');
            
            expect(fetch).toHaveBeenCalledTimes(3);
        });

        test('should use exponential backoff for retries', async () => {
            const networkError = new Error('Network error');
            networkError.name = 'TypeError';
            
            const delaySpy = jest.spyOn(apiService, 'delay').mockResolvedValue();
            
            fetch
                .mockRejectedValueOnce(networkError)
                .mockRejectedValueOnce(networkError)
                .mockResolvedValueOnce({ ok: true, status: 200 });

            await apiService.makeRequestWithRetry('https://example.com');
            
            // Should have called delay twice (for 2nd and 3rd attempts)
            expect(delaySpy).toHaveBeenCalledTimes(2);
            
            // First retry should have base delay + jitter
            const firstDelayCall = delaySpy.mock.calls[0][0];
            expect(firstDelayCall).toBeGreaterThanOrEqual(1000); // Base delay
            expect(firstDelayCall).toBeLessThan(3000); // Base delay + max jitter
            
            // Second retry should have exponential backoff
            const secondDelayCall = delaySpy.mock.calls[1][0];
            expect(secondDelayCall).toBeGreaterThanOrEqual(2000); // 2x base delay
            expect(secondDelayCall).toBeLessThan(4000); // 2x base delay + max jitter
            
            delaySpy.mockRestore();
        });

        test('should call progress callback during retries', async () => {
            const networkError = new Error('Network error');
            networkError.name = 'TypeError';
            
            const progressCallback = jest.fn();
            const delaySpy = jest.spyOn(apiService, 'delay').mockResolvedValue();
            
            fetch
                .mockRejectedValueOnce(networkError)
                .mockResolvedValueOnce({ ok: true, status: 200 });

            await apiService.makeRequestWithRetry('https://example.com', {}, 1, progressCallback);
            
            // Should call progress callback for retry attempt and retry delay
            expect(progressCallback).toHaveBeenCalledWith({
                type: 'retry',
                attempt: 2,
                maxAttempts: 3,
                message: 'Retrying request (attempt 2/3)...'
            });
            
            expect(progressCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'retry_delay',
                    delay: expect.any(Number),
                    message: expect.stringContaining('Retrying in')
                })
            );
            
            delaySpy.mockRestore();
        });

        test('should add retry information to final error', async () => {
            const networkError = new Error('Network error');
            networkError.name = 'TypeError';
            fetch.mockRejectedValue(networkError);

            try {
                await apiService.makeRequestWithRetry('https://example.com');
            } catch (error) {
                expect(error.retryAttempts).toBe(3);
                expect(error.maxRetryAttempts).toBe(3);
            }
        });
    });

    describe('shouldRetry', () => {
        test('should retry on network errors', () => {
            const networkError = new Error('Network error');
            networkError.name = 'TypeError';
            expect(apiService.shouldRetry(networkError)).toBe(true);
        });

        test('should retry on timeout errors', () => {
            const timeoutError = new Error('Timeout');
            timeoutError.name = 'AbortError';
            expect(apiService.shouldRetry(timeoutError)).toBe(true);
        });

        test('should retry on server errors', () => {
            const serverError = new Error('Server Error');
            serverError.status = 500;
            expect(apiService.shouldRetry(serverError)).toBe(true);
        });

        test('should not retry on client errors', () => {
            const clientError = new Error('Bad Request');
            clientError.status = 400;
            expect(apiService.shouldRetry(clientError)).toBe(false);
        });
    });

    describe('handleApiErrors', () => {
        test('should handle network errors with retry information', () => {
            const networkError = new Error('Network error');
            networkError.name = 'TypeError';
            networkError.retryAttempts = 3;
            
            const result = apiService.handleApiErrors(networkError);
            
            expect(result.type).toBe('network');
            expect(result.retryable).toBe(true);
            expect(result.message).toContain('Network connection error (Failed after 3 attempts)');
            expect(result.userAction).toBe('Check your internet connection and try again');
            expect(result.technicalDetails).toBe('Network error');
        });

        test('should handle timeout errors with detailed information', () => {
            const timeoutError = new Error('Timeout');
            timeoutError.name = 'AbortError';
            timeoutError.retryAttempts = 2;
            
            const result = apiService.handleApiErrors(timeoutError);
            
            expect(result.type).toBe('timeout');
            expect(result.retryable).toBe(true);
            expect(result.message).toContain('Request timed out (Failed after 2 attempts)');
            expect(result.userAction).toBe('Wait a moment and try again');
        });

        test('should handle 404 errors with specific guidance', () => {
            const notFoundError = new Error('Not Found');
            notFoundError.status = 404;
            
            const result = apiService.handleApiErrors(notFoundError);
            
            expect(result.type).toBe('not_found');
            expect(result.retryable).toBe(false);
            expect(result.message).toContain('Resource not found');
            expect(result.userAction).toBe('Verify the protein ID and try a different protein');
            expect(result.technicalDetails).toBe('HTTP 404: Not Found');
        });

        test('should handle different server error codes', () => {
            const serverErrors = [
                { status: 500, expectedMessage: 'Internal server error' },
                { status: 502, expectedMessage: 'Bad gateway' },
                { status: 503, expectedMessage: 'Service unavailable' },
                { status: 504, expectedMessage: 'Gateway timeout' }
            ];

            serverErrors.forEach(({ status, expectedMessage }) => {
                const serverError = new Error('Server Error');
                serverError.status = status;
                
                const result = apiService.handleApiErrors(serverError);
                
                expect(result.type).toBe('server');
                expect(result.retryable).toBe(true);
                expect(result.message).toContain(expectedMessage);
                expect(result.technicalDetails).toContain(`HTTP ${status}`);
            });
        });

        test('should handle rate limiting with specific guidance', () => {
            const rateLimitError = new Error('Too Many Requests');
            rateLimitError.status = 429;
            
            const result = apiService.handleApiErrors(rateLimitError);
            
            expect(result.type).toBe('rate_limit');
            expect(result.retryable).toBe(true);
            expect(result.message).toContain('Too many requests');
            expect(result.userAction).toBe('Wait 30-60 seconds before trying again');
        });

        test('should handle client errors as non-retryable', () => {
            const clientErrors = [400, 401, 403];
            
            clientErrors.forEach(status => {
                const clientError = new Error('Client Error');
                clientError.status = status;
                
                const result = apiService.handleApiErrors(clientError);
                
                expect(result.retryable).toBe(false);
                expect(result.technicalDetails).toContain(`HTTP ${status}`);
            });
        });

        test('should handle fetch-specific errors', () => {
            const fetchError = new Error('Failed to fetch');
            
            const result = apiService.handleApiErrors(fetchError);
            
            expect(result.type).toBe('network');
            expect(result.message).toContain('Unable to connect to the server');
            expect(result.userAction).toBe('Check your internet connection');
        });

        test('should handle unknown errors with fallback', () => {
            const unknownError = new Error('Mysterious error');
            
            const result = apiService.handleApiErrors(unknownError);
            
            expect(result.type).toBe('unknown');
            expect(result.retryable).toBe(true);
            expect(result.message).toContain('An unexpected error occurred');
            expect(result.userAction).toBe('Try again or contact support');
            expect(result.technicalDetails).toBe('Mysterious error');
        });

        test('should handle errors without retry information', () => {
            const simpleError = new Error('Simple error');
            simpleError.status = 500;
            
            const result = apiService.handleApiErrors(simpleError);
            
            expect(result.message).not.toContain('Failed after');
            expect(result.message).toContain('Internal server error');
        });
    });

    describe('validateParams', () => {
        test('should pass validation with all required params', () => {
            const params = { id: 'P69905', format: 'json' };
            const required = ['id', 'format'];
            
            expect(() => apiService.validateParams(params, required)).not.toThrow();
        });

        test('should throw error for missing required params', () => {
            const params = { id: 'P69905' };
            const required = ['id', 'format'];
            
            expect(() => apiService.validateParams(params, required))
                .toThrow('Missing required parameter: format');
        });

        test('should throw error for empty required params', () => {
            const params = { id: '', format: 'json' };
            const required = ['id', 'format'];
            
            expect(() => apiService.validateParams(params, required))
                .toThrow('Missing required parameter: id');
        });
    });

    describe('delay', () => {
        test('should return a promise that resolves', async () => {
            // Test that delay returns a promise that resolves
            const delayPromise = apiService.delay(10);
            expect(delayPromise).toBeInstanceOf(Promise);
            await expect(delayPromise).resolves.toBeUndefined();
        });
    });

    describe('searchUniProt', () => {
        test('should search by protein name and return formatted results', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: () => Promise.resolve({
                    results: [
                        {
                            primaryAccession: 'P69905',
                            proteinDescription: {
                                recommendedName: {
                                    fullName: { value: 'Hemoglobin subunit alpha' }
                                }
                            },
                            organism: { scientificName: 'Homo sapiens' },
                            sequence: { length: 141 },
                            genes: [{ geneName: { value: 'HBA1' } }]
                        }
                    ]
                })
            };
            fetch.mockResolvedValueOnce(mockResponse);

            const results = await apiService.searchUniProt('protein test');
            
            expect(results).toHaveLength(1);
            expect(results[0]).toEqual({
                uniprotId: 'P69905',
                proteinName: 'Hemoglobin subunit alpha',
                organism: 'Homo sapiens',
                sequenceLength: 141,
                geneNames: ['HBA1']
            });
        });

        test('should search by UniProt ID and return single result', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: () => Promise.resolve({
                    primaryAccession: 'P69905',
                    proteinDescription: {
                        recommendedName: {
                            fullName: { value: 'Hemoglobin subunit alpha' }
                        }
                    },
                    organism: { scientificName: 'Homo sapiens' },
                    sequence: { length: 141 },
                    genes: [{ geneName: { value: 'HBA1' } }]
                })
            };
            fetch.mockResolvedValueOnce(mockResponse);

            const results = await apiService.searchUniProt('P69905');
            
            expect(results).toHaveLength(1);
            expect(results[0].uniprotId).toBe('P69905');
        });

        test('should return empty array when no results found', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: () => Promise.resolve({ results: [] })
            };
            fetch.mockResolvedValueOnce(mockResponse);

            const results = await apiService.searchUniProt('nonexistent');
            
            expect(results).toEqual([]);
        });

        test('should handle null response for direct ID lookup', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: () => Promise.resolve(null)
            };
            fetch.mockResolvedValueOnce(mockResponse);

            const results = await apiService.searchUniProt('P99999');
            
            expect(results).toEqual([]);
        });

        test('should throw error for empty query', async () => {
            await expect(apiService.searchUniProt(''))
                .rejects.toThrow('Missing required parameter: query');
        });

        test('should throw error for whitespace-only query', async () => {
            await expect(apiService.searchUniProt('   '))
                .rejects.toThrow('Search query cannot be empty');
        });

        test('should handle API errors gracefully', async () => {
            const apiError = new Error('API Error');
            apiError.name = 'TypeError'; // This will be treated as a network error
            fetch.mockRejectedValueOnce(apiError);

            await expect(apiService.searchUniProt('test'))
                .rejects.toThrow('Unable to search UniProt database. Please check your internet connection and try again.');
        });

        test('should call progress callback during search', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: () => Promise.resolve({ results: [] })
            };
            fetch.mockResolvedValueOnce(mockResponse);

            const progressCallback = jest.fn();
            await apiService.searchUniProt('test protein', progressCallback);

            expect(progressCallback).toHaveBeenCalledWith({
                type: 'search_start',
                message: 'Searching for proteins matching "test protein"...'
            });

            expect(progressCallback).toHaveBeenCalledWith({
                type: 'search_processing',
                message: 'Processing search results...'
            });

            expect(progressCallback).toHaveBeenCalledWith({
                type: 'search_complete',
                message: 'Found 0 results'
            });
        });

        test('should provide context-specific error messages', async () => {
            const notFoundError = new Error('Not Found');
            notFoundError.status = 404;
            fetch.mockRejectedValueOnce(notFoundError);

            await expect(apiService.searchUniProt('P99999'))
                .rejects.toThrow('Protein P99999 not found in UniProt database');
        });

        test('should format protein results with missing fields', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: () => Promise.resolve({
                    results: [
                        {
                            primaryAccession: 'P12345',
                            // Missing protein description, organism, sequence, genes
                        }
                    ]
                })
            };
            fetch.mockResolvedValueOnce(mockResponse);

            const results = await apiService.searchUniProt('test');
            
            expect(results[0]).toEqual({
                uniprotId: 'P12345',
                proteinName: 'Unknown protein',
                organism: 'Unknown organism',
                sequenceLength: null,
                geneNames: []
            });
        });

        test('should use correct URL for protein name search', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: () => Promise.resolve({ results: [] })
            };
            fetch.mockResolvedValueOnce(mockResponse);

            await apiService.searchUniProt('protein name');
            
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('search?query=protein%20name'),
                expect.any(Object)
            );
        });

        test('should use correct URL for UniProt ID lookup', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: () => Promise.resolve(null)
            };
            fetch.mockResolvedValueOnce(mockResponse);

            await apiService.searchUniProt('P69905');
            
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('P69905?format=json'),
                expect.any(Object)
            );
        });
    });

    describe('formatProteinResult', () => {
        test('should format complete protein result', () => {
            const rawResult = {
                primaryAccession: 'P69905',
                proteinDescription: {
                    recommendedName: {
                        fullName: { value: 'Hemoglobin subunit alpha' }
                    }
                },
                organism: { scientificName: 'Homo sapiens' },
                sequence: { length: 141 },
                genes: [
                    { geneName: { value: 'HBA1' } },
                    { geneName: { value: 'HBA2' } }
                ]
            };

            const formatted = apiService.formatProteinResult(rawResult);
            
            expect(formatted).toEqual({
                uniprotId: 'P69905',
                proteinName: 'Hemoglobin subunit alpha',
                organism: 'Homo sapiens',
                sequenceLength: 141,
                geneNames: ['HBA1', 'HBA2']
            });
        });

        test('should handle alternative field names', () => {
            const rawResult = {
                accession: 'P12345',
                protein_name: 'Test Protein',
                organism_name: 'Test Organism',
                length: 200
            };

            const formatted = apiService.formatProteinResult(rawResult);
            
            expect(formatted).toEqual({
                uniprotId: 'P12345',
                proteinName: 'Test Protein',
                organism: 'Test Organism',
                sequenceLength: 200,
                geneNames: []
            });
        });

        test('should provide defaults for missing fields', () => {
            const rawResult = {
                primaryAccession: 'P99999'
            };

            const formatted = apiService.formatProteinResult(rawResult);
            
            expect(formatted).toEqual({
                uniprotId: 'P99999',
                proteinName: 'Unknown protein',
                organism: 'Unknown organism',
                sequenceLength: null,
                geneNames: []
            });
        });
    });

    describe('getProteinMetadata', () => {
        const mockMetadataResponse = {
            primaryAccession: 'P69905',
            proteinDescription: {
                recommendedName: {
                    fullName: { value: 'Hemoglobin subunit alpha' }
                }
            },
            organism: { scientificName: 'Homo sapiens' },
            sequence: { length: 141 },
            genes: [
                { geneName: { value: 'HBA1' } },
                { geneName: { value: 'HBA2' } }
            ],
            comments: [
                {
                    commentType: 'FUNCTION',
                    texts: [
                        { value: 'Involved in oxygen transport from the lungs to the various peripheral tissues.' }
                    ]
                }
            ]
        };

        test('should fetch and format protein metadata successfully', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: () => Promise.resolve(mockMetadataResponse)
            };
            fetch.mockResolvedValueOnce(mockResponse);

            const result = await apiService.getProteinMetadata('P69905');
            
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('P69905?format=json&fields=accession,protein_name,organism_name,length,gene_names,cc_function,ft_chain,sequence'),
                expect.any(Object)
            );
            
            expect(result).toEqual({
                uniprotId: 'P69905',
                proteinName: 'Hemoglobin subunit alpha',
                organism: 'Homo sapiens',
                sequenceLength: 141,
                geneNames: ['HBA1', 'HBA2'],
                description: 'Involved in oxygen transport from the lungs to the various peripheral tissues.',
                confidenceScore: expect.any(Number),
                lastUpdated: expect.any(String)
            });
            
            expect(result.confidenceScore).toBeGreaterThan(0);
            expect(result.confidenceScore).toBeLessThanOrEqual(100);
        });

        test('should validate UniProt ID parameter', async () => {
            await expect(apiService.getProteinMetadata(''))
                .rejects.toThrow('Missing required parameter: uniprotId');
        });

        test('should validate UniProt ID format', async () => {
            await expect(apiService.getProteinMetadata('invalid-id'))
                .rejects.toThrow('Invalid UniProt ID format');
        });

        test('should handle API errors', async () => {
            const apiError = new Error('API Error');
            apiError.name = 'TypeError';
            fetch.mockRejectedValueOnce(apiError);

            await expect(apiService.getProteinMetadata('P69905'))
                .rejects.toThrow('Unable to fetch protein information for P69905');
        });

        test('should normalize UniProt ID to uppercase', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: () => Promise.resolve(mockMetadataResponse)
            };
            fetch.mockResolvedValueOnce(mockResponse);

            await apiService.getProteinMetadata('p69905');
            
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('P69905?format=json'),
                expect.any(Object)
            );
        });

        test('should handle whitespace in UniProt ID', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: () => Promise.resolve(mockMetadataResponse)
            };
            fetch.mockResolvedValueOnce(mockResponse);

            await apiService.getProteinMetadata('  P69905  ');
            
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('P69905?format=json'),
                expect.any(Object)
            );
        });
    });

    describe('formatProteinMetadata', () => {
        test('should format complete protein metadata', () => {
            const rawData = {
                primaryAccession: 'P69905',
                proteinDescription: {
                    recommendedName: {
                        fullName: { value: 'Hemoglobin subunit alpha' }
                    }
                },
                organism: { scientificName: 'Homo sapiens' },
                sequence: { length: 141 },
                genes: [
                    { geneName: { value: 'HBA1' } },
                    { geneName: { value: 'HBA2' } }
                ],
                comments: [
                    {
                        commentType: 'FUNCTION',
                        texts: [
                            { value: 'Involved in oxygen transport from the lungs to the various peripheral tissues.' }
                        ]
                    }
                ]
            };

            const formatted = apiService.formatProteinMetadata(rawData);
            
            expect(formatted).toEqual({
                uniprotId: 'P69905',
                proteinName: 'Hemoglobin subunit alpha',
                organism: 'Homo sapiens',
                sequenceLength: 141,
                geneNames: ['HBA1', 'HBA2'],
                description: 'Involved in oxygen transport from the lungs to the various peripheral tissues.',
                confidenceScore: expect.any(Number),
                lastUpdated: expect.any(String)
            });
        });

        test('should handle missing function description', () => {
            const rawData = {
                primaryAccession: 'P69905',
                proteinDescription: {
                    recommendedName: {
                        fullName: { value: 'Test Protein' }
                    }
                },
                organism: { scientificName: 'Test Organism' },
                sequence: { length: 100 }
            };

            const formatted = apiService.formatProteinMetadata(rawData);
            
            expect(formatted.description).toBe('No functional description available');
        });

        test('should handle missing gene names', () => {
            const rawData = {
                primaryAccession: 'P69905',
                proteinDescription: {
                    recommendedName: {
                        fullName: { value: 'Test Protein' }
                    }
                },
                organism: { scientificName: 'Test Organism' },
                sequence: { length: 100 }
            };

            const formatted = apiService.formatProteinMetadata(rawData);
            
            expect(formatted.geneNames).toEqual([]);
        });

        test('should generate confidence score based on sequence length', () => {
            const shortProtein = {
                primaryAccession: 'P12345',
                proteinDescription: {
                    recommendedName: {
                        fullName: { value: 'Short Protein' }
                    }
                },
                organism: { scientificName: 'Test Organism' },
                sequence: { length: 50 }
            };

            const longProtein = {
                primaryAccession: 'P67890',
                proteinDescription: {
                    recommendedName: {
                        fullName: { value: 'Long Protein' }
                    }
                },
                organism: { scientificName: 'Test Organism' },
                sequence: { length: 500 }
            };

            const shortFormatted = apiService.formatProteinMetadata(shortProtein);
            const longFormatted = apiService.formatProteinMetadata(longProtein);
            
            // Short proteins should generally have higher confidence
            expect(shortFormatted.confidenceScore).toBeGreaterThan(80);
            expect(longFormatted.confidenceScore).toBeLessThan(90);
        });

        test('should handle missing sequence length', () => {
            const rawData = {
                primaryAccession: 'P69905',
                proteinDescription: {
                    recommendedName: {
                        fullName: { value: 'Test Protein' }
                    }
                },
                organism: { scientificName: 'Test Organism' }
            };

            const formatted = apiService.formatProteinMetadata(rawData);
            
            expect(formatted.sequenceLength).toBeNull();
            expect(formatted.confidenceScore).toBeNull();
        });

        test('should provide defaults for missing fields', () => {
            const rawData = {
                primaryAccession: 'P99999'
            };

            const formatted = apiService.formatProteinMetadata(rawData);
            
            expect(formatted).toEqual({
                uniprotId: 'P99999',
                proteinName: 'Unknown protein',
                organism: 'Unknown organism',
                sequenceLength: null,
                geneNames: [],
                description: 'No functional description available',
                confidenceScore: null,
                lastUpdated: expect.any(String)
            });
        });

        test('should include current timestamp', () => {
            const rawData = {
                primaryAccession: 'P69905',
                proteinDescription: {
                    recommendedName: {
                        fullName: { value: 'Test Protein' }
                    }
                },
                organism: { scientificName: 'Test Organism' },
                sequence: { length: 100 }
            };

            const formatted = apiService.formatProteinMetadata(rawData);
            
            expect(formatted.lastUpdated).toBeDefined();
            expect(new Date(formatted.lastUpdated)).toBeInstanceOf(Date);
        });
    });

    describe('fetchAlphaFoldStructure', () => {
        const validPdbData = `HEADER    OXYGEN TRANSPORT                        22-MAY-96   1HHO              
ATOM      1  N   VAL A   1      -8.901   4.127  -0.555  1.00 11.99           N  
ATOM      2  CA  VAL A   1      -8.608   3.135  -1.618  1.00 11.85           C  
END`;

        test('should fetch structure with progress tracking', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                headers: {
                    get: jest.fn(() => '1024') // Content-Length
                },
                text: () => Promise.resolve(validPdbData)
            };
            fetch.mockResolvedValueOnce(mockResponse);

            const progressCallback = jest.fn();
            const result = await apiService.fetchAlphaFoldStructure('P69905', progressCallback);

            expect(result).toBe(validPdbData);
            expect(progressCallback).toHaveBeenCalledWith({
                type: 'structure_start',
                message: 'Downloading 3D structure for P69905...'
            });

            expect(progressCallback).toHaveBeenCalledWith({
                type: 'structure_download',
                message: 'Downloading structure file (1 KB)...',
                totalSize: 1024
            });

            expect(progressCallback).toHaveBeenCalledWith({
                type: 'structure_complete',
                message: 'Structure file downloaded successfully'
            });
        });

        test('should handle structure not found with detailed error', async () => {
            const notFoundError = new Error('Not Found');
            notFoundError.status = 404;
            fetch.mockRejectedValueOnce(notFoundError);

            await expect(apiService.fetchAlphaFoldStructure('P99999'))
                .rejects.toThrow('No AlphaFold structure available for protein P99999. This protein may not be included in the AlphaFold database yet');
        });

        test('should handle invalid PDB format', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                headers: { get: jest.fn(() => null) },
                text: () => Promise.resolve('Invalid PDB content')
            };
            fetch.mockResolvedValueOnce(mockResponse);

            await expect(apiService.fetchAlphaFoldStructure('P69905'))
                .rejects.toThrow('Invalid PDB file format received');
        });

        test('should validate UniProt ID format with detailed message', async () => {
            await expect(apiService.fetchAlphaFoldStructure('invalid-id'))
                .rejects.toThrow('Invalid UniProt ID format. UniProt IDs should be 6-10 characters long');
        });

        test('should handle access forbidden error', async () => {
            const forbiddenError = new Error('Forbidden');
            forbiddenError.status = 403;
            fetch.mockRejectedValueOnce(forbiddenError);

            await expect(apiService.fetchAlphaFoldStructure('P69905'))
                .rejects.toThrow('Access to AlphaFold structure for P69905 is restricted');
        });

        test('should handle timeout with context-specific message', async () => {
            const timeoutError = new Error('Timeout');
            timeoutError.name = 'AbortError';
            fetch.mockRejectedValueOnce(timeoutError);

            await expect(apiService.fetchAlphaFoldStructure('P69905'))
                .rejects.toThrow('Unable to download structure for P69905');
        });
    });

    describe('readResponseWithProgress', () => {
        test('should read response with progress tracking', async () => {
            const chunks = [
                new Uint8Array([72, 69, 76, 76, 79]), // "HELLO"
                new Uint8Array([32, 87, 79, 82, 76, 68]) // " WORLD"
            ];

            const mockReader = {
                read: jest.fn()
                    .mockResolvedValueOnce({ done: false, value: chunks[0] })
                    .mockResolvedValueOnce({ done: false, value: chunks[1] })
                    .mockResolvedValueOnce({ done: true }),
                releaseLock: jest.fn()
            };

            const mockResponse = {
                body: {
                    getReader: () => mockReader
                }
            };

            const progressCallback = jest.fn();
            const result = await apiService.readResponseWithProgress(mockResponse, 11, progressCallback);

            expect(result).toBe('HELLO WORLD');
            expect(progressCallback).toHaveBeenCalledWith({
                type: 'download_progress',
                progress: 45, // 5/11 * 100
                receivedLength: 5,
                totalSize: 11,
                message: 'Downloading... 45% (5/11 KB)'
            });

            expect(progressCallback).toHaveBeenCalledWith({
                type: 'download_progress',
                progress: 100, // 11/11 * 100
                receivedLength: 11,
                totalSize: 11,
                message: 'Downloading... 100% (11/11 KB)'
            });

            expect(mockReader.releaseLock).toHaveBeenCalled();
        });

        test('should handle reader errors gracefully', async () => {
            const mockReader = {
                read: jest.fn().mockRejectedValueOnce(new Error('Read error')),
                releaseLock: jest.fn()
            };

            const mockResponse = {
                body: {
                    getReader: () => mockReader
                }
            };

            const progressCallback = jest.fn();

            await expect(apiService.readResponseWithProgress(mockResponse, 100, progressCallback))
                .rejects.toThrow('Read error');

            expect(mockReader.releaseLock).toHaveBeenCalled();
        });
    });

    describe('getProteinMetadata', () => {
        test('should call progress callback during metadata fetch', async () => {
            const mockMetadata = {
                primaryAccession: 'P69905',
                proteinDescription: {
                    recommendedName: { fullName: { value: 'Test Protein' } }
                },
                organism: { scientificName: 'Test Organism' },
                sequence: { length: 100 }
            };

            const mockResponse = {
                ok: true,
                status: 200,
                json: () => Promise.resolve(mockMetadata)
            };
            fetch.mockResolvedValueOnce(mockResponse);

            const progressCallback = jest.fn();
            await apiService.getProteinMetadata('P69905', progressCallback);

            expect(progressCallback).toHaveBeenCalledWith({
                type: 'metadata_start',
                message: 'Fetching protein information for P69905...'
            });

            expect(progressCallback).toHaveBeenCalledWith({
                type: 'metadata_processing',
                message: 'Processing protein information...'
            });

            expect(progressCallback).toHaveBeenCalledWith({
                type: 'metadata_complete',
                message: 'Protein information loaded successfully'
            });
        });

        test('should provide context-specific error messages for metadata', async () => {
            const notFoundError = new Error('Not Found');
            notFoundError.status = 404;
            fetch.mockRejectedValueOnce(notFoundError);

            await expect(apiService.getProteinMetadata('P99999'))
                .rejects.toThrow('Protein P99999 not found in UniProt database. Please verify the UniProt ID is correct.');
        });

        test('should validate UniProt ID format for metadata', async () => {
            await expect(apiService.getProteinMetadata('invalid'))
                .rejects.toThrow('Invalid UniProt ID format');
        });
    });});
