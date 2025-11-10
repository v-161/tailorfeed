import React, { createContext, useContext, useState, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';

// Import updated types from DataContext (MongoDB structure)
interface Post {
  _id: string;
  userId: string;
  username: string;
  profilePicture?: string;
  caption: string;
  tags: string[];
  likes: string[];
  comments: any[];
  createdAt: string;
  imageUrl?: string;
}

interface User {
  _id: string;
  username: string;
  email: string;
  profilePicture?: string;
  createdAt: string;
}

interface SearchResult {
  posts: Post[];
  users: User[];
  tags: string[];
}

interface SearchContextType {
  searchQuery: string;
  searchResults: SearchResult;
  recentSearches: string[];
  trendingTags: string[];
  suggestedUsers: User[];
  loading: boolean;
  setSearchQuery: (query: string) => void;
  performSearch: (query: string) => Promise<void>;
  clearSearch: () => void;
  addToRecentSearches: (query: string) => void;
  fetchTrendingData: () => Promise<void>;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearchContext = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearchContext must be used within a SearchProvider');
  }
  return context;
};

interface SearchProviderProps {
  children: ReactNode;
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult>({
    posts: [],
    users: [],
    tags: []
  });
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingTags, setTrendingTags] = useState<string[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]); // REMOVED FAKE USERS
  const [loading, setLoading] = useState(false);

  const searchIdRef = useRef(0);

  const { currentUser } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Load trending data and recent searches on mount
  React.useEffect(() => {
    fetchTrendingData();
    loadRecentSearches();
  }, []);

  const fetchTrendingData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/search/trending`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTrendingTags(data.tags?.map((t: any) => t.name) || []);
        setSuggestedUsers(data.suggestions || []); // Use real suggestions from API
      } else {
        // Fallback - NO FAKE USERS
        setTrendingTags(['programming', 'react', 'travel', 'food', 'fitness', 'art', 'photography']);
        setSuggestedUsers([]); // Empty array instead of fake users
      }
    } catch (error) {
      console.error('Failed to fetch trending data:', error);
      // Fallback - NO FAKE USERS
      setTrendingTags(['programming', 'react', 'travel', 'food', 'fitness', 'art', 'photography']);
      setSuggestedUsers([]); // Empty array instead of fake users
    }
  };

  const loadRecentSearches = () => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  };

  const saveRecentSearches = (searches: string[]) => {
    localStorage.setItem('recentSearches', JSON.stringify(searches));
  };

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults({ posts: [], users: [], tags: [] });
      setLoading(false);
      return;
    }

    const currentSearchId = ++searchIdRef.current;
    
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🔍 Search API Response Status:', response.status);
      
      if (currentSearchId === searchIdRef.current) {
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Search Results:', {
            posts: data.posts?.length || 0,
            users: data.users?.length || 0,
            tags: data.tags?.length || 0
          });
          setSearchResults({
            posts: data.posts || [],
            users: data.users || [],
            tags: data.tags || []
          });
        } else {
          console.error('❌ Search API failed:', response.status);
          performLocalSearch(query);
        }
      }
    } catch (error) {
      console.error('❌ Search failed:', error);
      if (currentSearchId === searchIdRef.current) {
        performLocalSearch(query);
      }
    } finally {
      if (currentSearchId === searchIdRef.current) {
        setLoading(false);
      }
    }

    if (query.trim()) {
      addToRecentSearches(query);
    }
  }, [API_URL]);

  const performLocalSearch = (query: string) => {
    console.log('🔄 Using local search fallback for:', query);
    const matchingTags = trendingTags.filter(tag => 
      tag.toLowerCase().includes(query.toLowerCase())
    );
    
    setSearchResults({
      posts: [],
      users: [], // No fake users
      tags: matchingTags
    });
  };

  const addToRecentSearches = useCallback((query: string) => {
    if (query.trim()) {
      setRecentSearches(prev => {
        const updatedSearches = [
          query,
          ...prev.filter(search => search !== query)
        ].slice(0, 5);
        
        saveRecentSearches(updatedSearches);
        return updatedSearches;
      });
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults({ posts: [], users: [], tags: [] });
  }, []);

  const value: SearchContextType = {
    searchQuery,
    searchResults,
    recentSearches,
    trendingTags,
    suggestedUsers,
    loading,
    setSearchQuery,
    performSearch,
    clearSearch,
    addToRecentSearches,
    fetchTrendingData
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};