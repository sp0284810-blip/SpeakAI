let conversations =
    Number(
        localStorage.getItem("conversations")
    ) || 0;

let correctSentences =
    Number(
        localStorage.getItem("correctSentences")
    ) || 0;


/* =========================
   ADD CONVERSATION
========================= */

function addConversation() {

    conversations++;

    localStorage.setItem(
        "conversations",
        conversations
    );

    updateProgress();
}


/* =========================
   ADD CORRECT SENTENCE
========================= */

function addCorrectSentence() {

    correctSentences++;

    localStorage.setItem(
        "correctSentences",
        correctSentences
    );

    updateProgress();
}


/* =========================
   UPDATE PROGRESS PAGE
========================= */

function updateProgress() {

    const conversationCount =
        document.getElementById(
            "conversationCount"
        );

    const correctCount =
        document.getElementById(
            "correctCount"
        );

    if (conversationCount) {

        conversationCount.textContent =
            conversations;
    }

    if (correctCount) {

        correctCount.textContent =
            correctSentences;
    }
}


/* =========================
   LOAD SAVED PROGRESS
========================= */

function loadProgress() {

    conversations =
        Number(
            localStorage.getItem(
                "conversations"
            )
        ) || 0;

    correctSentences =
        Number(
            localStorage.getItem(
                "correctSentences"
            )
        ) || 0;

    updateProgress();
}


loadProgress();
window.addConversation = addConversation;
window.addCorrectSentence = addCorrectSentence;