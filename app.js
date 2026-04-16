import { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, collection, addDoc, query, where, getDocs, doc, setDoc, getDoc, orderBy, limit, increment } from './firebase-config.js';

// Global variables
let currentUser = null;
let isLoginMode = false;
let timerInterval = null;
let timerSeconds = 45 * 60; // 45 minutes in seconds
let isTimerRunning = false;

// DOM Elements
const authModal = document.getElementById('authModal');
const authTitle = document.getElementById('authTitle');
const authSubmit = document.getElementById('authSubmit');
const authToggleLink = document.getElementById('authToggleLink');
const authError = document.getElementById('authError');
const app = document.getElementById('app');
const userEmail = document.getElementById('user-email');
const logoutBtn = document.querySelector('.logout-btn');

// Navigation
const navBtns = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page');
const sidebarNav = document.querySelector('.sidebar-nav');

// Dashboard Elements
const todayHours = document.getElementById('dash-today');
const currentStreak = document.getElementById('dash-streak');
const weeklyTotal = document.getElementById('dash-weekly');
const goalProgress = document.getElementById('dash-goal-pct');

// Study Log Elements
const physicsHours = document.getElementById('physicsHours');
const chemistryHours = document.getElementById('chemistryHours');
const mathHours = document.getElementById('mathHours');
const dailyGoal = document.getElementById('dailyGoal');
const logStudyBtn = document.getElementById('logStudyBtn');
const sessionsList = document.getElementById('sessionsList');

// Timer Elements
const timerTime = document.getElementById('timerTime');
const timerPhase = document.querySelector('.timer-phase');
const startTimerBtn = document.getElementById('startTimerBtn');
const pauseTimerBtn = document.getElementById('pauseTimerBtn');
const resetTimerBtn = document.getElementById('resetTimerBtn');
const currentTask = document.getElementById('currentTask');

// Progress Elements
const physicsProgress = document.getElementById('physicsProgress');
const chemistryProgress = document.getElementById('chemistryProgress');
const mathProgress = document.getElementById('mathProgress');
const physicsTotal = document.getElementById('physicsTotal');
const chemistryTotal = document.getElementById('chemistryTotal');
const mathTotal = document.getElementById('mathTotal');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    setupAuthListener();
});

// Event Listeners
function setupEventListeners() {
    // Auth
    const authForm = document.getElementById('authForm');
    authForm.addEventListener('submit', handleAuth);
    authToggleLink.addEventListener('click', toggleAuthMode);
    logoutBtn.addEventListener('click', handleLogout);

    // Navigation
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => switchPage(btn.dataset.page));
    });

    // Study Log
    logStudyBtn.addEventListener('click', logStudySession);

    // Timer
    startTimerBtn.addEventListener('click', startTimer);
    pauseTimerBtn.addEventListener('click', pauseTimer);
    resetTimerBtn.addEventListener('click', resetTimer);
}

// Authentication
function setupAuthListener() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            // Store user profile in Firestore
            storeUserProfile(user);
            showApp();
            loadUserData();
        } else {
            currentUser = null;
            showAuthModal();
        }
    });
}

// Store user profile in Firestore
async function storeUserProfile(user) {
    try {
        const userDoc = doc(db, 'users', user.uid);
        const userSnapshot = await getDoc(userDoc);
        
        if (!userSnapshot.exists()) {
            // Create new user profile
            await setDoc(userDoc, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email.split('@')[0],
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                dailyGoal: 8,
                totalStudyHours: 0,
                streak: 0
            });
            console.log('User profile created in Firestore');
        } else {
            // Update last login
            await setDoc(userDoc, {
                lastLogin: new Date().toISOString()
            }, { merge: true });
            console.log('User login updated in Firestore');
        }
    } catch (error) {
        console.error('Error storing user profile:', error);
    }
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    authTitle.textContent = isLoginMode ? 'Login' : 'Sign Up';
    authSubmit.textContent = isLoginMode ? 'Login' : 'Sign Up';
    authToggleText.innerHTML = isLoginMode ? 
        "Don't have an account? <a href='#' id='authToggleLink'>Sign Up</a>" : 
        "Already have an account? <a href='#' id='authToggleLink'>Login</a>";
    
    // Re-attach event listener to new toggle link
    document.getElementById('authToggleLink').addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthMode();
    });
    authError.textContent = '';
}

async function handleAuth(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        authError.textContent = '';
        
        if (isLoginMode) {
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            await createUserWithEmailAndPassword(auth, email, password);
        }
    } catch (error) {
        authError.textContent = error.message;
    }
}

