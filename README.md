# Quiz Master - Slido Clone

A real-time quiz application similar to Slido, built with HTML, CSS, JavaScript, and Firebase.

## Features

- **Create Quiz Sessions**: Host can create a quiz with a shareable link
- **Smart Quiz Discovery**: Browse available quizzes with real-time status updates
- **Link-Based Joining**: Share quiz links for instant participant access
- **Real-time Updates**: All participants see questions simultaneously
- **20-second Timer**: Each question has a 20-second timeout
- **Live Scoring**: Scores are tracked and updated in real-time
- **Leaderboard**: Final rankings shown at the end
- **Responsive Design**: Works on desktop and mobile devices
- **Memory Bank**: Comprehensive knowledge management system with project context, technical documentation, and development progress tracking

## Quiz Joining Experience

### For Participants:
Instead of entering codes manually, participants can now:
1. **Browse Available Quizzes**: See a live list of active quizzes with host names, participant counts, and status
2. **One-Click Joining**: Click on any quiz to join instantly
3. **Direct Link Access**: Use shareable links (e.g., `yoursite.com/?quiz=ABC123`) to join specific quizzes
4. **Real-time Updates**: Quiz list refreshes automatically to show current status

### For Hosts:
1. **Easy Sharing**: Get a shareable link when creating a quiz
2. **Copy Link Feature**: One-click copying with visual feedback
3. **Live Tracking**: See participant count and quiz status in real-time
4. **Multiple Share Options**: Share via link or display the traditional 6-digit code

## Memory Bank System

The Memory Bank is a knowledge management system that maintains comprehensive documentation about the project:

- **Project Brief** (`memory-bank/projectbrief.md`): Project overview, objectives, and target audience
- **Technical Context** (`memory-bank/techContext.md`): Technology stack, architecture patterns, and database schema
- **Product Context** (`memory-bank/productContext.md`): Product vision, user personas, and market positioning
- **System Patterns** (`memory-bank/systemPatterns.md`): Design patterns, communication patterns, and architectural decisions
- **Progress Tracking** (`memory-bank/progress.md`): Development status, completed features, and roadmap
- **Active Context** (`memory-bank/activeContext.md`): Real-time development context and session notes

### Accessing the Memory Bank

1. **Web Interface**: Navigate to `memory-bank/index.html` for a user-friendly view
2. **Direct Access**: Click the "🧠 Memory Bank" button on the home screen
3. **Developer Access**: Read the markdown files directly in the `memory-bank/` directory

## Quiz Questions

The app includes 10 fun tech/dairy-themed questions:
1. Milk shelf life factors
2. Milk-as-a-Service platform challenges
3. Kubernetes commands for cows
4. Programming languages for cows
5. Smart dairy farm technology
6. Milk data storage calculations
7. Dairy trade terminology
8. Cloud services and dairy farms
9. Milk-powered servers
10. Debugging challenges

## Setup Instructions

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Realtime Database
4. Set database rules to allow read/write (for demo purposes):
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```
5. Get your Firebase configuration from Project Settings

### 2. Configure Environment Variables

1. Copy the `.env` file and update it with your Firebase configuration:
   ```env
   # Firebase Configuration
   FIREBASE_API_KEY=your-api-key
   FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=123456789
   FIREBASE_APP_ID=your-app-id
   FIREBASE_MEASUREMENT_ID=your-measurement-id

   # Application Settings
   DEFAULT_TIMER_DURATION=20
   ```

2. For development, update `env-loader.js` with your configuration values
3. For production, use a build tool like Webpack, Vite, or Parcel to inject environment variables

**Note**: The `.env` file is already included in `.gitignore` to prevent committing sensitive data.

### 3. Run the Application

1. Open `index.html` in a web browser
2. Or serve it using a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   ```

## How to Use

### For Quiz Hosts:
1. Click "Create Quiz"
2. Enter your name
3. Click "Start Quiz"
4. Share the 6-digit code with participants
5. Wait for participants to join
6. Click "Start Quiz" to begin questions
7. Monitor real-time results and progress through questions

### For Participants:
1. Enter the 6-digit quiz code
2. Click "Join Quiz"
3. Enter your name
4. Wait for the host to start the quiz
5. Answer questions within the 20-second time limit
6. View your final score and ranking

## Technical Details

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase Realtime Database
- **Real-time Communication**: Firebase listeners
- **Responsive Design**: CSS Grid and Flexbox
- **Timer System**: JavaScript intervals with visual feedback

## Database Structure

```
sessions/
  {sessionCode}/
    host: "Host Name"
    status: "waiting" | "active" | "completed"
    currentQuestion: 0-9
    participants/
      {participantId}/
        name: "Participant Name"
        score: 0-10
        answers: {0: 1, 1: 3, ...}
        joinedAt: timestamp
    createdAt: timestamp
```

## Customization

- **Questions**: Modify the `questions` array in `app.js`
- **Timer Duration**: Change the timer value in `startTimer()` calls
- **Styling**: Update `styles.css` for different themes
- **Session Code Length**: Modify `generateSessionCode()` function

## Security Notes

For production use:
1. Implement proper Firebase security rules
2. Add user authentication
3. Validate session codes server-side
4. Add rate limiting
5. Sanitize user inputs

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - Feel free to use and modify for your projects!