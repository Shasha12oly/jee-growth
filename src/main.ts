import './main.css';
import { 
  auth, 
  db, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc,
  orderBy, 
  limit, 
  increment, 
  Timestamp, 
  User 
} from './firebase';
import type { StudySession, PomodoroSession, UserProfile } from './types';

// Global variables
let currentUser: User | null = null;
let isLoginMode = true;
let isTimerRunning = false;
let timerInterval: number | null = null;

// Motivational Quotes
const motivationalQuotes = [
    "Believe in yourself. You've survived 100% of your bad days so far.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "The only way to do great work is to love what you do.",
    "Don't watch the clock; do what it does. Keep going.",
    "The future belongs to those who believe in the beauty of their dreams.",
    "It does not matter how slowly you go as long as you do not stop.",
    "Everything you've ever wanted is on the other side of fear.",
    "Believe you can and you're halfway there.",
    "The only impossible journey is the one you never begin.",
    "Success is not how high you have climbed, but how you make a positive difference to the world.",
    "Your limitation—it's only your imagination.",
    "Great things never come from comfort zones.",
    "Dream it. Wish it. Do it.",
    "Success doesn't just find you. You have to go out and get it.",
    "The harder you work for something, the greater you'll feel when you achieve it."
];

let currentQuoteIndex = 0;
let timerSeconds = 45 * 60; // 45 minutes in seconds

// Reminder System variables
let reminders: any[] = [];
let notificationPermission: NotificationPermission = 'default';

// DOM Elements (will be initialized after DOM loads)
let authModal: HTMLDivElement;
let authEmail: HTMLInputElement;
let authPassword: HTMLInputElement;
let authTitle: HTMLHeadingElement;
let authSubmit: HTMLButtonElement;
let authError: HTMLDivElement;
let authToggle: HTMLAnchorElement;
let authToggleText: HTMLSpanElement;
let authToggleLink: HTMLAnchorElement;
let appContainer: HTMLDivElement;
let userEmail: HTMLSpanElement;
let logoutBtn: HTMLButtonElement;

// Dashboard Elements
let todayHours: HTMLHeadingElement;
let currentStreak: HTMLHeadingElement;
let weeklyTotal: HTMLHeadingElement;
let goalProgress: HTMLHeadingElement;

// Study Log Elements
let physicsHours: HTMLInputElement;
let chemistryHours: HTMLInputElement;
let mathHours: HTMLInputElement;
let dailyGoal: HTMLInputElement;
let logStudyBtn: HTMLButtonElement;
let sessionsList: HTMLDivElement;

// Timer Elements
let timerTime: HTMLDivElement;
let startTimerBtn: HTMLButtonElement;
let pauseTimerBtn: HTMLButtonElement;
let resetTimerBtn: HTMLButtonElement;
let currentTask: HTMLInputElement;
let sessionsCompleted: HTMLDivElement;

// Progress Elements
let physicsProgress: HTMLSpanElement;
let chemistryProgress: HTMLSpanElement;
let mathProgress: HTMLSpanElement;

// Authentication functions
function showAuthModal(): void {
  console.log('Showing auth modal...');
  if (authModal) {
    authModal.classList.remove('hidden');
    console.log('Auth modal should be visible now');
  } else {
    console.error('Auth modal element not found');
  }
}

function hideAuthModal(): void {
  console.log('Hiding auth modal...');
  if (authModal) {
    authModal.classList.add('hidden');
  } else {
    console.error('Auth modal element not found');
  }
}

function setAuthMode(login: boolean): void {
  isLoginMode = login;
  authTitle.textContent = login ? 'Welcome Back' : 'Create Account';
  authSubmit.textContent = login ? 'Sign In' : 'Sign Up';
  authToggleText.textContent = login ? "Don't have an account?" : "Already have an account?";
  authToggleLink.textContent = login ? 'Sign up' : 'Sign in';
}

async function handleAuth(email: string, password: string): Promise<void> {
  try {
    // Basic validation
    if (!email || !password) {
      throw new Error('Please enter both email and password');
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address');
    }
    
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    
    if (isLoginMode) {
      console.log('Attempting login with email:', email);
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      console.log('Attempting signup with email:', email);
      await createUserWithEmailAndPassword(auth, email, password);
    }
  } catch (error: any) {
    console.error('Auth error:', error);
    let errorMessage = 'Authentication failed';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email is already registered. Please sign in instead.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak. Please choose a stronger password.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address. Please check and try again.';
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email. Please sign up first.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password. Please try again.';
    }
    
    authError.textContent = errorMessage;
    authError.classList.remove('hidden');
    setTimeout(() => authError.classList.add('hidden'), 5000);
  }
}

async function createUserProfile(user: User): Promise<void> {
  try {
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      dailyGoal: 8,
      totalStudyHours: 0,
      currentStreak: 1,
      createdAt: Timestamp.now(),
      lastStudyDate: Timestamp.now()
    };
    
    await setDoc(doc(db, 'users', user.uid), userProfile);
    console.log('User profile created successfully');
  } catch (error: any) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

async function handleLogout(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Logout error:', error);
  }
}

// Navigation functions
function showPage(pageId: string): void {
  console.log('Switching to page:', pageId);
  
  // Hide all pages
  const pages = document.querySelectorAll('.page');
  if (pages) {
    pages.forEach(page => {
      page.classList.add('hidden');
      page.classList.remove('block');
    });
  }
  
  // Show target page
  const targetPage = document.getElementById(`page-${pageId}`) as HTMLElement;
  if (targetPage) {
    targetPage.classList.remove('hidden');
    targetPage.classList.add('block');
    console.log('Page found and shown:', pageId);
    
    // Load page-specific data
    if (pageId === 'progress' && currentUser) {
      loadProgressData();
    } else if (pageId === 'study' && currentUser) {
      loadRecentSessions();
    } else if (pageId === 'home' && currentUser) {
      loadDashboardData();
    }
  } else {
    console.error('Page not found:', `page-${pageId}`);
  }
  
  // Update navigation buttons
  const navBtns = document.querySelectorAll('.nav-btn');
  if (navBtns) {
    navBtns.forEach(btn => {
      btn.classList.remove('border-purple-500', 'text-purple-400', 'bg-purple-500/10');
      btn.classList.add('border-transparent', 'text-gray-400');
    });
  }
  
  // Highlight active button
  const activeBtn = document.querySelector(`[data-page="${pageId}"]`) as HTMLButtonElement;
  if (activeBtn) {
    activeBtn.classList.remove('border-transparent', 'text-gray-400');
    activeBtn.classList.add('border-purple-500', 'text-purple-400', 'bg-purple-500/10');
  }
}

