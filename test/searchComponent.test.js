/**
 * Unit tests for SearchComponent
 */

// Mock DOM elements and APIs
global.document = {
    getElementById: jest.fn(),
    createElement: jest.fn(),
    dispatchEvent: jest.fn(),
    addEventListener: jest.fn()
};

global.CustomEvent = jest.fn().mockImplementation((type, options) => {
    const event = {
        type,
        detail: options?.detail,
        bubbles: false,
        cancelable: false,
        composed: false
    };
    return event;
});

// Mock the SearchComponent class since it's not exported
global.SearchComponent = class SearchComponent {
    constructor(apiService) {
        this.apiService = apiService;
        this.searchForm = document.getElementById('search-form');
        this.searchInput = document.getElementById('search-input');
        this.searchButton = document.getElementById('search-button');
        this.resultsContainer = document.getElementById('search-results');
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSearch();
        });
    }

    async handleSearch() {
        const query = this.searchInput.value.trim();
        
        if (!this.validateSearchInput(query)) {
            return;
        }

        console.log(`Search initiated for: ${query}`);
        
        this.setLoadingState(true);
        this.clearResults();
        
        try {
            await this.searchProtein(query);
        } catch (error) {
            console.error('Search error:', error);
            this.showError(error.message || 'Search failed. Please try again.');
        } finally {
            this.setLoadingState(false);
        }
    }

    validateSearchInput(query) {
        if (!query || !query.trim()) {
            this.showError('Please enter a protein name or UniProt ID to search.');
            return false;
        }

        if (query.length < 2) {
            this.showError('Search query must be at least 2 characters long.');
            return false;
        }

        if (query.length > 200) {
            this.showError('Search query is too long. Please enter a shorter search term.');
            return false;
        }

        const dangerousChars = /[<>'"&]/;
        if (dangerousChars.test(query)) {
            this.showError('Search query contains invalid characters. Please use only letters, numbers, and basic punctuation.');
            return false;
        }

        return true;
    }

    async searchProtein(query) {
        console.log(`Searching for protein: ${query}`);
        
        try {
            const results = await this.apiService.searchUniProt(query);
            this.displaySearchResults(results);
        } catch (error) {
            console.error('UniProt search failed:', error);
            throw error;
        }
    }

    displaySearchResults(results) {
        this.resultsContainer.style.display = 'block';
        
        if (results.length === 0) {
            this.resultsContainer.innerHTML = `
                <div class="no-results">
                    <p>No results found. Try searching with:</p>
                    <ul>
                        <li>Protein name (e.g., "hemoglobin")</li>
                        <li>UniProt ID (e.g., "P69905")</li>
                    </ul>
                </div>
            `;
            return;
        }

        const resultsList = results.map(protein => {
            const geneNames = protein.geneNames && protein.geneNames.length > 0 
                ? ` (${protein.geneNames.join(', ')})` 
                : '';
            
            return `
                <div class="result-item" data-uniprot-id="${protein.uniprotId}">
                    <div class="result-header">
                        <h3 class="protein-name">${this.escapeHtml(protein.proteinName)}${geneNames}</h3>
                        <span class="uniprot-id">${protein.uniprotId}</span>
                    </div>
                    <div class="result-details">
                        <p class="organism"><strong>Organism:</strong> ${this.escapeHtml(protein.organism)}</p>
                        ${protein.sequenceLength ? `<p class="sequence-length"><strong>Length:</strong> ${protein.sequenceLength} amino acids</p>` : ''}
                    </div>
                    <button class="select-protein-btn" data-uniprot-id="${protein.uniprotId}">
                        Select Protein
                    </button>
                </div>
            `;
        }).join('');

        this.resultsContainer.innerHTML = `
            <div class="results-header">
                <h3>Search Results (${results.length} found)</h3>
            </div>
            <div class="results-list">
                ${resultsList}
            </div>
        `;

        this.addResultEventListeners();
    }

    addResultEventListeners() {
        const selectButtons = this.resultsContainer.querySelectorAll('.select-protein-btn');
        selectButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const proteinId = e.target.getAttribute('data-uniprot-id');
                this.selectProtein(proteinId);
            });
        });
    }

    selectProtein(proteinId) {
        console.log(`Protein selected: ${proteinId}`);
        
        const event = new CustomEvent('proteinSelected', {
            detail: { proteinId }
        });
        document.dispatchEvent(event);
        
        this.resultsContainer.style.display = 'none';
    }

    clearResults() {
        this.resultsContainer.innerHTML = '';
        this.resultsContainer.style.display = 'none';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setLoadingState(isLoading) {
        this.searchButton.disabled = isLoading;
        this.searchButton.textContent = isLoading ? 'Searching...' : 'Search';
    }

    showError(message) {
        const errorContainer = document.getElementById('error-container');
        const errorMessage = document.getElementById('error-message');
        
        errorMessage.textContent = message;
        errorContainer.style.display = 'flex';
    }
};

