const CONFIG = {
    API_KEY: 'AIzaSyCxFIEz7DoHg-iMEefta6UDImCoRuEJ2B8',
    API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    MAX_TOKENS: 1000,
    TEMPERATURE: 0.7
};

// Validate configuration
(function validateConfig() {
    if (CONFIG.API_KEY.startsWith('AIza')) {
        // Valid key format
        console.log('API key format valid');
    } else {
        console.error('Invalid API key format');
        document.getElementById('aiResponse').innerHTML = `
            <p class="error">
                Invalid API key. Please get a valid API key from Google AI Studio.
            </p>
        `;
    }
})(); 