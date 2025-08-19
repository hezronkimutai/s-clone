// Application configuration
const config = {
    timerDuration: parseInt(process.env.DEFAULT_TIMER_DURATION) || 20
};

// Firebase configuration - using environment variables
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyA2MOailKWC3twyYL9zgEvLV81HvCuobW0",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "hkgroup-5e357.firebaseapp.com",
    databaseURL: process.env.FIREBASE_DATABASE_URL || "https://hkgroup-5e357-default-rtdb.firebaseio.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "hkgroup-5e357",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "hkgroup-5e357.firebasestorage.app",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "666174502563",
    appId: process.env.FIREBASE_APP_ID || "1:666174502563:web:347281452bf18b4e697116",
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-5BVC79DJYQ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

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
let authenticatedUser = null; // Firebase authenticated user

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

// Authentication functions
function initializeAuth() {
    // Listen for authentication state changes
    auth.onAuthStateChanged((user) => {
        authenticatedUser = user;
        updateAuthUI();
        if (user) {
            console.log('User signed in:', user.email);
            loadMyQuizzes();
        } else {
            console.log('User signed out');
            hideMyQuizzes();
        }
    });
}

function updateAuthUI() {
    const signedOutView = document.getElementById('signed-out-view');
    const signedInView = document.getElementById('signed-in-view');

    if (authenticatedUser) {
        // User is signed in
        signedOutView.classList.add('hidden');
        signedInView.classList.remove('hidden');

        // Update user info
        const userName = document.getElementById('user-name');
        const userEmail = document.getElementById('user-email');
        const userPhoto = document.getElementById('user-photo');
        const userInitials = document.getElementById('user-initials');

        userName.textContent = authenticatedUser.displayName || 'User';
        userEmail.textContent = authenticatedUser.email;

        if (authenticatedUser.photoURL) {
            userPhoto.src = authenticatedUser.photoURL;
            userPhoto.style.display = 'block';
            userInitials.style.display = 'none';
        } else {
            userPhoto.style.display = 'none';
            userInitials.style.display = 'flex';
            const initials = (authenticatedUser.displayName || authenticatedUser.email)
                .split(' ')
                .map(name => name[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
            userInitials.textContent = initials;
        }
    } else {
        // User is signed out
        signedOutView.classList.remove('hidden');
        signedInView.classList.add('hidden');
    }

    // Update tabs for authentication state
    updateTabsForAuthState();
}

function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            showToast('Successfully signed in with Google!', 'success', 'Welcome!');
        })
        .catch((error) => {
            console.error('Google sign-in error:', error);
            showToast('Failed to sign in with Google: ' + error.message, 'error', 'Sign-in Failed');
        });
}

function signInWithEmail(email, password) {
    return auth.signInWithEmailAndPassword(email, password)
        .then((result) => {
            showToast('Successfully signed in!', 'success', 'Welcome Back!');
            closeEmailModal();
        })
        .catch((error) => {
            console.error('Email sign-in error:', error);
            showToast('Failed to sign in: ' + error.message, 'error', 'Sign-in Failed');
            throw error;
        });
}

function createAccountWithEmail(email, password) {
    return auth.createUserWithEmailAndPassword(email, password)
        .then((result) => {
            showToast('Account created successfully!', 'success', 'Welcome!');
            closeEmailModal();
        })
        .catch((error) => {
            console.error('Account creation error:', error);
            showToast('Failed to create account: ' + error.message, 'error', 'Account Creation Failed');
            throw error;
        });
}

function signOut() {
    auth.signOut()
        .then(() => {
            showToast('Successfully signed out', 'info', 'Goodbye!');
        })
        .catch((error) => {
            console.error('Sign-out error:', error);
            showToast('Failed to sign out: ' + error.message, 'error', 'Sign-out Failed');
        });
}

function openEmailModal() {
    document.getElementById('email-signin-modal').classList.remove('hidden');
}

function closeEmailModal() {
    document.getElementById('email-signin-modal').classList.add('hidden');
    // Reset form
    document.getElementById('email-input').value = '';
    document.getElementById('password-input').value = '';
}

