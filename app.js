let conversationHistory = [];

async function getAIResponse() {
    const userQuery = document.getElementById('userQuery').value.trim();
    const aiResponse = document.getElementById('aiResponse');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const buttonText = analyzeBtn.querySelector('.button-text');
    const loader = analyzeBtn.querySelector('.loader');

    if (!userQuery) {
        aiResponse.innerHTML = '<p class="error">Please enter a financial query to analyze.</p>';
        return;
    }

    buttonText.style.display = 'none';
    loader.style.display = 'block';
    analyzeBtn.disabled = true;

    try {
        const response = await fetch(`${CONFIG.API_URL}?key=${CONFIG.API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `As a financial expert, please provide a detailed analysis of the following query. Include:
                        1. Definition and explanation
                        2. Key concepts involved
                        3. Real-world examples or applications
                        4. Potential risks or considerations
                        5. Related financial terms
                        
                        Query: ${userQuery}
                        
                        Please format the response in a clear, structured way.`
                    }]
                }],
                generationConfig: {
                    temperature: CONFIG.TEMPERATURE,
                    maxOutputTokens: CONFIG.MAX_TOKENS,
                }
            })
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0].content) {
            const answer = data.candidates[0].content.parts[0].text;
            
            // Store in conversation history
            conversationHistory.push({
                query: userQuery,
                response: answer,
                timestamp: new Date().toISOString()
            });

            // Save to local storage
            saveHistory();

            // Format and display the response with better structure
            aiResponse.innerHTML = `
                <div class="response-container">
                    <h3>Financial Analysis:</h3>
                    <div class="response-content">
                        ${formatResponse(answer)}
                    </div>
                    <div class="response-footer">
                        <small>Analysis generated at ${new Date().toLocaleString()}</small>
                    </div>
                </div>
            `;
        } else {
            throw new Error('Invalid response from API');
        }
    } catch (error) {
        console.error('Error:', error);
        aiResponse.innerHTML = `
            <p class="error">
                Sorry, there was an error analyzing your financial query. Please try again later.
                <br>
                <small>Error details: ${error.message}</small>
            </p>
        `;
    } finally {
        // Reset button state
        buttonText.style.display = 'block';
        loader.style.display = 'none';
        analyzeBtn.disabled = false;
    }
}

function formatResponse(text) {
    // Enhanced formatting for financial analysis
    return text
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
            // Format headings
            if (line.match(/^\d\./)) {
                return `<h4 class="analysis-heading">${line}</h4>`;
            }
            // Format lists
            if (line.match(/^[-•]/)) {
                return `<li>${line.substring(1)}</li>`;
            }
            // Format examples
            if (line.toLowerCase().includes('example:')) {
                return `<div class="example-block">${line}</div>`;
            }
            // Regular paragraphs
            return `<p>${line}</p>`;
        })
        .join('');
}

// Add event listener for enter key
document.getElementById('userQuery').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && e.ctrlKey) {
        getAIResponse();
    }
});

// Save conversation history to local storage
function saveHistory() {
    localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));
}

// Update the displayHistory function
function displayHistory() {
    const historySection = document.getElementById('history');
    if (!historySection) return;

    const historyList = historySection.querySelector('.history-list');
    const filter = document.getElementById('historyFilter').value;

    const filteredHistory = filter === 'all' 
        ? conversationHistory 
        : conversationHistory.filter(item => detectCategory(item.query) === filter);

    const historyHtml = filteredHistory
        .map((item, index) => `
            <div class="history-item" data-category="${detectCategory(item.query)}">
                <div class="history-meta">
                    <span class="history-category">${formatCategory(detectCategory(item.query))}</span>
                    <span class="history-time">${new Date(item.timestamp).toLocaleString()}</span>
                </div>
                <div class="history-query">
                    <strong>Query:</strong> ${item.query}
                </div>
                <div class="history-response">
                    ${formatResponse(item.response)}
                </div>
                <div class="history-actions">
                    <button onclick="rerunAnalysis(${index})">Rerun Analysis</button>
                    <button onclick="deleteHistoryItem(${index})">Delete</button>
                </div>
            </div>
        `)
        .join('');

    historyList.innerHTML = historyHtml || '<p class="no-history">No analysis history yet</p>';
}

// Add these new functions
function detectCategory(query) {
    const queryLower = query.toLowerCase();
    if (queryLower.includes('market') || queryLower.includes('trend')) return 'market';
    if (queryLower.includes('fundamental') || queryLower.includes('ratio')) return 'fundamental';
    if (queryLower.includes('risk') || queryLower.includes('assessment')) return 'risk';
    if (queryLower.includes('strategy') || queryLower.includes('investment')) return 'strategy';
    return 'other';
}

function formatCategory(category) {
    const categories = {
        market: 'Market Analysis',
        fundamental: 'Fundamental Analysis',
        risk: 'Risk Assessment',
        strategy: 'Investment Strategy',
        other: 'General Analysis'
    };
    return categories[category] || 'General Analysis';
}

function filterHistory() {
    displayHistory();
}

function clearHistory() {
    if (confirm('Are you sure you want to clear all analysis history?')) {
        conversationHistory = [];
        localStorage.removeItem('conversationHistory');
        displayHistory();
    }
}

function rerunAnalysis(index) {
    const item = conversationHistory[index];
    if (item) {
        const userQuery = document.getElementById('userQuery');
        userQuery.value = item.query;
        showSection('home');
        userQuery.scrollIntoView({ behavior: 'smooth' });
        getAIResponse();
    }
}

function deleteHistoryItem(index) {
    if (confirm('Are you sure you want to delete this analysis?')) {
        conversationHistory.splice(index, 1);
        saveHistory();
        displayHistory();
    }
}

// Update navigation handling
document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const section = this.getAttribute('href').substring(1);
        
        // Update active state
        document.querySelectorAll('nav a').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        
        // Hide all sections
        document.querySelectorAll('main > section').forEach(s => {
            s.style.display = 'none';
        });
        
        // Show selected section
        if (section === 'home') {
            document.getElementById('hero').style.display = 'block';
            document.getElementById('query-section').style.display = 'block';
            document.getElementById('response-section').style.display = 'block';
            document.getElementById('features').style.display = 'block';
        } else {
            document.getElementById(section).style.display = 'block';
        }
        
        // Initialize decoder if needed
        if (section === 'decoder') {
            initializeDecoder();
        }
    });
});

// Initialize
document.addEventListener('DOMContentLoaded', loadHistory);

// Analysis template functions
function setAnalysisQuery(type) {
    const queryMap = {
        market: "Provide a comprehensive market analysis including current trends, key indicators, and market sentiment.",
        fundamental: "Analyze key financial ratios and fundamental indicators for investment decision making.",
        risk: "Assess various types of investment risks and provide risk management strategies.",
        strategy: "Explain different investment strategies and their applications in current market conditions."
    };

    const userQuery = document.getElementById('userQuery');
    userQuery.value = queryMap[type] || '';
    
    // Switch to home view and scroll to query
    showSection('home');
    userQuery.scrollIntoView({ behavior: 'smooth' });
}

function analyzeTemplate(type) {
    const templates = {
        stock: "Provide a complete stock analysis framework including technical and fundamental factors to consider.",
        portfolio: "Create a comprehensive portfolio analysis checklist and diversification strategy.",
        trend: "Analyze current market trends and their implications for different asset classes.",
        risk: "Develop a risk assessment framework for investment decision making."
    };

    const userQuery = document.getElementById('userQuery');
    userQuery.value = templates[type] || '';
    
    // Switch to home view and scroll to query
    showSection('home');
    userQuery.scrollIntoView({ behavior: 'smooth' });
}

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('main > section').forEach(s => {
        s.style.display = 'none';
    });
    
    // Show selected section
    if (sectionId === 'home') {
        document.getElementById('hero').style.display = 'block';
        document.getElementById('query-section').style.display = 'block';
        document.getElementById('response-section').style.display = 'block';
        document.getElementById('features').style.display = 'block';
    } else {
        document.getElementById(sectionId).style.display = 'block';
    }

    // Update navigation active state
    document.querySelectorAll('nav a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
        }
    });
}

// Update the loadHistory function
function loadHistory() {
    const saved = localStorage.getItem('conversationHistory');
    if (saved) {
        conversationHistory = JSON.parse(saved);
        displayHistory();
    }
}

// Handle decoder functionality
function initializeDecoder() {
    const termSearch = document.getElementById('termSearch');
    const termCards = document.querySelectorAll('.term-card');

    termSearch?.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();

        termCards.forEach(card => {
            const term = card.querySelector('h3').textContent.toLowerCase();
            const description = card.querySelector('p').textContent.toLowerCase();
            const category = card.getAttribute('data-category').toLowerCase();

            if (term.includes(searchTerm) || 
                description.includes(searchTerm) || 
                category.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
} 
// Dark/Light Mode Toggle
const themeToggle = document.getElementById("theme-toggle");
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  themeToggle.textContent = document.body.classList.contains("dark-mode") ? "Light Mode" : "Dark Mode";
});