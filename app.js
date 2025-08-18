// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA2MOailKWC3twyYL9zgEvLV81HvCuobW0",
    authDomain: "hkgroup-5e357.firebaseapp.com",
    databaseURL: "https://hkgroup-5e357-default-rtdb.firebaseio.com",
    projectId: "hkgroup-5e357",
    storageBucket: "hkgroup-5e357.firebasestorage.app",
    messagingSenderId: "666174502563",
    appId: "1:666174502563:web:347281452bf18b4e697116",
    measurementId: "G-5BVC79DJYQ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Default quiz questions
const defaultQuestions = [
    {
        question: "Which factor has the biggest impact on milk shelf life?",
        options: ["Temperature control", "Packaging material", "Storage humidity", "Cow's mood"],
        correct: 0
    },
    {
        question: "If we designed a \"Milk-as-a-Service\" platform, what's the hardest problem to solve?",
        options: ["Subscription billing", "Cold-chain logistics", "API uptime", "Preventing milk from spoiling"],
        correct: 3
    },
    {
        question: "Which Kubernetes command is most accurate for milking cows?",
        options: ["kubectl drain cow01", "kubectl get milk", "kubectl describe udder", "kubectl scale herd=10"],
        correct: 0
    },
    {
        question: "If cows were software engineers, which language would they pick?",
        options: ["Python", "Rust", "Golang", "MooScript"],
        correct: 3
    },
    {
        question: "Which technology is most critical for smart dairy farms?",
        options: ["IoT sensors", "Machine Learning models", "Blockchain traceability", "Augmented Reality"],
        correct: 0
    },
    {
        question: "If 1 cow produces 25 liters/day, how many cows are needed for 1 TB of \"milk data\", assuming 1 liter = 1 GB?",
        options: ["10", "40", "100", "None, data doesn't work like that 😅"],
        correct: 2
    },
    {
        question: "What's the nickname for milk in the global dairy trade?",
        options: ["White Oil", "White Gold", "Liquid Silver", "Cloud Juice"],
        correct: 1
    },
    {
        question: "Which cloud service best describes a dairy farm?",
        options: ["AWS EC2 (compute = cows)", "AWS S3 (storage = milk tanks)", "AWS Lambda (events = milking sessions)", "All of the above"],
        correct: 3
    },
    {
        question: "If milk powered servers instead of electricity, which component would it fuel best?",
        options: ["RAM", "GPU", "Cache", "Hard Disk"],
        correct: 2
    },
    {
        question: "Which would be harder to debug?",
        options: ["A distributed system outage", "A herd of cows escaping into traffic", "A memory leak in production", "A milk tank leaking during transport"],
        correct: 1
    }
];

// Current questions loaded from Firebase
let questions = [];

// Global variables
let currentUser = null;
let currentSession = null;
let currentQuestionIndex = -1;
let timer = null;
let timeLeft = 20;
let userRole = null; // 'host' or 'participant'

// DOM elements
const screens = {
    home: document.getElementById('home-screen'),
    create: document.getElementById('create-screen'),
    join: document.getElementById('join-screen'),
    hostDashboard: document.getElementById('host-dashboard'),
    participantView: document.getElementById('participant-view')
};

// Utility functions
function generateSessionCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Toast notification system
function showToast(message, type = 'info', title = '') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    const titles = {
        success: title || 'Success',
        error: title || 'Error',
        warning: title || 'Warning',
        info: title || 'Info'
    };

    toast.innerHTML = `
        <div class="toast-icon">${icons[type]}</div>
        <div class="toast-content">
            <div class="toast-title">${titles[type]}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="removeToast(this.parentElement)">×</button>
    `;

    toastContainer.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    // Auto remove after 5 seconds
    setTimeout(() => {
        removeToast(toast);
    }, 5000);
}

function removeToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
        if (toast.parentElement) {
            toast.parentElement.removeChild(toast);
        }
    }, 300);
}

function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function showElement(elementId) {
    document.getElementById(elementId).classList.remove('hidden');
}

function hideElement(elementId) {
    document.getElementById(elementId).classList.add('hidden');
}

// Timer functions
function startTimer(duration, displayElementId, onComplete) {
    // Stop any existing timer first
    stopTimer();
    
    timeLeft = duration;
    const display = document.getElementById(displayElementId);
    
    if (!display) {
        console.error('Timer display element not found:', displayElementId);
        return;
    }

    // Initialize display
    display.textContent = timeLeft;

    timer = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timer);
            timer = null;
            display.parentElement.classList.remove('warning');
            onComplete();
            return;
        }

        display.textContent = timeLeft;

        if (timeLeft <= 5) {
            display.parentElement.classList.add('warning');
        }

        timeLeft--;
    }, 1000);
}