// Firebase helper functions
function createSession(hostName, sessionCode) {
    // Ensure we have questions before creating the session
    if (!questions || questions.length === 0) {
        return Promise.reject(new Error('No questions available to create session'));
    }

    console.log('Creating session with questions:', questions.length);

    const sessionData = {
        host: hostName,
        status: 'waiting', // waiting, active, completed
        currentQuestion: -1,
        participants: {},
        questions: questions, // Store questions in session for participants
        questionsArray: questions, // Store as array for better compatibility
        totalQuestions: questions.length,
        createdAt: firebase.database.ServerValue.TIMESTAMP
    };

    // Add host ID if user is authenticated
    if (authenticatedUser) {
        sessionData.hostId = authenticatedUser.uid;
        sessionData.hostEmail = authenticatedUser.email;
    }

    return database.ref('sessions/' + sessionCode).set(sessionData).then(() => {
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

// Authentication event listeners
document.getElementById('google-signin-btn').addEventListener('click', signInWithGoogle);

document.getElementById('email-signin-btn').addEventListener('click', openEmailModal);

document.getElementById('signout-btn').addEventListener('click', signOut);

document.getElementById('close-email-modal').addEventListener('click', closeEmailModal);

document.getElementById('signin-submit-btn').addEventListener('click', () => {
    const email = document.getElementById('email-input').value.trim();
    const password = document.getElementById('password-input').value;

    if (email && password) {
        signInWithEmail(email, password);
    } else {
        showToast('Please enter both email and password', 'warning', 'Missing Information');
    }
});

document.getElementById('signup-submit-btn').addEventListener('click', () => {
    const email = document.getElementById('email-input').value.trim();
    const password = document.getElementById('password-input').value;

    if (email && password) {
        if (password.length < 6) {
            showToast('Password must be at least 6 characters long', 'warning', 'Password Too Short');
            return;
        }
        createAccountWithEmail(email, password);
    } else {
        showToast('Please enter both email and password', 'warning', 'Missing Information');
    }
});

document.getElementById('toggle-signup').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('signin-submit-btn').style.display = 'none';
    document.getElementById('signup-submit-btn').style.display = 'block';
    document.querySelector('.form-toggle p').style.display = 'none';
    document.getElementById('signup-text').style.display = 'block';
});

document.getElementById('toggle-signin').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('signin-submit-btn').style.display = 'block';
    document.getElementById('signup-submit-btn').style.display = 'none';
    document.querySelector('.form-toggle p').style.display = 'block';
    document.getElementById('signup-text').style.display = 'none';
});

// My Quizzes event listeners
document.getElementById('refresh-my-quizzes-btn').addEventListener('click', loadMyQuizzes);

// Close modal when clicking outside
document.getElementById('email-signin-modal').addEventListener('click', (e) => {
    if (e.target.id === 'email-signin-modal') {
        closeEmailModal();
    }
});