// Study logging functions
async function logStudySession(): Promise<void> {
  if (!currentUser) return;
  
  const physics = parseFloat(physicsHours.value) || 0;
  const chemistry = parseFloat(chemistryHours.value) || 0;
  const math = parseFloat(mathHours.value) || 0;
  const goal = parseFloat(dailyGoal.value) || 8;
  
  const totalHours = physics + chemistry + math;
  
  if (totalHours === 0) {
    alert('Please enter at least some study hours!');
    return;
  }
  
  try {
    const studySession: Omit<StudySession, 'createdAt'> = {
      userId: currentUser.uid,
      date: Timestamp.now(),
      physics,
      chemistry,
      math,
      totalHours,
      dailyGoal: goal
    };
    
    await addDoc(collection(db, 'studySessions'), studySession);
    
    // Update user profile
    await updateUserProgress(totalHours);
    
    // Clear form
    physicsHours.value = '';
    chemistryHours.value = '';
    mathHours.value = '';
    
    // Refresh dashboard
    await loadDashboardData();
    await loadRecentSessions();
    
    alert('Study session logged successfully!');
  } catch (error: any) {
    console.error('Error logging study session:', error);
    alert('Failed to log study session. Please try again.');
  }
}

async function updateUserProgress(hours: number): Promise<void> {
  if (!currentUser) return;
  
  const userRef = doc(db, 'users', currentUser.uid);
  const userDoc = await getDoc(userRef);
  
  if (userDoc.exists()) {
    await setDoc(userRef, {
      totalStudyHours: increment(hours),
      lastStudyDate: Timestamp.now()
    }, { merge: true });
  } else {
    const userProfile: UserProfile = {
      uid: currentUser.uid,
      email: currentUser.email!,
      dailyGoal: 8,
      totalStudyHours: hours,
      currentStreak: 1,
      createdAt: Timestamp.now()
    };
    await setDoc(userRef, userProfile);
  }
}

// Timer functions
function startTimer(): void {
  if (!isTimerRunning) {
    isTimerRunning = true;
    timerInterval = setInterval(updateTimer, 1000);
    startTimerBtn.textContent = 'Running';
    startTimerBtn.disabled = true;
    pauseTimerBtn.disabled = false;
  }
}

function pauseTimer(): void {
  if (isTimerRunning && timerInterval) {
    isTimerRunning = false;
    clearInterval(timerInterval);
    timerInterval = null;
    startTimerBtn.textContent = 'Resume';
    startTimerBtn.disabled = false;
    pauseTimerBtn.disabled = true;
  }
}

function resetTimer(): void {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  isTimerRunning = false;
  timerSeconds = 45 * 60;
  updateTimerDisplay();
  startTimerBtn.textContent = 'Start';
  startTimerBtn.disabled = false;
  pauseTimerBtn.disabled = true;
}

function updateTimer(): void {
  if (timerSeconds > 0) {
    timerSeconds--;
    updateTimerDisplay();
  } else {
    completePomodoroSession();
  }
}

function updateTimerDisplay(): void {
  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  timerTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

async function completePomodoroSession(): Promise<void> {
  if (!currentUser) return;
  
  resetTimer();
  
  const task = currentTask.value || 'Study Session';
  
  try {
    const pomodoroSession: Omit<PomodoroSession, 'completedAt'> = {
      userId: currentUser.uid,
      task,
      duration: 45,
      startTime: Timestamp.now()
    };
    
    await addDoc(collection(db, 'pomodoroSessions'), pomodoroSession);
    
    currentTask.value = '';
    alert('Pomodoro session completed! Great job!');
    
    await loadTodayPomodoroCount();
  } catch (error: any) {
    console.error('Error completing pomodoro session:', error);
  }
}

// Data loading functions
async function loadDashboardData(): Promise<void> {
  if (!currentUser) return;
  
  try {
    // Load recent study sessions and filter in JavaScript
    const sessionsQuery = query(
      collection(db, 'studySessions'),
      where('userId', '==', currentUser.uid),
      limit(100)
    );
    
    const sessionsSnapshot = await getDocs(sessionsQuery);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    let todayTotal = 0;
    let weeklyTotal = 0;
    let totalHours = 0;
    let bestDayHours = 0;
    const dailyHours: { [key: string]: number } = {};
    
    if (sessionsSnapshot.empty) {
      console.log('No study sessions found for user');
      // Set default values when no data exists
      todayTotal = 0;
      weeklyTotal = 0;
      totalHours = 0;
      bestDayHours = 0;
    } else {
      sessionsSnapshot.forEach((doc: any) => {
        const data = doc.data() as StudySession;
        const sessionDate = data.date.toDate();
        const dateKey = sessionDate.toDateString();
        
        totalHours += data.totalHours;
        dailyHours[dateKey] = (dailyHours[dateKey] || 0) + data.totalHours;
        
        if (sessionDate >= today) {
          todayTotal += data.totalHours;
        }
        if (sessionDate >= weekAgo) {
          weeklyTotal += data.totalHours;
        }
      });
      
      // Calculate best day
      bestDayHours = Math.max(...Object.values(dailyHours), 0);
    }
    
    // Update dashboard stats
    const todayElement = document.getElementById('dash-today');
    if (todayElement) todayElement.textContent = `${todayTotal.toFixed(1)}h`;
    
    const weeklyTotalElement = document.getElementById('dash-weekly');
    if (weeklyTotalElement) weeklyTotalElement.textContent = `${weeklyTotal.toFixed(1)}h`;
    
    // Update progress bars
    const todayProgressBar = document.getElementById('today-progress');
    if (todayProgressBar) {
      const dailyGoal = 8; // Default daily goal
      const progress = Math.min((todayTotal / dailyGoal) * 100, 100);
      todayProgressBar.style.width = `${progress}%`;
    }
    
    // Load user profile for streak
    const userRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userRef);
    
    let currentStreakValue = 0;
    
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserProfile;
      currentStreakValue = userData.currentStreak || 0;
      
      if (currentStreak) {
        currentStreak.textContent = currentStreakValue.toString();
      }
      
      // Calculate goal progress
      const dailyGoal = userData.dailyGoal || 8;
      const goalPercentage = Math.min((todayTotal / dailyGoal) * 100, 100);
      const goalProgressElement = document.getElementById('dash-goal-pct');
      if (goalProgressElement) goalProgressElement.textContent = `${Math.round(goalPercentage)}%`;
      
      // Update circular progress
      const goalRing = document.getElementById('goal-ring');
      if (goalRing) {
        const circumference = 2 * Math.PI * 8;
        const offset = circumference - (goalPercentage / 100) * circumference;
        goalRing.style.strokeDashoffset = offset.toString();
      }
    }
    
    // Update growth analytics
    await updateGrowthAnalytics(sessionsSnapshot.size, totalHours, bestDayHours);
    
    // Update achievements
    await updateAchievements(totalHours, sessionsSnapshot.size, currentStreakValue);
    
    // Load charts
    await loadWeeklyChart();
    await loadSubjectChart();
    
  } catch (error: any) {
    console.error('Error loading dashboard data:', error);
  }
}

