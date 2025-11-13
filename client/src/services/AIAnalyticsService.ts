import { aiService } from './aiService';

export interface Post {
  _id: string;
  userId: string;
  username: string;
  caption: string;
  tags: string[];
  likes: string[];
  comments: any[];
  createdAt: string | Date;
  imageUrl?: string;
}

export interface UserStats {
  totalLikes: number;
  totalPosts: number;
  totalComments: number;
  engagementRate: number;
  topTags: string[];
}

export interface AITip {
  id: string;
  title: string;
  message: string;
  type: 'engagement' | 'content' | 'timing' | 'discovery' | 'optimization';
  priority: 'low' | 'medium' | 'high';
  action?: string;
  data?: any;
}

class AIAnalyticsService {
  
  // Replace the analyzePostingPattern function:
  analyzePostingPattern(posts: Post[]): { bestHours: number[], bestDays: string[] } {
    if (posts.length === 0) {
      return { bestHours: [9, 12, 18], bestDays: ['Monday', 'Wednesday', 'Friday'] };
    }

    // 🎯 FIX: Analyze engagement timing instead of posting timing
    // Posts with more likes represent better engagement timing
    const engagementHours = posts.flatMap(post => {
      const postHour = new Date(post.createdAt).getHours();
      
      // Weight by engagement level - posts with more likes represent better timing
      const engagementWeight = Math.min((post.likes?.length || 0) + 1, 10);
      
      // Return the hour repeated based on engagement level
      return Array(engagementWeight).fill(postHour);
    });

    const hourCounts = engagementHours.reduce((acc, hour) => {
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const bestHours = Object.entries(hourCounts)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 3)
      .map(([hour]) => parseInt(hour))
      .sort((a, b) => a - b);

    return {
      bestHours: bestHours.length > 0 ? bestHours : [9, 12, 18],
      bestDays: ['Monday', 'Wednesday', 'Friday']
    };
  }

  // Analyze tag performance
  analyzeTagPerformance(posts: Post[], userInterests: any[]): { topPerformingTags: string[], underutilizedTags: string[] } {
    const tagEngagement = new Map<string, { count: number, totalLikes: number }>();

    posts.forEach(post => {
      post.tags?.forEach(tag => {
        const current = tagEngagement.get(tag) || { count: 0, totalLikes: 0 };
        current.count += 1;
        current.totalLikes += post.likes?.length || 0;
        tagEngagement.set(tag, current);
      });
    });

    const topPerformingTags = Array.from(tagEngagement.entries())
      .filter(([, data]) => data.count >= 2)
      .sort((a, b) => (b[1].totalLikes / b[1].count) - (a[1].totalLikes / a[1].count))
      .slice(0, 5)
      .map(([tag]) => tag);

    // Find tags user is interested in but not using
    const userInterestTags = userInterests?.map(interest => interest.tag) || [];
    const usedTags = Array.from(tagEngagement.keys());
    const underutilizedTags = userInterestTags.filter(tag => !usedTags.includes(tag));

    return {
      topPerformingTags,
      underutilizedTags: underutilizedTags.slice(0, 3)
    };
  }

  // Analyze engagement patterns
  analyzeEngagementPattern(userPosts: Post[], allPosts: Post[]): { engagementRate: number, avgLikes: number, trend: string } {
    if (userPosts.length === 0) {
      return { engagementRate: 0, avgLikes: 0, trend: 'stable' };
    }

    const userAvgLikes = userPosts.reduce((sum, post) => sum + (post.likes?.length || 0), 0) / userPosts.length;
    const platformAvgLikes = allPosts.reduce((sum, post) => sum + (post.likes?.length || 0), 0) / Math.max(allPosts.length, 1);
    
    const engagementRate = (userAvgLikes / Math.max(platformAvgLikes, 1)) * 100;

    // Simple trend analysis
    const recentPosts = userPosts.slice(0, Math.min(5, userPosts.length));
    const olderPosts = userPosts.slice(5, 10);
    
    const recentAvg = recentPosts.reduce((sum, post) => sum + (post.likes?.length || 0), 0) / recentPosts.length;
    const olderAvg = olderPosts.length > 0 ? 
      olderPosts.reduce((sum, post) => sum + (post.likes?.length || 0), 0) / olderPosts.length : recentAvg;

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (recentAvg > olderAvg * 1.2) trend = 'increasing';
    else if (recentAvg < olderAvg * 0.8) trend = 'decreasing';

    return {
      engagementRate: Math.min(engagementRate, 200),
      avgLikes: userAvgLikes,
      trend
    };
  }

  // Generate personalized AI tips
  async generateAITips(
    userPosts: Post[], 
    allPosts: Post[], 
    userInterests: any[] = [], 
    userStats: UserStats
  ): Promise<AITip[]> {
    const tips: AITip[] = [];

    // 1. Timing optimization tips (FIXED: Now based on engagement timing)
    const postingPattern = this.analyzePostingPattern(userPosts);
    if (postingPattern.bestHours.length > 0) {
      tips.push({
        id: 'optimal-timing',
        title: '⏰ Best Engagement Times',
        message: `Your posts get the most engagement around ${postingPattern.bestHours.map(h => `${h}:00`).join(', ')}. Try scheduling posts during these hours!`,
        type: 'timing',
        priority: 'medium',
        data: { bestHours: postingPattern.bestHours }
      });
    }

    // 2. Tag performance tips
    const tagAnalysis = this.analyzeTagPerformance(userPosts, userInterests);
    if (tagAnalysis.topPerformingTags.length > 0) {
      tips.push({
        id: 'top-tags',
        title: '🏆 Your Best Performing Tags',
        message: `Posts with ${tagAnalysis.topPerformingTags.slice(0, 3).map(t => `#${t}`).join(', ')} get the most engagement. Consider using these tags more often!`,
        type: 'optimization',
        priority: 'high',
        data: { topTags: tagAnalysis.topPerformingTags }
      });
    }

    if (tagAnalysis.underutilizedTags.length > 0) {
      tips.push({
        id: 'untapped-tags',
        title: '💡 Untapped Interests',
        message: `You're interested in ${tagAnalysis.underutilizedTags.map(t => `#${t}`).join(', ')} but haven't posted about them yet. Your audience might love this content!`,
        type: 'discovery',
        priority: 'medium'
      });
    }

    // 3. Engagement analysis tips
    const engagement = this.analyzeEngagementPattern(userPosts, allPosts);
    
    if (engagement.engagementRate > 150) {
      tips.push({
        id: 'high-engagement',
        title: '🚀 Engagement Champion!',
        message: `Your posts get ${engagement.engagementRate.toFixed(0)}% more likes than average! Whatever you're doing, keep it up!`,
        type: 'engagement',
        priority: 'low'
      });
    } else if (engagement.engagementRate < 80 && userPosts.length > 3) {
      tips.push({
        id: 'improve-engagement',
        title: '📈 Boost Your Engagement',
        message: 'Try adding more descriptive captions and using relevant hashtags to increase your post visibility.',
        type: 'engagement',
        priority: 'medium'
      });
    }

    if (engagement.trend === 'increasing') {
      tips.push({
        id: 'positive-trend',
        title: '📊 Growing Engagement!',
        message: 'Your recent posts are getting more engagement than before. Your content strategy is working!',
        type: 'engagement',
        priority: 'low'
      });
    }

    // 4. Content gap analysis
    const popularTags = this.getPopularTags(allPosts);
    const userTags = new Set(userPosts.flatMap(post => post.tags || []));
    const missingPopularTags = popularTags.filter(tag => !userTags.has(tag)).slice(0, 3);

    if (missingPopularTags.length > 0 && userPosts.length > 2) {
      tips.push({
        id: 'trending-tags',
        title: '🔥 Trending Opportunities',
        message: `Popular tags like ${missingPopularTags.map(t => `#${t}`).join(', ')} are trending. Consider creating content around these topics!`,
        type: 'discovery',
        priority: 'medium'
      });
    }

    // 5. Posting frequency tip
    if (userPosts.length < 3) {
      tips.push({
        id: 'more-content',
        title: '🎨 Create More Content',
        message: 'Posting more regularly helps Mr. Tailor understand your style better and improves your visibility.',
        type: 'content',
        priority: 'high'
      });
    }

    // 6. Default tip if no others generated
    if (tips.length === 0) {
      tips.push({
        id: 'welcome-tip',
        title: '👋 Welcome to Mr. Tailor!',
        message: 'Start posting and engaging with content to receive personalized optimization tips.',
        type: 'engagement',
        priority: 'low'
      });
    }

    return tips.slice(0, 6);
  }

  private getPopularTags(posts: Post[]): string[] {
    const tagCounts = new Map<string, number>();
    
    posts.forEach(post => {
      post.tags?.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagCounts.entries())
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 10)
      .map(([tag]) => tag);
  }
}

export const aiAnalyticsService = new AIAnalyticsService();