function stopTimer() {
    if (timer) {
        clearInterval(timer);
        timer = null;
        console.log('Timer stopped');
    }
}

// Firebase helper functions
function createSession(hostName, sessionCode) {
    // Ensure we have questions before creating the session
    if (!questions || questions.length === 0) {
        return Promise.reject(new Error('No questions available to create session'));
    }
    
    console.log('Creating session with questions:', questions.length);
    
    return database.ref('sessions/' + sessionCode).set({
        host: hostName,
        status: 'waiting', // waiting, active, completed
        currentQuestion: -1,
        participants: {},
        questions: questions, // Store questions in session for participants
        questionsArray: questions, // Store as array for better compatibility
        totalQuestions: questions.length,
        createdAt: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        console.log('Session created successfully with questions:', questions.length);
    });
}

// Question management functions
function loadQuestionsFromFirebase() {
    console.log('Loading questions from Firebase...');
    return database.ref('questions').once('value').then(snapshot => {
        const firebaseQuestions = snapshot.val();
        console.log('Firebase questions raw data:', firebaseQuestions);
        if (firebaseQuestions) {
            questions = Object.values(firebaseQuestions);
            console.log('Loaded questions from Firebase:', questions.length);
            return questions;
        } else {
            // No questions in Firebase, use defaults
            console.log('No questions in Firebase, using defaults');
            questions = [...defaultQuestions];
            console.log('Loaded default questions:', questions.length);
            return questions;
        }
    }).catch(error => {
        console.error('Error loading questions from Firebase:', error);
        // Fallback to defaults on error
        questions = [...defaultQuestions];
        console.log('Error fallback - using default questions:', questions.length);
        return questions;
    });
}

function saveQuestionToFirebase(questionData) {
    const questionId = database.ref('questions').push().key;
    return database.ref('questions/' + questionId).set({
        ...questionData,
        id: questionId,
        createdAt: firebase.database.ServerValue.TIMESTAMP
    });
}

function deleteQuestionFromFirebase(questionId) {
    return database.ref('questions/' + questionId).remove();
}

function loadDefaultQuestionsToFirebase() {
    const updates = {};
    defaultQuestions.forEach((question, index) => {
        const questionId = `default_${index}`;
        updates[`questions/${questionId}`] = {
            ...question,
            id: questionId,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };
    });
    return database.ref().update(updates);
}

function joinSession(sessionCode, participantName) {
    const participantId = Date.now().toString();
    return database.ref('sessions/' + sessionCode + '/participants/' + participantId).set({
        name: participantName,
        score: 0,
        answers: {},
        joinedAt: firebase.database.ServerValue.TIMESTAMP
    }).then(() => participantId);
}

// Event listeners
document.getElementById('create-quiz-btn').addEventListener('click', () => {
    showScreen('create');
});

// Load available quizzes when the page loads
document.addEventListener('DOMContentLoaded', function() {
    loadAvailableQuizzes();
});

// Refresh quizzes button
document.getElementById('refresh-quizzes-btn').addEventListener('click', () => {
    loadAvailableQuizzes();
});

// Function to load and display available quizzes
function loadAvailableQuizzes() {
    const quizList = document.getElementById('available-quizzes');
    quizList.innerHTML = '<div class="loading-message">Loading available quizzes...</div>';
    
    database.ref('sessions').once('value').then(snapshot => {
        const sessions = snapshot.val();
        quizList.innerHTML = '';
        
        if (!sessions) {
            quizList.innerHTML = '<div class="no-quizzes-message">No active quizzes found. Create one to get started!</div>';
            return;
        }
        
        const activeQuizzes = Object.keys(sessions)
            .filter(sessionId => {
                const session = sessions[sessionId];
                return session.status === 'waiting' || session.status === 'active';
            })
            .sort((a, b) => {
                // Sort by creation time, newest first
                const timeA = sessions[a].createdAt || 0;
                const timeB = sessions[b].createdAt || 0;
                return timeB - timeA;
            });
        
        if (activeQuizzes.length === 0) {
            quizList.innerHTML = '<div class="no-quizzes-message">No active quizzes found. Create one to get started!</div>';
            return;
        }
        
        activeQuizzes.forEach(sessionId => {
            const session = sessions[sessionId];
            const quizItem = createQuizItem(sessionId, session);
            quizList.appendChild(quizItem);
        });
    }).catch(error => {
        console.error('Error loading quizzes:', error);
        quizList.innerHTML = '<div class="no-quizzes-message">Error loading quizzes. Please try again.</div>';
    });
}

