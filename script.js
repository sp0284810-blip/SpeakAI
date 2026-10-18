
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
let conversation = [];

const modes = {
    conversation: {
        title: "Daily Conversation",
        greeting: "Hi! I'm your AI English Coach. How was your day?",
        prompt: "Have a natural everyday English conversation."
    },
    introduction: {
        title: "Self Introduction",
        greeting: "Let's practice your self introduction. What is your name?",
        prompt: "Help the learner practice a self introduction."
    },
    interview: {
        title: "Interview Practice",
        greeting: "Welcome to interview practice. Please introduce yourself.",
        prompt: "Act as a friendly interviewer and practise job interview questions."
    },
    words: {
        title: "Useful Words & Phrases",
        greeting: "Let's learn useful English words. What word would you like to learn?",
        prompt: "Teach useful English words with simple meanings and example sentences."
    },
    confidence: {
        title: "Confidence Mode",
        greeting: "Don't worry about mistakes. How are you today?",
        prompt: "Help the learner build confidence speaking English. Be patient and encouraging."
    },
    daily: {
        title: "Daily Life Practice",
        greeting: "Let's talk about daily life. What did you do today?",
        prompt: "Practise simple English conversations about daily life."
    }
};

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

function changeMode(mode) {
    if (!modes[mode]) return;

    currentMode = mode;
    conversation = [];

    if (speechTitle) {
        speechTitle.textContent = modes[mode].title;
    }

    stopAI();
    setSpeech(modes[mode].greeting);
    speakAI(modes[mode].greeting);
}

function setupRecognition() {
    if (!SpeechRecognition) {
        setStatus("Please use updated Chrome or Edge for voice recognition.");
        return false;
    }

    if (recognition) return true;

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
        const userSpeech =
            event.results[event.resultIndex][0].transcript.trim();

        isListening = false;
        if (micButton) micButton.classList.remove("listening");

        if (!userSpeech) {
            setStatus("I couldn't hear you. Please try again.");
            return;
        }

        setSpeech("You said: " + userSpeech);
        await talkToAI(userSpeech);
    };

    recognition.onerror = (event) => {
        isListening = false;
        if (micButton) micButton.classList.remove("listening");

        const errors = {
            "not-allowed": "Please allow microphone access in your browser.",
            "no-speech": "No speech detected. Tap the mic and try again.",
            "network": "Speech recognition network error. Check your internet.",
            "audio-capture": "Microphone not found. Check your microphone."
        };

        setStatus(errors[event.error] || "Microphone error. Please try again.");
    };

    recognition.onend = () => {
        isListening = false;
        if (micButton) micButton.classList.remove("listening");
    };

    return true;
}

if (micButton) {
    micButton.addEventListener("click", () => {
        if (isListening) {
            try {
                recognition.stop();
            } catch (error) {
                console.log(error);
            }
            return;
        }

        stopAI();

        if (!setupRecognition()) return;

        try {
            recognition.start();
        } catch (error) {
            setStatus("Please wait a moment and tap the mic again.");
        }
    });
}

async function talkToAI(userSpeech) {
    const original = userSpeech.trim();
    if (!original) return;

    conversation.push({
        role: "user",
        content: original
    });

    setStatus("🤔 Thinking...");

    try {
        const messages = conversation.slice(-10);

        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages,
                mode: currentMode
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "AI request failed");
        }

        const answer = data.reply;

        if (!answer) {
            throw new Error("The AI returned an empty reply.");
        }

        conversation.push({
            role: "assistant",
            content: answer
        });

        showAIResponse(answer, original);

    } catch (error) {
        console.error("SpeakAI error:", error);

        conversation.pop();

        setSpeech(
            "Sorry, I couldn't connect to the AI. Please try again."
        );

        setStatus(
            "❌ AI connection failed. Check the API key and Vercel deployment."
        );
    }
}

function showAIResponse(answer, userSpeech) {
    setSpeech(answer);

    if (typeof window.addConversation === "function") {
        window.addConversation();
    }

    // Count a correction only when the AI explicitly suggests one.
    if (
        /better sentence|correct sentence|more natural|correction:/i.test(answer) &&
        typeof window.addCorrectSentence === "function"
    ) {
        window.addCorrectSentence();
    }

    speakAI(answer);
}

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

    if (selectedVoice) utterance.voice = selectedVoice;

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

// Quick practice cards
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
        } else if (text.includes("daily life")) {
            changeMode("daily");
        }
    });
});

// Sidebar navigation
const sidebarButtons = document.querySelectorAll(".sidebar > button");

sidebarButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
        sidebarButtons.forEach(item => item.classList.remove("active"));
        button.classList.add("active");

        switch (index) {
            case 0:
                stopAI();
                currentMode = "conversation";
                conversation = [];
                if (speechTitle) speechTitle.textContent = "AI English Coach";
                setSpeech("Hi! I'm your English Coach. Tap the microphone and speak.");
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
                    "Settings: Use Chrome or Edge, allow microphone access, and keep your internet connection on."
                );
                setStatus("⚙️ Check your browser microphone permissions.");
                break;
        }
    });
});

// Initial screen
if (speechTitle) speechTitle.textContent = "AI English Coach";

setSpeech("Hi! I'm your English Coach. Tap the microphone and speak.");
setStatus("🎤 Tap the microphone and speak.");

if (!SpeechRecognition) {
    setStatus("Please use updated Chrome or Edge for voice recognition.");
}