async function updateGrowthAnalytics(totalSessions: number, totalHours: number, bestDayHours: number): Promise<void> {
  // Calculate growth rate (mock data for now)
  const growthRate = Math.round(Math.random() * 30 + 10); // 10-40% growth
  const avgDaily = totalHours > 0 ? (totalHours / Math.max(totalSessions, 1)).toFixed(1) : '0';
  
  const growthRateElement = document.getElementById('growth-rate');
  if (growthRateElement) growthRateElement.textContent = `+${growthRate}%`;
  
  const avgDailyElement = document.getElementById('avg-daily');
  if (avgDailyElement) avgDailyElement.textContent = `${avgDaily}h`;
  
  const bestDayElement = document.getElementById('best-day');
  if (bestDayElement) bestDayElement.textContent = `${bestDayHours.toFixed(1)}h`;
  
  const totalSessionsElement = document.getElementById('total-sessions');
  if (totalSessionsElement) totalSessionsElement.textContent = totalSessions.toString();
}

async function updateAchievements(totalHours: number, totalSessions: number, currentStreak: number): Promise<void> {
  // Goal Crusher: Complete daily goals for 7 days straight
  const goalCrusherProgress = Math.min((currentStreak / 7) * 100, 100);
  const goalCrusherElement = document.getElementById('goal-crusher-progress');
  if (goalCrusherElement) {
    goalCrusherElement.style.width = `${goalCrusherProgress}%`;
  }
  
  // Update goal crusher text separately
  const goalCrusherText = document.querySelector('#goal-crusher-progress').parentElement?.nextElementSibling;
  if (goalCrusherText) {
    (goalCrusherText as HTMLElement).textContent = `${currentStreak}/7 days`;
  }
  
  // Study Master: Study 100+ hours total
  const studyMasterProgress = Math.min((totalHours / 100) * 100, 100);
  const studyMasterElement = document.getElementById('study-master-progress');
  if (studyMasterElement) {
    studyMasterElement.style.width = `${studyMasterProgress}%`;
  }
  
  // Update study master text separately
  const studyMasterText = document.querySelector('#study-master-progress').parentElement?.nextElementSibling;
  if (studyMasterText) {
    (studyMasterText as HTMLElement).textContent = `${Math.round(totalHours)}/100 hours`;
  }
  
  // Speed Learner: Complete 50 study sessions
  const speedLearnerProgress = Math.min((totalSessions / 50) * 100, 100);
  const speedLearnerElement = document.getElementById('speed-learner-progress');
  if (speedLearnerElement) {
    speedLearnerElement.style.width = `${speedLearnerProgress}%`;
  }
  
  // Update speed learner text separately
  const speedLearnerText = document.querySelector('#speed-learner-progress').parentElement?.nextElementSibling;
  if (speedLearnerText) {
    (speedLearnerText as HTMLElement).textContent = `${totalSessions}/50 sessions`;
  }
}

async function loadRecentSessions(): Promise<void> {
  if (!currentUser) return;
  
  try {
    // Use a simpler query to avoid index requirements
    const sessionsQuery = query(
      collection(db, 'studySessions'),
      where('userId', '==', currentUser.uid),
      limit(50) // Get more documents and sort in JavaScript
    );
    
    const sessionsSnapshot = await getDocs(sessionsQuery);
    sessionsList.innerHTML = '';
    
    // Sort documents in JavaScript
    const sessions = sessionsSnapshot.docs
      .map((doc: any) => ({ id: doc.id, data: doc.data() as StudySession }))
      .sort((a: any, b: any) => b.data.date.toMillis() - a.data.date.toMillis())
      .slice(0, 10); // Take only the 10 most recent
    
    sessions.forEach((session: any) => {
      const data = session.data;
      const sessionDate = data.date.toDate();
      
      const sessionElement = document.createElement('div');
      sessionElement.className = 'bg-gray-800 rounded-lg p-4 border border-gray-700';
      sessionElement.innerHTML = `
        <div class="flex justify-between items-center">
          <div>
            <p class="font-medium text-white">${sessionDate.toLocaleDateString()}</p>
            <p class="text-sm text-gray-400">
              Physics: ${data.physics}h | Chemistry: ${data.chemistry}h | Math: ${data.math}h
            </p>
          </div>
          <div class="text-right">
            <p class="font-semibold text-purple-400">${data.totalHours.toFixed(1)}h</p>
            <p class="text-sm text-gray-400">Total</p>
          </div>
        </div>
      `;
      
      if (sessionsList) sessionsList.appendChild(sessionElement);
    });
    
    if (sessions.length === 0) {
      sessionsList.innerHTML = '<p class="text-gray-400 text-center">No study sessions yet. Start logging your study hours!</p>';
    }
    
  } catch (error: any) {
    console.error('Error loading recent sessions:', error);
  }
}

