/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI } from '@google/genai';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';

// --- Interfaces ---
interface NewAlternativeSource {
  name: string;
  link: string;
}

interface NewPremiumToolSource {
  name: string;
  use: string;
  alternatives: NewAlternativeSource[];
  limitations?: string;
  description?: string;
  tags?: string[];
  platform?: ('Web' | 'Windows' | 'Linux' | 'Mobile' | 'macOS')[];
  priceType?: 'Free' | 'Cheap' | 'Paid';
}

interface NewCategorySource {
  category: string;
  tools: NewPremiumToolSource[];
}

interface NewRawData {
  categories: NewCategorySource[];
}

// Unified Tool interface for the app
interface Tool {
  id: string;
  name: string;
  category: string;
  useCase: string;
  link: string;
  premiumToolRefName?: string;
  limitations: string;
  description: string;
  // Enhanced details
  detailedDescription: string;
  features: string[];
  pros: string[];
  cons: string[];
  userRating: number; // e.g., 0-5
  gallery: string[]; // URLs for screenshots/gallery images
  tags: string[];
  platform: ('Web' | 'Windows' | 'Linux' | 'Mobile' | 'macOS')[];
  priceType: 'Free' | 'Cheap' | 'Paid';
  alternatives?: { name: string; link: string; type: 'Free' | 'Cheap' | 'Open Source' }[];
}

