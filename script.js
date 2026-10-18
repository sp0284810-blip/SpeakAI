const micButton = document.getElementById("micButton");
const voiceStatus = document.querySelector(".voice-status p");
const speechTitle = document.querySelector(".speech-bubble b");
const speechText = document.querySelector(".speech-bubble p");
const girl = document.querySelector(".ai-girl");

const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;
let isListening = false;
let isSpeaking = false;
let currentMode = "conversation";
let recognitionReady = false;

const modes = {
    conversation: {
        title: "Daily Conversation",
        greeting: "Hi! I'm your AI English Coach. How was your day?"
    },
    introduction: {
        title: "Self Introduction",
        greeting: "Let's practice your self introduction. What is your name?"
    },
    interview: {
        title: "Interview Practice",
        greeting: "Welcome to interview practice. Please introduce yourself."
    },
    words: {
        title: "Useful Words & Phrases",
        greeting: "Let's learn useful English words. Can you tell me one word you know?"
    },
    confidence: {
        title: "Confidence Mode",
        greeting: "Don't worry about mistakes. Tell me, how are you today?"
    },
    daily: {
        title: "Daily Life Practice",
        greeting: "Let's talk about daily life. What did you do today?"
    }
};

// -------------------------
// SHOW STATUS
// -------------------------

function setStatus(message) {
    if (voiceStatus) voiceStatus.textContent = message;
}

function setSpeech(message) {
    if (speechText) speechText.textContent = message;
}

function stopAI() {
    if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
    }

    isSpeaking = false;

    if (girl) girl.classList.remove("speaking");
}

// -------------------------
// CHANGE PRACTICE MODE
// -------------------------

function changeMode(mode) {
    if (!modes[mode]) return;

    currentMode = mode;

    if (speechTitle) {
        speechTitle.textContent = modes[mode].title;
    }

    stopAI();
    setSpeech(modes[mode].greeting);
    speakAI(modes[mode].greeting);
}

function stopListening() {
    if (!recognition || !isListening) return;

    try {
        recognition.stop();
    } catch (error) {
        // Recognition may already have stopped.
    }
}

// -------------------------
// MICROPHONE SETUP
// -------------------------

function setupRecognition() {
    if (!SpeechRecognition) {
        setStatus(
            "Speech recognition is unavailable. Please use updated Chrome or Edge."
        );
        return false;
    }

    if (recognitionReady) return true;

    recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        isListening = true;

        if (micButton) micButton.classList.add("listening");

        setStatus("🎙️ Listening... Speak now.");
    };

    recognition.onresult = async (event) => {
        const result = event.results[event.resultIndex];
        const userSpeech = result[0].transcript.trim();

        if (!userSpeech) {
            setStatus("I couldn't hear that. Tap the mic and try again.");
            return;
        }

        isListening = false;

        if (micButton) micButton.classList.remove("listening");

        setStatus("🤔 Preparing your response...");
        setSpeech("You said: " + userSpeech);

        await talkToAI(userSpeech);
    };

    recognition.onerror = (event) => {
        isListening = false;

        if (micButton) micButton.classList.remove("listening");

        const messages = {
            "not-allowed":
                "Microphone blocked. Allow microphone access in browser settings.",
            "service-not-allowed":
                "Speech service blocked. Check browser permissions.",
            "no-speech":
                "No speech detected. Tap the mic and speak clearly.",
            "audio-capture":
                "Microphone not found. Check your microphone connection.",
            "network":
                "Speech service network error. Check your internet connection.",
            "aborted":
                "Listening stopped. Tap the mic when you're ready."
        };

        setStatus(
            messages[event.error] ||
            "Microphone error: " + event.error + ". Please try again."
        );
    };

    recognition.onend = () => {
        isListening = false;

        if (micButton) micButton.classList.remove("listening");
    };

    recognitionReady = true;
    return true;
}

// -------------------------
// MIC BUTTON CLICK
// -------------------------

if (micButton) {
    micButton.addEventListener("click", () => {
        if (isListening) {
            stopListening();
            setStatus("Listening stopped. Tap the mic to try again.");
            return;
        }

        // Stop AI voice before listening.
        stopAI();

        if (!setupRecognition()) return;

        setStatus("🎙️ Starting microphone...");

        try {
            recognition.start();
        } catch (error) {
            setStatus(
                "Please wait a moment, then tap the microphone again."
            );
        }
    });
}

// -------------------------
// SIMPLE ENGLISH COACH
// -------------------------

