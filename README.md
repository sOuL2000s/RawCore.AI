# RawCore.AI [BETA]
**Live Demo:** [https://rawcoreai.netlify.app](https://rawcoreai.netlify.app)

RawCore.AI is a high-performance, "raw" AI chatbot interface designed for direct interaction with Large Language Models without restrictive system prompts or heavy UI overhead. It features a robust multi-provider backend with automated failover logic and an integrated administrative control panel.

## 🚀 Features

- **Unfiltered Interaction**: No default system prompts or hidden filters. Get pure model outputs.
- **Failover Logic**: Add multiple API keys for Gemini and Groq. The system automatically rotates to the next available key if one encounters an error or rate limit.
- **Admin Configuration**: Manage API keys and model availability (Text & STT) directly through the interface (stored securely in Firestore).
- **User Management (Admin)**: Search users by email, toggle administrator roles, and delete user profiles from the Firestore registry.
- **Multi-Modal Capabilities**:
    - **Text Generation**: Support for any Gemini or Groq text model.
    - **Speech-to-Text (STT)**: Integrated voice typing via Whisper (Groq) or Gemini audio processing.
    - **File Attachments**: Support for images and document context.
- **Developer-Centric UI**:
    - Terminal-inspired monospace aesthetic.
    - Markdown rendering with syntax highlighting.
    - One-click "Copy Raw" and code block copying.
    - Full conversation export to Markdown.
- **Persistent Sessions**: Firebase-powered authentication and chat history.

## 🛠️ Setup Instructions

### 1. Firebase Setup
This project is a standalone web application using Firebase.
1. Create a project at the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Email/Password** Authentication.
3. Create a **Cloud Firestore** database.
4. Replace the `firebaseConfig` object in `index.html` with your project credentials.

### 2. Firestore Security Rules
Apply the following rules in the Firebase Console to ensure data privacy while allowing the admin panel to function:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions for readability
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }

    // User profiles
    match /users/{userId} {
      allow read, create: if isAuthenticated() && request.auth.uid == userId;
      
      // Allow users to update their own profile (preferences/font/theme) 
      // but strictly forbid changing their admin status.
      allow update: if isAuthenticated() && request.auth.uid == userId 
                    && (request.resource.data.isAdmin == resource.data.isAdmin || !request.resource.data.hasAny(['isAdmin']));

      // System Prompts Library
      match /prompts/{promptId} {
        allow read, write: if isAuthenticated() && request.auth.uid == userId;
      }

      // Admin Management
      allow list: if isAdmin();
      allow update, delete: if isAdmin();
    }

    // Global settings
    match /settings/{document} {
      // Note: All users read 'main' to get API keys for client-side failover
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Chat history
    match /chats/{chatId} {
      // Ensure users only interact with their own conversations
      allow read, update, delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
      
      // Prevent users from creating chats for other UIDs
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;

      match /messages/{messageId} {
        // Nested check to verify chat ownership before allowing message access
        allow read, write: if isAuthenticated() && 
          get(/databases/$(database)/documents/chats/$(chatId)).data.userId == request.auth.uid;
      }
    }

    // API health metrics
    match /key_metrics/{metricId} {
      // Admins monitor health; users only report it
      allow get, list: if isAdmin();
      
      // Allow incrementing success/error counts and token usage
      // We allow 'create' because of the hashed ID logic in updateKeyStatus
      allow create, update: if isAuthenticated();
    }

    // Donated Keys Queue
    match /donated_keys/{donationId} {
      // Users can submit their own keys for review
      allow create: if isAuthenticated() && request.resource.data.donorUid == request.auth.uid;
      
      // Admins manage the donation queue (read/list to review, delete after processing)
      allow read, list, delete: if isAdmin();
    }
  }
}
```
### 3. Granting Admin Access
1. Sign up a new account through the application UI.
2. Navigate to your Firestore **users** collection in the Firebase Console.
3. Find your user ID document and add a new field: `isAdmin: true` (Type: Boolean).
4. Refresh the application; the **ADMIN** button will now be visible in the header.

### 4. Configuring APIs
Once in the Admin Panel, add your keys and models as comma-separated lists:
- **Text Models**: `gemini:gemini-1.5-flash, groq:llama3-70b-8192`
- **STT Models**: `groq:whisper-large-v3, gemini:gemini-1.5-flash`

## 📁 Files
- `index.html`: The core application (Single Page App).
- `The Plan.md`: Original design specifications and logic requirements.

## ⚖️ License
MIT