// --- Combined Sample Data ---
const existingCategories: NewCategorySource[] = [
    {
      "category": "AI Tools",
      "tools": [
        {
          "name": "ChatGPT Plus",
          "use": "Advanced AI chat assistant",
          "alternatives": [
            { "name": "ChatGPT Free (GPT-3.5)", "link": "https://chat.openai.com/" },
            { "name": "Claude.ai", "link": "https://claude.ai/" },
            { "name": "Perplexity AI", "link": "https://www.perplexity.ai/" },
            { "name": "Gemini (Google)", "link": "https://gemini.google.com/" }
          ]
        },
        {
          "name": "GitHub Copilot",
          "use": "AI-powered code completion",
          "alternatives": [
            { "name": "Codeium (Free)", "link": "https://codeium.com/" },
            { "name": "Tabnine (Free Tier)", "link": "https://www.tabnine.com/" }
          ]
        },
        {
          "name": "Midjourney",
          "use": "AI Image Generation",
          "alternatives": [
            { "name": "Stable Diffusion (Local/Web UI)", "link": "https://stablediffusion.com/" },
            { "name": "Leonardo.Ai (Free Tier)", "link": "https://leonardo.ai/" },
            { "name": "Bing Image Creator (Free)", "link": "https://www.bing.com/create" }
          ]
        }
      ]
    },
    {
      "category": "Office Tools",
      "tools": [
        {
          "name": "Microsoft Office Suite (Word, Excel, PowerPoint)",
          "use": "Document creation, spreadsheets, presentations",
          "alternatives": [
            { "name": "Google Docs/Sheets/Slides (Free)", "link": "https://docs.google.com/" },
            { "name": "LibreOffice (Free, Open Source)", "link": "https://www.libreoffice.org/" },
            { "name": "Zoho Docs (Free Tier)", "link": "https://www.zoho.com/docs/" }
          ]
        },
        {
          "name": "Grammarly Premium",
          "use": "Grammar and writing assistant",
          "alternatives": [
            { "name": "Grammarly (Free Tier)", "link": "https://www.grammarly.com/" },
            { "name": "LanguageTool (Free, Open Source)", "link": "https://languagetool.org/" },
            { "name": "Hemingway Editor (Web, Free)", "link": "https://hemingwayapp.com/" }
          ]
        }
      ]
    },
    {
      "category": "Design Tools",
      "tools": [
        {
          "name": "Adobe Photoshop",
          "use": "Advanced image editing & graphics",
          "alternatives": [
            { "name": "Photopea (Web, Free)", "link": "https://www.photopea.com/" },
            { "name": "GIMP (Free, Open Source)", "link": "https://www.gimp.org/" },
            { "name": "Krita (Free, Open Source)", "link": "https://krita.org/"}
          ]
        },
        {
          "name": "Adobe Illustrator",
          "use": "Vector graphics and illustration",
          "alternatives": [
              { "name": "Inkscape (Free, Open Source)", "link": "https://inkscape.org/"},
              { "name": "Vectr (Web, Free)", "link": "https://vectr.com/"}
          ]
        },
        {
          "name": "Canva Pro",
          "use": "Easy design and content creation",
          "alternatives": [
            { "name": "Canva (Free Tier)", "link": "https://www.canva.com/" },
            { "name": "Figma (Free Tier for Individuals)", "link": "https://www.figma.com/" },
            { "name": "Adobe Express (Free Tier)", "link": "https://www.adobe.com/express/" }
          ]
        }
      ]
    },
    {
        "category": "Video Editing",
        "tools": [
            {
                "name": "Adobe Premiere Pro",
                "use": "Professional video editing",
                "alternatives": [
                    { "name": "DaVinci Resolve (Free Version)", "link": "https://www.blackmagicdesign.com/products/davinciresolve/" },
                    { "name": "CapCut (Free, Mobile/Desktop)", "link": "https://www.capcut.com/"},
                    { "name": "OpenShot (Free, Open Source)", "link": "https://www.openshot.org/"}
                ]
            }
        ]
    },
    {
      "category": "Hosting & Deployment",
      "tools": [
        {
          "name": "Netlify Pro / Vercel Pro",
          "use": "Web app and static site hosting",
          "alternatives": [
            { "name": "Netlify (Free Tier)", "link": "https://www.netlify.com/" },
            { "name": "Vercel (Free Tier for Hobbyists)", "link": "https://vercel.com/" },
            { "name": "GitHub Pages (Free)", "link": "https://pages.github.com/" },
            { "name": "Cloudflare Pages (Free Tier)", "link": "https://pages.cloudflare.com/" },
            { "name": "Render (Free Tier for Static Sites)", "link": "https://render.com/" }
          ]
        }
      ]
    },
    {
      "category": "CSE Academic",
      "tools": [
        {
          "name": "MATLAB (Paid)",
          "use": "Numerical computing, simulation",
          "alternatives": [
            { "name": "GNU Octave (Free, Open Source)", "link": "https://www.gnu.org/software/octave/" },
            { "name": "SciPy/NumPy (Python, Free)", "link": "https://scipy.org/" }
          ]
        },
        {
          "name": "Generic Paid Learning Platforms",
          "use": "Learn DSA, Compilers, OS etc.",
          "alternatives": [
            { "name": "VisualAlgo (DSA Visualization)", "link": "https://visualgo.net/" },
            { "name": "JFLAP (Automata/Compilers)", "link": "http://www.jflap.org/" },
            { "name": "NPTEL (Courses)", "link": "https://nptel.ac.in/" },
            { "name": "GeeksforGeeks (Articles & Practice)", "link": "https://www.geeksforgeeks.org/"}
          ]
        }
      ]
    },
    {
      "category": "VPN & Privacy",
      "tools": [
        {
          "name": "NordVPN / ExpressVPN (Paid)",
          "use": "Secure internet browsing & privacy",
          "alternatives": [
            { "name": "ProtonVPN (Free Tier)", "link": "https://protonvpn.com/free-vpn" },
            { "name": "Windscribe (Free Tier with data limit)", "link": "https://windscribe.com/" },
            { "name": "Cloudflare WARP (Free)", "link": "https://1.1.1.1/" }
          ]
        },
        {
          "name": "Dashlane / LastPass (Premium)",
          "use": "Password management",
          "alternatives": [
            { "name": "Bitwarden (Free, Open Source)", "link": "https://bitwarden.com/" },
            { "name": "KeePassXC (Free, Open Source, Offline)", "link": "https://keepassxc.org/" }
          ]
        }
      ]
    }
];

