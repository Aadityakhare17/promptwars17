document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Chat Assistant Logic
    const chatWindow = document.getElementById('chat-window');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const quickBtns = document.querySelectorAll('.quick-btn');

    // Simple keyword-based responses
    const botResponses = {
        'pm': 'The current Prime Minister of India is Narendra Modi, representing the Bharatiya Janata Party (BJP). He assumed office for his third consecutive term in 2024.',
        'prime minister': 'The current Prime Minister of India is Narendra Modi, representing the Bharatiya Janata Party (BJP). He assumed office for his third consecutive term in 2024.',
        'president': 'The current President of India is Droupadi Murmu. She assumed office on July 25, 2022, and is the first person belonging to a tribal community to hold the office.',
        'lok sabha': 'The Lok Sabha (House of the People) currently has 543 elected seats. It is the lower house of India\'s bicameral Parliament.',
        'rajya sabha': 'The Rajya Sabha (Council of States) has a maximum capacity of 250 members. Currently, it has 245 members, of which 233 are elected by state and territorial legislatures, and 12 are appointed by the President.',
        'parties': 'India has a multi-party system. Major national parties include the Bharatiya Janata Party (BJP), Indian National Congress (INC), and Aam Aadmi Party (AAP). There are also many powerful regional parties like TMC in West Bengal, DMK in Tamil Nadu, and YSRCP in Andhra Pradesh.',
        'states': 'Political dynamics vary greatly by state. For example, BJP holds power in states like Uttar Pradesh, Gujarat, and Madhya Pradesh. Congress governs states like Karnataka and Telangana. Regional parties dominate states like West Bengal (TMC), Tamil Nadu (DMK), and Kerala (LDF).',
        'seat': 'The Indian Parliament consists of the Lok Sabha (543 seats) and the Rajya Sabha (245 seats).',
        'current': 'Currently in 2026, major state assembly elections are scheduled or ongoing in states such as West Bengal, Tamil Nadu, Kerala, Assam, and Puducherry. Always verify exact polling dates with the ECI website!',
        'ongoing': 'Currently in 2026, major state assembly elections are scheduled or ongoing in states such as West Bengal, Tamil Nadu, Kerala, Assam, and Puducherry. Always verify exact polling dates with the ECI website!',
        'upcoming': 'Lok Sabha elections occur every 5 years (upcoming in 2029, 2034, 2039, 2044). Rajya Sabha elections happen every 2 years for one-third of its members (upcoming in 2026, 2028, 2030, 2032, 2034... up to 2046).',
        'future': 'Lok Sabha elections occur every 5 years (upcoming in 2029, 2034, 2039, 2044). Rajya Sabha elections happen every 2 years for one-third of its members (upcoming in 2026, 2028, 2030, 2032, 2034... up to 2046).',
        '2047': 'Lok Sabha elections will happen in 2044, and Rajya Sabha elections in 2046. By 2047, India will celebrate 100 years of independence, marking a historic milestone for the world\'s largest democracy!',
        'schedule': 'Lok Sabha elections occur every 5 years (upcoming in 2029, 2034, 2039, 2044). Rajya Sabha elections happen every 2 years for one-third of its members (upcoming in 2026, 2028, 2030, 2032, 2034... up to 2046).',
        'register': 'You can register to vote online through the NVSP portal, by mail, or in person at your Electoral Registration Officer. Would you like me to find the specific deadline for your state?',
        'absentee': 'In India, postal ballots (similar to absentee voting) are available to specific groups like service voters, election duty staff, persons with disabilities, and senior citizens above 85 years.',
        'bring': 'You must bring your Voter ID (EPIC card). If you don\'t have it, you can bring other approved ID like Aadhaar card, PAN card, Driving License, or Passport.',
        'where': 'You can find your polling booth by visiting the Election Commission of India (ECI) website or using the Voter Helpline App.',
        'hello': 'Namaste! I am your Indian Election Guide Assistant. You can ask me about the PM, President, Lok Sabha seats, political parties, current elections, future schedules up to 2047, or how to register to vote!',
        'default': "That's a great question. While I don't have the specific answer right now, I highly recommend checking the Election Commission of India (ECI) website for the most accurate information. You can ask me about Lok Sabha, Rajya Sabha, upcoming schedules, or the PM!"
    };

    function addMessage(text, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(isUser ? 'user-message' : 'bot-message');
        messageDiv.textContent = text;
        chatWindow.appendChild(messageDiv);
        
        // Scroll to bottom
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    // Replace this with your actual Gemini API Key
    const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    async function fetchGeminiResponse(prompt) {
        if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
            // Fallback to local bot if API key is not set
            const lowerInput = prompt.toLowerCase();
            for (const key in botResponses) {
                if (key !== 'default' && lowerInput.includes(key)) {
                    return botResponses[key];
                }
            }
            return "Please configure the Gemini API key in script.js to get real-time answers. For now, I can only answer basic queries about the PM, President, Lok Sabha, and Voting Registration.";
        }

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `You are an Indian Election Expert AI Assistant for 'DemocracyGuide'. The user is asking: "${prompt}". Answer concisely, accurately, and politely in 2-3 sentences max.`
                        }]
                    }]
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                if (response.status === 429) {
                    return "Sorry, your Gemini API key has exceeded its quota limit. Please check your billing details or wait a bit before trying again.";
                }
                console.error("API Error:", data);
                return `API Error: ${data.error?.message || response.statusText}`;
            }

            if (data.candidates && data.candidates.length > 0) {
                return data.candidates[0].content.parts[0].text;
            } else {
                return "I couldn't fetch an answer right now. Please try again later.";
            }
        } catch (error) {
            console.error('Error fetching from Gemini:', error);
            return "There was a network error connecting to my AI brain. Please check your internet connection.";
        }
    }

    async function handleSend() {
        const text = chatInput.value.trim();
        if (text === '') return;

        // Add user message
        addMessage(text, true);
        chatInput.value = '';

        // Show typing indicator
        const typingId = 'typing-' + Date.now();
        const typingDiv = document.createElement('div');
        typingDiv.classList.add('message', 'bot-message');
        typingDiv.id = typingId;
        typingDiv.innerHTML = '<i class="fa-solid fa-ellipsis fa-fade"></i> Thinking...';
        chatWindow.appendChild(typingDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;

        // Fetch response from Gemini
        const responseText = await fetchGeminiResponse(text);
        
        // Remove typing indicator and add real response
        document.getElementById(typingId).remove();
        addMessage(responseText, false);
    }

    // Event listeners for sending messages
    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    });

    // Quick question buttons
    quickBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const text = btn.textContent;
            addMessage(text, true);
            
            // Show typing indicator
            const typingId = 'typing-' + Date.now();
            const typingDiv = document.createElement('div');
            typingDiv.classList.add('message', 'bot-message');
            typingDiv.id = typingId;
            typingDiv.innerHTML = '<i class="fa-solid fa-ellipsis fa-fade"></i> Thinking...';
            chatWindow.appendChild(typingDiv);
            chatWindow.scrollTop = chatWindow.scrollHeight;

            // Fetch response from Gemini
            const responseText = await fetchGeminiResponse(text);
            
            // Remove typing indicator and add real response
            document.getElementById(typingId).remove();
            addMessage(responseText, false);
        });
    });

    // Check Status Button Demo
    const statusBtn = document.querySelector('.check-status-btn');
    if (statusBtn) {
        statusBtn.addEventListener('click', function() {
            const originalText = this.textContent;
            this.textContent = 'Checking...';
            this.style.opacity = '0.7';
            
            setTimeout(() => {
                this.textContent = 'Status: Verified';
                this.style.background = '#10b981'; // Green color
                this.style.color = 'white';
                this.style.opacity = '1';
                this.style.borderColor = '#10b981';
                
                setTimeout(() => {
                    this.textContent = originalText;
                    this.style.background = '';
                    this.style.color = '';
                    this.style.borderColor = '';
                }, 3000);
            }, 1000);
        });
    }

    // Flashcard Logic
    const flashcards = document.querySelectorAll('.flashcard');
    let currentCardIndex = 0;
    
    if(flashcards.length > 0) {
        // Show first card
        flashcards[0].classList.add('active');
        
        // Flip logic
        flashcards.forEach(card => {
            card.addEventListener('click', () => {
                card.classList.toggle('flipped');
            });
        });

        // Navigation
        const prevBtn = document.getElementById('prev-card');
        const nextBtn = document.getElementById('next-card');

        if(prevBtn && nextBtn) {
            prevBtn.addEventListener('click', () => {
                flashcards[currentCardIndex].classList.remove('active');
                flashcards[currentCardIndex].classList.remove('flipped');
                currentCardIndex = (currentCardIndex - 1 + flashcards.length) % flashcards.length;
                flashcards[currentCardIndex].classList.add('active');
            });

            nextBtn.addEventListener('click', () => {
                flashcards[currentCardIndex].classList.remove('active');
                flashcards[currentCardIndex].classList.remove('flipped');
                currentCardIndex = (currentCardIndex + 1) % flashcards.length;
                flashcards[currentCardIndex].classList.add('active');
            });
        }
    }
});
