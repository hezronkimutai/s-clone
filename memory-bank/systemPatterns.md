# System Patterns: Quiz Master Architecture

## Design Patterns

### 1. Observer Pattern (Real-time Updates)
**Implementation**: Firebase listeners for real-time data synchronization
```javascript
// Example: Listening for participant changes
database.ref(`sessions/${sessionCode}/participants`).on('value', (snapshot) => {
    updateParticipantsList(snapshot.val());
});
```
**Benefits**: Automatic UI updates, reduced polling, efficient bandwidth usage

### 2. State Machine Pattern (Session Management)
**States**: `waiting` → `active` → `completed`
**Transitions**: Host-controlled progression through quiz phases
**Implementation**: Session status field with state-dependent UI rendering

### 3. Module Pattern (Code Organization)
**Structure**: Separated concerns for session management, UI updates, and Firebase operations
**Benefits**: Maintainable code, clear separation of responsibilities

### 4. Event-Driven Architecture
**Implementation**: DOM event listeners and Firebase event handlers
**Flow**: User Action → Event Handler → State Update → UI Refresh

## Communication Patterns

### 1. Real-time Bidirectional Communication
```
Host ←→ Firebase Database ←→ Participants
```
- **Protocol**: WebSocket-based Firebase listeners
- **Latency**: <100ms for most operations
- **Reliability**: Automatic reconnection and offline support

### 2. Pub/Sub Pattern
- **Publishers**: Hosts creating questions, participants submitting answers
- **Subscribers**: All session participants listening for updates
- **Topics**: Session status, current question, participant list, scores

### 3. Request/Response Pattern
- **Session Creation**: Synchronous Firebase write operations
- **Question Submission**: Async operations with optimistic UI updates
- **Error Handling**: Toast notifications for user feedback

## Data Flow Patterns

### 1. Unidirectional Data Flow
```
User Input → State Update → Firebase Write → Firebase Listener → UI Update
```

### 2. Optimistic Updates
- **Pattern**: UI updates immediately, rolls back on failure
- **Use Case**: Answer submission during network delays
- **Implementation**: Local state with Firebase sync

### 3. Event Sourcing (Simplified)
- **Pattern**: Store participant answers as events
- **Benefits**: Score recalculation, audit trail, answer history
- **Implementation**: Append-only answer arrays in Firebase

## Error Handling Patterns

### 1. Circuit Breaker Pattern
- **Implementation**: Timeout handling for Firebase operations
- **Fallback**: Local storage for questions during offline periods

### 2. Retry Pattern
- **Use Case**: Network failures during session creation/joining
- **Implementation**: Exponential backoff for Firebase operations

### 3. Graceful Degradation
- **Offline Mode**: Continue quiz with local questions when Firebase unavailable
- **Reduced Functionality**: Basic timer and scoring without real-time updates

## Security Patterns

### 1. Input Validation
- **Client-side**: Form validation for user inputs
- **Server-side**: Firebase security rules (future implementation)

### 2. Access Control (Future)
- **Pattern**: Role-based access (host vs participant permissions)
- **Implementation**: Firebase Authentication with custom claims

## Performance Patterns

### 1. Lazy Loading
- **Implementation**: Load questions only when needed
- **Benefits**: Faster initial page load, reduced memory usage

### 2. Connection Pooling
- **Pattern**: Reuse Firebase connections across operations
- **Benefits**: Reduced connection overhead, improved performance

### 3. Debouncing
- **Use Case**: User input handling (question creation, name entry)
- **Implementation**: Delay Firebase writes until user stops typing

## UI Patterns

### 1. Screen Router Pattern
- **Implementation**: Screen visibility toggling based on application state
- **Benefits**: SPA-like experience without routing library complexity

### 2. Component Communication
- **Pattern**: Global state with centralized update functions
- **Implementation**: Shared variables and update functions

### 3. Notification Pattern
- **Implementation**: Toast notification system
- **Types**: Success, error, warning, info messages
- **Behavior**: Auto-dismiss with manual close option

## Scalability Patterns

### 1. Horizontal Scaling
- **Firebase**: Automatic scaling based on concurrent connections
- **Client**: No server-side code to scale

### 2. Data Partitioning
- **Pattern**: Session-based data isolation
- **Implementation**: Separate Firebase paths per session

### 3. Caching Strategy
- **Browser Cache**: Static assets (CSS, JS)
- **Local Storage**: Question sets and user preferences
- **Firebase Cache**: Built-in client-side caching
