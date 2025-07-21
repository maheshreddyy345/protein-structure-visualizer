/**
 * Educational component for providing user guidance and explanations
 */
class EducationalComponent {
    constructor() {
        this.tooltips = new Map();
        this.glossaryTerms = this.initializeGlossaryTerms();
        this.hideTimeout = null;
        
        this.initializeEducationalFeatures();
    }

    /**
     * Initialize educational features
     */
    initializeEducationalFeatures() {
        try {
            this.createGlossaryModal();
            this.setupGlobalTooltipSystem();
            this.addEducationalButtons();
            this.setupKeyboardShortcuts();
            console.log('Educational features initialized successfully');
        } catch (error) {
            console.error('Error initializing educational features:', error);
            // Continue without educational features rather than breaking the app
        }
    }

    /**
     * Initialize glossary terms with definitions
     * @returns {Map} Map of terms and their definitions
     */
    initializeGlossaryTerms() {
        const terms = new Map();
        
        // Basic Concepts
        terms.set('protein', {
            definition: 'Large, complex molecules composed of amino acids that perform essential functions in living organisms, including catalysis, structure, transport, and regulation. Proteins are the workhorses of cells and are involved in virtually every biological process.',
            category: 'Basic Concepts',
            examples: 'Enzymes (catalysis), antibodies (immune defense), hemoglobin (oxygen transport), collagen (structural support)'
        });
        
        terms.set('amino acid', {
            definition: 'The building blocks of proteins. There are 20 standard amino acids, each with unique chemical properties that determine protein structure and function. They contain an amino group, carboxyl group, and a distinctive side chain.',
            category: 'Basic Concepts',
            examples: 'Glycine (smallest), Tryptophan (largest), Cysteine (forms disulfide bonds), Proline (creates kinks in structure)'
        });
        
        terms.set('residue', {
            definition: 'An amino acid unit within a protein chain. Each residue is connected to its neighbors by peptide bonds. The term "residue" refers to what remains of an amino acid after water is removed during peptide bond formation.',
            category: 'Basic Concepts',
            examples: 'A 100-amino acid protein contains 100 residues numbered from 1 to 100'
        });
        
        terms.set('peptide bond', {
            definition: 'The chemical bond that links amino acids together in a protein chain, formed between the carboxyl group of one amino acid and the amino group of another. This is a covalent bond that releases a water molecule during formation (condensation reaction).',
            category: 'Basic Concepts',
            examples: 'The backbone of every protein is held together by peptide bonds'
        });
        
        terms.set('polypeptide', {
            definition: 'A chain of amino acids linked by peptide bonds. Proteins can consist of one or more polypeptide chains. Short chains (2-50 amino acids) are often called peptides, while longer chains are proteins.',
            category: 'Basic Concepts',
            examples: 'Insulin has 2 polypeptide chains, hemoglobin has 4 chains'
        });
        
        terms.set('protein folding', {
            definition: 'The process by which a linear chain of amino acids adopts its functional three-dimensional structure. This process is driven by various chemical interactions and is crucial for protein function.',
            category: 'Basic Concepts',
            examples: 'Misfolded proteins can cause diseases like Alzheimer\'s and Parkinson\'s'
        });
        
        terms.set('denaturation', {
            definition: 'The process where a protein loses its natural structure due to external factors like heat, pH changes, or chemicals. Denatured proteins typically lose their biological activity.',
            category: 'Basic Concepts',
            examples: 'Cooking an egg denatures the proteins, making the white solid'
        });
        
        // Primary Structure
        terms.set('primary structure', {
            definition: 'The linear sequence of amino acids in a protein chain, which determines all higher levels of protein structure.',
            category: 'Primary Structure'
        });
        
        terms.set('n-terminus', {
            definition: 'The beginning of a protein chain, characterized by a free amino group. Proteins are synthesized from N-terminus to C-terminus.',
            category: 'Primary Structure'
        });
        
        terms.set('c-terminus', {
            definition: 'The end of a protein chain, characterized by a free carboxyl group.',
            category: 'Primary Structure'
        });
        
        // Secondary Structure
        terms.set('secondary structure', {
            definition: 'Local folding patterns in proteins, primarily alpha helices and beta sheets, stabilized by hydrogen bonds between backbone atoms. These structures form the basic architectural elements of proteins.',
            category: 'Secondary Structure',
            examples: 'Alpha helices make up ~30% and beta sheets ~20% of typical protein structures'
        });
        
        terms.set('alpha helix', {
            definition: 'A common secondary structure where the protein backbone forms a right-handed spiral stabilized by hydrogen bonds between every 4th amino acid (i to i+4). Each turn of the helix contains 3.6 amino acids and advances 1.5 Å along the axis.',
            category: 'Secondary Structure',
            examples: 'Keratin in hair, myosin in muscle, many DNA-binding proteins'
        });
        
        terms.set('beta sheet', {
            definition: 'A secondary structure where protein strands are arranged side-by-side in an extended conformation, connected by hydrogen bonds. Can be parallel (same direction) or antiparallel (opposite directions).',
            category: 'Secondary Structure',
            examples: 'Silk fibroin, immunoglobulin domains, many enzyme active sites'
        });
        
        terms.set('beta strand', {
            definition: 'An extended stretch of amino acids (typically 3-10 residues) that forms part of a beta sheet structure. Individual strands are connected by hydrogen bonds to form sheets.',
            category: 'Secondary Structure',
            examples: 'A beta sheet might contain 2-15 individual beta strands'
        });
        
        terms.set('loop region', {
            definition: 'Flexible regions of a protein that connect secondary structure elements like alpha helices and beta sheets. These regions often contain functional sites and are important for protein dynamics.',
            category: 'Secondary Structure',
            examples: 'Active site loops in enzymes, antigen-binding loops in antibodies'
        });
        
        terms.set('turn', {
            definition: 'Short segments (typically 2-5 residues) that cause the protein chain to change direction, often found between secondary structure elements. Beta turns are the most common type.',
            category: 'Secondary Structure',
            examples: 'Beta hairpins connect two antiparallel beta strands'
        });
        
        terms.set('coil', {
            definition: 'Irregular, flexible regions of protein structure that don\'t form regular secondary structures. Also called random coil, though the structure is not truly random.',
            category: 'Secondary Structure',
            examples: 'Flexible linker regions between protein domains'
        });
        
        terms.set('beta hairpin', {
            definition: 'A simple structure consisting of two antiparallel beta strands connected by a short loop or turn. It\'s one of the most common structural motifs in proteins.',
            category: 'Secondary Structure',
            examples: 'Common in immunoglobulin folds and many enzyme structures'
        });
        
        terms.set('helix-turn-helix', {
            definition: 'A common protein motif consisting of two alpha helices connected by a short turn. Often found in DNA-binding proteins where one helix fits into the major groove of DNA.',
            category: 'Secondary Structure',
            examples: 'Many transcription factors and repressor proteins'
        });
        
        // Tertiary Structure
        terms.set('tertiary structure', {
            definition: 'The overall 3D shape of a single protein chain, formed by interactions between amino acid side chains. This level of structure determines the protein\'s specific function and is stabilized by various non-covalent interactions.',
            category: 'Tertiary Structure',
            examples: 'Globular proteins like enzymes, fibrous proteins like collagen'
        });
        
        terms.set('protein domain', {
            definition: 'A distinct functional and structural unit within a protein that can fold independently. Large proteins often contain multiple domains, each with specific functions. Domains typically contain 100-250 amino acids.',
            category: 'Tertiary Structure',
            examples: 'DNA-binding domain, kinase domain, immunoglobulin domain'
        });
        
        terms.set('active site', {
            definition: 'The region of an enzyme where substrate binding and catalysis occur, typically a pocket or cleft in the protein structure. The active site is precisely shaped to bind specific substrates and facilitate chemical reactions.',
            category: 'Tertiary Structure',
            examples: 'The active site of lysozyme cleaves bacterial cell walls'
        });
        
        terms.set('binding site', {
            definition: 'A region on a protein where other molecules (ligands, substrates, or other proteins) can bind. Binding sites are complementary in shape and chemical properties to their target molecules.',
            category: 'Tertiary Structure',
            examples: 'Hemoglobin\'s oxygen-binding sites, antibody antigen-binding sites'
        });
        
        terms.set('allosteric site', {
            definition: 'A binding site on a protein that is distinct from the active site. Binding of molecules to allosteric sites can change the protein\'s shape and activity, providing a mechanism for regulation.',
            category: 'Tertiary Structure',
            examples: 'Regulatory sites on enzymes that control metabolic pathways'
        });
        
        terms.set('protein fold', {
            definition: 'The overall architecture or topology of a protein structure. Proteins with similar folds often have related functions, even if their sequences are different.',
            category: 'Tertiary Structure',
            examples: 'Immunoglobulin fold, TIM barrel, four-helix bundle'
        });
        
        terms.set('hydrophobic core', {
            definition: 'The interior region of a globular protein where hydrophobic amino acids cluster together, excluding water. This core provides stability to the protein structure.',
            category: 'Tertiary Structure',
            examples: 'The core of most globular proteins is 85-95% hydrophobic residues'
        });
        
        // Quaternary Structure
        terms.set('quaternary structure', {
            definition: 'The arrangement of multiple protein chains (subunits) in a multi-subunit protein complex. This level of organization allows for complex regulation and cooperative effects between subunits.',
            category: 'Quaternary Structure',
            examples: 'Hemoglobin (4 subunits), antibodies (4 subunits), ribosomes (80+ subunits)'
        });
        
        terms.set('subunit', {
            definition: 'An individual protein chain in a multi-chain protein complex. Subunits can be identical (homomeric) or different (heteromeric) and are held together by non-covalent interactions.',
            category: 'Quaternary Structure',
            examples: 'Hemoglobin has 2 α-subunits and 2 β-subunits'
        });
        
        terms.set('protein complex', {
            definition: 'A structure formed by multiple protein subunits that work together to perform a biological function. Complexes can be stable or transient and may include non-protein components.',
            category: 'Quaternary Structure',
            examples: 'Ribosome (protein synthesis), ATP synthase (energy production)'
        });
        
        terms.set('oligomer', {
            definition: 'A protein complex composed of a small number of subunits (typically 2-10). The subunits can be identical (homo-oligomer) or different (hetero-oligomer).',
            category: 'Quaternary Structure',
            examples: 'Dimer (2 subunits), trimer (3 subunits), tetramer (4 subunits)'
        });
        
        terms.set('cooperativity', {
            definition: 'A phenomenon in multi-subunit proteins where the binding of a ligand to one subunit affects the binding affinity of other subunits. Can be positive (enhancing) or negative (inhibiting).',
            category: 'Quaternary Structure',
            examples: 'Oxygen binding to hemoglobin shows positive cooperativity'
        });
        
        // Chemical Interactions
        terms.set('hydrogen bond', {
            definition: 'A weak chemical bond between a hydrogen atom and an electronegative atom, crucial for protein structure stability.',
            category: 'Chemical Interactions'
        });
        
        terms.set('disulfide bond', {
            definition: 'A strong covalent bond between two cysteine residues that helps stabilize protein structure.',
            category: 'Chemical Interactions'
        });
        
        terms.set('hydrophobic interaction', {
            definition: 'The tendency of nonpolar amino acids to cluster together, excluding water, which drives protein folding.',
            category: 'Chemical Interactions'
        });
        
        terms.set('ionic interaction', {
            definition: 'Electrostatic attraction between oppositely charged amino acid side chains, also called salt bridges.',
            category: 'Chemical Interactions'
        });
        
        terms.set('van der waals forces', {
            definition: 'Weak attractive forces between atoms in close proximity, contributing to protein stability.',
            category: 'Chemical Interactions'
        });
        
        // Protein Properties
        terms.set('hydrophobic', {
            definition: 'Water-repelling. Hydrophobic amino acids tend to be buried in the protein core, away from water.',
            category: 'Protein Properties'
        });
        
        terms.set('hydrophilic', {
            definition: 'Water-loving. Hydrophilic amino acids are often found on the protein surface, interacting with water.',
            category: 'Protein Properties'
        });
        
        terms.set('polar', {
            definition: 'Having an uneven distribution of electrical charge, making amino acids capable of forming hydrogen bonds.',
            category: 'Protein Properties'
        });
        
        terms.set('nonpolar', {
            definition: 'Having an even distribution of electrical charge, making amino acids hydrophobic.',
            category: 'Protein Properties'
        });
        
        terms.set('charged', {
            definition: 'Amino acids that carry a positive or negative charge at physiological pH.',
            category: 'Protein Properties'
        });
        
        // Protein Function & Enzymes
        terms.set('enzyme', {
            definition: 'A protein that catalyzes (speeds up) biochemical reactions by lowering the activation energy required. Enzymes are highly specific and can increase reaction rates by factors of 10^6 to 10^12.',
            category: 'Protein Function & Enzymes',
            examples: 'Pepsin (digestion), DNA polymerase (replication), catalase (antioxidant)'
        });
        
        terms.set('catalyst', {
            definition: 'A substance that increases the rate of a chemical reaction without being consumed in the process. Enzymes are biological catalysts that are essential for life.',
            category: 'Protein Function & Enzymes',
            examples: 'Enzymes catalyze virtually all biochemical reactions in living cells'
        });
        
        terms.set('substrate', {
            definition: 'The molecule upon which an enzyme acts during a biochemical reaction. Substrates bind to the enzyme\'s active site and are converted to products.',
            category: 'Protein Function & Enzymes',
            examples: 'Glucose is a substrate for hexokinase in glycolysis'
        });
        
        terms.set('ligand', {
            definition: 'A molecule that binds to a protein, often causing a conformational change that affects protein function. Can be substrates, inhibitors, activators, or cofactors.',
            category: 'Protein Function & Enzymes',
            examples: 'Oxygen binding to hemoglobin, hormones binding to receptors'
        });
        
        terms.set('allosteric regulation', {
            definition: 'Regulation of protein function through binding of molecules at sites other than the active site. Allosteric binding can increase (positive) or decrease (negative) activity.',
            category: 'Protein Function & Enzymes',
            examples: 'Phosphofructokinase regulation in glycolysis'
        });
        
        terms.set('enzyme kinetics', {
            definition: 'The study of the rates of enzyme-catalyzed reactions and how they change in response to different conditions. Described by parameters like Km and Vmax.',
            category: 'Protein Function & Enzymes',
            examples: 'Michaelis-Menten kinetics describes most enzyme behavior'
        });
        
        terms.set('competitive inhibition', {
            definition: 'A type of enzyme inhibition where the inhibitor competes with the substrate for binding to the active site. Can be overcome by increasing substrate concentration.',
            category: 'Protein Function & Enzymes',
            examples: 'Statins compete with HMG-CoA for binding to HMG-CoA reductase'
        });
        
        terms.set('cofactor', {
            definition: 'A non-protein chemical compound required for enzyme activity. Can be metal ions (Mg2+, Zn2+) or organic molecules (coenzymes like NAD+).',
            category: 'Protein Function & Enzymes',
            examples: 'Zinc in carbonic anhydrase, heme in cytochrome c oxidase'
        });
        
        terms.set('enzyme classification', {
            definition: 'Enzymes are classified into 6 main classes based on the type of reaction they catalyze: oxidoreductases, transferases, hydrolases, lyases, isomerases, and ligases.',
            category: 'Protein Function & Enzymes',
            examples: 'EC 3.4.21.1 is chymotrypsin (hydrolase that cleaves peptide bonds)'
        });
        
        terms.set('protein transport', {
            definition: 'Proteins that move molecules across cell membranes or throughout the body. Include channels, carriers, and transport proteins in blood.',
            category: 'Protein Function & Enzymes',
            examples: 'Hemoglobin (oxygen transport), sodium-potassium pump (ion transport)'
        });
        
        terms.set('structural protein', {
            definition: 'Proteins that provide mechanical support and shape to cells and tissues. Often form fibers, sheets, or scaffolds.',
            category: 'Protein Function & Enzymes',
            examples: 'Collagen (connective tissue), keratin (hair/nails), actin (cytoskeleton)'
        });
        
        terms.set('signaling protein', {
            definition: 'Proteins involved in cell communication, including hormones, receptors, and signal transduction molecules. Enable cells to respond to their environment.',
            category: 'Protein Function & Enzymes',
            examples: 'Insulin (hormone), G-protein coupled receptors, protein kinases'
        });
        
        // AlphaFold & Prediction
        terms.set('alphafold', {
            definition: 'An AI system developed by DeepMind that predicts protein structures with unprecedented accuracy using deep learning. AlphaFold has predicted structures for over 200 million proteins, revolutionizing structural biology.',
            category: 'AlphaFold & AI',
            examples: 'AlphaFold2 achieved ~90% accuracy on CASP14 competition, comparable to experimental methods'
        });
        
        terms.set('confidence score', {
            definition: 'A measure (0-100) indicating how reliable AlphaFold\'s structure prediction is for each residue. Scores >90 are very high confidence, 70-90 confident, 50-70 low confidence, <50 very low confidence.',
            category: 'AlphaFold & AI',
            examples: 'Well-structured regions typically have scores >90, flexible loops often <50'
        });
        
        terms.set('predicted structure', {
            definition: 'A protein structure determined by computational methods rather than experimental techniques like X-ray crystallography. Modern AI methods can achieve near-experimental accuracy.',
            category: 'AlphaFold & AI',
            examples: 'AlphaFold database contains predicted structures for 21 model organisms'
        });
        
        terms.set('structure prediction', {
            definition: 'The computational process of determining a protein\'s 3D structure from its amino acid sequence. This addresses the "protein folding problem" - one of biology\'s greatest challenges.',
            category: 'AlphaFold & AI',
            examples: 'Homology modeling, ab initio prediction, AI-based methods like AlphaFold'
        });
        
        terms.set('deep learning', {
            definition: 'A machine learning technique using neural networks with multiple layers, used by AlphaFold to predict protein structures. It can learn complex patterns from large datasets.',
            category: 'AlphaFold & AI',
            examples: 'Convolutional neural networks, attention mechanisms, transformer architectures'
        });
        
        terms.set('multiple sequence alignment', {
            definition: 'A comparison of three or more protein sequences to identify conserved regions and evolutionary relationships. AlphaFold uses MSAs to improve prediction accuracy.',
            category: 'AlphaFold & AI',
            examples: 'Evolutionary information helps predict which residues are structurally important'
        });
        
        terms.set('contact prediction', {
            definition: 'Computational prediction of which amino acid residues are close to each other in the folded protein structure. This information helps constrain structure prediction.',
            category: 'AlphaFold & AI',
            examples: 'Residues <8Å apart are considered in contact'
        });
        
        terms.set('protein folding problem', {
            definition: 'The challenge of predicting how a protein\'s amino acid sequence determines its 3D structure. Solved computationally by AlphaFold for many proteins.',
            category: 'AlphaFold & AI',
            examples: 'Levinthal\'s paradox: astronomical number of possible conformations'
        });
        
        // Experimental Methods
        terms.set('x-ray crystallography', {
            definition: 'An experimental technique that determines protein structure by analyzing the diffraction of X-rays through protein crystals.',
            category: 'Experimental Methods'
        });
        
        terms.set('nmr spectroscopy', {
            definition: 'Nuclear Magnetic Resonance spectroscopy, a technique used to determine protein structure in solution.',
            category: 'Experimental Methods'
        });
        
        terms.set('cryo-em', {
            definition: 'Cryo-electron microscopy, a technique that determines protein structure by imaging frozen samples with electron beams.',
            category: 'Experimental Methods'
        });
        
        terms.set('pdb', {
            definition: 'Protein Data Bank, the global repository for experimentally determined protein structures.',
            category: 'Experimental Methods'
        });
        
        // Amino Acid Properties
        terms.set('essential amino acids', {
            definition: 'Nine amino acids that cannot be synthesized by the human body and must be obtained from diet: histidine, isoleucine, leucine, lysine, methionine, phenylalanine, threonine, tryptophan, and valine.',
            category: 'Amino Acid Properties',
            examples: 'Complete proteins contain all essential amino acids'
        });
        
        terms.set('aromatic amino acids', {
            definition: 'Amino acids with aromatic ring structures: phenylalanine, tyrosine, and tryptophan. These residues often participate in π-π stacking interactions and protein-protein binding.',
            category: 'Amino Acid Properties',
            examples: 'Tryptophan fluorescence is used to study protein folding'
        });
        
        terms.set('basic amino acids', {
            definition: 'Positively charged amino acids at physiological pH: lysine, arginine, and histidine. These residues often bind to DNA, RNA, or negatively charged molecules.',
            category: 'Amino Acid Properties',
            examples: 'Histone proteins are rich in lysine and arginine for DNA binding'
        });
        
        terms.set('acidic amino acids', {
            definition: 'Negatively charged amino acids at physiological pH: aspartic acid and glutamic acid. Often found on protein surfaces and in active sites.',
            category: 'Amino Acid Properties',
            examples: 'Catalytic triads often contain aspartic acid or glutamic acid'
        });
        
        terms.set('branched-chain amino acids', {
            definition: 'Three amino acids with branched side chains: leucine, isoleucine, and valine. Important for muscle protein synthesis and energy metabolism.',
            category: 'Amino Acid Properties',
            examples: 'BCAA supplements are popular among athletes'
        });
        
        terms.set('sulfur-containing amino acids', {
            definition: 'Cysteine and methionine contain sulfur atoms. Cysteine can form disulfide bonds, while methionine is often the start of protein synthesis.',
            category: 'Amino Acid Properties',
            examples: 'Keratin is rich in cysteine, forming strong disulfide bonds in hair'
        });
        
        // Visualization & Structure Analysis
        terms.set('cartoon representation', {
            definition: 'A simplified 3D visualization showing protein secondary structures as ribbons (beta sheets) and coils (alpha helices). This representation emphasizes the protein\'s overall fold and secondary structure elements.',
            category: 'Visualization & Analysis',
            examples: 'Alpha helices appear as spirals, beta sheets as flat arrows'
        });
        
        terms.set('surface representation', {
            definition: 'A 3D visualization showing the molecular surface of a protein, representing its shape and accessible areas. Useful for understanding protein-protein interactions and binding sites.',
            category: 'Visualization & Analysis',
            examples: 'Enzyme active sites appear as pockets or clefts on the surface'
        });
        
        terms.set('stick representation', {
            definition: 'A detailed 3D visualization showing individual atoms as spheres connected by bonds as sticks. Provides atomic-level detail of protein structure.',
            category: 'Visualization & Analysis',
            examples: 'Useful for examining active sites, binding interactions, and chemical bonds'
        });
        
        terms.set('molecular surface', {
            definition: 'The boundary of a molecule that represents the space occupied by the protein and its electron cloud. Can be van der Waals surface or solvent-accessible surface.',
            category: 'Visualization & Analysis',
            examples: 'Solvent-accessible surface shows where water molecules can reach'
        });
        
        terms.set('ramachandran plot', {
            definition: 'A plot of phi and psi backbone dihedral angles that shows which conformations are sterically allowed for amino acids. Used to validate protein structures.',
            category: 'Visualization & Analysis',
            examples: 'Alpha helices and beta sheets occupy distinct regions of the plot'
        });
        
        terms.set('b-factor', {
            definition: 'A measure of atomic displacement or flexibility in protein structures. High B-factors indicate mobile or disordered regions, while low B-factors indicate rigid areas.',
            category: 'Visualization & Analysis',
            examples: 'Active site loops often have high B-factors due to flexibility'
        });
        
        terms.set('structure alignment', {
            definition: 'The process of comparing two or more protein structures to identify similarities and differences. Used to study evolutionary relationships and functional conservation.',
            category: 'Visualization & Analysis',
            examples: 'RMSD (root mean square deviation) measures structural similarity'
        });
        
        // Bioinformatics & Databases
        terms.set('uniprot', {
            definition: 'A comprehensive database of protein sequences and functional information, providing unique identifiers for proteins. Contains over 200 million protein sequences from all domains of life.',
            category: 'Bioinformatics & Databases',
            examples: 'UniProt ID P69905 corresponds to human hemoglobin alpha chain'
        });
        
        terms.set('sequence alignment', {
            definition: 'The process of comparing protein sequences to identify similarities and evolutionary relationships. Can be pairwise (two sequences) or multiple (many sequences).',
            category: 'Bioinformatics & Databases',
            examples: 'BLAST searches align query sequences against databases'
        });
        
        terms.set('homology', {
            definition: 'Similarity between proteins due to shared evolutionary origin, often indicating similar structure and function. Homologous proteins evolved from a common ancestor.',
            category: 'Bioinformatics & Databases',
            examples: 'Human and mouse insulin are homologous proteins'
        });
        
        terms.set('conservation', {
            definition: 'The degree to which amino acid positions remain unchanged across related proteins, indicating functional importance. Highly conserved residues are often critical for function.',
            category: 'Bioinformatics & Databases',
            examples: 'Active site residues in enzymes are typically highly conserved'
        });
        
        terms.set('phylogenetic tree', {
            definition: 'A branching diagram showing evolutionary relationships between proteins or organisms based on sequence or structural similarities.',
            category: 'Bioinformatics & Databases',
            examples: 'Protein families can be organized into phylogenetic trees'
        });
        
        terms.set('protein family', {
            definition: 'A group of proteins that share common evolutionary origin, similar sequences, and often similar functions. Organized hierarchically into superfamilies, families, and subfamilies.',
            category: 'Bioinformatics & Databases',
            examples: 'Immunoglobulin superfamily, kinase family, globin family'
        });
        
        terms.set('gene ontology', {
            definition: 'A standardized vocabulary for describing protein functions in terms of biological processes, molecular functions, and cellular components.',
            category: 'Bioinformatics & Databases',
            examples: 'GO:0003824 describes catalytic activity'
        });
        
        terms.set('protein disorder', {
            definition: 'Regions of proteins that lack stable secondary or tertiary structure under physiological conditions. These intrinsically disordered regions often have important regulatory functions.',
            category: 'Bioinformatics & Databases',
            examples: 'Many transcription factors contain disordered activation domains'
        });
        
        // Disease & Medicine
        terms.set('protein misfolding', {
            definition: 'The process where proteins adopt incorrect three-dimensional structures, often leading to loss of function or toxic aggregation. Associated with many diseases.',
            category: 'Disease & Medicine',
            examples: 'Alzheimer\'s (amyloid plaques), Parkinson\'s (α-synuclein), prion diseases'
        });
        
        terms.set('drug target', {
            definition: 'A protein whose activity can be modulated by drugs to treat disease. Most drugs work by binding to and altering protein function.',
            category: 'Disease & Medicine',
            examples: 'Enzymes (aspirin targets COX), receptors (beta-blockers), ion channels'
        });
        
        terms.set('therapeutic protein', {
            definition: 'Proteins used as medicines to treat diseases. Can be naturally occurring proteins or engineered variants with improved properties.',
            category: 'Disease & Medicine',
            examples: 'Insulin (diabetes), antibodies (cancer), growth hormone (growth disorders)'
        });
        
        terms.set('biomarker', {
            definition: 'A protein whose presence, absence, or concentration indicates a biological state or disease condition. Used for diagnosis, prognosis, and monitoring treatment.',
            category: 'Disease & Medicine',
            examples: 'Troponin (heart attack), PSA (prostate cancer), HbA1c (diabetes control)'
        });
        
        return terms;
    }

