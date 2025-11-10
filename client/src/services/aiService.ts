import { api } from './api';

export interface AIInteraction {
  postId?: string;
  interactionType: 'like' | 'unlike' | 'comment' | 'share' | 'view';
  postTags: string[];
}

export interface UserInterest {
  tag: string;
  score: number;
  interactionCount: number;
  category: string;
}

export interface PostAnalytics {
  postId: string;
  engagementRate: number;
  avgTimeViewed: number;
  completionRate: number;
  tags: string[];
}

export interface UserEngagementPattern {
  activeHours: number[];
  preferredPostTypes: string[];
  avgLikesPerDay: number;
  topEngagedTags: string[];
  engagementTrend: 'increasing' | 'decreasing' | 'stable';
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

interface AIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface UserInterestsResponse {
  success: boolean;
  interests: UserInterest[];
  message?: string; // ADDED THIS LINE
}

class AIService {
  async recordInteraction(interaction: AIInteraction): Promise<AIResponse<any>> {
    try {
      const response = await api.post('/ai/interaction', interaction);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error recording AI interaction:', error.response?.status);
      // Don't throw error for interactions - we don't want to break the like functionality
      return { success: false, message: 'Failed to record interaction' };
    }
  }

  async getRecommendations(limit: number = 20): Promise<AIResponse<any>> {
    try {
      const response = await api.get(`/ai/recommendations?limit=${limit}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching AI recommendations:', error.response?.status);
      return { success: false, message: 'Failed to load recommendations' };
    }
  }

  async submitSurvey(responses: any[]): Promise<AIResponse<any>> {
    try {
      const response = await api.post('/ai/survey', { responses });
      return response.data;
    } catch (error: any) {
      console.error('❌ Error submitting AI survey:', error.response?.status);
      return { success: false, message: 'Failed to submit survey' };
    }
  }

  async getUserInterests(): Promise<UserInterestsResponse> {
    try {
      const response = await api.get('/ai/interests');
      console.log('📊 AI Interests API Success:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching user interests:', error.response?.status);
      
      // Return empty interests instead of throwing error
      return { 
        success: false, 
        interests: [],
        message: 'Failed to load interests' // ADDED message property
      };
    }
  }

  // Enhanced like/unlike with AI tracking
  async likePostWithAI(postId: string, tags: string[]): Promise<any> {
    try {
      const result = await this.recordInteraction({
        postId,
        interactionType: 'like',
        postTags: tags || []
      });
      console.log('✅ AI like recorded:', result);
      return result;
    } catch (error) {
      console.error('❌ Error liking post with AI:', error);
      // Don't throw - we don't want to break the like functionality
    }
  }

  async unlikePostWithAI(postId: string, tags: string[]): Promise<any> {
    try {
      const result = await this.recordInteraction({
        postId,
        interactionType: 'unlike',
        postTags: tags || []
      });
      console.log('✅ AI unlike recorded:', result);
      return result;
    } catch (error) {
      console.error('❌ Error unliking post with AI:', error);
      // Don't throw - we don't want to break the unlike functionality
    }
  }
}

export const aiService = new AIService();