async function loadTodayPomodoroCount(): Promise<void> {
  if (!currentUser) return;
  
  try {
    // Use a simpler query to avoid index requirements
    const pomodoroQuery = query(
      collection(db, 'pomodoroSessions'),
      where('userId', '==', currentUser.uid),
      limit(100) // Get more documents and filter in JavaScript
    );
    
    const pomodoroSnapshot = await getDocs(pomodoroQuery);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let todayCount = 0;
    pomodoroSnapshot.forEach(doc => {
      const data = doc.data() as PomodoroSession;
      if (data.completedAt && data.completedAt.toDate() >= today) {
        todayCount++;
      }
    });
    
    sessionsCompleted.textContent = todayCount.toString();
    
  } catch (error: any) {
    console.error('Error loading pomodoro count:', error);
  }
}

async function loadWeeklyChart(): Promise<void> {
  if (!currentUser) return;
  
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    // Use simpler query to avoid index requirements
    const weeklyQuery = query(
      collection(db, 'studySessions'),
      where('userId', '==', currentUser.uid),
      limit(100) // Get more documents and filter in JavaScript
    );
    
    const weeklySnapshot = await getDocs(weeklyQuery);
    const dailyData: { [key: string]: number } = {};
    
    // Initialize with 0 for each day
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toLocaleDateString();
      dailyData[dateKey] = 0;
    }
    
    // Filter documents in JavaScript to avoid index requirements
    const filteredDocs = weeklySnapshot.docs.filter(doc => {
      const data = doc.data() as StudySession;
      return data.date.toDate() >= weekAgo;
    });

    filteredDocs.forEach(doc => {
      const data = doc.data() as StudySession;
      const dateKey = data.date.toDate().toLocaleDateString();
      if (dailyData.hasOwnProperty(dateKey)) {
        dailyData[dateKey] += data.totalHours;
      }
    });
    
    const canvas = document.getElementById('weeklyChart') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Destroy existing chart if it exists
      const existingChart = (window as any).Chart?.getChart(canvas);
      if (existingChart) {
        existingChart.destroy();
      }
      
      // Ensure Chart.js is available
      if (typeof (window as any).Chart === 'undefined') {
        console.error('Chart.js is not loaded');
        return;
      }
      
      new (window as any).Chart(ctx, {
        type: 'bar',
        data: {
          labels: Object.keys(dailyData).reverse(),
          datasets: [{
            label: 'Study Hours',
            data: Object.values(dailyData).reverse(),
            backgroundColor: 'rgba(147, 51, 234, 0.6)',
            borderColor: 'rgba(147, 51, 234, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              ticks: {
                color: 'rgba(255, 255, 255, 0.8)'
              }
            },
            x: {
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              ticks: {
                color: 'rgba(255, 255, 255, 0.8)'
              }
            }
          },
          plugins: {
            legend: {
              labels: {
                color: 'rgba(255, 255, 255, 0.8)'
              }
            }
          }
        }
      });
    }
    
  } catch (error: any) {
    console.error('Error loading weekly chart:', error);
  }
}

