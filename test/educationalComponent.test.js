/**
 * Tests for EducationalComponent
 */

// Add TextEncoder/TextDecoder polyfills for JSDOM
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock DOM environment for testing
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

// Mock console methods to avoid noise in tests
global.console = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
};

const EducationalComponent = require('../js/components/EducationalComponent');

describe('EducationalComponent', () => {
    let educationalComponent;
    let mockDocument;

    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = '';
        
        // Create mock elements that the component expects
        const header = document.createElement('header');
        const main = document.createElement('main');
        document.body.appendChild(header);
        document.body.appendChild(main);
        
        // Initialize component
        educationalComponent = new EducationalComponent();
        mockDocument = document;
    });

    afterEach(() => {
        // Clean up any modals or tooltips
        const modals = document.querySelectorAll('.educational-modal, .help-overlay, .detailed-explanation-modal');
        modals.forEach(modal => modal.remove());
        
        const tooltips = document.querySelectorAll('.educational-tooltip');
        tooltips.forEach(tooltip => tooltip.remove());
    });

    describe('Initialization', () => {
        test('should initialize with glossary terms', () => {
            expect(educationalComponent.glossaryTerms).toBeDefined();
            expect(educationalComponent.glossaryTerms.size).toBeGreaterThan(0);
            expect(educationalComponent.glossaryTerms.has('protein')).toBe(true);
            expect(educationalComponent.glossaryTerms.has('alpha helix')).toBe(true);
            expect(educationalComponent.glossaryTerms.has('confidence score')).toBe(true);
        });

        test('should initialize structural explanations', () => {
            expect(educationalComponent.structuralExplanations).toBeDefined();
            expect(educationalComponent.structuralExplanations.alpha_helix).toBeDefined();
            expect(educationalComponent.structuralExplanations.beta_sheet).toBeDefined();
            expect(educationalComponent.structuralExplanations.loop).toBeDefined();
        });

        test('should initialize confidence explanations', () => {
            expect(educationalComponent.confidenceExplanations).toBeDefined();
            expect(educationalComponent.confidenceExplanations.very_high).toBeDefined();
            expect(educationalComponent.confidenceExplanations.confident).toBeDefined();
            expect(educationalComponent.confidenceExplanations.low).toBeDefined();
            expect(educationalComponent.confidenceExplanations.very_low).toBeDefined();
        });

        test('should create glossary modal in DOM', () => {
            const glossaryModal = document.getElementById('glossary-modal');
            expect(glossaryModal).toBeTruthy();
            expect(glossaryModal.className).toBe('educational-modal');
        });

        test('should create educational tooltip container', () => {
            const tooltipContainer = document.getElementById('educational-tooltip');
            expect(tooltipContainer).toBeTruthy();
            expect(tooltipContainer.className).toBe('educational-tooltip');
        });

        test('should add help and glossary buttons', () => {
            const helpButton = document.getElementById('help-button');
            const glossaryButton = document.getElementById('glossary-button');
            
            expect(helpButton).toBeTruthy();
            expect(glossaryButton).toBeTruthy();
        });
    });

    describe('Glossary Functionality', () => {
        test('should populate glossary with all terms', () => {
            educationalComponent.populateGlossary();
            
            const glossaryContent = document.getElementById('glossary-content');
            expect(glossaryContent).toBeTruthy();
            
            const termElements = glossaryContent.querySelectorAll('.glossary-term');
            expect(termElements.length).toBeGreaterThan(0);
        });

        test('should filter glossary by category', () => {
            educationalComponent.populateGlossary('Basic Concepts');
            
            const glossaryContent = document.getElementById('glossary-content');
            const termElements = glossaryContent.querySelectorAll('.glossary-term');
            
            // Should have fewer terms than total
            expect(termElements.length).toBeLessThan(educationalComponent.glossaryTerms.size);
            
            // All visible terms should be from the selected category
            termElements.forEach(termElement => {
                const categoryElement = termElement.querySelector('.term-category');
                expect(categoryElement.textContent).toBe('Basic Concepts');
            });
        });

        test('should filter glossary by search term', () => {
            educationalComponent.populateGlossary('all', 'protein');
            
            const glossaryContent = document.getElementById('glossary-content');
            const termElements = glossaryContent.querySelectorAll('.glossary-term');
            
            expect(termElements.length).toBeGreaterThan(0);
            
            // Check that search term appears in term name or definition
            termElements.forEach(termElement => {
                const termHeader = termElement.querySelector('.term-header h4').textContent.toLowerCase();
                const termDefinition = termElement.querySelector('.term-definition').textContent.toLowerCase();
                
                expect(termHeader.includes('protein') || termDefinition.includes('protein')).toBe(true);
            });
        });

        test('should show no results message when no terms match', () => {
            educationalComponent.populateGlossary('all', 'nonexistentterm');
            
            const glossaryContent = document.getElementById('glossary-content');
            const noResults = glossaryContent.querySelector('.no-results');
            
            expect(noResults).toBeTruthy();
            expect(noResults.textContent).toContain('No terms found');
        });

        test('should show glossary modal', () => {
            educationalComponent.showGlossary();
            
            const modal = document.getElementById('glossary-modal');
            expect(modal.style.display).toBe('flex');
        });
    });

    describe('Tooltip System', () => {
        test('should get tooltip content for known keys', () => {
            const confidenceContent = educationalComponent.getTooltipContent('confidence-score');
            expect(confidenceContent).toBeTruthy();
            expect(confidenceContent.title).toBe('Confidence Score');
            expect(confidenceContent.description).toContain('reliable');

            const helixContent = educationalComponent.getTooltipContent('alpha-helix');
            expect(helixContent).toBeTruthy();
            expect(helixContent.title).toBe('Alpha Helix');
        });

        test('should return null for unknown tooltip keys', () => {
            const unknownContent = educationalComponent.getTooltipContent('unknown-key');
            expect(unknownContent).toBeNull();
        });

        test('should show educational tooltip', () => {
            // Create a mock trigger element
            const trigger = document.createElement('div');
            trigger.setAttribute('data-edu-tooltip', 'confidence-score');
            document.body.appendChild(trigger);

            educationalComponent.showEducationalTooltip(trigger, 'confidence-score');

            const tooltip = document.getElementById('educational-tooltip');
            expect(tooltip.style.display).toBe('block');
            expect(tooltip.innerHTML).toContain('Confidence Score');
        });

        test('should hide educational tooltip', () => {
            // First show a tooltip
            const trigger = document.createElement('div');
            document.body.appendChild(trigger);
            educationalComponent.showEducationalTooltip(trigger, 'confidence-score');

            // Then hide it
            educationalComponent.hideEducationalTooltip();

            const tooltip = document.getElementById('educational-tooltip');
            expect(tooltip.style.display).toBe('none');
        });
    });

    describe('Help System', () => {
        test('should show help overlay', () => {
            educationalComponent.showHelpOverlay();

            const helpOverlay = document.getElementById('help-overlay');
            expect(helpOverlay).toBeTruthy();
            expect(helpOverlay.innerHTML).toContain('How to Use AlphaView');
            expect(helpOverlay.innerHTML).toContain('Searching for Proteins');
            expect(helpOverlay.innerHTML).toContain('Understanding Confidence Scores');
        });

        test('should show detailed explanation for structural topics', () => {
            educationalComponent.showDetailedExplanation('alpha_helix');

            const modal = document.querySelector('.detailed-explanation-modal');
            expect(modal).toBeTruthy();
            expect(modal.innerHTML).toContain('Alpha Helix');
            expect(modal.innerHTML).toContain('spiral structure');
        });

        test('should show detailed explanation for confidence scores', () => {
            educationalComponent.showDetailedExplanation('confidence-score');

            const modal = document.querySelector('.detailed-explanation-modal');
            expect(modal).toBeTruthy();
            expect(modal.innerHTML).toContain('Understanding Confidence Scores');
            expect(modal.innerHTML).toContain('Very High');
            expect(modal.innerHTML).toContain('90-100%');
        });
    });

    describe('Utility Functions', () => {
        test('should capitalize words correctly', () => {
            expect(educationalComponent.capitalizeWords('alpha helix')).toBe('Alpha Helix');
            expect(educationalComponent.capitalizeWords('protein structure')).toBe('Protein Structure');
            expect(educationalComponent.capitalizeWords('single word')).toBe('Single Word');
        });

        test('should get confidence level text', () => {
            expect(educationalComponent.getConfidenceLevelText('very_high')).toBe('Very High Confidence');
            expect(educationalComponent.getConfidenceLevelText('confident')).toBe('Confident');
            expect(educationalComponent.getConfidenceLevelText('low')).toBe('Low Confidence');
            expect(educationalComponent.getConfidenceLevelText('very_low')).toBe('Very Low Confidence');
            expect(educationalComponent.getConfidenceLevelText('unknown')).toBe('Unknown');
        });

        test('should get confidence explanations', () => {
            const highExplanation = educationalComponent.getConfidenceExplanation(95);
            expect(highExplanation).toContain('highly reliable');

            const mediumExplanation = educationalComponent.getConfidenceExplanation(80);
            expect(mediumExplanation).toContain('backbone is likely correct');

            const lowExplanation = educationalComponent.getConfidenceExplanation(60);
            expect(lowExplanation).toContain('general fold is likely correct');

            const veryLowExplanation = educationalComponent.getConfidenceExplanation(30);
            expect(veryLowExplanation).toContain('likely disordered');
        });
    });

    describe('Element Enhancement', () => {
        test('should enhance existing elements with tooltips', () => {
            // Create mock elements
            const confidenceElement = document.createElement('span');
            confidenceElement.className = 'confidence-score';
            document.body.appendChild(confidenceElement);

            const uniprotElement = document.createElement('span');
            uniprotElement.className = 'uniprot-id';
            document.body.appendChild(uniprotElement);

            // Enhance elements
            educationalComponent.enhanceExistingElements();

            // Check that tooltips were added
            expect(confidenceElement.getAttribute('data-edu-tooltip')).toBe('confidence-score');
            expect(confidenceElement.style.cursor).toBe('help');

            expect(uniprotElement.getAttribute('data-edu-tooltip')).toBe('uniprot-id');
            expect(uniprotElement.style.cursor).toBe('help');
        });

        test('should not duplicate tooltips on already enhanced elements', () => {
            const element = document.createElement('span');
            element.className = 'confidence-score';
            element.setAttribute('data-edu-tooltip', 'existing-tooltip');
            document.body.appendChild(element);

            educationalComponent.enhanceExistingElements();

            // Should keep the existing tooltip
            expect(element.getAttribute('data-edu-tooltip')).toBe('existing-tooltip');
        });
    });

    describe('Keyboard Shortcuts', () => {
        test('should handle F1 key for help', () => {
            // Spy on showHelpOverlay
            const showHelpSpy = jest.spyOn(educationalComponent, 'showHelpOverlay');
            
            // Create and dispatch event using document's createEvent
            const event = document.createEvent('KeyboardEvent');
            event.initEvent('keydown', true, true);
            Object.defineProperty(event, 'key', { value: 'F1' });
            
            document.dispatchEvent(event);
            
            expect(showHelpSpy).toHaveBeenCalled();
        });

        test('should handle Ctrl+G for glossary', () => {
            const showGlossarySpy = jest.spyOn(educationalComponent, 'showGlossary');
            
            // Create and dispatch event using document's createEvent
            const event = document.createEvent('KeyboardEvent');
            event.initEvent('keydown', true, true);
            Object.defineProperty(event, 'key', { value: 'g' });
            Object.defineProperty(event, 'ctrlKey', { value: true });
            
            document.dispatchEvent(event);
            
            expect(showGlossarySpy).toHaveBeenCalled();
        });

        test('should handle Escape key to close modals', () => {
            // Create a mock modal
            const modal = document.createElement('div');
            modal.className = 'educational-modal';
            modal.style.display = 'flex';
            document.body.appendChild(modal);

            // Create and dispatch event using document's createEvent
            const event = document.createEvent('KeyboardEvent');
            event.initEvent('keydown', true, true);
            Object.defineProperty(event, 'key', { value: 'Escape' });
            
            document.dispatchEvent(event);

            expect(modal.style.display).toBe('none');
        });
    });

    describe('Integration with Existing Components', () => {
        test('should provide methods for confidence level text', () => {
            expect(typeof educationalComponent.getConfidenceLevelText).toBe('function');
            expect(educationalComponent.getConfidenceLevelText('very_high')).toBeTruthy();
        });

        test('should provide methods for confidence explanations', () => {
            expect(typeof educationalComponent.getConfidenceExplanation).toBe('function');
            expect(educationalComponent.getConfidenceExplanation(95)).toBeTruthy();
        });

        test('should handle glossary term highlighting', () => {
            educationalComponent.highlightGlossaryTerm('protein');
            
            const searchInput = document.getElementById('glossary-search-input');
            expect(searchInput.value).toBe('protein');
        });
    });

    describe('Error Handling', () => {
        test('should handle missing DOM elements gracefully', () => {
            // Remove required elements
            document.body.innerHTML = '';
            
            // Should not throw when trying to enhance elements
            expect(() => {
                educationalComponent.enhanceExistingElements();
            }).not.toThrow();
        });

        test('should handle invalid tooltip content keys', () => {
            const result = educationalComponent.getTooltipContent('invalid-key');
            expect(result).toBeNull();
        });

        test('should handle missing glossary search input', () => {
            // Remove search input
            const searchInput = document.getElementById('glossary-search-input');
            if (searchInput) {
                searchInput.remove();
            }
            
            // Should not throw when highlighting terms
            expect(() => {
                educationalComponent.highlightGlossaryTerm('protein');
            }).not.toThrow();
        });
    });

    describe('Static Initialization', () => {
        test('should initialize component when called statically', () => {
            // Mock window object
            global.window = dom.window;
            
            EducationalComponent.initialize();
            
            expect(window.educationalComponent).toBeDefined();
            expect(window.educationalComponent).toBeInstanceOf(EducationalComponent);
        });

        test('should not initialize in non-browser environment', () => {
            const originalWindow = global.window;
            global.window = undefined;
            
            // Should not throw
            expect(() => {
                EducationalComponent.initialize();
            }).not.toThrow();
            
            global.window = originalWindow;
        });
    });
});