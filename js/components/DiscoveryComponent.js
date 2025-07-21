/**
 * Discovery component for helping users find interesting proteins to explore
 */
class DiscoveryComponent {
    constructor(searchComponent) {
        this.searchComponent = searchComponent;
        this.currentCategory = 'essential';
        this.proteinDatabase = this.initializeProteinDatabase();
        
        this.initializeDiscoverySection();
    }

    /**
     * Initialize the protein database with interesting proteins categorized by type
     */
    initializeProteinDatabase() {
        return {
            essential: [
                {
                    name: "Hemoglobin",
                    emoji: "🩸",
                    description: "The protein that carries oxygen in your blood. Without it, you couldn't breathe!",
                    funFact: "One drop of blood contains 250 million hemoglobin molecules!",
                    searchTerm: "hemoglobin",
                    uniprotId: "P69905"
                },
                {
                    name: "Insulin",
                    emoji: "🍯",
                    description: "Controls blood sugar levels and helps your body use energy from food.",
                    funFact: "Discovered in 1922, insulin was the first protein hormone to be identified!",
                    searchTerm: "insulin",
                    uniprotId: "P01308"
                },
                {
                    name: "Collagen",
                    emoji: "💪",
                    description: "The most abundant protein in your body - it's in your skin, bones, and tendons!",
                    funFact: "Collagen makes up about 30% of all protein in the human body!",
                    searchTerm: "collagen",
                    uniprotId: "P02452"
                },
                {
                    name: "Myosin",
                    emoji: "🏃",
                    description: "The motor protein that makes your muscles contract and move.",
                    funFact: "Myosin can 'walk' along other proteins, taking steps just 10 nanometers long!",
                    searchTerm: "myosin",
                    uniprotId: "P35579"
                }
            ],
            medical: [
                {
                    name: "p53 Tumor Suppressor",
                    emoji: "🛡️",
                    description: "The 'guardian of the genome' that prevents cancer by stopping damaged cells.",
                    funFact: "p53 is mutated in over 50% of human cancers - it's a crucial cancer fighter!",
                    searchTerm: "p53",
                    uniprotId: "P04637"
                },
                {
                    name: "Antibody (IgG)",
                    emoji: "🦠",
                    description: "Your immune system's guided missiles that target and neutralize invaders.",
                    funFact: "Your body can make over 10 billion different antibodies!",
                    searchTerm: "immunoglobulin",
                    uniprotId: "P01857"
                },
                {
                    name: "Lysozyme",
                    emoji: "😢",
                    description: "Found in tears and saliva, this enzyme breaks down bacterial cell walls.",
                    funFact: "Lysozyme was discovered by Alexander Fleming (who also discovered penicillin)!",
                    searchTerm: "lysozyme",
                    uniprotId: "P61626"
                },
                {
                    name: "Pepsin",
                    emoji: "🍽️",
                    description: "The stomach enzyme that breaks down proteins in your food.",
                    funFact: "Pepsin works best in the super-acidic environment of your stomach (pH 1.5-2)!",
                    searchTerm: "pepsin",
                    uniprotId: "P00790"
                }
            ],
            unique: [
                {
                    name: "Green Fluorescent Protein",
                    emoji: "🌟",
                    description: "A jellyfish protein that glows green - revolutionized biological research!",
                    funFact: "GFP won the 2008 Nobel Prize and is used to make glowing mice and fish!",
                    searchTerm: "green fluorescent protein",
                    uniprotId: "P42212"
                },
                {
                    name: "Spider Silk Protein",
                    emoji: "🕷️",
                    description: "Stronger than steel by weight, this protein creates spider webs.",
                    funFact: "Spider silk is 5 times stronger than steel and more elastic than rubber!",
                    searchTerm: "fibroin",
                    uniprotId: "P46804"
                },
                {
                    name: "Antifreeze Protein",
                    emoji: "🧊",
                    description: "Keeps Arctic fish from freezing solid in icy waters.",
                    funFact: "These proteins can lower the freezing point of blood by several degrees!",
                    searchTerm: "antifreeze protein",
                    uniprotId: "P01169"
                },
                {
                    name: "Luciferase",
                    emoji: "✨",
                    description: "The enzyme that makes fireflies glow in the dark.",
                    funFact: "Luciferase is so efficient that it produces light with almost no heat!",
                    searchTerm: "luciferase",
                    uniprotId: "P08659"
                }
            ]
        };
    }

    /**
     * Initialize the discovery section with event listeners and initial content
     */
    initializeDiscoverySection() {
        this.setupCategoryTabs();
        this.renderProteinCards('essential');
        this.setupRandomButton();
    }