async function loadSubjectChart(): Promise<void> {
  if (!currentUser) return;
  
  try {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    // Use simpler query to avoid index requirements
    const monthlyQuery = query(
      collection(db, 'studySessions'),
      where('userId', '==', currentUser.uid),
      limit(100) // Get more documents and filter in JavaScript
    );
    
    const monthlySnapshot = await getDocs(monthlyQuery);
    let physicsTotal = 0;
    let chemistryTotal = 0;
    let mathTotal = 0;
    
    // Filter documents in JavaScript to avoid index requirements
    const filteredDocs = monthlySnapshot.docs.filter((doc: any) => {
      const data = doc.data() as StudySession;
      return data.date.toDate() >= monthAgo;
    });

    filteredDocs.forEach((doc: any) => {
      const data = doc.data() as StudySession;
      physicsTotal += data.physics;
      chemistryTotal += data.chemistry;
      mathTotal += data.math;
    });
    
    const canvas = document.getElementById('subjectChart') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Destroy existing chart if it exists
      const existingChart = (window as any).Chart?.getChart(canvas);
      if (existingChart) {
        existingChart.destroy();
      }
      
      // Ensure Chart.js is available
      if (typeof (window as any).Chart === 'undefined') {
        console.error('Chart.js is not loaded');
        return;
      }
      
      new (window as any).Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Physics', 'Chemistry', 'Mathematics'],
          datasets: [{
            data: [physicsTotal, chemistryTotal, mathTotal],
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(34, 197, 94, 0.8)',
              'rgba(168, 85, 247, 0.8)'
            ],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: 'rgba(255, 255, 255, 0.8)'
              }
            }
          }
        }
      });
    }
    
  } catch (error: any) {
    console.error('Error loading subject chart:', error);
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements
    authModal = document.getElementById('authModal') as HTMLDivElement;
    authEmail = document.getElementById('email') as HTMLInputElement;
    authPassword = document.getElementById('password') as HTMLInputElement;
    authTitle = document.getElementById('authTitle') as HTMLHeadingElement;
    authSubmit = document.getElementById('authSubmit') as HTMLButtonElement;
    authError = document.getElementById('authError') as HTMLDivElement;
    authToggle = document.getElementById('authToggle') as HTMLAnchorElement;
    authToggleText = document.getElementById('authToggleText') as HTMLSpanElement;
    authToggleLink = document.getElementById('authToggleLink') as HTMLAnchorElement;
    appContainer = document.getElementById('appContainer') as HTMLDivElement;
    userEmail = document.getElementById('user-email') as HTMLSpanElement;
    logoutBtn = document.getElementById('logoutBtn') as HTMLButtonElement;
    
    // Dashboard Elements
    todayHours = document.getElementById('dash-today') as HTMLHeadingElement;
    currentStreak = document.getElementById('dash-streak') as HTMLHeadingElement;
    weeklyTotal = document.getElementById('dash-weekly') as HTMLHeadingElement;
    goalProgress = document.getElementById('dash-goal-pct') as HTMLHeadingElement;
    
    // Study Log Elements
    physicsHours = document.getElementById('physicsHours') as HTMLInputElement;
    chemistryHours = document.getElementById('chemistryHours') as HTMLInputElement;
    mathHours = document.getElementById('mathHours') as HTMLInputElement;
    dailyGoal = document.getElementById('dailyGoal') as HTMLInputElement;
    logStudyBtn = document.getElementById('logStudyBtn') as HTMLButtonElement;
    sessionsList = document.getElementById('sessionsList') as HTMLDivElement;
    
    // Timer Elements
    timerTime = document.getElementById('timerTime') as HTMLDivElement;
    startTimerBtn = document.getElementById('startTimerBtn') as HTMLButtonElement;
    pauseTimerBtn = document.getElementById('pauseTimerBtn') as HTMLButtonElement;
    resetTimerBtn = document.getElementById('resetTimerBtn') as HTMLButtonElement;
    currentTask = document.getElementById('currentTask') as HTMLInputElement;
    sessionsCompleted = document.getElementById('sessionsCompleted') as HTMLDivElement;
    
    // Progress Elements
    physicsProgress = document.getElementById('physicsProgress') as HTMLSpanElement;
    chemistryProgress = document.getElementById('chemistryProgress') as HTMLSpanElement;
    mathProgress = document.getElementById('mathProgress') as HTMLSpanElement;
    
    // Auth form
    const authForm = document.getElementById('authForm') as HTMLFormElement;
    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = (document.getElementById('email') as HTMLInputElement).value;
        const password = (document.getElementById('password') as HTMLInputElement).value;
        handleAuth(email, password);
    });
    
    // Auth toggle
    authToggleLink.addEventListener('click', () => {
        setAuthMode(!isLoginMode);
    });
    
    // Logout button
    const logoutButton = document.getElementById('logoutBtn') as HTMLButtonElement;
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
    
    // Study log form
    const studyForm = document.getElementById('studyForm') as HTMLFormElement;
    if (studyForm) {
        studyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            logStudySession();
        });
    }
    
    // Timer buttons
    if (startTimerBtn) {
        startTimerBtn.addEventListener('click', startTimer);
    }
    if (pauseTimerBtn) {
        pauseTimerBtn.addEventListener('click', pauseTimer);
    }
    if (resetTimerBtn) {
        resetTimerBtn.addEventListener('click', resetTimer);
    }
    
    // Navigation - set up after DOM is loaded
    const setupNavigation = () => {
        const navBtns = document.querySelectorAll('.nav-btn');
        if (navBtns) {
            console.log('Setting up navigation for', navBtns.length, 'buttons');
            
            navBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const pageId = (btn as HTMLButtonElement).dataset.page;
                    console.log('Navigation button clicked:', pageId);
                    if (pageId) {
                        showPage(pageId);
                        if (pageId === 'firebase-test') {
                            testFirebaseConnection();
                        }
                    }
                });
            });
        }
    };
    
    setupNavigation();
    
    // Firebase Test buttons
    const testSigninBtn = document.getElementById('test-signin');
    const testWriteBtn = document.getElementById('test-write');
    const testReadBtn = document.getElementById('test-read');
    const testDeleteBtn = document.getElementById('test-delete');
    
    if (testSigninBtn) {
        testSigninBtn.addEventListener('click', () => testAuthOperation('signin'));
    }
    if (testWriteBtn) {
        testWriteBtn.addEventListener('click', () => testDatabaseOperation('write'));
    }
    if (testReadBtn) {
        testReadBtn.addEventListener('click', () => testDatabaseOperation('read'));
    }
    if (testDeleteBtn) {
        testDeleteBtn.addEventListener('click', () => testDatabaseOperation('delete'));
    }
    
    // Initialize motivational quotes
    initializeMotivationalQuotes();
    
    // Initialize reminder system
    initializeReminderSystem();
    
    // Check if user is already logged in
    onAuthStateChanged(auth, (user: any) => {
        currentUser = user;
        console.log('Auth state changed:', user ? 'User logged in' : 'No user');
        if (user) {
            hideAuthModal();
            if (appContainer) appContainer.classList.remove('hidden');
            if (userEmail) userEmail.textContent = user.email!;
            loadDashboardData();
            loadRecentSessions();
            loadTodayPomodoroCount();
        } else {
            if (appContainer) appContainer.classList.add('hidden');
            showAuthModal();
        }
        // updateUserStatus(); // Commented out as function doesn't exist
    });
    
    // Show auth modal initially and ensure dashboard is visible if user is logged in
    setTimeout(() => {
        if (currentUser) {
            hideAuthModal();
            if (appContainer) appContainer.classList.remove('hidden');
            showPage('home');
            loadDashboardData();
        } else {
            if (appContainer) appContainer.classList.add('hidden');
            showAuthModal();
        }
    }, 100);
});

// Motivational Quotes Functions
function initializeMotivationalQuotes(): void {
    const quoteElement = document.getElementById('motivationalQuote');
    if (quoteElement) {
        quoteElement.textContent = motivationalQuotes[0];
        
        // Change quote every 10 seconds
        setInterval(() => {
            currentQuoteIndex = (currentQuoteIndex + 1) % motivationalQuotes.length;
            if (quoteElement) {
                quoteElement.style.opacity = '0';
                setTimeout(() => {
                    quoteElement.textContent = motivationalQuotes[currentQuoteIndex];
                    quoteElement.style.opacity = '1';
                }, 500);
            }
        }, 10000);
    }
}

