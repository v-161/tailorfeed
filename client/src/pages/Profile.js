import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// Global variables for Firebase configuration. These are provided by the canvas environment.
// We check for their existence to prevent errors if running outside the canvas.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// The main App component
const App = () => {
  // State for user authentication and database connection
  const [user, setUser] = useState(null);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // State for dark mode
  const [darkMode, setDarkMode] = useState(false);

  // useEffect to handle Firebase initialization and authentication
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        // Initialize the Firebase app with the provided config
        const app = initializeApp(firebaseConfig);
        const firestoreDb = getFirestore(app);
        const firestoreAuth = getAuth(app);

        // Set the database and auth instances in state
        setDb(firestoreDb);
        setAuth(firestoreAuth);

        // Authenticate the user. Use the custom token if available, otherwise sign in anonymously.
        if (initialAuthToken) {
          await signInWithCustomToken(firestoreAuth, initialAuthToken);
        } else {
          await signInAnonymously(firestoreAuth);
        }

        // Set the current user after successful authentication
        const currentUser = firestoreAuth.currentUser;
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error("Firebase initialization or authentication failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeFirebase();
  }, []); // Empty dependency array means this effect runs only once on component mount

  // useEffect to sync dark mode state with localStorage and the DOM
  useEffect(() => {
    // Check localStorage for a saved dark mode preference
    const savedMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialMode = savedMode === 'true' || (savedMode === null && prefersDark);

    setDarkMode(initialMode);
    // Apply the 'dark' class to the html element based on the initial mode
    document.documentElement.classList.toggle('dark', initialMode);
  }, []);

  // Function to toggle dark mode
  const toggleDarkMode = () => {
    // Invert the dark mode state
    const newMode = !darkMode;
    setDarkMode(newMode);
    // Update the 'dark' class on the html element
    document.documentElement.classList.toggle('dark', newMode);
    // Save the new preference to localStorage
    localStorage.setItem('darkMode', newMode);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-500">
        <div className="text-xl text-gray-800 dark:text-gray-200">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-500">
      <nav className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center transition-colors duration-500">
        <div className="text-xl font-bold">
          My App
        </div>
        <div className="flex items-center space-x-4">
          <p className="hidden md:block text-gray-600 dark:text-gray-400">
            {user ? `User ID: ${user.uid}` : 'User not logged in'}
          </p>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-300"
            aria-label="Toggle dark mode"
          >
            {/* Sun icon for light mode */}
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.106a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.154 18.154a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.06l1.591-1.59ZM12 18.75a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0v-2.25a.75.75 0 0 1 .75-.75ZM4.293 17.707a.75.75 0 0 0 1.06-1.061l-1.591-1.59a.75.75 0 0 0-1.06 1.06l1.591 1.59ZM3 12a.75.75 0 0 1 .75-.75h2.25a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 12Zm6.106-12.894a.75.75 0 0 0-.69-.516c-.346 0-.69.213-.69.516V3a.75.75 0 0 0 1.5 0V.75a.75.75 0 0 0-.75-.75Z" />
              </svg>
            ) : (
              // Moon icon for dark mode
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M9.507 18.251A8.995 8.995 0 0 1 12 17.25a9.004 9.004 0 0 1-9.754-5.251A8.251 8.251 0 0 0 10.5 19.5c.875 0 1.72-.118 2.522-.33a.75.75 0 1 1 .684 1.488C12.392 20.89 11.455 21 10.5 21a9.75 9.75 0 0 1-9.75-9.75c0-2.02.433-3.931 1.258-5.632A9.006 9.006 0 0 1 12 3a8.995 8.995 0 0 1 2.493 1.251.75.75 0 0 1-.684 1.488A7.505 7.505 0 0 0 12 5.25a7.505 7.505 0 0 0-7.5 7.5c0 1.018.175 2.007.507 2.932a.75.75 0 0 1-.684 1.488A9.75 9.75 0 0 1 1.5 12C1.5 6.477 6.043 2.5 12 2.5s10.5 3.977 10.5 9.25c0 5.273-4.543 9.75-10.5 9.75-1.127 0-2.22-.244-3.26-.708a.75.75 0 1 1 .684-1.488Z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      <main className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4">
          Welcome to Your App
        </h1>
        <p className="text-lg">
          This is a sample page to demonstrate the dark mode functionality.
          Click the sun or moon icon in the top right corner to toggle the theme.
        </p>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          The application is connected to Firebase Firestore and is authenticated.
        </p>
      </main>
    </div>
  );
};

export default App;
