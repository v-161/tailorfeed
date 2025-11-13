// Define interfaces locally for now
interface Post {
  id: string;
  userId: string;
  imageUrl: string;
  caption: string;
  tags: string[];
  likes: string[] | number;
  comments: any[] | number;
  createdAt: Date;
  user?: {
    username: string;
    profilePicture?: string;
  };
}

export class RecommendationEngine {
  static getPersonalizedPosts(posts: Post[], userPreferences: string[]): Post[] {
    if (userPreferences.length === 0) {
      return posts; // Return all posts if no preferences
    }

    return posts
      .map(post => {
        // Calculate score based on tag matches
        const tagScore = post.tags?.filter((tag: string) => 
          userPreferences.includes(tag)
        ).length || 0;

        // Calculate engagement score (likes + comments)
        const likesCount = Array.isArray(post.likes) ? post.likes.length : post.likes || 0;
        const commentsCount = Array.isArray(post.comments) ? post.comments.length : post.comments || 0;
        const engagementScore = (likesCount * 0.7) + (commentsCount * 0.3);

        // Combine scores (60% tag relevance, 40% engagement)
        const totalScore = (tagScore * 0.6) + (engagementScore * 0.4);

        return { ...post, recommendationScore: totalScore };
      })
      .sort((a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0))
      .filter(post => (post.recommendationScore || 0) > 0); // Only show posts with some relevance
  }

  static shouldShowSurvey(userPreferences: string[], posts: Post[]): boolean {
    // Show survey if user has less than 3 preferences AND has engaged with posts
    const hasEngaged = posts.some(post => {
      const likesCount = Array.isArray(post.likes) ? post.likes.length : post.likes || 0;
      return likesCount > 0;
    });
    return userPreferences.length < 3 && hasEngaged;
  }

  static getTopRecommendedTags(userPreferences: string[], allPosts: Post[]): string[] {
    const allTags = allPosts.flatMap(post => post.tags || []);
    const tagFrequency: { [key: string]: number } = {};

    allTags.forEach((tag: string) => {
      tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
    });

    // Return tags that are popular but not in user preferences yet
    return Object.entries(tagFrequency)
      .filter(([tag]) => !userPreferences.includes(tag))
      .sort((a, b) => (b[1] as number) - (a[1] as number)) // FIXED: Changed from ([, a], [, b]) => b - a
      .slice(0, 5)
      .map(([tag]) => tag);
  }

  static getSearchSuggestions(query: string, userPreferences: string[], allPosts: Post[]): string[] {
    const allTags = allPosts.flatMap(post => post.tags || []);
    // Remove duplicates using filter instead of Set
    const uniqueTags = allTags.filter((tag: string, index: number, array: string[]) => array.indexOf(tag) === index);
    
    return uniqueTags
      .filter((tag: string) => 
        tag.toLowerCase().includes(query.toLowerCase()) ||
        userPreferences.includes(tag)
      )
      .slice(0, 5);
  }

  static getPersonalizedSearchRanking(posts: Post[], userPreferences: string[]): Post[] {
    return posts
      .map(post => {
        const relevanceScore = post.tags?.filter((tag: string) => 
          userPreferences.includes(tag)
        ).length || 0;
        return { ...post, relevanceScore };
      })
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }

  static getContentBasedRecommendations(targetPost: Post, allPosts: Post[], userPreferences: string[]): Post[] {
    // Get posts with similar tags to the target post
    return allPosts
      .filter(post => post.id !== targetPost.id) // Exclude the target post itself
      .map(post => {
        // Calculate similarity based on common tags
        const commonTags = post.tags?.filter((tag: string) => 
          targetPost.tags?.includes(tag)
        ).length || 0;
        
        // Boost score if tags match user preferences
        const preferenceBonus = (post.tags?.filter((tag: string) =>
          userPreferences.includes(tag)
        ).length || 0) * 0.5;

        const similarityScore = commonTags + preferenceBonus;
        return { ...post, similarityScore };
      })
      .sort((a, b) => (b.similarityScore || 0) - (a.similarityScore || 0))
      .slice(0, 5); // Return top 5 similar posts
  }

  static getUserEngagementPattern(posts: Post[], userId: string): { favoriteTags: string[], activeHours: number[] } {
    const userPosts = posts.filter(post => post.userId === userId);
    const userLikedPosts = posts.filter(post => {
      const likesCount = Array.isArray(post.likes) ? post.likes.length : post.likes || 0;
      return likesCount > 0;
    });
    
    const allTags = [...userPosts, ...userLikedPosts].flatMap(post => post.tags || []);
    const tagFrequency: { [key: string]: number } = {};

    allTags.forEach((tag: string) => {
      tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
    });

    const favoriteTags = Object.entries(tagFrequency)
      .sort((a, b) => (b[1] as number) - (a[1] as number)) // FIXED: Changed from ([, a], [, b]) => b - a
      .slice(0, 5)
      .map(([tag]) => tag);

    // Mock active hours (in real app, this would analyze post timestamps)
    const activeHours = [9, 10, 14, 15, 16, 20, 21];

    return { favoriteTags, activeHours };
  }

  static generateAITips(userPreferences: string[], posts: Post[]): string[] {
    const tips: string[] = [];

    if (userPreferences.length === 0) {
      tips.push("🌟 Start by liking posts to help me learn your interests!");
      tips.push("📊 Take the Mr. Tailor survey to personalize your feed faster.");
    } else if (userPreferences.length < 3) {
      tips.push("🎯 You're doing great! Like a few more posts to refine your recommendations.");
      tips.push("🔍 Explore different tags to discover new content you might love.");
    } else {
      tips.push("🚀 Your feed is now highly personalized! Keep engaging for even better recommendations.");
      tips.push("💡 Try creating posts with your favorite tags to connect with like-minded users.");
    }

    // Engagement tip
    const totalEngagement = posts.reduce((sum, post) => {
      const likesCount = Array.isArray(post.likes) ? post.likes.length : post.likes || 0;
      const commentsCount = Array.isArray(post.comments) ? post.comments.length : post.comments || 0;
      return sum + likesCount + commentsCount;
    }, 0);
    
    if (totalEngagement < 10) {
      tips.push("💬 Engage more with posts - likes and comments help me understand you better!");
    }

    return tips.slice(0, 3); // Return top 3 tips
  }
}