const additionalCategoriesData: { additional_categories: NewCategorySource[] } = {
  "additional_categories": [
    {
      "category": "Project & Professional Tools",
      "tools": [
        {
          "name": "Trello Premium",
          "use": "Task and project management",
          "alternatives": [
            { "name": "Trello Free", "link": "https://trello.com/" },
            { "name": "Notion (Free Tier)", "link": "https://www.notion.so/" },
            { "name": "ClickUp (Free Tier)", "link": "https://clickup.com/" }
          ]
        },
        {
          "name": "Figma Pro",
          "use": "UI/UX design and prototyping",
          "alternatives": [
            { "name": "Figma (Free Tier)", "link": "https://figma.com/" },
            { "name": "Penpot (Free, Open Source)", "link": "https://penpot.app/" }
          ]
        }
      ]
    },
    {
      "category": "CSE Real-Life Projects",
      "tools": [
        {
          "name": "Full Stack Project Hosting (Paid Tiers)",
          "use": "Host and test web apps",
          "alternatives": [
            { "name": "Render (Free Tier for Static/Web Services)", "link": "https://render.com/" },
            { "name": "Railway (Free Starter Plan)", "link": "https://railway.app/" },
            { "name": "Replit (Free Tier with limitations)", "link": "https://replit.com/" }
          ]
        },
        {
          "name": "Version Control and Collaboration (Paid Enterprise Features)",
          "use": "Code collaboration and version control",
          "alternatives": [
            { "name": "GitHub (Free for Public/Private Repos)", "link": "https://github.com/" },
            { "name": "GitLab (Free Tier with CI/CD)", "link": "https://gitlab.com/" },
            { "name": "Bitbucket (Free for Small Teams)", "link": "https://bitbucket.org/" }
          ]
        }
      ]
    },
    {
      "category": "CSE Semester Resources",
      "tools": [
        {
          "name": "Web Development Learning Platforms (Paid Bootcamps/Courses)",
          "use": "Learn HTML, CSS, JS, React, etc.",
          "alternatives": [
            { "name": "freeCodeCamp (Free)", "link": "https://www.freecodecamp.org/" },
            { "name": "The Odin Project (Free, Open Source)", "link": "https://www.theodinproject.com/" },
            { "name": "MDN Web Docs (Free Documentation)", "link": "https://developer.mozilla.org/"}
          ]
        },
        {
          "name": "Data Science & ML Learning (Paid Specializations)",
          "use": "Beginner to advanced ML concepts",
          "alternatives": [
            { "name": "Kaggle Learn (Free Courses)", "link": "https://www.kaggle.com/learn" },
            { "name": "Google AI Education (Free Resources)", "link": "https://ai.google/education/" },
            { "name": "fast.ai (Free Courses)", "link": "https://www.fast.ai/"}
          ]
        },
        {
          "name": "Cloud & DevOps Learning (Paid Certifications)",
          "use": "Learn Cloud platforms, CI/CD, Docker",
          "alternatives": [
            { "name": "KodeKloud (Some Free Labs)", "link": "https://kodekloud.com/"},
            { "name": "Play with Docker (Free Labs)", "link": "https://labs.play-with-docker.com/" },
            { "name": "AWS/Azure/GCP Free Tiers", "link": "https://aws.amazon.com/free/" }
          ]
        }
      ]
    }
  ]
};


const newJsonData: NewRawData = {
  categories: [...existingCategories, ...additionalCategoriesData.additional_categories]
};


