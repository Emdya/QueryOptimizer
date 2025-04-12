# QueryOptimizer


---

## 📦 Setup and Installation Instructions

1. **Clone the repository**  
   ```bash
   git clone https://github.com/your-username/QueryOptimizer.git
   cd QueryOptimizer
   ```

2. **Install dependencies** (if using the Vite-bundled version)  
   ```bash
   npm install
   ```

3. **Build the extension**  
   ```bash
   npm run build
   ```

4. **Load into Chrome**  
   - Go to `chrome://extensions/`
   - Enable **Developer Mode**
   - Click **“Load Unpacked”**
   - Select the `dist/` folder

---

## 🧰 Tech Stack Used

- **JavaScript / ES6**
- **HTML5 & CSS3**
- **TensorFlow.js** – For ML model support
- **Transformers.js** by Hugging Face – For language model embeddings
- **Vite** – For module bundling and CSP-compliant builds
- **Chrome Extension API** – `popup`, `storage`, `manifest V3`

---

## 🚀 Features and Functionalities

- 🔍 **ML-Based Query Optimization**  
  Uses Hugging Face Transformers to rewrite user input for token efficiency while preserving meaning

- 🧠 **Pattern-Based Fallback Mode**  
  When ML models fail to load, the app falls back to regex-based optimization

- 📉 **Token Analysis**  
  Automatically calculates original and optimized token counts to help you understand efficiency gains

- 💬 **FAQ Matching**  
  Detects common queries (e.g. time, weather) using semantic similarity and auto-responds

- 📊 **UI Progress Feedback**  
  Displays model loading progress, fallback notices, and optimization statistics

- 🛡️ **100% CSP-Compliant**  
  All libraries are bundled locally to avoid Chrome Extension security policy violations

---

Let me know if you'd like me to drop this into a real `README.md` file and zip it for you!
