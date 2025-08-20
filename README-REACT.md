# Quiz Master - React.js Application

A modern, real-time quiz application built with React.js and TypeScript, featuring Firebase integration for authentication and real-time database functionality. This is a Slido clone that enables hosts to create interactive quiz sessions and participants to join using shareable codes.

## 🚀 Features

### Core Functionality
- **Real-time Quiz Sessions**: Create and join quiz sessions with 6-digit codes
- **Live Question Display**: Synchronized question progression across all participants
- **Timer-based Questions**: 20-second countdown for each question
- **Real-time Scoring**: Live leaderboard and score tracking
- **Question Management**: Built-in question editor with default tech/dairy-themed questions

### Authentication & User Management
- **Google Sign-In**: OAuth integration for seamless authentication
- **Email/Password**: Traditional email-based authentication
- **Guest Mode**: Participate without account creation
- **Profile Management**: User avatars, display names, and session history

### Technical Features
- **React Router**: Client-side routing for seamless navigation
- **TypeScript**: Type-safe development with comprehensive interfaces
- **Firebase Integration**: Real-time database and authentication
- **Responsive Design**: Mobile-first approach with cross-device compatibility
- **Real-time Updates**: WebSocket-based synchronization via Firebase
- **Toast Notifications**: User-friendly feedback system

## 🛠 Technology Stack

- **Frontend**: React 18 + TypeScript
- **Routing**: React Router DOM
- **Backend**: Firebase (Realtime Database + Authentication)
- **Styling**: CSS3 with custom properties and animations
- **State Management**: React Context API with useReducer
- **Build Tool**: Create React App
- **Development**: Hot reload with React Scripts

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Firebase project with Realtime Database and Authentication enabled
- Modern web browser with ES6 support

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd s-clone
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   Update `.env` file with your Firebase configuration:
   ```env
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
   REACT_APP_FIREBASE_DATABASE_URL=your_database_url
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🎮 How to Use

### For Quiz Hosts
1. **Sign In** (optional but recommended for saving quizzes)
2. **Create Quiz** → Enter your name and click "Create Quiz Session"
3. **Share Code** → Provide the 6-digit code to participants
4. **Start Quiz** → Begin when all participants have joined
5. **Monitor Progress** → View real-time answers and scores

### For Participants
1. **Join Quiz** → Enter the 6-digit session code
2. **Enter Name** → Provide your display name
3. **Wait for Start** → Host will begin the quiz
4. **Answer Questions** → Select answers within the time limit
5. **View Results** → See your score and ranking

## 🔧 Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run test suite
- `npm run eject` - Eject from Create React App

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── HomeScreen/      # Landing page and main navigation
│   ├── CreateQuizScreen/# Quiz creation interface
│   ├── JoinQuizScreen/  # Session joining interface
│   ├── Toast/           # Notification component
│   └── ToastContainer/  # Toast management
├── config/              # Configuration files
│   └── firebase.ts      # Firebase initialization
├── context/             # React Context for state management
│   └── AppContext.tsx   # Global application state
├── data/                # Static data and constants
│   └── constants.ts     # Default questions and config
├── services/            # External service integrations
│   ├── auth.ts          # Authentication services
│   └── firebase.ts      # Database operations
├── types/               # TypeScript type definitions
│   └── index.ts         # Shared interfaces and types
├── App.tsx              # Main application component
├── App.css              # Global styles
└── index.tsx            # Application entry point
```

## 🔥 Firebase Integration

### Authentication
- Google OAuth provider
- Email/password authentication
- Anonymous authentication support
- User profile management

### Realtime Database
- Session management
- Question storage and retrieval
- Real-time participant updates
- Score tracking and leaderboards

## 🎨 Design Features

### Responsive Design
- Mobile-first approach
- Flexible grid layouts
- Touch-friendly interface
- Cross-browser compatibility

### Visual Elements
- Gradient backgrounds
- Glassmorphism effects
- Smooth animations and transitions
- Toast notification system
- Loading states and spinners

## 📊 Conversion from Vanilla JavaScript

This application was successfully converted from a vanilla JavaScript implementation to a modern React.js application. Key improvements include:

- **Component Architecture**: Modular, reusable React components
- **Type Safety**: Full TypeScript integration with comprehensive interfaces
- **State Management**: React Context API replacing global variables
- **Modern Routing**: React Router for client-side navigation
- **Improved Maintainability**: Better code organization and separation of concerns
- **Enhanced Developer Experience**: Hot reload, TypeScript intellisense, and modern tooling

## 🐛 Known Issues & Limitations

- Real-time updates depend on stable internet connection
- Mobile browsers may have timer accuracy variations
- Large participant numbers (>100) may require optimization
- Offline functionality is limited

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- React.js team for the amazing framework
- Firebase team for the real-time database and authentication
- Create React App for the build tooling
- The open-source community for inspiration and support

---

**Made with ❤️ using React.js and Firebase**
