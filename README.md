# JEE Growth Tracker

A modern, clean JEE Mains preparation tracker with Firebase integration and real-time data synchronization.

## Features

### 🎯 Core Features
- **User Authentication**: Secure email/password signup and login
- **Study Tracking**: Log daily study hours for Physics, Chemistry, and Mathematics
- **Progress Dashboard**: Visual charts showing weekly and monthly progress
- **Pomodoro Timer**: 45-minute focus sessions with task tracking
- **Streak Counter**: Track consecutive study days
- **Goal Setting**: Set and monitor daily study goals

### 📊 Analytics
- Real-time dashboard with study statistics
- Weekly progress charts
- Subject-wise progress tracking
- Monthly trend analysis

### 🔥 Firebase Integration
- Real-time data synchronization
- Cloud storage for study sessions
- User progress backup
- Cross-device synchronization

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js with Express
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Charts**: Chart.js
- **Styling**: Custom CSS with modern design

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Firebase project with Authentication and Firestore enabled

### Local Development

1. **Install Dependencies**
   ```bash
   cd "New website"
   npm install
   ```

2. **Firebase Setup**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project or use existing one
   - Enable Authentication (Email/Password method)
   - Enable Firestore Database
   - Update Firestore rules to allow access:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```

3. **Update Firebase Configuration**
   - Copy `.env.example` to `.env`
   - Update with your Firebase project credentials
   - Or edit `src/firebase.ts` directly

4. **Start the Application**
   ```bash
   npm run dev
   ```

5. **Open in Browser**
   - Navigate to `http://localhost:3000`
   - Sign up with email and password
   - Start tracking your JEE preparation!

## Render Deployment

### Quick Deploy (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for Render deployment"
   git push origin main
   ```

2. **Deploy on Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" > "Web Service"
   - Connect your GitHub repository
   - Select the "New website" folder
   - Use the following settings:
     - **Build Command**: `npm run build`
     - **Start Command**: `npm start`
     - **Runtime**: Node 18
     - **Instance Type**: Free

3. **Environment Variables**
   Add these in Render dashboard:
   ```
   FIREBASE_API_KEY=your_api_key
   FIREBASE_AUTH_DOMAIN=your_auth_domain
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_storage_bucket
   FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   FIREBASE_APP_ID=your_app_id
   FIREBASE_MEASUREMENT_ID=your_measurement_id
   NODE_ENV=production
   ```

### Manual Deployment

1. **Build for Production**
   ```bash
   npm run build
   ```

2. **Deploy Files**
   - Upload the contents of the `dist` folder to your hosting service
   - Ensure all Firebase configurations are properly set

### Deployment Configuration Files

- `render.yaml` - Render service configuration
- `vite.config.js` - Build optimization settings
- `server.js` - Production server setup
- `build.sh` - Build script for deployment

## Usage

### Dashboard
- View today's study hours
- Check current study streak
- Monitor weekly progress
- See goal completion percentage

### Study Log
- Enter study hours for each subject
- Set daily study goals
- View recent study sessions
- Track daily progress

### Pomodoro Timer
- Start 45-minute focus sessions
- Track current study task
- Monitor completed sessions
- Maintain focus during study

### Progress Analytics
- View subject-wise progress
- Check monthly trends
- Analyze study patterns
- Monitor improvement over time

## Project Structure

```
New website/
├── index.html          # Main application HTML
├── style.css           # Application styling
├── firebase-config.js  # Firebase configuration
├── app.js             # Main application logic
├── server.js          # Express server
├── package.json       # Node.js dependencies
└── README.md          # This file
```

## Firebase Collections

### users
- User profile information
- Daily study goals
- User preferences

### studySessions
- Daily study logs
- Subject-wise hours
- Timestamps
- User association

### pomodoroSessions
- Completed focus sessions
- Task descriptions
- Session duration
- Completion timestamps

## Features in Detail

### Authentication
- Secure email/password signup
- User session management
- Automatic login persistence
- Secure logout functionality

### Study Tracking
- Subject-wise hour logging
- Daily goal setting
- Progress visualization
- Historical data access

### Real-time Sync
- Instant data synchronization
- Cross-device access
- Cloud backup
- Offline capability (localStorage fallback)

### Responsive Design
- Mobile-first approach
- Tablet and desktop optimization
- Touch-friendly interface
- Modern UI/UX design

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.

---

**Happy Studying! 🎯**
**JEE Growth Tracker - Your Path to Success**
