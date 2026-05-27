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
service cloud.firestore {
  match /databases/{database}/documents {

    // User profiles
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;

      // Admin logic
      allow list: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
      allow update, delete: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Global settings (Admin only for write, Auth for read)
    match /settings/main {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }

    // Chat history ownership
    match /chats/{chatId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      
      match /messages/{messageId} {
        // Inherit permissions from parent chat ownership
        allow read, write: if request.auth != null && get(/databases/$(database)/documents/chats/$(chatId)).data.userId == request.auth.uid;
      }
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