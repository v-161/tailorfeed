import React, { createContext, useContext, useState, ReactNode, useCallback, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { aiService } from '../services/aiService';
import { User, Post } from '../types';
import { useDataContext } from './DataContext';

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
  refreshSuggestions: () => Promise<void>; // ADD THIS
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
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const searchIdRef = useRef(0);

  const { currentUser } = useAuth();
  const { userPreferences } = useDataContext();
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // 🎯 FIX 1: Memoized loadSuggestedUsers
  const loadSuggestedUsers = useCallback(async () => {
    if (!currentUser) {
      setSuggestedUsers([]);
      return;
    }
    
    try {
      console.log('🔄 Loading suggested users for preferences:', userPreferences);
      const suggestions = await aiService.getSuggestedUsers(currentUser._id);
      
      // 🎯 DEBUG: Check if travel_diaries is in the response
      const hasTravelDiaries = suggestions.some(user => 
        user.username?.toLowerCase().includes('travel')
      );
      console.log('🎯 AI Service returned travel_diaries:', hasTravelDiaries);
      console.log('🎯 All suggested users:', suggestions.map(u => u.username));
      
      setSuggestedUsers(suggestions);
      console.log('✅ Suggested users loaded:', suggestions.length);
    } catch (error) {
      console.error('Error loading suggested users:', error);
      setSuggestedUsers([]);
    }
  }, [currentUser, userPreferences]); // Add dependencies

  // 🎯 FIX 2: Memoized fetchTrendingData
  const fetchTrendingData = useCallback(async () => {
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
        
        // 🎯 FIX: Remove 'travel' from trending tags
        const filteredTags = (data.tags || [])
          .map((t: any) => t.name)
          .filter((tag: string) => tag !== 'travel'); // 🎯 FILTER OUT TRAVEL
        
        setTrendingTags(filteredTags);
        
        // 🎯 FIX: Filter suggestedUsers to remove travel-related users
        const filteredSuggestedUsers = (data.suggestedUsers || [])
          .filter((user: User) => !user.username?.toLowerCase().includes('travel'));
        
        if (filteredSuggestedUsers.length > 0) {
          setSuggestedUsers(filteredSuggestedUsers);
          console.log('✅ Using filtered backend suggested users:', filteredSuggestedUsers.length);
        } else {
          await loadSuggestedUsers();
        }
      } else {
        // 🎯 FIX: Remove 'travel' from fallback data
        const fallbackTags = ['programming', 'food', 'fitness', 'art', 'photography']; // ✅ NO TRAVEL
        setTrendingTags(fallbackTags);
        await loadSuggestedUsers();
      }
    } catch (error) {
      console.error('Failed to fetch trending data:', error);
      // 🎯 FIX: Remove 'travel' from error fallback
      const fallbackTags = ['programming', 'food', 'fitness', 'art', 'photography']; // ✅ NO TRAVEL
      setTrendingTags(fallbackTags);
      await loadSuggestedUsers();
    }
  }, [API_URL, loadSuggestedUsers]);

  // 🎯 FIX 3: Add refresh function
  const refreshSuggestions = useCallback(async () => {
    console.log('🔄 Manually refreshing suggestions...');
    await fetchTrendingData();
  }, [fetchTrendingData]);

  // 🎯 FIX 4: Proper useEffect dependencies
  useEffect(() => {
    if (currentUser) {
      fetchTrendingData();
      loadRecentSearches();
      loadSuggestedUsers();
    }
  }, [currentUser, fetchTrendingData, loadSuggestedUsers]); // Add dependencies

  // 🎯 FIX 5: Auto-refresh when preferences change
  useEffect(() => {
    if (currentUser && userPreferences.length > 0) {
      console.log('🔄 Preferences changed, refreshing suggested users...');
      
      // 🎯 DEBUG: Check current preferences
      console.log('🎯 Current user preferences:', userPreferences);
      console.log('🎯 Has travel preference:', userPreferences.includes('travel'));
      
      loadSuggestedUsers();
      fetchTrendingData();
    }
  }, [userPreferences, currentUser, loadSuggestedUsers, fetchTrendingData]);

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
  }, [API_URL, trendingTags]);

  const performLocalSearch = (query: string) => {
    console.log('🔄 Using local search fallback for:', query);
    const matchingTags = trendingTags.filter(tag => 
      tag.toLowerCase().includes(query.toLowerCase())
    );
    
    setSearchResults({
      posts: [],
      users: [],
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
    fetchTrendingData,
    refreshSuggestions // ADD THIS
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};
