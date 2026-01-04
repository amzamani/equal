# X-Ray Competitor Search UI

Interactive competitor search demo with real OpenAI integration and X-Ray decision tracking.

## Features

- 🎯 **Real LLM Integration**: Uses OpenAI GPT for competitor analysis
- 🧠 **Reasoning Capture**: Logs AI reasoning for every decision
- 📊 **Decision Tracking**: Tracks filtering decisions with X-Ray `logDecision`
- 🎨 **Beautiful UI**: Modern, responsive interface
- 🔗 **X-Ray Viewer Integration**: Direct links to view traces

## Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your OpenAI API key:
   ```
   VITE_OPENAI_API_KEY=sk-...
   VITE_XRAY_ENDPOINT=http://localhost:3000
   ```

3. **Start the X-Ray API** (in another terminal):
   ```bash
   cd ../../packages/api
   pnpm dev
   ```

4. **Start the viewer** (in another terminal):
   ```bash
   cd ../../apps/viewer
   pnpm dev
   ```

5. **Run the app:**
   ```bash
   pnpm dev
   ```

6. **Open your browser:**
   - App: http://localhost:5173
   - Viewer: http://localhost:5174

## How It Works

1. **User Input**: Enter a product name, max price, and minimum relevance score
2. **LLM Analysis**: OpenAI analyzes all candidates and scores relevance (0-1)
3. **Filtering**: Apply price, stock, and relevance filters
4. **X-Ray Logging**: 
   - `logLLM`: Captures AI reasoning for competitor scoring
   - `logDecision`: Tracks filtering decisions (kept vs dropped)
5. **Results**: View competitors with reasoning and link to X-Ray viewer

## Example

Search for: "Sony WH-1000XM5 Headphones"
- Max Price: $400

The app will:
1. Ask OpenAI to generate keywords for the product
2. Filter by price, stock, and relevance
3. Log both the LLM reasoning and filtering decisions
4. Show results with a link to view the full trace in X-Ray

## X-Ray Events Logged

- **LLM Event**: Competitor analysis with reasoning
- **Decision Event**: Filtering with drop reasons (price_too_high, out_of_stock, relevance_too_low)