// Function to create a quiz item element
function createQuizItem(sessionId, session) {
    const quizItem = document.createElement('div');
    quizItem.className = 'quiz-item';
    quizItem.onclick = () => joinQuizById(sessionId);
    
    const participantCount = session.participants ? Object.keys(session.participants).length : 0;
    const questionCount = session.questions ? session.questions.length : 0;
    
    const statusClass = {
        'waiting': 'status-waiting',
        'active': 'status-active',
        'completed': 'status-completed'
    }[session.status] || 'status-waiting';
    
    const statusText = {
        'waiting': 'Waiting for participants',
        'active': 'Quiz in progress',
        'completed': 'Completed'
    }[session.status] || 'Unknown';
    
    quizItem.innerHTML = `
        <div class="quiz-title">Quiz by ${session.host || 'Unknown Host'}</div>
        <div class="quiz-details">
            <span>👥 ${participantCount} participants • ❓ ${questionCount} questions</span>
            <span class="quiz-status ${statusClass}">${statusText}</span>
        </div>
    `;
    
    return quizItem;
}

// Function to join a quiz by ID
function joinQuizById(sessionId) {
    // Check if session still exists and is joinable
    database.ref('sessions/' + sessionId).once('value').then(snapshot => {
        if (snapshot.exists()) {
            const session = snapshot.val();
            if (session.status === 'waiting' || session.status === 'active') {
                currentSession = sessionId;
                showScreen('join');
                document.getElementById('participant-session-code').textContent = sessionId;
            } else {
                showToast('This quiz is no longer accepting participants.', 'warning', 'Quiz Unavailable');
                loadAvailableQuizzes(); // Refresh the list
            }
        } else {
            showToast('Quiz session no longer exists.', 'error', 'Session Not Found');
            loadAvailableQuizzes(); // Refresh the list
        }
    }).catch(error => {
        console.error('Error joining quiz:', error);
        showToast('Error joining quiz. Please try again.', 'error', 'Connection Error');
    });
}

document.getElementById('back-to-home-btn').addEventListener('click', () => {
    showScreen('home');
});

document.getElementById('back-to-home-join-btn').addEventListener('click', () => {
    showScreen('home');
});

document.getElementById('manage-questions-btn').addEventListener('click', () => {
    showScreen('questions');
    loadAndDisplayQuestions();
});

document.getElementById('back-to-create-btn').addEventListener('click', () => {
    showScreen('create');
});

document.getElementById('add-question-btn').addEventListener('click', addNewQuestion);

document.getElementById('load-default-questions-btn').addEventListener('click', () => {
    loadDefaultQuestionsToFirebase().then(() => {
        showToast('Default questions loaded successfully!', 'success');
        loadAndDisplayQuestions();
    }).catch(error => {
        showToast('Error loading default questions: ' + error.message, 'error');
    });
});

document.getElementById('start-quiz-btn').addEventListener('click', () => {
    const hostName = document.getElementById('host-name-input').value.trim();
    if (hostName) {
        // First ensure questions are loaded
        loadQuestionsFromFirebase().then(() => {
            if (questions.length === 0) {
                showToast('No questions available! Please add questions first.', 'warning');
                return Promise.reject('No questions');
            }

            const sessionCode = generateSessionCode();
            currentSession = sessionCode;
            currentUser = hostName;
            userRole = 'host';

            return createSession(hostName, sessionCode);
        }).then(() => {
            if (currentSession) {
                document.getElementById('session-code').textContent = currentSession;
                
                // Generate and display share link
                const shareUrl = `${window.location.origin}${window.location.pathname}?quiz=${currentSession}`;
                document.getElementById('quiz-share-url').textContent = shareUrl;
                
                showScreen('hostDashboard');
                showToast(`Quiz created successfully! Share code: ${currentSession}`, 'success', 'Quiz Ready');
                setupHostListeners();
            }
        }).catch(error => {
            if (error !== 'No questions') {
                showToast('Failed to create quiz session: ' + error.message, 'error', 'Creation Failed');
            }
        });
    } else {
        showToast('Please enter your name to create a quiz', 'warning', 'Name Required');
    }
});

