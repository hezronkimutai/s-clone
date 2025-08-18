# Quiz Master - Slido Clone

A real-time quiz application similar to Slido, built with HTML, CSS, JavaScript, and Firebase.

## Features

- **Create Quiz Sessions**: Host can create a quiz with a shareable 6-digit code
- **Join Quiz**: Participants can join using the quiz code
- **Real-time Updates**: All participants see questions simultaneously
- **20-second Timer**: Each question has a 20-second timeout
- **Live Scoring**: Scores are tracked and updated in real-time
- **Leaderboard**: Final rankings shown at the end
- **Responsive Design**: Works on desktop and mobile devices

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

### 2. Configure the App

1. Open `app.js`
2. Replace the `firebaseConfig` object with your actual Firebase configuration:
   ```javascript
   const firebaseConfig = {
       apiKey: "your-api-key",
       authDomain: "your-project.firebaseapp.com",
       databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
       projectId: "your-project-id",
       storageBucket: "your-project.appspot.com",
       messagingSenderId: "123456789",
       appId: "your-app-id"
   };
   ```

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