// --- Data Transformation ---
const transformNewData = (rawData: NewRawData): Tool[] => {
  const allTools: Tool[] = [];
  let toolIdCounter = 0;

  rawData.categories.forEach(categorySource => {
    categorySource.tools.forEach(premiumToolSource => {
      premiumToolSource.alternatives.forEach(altSource => {
        toolIdCounter++;
        const toolName = altSource.name;
        let priceType: Tool['priceType'] = 'Free';
        const nameLower = toolName.toLowerCase();
        if (nameLower.includes("(paid)") || (nameLower.includes("pro") && !nameLower.includes("free") && !nameLower.includes("tier")) ) {
            priceType = 'Paid';
        } else if (nameLower.includes("tier") || nameLower.includes("cheap") || nameLower.includes("affordable") || nameLower.includes("limitations") || nameLower.includes("starter plan")) {
            priceType = 'Cheap';
        } else if (nameLower.includes("free") || nameLower.includes("open source")) {
            priceType = 'Free';
        }
        if (nameLower.includes("free") && !nameLower.includes("(paid)")) {
            priceType = 'Free';
        }

        // Placeholder data for new fields
        const randomRating = Math.floor(Math.random() * 3) + 3; // Random rating between 3 and 5

        allTools.push({
          id: `tool-${toolIdCounter}-${altSource.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          name: altSource.name,
          category: categorySource.category,
          useCase: premiumToolSource.use,
          link: altSource.link,
          premiumToolRefName: premiumToolSource.name,
          limitations: premiumToolSource.limitations || "Refer to the official website for details on limitations and usage tiers.",
          description: premiumToolSource.description || `${altSource.name} serves as a popular alternative for the use case of "${premiumToolSource.use}", commonly associated with ${premiumToolSource.name}.`,
          detailedDescription: `This is ${altSource.name}, a compelling alternative to ${premiumToolSource.name} for ${premiumToolSource.use}. It offers a robust set of functionalities designed to meet user needs in this area. Many users find it highly effective, especially considering its accessibility. Explore its official website to understand the full scope of its capabilities and how it might fit your specific requirements. (Note: This is a placeholder detailed description. More specific information will be added soon.)`,
          features: ["Core functionality for " + premiumToolSource.use, "User-friendly interface (placeholder)", "Good community support (placeholder)", "Regular updates (placeholder)"],
          pros: ["Cost-effective / Free to start (placeholder)", "Easy to get started (placeholder)", "Covers most common needs (placeholder)"],
          cons: ["May lack some advanced features of paid counterparts (placeholder)", "Certain limitations on free tier (if applicable) (placeholder)"],
          userRating: randomRating,
          gallery: ["https://via.placeholder.com/400x250/ ανάπτυξη?text=Screenshot+1", "https://via.placeholder.com/400x250/f0f0f0?text=Screenshot+2"], // Placeholder images
          tags: premiumToolSource.tags || [categorySource.category, priceType, "Alternative", ...altSource.name.toLowerCase().split(/\s|\(|\)/).filter(tag => tag.length > 2 && !["free", "tier", "for", "and", "with"].includes(tag) )],
          platform: premiumToolSource.platform || ['Web', 'Windows', 'macOS', 'Linux', 'Mobile'],
          priceType: priceType,
          alternatives: []
        });
      });
    });
  });
  return allTools;
};

const toolsData: Tool[] = transformNewData(newJsonData);

const CATEGORIES = Array.from(new Set(toolsData.map(tool => tool.category))).sort();
const PRICE_TYPES: ('All' | Tool['priceType'])[] = ['All', 'Free', 'Cheap'];
const PLATFORMS: Tool['platform'][0][] = ['Web', 'Windows', 'Linux', 'macOS', 'Mobile'];

const getCategoryClass = (category: string) => {
  return `category-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-')}`;
};

const getCategoryIcon = (category: string): string => {
    const catLower = category.toLowerCase();
    if (catLower.includes('ai')) return 'fa-solid fa-robot';
    if (catLower.includes('office')) return 'fa-solid fa-file-word';
    if (catLower.includes('design')) return 'fa-solid fa-palette';
    if (catLower.includes('video')) return 'fa-solid fa-film';
    if (catLower.includes('hosting') || catLower.includes('deployment')) return 'fa-solid fa-server';
    if (catLower.includes('cse academic') || catLower.includes('resources')) return 'fa-solid fa-graduation-cap';
    if (catLower.includes('vpn') || catLower.includes('privacy')) return 'fa-solid fa-shield-halved';
    if (catLower.includes('project') && catLower.includes('professional')) return 'fa-solid fa-briefcase';
    if (catLower.includes('real-life project')) return 'fa-solid fa-code-branch';
    return 'fa-solid fa-tag'; // Default icon
};


// --- Components ---

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onToggleSidebar: () => void;
  isSidebarVisible: boolean;
}

const Header: React.FC<HeaderProps> = ({ searchTerm, onSearchChange, theme, onThemeToggle, onToggleSidebar, isSidebarVisible }) => {
  return (
    <header className="header">
      <div className="header-logo">
        <button onClick={onToggleSidebar} className="sidebar-toggle-btn" aria-label={isSidebarVisible ? "Hide sidebar" : "Show sidebar"} aria-expanded={isSidebarVisible}>
            <i className={`fas ${isSidebarVisible ? 'fa-times' : 'fa-bars'}`}></i>
        </button>
        <a href="/" aria-label="AltFinder Homepage">
          <i className="fa-solid fa-wand-magic-sparkles"></i> AltFinder
        </a>
      </div>
      <div className="header-search">
         <input
          type="search"
          className="search-bar"
          placeholder="Search for tool alternatives..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search tools"
        />
      </div>
      <div className="header-actions">
        <button onClick={onThemeToggle} className="theme-toggle" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
          <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
        </button>
      </div>
    </header>
  );
};

// --- Dynamic Hero Component ---
const heroSlidesData = [
    {
        id: 1,
        headline: "Unlock Premium Power, Without the Premium Price!",
        subheadline: "Discover top-tier free and affordable alternatives to popular software.",
        ctaText: "Explore AI Tools",
        ctaLink: "AI Tools" // Category name to filter
    },
    {
        id: 2,
        headline: "Supercharge Your Workflow on a Budget.",
        subheadline: "From design to development, find tools that fit your needs and your wallet.",
        ctaText: "Find Design Software",
        ctaLink: "Design Tools"
    },
    {
        id: 3,
        headline: "Student or Pro? We've Got You Covered.",
        subheadline: "Access essential academic and professional tools without breaking the bank.",
        ctaText: "Browse CSE Resources",
        ctaLink: "CSE Semester Resources"
    }
];

interface HeroProps {
    onCtaClick: (category: string) => void;
    onSearchFocus: () => void; // Re-add if needed for a general explore button
}

const Hero: React.FC<HeroProps> = ({ onCtaClick }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prevSlide) => (prevSlide + 1) % heroSlidesData.length);
        }, 7000); // Change slide every 7 seconds
        return () => clearInterval(timer);
    }, []);

    const slide = heroSlidesData[currentSlide];

    return (
        <section className="hero-section">
            <div className="hero-content">
                {heroSlidesData.map((s, index) => (
                    <div key={s.id} className={`hero-slide ${index === currentSlide ? 'active' : ''}`}>
                        <h1>{s.headline}</h1>
                        <p>{s.subheadline}</p>
                        <button className="hero-cta" onClick={() => onCtaClick(s.ctaLink)}>
                             <i className={getCategoryIcon(s.ctaLink)}></i> {s.ctaText}
                        </button>
                    </div>
                ))}
            </div>
             <div className="hero-dots">
                {heroSlidesData.map((_, index) => (
                    <span
                        key={index}
                        className={`dot ${index === currentSlide ? 'active' : ''}`}
                        onClick={() => setCurrentSlide(index)}
                    ></span>
                ))}
            </div>
        </section>
    );
};


// --- Featured Tools Section ---
interface FeaturedToolsSectionProps {
    tools: Tool[];
    onToolClick: (tool: Tool) => void; // For potential future "quick view" or scroll
}
const FeaturedToolsSection: React.FC<FeaturedToolsSectionProps> = ({ tools, onToolClick }) => {
    if (!tools || tools.length === 0) return null;

    // Simple selection logic: first tool from first few unique categories, up to 4 tools
    const featured: Tool[] = [];
    const categoriesSeen = new Set<string>();
    for (const tool of toolsData) { // Use global toolsData to ensure variety if filtered list is small
        if (!categoriesSeen.has(tool.category) && tool.priceType === 'Free') {
            featured.push(tool);
            categoriesSeen.add(tool.category);
        }
        if (featured.length >= 4) break;
    }
     if (featured.length === 0 && toolsData.length > 0) { // Fallback if no free tools found by above logic
        featured.push(...toolsData.slice(0, Math.min(4, toolsData.length)));
    }


    return (
        <section className="featured-tools-section homepage-section">
            <h2 className="section-title">✨ Popular & Free Alternatives</h2>
            <div className="featured-tools-grid">
                {featured.map(tool => (
                    <SmallToolCard key={tool.id} tool={tool} />
                ))}
            </div>
        </section>
    );
};

interface SmallToolCardProps {
    tool: Tool;
}
const SmallToolCard: React.FC<SmallToolCardProps> = ({ tool }) => {
    return (
        <a href={tool.link} target="_blank" rel="noopener noreferrer" className={`small-tool-card ${getCategoryClass(tool.category)}`}>
            <div className={`category-icon-bg ${getCategoryClass(tool.category)}`}>
                 <i className={getCategoryIcon(tool.category)}></i>
            </div>
            <h3>{tool.name}</h3>
            <p className="small-tool-category">{tool.category}</p>
            <p className="small-tool-ref">Alt for: {tool.premiumToolRefName}</p>
            <StarRating rating={tool.userRating} />
            <span className="small-tool-link">Visit Site <i className="fas fa-arrow-right"></i></span>
        </a>
    );
};


// --- Category Highlight Section ---
interface CategoryHighlightSectionProps {
    onCategorySelect: (category: string) => void;
}
const CategoryHighlightSection: React.FC<CategoryHighlightSectionProps> = ({ onCategorySelect }) => {
    // Select a diverse set of up to 6-8 categories
    const highlightedCategories = [...CATEGORIES].sort(() => 0.5 - Math.random()).slice(0, 8);

    return (
        <section className="category-highlight-section homepage-section">
            <h2 className="section-title">🔍 Explore by Category</h2>
            <div className="category-tiles">
                {highlightedCategories.map(category => (
                    <button
                        key={category}
                        className={`category-tile ${getCategoryClass(category)}`}
                        onClick={() => onCategorySelect(category)}
                        aria-label={`Explore ${category}`}
                    >
                        <i className={getCategoryIcon(category)}></i>
                        <span>{category}</span>
                    </button>
                ))}
            </div>
        </section>
    );
};


// --- Sidebar ---
interface SidebarProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  selectedPrice: Tool['priceType'] | 'All';
  onPriceChange: (price: Tool['priceType'] | 'All') => void;
  selectedPlatforms: Tool['platform'][0][];
  onPlatformChange: (platform: Tool['platform'][0], checked: boolean) => void;
  isVisible: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  selectedCategory, onCategoryChange,
  selectedPrice, onPriceChange,
  selectedPlatforms, onPlatformChange,
  isVisible
}) => {
  return (
    <aside className={`sidebar ${isVisible ? 'visible' : ''}`}>
      <div className="filter-group category-filters">
        <h3><i className="fas fa-filter"></i> Filters</h3>
        <h4>Categories</h4>
        <button
          onClick={() => onCategoryChange(null)}
          className={selectedCategory === null ? 'active' : ''}
          aria-pressed={selectedCategory === null}
        >
          All Categories
        </button>
        {CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`${selectedCategory === category ? 'active' : ''} ${getCategoryClass(category)}`}
            aria-pressed={selectedCategory === category}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="filter-group">
        <h4>Price</h4>
        {PRICE_TYPES.map(price => (
          <label key={price} className="filter-label">
            <input
              type="radio"
              name="priceFilter"
              value={price}
              checked={selectedPrice === price}
              onChange={() => onPriceChange(price)}
            />
            <span>{price}</span>
          </label>
        ))}
      </div>

      <div className="filter-group">
        <h4>Platform</h4>
        {PLATFORMS.map(platform => (
          <label key={platform} className="filter-label">
            <input
              type="checkbox"
              value={platform}
              checked={selectedPlatforms.includes(platform)}
              onChange={(e) => onPlatformChange(platform, e.target.checked)}
            />
            <span>{platform}</span>
          </label>
        ))}
      </div>
    </aside>
  );
};