document.getElementById('join-session-btn').addEventListener('click', () => {
    const participantName = document.getElementById('participant-name-input').value.trim();
    if (participantName) {
        currentUser = participantName;
        userRole = 'participant';

        joinSession(currentSession, participantName).then(participantId => {
            currentUser = { name: participantName, id: participantId };
            document.getElementById('participant-name-display').textContent = participantName;
            showScreen('participantView');
            showToast(`Successfully joined quiz session!`, 'success', 'Welcome!');

            return database.ref('sessions/' + currentSession).once('value');
        }).then(snapshot => {
            const session = snapshot.val();
            console.log('Session data loaded:', session);
            
            if (session && session.questions) {
                questions = session.questions;
                console.log('Participant loaded questions from session.questions:', questions.length);
            } else if (session && session.questionsArray) {
                questions = session.questionsArray;
                console.log('Participant loaded questions from session.questionsArray:', questions.length);
            } else {
                console.warn('No questions found in session data, trying fallback');
                // Fallback to loading from Firebase questions collection
                return loadQuestionsFromFirebase().then(() => {
                    console.log('Participant loaded questions from Firebase fallback:', questions.length);
                });
            }
            
            // Test: display first question to verify questions are loaded
            if (questions.length > 0) {
                console.log('First question:', questions[0]);
            }
            
            setupParticipantListeners();
        }).catch(error => {
            console.error('Error joining session:', error);
            showToast('Failed to join quiz session: ' + error.message, 'error', 'Join Failed');
        });
    } else {
        showToast('Please enter your name to join the quiz', 'warning', 'Name Required');
    }
});

// Host functions
function setupHostListeners() {
    // Listen for participants
    database.ref('sessions/' + currentSession + '/participants').on('value', (snapshot) => {
        const participants = snapshot.val() || {};
        updateParticipantsList(participants);
        document.getElementById('participant-count').textContent = Object.keys(participants).length;
    });

    document.getElementById('start-questions-btn').addEventListener('click', startQuiz);
    document.getElementById('next-question-btn').addEventListener('click', nextQuestion);
    document.getElementById('new-quiz-btn').addEventListener('click', () => {
        location.reload();
    });
}

function updateParticipantsList(participants) {
    const list = document.getElementById('participants-list');
    list.innerHTML = '';

    Object.entries(participants).forEach(([id, participant]) => {
        const card = document.createElement('div');
        card.className = 'participant-card';
        card.innerHTML = `<strong>${participant.name}</strong><br>Score: ${participant.score || 0}`;
        list.appendChild(card);
    });
}

function startQuiz() {
    database.ref('sessions/' + currentSession).update({
        status: 'active',
        currentQuestion: 0
    });

    hideElement('waiting-room');
    showElement('question-display');
    currentQuestionIndex = 0;
    showQuestion();
}

function showQuestion() {
    console.log('Host showing question at index:', currentQuestionIndex);
    const question = questions[currentQuestionIndex];
    if (!question) {
        console.error('Question not found at index:', currentQuestionIndex);
        showToast('Error loading question. Please check your questions.', 'error');
        return;
    }
    
    console.log('Host question:', question.question);
    
    document.getElementById('current-question-num').textContent = currentQuestionIndex + 1;
    document.getElementById('total-questions').textContent = questions.length;
    document.getElementById('question-text').textContent = question.question;

    const optionsContainer = document.getElementById('answer-options');
    optionsContainer.innerHTML = '';

    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'answer-option';
        optionDiv.innerHTML = `
            <span class="option-letter">${String.fromCharCode(65 + index)}</span>
            <span>${option}</span>
        `;
        
        // Add click handler for host to see selection (visual feedback only)
        optionDiv.addEventListener('click', () => {
            // Remove previous selections
            optionsContainer.querySelectorAll('.answer-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Select this option
            optionDiv.classList.add('selected');
            
            // Show visual feedback that this is the correct answer
            if (index === question.correct) {
                showToast('This is the correct answer!', 'success', 'Host Preview');
            } else {
                showToast('This is not the correct answer. Correct: ' + question.options[question.correct], 'info', 'Host Preview');
            }
        });
        
        optionsContainer.appendChild(optionDiv);
    });

    // Update question in database with both index and complete question data
    database.ref('sessions/' + currentSession).update({
        currentQuestion: currentQuestionIndex,
        currentQuestionData: question, // Include the actual question data for participants
        questionsArray: questions // Include all questions for sync
    }).then(() => {
        console.log('Host: Question data updated in Firebase');
    }).catch(error => {
        console.error('Host: Error updating question data:', error);
    });

    // Start timer
    startTimer(20, 'timer-display', () => {
        showQuestionResults();
    });
}

