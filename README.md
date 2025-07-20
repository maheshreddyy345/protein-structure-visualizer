# AlphaView

A modern web-based protein structure visualization tool that integrates with the AlphaFold database to provide interactive 3D visualization of protein structures with confidence-based coloring.

## 🚀 Features

### ✅ Completed Features (All Tasks 1-12)

#### 🔍 **Protein Search & Discovery**
- Search proteins by name or UniProt ID
- Integration with UniProt database
- Smart search results with protein metadata
- Real-time search validation

#### 📊 **Detailed Protein Information**
- Comprehensive protein profiles
- Functional descriptions
- Sequence information and gene names
- Confidence score analysis
- Interactive tooltips and explanations

#### 🧬 **Interactive 3D Visualization**
- Real-time 3D protein structure rendering
- Multiple visualization styles (Cartoon, Surface, Stick)
- Mouse controls (rotation, zoom, pan)
- Professional-grade molecular visualization

#### 🎨 **Advanced Confidence-Based Coloring**
- AlphaFold confidence score parsing from PDB B-factors
- Color-coded confidence levels:
  - 🔵 Very High (90-100%): Dark Blue
  - 🔷 Confident (70-90%): Light Blue  
  - 🟡 Low (50-70%): Yellow
  - 🟠 Very Low (0-50%): Orange
- Statistical analysis and distribution
- Interactive confidence legend

#### 🎛️ **Enhanced Controls**
- Style switching (Cartoon/Surface/Stick)
- Confidence coloring toggle
- View reset functionality
- Responsive design

#### 🎓 **Educational Features & User Guidance**
- Interactive help system with glossary
- Contextual tooltips and explanations
- Step-by-step user guidance
- Scientific background information

#### 🛡️ **Comprehensive Error Handling**
- Graceful error recovery
- User-friendly error messages
- Network failure handling
- Browser compatibility warnings

#### 📱 **Responsive Design & Cross-Browser Compatibility**
- Mobile-optimized interface
- Touch-friendly controls
- Cross-browser WebGL support
- Adaptive layouts for all screen sizes

#### 🔗 **Seamless Component Integration**
- Smooth workflow between search, info, and visualization
- Persistent search results for easy protein switching
- Visual feedback for selected proteins
- Clickable title for quick app reset

#### ⚡ **Performance Optimization & Polish**
- Optimized 3D rendering performance
- Efficient API caching
- Smooth animations and transitions
- Professional UI/UX design

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **3D Visualization**: 3Dmol.js
- **APIs**: UniProt REST API, AlphaFold Database
- **Testing**: Jest (158 tests)
- **Architecture**: Component-based modular design

## 📁 Project Structure

```
├── css/
│   └── styles.css              # Main stylesheet
├── js/
│   ├── components/
│   │   ├── SearchComponent.js   # Protein search functionality
│   │   ├── InfoComponent.js     # Protein information display
│   │   └── VisualizerComponent.js # 3D visualization engine
│   ├── models/
│   │   └── Protein.js          # Protein data model
│   ├── services/
│   │   └── APIService.js       # API communication layer
│   ├── utils/
│   │   └── proteinUtils.js     # Utility functions
│   └── app.js                  # Main application controller
├── test/                       # Test suite (Jest)
├── .kiro/specs/               # Project specifications
├── index.html                 # Main application
└── package.json               # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites
- Modern web browser with WebGL support
- Node.js (for running tests)
- Internet connection (for API access)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/maheshreddyy345/alphaview.git
cd alphaview
```

2. Install dependencies:
```bash
npm install
```

3. Run tests:
```bash
npm test
```

4. Open the application:
```bash
# Simply open index.html in your browser
# Or use a local server:
npx http-server .
```

## 🧪 Usage Examples

### Search for Proteins
- **By Name**: "insulin", "hemoglobin", "collagen"
- **By UniProt ID**: "P01308", "P69905", "Q02388"
- **By Gene**: "INS", "HBA1", "COL1A1"

### Visualization Controls
- **Mouse Controls**: 
  - Left drag: Rotate
  - Right drag: Pan
  - Scroll: Zoom
- **Style Options**: Cartoon, Surface, Stick
- **Confidence Colors**: Toggle on/off
- **Reset View**: Return to default position

## 🧬 Scientific Background

This tool visualizes protein structures from the [AlphaFold Protein Structure Database](https://alphafold.ebi.ac.uk/), which contains AI-predicted structures for millions of proteins. The confidence-based coloring system helps users understand the reliability of different regions in the predicted structure:

- **High Confidence (Blue)**: Very reliable, suitable for detailed analysis
- **Medium Confidence (Light Blue)**: Generally accurate backbone
- **Low Confidence (Yellow)**: Less reliable, use with caution
- **Very Low Confidence (Orange)**: Highly uncertain regions

## 🧪 Testing

The project includes comprehensive test coverage:

```bash
npm test                    # Run all tests
npm test -- --watch        # Run tests in watch mode
npm test -- --coverage     # Generate coverage report
```

**Test Statistics**: 158 tests covering:
- API service functionality
- Component interactions
- 3D visualization features
- Confidence-based coloring
- Error handling scenarios

## 📈 Development Progress

- ✅ **Task 1**: Project structure and HTML foundation
- ✅ **Task 2**: Core data models and API services
- ✅ **Task 3**: Protein search functionality
- ✅ **Task 4**: Protein information display
- ✅ **Task 5**: Basic 3D structure visualization
- ✅ **Task 6**: Confidence-based coloring and visualization styles
- ✅ **Task 7**: Interactive structure exploration features
- ✅ **Task 8**: Educational features and user guidance
- ✅ **Task 9**: Comprehensive error handling
- ✅ **Task 10**: Responsive design and cross-browser compatibility
- ✅ **Task 11**: Component integration and workflows
- ✅ **Task 12**: Performance optimization and final polish

🎉 **Project Status: COMPLETE** - All core features implemented and tested!

## 🤝 Contributing

This project follows a structured development approach with:
- Comprehensive testing for all features
- Component-based architecture
- API-first design
- Progressive enhancement

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **AlphaFold Team**: For providing the protein structure database
- **UniProt**: For protein sequence and functional information
- **3Dmol.js**: For the excellent molecular visualization library
- **DeepMind**: For advancing protein structure prediction

## 📞 Contact

For questions or suggestions, please open an issue on GitHub.

---

**Built with ❤️ for the scientific community**