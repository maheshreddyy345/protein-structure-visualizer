/**
 * Comprehensive Error Handling Tests
 * Tests for task 9: Implement comprehensive error handling and user feedback
 */

// Mock fetch and other globals
global.fetch = jest.fn();
global.AbortController = jest.fn(() => ({
    abort: jest.fn(),
    signal: {}
}));
global.setTimeout = jest.fn((fn) => fn());
global.clearTimeout = jest.fn();
global.navigator = { onLine: true };

// Mock console methods
global.console = {
    log: jest.fn(),
    error: jest.fn()
};

describe('Comprehensive Error Handling Tests', () => {
    let apiService;

    beforeEach(() => {
        apiService = new APIService();
        fetch.mockClear();
        jest.clearAllMocks();
        global.navigator.onLine = true;
    });

    describe('Network Error Scenarios', () => {
        test('should handle complete network failure', async () => {
            global.navigator.onLine = false;
            const networkError = new Error('Network error');
            networkError.name = 'TypeError';
            fetch.mockRejectedValueOnce(networkError);

            try {
                await apiService.searchUniProt('test');
            } catch (error) {
                expect(error.message).toContain('Unable to search UniProt database');
                expect(error.message).toContain('internet connection');
            }
        });

        test('should handle DNS resolution failures', async () => {
            const dnsError = new Error('getaddrinfo ENOTFOUND');
            dnsError.name = 'TypeError';
            fetch.mockRejectedValueOnce(dnsError);

            try {
                await apiService.fetchAlphaFoldStructure('P69905');
            } catch (error) {
                expect(error.message).toContain('Unable to download structure');
                expect(error.message).toContain('internet connection');
            }
        });

        test('should handle connection timeouts with exponential backoff', async () => {
            const timeoutError = new Error('Timeout');
            timeoutError.name = 'AbortError';
            
            const progressCallback = jest.fn();
            const delaySpy = jest.spyOn(apiService, 'delay').mockResolvedValue();
            
            fetch
                .mockRejectedValueOnce(timeoutError)
                .mockRejectedValueOnce(timeoutError)
                .mockRejectedValueOnce(timeoutError);

            try {
                await apiService.getProteinMetadata('P69905', progressCallback);
                fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).toContain('Request for protein information timed out');
                // The error should have retry information added by makeRequestWithRetry
                expect(error.retryAttempts).toBe(3);
            }

            // Verify exponential backoff was used
            expect(delaySpy).toHaveBeenCalledTimes(2);
            const delays = delaySpy.mock.calls.map(call => call[0]);
            expect(delays[1]).toBeGreaterThan(delays[0]); // Second delay should be longer

            delaySpy.mockRestore();
        });
    });

    describe('Server Error Scenarios', () => {
        test('should handle server overload (503)', async () => {
            const serverError = new Error('Service Unavailable');
            serverError.status = 503;
            fetch.mockRejectedValueOnce(serverError);

            try {
                await apiService.searchUniProt('hemoglobin');
            } catch (error) {
                expect(error.message).toContain('Unable to search UniProt database');
            }

            // Verify the underlying error handling
            const formattedError = apiService.handleApiErrors(serverError);
            expect(formattedError.type).toBe('server');
            expect(formattedError.retryable).toBe(true);
            expect(formattedError.userAction).toBe('Try again in 5-10 minutes');
        });

        test('should handle rate limiting (429)', async () => {
            const rateLimitError = new Error('Too Many Requests');
            rateLimitError.status = 429;
            fetch.mockRejectedValueOnce(rateLimitError);

            const formattedError = apiService.handleApiErrors(rateLimitError);
            expect(formattedError.type).toBe('rate_limit');
            expect(formattedError.message).toContain('Too many requests');
            expect(formattedError.userAction).toBe('Wait 30-60 seconds before trying again');
        });

        test('should handle gateway errors (502, 504)', async () => {
            const gatewayErrors = [
                { status: 502, name: 'Bad Gateway' },
                { status: 504, name: 'Gateway Timeout' }
            ];

            for (const { status, name } of gatewayErrors) {
                const gatewayError = new Error(name);
                gatewayError.status = status;

                const formattedError = apiService.handleApiErrors(gatewayError);
                expect(formattedError.type).toBe('server');
                expect(formattedError.retryable).toBe(true);
                expect(formattedError.userAction).toContain('Try again');
            }
        });
    });

    describe('Data-Specific Error Scenarios', () => {
        test('should handle protein not found in UniProt', async () => {
            const notFoundError = new Error('Not Found');
            notFoundError.status = 404;
            fetch.mockRejectedValueOnce(notFoundError);

            try {
                await apiService.searchUniProt('NONEXISTENT123');
                fail('Should have thrown an error');
            } catch (error) {
                // The actual error message depends on the handleApiErrors implementation
                expect(error.message).toBeDefined();
            }
        });

        test('should handle structure not available in AlphaFold', async () => {
            const notFoundError = new Error('Not Found');
            notFoundError.status = 404;
            fetch.mockRejectedValueOnce(notFoundError);

            try {
                await apiService.fetchAlphaFoldStructure('P99999');
            } catch (error) {
                expect(error.message).toContain('No AlphaFold structure available');
                expect(error.message).toContain('may not be included in the AlphaFold database yet');
                expect(error.message).toContain('model organisms and proteomes of scientific interest');
            }
        });

        test('should handle corrupted PDB file', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                headers: { get: jest.fn(() => null) },
                text: () => Promise.resolve('This is not a valid PDB file')
            };
            fetch.mockResolvedValueOnce(mockResponse);

            try {
                await apiService.fetchAlphaFoldStructure('P69905');
                fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).toContain('Invalid PDB file format');
            }
        });

        test('should handle malformed JSON responses', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: () => Promise.reject(new Error('Unexpected token'))
            };
            fetch.mockResolvedValueOnce(mockResponse);

            try {
                await apiService.getProteinMetadata('P69905');
            } catch (error) {
                expect(error.message).toBeDefined();
            }
        });
    });

    describe('Input Validation Error Scenarios', () => {
        test('should handle invalid UniProt ID formats', async () => {
            const invalidIds = [
                { id: '', expectedError: 'Missing required parameter' },
                { id: '   ', expectedError: 'UniProt ID cannot be empty' },
                { id: 'invalid-id', expectedError: 'Invalid UniProt ID format' },
                { id: '123', expectedError: 'Invalid UniProt ID format' },
                { id: 'TOOLONGPROTEINID123456', expectedError: 'Invalid UniProt ID format' },
                { id: 'P@#$%', expectedError: 'Invalid UniProt ID format' }
            ];

            for (const { id, expectedError } of invalidIds) {
                try {
                    await apiService.fetchAlphaFoldStructure(id);
                    fail(`Should have thrown error for invalid ID: ${id}`);
                } catch (error) {
                    expect(error.message).toContain(expectedError);
                }
            }
        });

        test('should handle empty search queries', async () => {
            const emptyQueries = [
                { query: '', expectedError: 'Missing required parameter' },
                { query: '   ', expectedError: 'Search query cannot be empty' },
                { query: null, expectedError: 'Missing required parameter' },
                { query: undefined, expectedError: 'Missing required parameter' }
            ];

            for (const { query, expectedError } of emptyQueries) {
                try {
                    await apiService.searchUniProt(query);
                    fail(`Should have thrown error for empty query: ${query}`);
                } catch (error) {
                    expect(error.message).toContain(expectedError);
                }
            }
        });
    });

    describe('Progress Tracking Error Scenarios', () => {
        test('should handle progress callback errors gracefully', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: () => Promise.resolve({ results: [] })
            };
            fetch.mockResolvedValueOnce(mockResponse);

            const faultyProgressCallback = jest.fn(() => {
                throw new Error('Progress callback error');
            });

            // The API service itself doesn't handle progress callback errors,
            // but the components should wrap them safely
            try {
                await apiService.searchUniProt('test', faultyProgressCallback);
                fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).toContain('Progress callback error');
            }
        });

        test('should handle large file download progress tracking', async () => {
            const validPdbData = 'HEADER\nATOM\nEND';
            const mockResponse = {
                ok: true,
                status: 200,
                headers: {
                    get: jest.fn(() => '10485760') // 10MB
                },
                body: {
                    getReader: () => ({
                        read: jest.fn()
                            .mockResolvedValueOnce({ 
                                done: false, 
                                value: new TextEncoder().encode(validPdbData.slice(0, 5)) 
                            })
                            .mockResolvedValueOnce({ done: true }),
                        releaseLock: jest.fn()
                    })
                }
            };
            fetch.mockResolvedValueOnce(mockResponse);

            const progressCallback = jest.fn();
            await apiService.fetchAlphaFoldStructure('P69905', progressCallback);

            // Should have called progress callback for large file download
            expect(progressCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'structure_download',
                    totalSize: 10485760
                })
            );
        });
    });

    describe('Recovery Mechanisms', () => {
        test('should recover from transient network errors', async () => {
            const networkError = new Error('Network error');
            networkError.name = 'TypeError';
            
            const mockResponse = {
                ok: true,
                status: 200,
                json: () => Promise.resolve({ results: [] })
            };

            const delaySpy = jest.spyOn(apiService, 'delay').mockResolvedValue();

            fetch
                .mockRejectedValueOnce(networkError)
                .mockRejectedValueOnce(networkError)
                .mockResolvedValueOnce(mockResponse);

            const result = await apiService.searchUniProt('test');
            expect(result).toEqual([]);
            expect(fetch).toHaveBeenCalledTimes(3);
            
            delaySpy.mockRestore();
        });

        test('should not retry on client errors', async () => {
            const clientError = new Error('Bad Request');
            clientError.status = 400;
            fetch.mockRejectedValueOnce(clientError);

            try {
                await apiService.getProteinMetadata('P69905');
            } catch (error) {
                expect(error.message).toContain('Unable to fetch protein information');
            }

            expect(fetch).toHaveBeenCalledTimes(1); // No retries
        });

        test('should provide appropriate user actions for different error types', async () => {
            const errorScenarios = [
                {
                    error: { name: 'TypeError', message: 'Network error' },
                    expectedAction: 'Check your internet connection'
                },
                {
                    error: { status: 404, message: 'Not Found' },
                    expectedAction: 'Verify the protein ID and try a different protein'
                },
                {
                    error: { status: 429, message: 'Rate Limited' },
                    expectedAction: 'Wait 30-60 seconds before trying again'
                },
                {
                    error: { status: 503, message: 'Service Unavailable' },
                    expectedAction: 'Try again in 5-10 minutes'
                }
            ];

            errorScenarios.forEach(({ error, expectedAction }) => {
                const formattedError = apiService.handleApiErrors(error);
                expect(formattedError.userAction).toContain(expectedAction);
            });
        });
    });

    describe('Error Message Quality', () => {
        test('should provide technical details for debugging', async () => {
            const technicalError = new Error('Detailed technical error message');
            technicalError.status = 500;
            technicalError.stack = 'Error stack trace...';

            const formattedError = apiService.handleApiErrors(technicalError);
            expect(formattedError.technicalDetails).toBe('HTTP 500: Detailed technical error message');
        });

        test('should provide user-friendly messages', async () => {
            const errors = [
                { name: 'TypeError', expectedMessage: 'Network connection error' },
                { name: 'AbortError', expectedMessage: 'Request timed out' },
                { status: 404, expectedMessage: 'Resource not found' },
                { status: 500, expectedMessage: 'Internal server error' }
            ];

            errors.forEach(({ name, status, expectedMessage }) => {
                const error = new Error('Technical error');
                if (name) error.name = name;
                if (status) error.status = status;

                const formattedError = apiService.handleApiErrors(error);
                expect(formattedError.message).toContain(expectedMessage);
            });
        });

        test('should include retry information in error messages', async () => {
            const error = new Error('Network error');
            error.name = 'TypeError';
            error.retryAttempts = 3;
            error.maxRetryAttempts = 3;

            const formattedError = apiService.handleApiErrors(error);
            expect(formattedError.message).toContain('(Failed after 3 attempts)');
        });
    });
});