async function handleLogout() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Logout error:', error);
    }
}

function showAuthModal() {
    authModal.style.display = 'flex';
    app.style.display = 'none';
}

function showApp() {
    authModal.style.display = 'none';
    app.style.display = 'flex';
    if (userEmail) {
        userEmail.textContent = currentUser.email;
    }
}

// Navigation
function switchPage(pageName) {
    navBtns.forEach(btn => btn.classList.remove('active'));
    pages.forEach(page => page.classList.remove('active'));
    
    const activeBtn = document.querySelector(`[data-page="${pageName}"]`);
    const activePage = document.getElementById(`page-${pageName}`);
    
    if (activeBtn) activeBtn.classList.add('active');
    if (activePage) activePage.classList.add('active');
    
    // Show/hide sidebar on desktop
    if (window.innerWidth >= 768) {
        sidebarNav.classList.add('active');
    }
    
    // Load page-specific data
    if (pageName === 'home') {
        loadDashboardData();
    } else if (pageName === 'study') {
        loadRecentSessions();
    } else if (pageName === 'progress') {
        loadProgressData();
    }
}

// Data Loading
async function loadUserData() {
    if (!currentUser) return;
    
    try {
        // Load user profile from Firestore
        const userDoc = doc(db, 'users', currentUser.uid);
        const userSnapshot = await getDoc(userDoc);
        
        if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            
            // Update UI with user profile data
            if (userData.dailyGoal) {
                dailyGoal.value = userData.dailyGoal;
            }
            
            // Update user display info
            const displayName = userData.displayName || currentUser.email.split('@')[0];
            userEmail.textContent = `${displayName} (${currentUser.email})`;
            
            console.log('User profile loaded:', userData);
        }
        
        // Load dashboard data
        loadDashboardData();
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

async function loadDashboardData() {
    if (!currentUser) return;
    
    try {
        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        // Get user document with all study data
        const userDoc = doc(db, 'users', currentUser.uid);
        const userSnapshot = await getDoc(userDoc);
        
        let todayTotal = 0;
        let weekTotal = 0;
        const weekData = {};
        
        if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            const studySessions = userData.studySessions || [];
            
            // Process study sessions
            studySessions.forEach(session => {
                const dayTotal = session.physics + session.chemistry + session.mathematics;
                
                // Today's total
                if (session.date === today) {
                    todayTotal += dayTotal;
                }
                
                // Week's data
                if (session.date >= weekAgo.toISOString().split('T')[0]) {
                    weekTotal += dayTotal;
                    weekData[session.date] = (weekData[session.date] || 0) + dayTotal;
                }
            });
        }
        
        // Calculate streak
        const streak = await calculateStreak();
        
        // Update UI
        todayHours.textContent = `${todayTotal}h`;
        weeklyTotal.textContent = `${weekTotal}h`;
        currentStreak.textContent = `${streak} days`;
        
        const goal = parseFloat(dailyGoal.value) || 8;
        const progressPercent = Math.min(Math.round((todayTotal / goal) * 100), 100);
        goalProgress.textContent = `${progressPercent}%`;
        
        // Update weekly chart
        updateWeeklyChart(weekData);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

async function calculateStreak() {
    if (!currentUser) return 0;
    
    try {
        const userDoc = doc(db, 'users', currentUser.uid);
        const userSnapshot = await getDoc(userDoc);
        
        if (!userSnapshot.exists()) return 0;
        
        const userData = userSnapshot.data();
        const studySessions = userData.studySessions || [];
        
        // Get unique study dates
        const dates = [...new Set(studySessions.map(session => session.date))];
        
        let streak = 0;
        const today = new Date();
        
        for (let i = 0; i < dates.length; i++) {
            const checkDate = new Date();
            checkDate.setDate(today.getDate() - i);
            const checkDateStr = checkDate.toISOString().split('T')[0];
            
            if (dates.includes(checkDateStr)) {
                streak++;
            } else if (i > 0) {
                break;
            }
        }
        
        return streak;
    } catch (error) {
        console.error('Error calculating streak:', error);
        return 0;
    }
}

async function logStudySession() {
    if (!currentUser) return;
    
    const physics = parseFloat(physicsHours.value) || 0;
    const chemistry = parseFloat(chemistryHours.value) || 0;
    const mathematics = parseFloat(mathHours.value) || 0;
    const goal = parseFloat(dailyGoal.value) || 8;
    const today = new Date().toISOString().split('T')[0];
    
    if (physics === 0 && chemistry === 0 && mathematics === 0) {
        alert('Please enter at least one subject study hours');
        return;
    }
    
    try {
        // Save study session under user document
        const userDoc = doc(db, 'users', currentUser.uid);
        const userSnapshot = await getDoc(userDoc);
        
        let studySessions = [];
        if (userSnapshot.exists() && userSnapshot.data().studySessions) {
            studySessions = userSnapshot.data().studySessions;
        }
        
        // Add new study session
        studySessions.push({
            date: today,
            physics,
            chemistry,
            mathematics,
            totalHours: physics + chemistry + mathematics,
            timestamp: new Date().toISOString()
        });
        
        // Update user document with study sessions and settings
        await setDoc(userDoc, {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: userSnapshot.exists() ? userSnapshot.data().displayName : currentUser.email.split('@')[0],
            dailyGoal: goal,
            studySessions: studySessions,
            lastStudySession: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }, { merge: true });
        
        // Clear form
        physicsHours.value = 0;
        chemistryHours.value = 0;
        mathHours.value = 0;
        
        // Refresh data
        loadDashboardData();
        loadRecentSessions();
        
        alert('Study session logged successfully!');
        
    } catch (error) {
        console.error('Error logging study session:', error);
        alert('Error logging study session. Please try again.');
    }
}

async function loadRecentSessions() {
    if (!currentUser) return;
    
    try {
        // Get user document with all study data
        const userDoc = doc(db, 'users', currentUser.uid);
        const userSnapshot = await getDoc(userDoc);
        
        sessionsList.innerHTML = '';
        
        if (!userSnapshot.exists()) {
            sessionsList.innerHTML = '<p style="color: var(--text-secondary);">No study sessions yet.</p>';
            return;
        }
        
        const userData = userSnapshot.data();
        const studySessions = userData.studySessions || [];
        
        if (studySessions.length === 0) {
            sessionsList.innerHTML = '<p style="color: var(--text-secondary);">No study sessions yet.</p>';
            return;
        }
        
        // Sort by date descending and take top 10
        studySessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const recentSessions = studySessions.slice(0, 10);
        
        recentSessions.forEach(session => {
            const sessionEl = document.createElement('div');
            sessionEl.className = 'session-item';
            sessionEl.style.cssText = `
                background: var(--dark-bg);
                padding: 1rem;
                border-radius: 0.5rem;
                margin-bottom: 0.5rem;
                border: 1px solid var(--border-color);
            `;
            
            const total = session.physics + session.chemistry + session.mathematics;
            sessionEl.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${session.date}</strong>
                        <div style="color: var(--text-secondary); font-size: 0.875rem;">
                            Physics: ${session.physics}h | Chemistry: ${session.chemistry}h | Math: ${session.mathematics}h
                        </div>
                    </div>
                    <div style="color: var(--primary-color); font-weight: 600;">
                        ${total}h total
                    </div>
                </div>
            `;
            
            sessionsList.appendChild(sessionEl);
        });
        
    } catch (error) {
        console.error('Error loading recent sessions:', error);
    }
}

// Timer Functions
function startTimer() {
    if (!isTimerRunning) {
        isTimerRunning = true;
        startTimerBtn.disabled = true;
        pauseTimerBtn.disabled = false;
        timerStatus.textContent = currentTask.value || 'Focus Session';
        
        timerInterval = setInterval(() => {
            timerSeconds--;
            updateTimerDisplay();
            
            if (timerSeconds <= 0) {
                completeTimerSession();
            }
        }, 1000);
    }
}

function pauseTimer() {
    if (isTimerRunning) {
        isTimerRunning = false;
        clearInterval(timerInterval);
        startTimerBtn.disabled = false;
        pauseTimerBtn.disabled = true;
        timerStatus.textContent = 'Paused';
    }
}

function resetTimer() {
    isTimerRunning = false;
    clearInterval(timerInterval);
    timerSeconds = 45 * 60;
    updateTimerDisplay();
    startTimerBtn.disabled = false;
    pauseTimerBtn.disabled = true;
    timerStatus.textContent = 'Ready to Focus';
}

function updateTimerDisplay() {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    timerTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

async function completeTimerSession() {
    pauseTimer();
    timerStatus.textContent = 'Session Complete!';
    
    // Log the session under user document
    if (currentUser && currentTask.value) {
        try {
            const userDoc = doc(db, 'users', currentUser.uid);
            const userSnapshot = await getDoc(userDoc);
            
            let pomodoroSessions = [];
            if (userSnapshot.exists() && userSnapshot.data().pomodoroSessions) {
                pomodoroSessions = userSnapshot.data().pomodoroSessions;
            }
            
            // Add new pomodoro session
            pomodoroSessions.push({
                task: currentTask.value,
                completedAt: new Date().toISOString(),
                duration: 45, // minutes
                date: new Date().toISOString().split('T')[0]
            });
            
            // Update user document with pomodoro sessions
            await setDoc(userDoc, {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: userSnapshot.exists() ? userSnapshot.data().displayName : currentUser.email.split('@')[0],
                pomodoroSessions: pomodoroSessions,
                lastPomodoroSession: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }, { merge: true });
            
        } catch (error) {
            console.error('Error logging pomodoro session:', error);
        }
    }
    
    setTimeout(() => {
        alert('Great job! 45-minute focus session completed!');
        resetTimer();
    }, 1000);
}

// Progress Functions
async function loadProgressData() {
    if (!currentUser) return;
    
    try {
        // Get user document with all study data
        const userDoc = doc(db, 'users', currentUser.uid);
        const userSnapshot = await getDoc(userDoc);
        
        let physicsTotal = 0;
        let chemistryTotal = 0;
        let mathTotal = 0;
        
        if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            const studySessions = userData.studySessions || [];
            
            studySessions.forEach(session => {
                physicsTotal += session.physics;
                chemistryTotal += session.chemistry;
                mathTotal += session.mathematics;
            });
        }
        
        const total = physicsTotal + chemistryTotal + mathTotal;
        
        // Update progress bars
        const physicsPercent = total > 0 ? (physicsTotal / total) * 100 : 0;
        const chemistryPercent = total > 0 ? (chemistryTotal / total) * 100 : 0;
        const mathPercent = total > 0 ? (mathTotal / total) * 100 : 0;
        
        physicsProgress.style.width = `${physicsPercent}%`;
        chemistryProgress.style.width = `${chemistryPercent}%`;
        mathProgress.style.width = `${mathPercent}%`;
        
        document.getElementById('physicsTotal').textContent = `${physicsTotal.toFixed(1)}h total`;
        document.getElementById('chemistryTotal').textContent = `${chemistryTotal.toFixed(1)}h total`;
        document.getElementById('mathTotal').textContent = `${mathTotal.toFixed(1)}h total`;
        
        // Update monthly chart
        updateMonthlyChart();
        
    } catch (error) {
        console.error('Error loading progress data:', error);
    }
}

// Chart Functions
function updateWeeklyChart(weekData) {
    const ctx = document.getElementById('weeklyChart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
        existingChart.destroy();
    }
    
    const labels = [];
    const data = [];
    
    // Get current week data (last 7 days)
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        labels.push(dayName);
        // Only show data for the current week, don't accumulate
        data.push(weekData[dateStr] || 0);
    }
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Study Hours',
                data: data,
                backgroundColor: 'rgba(79, 70, 229, 0.6)',
                borderColor: 'rgba(79, 70, 229, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            resizeDelay: 0,
            aspectRatio: 2,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 12,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#94a3b8'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#94a3b8'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#f1f5f9'
                    }
                }
            }
        }
    });
}

async function updateMonthlyChart() {
    const ctx = document.getElementById('monthlyChart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
        existingChart.destroy();
    }
    
    // Get user document for real data
    const userDoc = doc(db, 'users', currentUser.uid);
    const userSnapshot = await getDoc(userDoc);
    
    // Generate last 30 days of data
    const labels = [];
    const data = [];
    
    if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        const studySessions = userData.studySessions || [];
        
        // Create a map of dates to total hours
        const dateMap = {};
        studySessions.forEach(session => {
            const total = session.physics + session.chemistry + session.mathematics;
            dateMap[session.date] = (dateMap[session.date] || 0) + total;
        });
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            data.push(dateMap[dateStr] || 0);
        }
    } else {
        // Fallback to zero data if no user data
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            data.push(0);
        }
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily Study Hours',
                data: data,
                borderColor: 'rgba(59, 110, 248, 1)',
                backgroundColor: 'rgba(59, 110, 248, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            resizeDelay: 0,
            aspectRatio: 2,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 12,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#94a3b8'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#94a3b8'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#f1f5f9'
                    }
                }
            }
        }
    });
}