// --- Star Rating Component ---
interface StarRatingProps {
    rating: number; // 0-5
    maxStars?: number;
}
const StarRating: React.FC<StarRatingProps> = ({ rating, maxStars = 5 }) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = maxStars - fullStars - (halfStar ? 1 : 0);

    return (
        <div className="star-rating" aria-label={`Rated ${rating} out of ${maxStars} stars`}>
            {[...Array(fullStars)].map((_, i) => <i key={`full-${i}`} className="fas fa-star"></i>)}
            {halfStar && <i key="half" className="fas fa-star-half-alt"></i>}
            {[...Array(emptyStars)].map((_, i) => <i key={`empty-${i}`} className="far fa-star"></i>)}
            <span className="rating-value">({rating.toFixed(1)})</span>
        </div>
    );
};


// --- Enhanced Tool Card ---
interface ToolCardProps {
  tool: Tool;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <article className={`tool-card ${getCategoryClass(tool.category)}`}>
      <div className={`category-band ${getCategoryClass(tool.category)}`}></div>
      <div className="tool-card-content">
        <div className="tool-card-header">
            <h2>{tool.name}</h2>
            <StarRating rating={tool.userRating} />
        </div>
        {tool.premiumToolRefName && (
          <p className="premium-ref">
            Alternative for: <strong>{tool.premiumToolRefName}</strong>
          </p>
        )}
        <p className="tool-category"><strong>Category:</strong> {tool.category}</p>
        <p className="tool-usecase"><strong>Use Case:</strong> {tool.useCase}</p>
        <p className="tool-short-description">{tool.description}</p>


        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="toggle-description"
          aria-expanded={isExpanded}
          aria-controls={`desc-${tool.id}`}
        >
          {isExpanded ? 'Hide' : 'Show'} Full Details <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
        </button>

