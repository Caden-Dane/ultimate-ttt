/*
 * JavaScript powering the Dallas Weather AI application.
 *
 * This script fetches a 7‑day forecast for Dallas, Texas from the free
 * Open‑Meteo API and displays it in a set of cards. It also implements a
 * simple chat interface. When a user asks a question about the weather, the
 * script either uses a rule‑based responder or (optionally) calls OpenAI's
 * chat completion API if a key has been provided. All times are based on
 * the America/Chicago timezone.
 */

// === Configuration ===
// Coordinates for Dallas, Texas
const LATITUDE = 32.7767;
const LONGITUDE = -96.7970;
// Desired timezone for the forecast
const TIMEZONE = 'America/Chicago';
// Hourly variables to request from the Open‑Meteo API
const HOURLY_VARS = 'temperature_2m,precipitation_probability,wind_speed_10m';

// Optional OpenAI integration. To enable, set USE_OPENAI to true and
// specify your API key in the OPENAI_API_KEY constant. Leaving USE_OPENAI
// false will make the assistant rely on a rule‑based responder instead.
const USE_OPENAI = false;
const OPENAI_API_KEY = '';
const OPENAI_MODEL = 'gpt-3.5-turbo';

// Chat history used for OpenAI integration. Only used when USE_OPENAI=true.
const chatHistory = [];

// Global container for the 7‑day weather summary.
let weatherSummary = [];

// Elements
const forecastContainer = document.getElementById('forecast-table');
const messagesContainer = document.getElementById('messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-btn');

// Event listeners
sendButton.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => {
    // Submit on Enter keypress without requiring explicit click
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});

// Fetch weather data on page load
window.addEventListener('load', () => {
    fetchWeather();
});

/**
 * Fetches hourly weather data for Dallas from the Open‑Meteo API and
 * processes it into a daily summary. When complete, it renders the
 * forecast cards and sends an initial greeting from the assistant.
 */
async function fetchWeather() {
    const apiUrl = new URL('https://api.open-meteo.com/v1/forecast');
    apiUrl.searchParams.set('latitude', LATITUDE);
    apiUrl.searchParams.set('longitude', LONGITUDE);
    apiUrl.searchParams.set('timezone', TIMEZONE);
    apiUrl.searchParams.set('hourly', HOURLY_VARS);
    apiUrl.searchParams.set('past_hours', 0);
    apiUrl.searchParams.set('forecast_days', 7);

    try {
        const response = await fetch(apiUrl.toString());
        const data = await response.json();
        // Build a daily summary from the hourly data
        weatherSummary = computeDailySummary(data.hourly);
        renderForecast(weatherSummary);
        addMessage('ai',
            'Hello! I\'m your Dallas weather assistant. I\'ve loaded a 7‑day forecast. Ask me anything about the upcoming weather!'
        );
    } catch (error) {
        console.error('Error fetching weather data:', error);
        addMessage('ai', 'Sorry, I couldn\'t retrieve the weather data. Please try again later.');
    }
}

/**
 * Converts hourly forecast data into a per‑day summary including the high
 * and low temperatures, average precipitation probability and average
 * wind speed.
 *
 * @param {Object} hourly The hourly object returned by the API.
 * @returns {Array<Object>} An array of up to 7 daily summaries.
 */
