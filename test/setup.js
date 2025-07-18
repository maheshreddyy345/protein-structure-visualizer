/**
 * Test setup file for Jest
 */

// Mock browser globals
global.fetch = jest.fn();
global.AbortController = jest.fn(() => ({
    abort: jest.fn(),
    signal: {}
}));

// Mock navigator for browser compatibility checks
global.navigator = {
    onLine: true
};

// Load and make classes available globally
global.Protein = require('../js/models/Protein.js');
global.APIService = require('../js/services/APIService.js');

// Load utility functions
const utils = require('../js/utils/proteinUtils.js');
Object.assign(global, utils);

// Mock console methods to reduce test noise
global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
};