function showQuestionResults() {
    hideElement('next-question-btn');
    showElement('question-results');

    // Get all participant answers
    database.ref('sessions/' + currentSession + '/participants').once('value').then(snapshot => {
        const participants = snapshot.val() || {};
        const answerCounts = [0, 0, 0, 0];
        const totalParticipants = Object.keys(participants).length;

        Object.values(participants).forEach(participant => {
            const answer = participant.answers && participant.answers[currentQuestionIndex];
            if (answer !== undefined) {
                answerCounts[answer]++;
            }
        });

        // Show answer statistics
        const statsContainer = document.getElementById('answer-stats');
        statsContainer.innerHTML = '';

        questions[currentQuestionIndex].options.forEach((option, index) => {
            const percentage = totalParticipants > 0 ? Math.round((answerCounts[index] / totalParticipants) * 100) : 0;
            const isCorrect = index === questions[currentQuestionIndex].correct;

            const statDiv = document.createElement('div');
            statDiv.className = 'stat-bar';
            statDiv.innerHTML = `
                <span>${String.fromCharCode(65 + index)}: ${option} ${isCorrect ? '✓' : ''}</span>
                <div class="stat-progress">
                    <div class="stat-fill" style="width: ${percentage}%"></div>
                </div>
                <span>${answerCounts[index]} (${percentage}%)</span>
            `;
            statsContainer.appendChild(statDiv);
        });

        // Show correct answer in options
        const optionElements = document.querySelectorAll('#answer-options .answer-option');
        optionElements.forEach((element, index) => {
            if (index === questions[currentQuestionIndex].correct) {
                element.classList.add('correct');
            }
        });

        setTimeout(() => {
            showElement('next-question-btn');
        }, 3000);
    });
}

function nextQuestion() {
    currentQuestionIndex++;

    if (currentQuestionIndex < questions.length) {
        hideElement('question-results');
        hideElement('next-question-btn');
        showQuestion();
    } else {
        // Quiz completed
        hideElement('question-display');
        showElement('final-results');
        showFinalResults();

        database.ref('sessions/' + currentSession).update({
            status: 'completed'
        });
    }
}

function showFinalResults() {
    database.ref('sessions/' + currentSession + '/participants').once('value').then(snapshot => {
        const participants = snapshot.val() || {};
        const leaderboard = Object.entries(participants)
            .map(([id, participant]) => ({ id, ...participant }))
            .sort((a, b) => b.score - a.score);

        const leaderboardContainer = document.getElementById('leaderboard');
        leaderboardContainer.innerHTML = '';

        leaderboard.forEach((participant, index) => {
            const item = document.createElement('div');
            item.className = `leaderboard-item rank-${index + 1}`;
            item.innerHTML = `
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <span class="rank-badge">${index + 1}</span>
                    <span><strong>${participant.name}</strong></span>
                </div>
                <span><strong>${participant.score}/${questions.length}</strong></span>
            `;
            leaderboardContainer.appendChild(item);
        });
    });
}

// Participant functions
function setupParticipantListeners() {
    console.log('Setting up participant listeners for session:', currentSession);
    
    // Listen for quiz status changes
    database.ref('sessions/' + currentSession).on('value', (snapshot) => {
        const session = snapshot.val();
        console.log('Participant received session update:', session);
        
        if (session) {
            // Always ensure we have the latest questions from the session
            if (session.questions && Array.isArray(session.questions)) {
                questions = session.questions;
                console.log('Participant synchronized questions from session.questions:', questions.length);
            } else if (session.questionsArray && Array.isArray(session.questionsArray)) {
                questions = session.questionsArray;
                console.log('Participant synchronized questions from session.questionsArray:', questions.length);
            } else {
                console.warn('No questions found in session data, keeping existing questions');
            }

            console.log('Session status:', session.status, 'Current question:', session.currentQuestion);

            if (session.status === 'active' && session.currentQuestion >= 0) {
                console.log('Showing participant question for index:', session.currentQuestion);
                hideElement('participant-waiting');
                showElement('participant-question');
                // Pass the current question data if available for verification
                showParticipantQuestion(session.currentQuestion, session.currentQuestionData);
            } else if (session.status === 'completed') {
                hideElement('participant-question');
                showElement('participant-results');
                showParticipantResults();
            } else {
                console.log('Session not active yet, status:', session.status);
            }
        }
    });
}