function computeDailySummary(hourly) {
    const summary = [];
    const times = hourly.time;
    const temps = hourly.temperature_2m;
    const precip = hourly.precipitation_probability;
    const wind = hourly.wind_speed_10m;
    const days = {};
    for (let i = 0; i < times.length; i++) {
        const date = times[i].split('T')[0];
        if (!days[date]) {
            days[date] = { temps: [], precip: [], wind: [] };
        }
        days[date].temps.push(temps[i]);
        days[date].precip.push(precip[i]);
        days[date].wind.push(wind[i]);
    }
    for (const date of Object.keys(days)) {
        const tempsArr = days[date].temps;
        const precipArr = days[date].precip;
        const windArr = days[date].wind;
        summary.push({
            date,
            high: Math.max(...tempsArr).toFixed(1),
            low: Math.min(...tempsArr).toFixed(1),
            precipitationAvg: (precipArr.reduce((a, b) => a + b, 0) / precipArr.length).toFixed(0),
            windAvg: (windArr.reduce((a, b) => a + b, 0) / windArr.length).toFixed(1),
        });
    }
    summary.sort((a, b) => new Date(a.date) - new Date(b.date));
    return summary.slice(0, 7);
}

/**
 * Renders the 7‑day forecast as a set of cards in the forecast container.
 *
 * @param {Array<Object>} summary The daily summaries to render.
 */
function renderForecast(summary) {
    forecastContainer.innerHTML = '';
    summary.forEach((day) => {
        const card = document.createElement('div');
        card.className = 'forecast-card';
        const dateObj = new Date(day.date);
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        const label = dateObj.toLocaleDateString('en-US', options);
        card.innerHTML = `
            <h3>${label}</h3>
            <p>High: ${day.high}°F</p>
            <p>Low: ${day.low}°F</p>
            <p>Precip: ${day.precipitationAvg}%</p>
            <p>Wind: ${day.windAvg} mph</p>
        `;
        forecastContainer.appendChild(card);
    });
}

/**
 * Adds a chat message to the UI. Each message is appended to the
 * messages container and scrolled into view.
 *
 * @param {string} sender Either "user" or "ai".
 * @param {string} text The content of the message.
 */
