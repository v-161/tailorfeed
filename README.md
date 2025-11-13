# 🎯 TailorFeed - AI-Powered Social Platform

## ✨ Features

### 🎨 Core Features
- **Smart Content Feed** - AI-curated posts based on your interests
- **Real-time Engagement** - Like, comment, and share posts
- **User Profiles** - Personalized profiles with engagement analytics
- **Image Upload** - Cloudinary-powered media uploads
- **Responsive Design** - Mobile-first responsive UI

### 🤖 AI-Powered Intelligence
- **Mr. Tailor AI** - Personal AI assistant for content discovery
- **Personalized Tips** - Real-time optimization suggestions
- **Interest Tracking** - Learns from your engagement patterns
- **Smart Recommendations** - Content and tag suggestions
- **Engagement Analytics** - Performance insights for creators

### 🚀 Advanced Features
- **Professional Dashboard** - Creator analytics and insights
- **Smart Notifications** - AI-powered engagement alerts
- **Content Optimization** - Tag performance analysis
- **Survey System** - Preference learning through interactive surveys

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Material-UI (MUI)** - Component library
- **TypeScript** - Type-safe development
- **React Router** - Client-side routing
- **Axios** - HTTP client

### Backend
- **Node.js & Express** - RESTful API server
- **MongoDB & Mongoose** - Database and ODM
- **JWT** - Authentication system
- **bcryptjs** - Password hashing
- **Cloudinary** - Image upload and storage

### AI & Analytics
- **Custom Recommendation Engine** - Content personalization
- **Real-time Analytics** - User engagement tracking
- **Pattern Recognition** - Behavior analysis

## 📦 Project Structure
```
tailorfeed/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ai/
│   │   │   │   ├── MrTailorFab.tsx
│   │   │   │   ├── MrTailorSurvey.tsx
│   │   │   │   └── RecommendationEngine.ts
│   │   │   ├── common/
│   │   │   │   ├── BottomNav.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── ThemeToggle.tsx
│   │   │   └── posts/
│   │   │       └── Post.tsx
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx
│   │   │   ├── DataContext.tsx
│   │   │   ├── NotificationsContext.tsx
│   │   │   ├── PostContext.tsx
│   │   │   ├── SearchContext.tsx 
│   │   │   └── ThemeContext.tsx
│   │   ├── pages/
│   │   │   ├── CreatePostPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   ├── HomePage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── MrTailorDashboard.tsx
│   │   │   ├── NotificationsPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── SearchPage.tsx 
│   │   │   ├── SettingsPage.tsx
│   │   │   └── UserProfilePage.tsx
│   │   ├── services/
│   │   │   ├── AIAnalyticsService.ts (TF-IDF)
│   │   │   ├── aiService.ts 
│   │   │   ├── api.ts
│   │   │   ├── cloudinaryService.ts
│   │   │   ├── postService.ts
│   │   │   
│   │   └── types/
│   │       └── index.ts
│   └── package.json
└── server/
    ├── src/
    │   ├── config/
    │   │   └── database.js
    │   ├── middleware/
    │   │   └── auth.js
    │   ├── models/
    │   │   ├── AIPreference.js
    │   │   ├── AISurvey.js
    │   │   ├── Notification.js
    │   │   ├── Post.js
    │   │   └── User.js
    │   ├── routes/
    │   │   ├── ai.js (TF-IDF + Suggestions)
    │   │   ├── auth.js
    │   │   ├── notifications.js
    │   │   ├── posts.js
    │   │   ├── search.js
    │   │   ├── upload.js
    │   │   └── users.js
    │   ├── scripts/
    │   │   ├── seedSampleData.js 
    │   │   └── seedAIData.js
    │   └── server.js
    └── package.json
```