async function talkToAI(userSpeech) {
    const original = userSpeech.trim();
    const lower = original.toLowerCase();

    let feedback = "Good effort! Keep speaking English.";
    let better = original;
    let reply = "That's interesting!";
    let question = "Can you tell me more?";

    if (/^(hi|hello|hey)\b/i.test(lower)) {
        feedback = "Your greeting is correct.";
        reply = "Hello! It's nice to talk with you.";
        question = "How are you today?";
    } else if (
        lower.includes("my name is") ||
        lower.startsWith("i am ") ||
        lower.startsWith("i'm ")
    ) {
        feedback = "Good job introducing yourself.";
        reply = "Nice to meet you!";
        question = "What are you studying?";
    } else if (
        lower.includes("i am fine") ||
        lower.includes("i'm fine") ||
        lower.includes("i am good") ||
        lower.includes("i'm good")
    ) {
        feedback = "Your answer is understandable.";
        reply = "I'm glad to hear that.";
        question = "What did you do today?";
    } else if (
        lower.includes("college") ||
        lower.includes("student") ||
        lower.includes("study")
    ) {
        feedback = "Good! You're talking about your studies.";
        reply = "That's great. Keep working towards your goals.";
        question = "Which subject do you like the most?";
    } else if (
        lower.includes("thank you") ||
        lower.includes("thanks")
    ) {
        feedback = "Great! That's a polite expression.";
        reply = "You're welcome!";
        question = "What would you like to talk about next?";
    } else if (
        lower.includes("my hobby") ||
        lower.includes("hobbies")
    ) {
        feedback = "Good topic! You can also say, 'My hobbies are...'";
        reply = "Hobbies are a great topic to practise.";
        question = "What do you enjoy doing in your free time?";
    } else if (currentMode === "words") {
        feedback = "Let's build your vocabulary.";
        reply = "A useful word is 'confident'. It means believing in yourself.";
        question = "Can you make a sentence using the word confident?";
    } else if (currentMode === "introduction") {
        feedback = "Good attempt at your introduction.";
        reply = "You can introduce yourself by sharing your name and studies.";
        question = "What are your strengths?";
    } else if (currentMode === "interview") {
        feedback = "Good interview practice!";
        reply = "Try to answer clearly and confidently.";
        question = "Why should we select you?";
    } else if (currentMode === "confidence") {
        feedback = "Well done for speaking! Mistakes help you learn.";
        reply = "Take your time. You are improving with practice.";
        question = "Tell me one thing you are proud of.";
    } else if (
        lower.startsWith("what ") ||
        lower.startsWith("why ") ||
        lower.startsWith("how ") ||
        lower.startsWith("where ") ||
        lower.startsWith("when ")
    ) {
        feedback = "Good question!";
        reply = "Let's explore that together.";
        question = "Can you ask me another question in English?";
    } else if (
        lower.startsWith("i ") ||
        lower.startsWith("my ") ||
        lower.startsWith("today ")
    ) {
        feedback = "Your sentence is a good start.";
        reply = "Thank you for sharing that with me.";
        question = "Can you tell me a little more?";
    }

    showAIResponse(feedback, better, reply, question, original);
}

// -------------------------
// DISPLAY RESPONSE
// -------------------------

function showAIResponse(feedback, better, reply, question, userSpeech) {
    const displayText =
        "💡 " + feedback +
        "\n\n✨ Better: " + better +
        "\n\n" + reply +
        "\n\n❓ " + question;

    setSpeech(displayText);

    if (typeof window.addConversation === "function") {
        window.addConversation();
    }

    if (
        better.toLowerCase() !== userSpeech.toLowerCase() &&
        typeof window.addCorrectSentence === "function"
    ) {
        window.addCorrectSentence();
    }

    speakAI(reply + " " + question);
}

// -------------------------
// AI VOICE
// -------------------------

function speakAI(text) {
    if (!("speechSynthesis" in window)) {
        setStatus("AI voice is not supported in this browser.");
        return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();

    const selectedVoice =
        voices.find(voice =>
            /jenny|aria|zira|samantha|karen|hazel|susan/i.test(voice.name) &&
            /^en/i.test(voice.lang)
        ) ||
        voices.find(voice => /^en-US/i.test(voice.lang)) ||
        voices.find(voice => /^en/i.test(voice.lang));

    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
        isSpeaking = true;

        if (girl) girl.classList.add("speaking");

        setStatus("🗣️ AI is speaking...");
    };

    utterance.onend = () => {
        isSpeaking = false;

        if (girl) girl.classList.remove("speaking");

        setStatus("🎤 Your turn! Tap the mic and speak again.");
    };

    utterance.onerror = () => {
        isSpeaking = false;

        if (girl) girl.classList.remove("speaking");

        setStatus("AI voice stopped. Tap the mic to continue.");
    };

    window.speechSynthesis.speak(utterance);
}

// -------------------------
// QUICK ACCESS CARDS
// -------------------------

document.querySelectorAll(".quick-card").forEach(card => {
    card.addEventListener("click", () => {
        const text = card.textContent.toLowerCase();

        if (text.includes("daily conversation")) {
            changeMode("conversation");
        } else if (text.includes("self introduction")) {
            changeMode("introduction");
        } else if (text.includes("interview practice")) {
            changeMode("interview");
        } else if (text.includes("useful words")) {
            changeMode("words");
        } else if (text.includes("confidence mode")) {
            changeMode("confidence");
        }
    });
});

// -------------------------
// SIDEBAR BUTTONS
// -------------------------

const sidebarButtons = document.querySelectorAll(".sidebar > button");

sidebarButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
        sidebarButtons.forEach(item => item.classList.remove("active"));
        button.classList.add("active");

        switch (index) {
            case 0:
                stopAI();
                currentMode = "conversation";

                if (speechTitle) {
                    speechTitle.textContent = "AI English Coach";
                }

                setSpeech(
                    "Hi! I'm your English Coach. Tap the microphone and speak."
                );

                setStatus("🎤 Tap the microphone and speak.");
                break;

            case 1:
                changeMode("conversation");
                break;

            case 2:
                changeMode("introduction");
                break;

            case 3:
                changeMode("interview");
                break;

            case 4:
                changeMode("words");
                break;

            case 5:
                changeMode("confidence");
                break;

            case 6:
                stopAI();

                setSpeech(
                    "Settings: Use Chrome or Edge, allow microphone access, and keep your internet connection on for speech recognition."
                );

                setStatus(
                    "⚙️ Check your browser's microphone permission settings."
                );
                break;
        }
    });
});

// -------------------------
// INITIAL STATE
// -------------------------

if (speechTitle) {
    speechTitle.textContent = "AI English Coach";
}

setSpeech(
    "Hi! I'm your English Coach. Tap the microphone and speak."
);

setStatus("🎤 Tap the microphone and speak.");

// Check browser support without asking for microphone permission.
if (!SpeechRecognition) {
    setStatus(
        "Speech recognition is unavailable. Please use updated Chrome or Edge."
    );
}