function addMessage(sender, text) {
    const msg = document.createElement('div');
    msg.className = `message ${sender}`;
    msg.textContent = text;
    messagesContainer.appendChild(msg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Handles the user submitting a question. It adds the user message,
 * generates a response (rule‑based or via OpenAI), and then adds the
 * assistant's reply.
 */
async function handleSend() {
    const text = userInput.value.trim();
    if (!text) return;
    addMessage('user', text);
    userInput.value = '';
    const reply = await getResponse(text);
    addMessage('ai', reply);
}

/**
 * Determines whether to use OpenAI or the rule‑based responder. If
 * OpenAI integration is enabled and a key is present, it calls
 * callOpenAI(); otherwise, it falls back to ruleBasedAnswer().
 *
 * @param {string} message The user message.
 * @returns {Promise<string>} The assistant's reply.
 */
async function getResponse(message) {
    if (USE_OPENAI && OPENAI_API_KEY) {
        return await callOpenAI(message);
    }
    return ruleBasedAnswer(message);
}

/**
 * Provides canned responses based on simple keyword detection and the
 * available forecast data. This function is intentionally
 * straightforward to demonstrate how a rule‑based AI can work without
 * external services.
 *
 * @param {string} message The user message.
 * @returns {string} A response based on the detected keywords.
 */
function ruleBasedAnswer(message) {
    const msg = message.toLowerCase();
    const today = new Date();
    // Determine if the user is asking about a particular day (today, tomorrow or named day)
    let targetIndex;
    if (msg.includes('today')) {
        targetIndex = 0;
    } else if (msg.includes('tomorrow')) {
        targetIndex = 1;
    } else {
        const weekDays = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
        for (let i = 0; i < weekDays.length; i++) {
            if (msg.includes(weekDays[i])) {
                const currentDay = today.getDay();
                // Calculate distance to requested day
                let diff = (i - currentDay + 7) % 7;
                targetIndex = diff;
                break;
            }
        }
    }
    // If a specific day is requested and available in the forecast
    if (typeof targetIndex !== 'undefined' && weatherSummary[targetIndex]) {
        const day = weatherSummary[targetIndex];
        return `On ${formatDate(day.date)}, the high will be around ${day.high}°F and the low around ${day.low}°F. The average chance of precipitation is ${day.precipitationAvg}% with winds averaging ${day.windAvg} mph.`;
    }
    // Check for temperature inquiries
    if (msg.includes('temperature') || msg.includes('hot') || msg.includes('cold')) {
        const highs = weatherSummary.map((d) => parseFloat(d.high));
        const lows = weatherSummary.map((d) => parseFloat(d.low));
        const highMin = Math.min(...highs).toFixed(1);
        const highMax = Math.max(...highs).toFixed(1);
        const lowMin = Math.min(...lows).toFixed(1);
        const lowMax = Math.max(...lows).toFixed(1);
        return `Over the next week, daytime highs range from ${highMin}°F to ${highMax}°F and nighttime lows from ${lowMin}°F to ${lowMax}°F.`;
    }
    // Check for precipitation inquiries
    if (msg.includes('precip') || msg.includes('rain') || msg.includes('umbrella')) {
        const precips = weatherSummary.map((d) => parseInt(d.precipitationAvg, 10));
        const minP = Math.min(...precips);
        const maxP = Math.max(...precips);
        return `Rain chances over the next week range from ${minP}% to ${maxP}%. Overall, expect mostly dry conditions with only occasional showers.`;
    }
    // Check for wind inquiries
    if (msg.includes('wind') || msg.includes('breeze')) {
        const winds = weatherSummary.map((d) => parseFloat(d.windAvg));
        const minW = Math.min(...winds).toFixed(1);
        const maxW = Math.max(...winds).toFixed(1);
        return `Average wind speeds in the upcoming week will be between ${minW} mph and ${maxW} mph.`;
    }
    // Generic forecast request
    if (msg.includes('forecast') || msg.includes('weather')) {
        const todayInfo = weatherSummary[0];
        return `Today, ${formatDate(todayInfo.date)}, expect a high around ${todayInfo.high}°F and a low around ${todayInfo.low}°F. There is about a ${todayInfo.precipitationAvg}% chance of precipitation with winds near ${todayInfo.windAvg} mph.`;
    }
    // Fallback response
    return 'I\'m sorry, I don\'t have information on that topic. Please ask about temperature, rain, wind, or a specific day.';
}

/**
 * Formats a date string (YYYY‑MM‑DD) into a human friendly form like
 * "Monday, July 21".
 *
 * @param {string} dateStr ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Sends the user message and context to OpenAI's Chat Completion API. The
 * weather summary is provided in the system prompt so the model can
 * accurately answer questions about Dallas weather. Returns a response
 * string or an error message.
 *
 * NOTE: To use this function, set USE_OPENAI=true and supply your
 * OPENAI_API_KEY. Without a key, the fetch will fail. This call
 * requires network access and is subject to CORS restrictions when hosted
 * on GitHub Pages.
 *
 * @param {string} message The user message
 * @returns {Promise<string>} The assistant's reply
 */
async function callOpenAI(message) {
    // Build the system prompt summarizing the 7‑day forecast
    const systemMessage = {
        role: 'system',
        content: `You are a helpful assistant specialized in Dallas, Texas weather. Use the following 7‑day forecast (in Fahrenheit) as context: ${JSON.stringify(weatherSummary)}. Answer the user\'s questions clearly and concisely.`,
    };
    // Build the request body
    const body = {
        model: OPENAI_MODEL,
        messages: [systemMessage, ...chatHistory, { role: 'user', content: message }],
        temperature: 0.7,
    };
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify(body),
        });
        const result = await response.json();
        const content = result.choices && result.choices[0]?.message?.content?.trim();
        if (!content) {
            throw new Error('No content returned from OpenAI');
        }
        // Update chat history for context
        chatHistory.push({ role: 'user', content: message });
        chatHistory.push({ role: 'assistant', content });
        return content;
    } catch (error) {
        console.error('OpenAI API error:', error);
        return 'Sorry, there was an error contacting the AI service.';
    }
}