        <div
          id={`desc-${tool.id}`}
          className={`detailed-description-container ${isExpanded ? 'expanded' : ''}`}
          role="region"
        >
          <h4>Detailed Information:</h4>
          <p>{tool.detailedDescription}</p>
          
          <h5>Key Features:</h5>
          <ul>{tool.features.map((item, i) => <li key={`feat-${i}`}>{item}</li>)}</ul>
          
          <div className="pros-cons-grid">
            <div>
                <h5><i className="fas fa-thumbs-up"></i> Pros:</h5>
                <ul>{tool.pros.map((item, i) => <li key={`pro-${i}`}>{item}</li>)}</ul>
            </div>
            <div>
                <h5><i className="fas fa-thumbs-down"></i> Cons:</h5>
                <ul>{tool.cons.map((item, i) => <li key={`con-${i}`}>{item}</li>)}</ul>
            </div>
          </div>

          <p><strong>Limitations:</strong> {tool.limitations}</p>
          <p><strong>Platforms:</strong> {tool.platform.join(', ')}</p>

          <h5>Gallery:</h5>
          {tool.gallery && tool.gallery.length > 0 ? (
            <div className="tool-gallery">
              {tool.gallery.slice(0,2).map((imgUrl, i) => (
                <img key={`gal-${i}`} src={imgUrl} alt={`${tool.name} screenshot ${i + 1}`} loading="lazy"/>
              ))}
              {tool.gallery.length > 2 && <span className="gallery-more">+{tool.gallery.length -2} more</span>}
            </div>
          ) : <p>Screenshots coming soon.</p>}
        </div>