    /**
     * Create glossary modal
     */
    createGlossaryModal() {
        const modal = document.createElement('div');
        modal.id = 'glossary-modal';
        modal.className = 'educational-modal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            justify-content: center;
            align-items: center;
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="
                background: white;
                padding: 2rem;
                border-radius: 8px;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                margin: 20px;
            ">
                <div class="modal-header" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 1rem;
                ">
                    <h2 style="margin: 0;">Protein Structure Glossary</h2>
                    <button class="modal-close" onclick="document.getElementById('glossary-modal').remove()" style="
                        background: #ef4444 !important;
                        color: white !important;
                        border: none !important;
                        font-size: 18px !important;
                        cursor: pointer !important;
                        width: 30px !important;
                        height: 30px !important;
                        border-radius: 50% !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        font-weight: bold !important;
                    ">×</button>
                </div>
                <div id="glossary-content" class="glossary-content">
                    <!-- Terms will be populated here -->
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.populateGlossary();
        
        // Add multiple ways to close the modal
        const closeButton = modal.querySelector('.modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                modal.remove();
            });
        }
        
        // Close on click outside modal content
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    /**
     * Populate glossary with terms
     */
    populateGlossary() {
        const glossaryContent = document.getElementById('glossary-content');
        if (!glossaryContent) return;
        
        // Add search functionality
        const searchContainer = document.createElement('div');
        searchContainer.style.cssText = `
            margin-bottom: 1.5rem;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 8px;
        `;
        
        searchContainer.innerHTML = `
            <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem;">
                <input type="text" id="glossary-search" placeholder="Search terms..." style="
                    flex: 1;
                    padding: 0.5rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                ">
                <select id="category-filter" style="
                    padding: 0.5rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                ">
                    <option value="">All Categories</option>
                </select>
            </div>
            <div style="font-size: 14px; color: #666;">
                <strong>${this.glossaryTerms.size}</strong> terms available
            </div>
        `;
        
        glossaryContent.appendChild(searchContainer);
        
        // Populate category filter
        const categories = [...new Set(Array.from(this.glossaryTerms.values()).map(term => term.category))].sort();
        const categoryFilter = searchContainer.querySelector('#category-filter');
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
        
        // Create terms container
        const termsContainer = document.createElement('div');
        termsContainer.id = 'terms-container';
        glossaryContent.appendChild(termsContainer);
        
        // Initial population
        this.renderTerms();
        
        // Add search and filter functionality
        const searchInput = searchContainer.querySelector('#glossary-search');
        searchInput.addEventListener('input', () => this.renderTerms());
        categoryFilter.addEventListener('change', () => this.renderTerms());
    }
    
    /**
     * Render filtered terms
     */
    renderTerms() {
        const termsContainer = document.getElementById('terms-container');
        const searchInput = document.getElementById('glossary-search');
        const categoryFilter = document.getElementById('category-filter');
        
        if (!termsContainer || !searchInput || !categoryFilter) return;
        
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value;
        
        // Filter terms
        const filteredTerms = Array.from(this.glossaryTerms.entries()).filter(([term, data]) => {
            const matchesSearch = term.toLowerCase().includes(searchTerm) || 
                                data.definition.toLowerCase().includes(searchTerm);
            const matchesCategory = !selectedCategory || data.category === selectedCategory;
            return matchesSearch && matchesCategory;
        }).sort(([a], [b]) => a.localeCompare(b));
        
        // Group by category
        const groupedTerms = {};
        filteredTerms.forEach(([term, data]) => {
            if (!groupedTerms[data.category]) {
                groupedTerms[data.category] = [];
            }
            groupedTerms[data.category].push([term, data]);
        });
        
        // Render grouped terms
        const categoryOrder = [
            'Basic Concepts',
            'Amino Acid Properties',
            'Primary Structure', 
            'Secondary Structure',
            'Tertiary Structure',
            'Quaternary Structure',
            'Chemical Interactions',
            'Protein Properties',
            'Protein Function & Enzymes',
            'AlphaFold & AI',
            'Experimental Methods',
            'Visualization & Analysis',
            'Bioinformatics & Databases',
            'Disease & Medicine'
        ];
        
        let html = '';
        
        if (filteredTerms.length === 0) {
            html = `
                <div style="text-align: center; padding: 2rem; color: #666;">
                    <p>No terms found matching your search.</p>
                </div>
            `;
        } else {
            categoryOrder.forEach(category => {
                if (groupedTerms[category]) {
                    html += `
                        <div style="margin-bottom: 2rem;">
                            <h3 style="
                                color: #007bff; 
                                border-bottom: 2px solid #007bff; 
                                padding-bottom: 0.5rem; 
                                margin-bottom: 1rem;
                                font-size: 1.2rem;
                            ">${category}</h3>
                            ${groupedTerms[category].map(([term, data]) => `
                                <div style="
                                    margin-bottom: 1rem; 
                                    padding: 1rem; 
                                    border: 1px solid #e9ecef; 
                                    border-radius: 6px;
                                    background: #fafafa;
                                ">
                                    <h4 style="
                                        margin: 0 0 0.5rem 0; 
                                        color: #333;
                                        font-size: 1.1rem;
                                    ">${this.capitalizeWords(term)}</h4>
                                    <p style="
                                        margin: 0 0 ${data.examples ? '0.5rem' : '0'} 0; 
                                        color: #555;
                                        line-height: 1.5;
                                    ">${data.definition}</p>
                                    ${data.examples ? `
                                        <div style="
                                            margin-top: 0.5rem;
                                            padding: 0.5rem;
                                            background: #e8f4f8;
                                            border-radius: 4px;
                                            border-left: 3px solid #007bff;
                                        ">
                                            <strong style="color: #007bff; font-size: 0.9rem;">Examples:</strong>
                                            <span style="color: #555; font-size: 0.9rem; margin-left: 0.5rem;">${data.examples}</span>
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    `;
                }
            });
        }
        
        termsContainer.innerHTML = html;
        
        // Update count
        const countElement = document.querySelector('#glossary-content .glossary-content div:first-child div:last-child');
        if (countElement) {
            countElement.innerHTML = `<strong>${filteredTerms.length}</strong> of <strong>${this.glossaryTerms.size}</strong> terms shown`;
        }
    }

    /**
     * Setup global tooltip system
     */
    setupGlobalTooltipSystem() {
        try {
            // Create tooltip container
            const tooltipContainer = document.createElement('div');
            tooltipContainer.id = 'educational-tooltip';
            tooltipContainer.style.cssText = `
                display: none;
                position: absolute;
                background: #333;
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 14px;
                max-width: 300px;
                z-index: 1000;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            `;
            document.body.appendChild(tooltipContainer);
            
            // Setup event delegation for tooltip triggers
            document.addEventListener('mouseenter', (e) => {
                if (e.target.hasAttribute('data-edu-tooltip')) {
                    clearTimeout(this.hideTimeout);
                    this.showEducationalTooltip(e.target, e.target.getAttribute('data-edu-tooltip'));
                }
            }, true);
            
            document.addEventListener('mouseleave', (e) => {
                if (e.target.hasAttribute('data-edu-tooltip')) {
                    this.hideTimeout = setTimeout(() => {
                        this.hideEducationalTooltip();
                    }, 300);
                }
            }, true);
        } catch (error) {
            console.error('Error setting up tooltip system:', error);
        }
    }

    /**
     * Show educational tooltip
     */
    showEducationalTooltip(trigger, contentKey) {
        const tooltip = document.getElementById('educational-tooltip');
        if (!tooltip) return;
        
        const content = this.getTooltipContent(contentKey);
        if (!content) return;
        
        tooltip.innerHTML = `<strong>${content.title}</strong><br>${content.description}`;
        
        // Position tooltip
        const rect = trigger.getBoundingClientRect();
        tooltip.style.display = 'block';
        tooltip.style.left = (rect.left + window.scrollX) + 'px';
        tooltip.style.top = (rect.bottom + window.scrollY + 5) + 'px';
    }

    /**
     * Hide educational tooltip
     */
    hideEducationalTooltip() {
        const tooltip = document.getElementById('educational-tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }

    /**
     * Get tooltip content by key
     */
    getTooltipContent(key) {
        const tooltipContents = {
            'confidence-score': {
                title: 'Confidence Score',
                description: 'Indicates how reliable AlphaFold\'s prediction is for each part of the protein (0-100%).'
            },
            'alpha-helix': {
                title: 'Alpha Helix',
                description: 'A spiral protein structure stabilized by hydrogen bonds.'
            },
            'beta-sheet': {
                title: 'Beta Sheet',
                description: 'Extended protein strands arranged side-by-side in a sheet-like structure.'
            },
            'protein-visualization': {
                title: 'Protein Visualization',
                description: 'Different ways to display protein structures (cartoon, surface, stick).'
            }
        };
        
        return tooltipContents[key] || null;
    }

    /**
     * Add educational buttons to the interface
     */
    addEducationalButtons() {
        try {
            // Add help button to header
            const header = document.querySelector('header');
            if (header) {
                const helpButton = document.createElement('button');
                helpButton.id = 'help-button';
                helpButton.innerHTML = '? Help';
                helpButton.style.cssText = `
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: rgba(255,255,255,0.9) !important;
                    color: #1a365d !important;
                    border: 2px solid rgba(255,255,255,0.8) !important;
                    padding: 10px 18px !important;
                    border-radius: 25px !important;
                    cursor: pointer !important;
                    font-weight: bold !important;
                    font-size: 14px !important;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
                    z-index: 1000 !important;
                `;
                helpButton.onclick = () => this.showHelpOverlay();
                helpButton.onmouseover = () => {
                    helpButton.style.background = 'rgba(255,255,255,1) !important';
                    helpButton.style.transform = 'scale(1.05) !important';
                };
                helpButton.onmouseout = () => {
                    helpButton.style.background = 'rgba(255,255,255,0.9) !important';
                    helpButton.style.transform = 'scale(1) !important';
                };
                header.style.position = 'relative';
                header.appendChild(helpButton);
            }
            
            // Add glossary button
            const main = document.querySelector('main');
            if (main) {
                const glossaryButton = document.createElement('button');
                glossaryButton.id = 'glossary-button';
                glossaryButton.innerHTML = '📚 Glossary';
                glossaryButton.style.cssText = `
                    position: fixed !important;
                    bottom: 20px !important;
                    right: 20px !important;
                    background: #007bff !important;
                    color: white !important;
                    border: none !important;
                    padding: 15px 25px !important;
                    border-radius: 30px !important;
                    cursor: pointer !important;
                    box-shadow: 0 4px 15px rgba(0,123,255,0.3) !important;
                    z-index: 1000 !important;
                    font-size: 16px !important;
                    font-weight: 600 !important;
                    transition: all 0.3s ease !important;
                `;
                glossaryButton.onclick = () => this.showGlossary();
                glossaryButton.onmouseover = () => {
                    glossaryButton.style.background = '#0056b3 !important';
                    glossaryButton.style.transform = 'scale(1.05) !important';
                };
                glossaryButton.onmouseout = () => {
                    glossaryButton.style.background = '#007bff !important';
                    glossaryButton.style.transform = 'scale(1) !important';
                };
                document.body.appendChild(glossaryButton);
            }
        } catch (error) {
            console.error('Error adding educational buttons:', error);
        }
    }

    /**
     * Show glossary modal
     */
    showGlossary() {
        // Remove any existing modal first
        const existingModal = document.getElementById('glossary-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create a new modal
        this.createGlossaryModal();
        
        // Show the modal
        const modal = document.getElementById('glossary-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    /**
     * Show help overlay
     */
    showHelpOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'help-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1001;
            display: flex;
            justify-content: center;
            align-items: center;
        `;
        
        overlay.innerHTML = `
            <div style="
                background: white;
                padding: 2rem;
                border-radius: 8px;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                margin: 20px;
            ">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 1rem;
                ">
                    <h2 style="margin: 0;">How to Use AlphaView</h2>
                    <button onclick="this.closest('.help-overlay').remove()" style="
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #666;
                    ">×</button>
                </div>
                <div>
                    <h3>🔍 Searching for Proteins</h3>
                    <ul>
                        <li>Enter a protein name (e.g., "hemoglobin") or UniProt ID (e.g., "P69905")</li>
                        <li>Select from the search results to load protein information</li>
                    </ul>
                    
                    <h3>📊 Understanding Confidence Scores</h3>
                    <ul>
                        <li><span style="color: #0053D6;">Blue (90-100%)</span>: Very high confidence</li>
                        <li><span style="color: #65CBF3;">Light blue (70-90%)</span>: Confident</li>
                        <li><span style="color: #FFDB13;">Yellow (50-70%)</span>: Low confidence</li>
                        <li><span style="color: #FF7D45;">Orange (0-50%)</span>: Very low confidence</li>
                    </ul>
                    
                    <h3>🧬 Exploring 3D Structures</h3>
                    <ul>
                        <li><strong>Mouse controls:</strong> Left-click drag to rotate, scroll to zoom</li>
                        <li><strong>Styles:</strong> Switch between cartoon, surface, and stick representations</li>
                    </ul>
                    
                    <div style="margin-top: 2rem; text-align: center;">
                        <button onclick="this.closest('.help-overlay').remove()" style="
                            background: #007bff;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 4px;
                            cursor: pointer;
                        ">Got it!</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        try {
            document.addEventListener('keydown', (e) => {
                // Escape to close modals
                if (e.key === 'Escape') {
                    // Remove all educational modals and overlays
                    const modals = document.querySelectorAll('.educational-modal, .help-overlay');
                    modals.forEach(modal => {
                        modal.remove();
                    });
                    
                    // Also remove by ID in case class selector doesn't work
                    const glossaryModal = document.getElementById('glossary-modal');
                    if (glossaryModal) {
                        glossaryModal.remove();
                    }
                }
            });
        } catch (error) {
            console.error('Error setting up keyboard shortcuts:', error);
        }
    }

    /**
     * Capitalize words
     */
    capitalizeWords(str) {
        return str.replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Initialize educational features after DOM is ready
     */
    static initialize() {
        if (typeof window !== 'undefined') {
            try {
                console.log('Initializing educational component...');
                window.educationalComponent = new EducationalComponent();
                console.log('Educational component initialized globally');
                
                // Force button creation after a delay to ensure DOM is ready
                setTimeout(() => {
                    if (window.educationalComponent) {
                        console.log('Re-adding educational buttons...');
                        window.educationalComponent.addEducationalButtons();
                    }
                }, 1000);
            } catch (error) {
                console.error('Error initializing educational component:', error);
            }
        }
    }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EducationalComponent;
}