// Reminder System Functions
function initializeReminderSystem(): void {
    // Check notification permission
    checkNotificationPermission();
    
    // Setup event listeners
    const enableNotificationsBtn = document.getElementById('enableNotifications');
    const addReminderBtn = document.getElementById('addReminder');
    const dailyCheckInCheckbox = document.getElementById('dailyCheckIn');
    const repeatDayButtons = document.querySelectorAll('.repeat-day');
    
    if (enableNotificationsBtn) {
        enableNotificationsBtn.addEventListener('click', requestNotificationPermission);
    }
    
    if (addReminderBtn) {
        addReminderBtn.addEventListener('click', addReminder);
    }
    
    if (dailyCheckInCheckbox) {
        dailyCheckInCheckbox.addEventListener('change', toggleCheckInTime);
    }
    
    repeatDayButtons.forEach(button => {
        button.addEventListener('click', toggleRepeatDay);
    });
    
    // Load saved reminders
    loadReminders();
    
    // Check reminders every minute
    setInterval(checkReminders, 60000);
}

function checkNotificationPermission(): void {
    if ('Notification' in window) {
        notificationPermission = Notification.permission;
        updateNotificationUI();
    }
}

async function requestNotificationPermission(): Promise<void> {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        notificationPermission = permission;
        updateNotificationUI();
        
        if (permission === 'granted') {
            new Notification('JEE Tracker', {
                body: 'Notifications enabled! You will receive study reminders.',
                icon: '/favicon.ico'
            });
        }
    }
}

function updateNotificationUI(): void {
    const permissionDiv = document.getElementById('notificationPermission');
    if (permissionDiv) {
        if (notificationPermission === 'granted') {
            permissionDiv.classList.add('hidden');
        } else {
            permissionDiv.classList.remove('hidden');
        }
    }
}

// Reminder interface
interface Reminder {
    id: string;
    label: string;
    time: string;
    days: number[];
    enabled: boolean;
}

function addReminder(): void {
    const labelInput = document.getElementById('reminderLabel') as HTMLInputElement;
    const timeInput = document.getElementById('reminderTime') as HTMLInputElement;
    const selectedDays = Array.from(document.querySelectorAll('.repeat-day.bg-purple-600'))
        .map(btn => parseInt((btn as HTMLElement).dataset.day || '0'));
    
    if (!labelInput.value || !timeInput.value || selectedDays.length === 0) {
        alert('Please fill in all fields and select at least one day');
        return;
    }
    
    const reminder: Reminder = {
        id: Date.now().toString(),
        label: labelInput.value,
        time: timeInput.value,
        days: selectedDays,
        enabled: true
    };
    
    reminders.push(reminder);
    saveReminders();
    renderReminders();
    
    // Clear form
    labelInput.value = '';
    timeInput.value = '';
    document.querySelectorAll('.repeat-day').forEach(btn => {
        btn.classList.remove('bg-purple-600', 'border-purple-500');
        btn.classList.add('border-gray-600');
    });
}

function toggleRepeatDay(event: Event): void {
    const button = event.target as HTMLElement;
    button.classList.toggle('bg-purple-600');
    button.classList.toggle('border-purple-500');
    button.classList.toggle('border-gray-600');
}

function toggleCheckInTime(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const checkInTimeDiv = document.getElementById('checkInTimeDiv');
    if (checkInTimeDiv) {
        if (checkbox.checked) {
            checkInTimeDiv.classList.remove('hidden');
        } else {
            checkInTimeDiv.classList.add('hidden');
        }
    }
}

function renderReminders(): void {
    const remindersList = document.getElementById('remindersList');
    if (!remindersList) return;
    
    if (reminders.length === 0) {
        remindersList.innerHTML = '<p class="text-sm text-gray-400">No reminders added yet.</p>';
        return;
    }
    
    remindersList.innerHTML = reminders.map(reminder => `
        <div class="flex items-center justify-between p-2 bg-gray-800 rounded-lg">
            <div class="flex-1">
                <p class="text-sm font-medium text-white">${reminder.label}</p>
                <p class="text-xs text-gray-400">${reminder.time} • ${formatDays(reminder.days)}</p>
            </div>
            <button onclick="deleteReminder('${reminder.id}')" class="text-red-400 hover:text-red-300 text-sm">
                Delete
            </button>
        </div>
    `).join('');
}

function formatDays(days: number[]): string {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map(day => dayNames[day]).join(', ');
}

function deleteReminder(id: string): void {
    reminders = reminders.filter(r => r.id !== id);
    saveReminders();
    renderReminders();
}

function saveReminders(): void {
    localStorage.setItem('jeeReminders', JSON.stringify(reminders));
}

function loadReminders(): void {
    const saved = localStorage.getItem('jeeReminders');
    if (saved) {
        reminders = JSON.parse(saved);
        renderReminders();
    }
}

function checkReminders(): void {
    if (notificationPermission !== 'granted') return;
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDay = now.getDay();
    
    reminders.forEach(reminder => {
        if (reminder.enabled && reminder.time === currentTime && reminder.days.includes(currentDay)) {
            new Notification('JEE Study Reminder', {
                body: reminder.label,
                icon: '/favicon.ico'
            });
        }
    });
    
    // Check daily check-in
    const dailyCheckIn = document.getElementById('dailyCheckIn') as HTMLInputElement;
    if (dailyCheckIn && dailyCheckIn.checked) {
        const checkInTime = (document.getElementById('checkInTime') as HTMLInputElement).value;
        if (checkInTime === currentTime) {
            // Check if study session logged today
            checkDailyCheckIn();
        }
    }
}

async function checkDailyCheckIn(): Promise<void> {
    if (!currentUser) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sessionsQuery = query(
        collection(db, 'studySessions'),
        where('userId', '==', currentUser.uid),
        where('date', '>=', today)
    );
    
    const sessionsSnapshot = await getDocs(sessionsQuery);
    
    if (sessionsSnapshot.empty) {
        new Notification('JEE Daily Check-In', {
            body: 'No study session logged today! Time to study!',
            icon: '/favicon.ico'
        });
    }
}

