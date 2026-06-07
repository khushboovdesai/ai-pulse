/* ==========================================================================
   AI PULSE FRONTEND DRIVER: INTERACTIONS & VISUAL SANDBOXES
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  // App variables
  let appData = null;
  let currentTheme = 'dark';
  let currentMetric = 'mmlu_score';

  // Core Elements
  const themeToggle = document.getElementById('theme-toggle');
  const updateTimeBadge = document.getElementById('update-time');
  
  // Tab panels
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabPanels = document.querySelectorAll('.tab-panel');

  // ==========================================================================
  // INTERACTIVE INLINE GLOSSARY TOOLTIPS
  // ==========================================================================
  const glossaryTerms = {
    "ai_tutors": {
      "term": "AI Tutor",
      "definition": "Personalized digital teachers powered by AI that adapt math, reading, or coding lessons to fit your individual learning speed and style.",
      "sandbox": null
    },
    "transformers": {
      "term": "Transformer",
      "definition": "A type of AI brain architecture that is great at understanding relationships between words in sentences.",
      "sandbox": "self_attention"
    },
    "quantization": {
      "term": "Quantization",
      "definition": "A trick to compress large AI models by rounding off their numerical weights so they run super fast on phones without needing the internet.",
      "sandbox": "fine_tuning"
    },
    "multimodal": {
      "term": "Multimodal",
      "definition": "AI models that can process different types of inputs simultaneously—like reading text, looking at images, and listening to audio.",
      "sandbox": null
    },
    "neuromorphic": {
      "term": "Neuromorphic",
      "definition": "Computer chips designed to mimic the physical structure of neurons and synapses in the human brain, saving tons of electricity.",
      "sandbox": "neural_network"
    },
    "neural_network": {
      "term": "Neural Network",
      "definition": "A computer brain inspired by the human mind, made of nodes (neurons) that connect and pass information to solve puzzles.",
      "sandbox": "neural_network"
    },
    "rag": {
      "term": "RAG",
      "definition": "Giving an AI a custom open-book library to look up facts before it tries to answer a question.",
      "sandbox": "rag"
    },
    "reinforcement_learning": {
      "term": "Reinforcement Learning",
      "definition": "Teaching a virtual robot by giving it positive points (rewards) for good moves and minus points (penalties) for bad ones.",
      "sandbox": "reinforcement_learning"
    },
    "fine_tuning": {
      "term": "Fine-Tuning",
      "definition": "Taking a smart general AI and teaching it extra specialized lessons to make it an expert in one topic.",
      "sandbox": "fine_tuning"
    }
  };

  function injectGlossaryLinks(text) {
    let replacedText = text;
    const sortedKeys = Object.keys(glossaryTerms).sort((a, b) => {
      return glossaryTerms[b].term.length - glossaryTerms[a].term.length;
    });

    sortedKeys.forEach(key => {
      const termObj = glossaryTerms[key];
      const regex = new RegExp(`\\b(${termObj.term})(s|es|ics)?\\b`, 'gi');
      replacedText = replacedText.replace(regex, `<span class="glossary-term" data-term="${key}">$1$2</span>`);
    });
    return replacedText;
  }

  const glossaryPopover = document.getElementById('glossary-popover');
  const glossaryTitle = document.getElementById('glossary-title');
  const glossaryDef = document.getElementById('glossary-def');
  const glossaryActionBtn = document.getElementById('glossary-action-btn');
  let hideGlossaryTimeout = null;

  document.addEventListener('mouseover', (e) => {
    const termEl = e.target.closest('.glossary-term');
    if (termEl) {
      clearTimeout(hideGlossaryTimeout);
      const termKey = termEl.getAttribute('data-term');
      const termObj = glossaryTerms[termKey];
      if (!termObj) return;

      glossaryTitle.textContent = termObj.term;
      glossaryDef.textContent = termObj.definition;

      if (termObj.sandbox) {
        glossaryActionBtn.style.display = 'block';
        glossaryActionBtn.setAttribute('data-target-sandbox', termObj.sandbox);
      } else {
        glossaryActionBtn.style.display = 'none';
      }

      const rect = termEl.getBoundingClientRect();
      const popoverWidth = 280;
      const popoverHeight = 150; 
      
      let x = rect.left;
      if (x + popoverWidth > window.innerWidth) {
        x = window.innerWidth - popoverWidth - 20;
      }
      if (x < 10) x = 10;

      let y = rect.top - popoverHeight - 8;
      if (rect.top < popoverHeight + 20) {
        y = rect.bottom + 8;
      }

      glossaryPopover.style.left = `${x}px`;
      glossaryPopover.style.top = `${y}px`;

      try {
        glossaryPopover.showPopover();
      } catch (err) {}
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('.glossary-term') || e.target.closest('#glossary-popover')) {
      clearTimeout(hideGlossaryTimeout);
      hideGlossaryTimeout = setTimeout(() => {
        try {
          glossaryPopover.hidePopover();
        } catch (err) {}
      }, 300);
    }
  });

  glossaryPopover.addEventListener('mouseover', () => {
    clearTimeout(hideGlossaryTimeout);
  });

  glossaryPopover.addEventListener('mouseout', () => {
    clearTimeout(hideGlossaryTimeout);
    hideGlossaryTimeout = setTimeout(() => {
      try {
        glossaryPopover.hidePopover();
      } catch (err) {}
    }, 300);
  });

  glossaryActionBtn.addEventListener('click', () => {
    const sandboxId = glossaryActionBtn.getAttribute('data-target-sandbox');
    if (sandboxId) {
      try {
        glossaryPopover.hidePopover();
      } catch (err) {}
      
      const tabSandbox = document.getElementById('tab-sandbox');
      if (tabSandbox) tabSandbox.click();

      setTimeout(() => {
        const jargonBtn = document.querySelector(`.jargon-btn[data-jargon="${sandboxId}"]`);
        if (jargonBtn) jargonBtn.click();
      }, 50);
    }
  });

  // ==========================================================================
  // THEME MANAGEMENT (FOUC SAFE)
  // ==========================================================================
  
  function initTheme() {
    const savedTheme = localStorage.getItem('color-scheme');
    if (savedTheme) {
      currentTheme = savedTheme;
    } else {
      currentTheme = 'dark';
    }
    applyTheme(currentTheme);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelector('meta[name="color-scheme"]').content = theme;
    localStorage.setItem('color-scheme', theme);
    themeToggle.querySelector('.theme-icon').textContent = theme === 'dark' ? '☀️' : '🌙';
    
    // Redraw canvases/SVGs if active to update colors
    if (activeSandbox === 'neural_network') drawNN();
    if (activeSandbox === 'self_attention') drawAttentionLines();
  }

  themeToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(currentTheme);
  });

  // ==========================================================================
  // TAB NAVIGATION SYSTEM
  // ==========================================================================
  
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Deactivate all
      navTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tabPanels.forEach(p => {
        p.classList.remove('active');
        p.setAttribute('hidden', '');
      });

      // Activate clicked
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const panelId = tab.getAttribute('aria-controls');
      const activePanel = document.getElementById(panelId);
      activePanel.classList.add('active');
      activePanel.removeAttribute('hidden');

      // Specific panel initializations
      const activeTabId = tab.id;
      if (activeTabId === 'tab-models') {
        renderModelsChart();
      } else if (activeTabId === 'tab-sandbox') {
        initActiveSandbox();
      }
    });
  });

  // ==========================================================================
  // OVERVIEW HIGHLIGHTS INTERACTIONS
  // ==========================================================================
  document.querySelectorAll('.highlight-item').forEach(item => {
    item.addEventListener('click', () => {
      const action = item.getAttribute('data-action');
      if (action === 'scroll-brief') {
        const briefGrid = document.querySelector('.brief-grid');
        if (briefGrid) {
          briefGrid.scrollIntoView({ behavior: 'smooth' });
        }
      } else if (action === 'tab-sandbox') {
        const tab = document.getElementById('tab-sandbox');
        if (tab) tab.click();
      } else if (action === 'tab-models') {
        const tab = document.getElementById('tab-models');
        if (tab) tab.click();
      } else if (action === 'tab-resources') {
        const tab = document.getElementById('tab-resources');
        if (tab) tab.click();
      }
    });
  });

  // ==========================================================================
  // DATA RENDERING (DAILY BRIEF, MODELS, RESOURCES)
  // ==========================================================================

  async function loadData() {
    try {
      const response = await fetch('data/brief.json');
      if (!response.ok) throw new Error('Network issue loading brief database.');
      appData = await response.json();
      
      // Update UI Header
      const dateStr = new Date(appData.updated_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      updateTimeBadge.textContent = `Daily Brief: Updated ${dateStr} EST`;
      
      // Render components
      renderDailyBrief();
      renderBriefCourses();
      renderTools();
      renderResources();
      renderModelsTable();
    } catch (err) {
      console.error(err);
      updateTimeBadge.textContent = 'Offline Seed Mode';
      // Load emergency default seeds if fetch fails
      loadSeedsFallback();
    }
  }

  function renderDailyBrief() {
    const growthContainer = document.getElementById('growth-news-container');
    const techContainer = document.getElementById('tech-news-container');

    // Clear loading states
    growthContainer.innerHTML = '';
    techContainer.innerHTML = '';

    appData.growth_news.forEach(news => {
      growthContainer.appendChild(createNewsCard(news));
    });

    appData.tech_news.forEach(news => {
      techContainer.appendChild(createNewsCard(news));
    });
  }

  function renderBriefCourses() {
    const container = document.getElementById('brief-courses-container');
    if (!container) return;
    container.innerHTML = '';

    const courses = [
      {
        title: "GenAcademy Mastering Agentic AI Cohort",
        provider: "GenAcademy",
        description: "Learn to build autonomous multi-agent systems using the Google Antigravity SDK and state-of-the-art frameworks in an interactive team cohort.",
        url: "https://genacademy.io"
      },
      {
        title: "Free Maven Lightning Sessions",
        provider: "Maven",
        description: "Short, high-intensity live virtual workshops led by top industry experts teaching cutting-edge AI engineering and deployment strategies.",
        url: "https://maven.com"
      },
      {
        title: "Generative AI for Everyone",
        provider: "DeepLearning.AI",
        description: "A non-technical introduction to AI concepts, explaining what LLMs are, how they work, and how to use them productively in daily life.",
        url: "https://www.coursera.org/learn/generative-ai-for-everyone"
      }
    ];

    courses.forEach(course => {
      const card = document.createElement('article');
      card.className = 'news-card';
      card.innerHTML = `
        <h4 class="news-card-title">${course.title} <span class="free-badge" style="font-size: 0.65rem; font-weight: 600; padding: 1px 4px; background: rgba(16, 185, 129, 0.15); color: var(--color-accent-green); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 4px; margin-left: 4px; display: inline-block; vertical-align: middle;">FREE 🎁</span></h4>
        <p class="news-card-desc"><strong>${course.provider}</strong> — ${course.description}</p>
        <div class="news-card-footer">
          <span class="news-source">🎓 Core Learning</span>
          <a class="news-link" href="${course.url}" target="_blank">Start Learning <span aria-hidden="true">→</span></a>
        </div>
      `;
      container.appendChild(card);
    });
  }

  function createNewsCard(news) {
    const card = document.createElement('article');
    card.className = 'news-card';
    const titleWithGlossary = injectGlossaryLinks(news.title);
    const descWithGlossary = injectGlossaryLinks(news.description);
    card.innerHTML = `
      <h4 class="news-card-title">${titleWithGlossary}</h4>
      <p class="news-card-desc">${descWithGlossary}</p>
      <div class="news-card-footer">
        <span class="news-source">🔗 ${news.source}</span>
        <a class="news-link" href="${news.url}" target="_blank">Read Article <span aria-hidden="true">→</span></a>
      </div>
    `;
    return card;
  }

  function renderTools() {
    const container = document.getElementById('trending-tools-container');
    container.innerHTML = '';

    appData.tools.forEach(tool => {
      const card = document.createElement('article');
      card.className = 'news-card';
      card.innerHTML = `
        <h4 class="news-card-title">${tool.name}</h4>
        <p class="news-card-desc"><strong>${tool.tagline}</strong> — ${tool.trending_factor}</p>
        <div class="news-card-footer">
          <span class="news-source">🔥 Trending Tool</span>
          <a class="news-link" href="${tool.url}" target="_blank">Launch Tool <span aria-hidden="true">→</span></a>
        </div>
      `;
      container.appendChild(card);
    });
  }

  function renderResources() {
    const coursesContainer = document.getElementById('courses-container');
    const blogsContainer = document.getElementById('blogs-container');

    coursesContainer.innerHTML = '';
    blogsContainer.innerHTML = '';

    appData.courses.forEach(course => {
      const card = document.createElement('div');
      card.className = 'course-card';
      card.innerHTML = `
        <h4 class="course-title">${course.title} <span class="free-badge" style="font-size: 0.7rem; font-weight: 600; padding: 2px 6px; background: rgba(16, 185, 129, 0.15); color: var(--color-accent-green); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 4px; margin-left: 6px; display: inline-block; vertical-align: middle;">FREE 🎁</span></h4>
        <div class="course-details">
          <span class="course-tag">📖 ${course.provider}</span>
          <span>👤 ${course.instructor}</span>
          <span>🎓 ${course.level}</span>
          <span>⏳ ${course.duration}</span>
        </div>
        <div class="resource-footer">
          <a class="resource-link" href="${course.url}" target="_blank">Start Learning <span aria-hidden="true">→</span></a>
        </div>
      `;
      coursesContainer.appendChild(card);
    });

    appData.blogs.forEach(blog => {
      const card = document.createElement('div');
      card.className = 'blog-card';
      card.innerHTML = `
        <h4 class="blog-title">${blog.title}</h4>
        <div class="blog-details">
          <span class="blog-tag">📝 ${blog.site}</span>
          <span>👤 ${blog.author}</span>
          <span>⏳ ${blog.read_time} read</span>
        </div>
        <div class="resource-footer">
          <a class="resource-link" href="${blog.url}" target="_blank">Read Post <span aria-hidden="true">→</span></a>
        </div>
      `;
      blogsContainer.appendChild(card);
    });
  }

  function renderModelsTable() {
    const tbody = document.getElementById('models-table-body');
    tbody.innerHTML = '';

    appData.models.forEach(model => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight: 600; color: var(--color-accent-primary);">${model.name}</td>
        <td>${model.developer}</td>
        <td style="font-family: monospace;">${model.parameters}</td>
        <td style="font-family: monospace;">${model.context_window.toLocaleString()}</td>
        <td style="font-weight: 600;">${model.mmlu_score}%</td>
        <td style="color: var(--color-accent-green); font-family: monospace;">$${model.cost_per_million.toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Fallback database seeds
  function loadSeedsFallback() {
    appData = {
      updated_at: new Date().toISOString(),
      growth_news: [
        { id: "g-1", title: "AI Tutors Spark Math Excitement in Elementary Schools", description: "AI companions adapt quizzes dynamically, converting algebraic homework into virtual games.", source: "TechEDU", url: "#" },
        { id: "g-2", title: "AI Startup Ecosystem Reaches Record Heights", description: "Venture capital backing pushes intelligence system developers into rapid deployment modes.", source: "Silicon Weekly", url: "#" },
        { id: "g-3", title: "Green Neuromorphic Computing Shrinks Edge Power Needs", description: "Hardware synaptic chips process inputs at fraction of digital power usage.", source: "E-Hardware", url: "#" }
      ],
      tech_news: [
        { id: "t-1", title: "State Space Models Challenges Transformers Dominance", description: "Mamba architecture removes quadratic bottlenecks in sequential text calculations.", source: "Vector Labs", url: "#" },
        { id: "t-2", title: "Quantized Local Models Run Sub-100ms on Mobile Chips", description: "Weight adjustments enable complex neural logic to run offline without internet.", source: "Micro-Tech", url: "#" },
        { id: "t-3", title: "Analog Neural Network Chips Simulate Real Brain Synapses", description: "Engineers are moving away from digital ones and zeros by building chips that process electrical current strengths, mimicking biological neural connections.", source: "Synaptic Chip", url: "#" }
      ],
      jargons: [
        { id: "neural_network", term: "Neural Network", definition: "A computer brain inspired by the human mind, made of nodes (neurons) that connect and pass information to solve puzzles.", example: "Like a chain of friends guessing a drawing: the first friend looks at outlines, the second identifies shapes, and the third guesses the object.", use_case: "Self-driving cars recognizing stop signs, or smart cameras detecting faces in photos." },
        { id: "self_attention", term: "Self-Attention", definition: "A trick that helps a model look at a whole sentence and figure out how different words connect to each other.", example: "In 'The animal didn't cross the street because IT was too tired,' attention weights connect 'IT' back to the 'animal', not the 'street'.", use_case: "Language translators (like Google Translate) knowing which words are describing who or what." },
        { id: "rag", term: "RAG (Retrieval-Augmented Generation)", definition: "Giving an AI a custom open-book library to look up facts before it tries to answer a question.", example: "Instead of guessing the rules of a new game from memory, you open the instruction booklet first to read the exact rules, then explain it.", use_case: "An AI school assistant looking up the exact lunch menu from a school's private spreadsheet." },
        { id: "reinforcement_learning", term: "Reinforcement Learning", definition: "Teaching a virtual robot by giving it positive points (rewards) for good moves and minus points (penalties) for bad ones.", example: "Training a puppy: you give him a dog treat when he sits, and ignore him if he jumps. Eventually, he learns that sitting is the best option!", use_case: "Training robot dogs to walk over rocks, or teaching chess programs (like AlphaZero) to beat grandmasters." },
        { id: "fine_tuning", term: "Fine-Tuning", definition: "Taking a smart general AI and teaching it extra specialized lessons to make it an expert in one topic.", example: "Taking a high-school graduate who knows basic writing, and sending them to medical school so they learn how to write prescriptions.", use_case: "Teaching a general language model how to write code in a specific new programming language." }
      ],
      tools: [
        { name: "Cursor", tagline: "Smart IDE", trending_factor: "Autocompletes code blocks across multiple directories simultaneously.", url: "#" },
        { name: "NotebookLM", tagline: "AI Notebook", trending_factor: "Turns folders of raw notes into two-host conversational podcast mp3s.", url: "#" },
        { name: "v0 by Vercel", tagline: "UI Builder", trending_factor: "Converts text inputs into structured responsive React components.", url: "#" },
        { name: "Midjourney", tagline: "Image generator", trending_factor: "Paints hyper-realistic graphics with correct text generation details.", url: "#" },
        { name: "ElevenLabs", tagline: "Voice Synthesizer", trending_factor: "Builds expressive spoken dialog audio with custom tone vectors.", url: "#" }
      ],
      models: [
        { name: "Claude 3.5 Sonnet", developer: "Anthropic", parameters: "~1.5 Trillion (est)", context_window: 200000, mmlu_score: 88.7, cost_per_million: 3.00 },
        { name: "GPT-4o", developer: "OpenAI", parameters: "~1.8 Trillion (est)", context_window: 128000, mmlu_score: 88.7, cost_per_million: 5.00 },
        { name: "Gemini 1.5 Pro", developer: "Google", parameters: "~1.2 Trillion (est)", context_window: 2000000, mmlu_score: 85.9, cost_per_million: 7.00 },
        { name: "Llama 3 70B", developer: "Meta", parameters: "70 Billion", context_window: 8000, mmlu_score: 82.0, cost_per_million: 0.15 },
        { name: "Mistral Large 2", developer: "Mistral", parameters: "123 Billion", context_window: 128000, mmlu_score: 84.0, cost_per_million: 3.00 }
      ],
      courses: [
        { title: "GenAcademy Master AI Cohort", provider: "GenAcademy", instructor: "AI Cohort Instructors", level: "Beginner to Pro", duration: "6 Weeks", url: "#" },
        { title: "Free Maven Lightning Sessions", provider: "Maven", instructor: "Industry Experts", level: "Intermediate", duration: "2 Hours", url: "#" },
        { title: "Generative AI for Everyone", provider: "DeepLearning.AI", instructor: "Andrew Ng", level: "Beginner", duration: "6 Hours", url: "#" },
        { title: "Introduction to Generative AI", provider: "Google Cloud", instructor: "Eng Team", level: "Beginner", duration: "1 Hour", url: "#" },
        { title: "Practical Deep Learning", provider: "Fast.ai", instructor: "Jeremy Howard", level: "Intermediate", duration: "20 Hours", url: "#" }
      ],
      blogs: [
        { title: "Mapping the Mind of LLMs", author: "Safety Team", site: "Anthropic Blog", read_time: "12 Min", url: "#" },
        { title: "Introducing GPT-4o Omni Capabilities", author: "Product Team", site: "OpenAI Blog", read_time: "8 Min", url: "#" },
        { title: "Intro to Large Language Models", author: "Andrej Karpathy", site: "YouTube", read_time: "60 Min video", url: "#" },
        { title: "Fine-Tuning Llama 3 with LoRA", author: "P. Schmid", site: "Hugging Face", read_time: "15 Min", url: "#" },
        { title: "Debating AI Timelines", author: "Editorial Board", site: "The Gradient", read_time: "18 Min", url: "#" }
      ]
    };
    renderDailyBrief();
    renderBriefCourses();
    renderTools();
    renderResources();
    renderModelsTable();
  }

  // ==========================================================================
  // MODELS METRICS CHART: CUSTOM SVG HISTOGRAM RENDERER
  // ==========================================================================

  const metricButtons = document.querySelectorAll('.metric-opt');
  const chartTitle = document.getElementById('chart-title');

  metricButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      metricButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      currentMetric = btn.getAttribute('data-metric');
      renderModelsChart();
    });
  });

  function renderModelsChart() {
    if (!appData) return;
    const svg = document.getElementById('models-bar-chart');
    svg.innerHTML = ''; // Clear previous

    const models = appData.models;
    const width = 600;
    const height = 350;
    const paddingLeft = 140;
    const paddingRight = 60;
    const paddingTop = 40;
    const paddingBottom = 40;

    // Determine max values to scale chart columns
    let maxVal = 0;
    let metricLabel = '';
    
    if (currentMetric === 'mmlu_score') {
      maxVal = 100;
      metricLabel = '🎯 MMLU Accuracy (%)';
      chartTitle.textContent = `Model Comparison: MMLU Logic Score (%)`;
    } else if (currentMetric === 'context_window') {
      maxVal = 2000000; // Cap visual reference to Gemini window
      metricLabel = '📖 Context Limit (Tokens)';
      chartTitle.textContent = `Model Comparison: Context Window Size`;
    } else if (currentMetric === 'cost_per_million') {
      maxVal = 8.00;
      metricLabel = '💰 Price ($ per 1 Million Tokens)';
      chartTitle.textContent = `Model Comparison: API Cost (per 1M tokens)`;
    }

    // Draw Grid Lines & X-Axis Labels
    const chartContentWidth = width - paddingLeft - paddingRight;
    const chartContentHeight = height - paddingTop - paddingBottom;

    for (let i = 0; i <= 4; i++) {
      const pct = i / 4;
      const x = paddingLeft + pct * chartContentWidth;
      const val = pct * maxVal;
      
      // Vertical grid line
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x);
      line.setAttribute('y1', paddingTop);
      line.setAttribute('x2', x);
      line.setAttribute('y2', height - paddingBottom);
      line.setAttribute('class', 'chart-gridline');
      svg.appendChild(line);

      // Label text
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x);
      text.setAttribute('y', height - paddingBottom + 16);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', 'var(--color-text-muted)');
      text.setAttribute('font-size', '9px');
      text.setAttribute('font-family', 'monospace');
      
      if (currentMetric === 'context_window') {
        text.textContent = val >= 1000000 ? `${val / 1000000}M` : `${val / 1000}k`;
      } else if (currentMetric === 'cost_per_million') {
        text.textContent = `$${val.toFixed(2)}`;
      } else {
        text.textContent = `${val}%`;
      }
      svg.appendChild(text);
    }

    // Draw bars
    const barHeight = Math.floor(chartContentHeight / models.length) - 10;
    
    models.forEach((model, idx) => {
      const y = paddingTop + idx * (barHeight + 10);
      const val = model[currentMetric];
      
      // Calculate scaled width
      let scaledWidth = (val / maxVal) * chartContentWidth;
      if (scaledWidth < 4) scaledWidth = 4; // Min visual thickness

      // Horizontal text: Model name
      const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      nameText.setAttribute('x', paddingLeft - 12);
      nameText.setAttribute('y', y + barHeight/2 + 4);
      nameText.setAttribute('text-anchor', 'end');
      nameText.setAttribute('class', 'chart-label');
      nameText.textContent = model.name;
      svg.appendChild(nameText);

      // Bar rect
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', paddingLeft);
      rect.setAttribute('y', y);
      rect.setAttribute('width', 0); // Start at zero for entry animation
      rect.setAttribute('height', barHeight);
      rect.setAttribute('class', 'chart-bar');
      rect.setAttribute('rx', '6');
      rect.setAttribute('fill', idx % 2 === 0 ? 'var(--color-accent-primary)' : 'var(--color-accent-purple)');
      
      // Add tooltip/popover interaction values
      rect.innerHTML = `<title>${model.name}: ${val}</title>`;
      svg.appendChild(rect);

      // Animate width
      setTimeout(() => {
        rect.setAttribute('width', scaledWidth);
      }, 50 + idx * 50);

      // Value label text
      const valText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      valText.setAttribute('x', paddingLeft + 8);
      valText.setAttribute('y', y + barHeight/2 + 4);
      valText.setAttribute('class', 'chart-value');
      
      let displayVal = '';
      if (currentMetric === 'context_window') {
        displayVal = val.toLocaleString();
      } else if (currentMetric === 'cost_per_million') {
        displayVal = `$${val.toFixed(2)}`;
      } else {
        displayVal = `${val}%`;
      }
      valText.textContent = displayVal;
      svg.appendChild(valText);

      // Move value text if bar is too short
      setTimeout(() => {
        if (scaledWidth < 60) {
          valText.setAttribute('x', paddingLeft + scaledWidth + 6);
          valText.setAttribute('fill', 'var(--color-text-title)');
        } else {
          valText.setAttribute('fill', '#000000');
        }
      }, 100);
    });

    // Base Y-Axis line
    const axis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    axis.setAttribute('x1', paddingLeft);
    axis.setAttribute('y1', paddingTop - 10);
    axis.setAttribute('x2', paddingLeft);
    axis.setAttribute('y2', height - paddingBottom);
    axis.setAttribute('class', 'chart-axis');
    svg.appendChild(axis);
  }

  // ==========================================================================
  // JARGON EXPLAINER SWITCHER
  // ==========================================================================

  const jargonBtns = document.querySelectorAll('.jargon-btn');
  const sandboxViews = document.querySelectorAll('.sandbox-view');
  
  const explainerTerm = document.getElementById('explainer-term');
  const explainerDef = document.getElementById('explainer-definition');
  const explainerEx = document.getElementById('explainer-example');
  const explainerUse = document.getElementById('explainer-use-case');

  let activeSandbox = 'neural_network';

  jargonBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      jargonBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const selectedJargon = btn.getAttribute('data-jargon');
      activeSandbox = selectedJargon;

      // Update Sandbox View
      sandboxViews.forEach(v => {
        v.classList.remove('active');
      });
      document.getElementById(`view-${selectedJargon}`).classList.add('active');

      // Update Explainer Texts
      updateExplainerPanel(selectedJargon);
      initActiveSandbox();
    });
  });

  function updateExplainerPanel(jargonId) {
    if (!appData) return;
    const jargonObj = appData.jargons.find(j => j.id === jargonId);
    if (!jargonObj) return;

    explainerTerm.textContent = jargonObj.term;
    explainerDef.textContent = jargonObj.definition;
    explainerEx.textContent = jargonObj.example;
    explainerUse.textContent = jargonObj.use_case;
  }

  // Active Sandbox Controller router
  function initActiveSandbox() {
    if (activeSandbox === 'neural_network') {
      initNN();
    } else if (activeSandbox === 'self_attention') {
      initAttention();
    } else if (activeSandbox === 'rag') {
      initRAG();
    } else if (activeSandbox === 'reinforcement_learning') {
      initRL();
    } else if (activeSandbox === 'fine_tuning') {
      initFineTuning();
    }
  }

  // ==========================================================================
  // SANDBOX 1: NEURAL NETWORK ACTIVATION PULSER (CANVAS)
  // ==========================================================================
  
  let nnCanvas = null;
  let nnCtx = null;
  let nnNodes = [];
  let nnConnections = [];
  let nnPulses = [];
  let nnAnimationId = null;
  let nnHiddenCount = 3;

  function initNN() {
    nnCanvas = document.getElementById('nn-canvas');
    if (!nnCanvas) return;
    nnCtx = nnCanvas.getContext('2d');

    buildNetworkStructure();
    
    // Clear prev event listeners
    const fireBtn = document.getElementById('nn-fire-btn');
    const addBtn = document.getElementById('nn-add-node');
    const resetBtn = document.getElementById('nn-reset');

    fireBtn.onclick = triggerNNPulse;
    addBtn.onclick = () => {
      if (nnHiddenCount < 6) {
        nnHiddenCount++;
        buildNetworkStructure();
      } else {
        alert("Neuron capacity reached! Keep it simple for small brains!");
      }
    };
    resetBtn.onclick = () => {
      nnHiddenCount = 3;
      buildNetworkStructure();
    };

    nnCanvas.onclick = (e) => {
      const rect = nnCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Check if user clicked close to an input neuron
      nnNodes.forEach(node => {
        if (node.layer === 0) {
          const dist = Math.hypot(node.x - x, node.y - y);
          if (dist < 20) {
            triggerSingleNodePulse(node.id);
          }
        }
      });
    };

    startNNLoop();
  }

  function buildNetworkStructure() {
    nnNodes = [];
    nnConnections = [];
    nnPulses = [];

    const width = nnCanvas.width;
    const height = nnCanvas.height;

    // Define Node Layers
    const layers = [
      { count: 2, label: 'Input' },
      { count: nnHiddenCount, label: 'Hidden' },
      { count: 1, label: 'Output' }
    ];

    let nodeId = 0;
    
    layers.forEach((layer, layerIdx) => {
      const colX = (width / (layers.length - 1)) * layerIdx * 0.8 + (width * 0.1);
      
      for (let i = 0; i < layer.count; i++) {
        // Vertical spacing offset centers nodes
        const gap = height / (layer.count + 1);
        const nodeY = gap * (i + 1);
        
        nnNodes.push({
          id: nodeId++,
          x: colX,
          y: nodeY,
          layer: layerIdx,
          label: `${layer.label[0]}${i+1}`,
          activation: 0
        });
      }
    });

    // Generate fully-connected paths between layers
    nnNodes.forEach(n1 => {
      nnNodes.forEach(n2 => {
        if (n2.layer === n1.layer + 1) {
          nnConnections.push({
            from: n1.id,
            to: n2.id,
            weight: (Math.random() * 2 - 1).toFixed(2), // Random synaptic weight
            pulseStrength: 0
          });
        }
      });
    });
  }

  function triggerNNPulse() {
    // Fire pulses from both inputs
    nnNodes.forEach(node => {
      if (node.layer === 0) {
        triggerSingleNodePulse(node.id);
      }
    });
  }

  function triggerSingleNodePulse(startNodeId) {
    const node = nnNodes.find(n => n.id === startNodeId);
    if (!node) return;
    
    node.activation = 1.0;

    // Spawn pulses into all outward paths
    nnConnections.forEach(conn => {
      if (conn.from === startNodeId) {
        nnPulses.push({
          fromX: node.x,
          fromY: node.y,
          toX: 0,
          toY: 0,
          toId: conn.to,
          progress: 0,
          speed: 0.04,
          weight: conn.weight
        });
      }
    });
  }

  function drawNN() {
    if (!nnCtx || !nnCanvas) return;
    nnCtx.clearRect(0, 0, nnCanvas.width, nnCanvas.height);
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    
    // Grid backgrounds
    nnCtx.strokeStyle = theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
    nnCtx.lineWidth = 1;
    for (let x = 0; x < nnCanvas.width; x += 30) {
      nnCtx.beginPath();
      nnCtx.moveTo(x, 0);
      nnCtx.lineTo(x, nnCanvas.height);
      nnCtx.stroke();
    }
    for (let y = 0; y < nnCanvas.height; y += 30) {
      nnCtx.beginPath();
      nnCtx.moveTo(0, y);
      nnCtx.lineTo(nnCanvas.width, y);
      nnCtx.stroke();
    }

    // Draw Synapses (Lines)
    nnConnections.forEach(conn => {
      const fromNode = nnNodes.find(n => n.id === conn.from);
      const toNode = nnNodes.find(n => n.id === conn.to);
      if (!fromNode || !toNode) return;

      const grad = nnCtx.createLinearGradient(fromNode.x, fromNode.y, toNode.x, toNode.y);
      if (conn.weight > 0) {
        grad.addColorStop(0, 'rgba(0, 242, 254, 0.2)');
        grad.addColorStop(1, 'rgba(16, 185, 129, 0.2)');
      } else {
        grad.addColorStop(0, 'rgba(168, 85, 247, 0.2)');
        grad.addColorStop(1, 'rgba(244, 63, 94, 0.2)');
      }

      nnCtx.beginPath();
      nnCtx.strokeStyle = grad;
      nnCtx.lineWidth = Math.abs(conn.weight) * 3 + 0.8;
      nnCtx.moveTo(fromNode.x, fromNode.y);
      nnCtx.lineTo(toNode.x, toNode.y);
      nnCtx.stroke();

      // Small static weights overlay
      nnCtx.fillStyle = theme === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.4)';
      nnCtx.font = '8px monospace';
      nnCtx.fillText(conn.weight, (fromNode.x + toNode.x)/2, (fromNode.y + toNode.y)/2 - 5);
    });

    // Draw active electric pulses
    nnPulses.forEach(pulse => {
      const target = nnNodes.find(n => n.id === pulse.toId);
      if (!target) return;

      const currentX = pulse.fromX + (target.x - pulse.fromX) * pulse.progress;
      const currentY = pulse.fromY + (target.y - pulse.fromY) * pulse.progress;

      nnCtx.beginPath();
      nnCtx.fillStyle = pulse.weight > 0 ? '#00f2fe' : '#f43f5e';
      nnCtx.arc(currentX, currentY, 6, 0, Math.PI * 2);
      nnCtx.shadowColor = pulse.weight > 0 ? '#00f2fe' : '#f43f5e';
      nnCtx.shadowBlur = 12;
      nnCtx.fill();
      nnCtx.shadowBlur = 0; // reset
    });

    // Draw Nodes (Neurons)
    nnNodes.forEach(node => {
      // Outer border glow ring
      if (node.activation > 0) {
        nnCtx.beginPath();
        nnCtx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
        nnCtx.lineWidth = 4;
        nnCtx.arc(node.x, node.y, 22 + node.activation * 6, 0, Math.PI * 2);
        nnCtx.stroke();
      }

      nnCtx.beginPath();
      const nodeGrad = nnCtx.createRadialGradient(node.x, node.y, 2, node.x, node.y, 18);
      
      if (node.layer === 0) {
        nodeGrad.addColorStop(0, '#0284c7');
        nodeGrad.addColorStop(1, '#0c4a6e');
      } else if (node.layer === 1) {
        nodeGrad.addColorStop(0, '#7c3aed');
        nodeGrad.addColorStop(1, '#4c1d95');
      } else {
        nodeGrad.addColorStop(0, '#10b981');
        nodeGrad.addColorStop(1, '#064e3b');
      }

      nnCtx.fillStyle = nodeGrad;
      nnCtx.strokeStyle = node.activation > 0.1 ? '#00f2fe' : 'rgba(255, 255, 255, 0.15)';
      nnCtx.lineWidth = 2;
      nnCtx.arc(node.x, node.y, 18, 0, Math.PI * 2);
      nnCtx.fill();
      nnCtx.stroke();

      // Label text
      nnCtx.fillStyle = '#ffffff';
      nnCtx.font = 'bold 10px sans-serif';
      nnCtx.textAlign = 'center';
      nnCtx.fillText(node.label, node.x, node.y + 3);

      // Decaying activation
      node.activation *= 0.92;
      if (node.activation < 0.01) node.activation = 0;
    });
  }

  function startNNLoop() {
    if (nnAnimationId) cancelAnimationFrame(nnAnimationId);
    
    function step() {
      if (activeSandbox !== 'neural_network') return;
      
      // Update pulses
      for (let i = nnPulses.length - 1; i >= 0; i--) {
        const p = nnPulses[i];
        p.progress += p.speed;

        if (p.progress >= 1.0) {
          // Trigger next neuron activation
          const node = nnNodes.find(n => n.id === p.toId);
          if (node) {
            node.activation = 1.0;
            // Spawn next-layer propagation pulses if not output layer
            if (node.layer < 2) {
              nnConnections.forEach(conn => {
                if (conn.from === node.id) {
                  nnPulses.push({
                    fromX: node.x,
                    fromY: node.y,
                    toX: 0,
                    toY: 0,
                    toId: conn.to,
                    progress: 0,
                    speed: 0.04,
                    weight: conn.weight
                  });
                }
              });
            }
          }
          // Remove finished pulse
          nnPulses.splice(i, 1);
        }
      }

      drawNN();
      nnAnimationId = requestAnimationFrame(step);
    }
    
    nnAnimationId = requestAnimationFrame(step);
  }

  // ==========================================================================
  // SANDBOX 2: SELF-ATTENTION VISUAL CONNECTIONS (SVG)
  // ==========================================================================

  let attActiveWordIdx = 6; // Index of "it"
  let attActiveHead = 0;
  const attSentence = ["The", "robot", "didn't", "cross", "the", "street", "because", "it", "was", "too", "tired"];

  // Attention scores matrices (from "it")
  const attentionWeights = {
    // Head 1: Focuses on "robot" (Subject)
    "head_0": [0.02, 0.72, 0.01, 0.05, 0.01, 0.02, 0.03, 0.10, 0.02, 0.01, 0.01],
    // Head 2: Focuses on "street" (Object / Spatial)
    "head_1": [0.01, 0.04, 0.02, 0.15, 0.01, 0.65, 0.02, 0.08, 0.01, 0.005, 0.005]
  };

  function initAttention() {
    const textContainer = document.getElementById('attention-sentence-words');
    textContainer.innerHTML = '';

    // Render sentence layout
    attSentence.forEach((word, idx) => {
      const span = document.createElement('span');
      span.className = 'att-word';
      if (idx === attActiveWordIdx) span.classList.add('active');
      span.textContent = word;
      span.id = `att-word-${idx}`;

      span.addEventListener('mouseenter', () => {
        attActiveWordIdx = idx;
        document.querySelectorAll('.att-word').forEach(w => w.classList.remove('active'));
        span.classList.add('active');
        drawAttentionLines();
      });

      textContainer.appendChild(span);
    });

    // Setup Head buttons
    const headBtns = document.querySelectorAll('.attention-heads-selectors button');
    headBtns.forEach(btn => {
      btn.onclick = () => {
        headBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        attActiveHead = parseInt(btn.getAttribute('data-head'));
        drawAttentionLines();
      };
    });

    drawAttentionLines();
  }

  function drawAttentionLines() {
    const svg = document.getElementById('attention-svg');
    if (!svg) return;
    svg.innerHTML = ''; // Clear previous paths

    const wRects = [];
    attSentence.forEach((_, idx) => {
      const el = document.getElementById(`att-word-${idx}`);
      if (el) {
        wRects.push(el.getBoundingClientRect());
      }
    });

    if (wRects.length === 0) return;

    // Get wrapper bounding box to calculate relative local positions
    const containerRect = document.querySelector('.attention-playground').getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();

    const startX = (wRects[attActiveWordIdx].left + wRects[attActiveWordIdx].right)/2 - svgRect.left;
    const startY = 180; // Bottom line anchors words

    // Weights array
    let weights = [];
    if (attActiveWordIdx === 7) { // "it"
      weights = attentionWeights[`head_${attActiveHead}`];
    } else {
      // Simulate generic attention: focuses near cursor, slightly random
      weights = attSentence.map((_, idx) => {
        if (idx === attActiveWordIdx) return 0.25;
        const dist = Math.abs(idx - attActiveWordIdx);
        return Math.max(0.02, (0.5 / (dist + 1)) * (0.8 + Math.random() * 0.4));
      });
      // Normalize values
      const sum = weights.reduce((a, b) => a + b, 0);
      weights = weights.map(w => w / sum);
    }

    // Draw bezier curves connecting elements
    wRects.forEach((rect, idx) => {
      if (idx === attActiveWordIdx) return; // Skip self

      const targetX = (rect.left + rect.right)/2 - svgRect.left;
      const targetY = 20; // Top curve height
      const w = weights[idx];

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      
      // Compute symmetric bezier curves control coordinates
      const midY = (startY + targetY) / 2;
      const dString = `M ${startX} ${startY} C ${startX} ${midY}, ${targetX} ${midY}, ${targetX} ${targetY}`;
      
      path.setAttribute('d', dString);
      path.setAttribute('fill', 'none');
      
      // Select head line colors
      const strokeColor = attActiveHead === 0 ? 'rgba(0, 242, 254,' : 'rgba(168, 85, 247,';
      path.setAttribute('stroke', `${strokeColor} ${w * 1.5 + 0.05})`);
      path.setAttribute('stroke-width', w * 8 + 0.5);

      // Dash animations for active focus weights
      if (w > 0.15) {
        path.setAttribute('stroke-dasharray', '5 5');
        path.setAttribute('stroke-dashoffset', '0');
        // Simple inline CSS animation mapping
        path.style.animation = 'dash-run 1s infinite linear';
      }

      svg.appendChild(path);

      // Label percentages above curves
      if (w > 0.05) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', targetX);
        text.setAttribute('y', targetY - 4);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', 'var(--color-text-title)');
        text.setAttribute('font-size', '9px');
        text.setAttribute('font-weight', 'bold');
        text.textContent = `${Math.round(w * 100)}%`;
        svg.appendChild(text);
      }
    });
  }

  // Add keyframe animation block dynamic to documents
  const styleEl = document.createElement('style');
  styleEl.innerHTML = `
    @keyframes dash-run {
      to {
        stroke-dashoffset: -20;
      }
    }
  `;
  document.head.appendChild(styleEl);

  // ==========================================================================
  // SANDBOX 3: RETRIEVAL-AUGMENTED GENERATION FLOW
  // ==========================================================================

  let ragRunning = false;

  function initRAG() {
    const submitBtn = document.getElementById('rag-submit-btn');
    submitBtn.onclick = runRAGSimulation;
  }

  function runRAGSimulation() {
    if (ragRunning) return;
    ragRunning = true;

    const queryInput = document.getElementById('rag-query').value.trim();
    if (!queryInput) {
      alert("Please enter a question!");
      ragRunning = false;
      return;
    }

    // Reset status cards
    const stepCards = document.querySelectorAll('.rag-step-card');
    stepCards.forEach(c => c.classList.remove('active'));

    const ind1 = document.getElementById('rag-ind-1');
    const ind2 = document.getElementById('rag-ind-2');
    const ind3 = document.getElementById('rag-ind-3');
    const ind4 = document.getElementById('rag-ind-4');

    ind1.textContent = '🤖 [?, ?, ?]';
    ind2.textContent = '🔍 Scanning...';
    ind3.textContent = '📋 Context merged!';
    ind4.textContent = '💬 Waiting...';

    // Step 1: Embed Query
    setTimeout(() => {
      stepCards[0].classList.add('active');
      const hashValues = Array.from({length: 3}, () => (Math.random() * 2 - 1).toFixed(2));
      ind1.textContent = `🤖 [${hashValues.join(', ')}]`;
    }, 100);

    // Step 2: Vector Search
    setTimeout(() => {
      stepCards[1].classList.add('active');
      let docTitle = 'No match found.';
      if (queryInput.toLowerCase().includes('battery') || queryInput.toLowerCase().includes('robot')) {
        docTitle = '📚 Found Doc 1 (Score: 0.94)';
      } else if (queryInput.toLowerCase().includes('rock') || queryInput.toLowerCase().includes('stone')) {
        docTitle = '📚 Found Doc 2 (Score: 0.89)';
      } else {
        docTitle = '📚 Found Doc 3 (Score: 0.76)';
      }
      ind2.textContent = docTitle;
    }, 1100);

    // Step 3: Augment Prompt
    setTimeout(() => {
      stepCards[2].classList.add('active');
      ind3.textContent = '📋 Prompt updated!';
    }, 2200);

    // Step 4: Generate text response
    setTimeout(() => {
      stepCards[3].classList.add('active');
      let finalAns = '';
      if (queryInput.toLowerCase().includes('battery') || queryInput.toLowerCase().includes('robot')) {
        finalAns = '"The robot battery is on the charger dock in Sector 4."';
      } else if (queryInput.toLowerCase().includes('rock') || queryInput.toLowerCase().includes('stone')) {
        finalAns = '"Space rocks have crystalline properties that make them glow."';
      } else {
        finalAns = '"Electric current flows inside closed loop circuits."';
      }
      ind4.textContent = finalAns;
      ragRunning = false;
    }, 3300);
  }

  // ==========================================================================
  // SANDBOX 4: REINFORCEMENT LEARNING GAME BOARD (Q-LEARNING)
  // ==========================================================================

  let rlGridSize = 4;
  let rlAgentPos = { r: 0, c: 0 };
  let rlGoalPos = { r: 3, c: 3 };
  let rlHazards = [{ r: 1, c: 2 }, { r: 2, c: 1 }];
  let rlBlocker = { r: 2, c: 2 };
  
  // Q-value Matrix states table: keys format 'r,c' -> object of {U: float, D: float, L: float, R: float}
  let qTable = {};
  let rlEpochs = 0;
  let rlAccumulatedReward = 0;

  function initRL() {
    // Clear brain Q table
    initQTableValues();

    // Render Board
    renderRLBoard();

    // Bindings
    document.getElementById('rl-step-btn').onclick = rlTakeStep;
    document.getElementById('rl-train-btn').onclick = rlTrainFast;
    document.getElementById('rl-reset-btn').onclick = () => {
      initQTableValues();
      rlEpochs = 0;
      rlAccumulatedReward = 0;
      rlAgentPos = { r: 0, c: 0 };
      document.getElementById('rl-epoch-count').textContent = '0';
      document.getElementById('rl-reward-count').textContent = '0';
      renderRLBoard();
    };
  }

  function initQTableValues() {
    qTable = {};
    for (let r = 0; r < rlGridSize; r++) {
      for (let c = 0; c < rlGridSize; c++) {
        qTable[`${r},${c}`] = { U: 0.0, D: 0.0, L: 0.0, R: 0.0 };
      }
    }
  }

  function renderRLBoard() {
    const board = document.getElementById('rl-grid-board');
    if (!board) return;
    board.innerHTML = '';

    for (let r = 0; r < rlGridSize; r++) {
      for (let c = 0; c < rlGridSize; c++) {
        const cell = document.createElement('div');
        cell.className = 'rl-cell';
        cell.id = `rl-cell-${r}-${c}`;

        // Blocker wall
        if (r === rlBlocker.r && c === rlBlocker.c) {
          cell.classList.add('blocked');
          cell.textContent = '🧱';
          board.appendChild(cell);
          continue;
        }

        // Draw goals/hazards/agent
        if (r === rlAgentPos.r && c === rlAgentPos.c) {
          cell.textContent = '🤖';
        } else if (r === rlGoalPos.r && c === rlGoalPos.c) {
          cell.textContent = '🔋';
          cell.classList.add('reward-glow');
        } else {
          const isHazard = rlHazards.some(h => h.r === r && h.c === c);
          if (isHazard) {
            cell.textContent = '🔥';
            cell.classList.add('hazard-glow');
          }
        }

        // Find max Q-value inside directions to choose opacity/colors overlay
        const qVals = qTable[`${r},${c}`];
        const maxQ = Math.max(qVals.U, qVals.D, qVals.L, qVals.R);
        const minQ = Math.min(qVals.U, qVals.D, qVals.L, qVals.R);

        // Display max vector label
        if (maxQ > 0.01 && !(r === rlGoalPos.r && c === rlGoalPos.c)) {
          cell.style.backgroundColor = `rgba(16, 185, 129, ${Math.min(0.6, maxQ / 10)})`;
          const span = document.createElement('span');
          span.className = 'rl-q-val';
          span.textContent = `Q:${maxQ.toFixed(1)}`;
          cell.appendChild(span);
        } else if (minQ < -0.01) {
          cell.style.backgroundColor = `rgba(244, 63, 94, ${Math.min(0.6, Math.abs(minQ) / 10)})`;
          const span = document.createElement('span');
          span.className = 'rl-q-val';
          span.textContent = `Q:${minQ.toFixed(1)}`;
          cell.appendChild(span);
        }

        board.appendChild(cell);
      }
    }
  }

  // Get valid movement steps
  function getPossibleActions(pos) {
    const actions = [];
    if (pos.r > 0 && !(pos.r - 1 === rlBlocker.r && pos.c === rlBlocker.c)) actions.push('U');
    if (pos.r < rlGridSize - 1 && !(pos.r + 1 === rlBlocker.r && pos.c === rlBlocker.c)) actions.push('D');
    if (pos.c > 0 && !(pos.r === rlBlocker.r && pos.c - 1 === rlBlocker.c)) actions.push('L');
    if (pos.c < rlGridSize - 1 && !(pos.r === rlBlocker.r && pos.c + 1 === rlBlocker.c)) actions.push('R');
    return actions;
  }

  function getNextState(pos, act) {
    const next = { r: pos.r, c: pos.c };
    if (act === 'U') next.r--;
    if (act === 'D') next.r++;
    if (act === 'L') next.c--;
    if (act === 'R') next.c++;
    return next;
  }

  function rlTakeStep() {
    const stateKey = `${rlAgentPos.r},${rlAgentPos.c}`;
    const actions = getPossibleActions(rlAgentPos);
    if (actions.length === 0) return;

    // Epsilon-greedy select: 80% choose max Q value, 20% random explore
    let action = '';
    const qVals = qTable[stateKey];
    
    if (Math.random() < 0.8) {
      // Greedy action
      let bestAct = actions[0];
      let bestQ = qVals[bestAct];
      actions.forEach(a => {
        if (qVals[a] > bestQ) {
          bestQ = qVals[a];
          bestAct = a;
        }
      });
      action = bestAct;
    } else {
      // Explore action
      action = actions[Math.floor(Math.random() * actions.length)];
    }

    const nextState = getNextState(rlAgentPos, action);
    const nextKey = `${nextState.r},${nextState.c}`;

    // Get rewards values
    let reward = -0.1; // Baseline step penalty encourages short paths
    let terminal = false;

    if (nextState.r === rlGoalPos.r && nextState.c === rlGoalPos.c) {
      reward = 10.0;
      terminal = true;
    } else if (rlHazards.some(h => h.r === nextState.r && h.c === nextState.c)) {
      reward = -10.0;
      terminal = true;
    }

    rlAccumulatedReward += reward;

    // Temporal Difference (TD) Q-learning math equation updates
    const lr = 0.5;
    const discount = 0.9;
    const nextQVals = qTable[nextKey];
    const maxNextQ = Math.max(nextQVals.U, nextQVals.D, nextQVals.L, nextQVals.R);

    // Q(s,a) = Q(s,a) + lr * (reward + discount * maxQ(s') - Q(s,a))
    qTable[stateKey][action] = qTable[stateKey][action] + lr * (reward + discount * maxNextQ - qTable[stateKey][action]);

    // Move robot
    rlAgentPos = nextState;

    if (terminal) {
      rlEpochs++;
      rlAgentPos = { r: 0, c: 0 }; // Reset to start
      document.getElementById('rl-epoch-count').textContent = rlEpochs;
    }

    document.getElementById('rl-reward-count').textContent = rlAccumulatedReward.toFixed(1);
    renderRLBoard();
  }

  function rlTrainFast() {
    // Run 50 simulated learning loops immediately
    for (let loop = 0; loop < 50; loop++) {
      let state = { r: 0, c: 0 };
      let terminal = false;
      let limit = 0; // Prevent infinite runs

      while (!terminal && limit < 100) {
        limit++;
        const stateKey = `${state.r},${state.c}`;
        const actions = getPossibleActions(state);
        
        // Epsilon greedy explore
        let action = '';
        const qVals = qTable[stateKey];
        if (Math.random() < 0.7) {
          let bestAct = actions[0];
          let bestQ = qVals[bestAct];
          actions.forEach(a => {
            if (qVals[a] > bestQ) {
              bestQ = qVals[a];
              bestAct = a;
            }
          });
          action = bestAct;
        } else {
          action = actions[Math.floor(Math.random() * actions.length)];
        }

        const nextState = getNextState(state, action);
        const nextKey = `${nextState.r},${nextState.c}`;

        let reward = -0.1;
        if (nextState.r === rlGoalPos.r && nextState.c === rlGoalPos.c) {
          reward = 10.0;
          terminal = true;
        } else if (rlHazards.some(h => h.r === nextState.r && h.c === nextState.c)) {
          reward = -10.0;
          terminal = true;
        }

        const lr = 0.5;
        const discount = 0.9;
        const nextQVals = qTable[nextKey];
        const maxNextQ = Math.max(nextQVals.U, nextQVals.D, nextQVals.L, nextQVals.R);

        // Update
        qTable[stateKey][action] = qTable[stateKey][action] + lr * (reward + discount * maxNextQ - qTable[stateKey][action]);
        state = nextState;
      }
      rlEpochs++;
    }

    rlAgentPos = { r: 0, c: 0 };
    document.getElementById('rl-epoch-count').textContent = rlEpochs;
    renderRLBoard();
  }

  // ==========================================================================
  // SANDBOX 5: FINE TUNING MATRIX & CURVE PLOTTER
  // ==========================================================================

  let ftTraining = false;

  function initFineTuning() {
    const lrSlider = document.getElementById('ft-lr');
    const epochSlider = document.getElementById('ft-epochs');
    const loraSlider = document.getElementById('ft-lora');

    lrSlider.oninput = (e) => document.getElementById('ft-lr-val').textContent = e.target.value;
    epochSlider.oninput = (e) => document.getElementById('ft-epochs-val').textContent = e.target.value;
    loraSlider.oninput = (e) => document.getElementById('ft-lora-val').textContent = e.target.value;

    const trainBtn = document.getElementById('ft-train-btn');
    trainBtn.onclick = runFineTuningAnimation;

    // Draw static initial weights matrix
    renderLoRAMatrix(0.0);
    drawLossCurve([]);
  }

  function renderLoRAMatrix(scale = 0.0) {
    const container = document.getElementById('lora-matrix');
    if (!container) return;
    container.innerHTML = '';

    for (let i = 0; i < 16; i++) {
      const cell = document.createElement('div');
      cell.className = 'matrix-cell';
      
      // Compute weights delta value
      const val = (Math.sin(i * 1.5) * scale * 0.8).toFixed(2);
      cell.textContent = val;

      // Color mapping
      if (parseFloat(val) > 0.01) {
        cell.style.backgroundColor = `rgba(0, 242, 254, ${Math.min(0.8, Math.abs(val) * 1.5)})`;
        cell.style.color = '#000000';
      } else if (parseFloat(val) < -0.01) {
        cell.style.backgroundColor = `rgba(168, 85, 247, ${Math.min(0.8, Math.abs(val) * 1.5)})`;
        cell.style.color = '#ffffff';
      } else {
        cell.style.color = 'var(--color-text-muted)';
      }
      container.appendChild(cell);
    }
  }

  function drawLossCurve(points = []) {
    const svg = document.getElementById('loss-svg');
    if (!svg) return;
    svg.innerHTML = '';

    const width = 450;
    const height = 180;
    const pad = 24;

    // Draw grid axis lines
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', pad);
    xAxis.setAttribute('y1', height - pad);
    xAxis.setAttribute('x2', width - pad);
    xAxis.setAttribute('y2', height - pad);
    xAxis.setAttribute('stroke', 'var(--color-border)');
    xAxis.setAttribute('stroke-width', '1.5');
    svg.appendChild(xAxis);

    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', pad);
    yAxis.setAttribute('y1', pad);
    yAxis.setAttribute('x2', pad);
    yAxis.setAttribute('y2', height - pad);
    yAxis.setAttribute('stroke', 'var(--color-border)');
    yAxis.setAttribute('stroke-width', '1.5');
    svg.appendChild(yAxis);

    if (points.length < 2) {
      // Draw grid placeholder line
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', width / 2);
      text.setAttribute('y', height / 2 + 5);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', 'var(--color-text-muted)');
      text.setAttribute('font-size', '11px');
      text.textContent = 'Click "Start Training Run" to begin fine-tuning!';
      svg.appendChild(text);
      return;
    }

    // Map loss points to svg coordinate pixels
    const maxEpochs = Math.max(10, points.length - 1);
    const maxLoss = 2.0;

    let pathString = '';
    points.forEach((loss, epoch) => {
      const x = pad + (epoch / maxEpochs) * (width - 2 * pad);
      const y = height - pad - (loss / maxLoss) * (height - 2 * pad);

      if (epoch === 0) {
        pathString += `M ${x} ${y}`;
      } else {
        pathString += ` L ${x} ${y}`;
      }

      // Draw active anchor dot
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', '4');
      circle.setAttribute('fill', '#00f2fe');
      svg.appendChild(circle);
    });

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathString);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#a855f7');
    path.setAttribute('stroke-width', '2.5');
    svg.appendChild(path);
  }

  function runFineTuningAnimation() {
    if (ftTraining) return;
    ftTraining = true;

    const lr = parseFloat(document.getElementById('ft-lr').value);
    const maxEpochs = parseInt(document.getElementById('ft-epochs').value);
    const rank = parseInt(document.getElementById('ft-lora').value);

    let currentEpoch = 0;
    const lossPoints = [];
    
    // Starting loss level (simulated error rate)
    let lossVal = 1.8;

    function stepTraining() {
      if (currentEpoch > maxEpochs) {
        ftTraining = false;
        return;
      }

      lossPoints.push(lossVal);
      drawLossCurve(lossPoints);
      
      // Scale LoRA matrix values as rank weights adapt
      const scale = (currentEpoch / maxEpochs) * (rank / 16);
      renderLoRAMatrix(scale);

      // Gradient convergence step decay math simulation
      // higher learning rate drops loss faster but may vibrate slightly
      const stepDecay = lr * (1.1 - Math.random() * 0.3) * (1.8 - lossVal * 0.4);
      lossVal = Math.max(0.1, lossVal - stepDecay);

      currentEpoch++;
      setTimeout(stepTraining, 150);
    }

    stepTraining();
  }

  // Load and setup initial views
  initTheme();
  loadData();
});
