# Design Document

## Overview

The Protein Structure Visualizer is a client-side web application built with modern JavaScript that interfaces with the AlphaFold Protein Structure Database API. The application follows a modular architecture with separate concerns for data fetching, 3D visualization, and user interface management. The design prioritizes simplicity and educational value while providing a responsive and interactive experience.

## Architecture

The application uses a layered architecture:

```
┌─────────────────────────────────────┐
│           User Interface            │
│     (HTML, CSS, JavaScript)         │
├─────────────────────────────────────┤
│        Application Layer            │
│   (Search, Display, Interaction)    │
├─────────────────────────────────────┤
│         Service Layer               │
│  (AlphaFold API, Data Processing)   │
├─────────────────────────────────────┤
│       Visualization Layer           │
│      (3Dmol.js, WebGL)             │
└─────────────────────────────────────┘
```

### Technology Stack
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **3D Visualization**: 3Dmol.js library for molecular visualization
- **API Integration**: Fetch API for HTTP requests
- **Data Format**: PDB files from AlphaFold database
- **Deployment**: Static web hosting (can run locally or on any web server)

## Components and Interfaces

### 1. Search Component
**Purpose**: Handle protein search functionality and results display

**Key Methods**:
- `searchProtein(query)`: Search by name or UniProt ID
- `displaySearchResults(results)`: Show search results list
- `selectProtein(proteinId)`: Handle protein selection

**Interface with AlphaFold API**:
- Uses UniProt API for protein name to ID mapping
- Validates UniProt IDs before querying AlphaFold

### 2. Protein Info Component
**Purpose**: Display protein metadata and basic information

**Key Methods**:
- `fetchProteinInfo(uniprotId)`: Get protein details
- `displayProteinDetails(proteinData)`: Show protein information
- `formatConfidenceScore(score)`: Format and explain confidence values

**Data Structure**:
```javascript
{
  uniprotId: string,
  proteinName: string,
  organism: string,
  sequenceLength: number,
  confidenceScore: number,
  description: string
}
```

### 3. Structure Visualizer Component
**Purpose**: Handle 3D protein structure visualization

**Key Methods**:
- `loadStructure(uniprotId)`: Fetch PDB file from AlphaFold
- `renderStructure(pdbData)`: Create 3D visualization
- `updateVisualizationStyle(style)`: Change rendering style
- `highlightResidue(residueId)`: Highlight specific amino acids

**3Dmol.js Integration**:
- Initialize viewer with appropriate settings
- Handle confidence-based coloring
- Manage user interactions (rotate, zoom, click)

### 4. API Service
**Purpose**: Manage all external API communications

**Key Methods**:
- `searchUniProt(query)`: Search UniProt database
- `fetchAlphaFoldStructure(uniprotId)`: Get PDB structure file
- `getProteinMetadata(uniprotId)`: Retrieve protein information
- `handleApiErrors(error)`: Centralized error handling

**API Endpoints**:
- AlphaFold: `https://alphafold.ebi.ac.uk/files/AF-{UNIPROT_ID}-F1-model_v4.pdb`
- UniProt: `https://rest.uniprot.org/uniprotkb/search`

## Data Models

### Protein Model
```javascript
class Protein {
  constructor(uniprotId, name, organism) {
    this.uniprotId = uniprotId;
    this.name = name;
    this.organism = organism;
    this.sequenceLength = null;
    this.confidenceScore = null;
    this.description = null;
    this.structureData = null;
  }
  
  async loadStructure() {
    // Fetch and parse PDB data
  }
  
  getConfidenceLevel() {
    // Return high/medium/low based on score
  }
}
```

### Visualization State Model
```javascript
class VisualizationState {
  constructor() {
    this.currentStyle = 'cartoon';
    this.showConfidenceColors = true;
    this.selectedResidue = null;
    this.viewerSettings = {
      backgroundColor: 'white',
      zoom: 1.0,
      rotation: { x: 0, y: 0, z: 0 }
    };
  }
}
```

## Error Handling

### API Error Handling
- **Network Errors**: Display retry button with exponential backoff
- **Invalid UniProt ID**: Show format examples and suggestions
- **Structure Not Available**: Explain why some proteins may not have AlphaFold predictions
- **Large File Loading**: Implement progress indicators and timeout handling

### User Experience Errors
- **Search No Results**: Provide search tips and example queries
- **Visualization Failures**: Fallback to basic structure information
- **Browser Compatibility**: Detect WebGL support and show alternatives

## Testing Strategy

### Unit Testing
- **API Service Tests**: Mock API responses and test error handling
- **Data Model Tests**: Validate protein data parsing and transformation
- **Component Tests**: Test individual UI component functionality

### Integration Testing
- **API Integration**: Test real API calls with known protein IDs
- **Visualization Integration**: Test 3Dmol.js integration with sample PDB files
- **User Workflow**: Test complete search-to-visualization flow

### Manual Testing
- **Cross-browser Testing**: Chrome, Firefox, Safari, Edge
- **Performance Testing**: Large protein structures and slow connections
- **Accessibility Testing**: Keyboard navigation and screen reader compatibility

### Test Data
- **Known Proteins**: Use well-documented proteins like hemoglobin (P69905)
- **Edge Cases**: Very large proteins, low-confidence predictions
- **Error Cases**: Invalid IDs, network failures, malformed data

## Implementation Notes

### Performance Considerations
- **Lazy Loading**: Load structure data only when requested
- **Caching**: Cache protein metadata to reduce API calls
- **Progressive Enhancement**: Basic info loads first, then 3D visualization

### Educational Features
- **Tooltips**: Context-sensitive help throughout the interface
- **Color Legend**: Always visible explanation of confidence coloring
- **Glossary**: Expandable definitions for technical terms

### Browser Compatibility
- **WebGL Support**: Required for 3D visualization
- **Modern JavaScript**: ES6+ features with potential polyfills
- **Responsive Design**: Works on desktop and tablet devices