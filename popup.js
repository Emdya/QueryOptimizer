
    // Check if Transformers.js is loaded
    let transformersLoaded = false;
    let pipelineFunction = null;
    let AutoTokenizerClass = null;

    // Try to access the Transformers module
    try {
    if (window.Transformers) {
    transformersLoaded = true;
    pipelineFunction = window.Transformers.pipeline;
    AutoTokenizerClass = window.Transformers.AutoTokenizer;
} else if (window.pipeline && window.AutoTokenizer) {
    transformersLoaded = true;
    pipelineFunction = window.pipeline;
    AutoTokenizerClass = window.AutoTokenizer;
}
} catch (e) {
    console.error("Failed to access Transformers.js:", e);
    transformersLoaded = false;
}

    // ML-based query optimizer using Hugging Face models
    class QueryOptimizer {
    constructor() {
    // Models to load
    this.models = {
    tokenizer: null,   // For precise token counting
    embedder: null     // For semantic matching
};

    this.isInitialized = false;
    this.isInitializing = false;
    this.loadingProgress = 0;
    this.fallbackMode = !transformersLoaded;

    // Common query patterns database for optimization
    this.patternDatabase = this._createPatternDatabase();

    // FAQ map for common questions
    this.faqDatabase = new Map([
    ['weather', ['what is the weather', 'how is the weather', 'weather forecast']],
    ['time', ['what time is it', 'current time', 'what is the time']],
    ['help', ['can you help me', 'i need assistance', 'help me']],
    ['hello', ['hello', 'hi there', 'greetings']]
    ]);

    // Track which ML models were used
    this.mlModelsUsed = [];
}

    _createPatternDatabase() {
    return [
    // Filler phrases (high priority removal)
{
    category: 'Filler removal',
    patterns: [/^(can you|could you|would you|will you|please|kindly)\s+/i],
    replacement: ''
},
{
    category: 'Filler removal',
    patterns: [/(please|if you (don't mind|can|could)|when you (have a chance|can|get the chance))\s*\.?\s*$/i],
    replacement: ''
},
{
    category: 'Filler removal',
    patterns: [/^(i want to|i would like to|i'd like to|i wish to|i need to)\s+/i],
    replacement: ''
},
{
    category: 'Filler removal',
    patterns: [/^(i'm asking|i am asking|i'm wondering|i was wondering|i am wondering|i would like to know|just wondering)\s+/i],
    replacement: ''
},

    // Information request patterns
{
    category: 'Query restructuring',
    patterns: [/^(do you know|do you have any idea|are you familiar with|can you tell me|would you tell me)\s+/i],
    replacement: ''
},
{
    category: 'Query restructuring',
    patterns: [/^(i have a question about|i have a question regarding|i'm asking about|i am curious about)\s+/i],
    replacement: ''
},

    // Convert questions to commands/keywords
{
    category: 'Question to command',
    patterns: [/^what is the definition of\s+/i],
    replacement: 'define '
},
{
    category: 'Question to command',
    patterns: [/^can you explain|could you explain|would you explain|please explain\s+/i],
    replacement: 'explain '
},
{
    category: 'Question to command',
    patterns: [/^what does (.*) mean\?/i],
    replacement: 'define $1'
},
{
    category: 'Question to command',
    patterns: [/^how do i\s+/i, /^how can i\s+/i, /^how would i\s+/i, /^how should i\s+/i],
    replacement: ''
},
{
    category: 'Question to command',
    patterns: [/^how do you\s+/i, /^how can you\s+/i, /^how would you\s+/i],
    replacement: ''
},
{
    category: 'Question to command',
    patterns: [/^what are some\s+/i],
    replacement: 'list '
},
{
    category: 'Question to command',
    patterns: [/^tell me about\s+/i, /^give me information on\s+/i, /^give me details about\s+/i],
    replacement: ''
},
{
    category: 'Question to command',
    patterns: [/^what is\s+/i],
    replacement: ''
},
{
    category: 'Question to command',
    patterns: [/^where can i find\s+/i],
    replacement: 'find '
},

    // Article removal (context dependent)
{
    category: 'Article removal',
    patterns: [/\b(the|a|an) \b/gi],
    replacement: '',
    contextual: true
},

    // Trailing question marks
{
    category: 'Punctuation optimization',
    patterns: [/\?\s*$/],
    replacement: ''
}
    ];
}

    // Initialize ML models
    async initialize(progressCallback) {
    if (this.isInitialized || this.isInitializing) return;

    this.isInitializing = true;
    this.mlModelsUsed = [];

    try {
    // If Transformers.js is not loaded, go straight to fallback mode
    if (!transformersLoaded) {
    progressCallback({stage: 'Transformers.js not available, using pattern-based optimization', progress: 100});
    this.fallbackMode = true;
    this.isInitialized = true;
    this.isInitializing = false;
    return;
}

    progressCallback({stage: 'Starting initialization', progress: 5});

    // Try to load feature extraction model for embeddings
    try {
    progressCallback({stage: 'Loading embedding model...', progress: 50});
    this.models.embedder = await pipelineFunction('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    this.mlModelsUsed.push('Sentence embedding model (MiniLM-L6)');
    progressCallback({stage: 'Embedding model loaded', progress: 80});
} catch (error) {
    console.error('Error loading embedding model:', error);
    progressCallback({stage: 'Embedding model failed to load', progress: 80});
}

    this.isInitialized = true;
    progressCallback({stage: 'Models loaded', progress: 100});

} catch (error) {
    console.error('Initialization error:', error);
    this.fallbackMode = true;
    progressCallback({stage: 'Error loading models, using fallback mode', progress: 100});
} finally {
    this.isInitializing = false;
}
}

    // Count tokens using approximate counting
    countTokens(text) {
    if (!text) return 0;

    // Approximate token counting
    // This is a simplified approximation that works reasonably well
    let tokenCount = 0;

    // Split by whitespace first
    const words = text.split(/\s+/).filter(w => w.length > 0);

    for (const word of words) {
    // Most words are 1-2 tokens
    if (word.length <= 2) {
    tokenCount += 1;
} else if (word.length <= 6) {
    tokenCount += 1;
} else if (word.length <= 10) {
    tokenCount += 2;
} else {
    // Longer words are often split into multiple tokens
    tokenCount += Math.ceil(word.length / 5);
}

    // Punctuation often gets its own token
    tokenCount += (word.match(/[,.;:!?()[\]{}'"]/g) || []).length;
}

    return Math.max(1, tokenCount);
}

    // Find most similar FAQ if any
    async findFaq(query) {
    const normalizedQuery = query.toLowerCase().trim();

    // First try direct pattern matching
    for (const [answer, patterns] of this.faqDatabase.entries()) {
    for (const pattern of patterns) {
    if (normalizedQuery.includes(pattern)) {
    return answer;
}
}
}

    // If embedder is available, try semantic matching
    if (this.models.embedder && !this.fallbackMode) {
    try {
    const queryEmbedding = await this.models.embedder(normalizedQuery, { pooling: 'mean' });

    let bestMatch = null;
    let highestSimilarity = 0.85; // Threshold for similarity

    for (const [answer, patterns] of this.faqDatabase.entries()) {
    for (const pattern of patterns) {
    const patternEmbedding = await this.models.embedder(pattern, { pooling: 'mean' });

    // Calculate cosine similarity
    const similarity = this._cosineSimilarity(
    queryEmbedding.data,
    patternEmbedding.data
    );

    if (similarity > highestSimilarity) {
    highestSimilarity = similarity;
    bestMatch = answer;
}
}
}

    return bestMatch;
} catch (error) {
    console.error('Error in semantic FAQ matching:', error);
}
}

    return null;
}

    // Calculate cosine similarity between two embedding vectors
    _cosineSimilarity(a, b) {
    if (!a || !b || !a.length || !b.length || a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
}

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (normA * normB);
}

    // More intelligent article removal that preserves proper names and fixed phrases
    _contextuallyRemoveArticles(text) {
    // Protected phrases where articles should be preserved
    const protectedPhrases = [
    'the United States', 'the UK', 'the EU', 'the UN',
    'the Beatles', 'The New York Times', 'the Netherlands',
    'a lot', 'a few', 'a bit', 'the same', 'the other',
    'the following', 'the above', 'the below'
    ];

    let result = text;

    // Replace protected phrases with placeholders
    const placeholders = {};
    let placeholderIndex = 0;

    for (const phrase of protectedPhrases) {
    const regex = new RegExp(phrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
    result = result.replace(regex, match => {
    const placeholder = `__PROTECTED_${placeholderIndex++}__`;
    placeholders[placeholder] = match;
    return placeholder;
});
}

    // Remove articles except in protected phrases
    result = result.replace(/\b(the|a|an) \b(?!__PROTECTED)/gi, '');

    // Restore protected phrases
    for (const [placeholder, original] of Object.entries(placeholders)) {
    result = result.replace(new RegExp(placeholder, 'g'), original);
}

    return result;
}

    // Optimize query using pattern-based approach
    optimizeWithPatterns(query) {
    let optimized = query.trim();
    const appliedTechniques = [];

    // Apply pattern replacements
    for (const { category, patterns, replacement, contextual } of this.patternDatabase) {
    if (contextual) continue; // Skip contextual patterns for now

    for (const pattern of patterns) {
    const before = optimized;
    optimized = optimized.replace(pattern, replacement);

    if (before !== optimized) {
    appliedTechniques.push(category);
}
}
}

    // Apply contextual article removal after other optimizations
    for (const { category, patterns, replacement, contextual } of this.patternDatabase) {
    if (contextual) {
    const before = optimized;
    optimized = this._contextuallyRemoveArticles(optimized);

    if (before !== optimized) {
    appliedTechniques.push(category);
}
}
}

    // Clean up multiple spaces and trim
    optimized = optimized.replace(/\s+/g, ' ').trim();

    return {
    optimized,
    techniques: [...new Set(appliedTechniques)] // Remove duplicates
};
}

    // Advanced optimization for long queries
    advancedOptimize(query) {
    const { optimized, techniques } = this.optimizeWithPatterns(query);

    // For longer optimized text, apply additional restructuring
    if (optimized.length > 50) {
    // Extract key phrases based on common patterns
    const keyPhrases = [];

    // Common patterns that indicate important parts of a query
    const importantPatterns = [
    /\b(how|what|why|when|where|who|which)\b/i,  // Question words
    /\b(explain|describe|compare|analyze|define)\b/i,  // Command verbs
    /\b(difference|between|relationship|impact|effect|cause)\b/i,  // Relationship words
    /\b(example|instance|case|scenario)\b/i  // Example indicators
    ];

    // Find sentences or phrases containing important patterns
    const sentences = optimized.split(/[.!?]+/).filter(s => s.trim().length > 0);
    for (const sentence of sentences) {
    for (const pattern of importantPatterns) {
    if (pattern.test(sentence)) {
    keyPhrases.push(sentence.trim());
    break;
}
}
}

    // If we found key phrases, use them instead
    if (keyPhrases.length > 0) {
    return {
    optimized: keyPhrases.join(' ').trim(),
    techniques: [...techniques, 'Key phrase extraction']
};
}
}

    return { optimized, techniques };
}

    // Main method to optimize a query
    async optimizeQuery(query) {
    if (!query || typeof query !== 'string') {
    return {
    original: query || '',
    optimized: '',
    modelsUsed: [],
    originalTokens: 0,
    optimizedTokens: 0,
    techniques: []
};
}

    // Make sure models are initialized
    if (!this.isInitialized) {
    await this.initialize(progress => {
    // This would normally update UI progress but we're calling directly
});
}

    const original = query.trim();
    const originalTokens = this.countTokens(original);
    let modelsUsed = [...this.mlModelsUsed];
    let techniques = [];

    // First check for FAQ match
    const faqMatch = await this.findFaq(original);
    if (faqMatch) {
    if (this.models.embedder && !this.fallbackMode) {
    modelsUsed.push('Semantic FAQ matching');
} else {
    modelsUsed.push('Pattern-based FAQ matching');
}

    techniques.push('FAQ matching');
    const optimizedTokens = this.countTokens(faqMatch);

    return {
    original,
    optimized: faqMatch,
    modelsUsed,
    techniques,
    originalTokens,
    optimizedTokens,
    reduction: originalTokens - optimizedTokens,
    percentReduction: Math.round(((originalTokens - optimizedTokens) / originalTokens) * 100)
};
}

    // Apply pattern-based or advanced optimization
    let result;
    if (this.fallbackMode || original.length < 50) {
    modelsUsed.push('Pattern-based optimization');
    result = this.optimizeWithPatterns(original);
} else {
    modelsUsed.push('Advanced pattern-based optimization');
    result = this.advancedOptimize(original);
}

    const optimized = result.optimized;
    techniques = result.techniques;

    const optimizedTokens = this.countTokens(optimized);

    return {
    original,
    optimized,
    modelsUsed,
    techniques,
    originalTokens,
    optimizedTokens,
    reduction: originalTokens - optimizedTokens,
    percentReduction: Math.round(((originalTokens - optimizedTokens) / originalTokens) * 100)
};
}
}

    // Example queries for testing
    const exampleQueries = [
    "Could you please tell me what the weather is like today in New York?",
    "What is the capital of France?",
    "I'm wondering if you could explain the theory of relativity in detail?",
    "Please tell me what time it is right now if you don't mind.",
    "I would like to know how to bake a chocolate cake, what ingredients do I need and what are the steps to make it?",
    "Can you give me some recommendations for good books to read in the science fiction genre?",
    "How would I debug a memory leak in my JavaScript application and what tools should I use?",
    "I'm curious about the history of the United States, can you tell me about the major events and developments in the 19th century?",
    "What is the formula for calculating the area of a circle and how is it derived?",
    "Could you please explain the different types of cloud computing services available and their advantages and disadvantages?"
    ];

    // Initialize the optimizer
    const optimizer = new QueryOptimizer();

    // UI elements
    const queryInput = document.getElementById('query-input');
    const optimizeButton = document.getElementById('optimize-button');
    const resultContainer = document.getElementById('result-container');
    const originalQueryElement = document.getElementById('original-query');
    const optimizedQueryElement = document.getElementById('optimized-query');
    const originalTokensElement = document.getElementById('original-tokens');
    const optimizedTokensElement = document.getElementById('optimized-tokens');
    const tokenReductionElement = document.getElementById('token-reduction');
    const modelsListElement = document.getElementById('models-list');
    const statusMessage = document.getElementById('status-message');
    const exampleButtonsContainer = document.getElementById('example-buttons');
    const modelLoadingDiv = document.getElementById('model-loading');
    const mainContainerDiv = document.getElementById('main-container');
    const progressBar = document.getElementById('progress-bar');
    const loadingStatus = document.getElementById('loading-status');
    const fallbackNotice = document.getElementById('fallback-notice');

    // Add example buttons
    exampleQueries.forEach(query => {
    const button = document.createElement('button');
    button.className = 'example-button';
    button.textContent = query.length > 30 ? query.substring(0, 30) + '...' : query;
    button.addEventListener('click', () => {
    queryInput.value = query;
});
    exampleButtonsContainer.appendChild(button);
});

    // Add a random example query as placeholder
    queryInput.placeholder = exampleQueries[Math.floor(Math.random() * exampleQueries.length)];

    // Handle optimize button click
    optimizeButton.addEventListener('click', async () => {
    const query = queryInput.value.trim();
    if (!query) {
    alert('Please enter a query first!');
    return;
}

    // Show loading state
    optimizeButton.disabled = true;
    statusMessage.textContent = 'Optimizing query...';

    try {
    const result = await optimizer.optimizeQuery(query);

    // Display results
    originalQueryElement.textContent = result.original;
    optimizedQueryElement.textContent = result.optimized;
    originalTokensElement.textContent = result.originalTokens;
    optimizedTokensElement.textContent = result.optimizedTokens;
    tokenReductionElement.textContent =
    `${result.reduction} tokens (${result.percentReduction}%)`;

    // Clear and update models list
    modelsListElement.innerHTML = '';
    if (result.modelsUsed && result.modelsUsed.length > 0) {
    result.modelsUsed.forEach(model => {
    const div = document.createElement('div');
    div.textContent = `• ${model}`;
    modelsListElement.appendChild(div);
});
}

    if (result.techniques && result.techniques.length > 0) {
    const div = document.createElement('div');
    div.textContent = `• Techniques: ${result.techniques.join(', ')}`;
    modelsListElement.appendChild(div);
}

    resultContainer.style.display = 'block';
    statusMessage.textContent = `Optimization complete!`;

} catch (error) {
    console.error('Error optimizing query:', error);
    statusMessage.textContent = 'Error: ' + error.message;
} finally {
    optimizeButton.disabled = false;
}
});

    // Initialize models on page load
    window.addEventListener('DOMContentLoaded', async () => {
    try {
    // Check if Transformers.js is loaded
    if (!transformersLoaded) {
    fallbackNotice.textContent = "Using pattern-based optimization because Transformers.js could not be loaded.";
    fallbackNotice.style.display = 'block';
}

    await optimizer.initialize(progress => {
    progressBar.style.width = `${progress.progress}%`;
    loadingStatus.textContent = progress.stage;

    if (progress.progress >= 100) {
    setTimeout(() => {
    modelLoadingDiv.style.display = 'none';
    mainContainerDiv.style.display = 'block';

    if (optimizer.fallbackMode) {
    fallbackNotice.style.display = 'block';
}
}, 1000);
}
});
} catch (error) {
    console.error('Error initializing models:', error);
    loadingStatus.textContent = 'Error loading models. Using fallback mode.';
    setTimeout(() => {
    modelLoadingDiv.style.display = 'none';
    mainContainerDiv.style.display = 'block';
    fallbackNotice.style.display = 'block';
}, 1000);
}
});