function showParticipantQuestion(questionIndex, currentQuestionData = null) {
    console.log('showParticipantQuestion called with index:', questionIndex, 'current:', currentQuestionIndex);
    
    // Always update if this is a different question or force update
    if (questionIndex !== currentQuestionIndex || !currentQuestionData) {
        // Stop any existing timer first
        stopTimer();
        
        currentQuestionIndex = questionIndex;
        hideElement('participant-feedback');

        // Try to use the current question data from host first, then fallback to local questions
        let question = currentQuestionData;
        
        if (!question && questions && questions[currentQuestionIndex]) {
            question = questions[currentQuestionIndex];
            console.log('Using local question data');
        }

        // If still no question, try to reload from session
        if (!question) {
            console.error('No question available at index:', currentQuestionIndex, 'Total questions:', questions ? questions.length : 0);
            showToast('Loading questions...', 'info');
            
            // Try to reload questions from session
            database.ref('sessions/' + currentSession).once('value').then(snapshot => {
                const sessionData = snapshot.val();
                if (sessionData) {
                    if (sessionData.questions && sessionData.questions[questionIndex]) {
                        questions = sessionData.questions;
                        console.log('Reloaded questions from session.questions');
                        showParticipantQuestion(questionIndex, sessionData.currentQuestionData); // Retry
                    } else if (sessionData.questionsArray && sessionData.questionsArray[questionIndex]) {
                        questions = sessionData.questionsArray;
                        console.log('Reloaded questions from session.questionsArray');
                        showParticipantQuestion(questionIndex, sessionData.currentQuestionData); // Retry
                    } else {
                        showToast('Unable to load questions. Please refresh the page.', 'error');
                    }
                }
            }).catch(error => {
                console.error('Error reloading questions:', error);
                showToast('Error loading questions. Please refresh the page.', 'error');
            });
            return;
        }

        console.log('Displaying question:', question.question);
        
        document.getElementById('participant-question-num').textContent = currentQuestionIndex + 1;
        document.getElementById('participant-total-questions').textContent = questions.length;
        document.getElementById('participant-question-text').textContent = question.question;

        const optionsContainer = document.getElementById('participant-options');
        optionsContainer.innerHTML = '';

        question.options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'answer-option';
            optionDiv.innerHTML = `
                <span class="option-letter">${String.fromCharCode(65 + index)}</span>
                <span>${option}</span>
            `;

            optionDiv.addEventListener('click', () => {
                // Remove previous selections
                optionsContainer.querySelectorAll('.answer-option').forEach(opt => {
                    opt.classList.remove('selected');
                });

                // Select this option
                optionDiv.classList.add('selected');

                // Submit answer
                submitAnswer(index);
            });

            optionsContainer.appendChild(optionDiv);
        });

        // Start participant timer with proper element ID
        console.log('Starting participant timer');
        startTimer(20, 'participant-timer', () => {
            console.log('Participant timer finished');
            // Time's up - disable options
            optionsContainer.querySelectorAll('.answer-option').forEach(opt => {
                opt.style.pointerEvents = 'none';
                opt.style.opacity = '0.7'; // Just dim them, don't show colors yet
            });
            showToast('Time\'s up!', 'warning');
            
            // Show timeout feedback with countdown before revealing answer
            const feedbackDiv = document.getElementById('participant-feedback');
            feedbackDiv.innerHTML = `
                <div style="text-align: center; padding: 1rem;">
                    <h4>⏰ Time's Up!</h4>
                    <p>Revealing correct answer in <span id="timeout-reveal-countdown">3</span> seconds...</p>
                </div>
            `;
            showElement('participant-feedback');

            // Start countdown before revealing the correct answer
            let countdown = 3;
            const countdownElement = document.getElementById('timeout-reveal-countdown');
            
            const revealTimer = setInterval(() => {
                countdown--;
                if (countdownElement) {
                    countdownElement.textContent = countdown;
                }
                
                if (countdown <= 0) {
                    clearInterval(revealTimer);
                    
                    // Restore full opacity to options
                    optionsContainer.querySelectorAll('.answer-option').forEach(opt => {
                        opt.style.opacity = '1';
                    });
                    
                    // Now show the correct answer
                    feedbackDiv.innerHTML = `
                        <div style="text-align: center; padding: 1rem;">
                            <h4>⏰ Time's Up!</h4>
                            <p>The correct answer was: <strong>${questions[currentQuestionIndex].options[questions[currentQuestionIndex].correct]}</strong></p>
                        </div>
                    `;
                }
            }, 1000);
        });
    } else {
        console.log('Question not shown - same index:', questionIndex);
    }
}