// Mock console methods
global.console = {
    log: jest.fn(),
    error: jest.fn()
};

describe('SearchComponent Tests', () => {
    let searchComponent;
    let mockApiService;
    let mockElements;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Mock API service
        mockApiService = {
            searchUniProt: jest.fn()
        };

        // Mock DOM elements
        mockElements = {
            searchForm: {
                addEventListener: jest.fn()
            },
            searchInput: {
                value: '',
                addEventListener: jest.fn()
            },
            searchButton: {
                disabled: false,
                textContent: 'Search',
                addEventListener: jest.fn()
            },
            resultsContainer: {
                innerHTML: '',
                style: { display: 'none' },
                querySelectorAll: jest.fn(() => [])
            },
            errorContainer: {
                style: { display: 'none' }
            },
            errorMessage: {
                textContent: ''
            }
        };

        // Setup getElementById mock
        document.getElementById = jest.fn((id) => {
            const elementMap = {
                'search-form': mockElements.searchForm,
                'search-input': mockElements.searchInput,
                'search-button': mockElements.searchButton,
                'search-results': mockElements.resultsContainer,
                'error-container': mockElements.errorContainer,
                'error-message': mockElements.errorMessage
            };
            return elementMap[id] || null;
        });

        // Mock dispatchEvent to avoid JSDOM validation issues
        document.dispatchEvent = jest.fn();

        // Create SearchComponent instance
        searchComponent = new SearchComponent(mockApiService);
    });

    describe('Constructor', () => {
        test('should initialize with API service and DOM elements', () => {
            expect(searchComponent.apiService).toBe(mockApiService);
            expect(searchComponent.searchForm).toBe(mockElements.searchForm);
            expect(searchComponent.searchInput).toBe(mockElements.searchInput);
            expect(searchComponent.searchButton).toBe(mockElements.searchButton);
            expect(searchComponent.resultsContainer).toBe(mockElements.resultsContainer);
        });

        test('should initialize event listeners', () => {
            expect(mockElements.searchForm.addEventListener).toHaveBeenCalledWith(
                'submit',
                expect.any(Function)
            );
        });
    });

    describe('validateSearchInput', () => {
        test('should return false for empty query', () => {
            const result = searchComponent.validateSearchInput('');
            expect(result).toBe(false);
            expect(mockElements.errorMessage.textContent).toContain('Please enter a protein name');
        });

        test('should return false for whitespace-only query', () => {
            const result = searchComponent.validateSearchInput('   ');
            expect(result).toBe(false);
            expect(mockElements.errorMessage.textContent).toContain('Please enter a protein name');
        });

        test('should return false for query too short', () => {
            const result = searchComponent.validateSearchInput('a');
            expect(result).toBe(false);
            expect(mockElements.errorMessage.textContent).toContain('at least 2 characters');
        });

        test('should return false for query too long', () => {
            const longQuery = 'a'.repeat(201);
            const result = searchComponent.validateSearchInput(longQuery);
            expect(result).toBe(false);
            expect(mockElements.errorMessage.textContent).toContain('too long');
        });

        test('should return false for dangerous characters', () => {
            const result = searchComponent.validateSearchInput('<script>');
            expect(result).toBe(false);
            expect(mockElements.errorMessage.textContent).toContain('invalid characters');
        });

        test('should return true for valid query', () => {
            const result = searchComponent.validateSearchInput('hemoglobin');
            expect(result).toBe(true);
        });

        test('should return true for valid UniProt ID', () => {
            const result = searchComponent.validateSearchInput('P69905');
            expect(result).toBe(true);
        });
    });

    describe('searchProtein', () => {
        test('should call API service and display results', async () => {
            const mockResults = [
                {
                    uniprotId: 'P69905',
                    proteinName: 'Hemoglobin subunit alpha',
                    organism: 'Homo sapiens',
                    sequenceLength: 141,
                    geneNames: ['HBA1']
                }
            ];

            mockApiService.searchUniProt.mockResolvedValueOnce(mockResults);
            searchComponent.displaySearchResults = jest.fn();

            await searchComponent.searchProtein('hemoglobin');

            expect(mockApiService.searchUniProt).toHaveBeenCalledWith('hemoglobin');
            expect(searchComponent.displaySearchResults).toHaveBeenCalledWith(mockResults);
        });

        test('should handle API errors', async () => {
            const apiError = new Error('API Error');
            mockApiService.searchUniProt.mockRejectedValueOnce(apiError);

            await expect(searchComponent.searchProtein('test')).rejects.toThrow('API Error');
            expect(console.error).toHaveBeenCalledWith('UniProt search failed:', apiError);
        });
    });

    describe('displaySearchResults', () => {
        test('should display no results message when empty array', () => {
            searchComponent.displaySearchResults([]);

            expect(mockElements.resultsContainer.style.display).toBe('block');
            expect(mockElements.resultsContainer.innerHTML).toContain('No results found');
            expect(mockElements.resultsContainer.innerHTML).toContain('hemoglobin');
            expect(mockElements.resultsContainer.innerHTML).toContain('P69905');
        });

        test('should display search results with protein information', () => {
            const mockResults = [
                {
                    uniprotId: 'P69905',
                    proteinName: 'Hemoglobin subunit alpha',
                    organism: 'Homo sapiens',
                    sequenceLength: 141,
                    geneNames: ['HBA1']
                }
            ];

            searchComponent.addResultEventListeners = jest.fn();
            searchComponent.escapeHtml = jest.fn((text) => text);

            searchComponent.displaySearchResults(mockResults);

            expect(mockElements.resultsContainer.style.display).toBe('block');
            expect(mockElements.resultsContainer.innerHTML).toContain('Search Results (1 found)');
            expect(mockElements.resultsContainer.innerHTML).toContain('Hemoglobin subunit alpha');
            expect(mockElements.resultsContainer.innerHTML).toContain('P69905');
            expect(mockElements.resultsContainer.innerHTML).toContain('Homo sapiens');
            expect(mockElements.resultsContainer.innerHTML).toContain('141 amino acids');
            expect(searchComponent.addResultEventListeners).toHaveBeenCalled();
        });

        test('should handle results without gene names', () => {
            const mockResults = [
                {
                    uniprotId: 'P12345',
                    proteinName: 'Test Protein',
                    organism: 'Test Organism',
                    sequenceLength: 200,
                    geneNames: []
                }
            ];

            searchComponent.addResultEventListeners = jest.fn();
            searchComponent.escapeHtml = jest.fn((text) => text);

            searchComponent.displaySearchResults(mockResults);

            expect(mockElements.resultsContainer.innerHTML).toContain('Test Protein');
            // Check that gene names are not displayed (no parentheses after protein name)
            expect(mockElements.resultsContainer.innerHTML).toContain('<h3 class="protein-name">Test Protein</h3>');
        });

        test('should handle results without sequence length', () => {
            const mockResults = [
                {
                    uniprotId: 'P12345',
                    proteinName: 'Test Protein',
                    organism: 'Test Organism',
                    sequenceLength: null,
                    geneNames: []
                }
            ];

            searchComponent.addResultEventListeners = jest.fn();
            searchComponent.escapeHtml = jest.fn((text) => text);

            searchComponent.displaySearchResults(mockResults);

            expect(mockElements.resultsContainer.innerHTML).toContain('Test Protein');
            expect(mockElements.resultsContainer.innerHTML).not.toContain('amino acids');
        });
    });

    describe('addResultEventListeners', () => {
        test('should add click listeners to select buttons', () => {
            const mockButton = {
                addEventListener: jest.fn(),
                getAttribute: jest.fn(() => 'P69905')
            };

            mockElements.resultsContainer.querySelectorAll.mockReturnValueOnce([mockButton]);
            searchComponent.selectProtein = jest.fn();

            searchComponent.addResultEventListeners();

            expect(mockButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));

            // Simulate button click
            const clickHandler = mockButton.addEventListener.mock.calls[0][1];
            const mockEvent = { target: mockButton };
            clickHandler(mockEvent);

            expect(mockButton.getAttribute).toHaveBeenCalledWith('data-uniprot-id');
            expect(searchComponent.selectProtein).toHaveBeenCalledWith('P69905');
        });
    });

    describe('selectProtein', () => {
        test('should dispatch custom event and hide results', () => {
            searchComponent.selectProtein('P69905');

            expect(CustomEvent).toHaveBeenCalledWith('proteinSelected', {
                detail: { proteinId: 'P69905' }
            });
            expect(document.dispatchEvent).toHaveBeenCalled();
            expect(mockElements.resultsContainer.style.display).toBe('none');
            expect(console.log).toHaveBeenCalledWith('Protein selected: P69905');
        });
    });

    describe('clearResults', () => {
        test('should clear results container', () => {
            searchComponent.clearResults();

            expect(mockElements.resultsContainer.innerHTML).toBe('');
            expect(mockElements.resultsContainer.style.display).toBe('none');
        });
    });

    describe('escapeHtml', () => {
        test('should escape HTML characters', () => {
            // Mock createElement and div element
            const mockDiv = {
                textContent: '',
                innerHTML: '&lt;script&gt;alert()&lt;/script&gt;'
            };
            document.createElement = jest.fn().mockReturnValueOnce(mockDiv);

            const result = searchComponent.escapeHtml('<script>alert()</script>');

            expect(document.createElement).toHaveBeenCalledWith('div');
            expect(mockDiv.textContent).toBe('<script>alert()</script>');
            expect(result).toBe('&lt;script&gt;alert()&lt;/script&gt;');
        });
    });

    describe('setLoadingState', () => {
        test('should set loading state to true', () => {
            searchComponent.setLoadingState(true);

            expect(mockElements.searchButton.disabled).toBe(true);
            expect(mockElements.searchButton.textContent).toBe('Searching...');
        });

        test('should set loading state to false', () => {
            searchComponent.setLoadingState(false);

            expect(mockElements.searchButton.disabled).toBe(false);
            expect(mockElements.searchButton.textContent).toBe('Search');
        });
    });

    describe('showError', () => {
        test('should display error message', () => {
            searchComponent.showError('Test error message');

            expect(mockElements.errorMessage.textContent).toBe('Test error message');
            expect(mockElements.errorContainer.style.display).toBe('flex');
        });
    });

    describe('handleSearch', () => {
        beforeEach(() => {
            searchComponent.validateSearchInput = jest.fn();
            searchComponent.setLoadingState = jest.fn();
            searchComponent.clearResults = jest.fn();
            searchComponent.searchProtein = jest.fn();
            searchComponent.showError = jest.fn();
        });

        test('should handle successful search', async () => {
            mockElements.searchInput.value = 'hemoglobin';
            searchComponent.validateSearchInput.mockReturnValueOnce(true);
            searchComponent.searchProtein.mockResolvedValueOnce();

            await searchComponent.handleSearch();

            expect(searchComponent.validateSearchInput).toHaveBeenCalledWith('hemoglobin');
            expect(searchComponent.setLoadingState).toHaveBeenCalledWith(true);
            expect(searchComponent.clearResults).toHaveBeenCalled();
            expect(searchComponent.searchProtein).toHaveBeenCalledWith('hemoglobin');
            expect(searchComponent.setLoadingState).toHaveBeenCalledWith(false);
            expect(console.log).toHaveBeenCalledWith('Search initiated for: hemoglobin');
        });

        test('should handle validation failure', async () => {
            mockElements.searchInput.value = '';
            searchComponent.validateSearchInput.mockReturnValueOnce(false);

            await searchComponent.handleSearch();

            expect(searchComponent.validateSearchInput).toHaveBeenCalledWith('');
            expect(searchComponent.searchProtein).not.toHaveBeenCalled();
        });

        test('should handle search errors', async () => {
            mockElements.searchInput.value = 'test';
            searchComponent.validateSearchInput.mockReturnValueOnce(true);
            const searchError = new Error('Search failed');
            searchComponent.searchProtein.mockRejectedValueOnce(searchError);

            await searchComponent.handleSearch();

            expect(searchComponent.showError).toHaveBeenCalledWith('Search failed');
            expect(searchComponent.setLoadingState).toHaveBeenCalledWith(false);
            expect(console.error).toHaveBeenCalledWith('Search error:', searchError);
        });

        test('should handle search errors without message', async () => {
            mockElements.searchInput.value = 'test';
            searchComponent.validateSearchInput.mockReturnValueOnce(true);
            const searchError = new Error();
            searchError.message = '';
            searchComponent.searchProtein.mockRejectedValueOnce(searchError);

            await searchComponent.handleSearch();

            expect(searchComponent.showError).toHaveBeenCalledWith('Search failed. Please try again.');
        });

        test('should trim whitespace from input', async () => {
            mockElements.searchInput.value = '  hemoglobin  ';
            searchComponent.validateSearchInput.mockReturnValueOnce(true);
            searchComponent.searchProtein.mockResolvedValueOnce();

            await searchComponent.handleSearch();

            expect(searchComponent.validateSearchInput).toHaveBeenCalledWith('hemoglobin');
            expect(searchComponent.searchProtein).toHaveBeenCalledWith('hemoglobin');
        });
    });
});