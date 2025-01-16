# BookMySpot - Smart Parking Management System

BookMySpot is a modern web application that simplifies urban parking by connecting drivers with available parking spots. The platform provides an efficient solution for finding, booking, and managing parking spaces.

## Features

- **User Authentication**: Secure login and registration system with role-based access (Admin, Space Owner, User)
- **Interactive Dashboard**: Customized dashboards for different user roles
- **Parking Spot Management**: 
  - Add, edit, and remove parking spots (Space Owners)
  - View and book available spots (Users)
  - Monitor and manage all spots (Admin)
- **Real-time Updates**: Live status updates for parking spot availability
- **Responsive Design**: Mobile-first approach ensuring seamless experience across all devices
- **Secure Payments**: Integration with secure payment processing (coming soon)

## Tech Stack

- **Frontend**: Next.js 13+ with App Router, React 18
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **State Management**: React Context API
- **Notifications**: React Hot Toast
- **Icons**: React Icons

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- npm or yarn
- Git

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/bookmyspot.git
   cd bookmyspot
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   - Create a `.env.local` file in the root directory
   - Add the following variables:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
bookmyspot/
├── src/
│   ├── app/                 # Next.js 13 app directory
│   ├── components/          # Reusable components
│   ├── config/             # Configuration files
│   ├── context/            # React Context providers
│   ├── services/           # API and service functions
│   └── types/              # TypeScript type definitions
├── public/                 # Static assets
└── ...config files
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Security

This project implements several security measures:
- Firebase Authentication for secure user management
- Firestore Security Rules for data access control
- Environment variables for sensitive information
- Input validation and sanitization

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Your Name - [@yourusername](https://twitter.com/yourusername)
Project Link: [https://github.com/yourusername/bookmyspot](https://github.com/yourusername/bookmyspot)

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Firebase](https://firebase.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Icons](https://react-icons.github.io/react-icons/)