function submitAnswer(answerIndex) {
    stopTimer();

    // Calculate score
    const isCorrect = answerIndex === questions[currentQuestionIndex].correct;
    const currentScore = isCorrect ? 1 : 0;

    // Update participant's answer and score
    const updates = {};
    updates[`sessions/${currentSession}/participants/${currentUser.id}/answers/${currentQuestionIndex}`] = answerIndex;

    database.ref().update(updates).then(() => {
        // Update total score
        return database.ref(`sessions/${currentSession}/participants/${currentUser.id}`).once('value');
    }).then(snapshot => {
        const participant = snapshot.val();
        const newScore = (participant.score || 0) + currentScore;

        return database.ref(`sessions/${currentSession}/participants/${currentUser.id}/score`).set(newScore);
    });

    // Disable all options immediately but DON'T show colors yet
    document.querySelectorAll('#participant-options .answer-option').forEach(opt => {
        opt.style.pointerEvents = 'none';
        opt.style.opacity = '0.7'; // Just dim them slightly to show they're disabled
    });

    // Show only the countdown without revealing if answer is correct/incorrect
    const feedbackDiv = document.getElementById('participant-feedback');
    feedbackDiv.innerHTML = `
        <div style="text-align: center; padding: 1rem;">
            <h4>📝 Answer Submitted</h4>
            <p>Revealing results in <span id="reveal-countdown">3</span> seconds...</p>
        </div>
    `;
    showElement('participant-feedback');

    // Start countdown before revealing the correct answer
    let countdown = 3;
    const countdownElement = document.getElementById('reveal-countdown');
    
    const revealTimer = setInterval(() => {
        countdown--;
        if (countdownElement) {
            countdownElement.textContent = countdown;
        }
        
        if (countdown <= 0) {
            clearInterval(revealTimer);
            
            // NOW show the colors on the selected option
            document.querySelectorAll('#participant-options .answer-option').forEach(opt => {
                if (opt.classList.contains('selected')) {
                    opt.classList.add(isCorrect ? 'correct' : 'incorrect');
                }
                opt.style.opacity = '1'; // Restore full opacity
            });
            
            // NOW show the feedback with correct/incorrect status
            feedbackDiv.innerHTML = `
                <div style="text-align: center; padding: 1rem;">
                    <h4>${isCorrect ? '✅ Correct!' : '❌ Incorrect'}</h4>
                    <p>The correct answer was: <strong>${questions[currentQuestionIndex].options[questions[currentQuestionIndex].correct]}</strong></p>
                </div>
            `;
        }
    }, 1000);
}

function showParticipantResults() {
    database.ref(`sessions/${currentSession}/participants/${currentUser.id}`).once('value').then(snapshot => {
        const participant = snapshot.val();
        const score = participant.score || 0;

        document.getElementById('participant-score').textContent = score;
        document.getElementById('participant-final-total').textContent = questions.length;

        // Get all participants to calculate rank
        return database.ref(`sessions/${currentSession}/participants`).once('value');
    }).then(snapshot => {
        const participants = snapshot.val() || {};
        const leaderboard = Object.entries(participants)
            .map(([id, participant]) => ({ id, ...participant }))
            .sort((a, b) => b.score - a.score);

        // Find current user's rank
        const userRank = leaderboard.findIndex(p => p.id === currentUser.id) + 1;
        document.getElementById('participant-rank').textContent = userRank;

        // Show leaderboard
        const leaderboardContainer = document.getElementById('participant-leaderboard');
        leaderboardContainer.innerHTML = '<h4>Final Rankings:</h4>';

        leaderboard.forEach((participant, index) => {
            const item = document.createElement('div');
            item.className = `leaderboard-item rank-${index + 1}`;
            if (participant.id === currentUser.id) {
                item.style.backgroundColor = '#e3f2fd';
            }
            item.innerHTML = `
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <span class="rank-badge">${index + 1}</span>
                    <span><strong>${participant.name}</strong></span>
                </div>
                <span><strong>${participant.score}/${questions.length}</strong></span>
            `;
            leaderboardContainer.appendChild(item);
        });
    });
}

// Question management UI functions
function loadAndDisplayQuestions() {
    const questionsList = document.getElementById('questions-list');
    questionsList.innerHTML = '<div class="loading">Loading questions...</div>';

    loadQuestionsFromFirebase().then(loadedQuestions => {
        displayQuestions(loadedQuestions);
    }).catch(error => {
        questionsList.innerHTML = '<div class="loading">Error loading questions</div>';
        showToast('Error loading questions: ' + error.message, 'error');
    });
}

