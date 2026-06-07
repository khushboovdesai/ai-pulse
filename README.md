# AI Pulse 🤖⚡

**AI Pulse** is a vibrant, interactive single-page web dashboard designed to introduce young learners, students, and tech-curious minds to artificial intelligence. 

It provides daily simplified news curations, trending tools, resource indexes, and custom-designed **interactive playgrounds** to visually explain complex AI concepts.


---

## What does "Pulse" mean and why is it interactive?
- **The Rhythm of AI**: A "pulse" represents a heartbeat. Since AI changes on a daily (sometimes hourly) basis, "AI Pulse" means you are monitoring the live, beating heart of AI developments.
- **Electrical Signals (Neural Nets)**: In computer science, neural networks function by sending electrical activation "pulses" through neurons. Our interactive canvas playground literally lets kids click and send glowing cyan pulses ⚡ through a virtual brain, which matches the name perfectly.
- **Vibe**: It feels modern, alive, and reactive.

---

## 🎮 Interactive Jargon Sandboxes
The app features five native, high-performance web sandboxes:
1. **🤖 Neural Network (MLP)**: Canvas-based neuron editor. Click to spawn hidden neurons and press **Fire activation pulse** to watch pulses travel through connection synapses.
2. **🔍 Self-Attention**: Sentence word hover visualizer. Hover over words to inspect relation maps of different attention heads (e.g. mapping "it" to "robot" vs. "street").
3. **📚 RAG (Retrieval-Augmented Generation)**: Step-by-step pipeline visualizer that shows queries converting into vectors, indexing documents from a vault, and merging context to prompt.
4. **👾 Robot Reinforcement Learning (RL)**: A grid world game where you teach a robot agent (🤖) to find a battery (🔋) while avoiding fire pits (🔥) using Q-learning step updates or automated training.
5. **⚙️ Fine-Tuning Playground**: Slide controls for learning rates, LoRA rank, and epochs to animate simulated training loss curve convergence and matrix transformations.

---

## 📂 Project Structure
```text
ai-pulse/
├── index.html              # Core HTML structure
├── style.css               # Dynamic stylesheet (OKLCH, glassmorphism, layouts)
├── app.js                  # Frontend controllers, canvas simulations, SVG graphs
├── DESIGN_DISCUSSION.md    # Technology choices and Streamlit vs Vanilla comparison
├── SKILL.md                # Instruction guidelines for AI agent maintenance
├── README.md               # Developer manual and setup instructions
├── pyproject.toml          # Python package and dependency configuration
├── data/
│   └── brief.json          # Daily brief JSON database
├── docs/
│   └── CRONJOB_and_HOSTING.md # Serverless Daily Brief CronJob & Hosting Guide
├── scripts/
│   └── fetch_brief.py      # Python curation script calling Gemini API
├── tests/
│   ├── conftest.py         # Shared Pytest configurations
│   └── test_fetch_brief.py # Curation unit tests
└── .github/
    └── workflows/
        └── daily-brief.yml # GitHub Actions workflow (runs daily at 6:00 AM EST)
```

---

## 🛠️ Local Installation & Development

### 1. Requirements
- Python 3.9 or higher
- A modern web browser

### 2. Python Backend Setup
Initialize a virtual environment and install the package with development options:
```bash
# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install package and test dependencies
pip install -e ".[dev]"
```

### 3. Run Backend Curation Script (Optional)
To test the scraper and Gemini curation pipeline locally:
```bash
export GEMINI_API_KEY="your_api_key_here"
python scripts/fetch_brief.py
```

### 4. Run Pytest Suite
Run the automated mock unit tests to verify parser configurations:
```bash
pytest
```

### 5. Launch the Frontend
You can launch the frontend instantly using Python's built-in HTTP server:
```bash
python3 -m http.server 8000
```
Then open [http://localhost:8000](http://localhost:8000) in your browser.

---

## 🚀 Public Hosting & Automated Updates

For a detailed, beginner-friendly guide on how our automation works, what GitHub Actions and Pages are, and why this zero-cost serverless setup is a big win, check out our [CronJob & Hosting Guide](file:///Users/harshvyas/Documents/ai-pulse/docs/CRONJOB_and_HOSTING.md).

### GitHub Pages (100% Free)
1. Push this project to a public GitHub repository.
2. In the repository settings, go to **Pages**.
3. Under **Build and deployment**, select **Deploy from a branch** and choose `main` or `master` (root directory).
4. Your site will be live at `https://<your-username>.github.io/ai-pulse/`.

### Automated Daily Brief (6:00 AM EST)
The project comes with a pre-configured GitHub Actions workflow that executes the python curation script and updates `data/brief.json` automatically.
1. Obtain a free Gemini API key from [Google AI Studio](https://aistudio.google.com/).
2. In your GitHub repository, navigate to **Settings** > **Secrets and variables** > **Actions**.
3. Create a new repository secret:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: *[Your Gemini API Key]*
4. The workflow will execute at 11:00 AM UTC (6:00 AM EST) daily, fetch feeds, call the Gemini LLM, commit updates back to the repo, and refresh the live site.
