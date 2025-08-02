# FitFlow Pro

![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/avishek15/workout_tracker_app?utm_source=oss&utm_medium=github&utm_campaign=avishek15%2Fworkout_tracker_app&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

**Track. Progress. Transform.**

FitFlow Pro is a comprehensive fitness tracking platform that helps you monitor your workouts, analyze your progress, and achieve your fitness goals with precision. Built with modern web technologies for a seamless user experience.

## 🚀 Features

- **Workout Tracking**: Create and manage custom workouts with sets, reps, and weights
- **Progress Analytics**: Detailed charts and insights to understand your fitness journey
- **Session History**: Review past workouts and track improvements over time
- **Profile Management**: Upload profile pictures and manage personal information
- **Real-time Updates**: Live data synchronization across all devices
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: [Convex](https://convex.dev) - Real-time database and backend
- **Authentication**: Convex Auth with Anonymous auth
- **Icons**: Lucide React
- **UI Components**: Custom components with Tailwind CSS
- **Deployment**: Connected to Convex deployment [`dazzling-snake-548`](https://dashboard.convex.dev/d/dazzling-snake-548)

## 📁 Project Structure

```
workout_tracker_app/
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   └── main.tsx           # Application entry point
├── convex/                # Backend Convex functions
│   ├── _generated/        # Auto-generated Convex types
│   ├── users.ts           # User management functions
│   ├── workouts.ts        # Workout-related functions
│   ├── sets.ts            # Exercise set functions
│   └── schema.ts          # Database schema
├── public/                # Static assets
│   ├── logo2.png          # Application logo
│   └── logo2.ico          # Favicon
└── index.html             # HTML template
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Convex account

### Installation

1. **Clone the repository**

    ```bash
    git clone https://github.com/avishek15/workout_tracker_app.git
    cd workout_tracker_app
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Start the development server**

    ```bash
    npm run dev
    ```

    This will start both the frontend (Vite) and backend (Convex) servers.

4. **Open your browser**
   Navigate to `http://localhost:5173` to view the application.

## 🔐 Authentication

This app uses [Convex Auth](https://auth.convex.dev/) with Anonymous auth for easy sign in. Users can start using the app immediately without creating an account, and their data is stored locally. For production deployment, consider implementing more robust authentication methods.

## 🚀 Deployment

### Convex Backend

The backend is automatically deployed to Convex when you push changes to the repository. The deployment is connected to [`dazzling-snake-548`](https://dashboard.convex.dev/d/dazzling-snake-548).

### Frontend Deployment

For frontend deployment, you can use platforms like:

- **Vercel**: Connect your GitHub repository for automatic deployments
- **Netlify**: Deploy from the `dist` folder after building
- **GitHub Pages**: Deploy the built application

### Build for Production

```bash
npm run build
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Convex Development

Check out the [Convex docs](https://docs.convex.dev/) for more information on how to develop with Convex:

- [Overview](https://docs.convex.dev/understanding/) - Great starting point
- [Hosting and Deployment](https://docs.convex.dev/production/) - Deployment guide
- [Best Practices](https://docs.convex.dev/understanding/best-practices/) - Development tips

## 🌐 HTTP API

User-defined HTTP routes are defined in the `convex/router.ts` file. Routes are separated from `convex/http.ts` to prevent LLM modifications to authentication routes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Convex](https://convex.dev) for real-time backend
- Icons from [Lucide React](https://lucide.dev/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)