function displayQuestions(questionsToDisplay) {
    const questionsList = document.getElementById('questions-list');

    if (!questionsToDisplay || questionsToDisplay.length === 0) {
        questionsList.innerHTML = '<div class="loading">No questions found. Add some questions or load defaults.</div>';
        return;
    }

    questionsList.innerHTML = '';

    questionsToDisplay.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item';
        questionDiv.innerHTML = `
            <button class="delete-question" onclick="deleteQuestion('${question.id || index}')">×</button>
            <h4>Q${index + 1}: ${question.question}</h4>
            <div class="question-options">
                ${question.options.map((option, optIndex) => `
                    <div class="question-option ${optIndex === question.correct ? 'correct' : ''}">
                        ${String.fromCharCode(65 + optIndex)}: ${option}
                        ${optIndex === question.correct ? ' ✓' : ''}
                    </div>
                `).join('')}
            </div>
        `;
        questionsList.appendChild(questionDiv);
    });
}

function addNewQuestion() {
    const questionText = document.getElementById('new-question-text').value.trim();
    const optionA = document.getElementById('option-a').value.trim();
    const optionB = document.getElementById('option-b').value.trim();
    const optionC = document.getElementById('option-c').value.trim();
    const optionD = document.getElementById('option-d').value.trim();
    const correctOption = parseInt(document.getElementById('correct-option').value);

    // Validation
    if (!questionText) {
        showToast('Please enter a question', 'warning');
        return;
    }

    if (!optionA || !optionB || !optionC || !optionD) {
        showToast('Please fill in all four options', 'warning');
        return;
    }

    const newQuestion = {
        question: questionText,
        options: [optionA, optionB, optionC, optionD],
        correct: correctOption
    };

    saveQuestionToFirebase(newQuestion).then(() => {
        showToast('Question added successfully!', 'success');
        clearQuestionForm();
        loadAndDisplayQuestions();
    }).catch(error => {
        showToast('Error adding question: ' + error.message, 'error');
    });
}

function clearQuestionForm() {
    document.getElementById('new-question-text').value = '';
    document.getElementById('option-a').value = '';
    document.getElementById('option-b').value = '';
    document.getElementById('option-c').value = '';
    document.getElementById('option-d').value = '';
    document.getElementById('correct-option').value = '0';
}

function deleteQuestion(questionId) {
    if (confirm('Are you sure you want to delete this question?')) {
        deleteQuestionFromFirebase(questionId).then(() => {
            showToast('Question deleted successfully!', 'success');
            loadAndDisplayQuestions();
        }).catch(error => {
            showToast('Error deleting question: ' + error.message, 'error');
        });
    }
}

// Update screens object to include questions screen
screens.questions = document.getElementById('questions-screen');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    console.log('App initializing...');
    
    // Check for quiz parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('quiz');
    
    if (quizId) {
        // Auto-join quiz if URL parameter is present
        console.log('Auto-joining quiz:', quizId);
        joinQuizById(quizId);
    } else {
        showScreen('home');
    }
    
    // Load questions on app start
    console.log('Loading initial questions...');
    loadQuestionsFromFirebase().then(() => {
        console.log('Initial questions loaded successfully:', questions.length);
        if (questions.length > 0) {
            console.log('Sample question:', questions[0].question);
        }
    }).catch(error => {
        console.error('Error loading initial questions:', error);
        showToast('Warning: Could not load questions from database. Using defaults.', 'warning');
        questions = [...defaultQuestions];
        console.log('Fallback complete - questions available:', questions.length);
    });
});

// Copy link functionality
document.getElementById('copy-link-btn').addEventListener('click', () => {
    const shareUrl = document.getElementById('quiz-share-url').textContent;
    
    if (navigator.clipboard && window.isSecureContext) {
        // Use modern clipboard API
        navigator.clipboard.writeText(shareUrl).then(() => {
            showToast('Quiz link copied to clipboard!', 'success', 'Link Copied');
            
            // Visual feedback
            const btn = document.getElementById('copy-link-btn');
            const originalText = btn.textContent;
            btn.textContent = '✅ Copied!';
            btn.style.background = '#28a745';
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
            fallbackCopyTextToClipboard(shareUrl);
        });
    } else {
        // Fallback for older browsers
        fallbackCopyTextToClipboard(shareUrl);
    }
});

// Fallback copy function for older browsers
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showToast('Quiz link copied to clipboard!', 'success', 'Link Copied');
        } else {
            showToast('Failed to copy link. Please copy it manually.', 'error', 'Copy Failed');
        }
    } catch (err) {
        console.error('Fallback: Could not copy text: ', err);
        showToast('Failed to copy link. Please copy it manually.', 'error', 'Copy Failed');
    }
    
    document.body.removeChild(textArea);
}