// Load available quizzes when the page loads
document.addEventListener('DOMContentLoaded', function () {
    initializeAuth();
    initializeTabs();
    loadAvailableQuizzes();

    // Check for quiz parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const quizCode = urlParams.get('quiz');
    if (quizCode) {
        // Auto-join quiz from URL
        setTimeout(() => {
            joinQuizById(quizCode);
        }, 1000); // Small delay to ensure UI is ready
    }
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
    startTimer(config.timerDuration, 'timer-display', () => {
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
        startTimer(config.timerDuration, 'participant-timer', () => {
            console.log('Participant timer finished');

            // Time's up - disable options if not already disabled
            optionsContainer.querySelectorAll('.answer-option').forEach(opt => {
                opt.style.pointerEvents = 'none';
                opt.style.opacity = '1'; // Restore full opacity for final reveal
            });

            const feedbackDiv = document.getElementById('participant-feedback');

            // Check if user submitted an answer
            if (window.submittedAnswer) {
                const { answerIndex, isCorrect } = window.submittedAnswer;

                // Show colors on the selected option
                document.querySelectorAll('#participant-options .answer-option').forEach(opt => {
                    if (opt.classList.contains('selected')) {
                        opt.classList.add(isCorrect ? 'correct' : 'incorrect');
                    }
                });

                // Show feedback with user's result
                feedbackDiv.innerHTML = `
                    <div style="text-align: center; padding: 1rem;">
                        <h4>${isCorrect ? '✅ Correct!' : '❌ Incorrect'}</h4>
                        <p>The correct answer was: <strong>${questions[currentQuestionIndex].options[questions[currentQuestionIndex].correct]}</strong></p>
                    </div>
                `;

                // Clear the stored answer
                window.submittedAnswer = null;
            } else {
                // No answer was submitted - time's up
                feedbackDiv.innerHTML = `
                    <div style="text-align: center; padding: 1rem;">
                        <h4>⏰ Time's Up!</h4>
                        <p>The correct answer was: <strong>${questions[currentQuestionIndex].options[questions[currentQuestionIndex].correct]}</strong></p>
                    </div>
                `;
                showElement('participant-feedback');
            }

            showToast('Time\'s up!', 'warning');
        });
    } else {
        console.log('Question not shown - same index:', questionIndex);
    }
}

function submitAnswer(answerIndex) {
    // DON'T stop the timer - let it continue running
    // stopTimer(); // Remove this line

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

    // Show only that answer was submitted - let the main timer continue
    const feedbackDiv = document.getElementById('participant-feedback');
    feedbackDiv.innerHTML = `
        <div style="text-align: center; padding: 1rem;">
            <h4>📝 Answer Submitted</h4>
            <p>Results will be revealed when time is up...</p>
        </div>
    `;
    showElement('participant-feedback');

    // Store the answer data for when the timer finishes
    window.submittedAnswer = {
        answerIndex: answerIndex,
        isCorrect: isCorrect
    };
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

// My Quizzes functions
function loadMyQuizzes() {
    if (!authenticatedUser) return;

    const myQuizzesList = document.getElementById('my-quizzes-list');
    myQuizzesList.innerHTML = '<div class="loading-message">Loading your quizzes...</div>';

    // Query sessions created by the current user
    database.ref('sessions').orderByChild('hostId').equalTo(authenticatedUser.uid).once('value').then(snapshot => {
        const sessions = snapshot.val();
        myQuizzesList.innerHTML = '';

        if (!sessions) {
            myQuizzesList.innerHTML = '<div class="no-quizzes-message">You haven\'t created any quizzes yet. Create your first quiz!</div>';
            return;
        }

        const userQuizzes = Object.keys(sessions)
            .map(sessionId => ({ id: sessionId, ...sessions[sessionId] }))
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); // Sort by creation time, newest first

        if (userQuizzes.length === 0) {
            myQuizzesList.innerHTML = '<div class="no-quizzes-message">You haven\'t created any quizzes yet. Create your first quiz!</div>';
            return;
        }

        userQuizzes.forEach(session => {
            const quizItem = createMyQuizItem(session.id, session);
            myQuizzesList.appendChild(quizItem);
        });
    }).catch(error => {
        console.error('Error loading my quizzes:', error);
        myQuizzesList.innerHTML = '<div class="no-quizzes-message">Error loading your quizzes. Please try again.</div>';
    });
}

function createMyQuizItem(sessionId, session) {
    const quizItem = document.createElement('div');
    quizItem.className = 'quiz-item my-quiz';

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

    const createdDate = session.createdAt ? new Date(session.createdAt).toLocaleDateString() : 'Unknown';

    quizItem.innerHTML = `
        <div class="quiz-title">My Quiz - ${createdDate}</div>
        <div class="quiz-details">
            <span>👥 ${participantCount} participants • ❓ ${questionCount} questions</span>
            <span class="quiz-status ${statusClass}">${statusText}</span>
        </div>
        <div class="quiz-actions">
            ${session.status !== 'completed' ?
            `<button class="resume-btn" onclick="resumeQuiz('${sessionId}')">Resume Quiz</button>` :
            `<button class="resume-btn" onclick="viewQuizResults('${sessionId}')">View Results</button>`
        }
            <button class="delete-btn" onclick="deleteMyQuiz('${sessionId}')">Delete</button>
        </div>
    `;

    return quizItem;
}

function resumeQuiz(sessionId) {
    // Check if session still exists
    database.ref('sessions/' + sessionId).once('value').then(snapshot => {
        if (snapshot.exists()) {
            const session = snapshot.val();
            if (session.hostId === authenticatedUser.uid) {
                // User owns this quiz, resume it
                currentSession = sessionId;
                currentUser = authenticatedUser.displayName || authenticatedUser.email;
                userRole = 'host';

                // Load questions from session
                if (session.questions) {
                    questions = session.questions;
                } else if (session.questionsArray) {
                    questions = session.questionsArray;
                }

                document.getElementById('session-code').textContent = sessionId;

                // Generate and display share link
                const shareUrl = `${window.location.origin}${window.location.pathname}?quiz=${sessionId}`;
                document.getElementById('quiz-share-url').textContent = shareUrl;

                showScreen('hostDashboard');
                setupHostListeners();

                if (session.status === 'active' && session.currentQuestion >= 0) {
                    // Quiz is in progress, show current question
                    currentQuestionIndex = session.currentQuestion;
                    hideElement('waiting-room');
                    showElement('question-display');
                    showQuestion();
                } else {
                    // Quiz is waiting, show waiting room
                    showElement('waiting-room');
                    hideElement('question-display');
                }

                showToast(`Resumed quiz session: ${sessionId}`, 'success', 'Quiz Resumed');
            } else {
                showToast('You don\'t have permission to resume this quiz.', 'error', 'Access Denied');
            }
        } else {
            showToast('Quiz session no longer exists.', 'error', 'Session Not Found');
            loadMyQuizzes(); // Refresh the list
        }
    }).catch(error => {
        console.error('Error resuming quiz:', error);
        showToast('Error resuming quiz. Please try again.', 'error', 'Resume Failed');
    });
}

function viewQuizResults(sessionId) {
    // For completed quizzes, show results
    resumeQuiz(sessionId); // This will load the quiz and show results if completed
}

function deleteMyQuiz(sessionId) {
    if (confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
        database.ref('sessions/' + sessionId).remove()
            .then(() => {
                showToast('Quiz deleted successfully', 'success', 'Quiz Deleted');
                loadMyQuizzes(); // Refresh the list
            })
            .catch(error => {
                console.error('Error deleting quiz:', error);
                showToast('Failed to delete quiz: ' + error.message, 'error', 'Delete Failed');
            });
    }
}

function hideMyQuizzes() {
    // My Quizzes are now handled by the tab system
    // This function is kept for compatibility but doesn't need to do anything
    // The tab system will handle showing/hiding based on authentication state
}

// Tab System Functions
function initializeTabs() {
    const myQuizzesTab = document.getElementById('my-quizzes-tab');
    const availableQuizzesTab = document.getElementById('available-quizzes-tab');

    myQuizzesTab.addEventListener('click', () => switchTab('my-quizzes'));
    availableQuizzesTab.addEventListener('click', () => switchTab('available-quizzes'));

    // Set initial tab based on authentication state
    updateTabsForAuthState();
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));

    if (tabName === 'my-quizzes') {
        document.getElementById('my-quizzes-tab').classList.add('active');
        document.getElementById('my-quizzes-content').classList.add('active');

        // Load my quizzes if authenticated
        if (authenticatedUser) {
            loadMyQuizzes();
        }
    } else if (tabName === 'available-quizzes') {
        document.getElementById('available-quizzes-tab').classList.add('active');
        document.getElementById('available-quizzes-content').classList.add('active');

        // Load available quizzes
        loadAvailableQuizzes();
    }
}