// Firebase Test Functions
async function testFirebaseConnection(): Promise<void> {
    try {
        console.log('Testing Firebase connection...');
        
        // Test Firebase Config
        const configStatus = document.getElementById('config-status');
        if (configStatus) {
            configStatus.textContent = 'Connected';
            configStatus.className = 'px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400';
        }

        // Test Auth Service
        const authStatus = document.getElementById('auth-status');
        if (authStatus) {
            authStatus.textContent = 'Available';
            authStatus.className = 'px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400';
        }

        // Test Firestore
        const firestoreStatus = document.getElementById('firestore-status');
        try {
            // Try to access Firestore (will fail if not authenticated, but that's expected)
            const testQuery = query(collection(db, 'test'), limit(1));
            await getDocs(testQuery);
            if (firestoreStatus) {
                firestoreStatus.textContent = 'Connected';
                firestoreStatus.className = 'px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400';
            }
        } catch (error: any) {
            console.log('Firestore test error:', error);
            if (firestoreStatus) {
                if (error.code === 'permission-denied') {
                    firestoreStatus.textContent = 'Available (Auth Required)';
                    firestoreStatus.className = 'px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400';
                } else {
                    firestoreStatus.textContent = 'Error';
                    firestoreStatus.className = 'px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400';
                }
            }
        }

        // Display Firebase config info
        const firebaseConfig = {
            projectId: "gorwth",
            authDomain: "gorwth.firebaseapp.com",
            databaseURL: "https://gorwth-default-rtdb.firebaseio.com",
            storageBucket: "gorwth.firebasestorage.app"
        };

        const projectIdEl = document.getElementById('project-id');
        const authDomainEl = document.getElementById('auth-domain');
        const databaseUrlEl = document.getElementById('database-url');
        const storageBucketEl = document.getElementById('storage-bucket');

        if (projectIdEl) projectIdEl.textContent = firebaseConfig.projectId;
        if (authDomainEl) authDomainEl.textContent = firebaseConfig.authDomain;
        if (databaseUrlEl) databaseUrlEl.textContent = firebaseConfig.databaseURL;
        if (storageBucketEl) storageBucketEl.textContent = firebaseConfig.storageBucket;

        console.log('Firebase connection test completed');

    } catch (error: any) {
        console.error('Firebase connection test failed:', error);
        const configStatus = document.getElementById('config-status');
        if (configStatus) {
            configStatus.textContent = 'Error';
            configStatus.className = 'px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400';
        }
    }
}

async function testAuthOperation(type: 'signup' | 'signin'): Promise<void> {
    const emailInput = document.getElementById('test-email') as HTMLInputElement;
    const passwordInput = document.getElementById('test-password') as HTMLInputElement;
    const resultDiv = document.getElementById('auth-test-result');

    if (!emailInput || !passwordInput || !resultDiv) {
        console.error('Auth test elements not found');
        return;
    }

    const email = emailInput.value;
    const password = passwordInput.value;

    try {
        console.log(`Testing ${type} operation with email: ${email}`);
        
        if (type === 'signup') {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await createUserProfile(userCredential.user);
            resultDiv.textContent = `✅ Sign up successful!\n\nUser ID: ${userCredential.user.uid}\nEmail: ${userCredential.user.email}\n\nUser profile created in database.`;
            resultDiv.className = 'p-3 rounded-lg text-sm bg-green-500/20 text-green-400 border border-green-500/30';
        } else {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            resultDiv.textContent = `✅ Sign in successful!\n\nUser ID: ${userCredential.user.uid}\nEmail: ${userCredential.user.email}`;
            resultDiv.className = 'p-3 rounded-lg text-sm bg-green-500/20 text-green-400 border border-green-500/30';
        }
        
        // Update user status
        updateUserStatus();
        
    } catch (error: any) {
        console.error(`${type} operation failed:`, error);
        let errorMessage = error.message;
        
        // Handle specific Firebase errors
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'This email is already registered. Try sign in instead.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password is too weak. Use at least 6 characters.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address format.';
        } else if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this email. Try sign up first.';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Incorrect password.';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many failed attempts. Try again later.';
        }
        
        resultDiv.textContent = `❌ ${type} failed!\n\nError: ${errorMessage}\n\nCode: ${error.code || 'Unknown'}`;
        resultDiv.className = 'p-3 rounded-lg text-sm bg-red-500/20 text-red-400 border border-red-500/30';
    }
    resultDiv.classList.remove('hidden');
}

async function testDatabaseOperation(operation: 'write' | 'read' | 'delete'): Promise<void> {
    const resultDiv = document.getElementById('db-test-result');
    const output = document.getElementById('db-test-output');

    if (!resultDiv || !output) {
        console.error('Database test elements not found');
        return;
    }

    try {
        console.log(`Testing ${operation} operation...`);
        
        if (!currentUser) {
            throw new Error('You must be logged in to test database operations');
        }

        if (operation === 'write') {
            const testDoc = {
                userId: currentUser.uid,
                test: true,
                timestamp: Timestamp.now(),
                message: 'Test document from Firebase test page'
            };
            const docRef = await addDoc(collection(db, 'test'), testDoc);
            output.textContent = `✅ Write operation successful!\n\nDocument ID: ${docRef.id}\n\nData:\n${JSON.stringify(testDoc, null, 2)}`;
        } else if (operation === 'read') {
            const testQuery = query(
                collection(db, 'test'), 
                where('userId', '==', currentUser.uid),
                limit(10)
            );
            const querySnapshot = await getDocs(testQuery);
            const docs = querySnapshot.docs.map((doc: any) => ({ 
                id: doc.id, 
                ...doc.data() 
            }));
            output.textContent = `✅ Read operation successful!\n\nFound ${docs.length} documents:\n\n${JSON.stringify(docs, null, 2)}`;
        } else if (operation === 'delete') {
            const testQuery = query(
                collection(db, 'test'), 
                where('userId', '==', currentUser.uid)
            );
            const querySnapshot = await getDocs(testQuery);
            
            if (querySnapshot.empty) {
                output.textContent = '✅ No test documents to delete.';
            } else {
                const deletePromises = querySnapshot.docs.map((doc: any) => 
                    deleteDoc(doc.ref).catch((err: any) => console.log('Delete error:', err))
                );
                await Promise.all(deletePromises);
                output.textContent = `✅ Delete operation successful!\n\nDeleted ${querySnapshot.size} test documents.`;
            }
        }
        
        resultDiv.classList.remove('hidden');
        console.log(`${operation} operation test completed successfully`);
        
    } catch (error: any) {
        console.error(`${operation} operation test failed:`, error);
        output.textContent = `❌ ${operation} operation failed!\n\nError: ${error.message}\n\nCode: ${error.code || 'Unknown'}\n\nMake sure you are logged in and Firebase rules are properly configured.`;
        resultDiv.classList.remove('hidden');
    }
}

