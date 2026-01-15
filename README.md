# JBFitness - Fitness Tracking Web Application

A modern, responsive fitness tracking web application built with React, featuring a seamless user interface for managing workouts, nutrition, and account settings.

## Features

- **Login/Create Account Page**: Beautiful sign-up form with social login options
- **Dashboard**: Comprehensive fitness dashboard with:
  - Daily metrics tracking (Calories, Workouts, Water Intake)
  - Weekly progress visualization
  - Saved workouts and meals
- **Settings Page**: Complete account management with:
  - Profile management
  - Payment and subscription settings
  - Help & Support resources

## Tech Stack

- **React 18** - UI library
- **React Router DOM** - Navigation and routing
- **Vite** - Build tool and development server
- **CSS3** - Styling and responsive design

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
JBFitness/
├── src/
│   ├── pages/
│   │   ├── LoginPage.jsx      # Login/Create Account page
│   │   ├── LoginPage.css
│   │   ├── Dashboard.jsx      # Main dashboard
│   │   ├── Dashboard.css
│   │   ├── Settings.jsx       # Settings page
│   │   └── Settings.css
│   ├── App.jsx                # Main app component with routing
│   ├── App.css
│   ├── main.jsx               # Entry point
│   └── index.css             # Global styles
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Pages

### Login Page (`/login`)
- Email and password registration
- Password confirmation
- Terms of Service agreement
- Social login options (Google, Facebook)
- Navigation to dashboard

### Dashboard (`/dashboard`)
- Summary cards for daily metrics
- Weekly progress graph
- Saved workouts with start functionality
- Saved meals with add to today functionality
- Navigation tabs (Nutrition/Workout)

### Settings (`/settings`)
- Account profile management
- Payment and subscription information
- Help & Support resources
- Sign out functionality

## Navigation

- Click "Create Account" or use social login to navigate to dashboard
- Click profile icon in dashboard header to go to settings
- Click back arrow in settings to return to dashboard
- All navigation is handled via React Router

## Styling

The application uses a consistent color scheme:
- Background: Light green (#e8f5e9)
- Primary text: Dark gray (#424242)
- Secondary text: Medium gray (#757575)
- Cards: White with subtle shadows
- Accents: Green (#66bb6a) for progress indicators

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

© 2026 JBFitness. All rights reserved.