function updateTabsForAuthState() {
    const myQuizzesTab = document.getElementById('my-quizzes-tab');
    const availableQuizzesTab = document.getElementById('available-quizzes-tab');

    if (authenticatedUser) {
        // User is signed in - enable My Quizzes tab
        myQuizzesTab.classList.remove('disabled');
        myQuizzesTab.textContent = 'My Quizzes';

        // Default to My Quizzes tab for authenticated users
        switchTab('my-quizzes');
    } else {
        // User is not signed in - disable My Quizzes tab
        myQuizzesTab.classList.add('disabled');
        myQuizzesTab.textContent = 'My Quizzes';

        // Default to Available Quizzes tab for guests
        switchTab('available-quizzes');
    }
}

// Enhanced Create Screen Functions
function updateQuestionCount() {
    const questionCountElement = document.getElementById('question-count');
    if (questionCountElement && questions) {
        questionCountElement.textContent = questions.length;
        
        // Add animation when count changes
        questionCountElement.style.transform = 'scale(1.2)';
        questionCountElement.style.color = '#10B981';
        
        setTimeout(() => {
            questionCountElement.style.transform = 'scale(1)';
            questionCountElement.style.color = '#06B6D4';
        }, 300);
    }
}

// Update question count when questions are loaded
function loadQuestionsFromFirebase() {
    console.log('Loading questions from Firebase...');
    return database.ref('questions').once('value').then(snapshot => {
        const firebaseQuestions = snapshot.val();
        console.log('Firebase questions raw data:', firebaseQuestions);
        if (firebaseQuestions) {
            questions = Object.values(firebaseQuestions);
            console.log('Loaded questions from Firebase:', questions.length);
            updateQuestionCount();
            return questions;
        } else {
            // No questions in Firebase, use defaults
            console.log('No questions in Firebase, using defaults');
            questions = [...defaultQuestions];
            console.log('Loaded default questions:', questions.length);
            updateQuestionCount();
            return questions;
        }
    }).catch(error => {
        console.error('Error loading questions from Firebase:', error);
        // Fallback to defaults on error
        questions = [...defaultQuestions];
        console.log('Error fallback - using default questions:', questions.length);
        updateQuestionCount();
        return questions;
    });
}

// Enhanced input animations
function initializeCreateScreenAnimations() {
    const hostNameInput = document.getElementById('host-name-input');
    
    if (hostNameInput) {
        // Add typing animation effect
        hostNameInput.addEventListener('input', function() {
            const inputGroup = this.parentElement;
            if (this.value.length > 0) {
                inputGroup.classList.add('has-content');
            } else {
                inputGroup.classList.remove('has-content');
            }
        });
        
        // Add focus animations
        hostNameInput.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        hostNameInput.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    }
}

// Initialize create screen enhancements when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeCreateScreenAnimations();
    
    // Update question count when navigating to create screen
    const createQuizBtn = document.getElementById('create-quiz-btn');
    if (createQuizBtn) {
        createQuizBtn.addEventListener('click', () => {
            setTimeout(() => {
                updateQuestionCount();
            }, 100);
        });
    }
});