         <div className="tool-actions">
            <a href={tool.link} target="_blank" rel="noopener noreferrer" className="tool-link">
                Visit Website <i className="fas fa-external-link-alt"></i>
            </a>
            <span className={`price-tag price-${tool.priceType.toLowerCase()}`}>{tool.priceType}</span>
        </div>

        <div className="tags">
          {tool.tags.slice(0, 5).map(tag => (
            <span key={tag} className={`tag tag-${tag.toLowerCase().replace(/\s+/g, '-')}`}>{tag}</span>
          ))}
        </div>
      </div>
    </article>
  );
};


interface ToolListProps {
  tools: Tool[];
  title?: string;
}

const ToolList: React.FC<ToolListProps> = ({ tools, title = "All Tools" }) => {
  if (tools.length === 0) {
    return <p className="no-tools-message">No tools match your criteria. Try adjusting the filters or search term!</p>;
  }
  return (
    <section className="tool-list-container homepage-section" id="tool-list-section">
      <h2 className="section-title">{title}</h2>
      <div className="tool-list">
        {tools.map(tool => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </section>
  );
};

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-about">
            <h4><i className="fa-solid fa-wand-magic-sparkles"></i> AltFinder</h4>
            <p>Your go-to resource for discovering free and budget-friendly alternatives to popular premium software. Empowering you with the right tools without breaking the bank.</p>
        </div>
        <div className="footer-social">
            <h4>Follow Us</h4>
            <a href="https://github.com/ajharlog" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><i className="fab fa-github"></i></a>
            <a href="https://linkedin.com/in/ajharlog/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><i className="fab fa-linkedin"></i></a>
            <a href="https://x.com/ajharlog" target="_blank" rel="noopener noreferrer" aria-label="Twitter X"><i className="fa-brands fa-x-twitter"></i></a>
            <a href="https://facebook.com/ajharlog" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i className="fab fa-facebook"></i></a>
        </div>
        <div className="footer-links-container">
            <h4>Quick Links</h4>
            {/* Placeholders for future links */}
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#contact">Contact Us</a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>🔧 Built with ❤️ by Md Ajharul Islam</p>
        <p>&copy; {new Date().getFullYear()} AltFinder. All rights reserved.</p>
      </div>
    </footer>
  );
};


