export interface Post {
  id: string;
  userId: string;
  imageUrl: string;
  caption: string;
  tags: string[];
  likes: string[]; // Change from "string[] | number" to just "string[]"
  comments: Comment[]; // Change from "Comment[] | number" to just "Comment[]"
  createdAt: Date;
  user?: {
    username: string;
    profilePic?: string; // Change from profilePicture to profilePic for consistency
  };
}
export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: Date;
  user?: {
    username: string;
    profilePicture?: string;
  };
}
export interface User {
  id: string;
  username: string;
  email: string;
  profilePic?: string;      // Add this for consistency
  profilePicture?: string;  // Add this to match Post interface
  stats?: {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    followers: number;
    following: number;
  };
  aiPreferences?: {
    interests: string[];
    surveyHistory: Survey[];
    contentPreferences: string[];
    engagementScore: number;
    lastSurveyDate?: Date;
  };
  settings?: {
    pushNotifications: boolean;
    emailNotifications: boolean;
    profilePublic: boolean;
    showOnlineStatus: boolean;
  };
}
export interface UserPreferences {
  interests: string[];
  surveyHistory: Survey[];
  aiPreferences: AIPreferences;
}

export interface Survey {
  surveyId: string;
  completedAt: Date;
  responses: SurveyResponse[];
}

export interface AIPreferences {
  lastSurveyDate?: Date;
  contentPreferences?: string[];
  engagementScore?: number;
}

export interface SurveyResponse {
  tag: string;
  rating: number;
  timestamp: Date;
}