    /**
     * Setup category tab functionality
     */
    setupCategoryTabs() {
        const tabs = document.querySelectorAll('.category-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                
                if (category === 'random') {
                    this.showRandomProtein();
                } else {
                    this.switchCategory(category);
                }
            });
        });
    }

    /**
     * Switch to a different category
     */
    switchCategory(category) {
        // Update active tab
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        
        // Update current category and render cards
        this.currentCategory = category;
        this.renderProteinCards(category);
    }

    /**
     * Render protein cards for a specific category
     */
    renderProteinCards(category) {
        const container = document.getElementById('protein-cards');
        const proteins = this.proteinDatabase[category] || [];
        
        container.innerHTML = proteins.map(protein => `
            <div class="protein-card" onclick="discoveryComponent.searchProtein('${protein.searchTerm}')">
                <span class="protein-card-emoji">${protein.emoji}</span>
                <h3 class="protein-card-name">${protein.name}</h3>
                <p class="protein-card-description">${protein.description}</p>
                <div class="protein-card-fun-fact">
                    💡 Fun Fact: ${protein.funFact}
                </div>
                <button class="protein-card-search" onclick="event.stopPropagation(); discoveryComponent.searchProtein('${protein.searchTerm}')">
                    Explore ${protein.name}
                </button>
            </div>
        `).join('');
        
        // Add animation
        setTimeout(() => {
            document.querySelectorAll('.protein-card').forEach((card, index) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.style.transition = 'all 0.5s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 100);
            });
        }, 50);
    }

    /**
     * Setup random protein button
     */
    setupRandomButton() {
        // Add random button to the random tab content
        const randomTab = document.querySelector('[data-category="random"]');
        if (randomTab) {
            randomTab.addEventListener('click', () => {
                this.showRandomProtein();
            });
        }
    }

    /**
     * Show a random protein from all categories
     */
    showRandomProtein() {
        // Update active tab
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector('[data-category="random"]').classList.add('active');
        
        // Get all proteins from all categories
        const allProteins = [];
        Object.values(this.proteinDatabase).forEach(categoryProteins => {
            allProteins.push(...categoryProteins);
        });
        
        // Select random protein
        const randomProtein = allProteins[Math.floor(Math.random() * allProteins.length)];
        
        // Show random protein card with special styling
        const container = document.getElementById('protein-cards');
        container.innerHTML = `
            <div class="protein-card" style="grid-column: 1 / -1; max-width: 500px; margin: 0 auto; border: 3px solid #ff6b35;">
                <span class="protein-card-emoji" style="font-size: 3rem;">${randomProtein.emoji}</span>
                <h3 class="protein-card-name" style="font-size: 1.5rem;">🎲 Random Discovery: ${randomProtein.name}</h3>
                <p class="protein-card-description">${randomProtein.description}</p>
                <div class="protein-card-fun-fact">
                    💡 Fun Fact: ${randomProtein.funFact}
                </div>
                <button class="protein-card-search" onclick="discoveryComponent.searchProtein('${randomProtein.searchTerm}')" style="background: linear-gradient(135deg, #ff6b35, #f093fb);">
                    Explore ${randomProtein.name}
                </button>
                <button class="random-button" onclick="discoveryComponent.showRandomProtein()" style="margin-top: 1rem;">
                    🎲 Another Random Protein!
                </button>
            </div>
        `;
        
        // Add special animation for random protein
        const card = container.querySelector('.protein-card');
        card.style.opacity = '0';
        card.style.transform = 'scale(0.8) rotate(-5deg)';
        setTimeout(() => {
            card.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            card.style.opacity = '1';
            card.style.transform = 'scale(1) rotate(0deg)';
        }, 100);
    }

    /**
     * Search for a protein using the search component
     */
    async searchProtein(searchTerm) {
        // Scroll to search section
        document.getElementById('search-section').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
        
        // Fill search input
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = searchTerm;
            
            // Add visual feedback
            searchInput.style.background = 'linear-gradient(135deg, #f0f9ff, #e0f2fe)';
            searchInput.style.borderColor = '#0066ff';
            
            setTimeout(() => {
                searchInput.style.background = '';
                searchInput.style.borderColor = '';
            }, 2000);
        }
        
        // Trigger search
        if (this.searchComponent) {
            try {
                await this.searchComponent.searchProtein(searchTerm);
            } catch (error) {
                console.error('Error searching protein:', error);
            }
        }
    }

    /**
     * Add educational tooltips to protein cards
     */
    addEducationalTooltips() {
        // This could be expanded to add more educational content
        const cards = document.querySelectorAll('.protein-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });
    }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiscoveryComponent;
}