function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    return savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<Tool['priceType'] | 'All'>('All');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Tool['platform'][0][]>([]);
  const [isSidebarVisible, setIsSidebarVisible] = useState(window.innerWidth > 992); // Adjusted for better UX on tablets
  const toolListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Placeholder for Gemini API
    // const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // console.log("Gemini API Client initialized. Model: gemini-2.5-flash-preview-04-17");
  }, []);

  useEffect(() => {
    document.documentElement.className = `${theme}-theme`;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleResize = () => {
        setIsSidebarVisible(window.innerWidth > 992);
    };
    window.addEventListener('resize', handleResize);
    if (window.innerWidth <= 992) {
        setIsSidebarVisible(false);
    }
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarVisible(prev => !prev);
  }, []);

  const handlePlatformChange = useCallback((platform: Tool['platform'][0], checked: boolean) => {
    setSelectedPlatforms(prev =>
      checked ? [...prev, platform] : prev.filter(p => p !== platform)
    );
  }, []);

  const handleHeroCtaClick = useCallback((category: string) => {
    setSelectedCategory(category);
    setSearchTerm(''); // Clear search when focusing a category from hero
    toolListRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleCategoryHighlightSelect = useCallback((category: string) => {
    setSelectedCategory(category);
    setSearchTerm('');
    toolListRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const filteredTools = useMemo(() => {
    return toolsData.filter(tool => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm.trim() === '' ||
        tool.name.toLowerCase().includes(searchTermLower) ||
        tool.description.toLowerCase().includes(searchTermLower) ||
        tool.detailedDescription.toLowerCase().includes(searchTermLower) ||
        (tool.premiumToolRefName && tool.premiumToolRefName.toLowerCase().includes(searchTermLower)) ||
        tool.tags.some(tag => tag.toLowerCase().includes(searchTermLower)) ||
        tool.useCase.toLowerCase().includes(searchTermLower);

      const matchesCategory = selectedCategory === null || tool.category === selectedCategory;
      
      let matchesPrice = selectedPrice === 'All' || tool.priceType === selectedPrice;
      if (selectedPrice === 'Cheap' && tool.priceType === 'Free') { 
        matchesPrice = true;
      }

      const matchesPlatform = selectedPlatforms.length === 0 ||
        (tool.platform && selectedPlatforms.some(p => tool.platform.includes(p)));

      return matchesSearch && matchesCategory && matchesPrice && matchesPlatform;
    });
  }, [searchTerm, selectedCategory, selectedPrice, selectedPlatforms]);

  const focusSearchAndScroll = () => { // Generic focus/scroll for an Explore button if added
    const searchInput = document.querySelector('.search-bar') as HTMLInputElement;
    if (searchInput) {
        searchInput.focus();
    }
    toolListRef.current?.scrollIntoView({ behavior: 'smooth' });
  };


  return (
    <div className={`app-container ${isSidebarVisible && window.innerWidth > 992 ? 'sidebar-is-visible-desktop' : ''}`}>
      <Header
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        theme={theme}
        onThemeToggle={toggleTheme}
        onToggleSidebar={toggleSidebar}
        isSidebarVisible={isSidebarVisible}
      />
      <Hero onCtaClick={handleHeroCtaClick} onSearchFocus={focusSearchAndScroll} />
      
      <FeaturedToolsSection tools={toolsData} onToolClick={() => {}} />
      <CategoryHighlightSection onCategorySelect={handleCategoryHighlightSelect} />

      <main className="main-content">
        <Sidebar
          selectedCategory={selectedCategory}
          onCategoryChange={(cat) => {setSelectedCategory(cat); toolListRef.current?.scrollIntoView({behavior: 'smooth'});}}
          selectedPrice={selectedPrice}
          onPriceChange={setSelectedPrice}
          selectedPlatforms={selectedPlatforms}
          onPlatformChange={handlePlatformChange}
          isVisible={isSidebarVisible}
        />
        <div ref={toolListRef} style={{scrollMarginTop: '80px'}}> {/* For smooth scroll target */}
          <ToolList tools={filteredTools} title={selectedCategory ? `Tools for ${selectedCategory}` : "All Discoverable Tools"} />
        </div>
      </main>
      <div className={`overlay ${isSidebarVisible && window.innerWidth <= 992 ? 'visible' : ''}`} onClick={toggleSidebar}></div>
      <Footer />
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('Failed to find the root element');
}