// Load progress data for progress page
async function loadProgressData(): Promise<void> {
  if (!currentUser) return;
  
  try {
    console.log('Loading progress data...');
    
    // Get all study sessions for the user
    const sessionsQuery = query(
      collection(db, 'studySessions'),
      where('userId', '==', currentUser.uid),
      limit(100)
    );
    
    const sessionsSnapshot = await getDocs(sessionsQuery);
    
    let physicsTotal = 0;
    let chemistryTotal = 0;
    let mathTotal = 0;
    
    if (sessionsSnapshot.empty) {
      console.log('No study sessions found for progress page');
    } else {
      sessionsSnapshot.forEach((doc: any) => {
        const data = doc.data() as StudySession;
        physicsTotal += data.physics;
        chemistryTotal += data.chemistry;
        mathTotal += data.math;
      });
    }
    
    // Update progress displays
    const physicsProgressEl = document.getElementById('physicsProgress');
    const chemistryProgressEl = document.getElementById('chemistryProgress');
    const mathProgressEl = document.getElementById('mathProgress');
    
    if (physicsProgressEl) physicsProgressEl.textContent = `${physicsTotal.toFixed(1)}h`;
    if (chemistryProgressEl) chemistryProgressEl.textContent = `${chemistryTotal.toFixed(1)}h`;
    if (mathProgressEl) mathProgressEl.textContent = `${mathTotal.toFixed(1)}h`;
    
    // Update progress bars
    const maxHours = Math.max(physicsTotal, chemistryTotal, mathTotal, 1);
    
    const physicsBar = document.querySelector('#physicsProgress')?.parentElement?.nextElementSibling as HTMLElement;
    const chemistryBar = document.querySelector('#chemistryProgress')?.parentElement?.nextElementSibling as HTMLElement;
    const mathBar = document.querySelector('#mathProgress')?.parentElement?.nextElementSibling as HTMLElement;
    
    if (physicsBar) {
      const progressBar = physicsBar.querySelector('.bg-blue-500') as HTMLElement;
      if (progressBar) {
        progressBar.style.width = `${(physicsTotal / maxHours) * 100}%`;
      }
    }
    
    if (chemistryBar) {
      const progressBar = chemistryBar.querySelector('.bg-green-500') as HTMLElement;
      if (progressBar) {
        progressBar.style.width = `${(chemistryTotal / maxHours) * 100}%`;
      }
    }
    
    if (mathBar) {
      const progressBar = mathBar.querySelector('.bg-purple-500') as HTMLElement;
      if (progressBar) {
        progressBar.style.width = `${(mathTotal / maxHours) * 100}%`;
      }
    }
    
    // Load monthly chart
    await loadMonthlyChart();
    
    console.log('Progress data loaded successfully');
    
  } catch (error: any) {
    console.error('Error loading progress data:', error);
  }
}

// Load monthly chart for progress page
async function loadMonthlyChart(): Promise<void> {
  if (!currentUser) return;
  
  try {
    const canvas = document.getElementById('monthlyChart') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    const existingChart = (window as any).Chart?.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }
    
    // Ensure Chart.js is available
    if (typeof (window as any).Chart === 'undefined') {
      console.error('Chart.js is not loaded');
      return;
    }
    
    // Get study sessions for the last 4 weeks
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    
    const sessionsQuery = query(
      collection(db, 'studySessions'),
      where('userId', '==', currentUser.uid),
      limit(100)
    );
    
    const sessionsSnapshot = await getDocs(sessionsQuery);
    
    // Initialize weekly data - reset to avoid accumulation
    const weeklyData = [0, 0, 0, 0]; // 4 weeks
    const weeklyLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    
    // Process sessions and group by week
    if (!sessionsSnapshot.empty) {
      sessionsSnapshot.forEach((doc: any) => {
        const data = doc.data() as StudySession;
        const sessionDate = data.date.toDate();
        
        if (sessionDate >= fourWeeksAgo) {
          const weeksAgo = Math.floor((new Date().getTime() - sessionDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
          if (weeksAgo >= 0 && weeksAgo < 4) {
            weeklyData[3 - weeksAgo] += data.totalHours;
          }
        }
      });
    }
    
    console.log('Weekly data calculated:', weeklyData);
    
    // Create chart with real data
    new (window as any).Chart(ctx, {
      type: 'line',
      data: {
        labels: weeklyLabels,
        datasets: [{
          label: 'Weekly Study Hours',
          data: weeklyData,
          borderColor: 'rgb(147, 51, 234)',
          backgroundColor: 'rgba(147, 51, 234, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
            labels: {
              font: {
                size: window.innerWidth < 640 ? 10 : 12
              }
            }
          },
          tooltip: {
            titleFont: {
              size: window.innerWidth < 640 ? 12 : 14
            },
            bodyFont: {
              size: window.innerWidth < 640 ? 10 : 12
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              font: {
                size: window.innerWidth < 640 ? 10 : 12
              }
            }
          },
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              font: {
                size: window.innerWidth < 640 ? 10 : 12
              }
            }
          }
        }
      }
    });
    
    console.log('Monthly chart loaded with data:', weeklyData);
    
  } catch (error: any) {
    console.error('Error loading monthly chart:', error);
  }
}

// Update user status
function updateUserStatus(): void {
    const userStatus = document.getElementById('user-status');
    if (currentUser) {
        userStatus!.textContent = currentUser.email || 'Logged In';
        userStatus!.className = 'px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400';
    } else {
        userStatus!.textContent = 'Not Logged In';
        userStatus!.className = 'px-3 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400';
    }
}

// Export functions for global access
declare global {
  interface Window {
    handleLogout: () => Promise<void>;
  }
}

window.handleLogout = handleLogout;
