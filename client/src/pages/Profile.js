import React, { useState, useEffect, createContext, useContext } from 'react';
import { getAuth, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, query, onSnapshot } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// The following global variables are provided by the canvas environment.
// We must check if they exist before using them.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// AuthContext for user authentication state.
const AuthContext = createContext(null);

// AuthProvider component to manage Firebase authentication.
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize Firebase app
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Sign in with custom token or anonymously
    const signIn = async () => {
      try {
        if (initialAuthToken) {
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Error signing in:", error);
      }
    };

    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Save user data to Firestore
        const userId = currentUser.uid;
        const userDocRef = doc(db, 'users', userId);
        await setDoc(userDocRef, {
          uid: currentUser.uid,
          email: currentUser.email || 'anonymous',
        }, { merge: true });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    signIn();

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Navbar component.
const Navbar = () => {
  const { user } = useContext(AuthContext);

  const navItems = [
    { name: 'Home', href: '#' },
    { name: 'Profile', href: '#' },
    { name: 'Settings', href: '#' },
  ];

  return (
    <nav className="bg-white shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 py-3 md:flex md:justify-between md:items-center">
        <div className="flex items-center justify-between">
          <a href="#" className="text-2xl font-bold text-gray-800 transition-colors duration-300 transform hover:text-blue-500">
            SocialApp
          </a>
          <div className="md:hidden">
            <button type="button" className="text-gray-500 hover:text-gray-600 focus:outline-none focus:text-gray-600">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                <path fillRule="evenodd" d="M4 5h16a1 1 0 010 2H4a1 1 0 110-2zm0 6h16a1 1 0 010 2H4a1 1 0 010-2zm0 6h16a1 1 0 010 2H4a1 1 0 010-2z" clipRule="evenodd"></path>
              </svg>
            </button>
          </div>
        </div>
        <div className="md:flex items-center">
          <div className="flex flex-col md:flex-row md:mx-6">
            {navItems.map((item, index) => (
              <a key={index} href={item.href} className="my-1 text-gray-700 hover:text-blue-500 md:mx-4 transition-colors duration-300 transform">
                {item.name}
              </a>
            ))}
          </div>
          <div className="relative">
            {user ? (
              <div className="flex items-center space-x-2">
                <span className="text-gray-800 text-sm">Hi, {user.uid.substring(0, 8)}...</span>
                <img className="w-8 h-8 rounded-full border border-gray-300" src="https://placehold.co/100x100/A0AEC0/ffffff?text=U" alt="Profile Picture" />
              </div>
            ) : (
              <span className="text-gray-800 text-sm">Signing in...</span>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

// Custom Carousel component to display images.
const ImageCarousel = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  return (
    <div className="relative w-full h-96 overflow-hidden rounded-md">
      {images.map((img, index) => (
        <img
          key={index}
          src={img}
          alt={`Post image ${index + 1}`}
          className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
      <button
        onClick={prevSlide}
        className="absolute top-1/2 left-4 -translate-y-1/2 bg-white/30 text-white p-2 rounded-full hover:bg-white/50 transition"
      >
        &#9664;
      </button>
      <button
        onClick={nextSlide}
        className="absolute top-1/2 right-4 -translate-y-1/2 bg-white/30 text-white p-2 rounded-full hover:bg-white/50 transition"
      >
        &#9654;
      </button>
    </div>
  );
};

// ProfilePost component to display a single post.
const ProfilePost = ({ post }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform transform hover:scale-105">
      <div className="relative">
        <ImageCarousel images={post.images} />
      </div>
      <div className="p-4">
        <div className="flex items-center mb-4">
          <img src={post.profileImage} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-blue-500" />
          <div className="ml-3">
            <h4 className="font-bold text-gray-800">{post.username}</h4>
            <p className="text-sm text-gray-500">{post.timestamp}</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed mb-4">{post.content}</p>
        <div className="flex items-center space-x-4 text-gray-500">
          <div className="flex items-center space-x-1 hover:text-blue-500 cursor-pointer transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>{post.likes}</span>
          </div>
          <div className="flex items-center space-x-1 hover:text-blue-500 cursor-pointer transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.536 12.279 2 10.165 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clipRule="evenodd" />
            </svg>
            <span>{post.comments}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const { user, loading } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    if (user) {
      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);
      const postsCollection = collection(db, `artifacts/${appId}/public/data/posts`);

      const q = query(postsCollection);
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedPosts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(fetchedPosts);
      });

      // Cleanup listener on component unmount
      return () => unsubscribe();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-lg font-semibold text-gray-700">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-lg font-semibold text-gray-700">Failed to authenticate.</div>
      </div>
    );
  }

  const userId = user.uid;

  const profileData = {
    username: 'Jane Doe',
    handle: '@janedoe',
    bio: 'Software engineer passionate about front-end development, UI/UX design, and sharing cool projects.',
    profileImage: 'https://placehold.co/150x150/000000/FFFFFF?text=J',
    coverImage: 'https://placehold.co/1000x300/F0F4F8/607E96?text=Cover+Image',
    followers: 1200,
    following: 350,
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <Navbar />
      <div className="container mx-auto p-4 mt-16 sm:p-6 lg:p-8">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden mb-8">
          <div className="relative">
            <img src={profileData.coverImage} alt="Cover" className="w-full h-48 object-cover rounded-t-lg" />
            <div className="absolute left-6 -bottom-16">
              <img src={profileData.profileImage} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg" />
            </div>
          </div>
          <div className="pt-20 p-6 sm:p-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{profileData.username}</h1>
                <p className="text-gray-500 text-lg">{profileData.handle}</p>
                <div className="flex mt-4 space-x-6 text-gray-700">
                  <div className="flex items-center">
                    <span className="font-bold text-lg">{profileData.followers}</span>
                    <span className="ml-1 text-sm">Followers</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-bold text-lg">{profileData.following}</span>
                    <span className="ml-1 text-sm">Following</span>
                  </div>
                </div>
              </div>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-700 transition duration-300 transform hover:scale-105">
                Follow
              </button>
            </div>
            <p className="text-gray-700 mt-4 leading-relaxed">{profileData.bio}</p>
          </div>
        </div>
        <div className="text-2xl font-bold text-gray-800 mb-6">Recent Posts</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.length > 0 ? (
            posts.map((post) => (
              <ProfilePost key={post.id} post={post} />
            ))
          ) : (
            <div className="md:col-span-2 lg:col-span-3 text-center text-gray-500 py-10">
              No posts found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main App component
export default function App() {
  return (
    <AuthProvider>
      <ProfilePage />
    </AuthProvider>
  );
}
