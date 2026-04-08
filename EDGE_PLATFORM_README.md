# EDGE Platform - Premium PWA

A mobile-first Progressive Web App (PWA) with a premium dark aesthetic featuring credit-based access control, marketplace functionality, and comprehensive admin management.

## 🔑 Access Credentials

### Invite Code
- **Code**: `EDGE2026`

### Admin Login
- **Username**: `Godofdge`
- **Password**: `Godson123`

### Test User Flow
1. Enter invite code: `EDGE2026`
2. Select a plan on homepage
3. Create account with username/password
4. Complete payment simulation
5. Wait for admin approval (or login as admin to approve yourself)

## 🎨 Features

### User Features
- **Credit System**: Virtual EDGE Credits for platform access
- **Buy Reviews**: Purchase review packages (3-500 reviews)
- **Remove Reviews Tool**: Scan and remove negative reviews (requires 200 credits)
- **Marketplace**: Open exchange for services (requires 100 credits)
- **Business Upgrade**: Premium optimization services
- **EDGE Store**: Admin-curated product listings
- **Credit Top-Up**: Add credits anytime

### Admin Features
- **User Management**: Approve/reject pending users
- **Credit Control**: Add/remove credits from user accounts
- **Invite Codes**: Create and manage access codes
- **Notifications**: Send messages to users
- **Store Management**: Add/remove product links
- **Payment Verification**: Manual payment approval workflow

## 🚀 Tech Stack

- **React** with TypeScript
- **React Router** for navigation
- **Tailwind CSS v4** for styling
- **LocalStorage** for data persistence
- **Sonner** for toast notifications
- **Lucide Icons** for UI icons
- **Motion** for animations

## 🎯 Design Features

- **Dark Premium Theme**: Glossy glassmorphism with neon accents
- **Mobile-First**: Optimized for mobile, scales to desktop
- **Smooth Animations**: Micro-interactions throughout
- **Neon Glow Effects**: Electric blue (#0ea5e9) accent color
- **Responsive Design**: Works across all screen sizes

## 📱 Usage Flow

### First-Time User
1. Visit homepage → See invite gate
2. Enter invite code and agree to terms
3. Browse homepage and select a plan
4. Complete signup (3 steps: account, payment, confirmation)
5. Status set to "pending"
6. Admin approves and assigns credits
7. Access full dashboard

### Returning User
1. Click "Sign In"
2. Enter credentials
3. Access dashboard with all unlocked features

### Admin
1. Sign in with admin credentials
2. Access admin dashboard
3. Manage users, credits, codes, notifications, and store

## 🔒 Security Notes

This is a frontend demonstration app using localStorage. In production:
- Use proper backend authentication (Supabase, Firebase, etc.)
- Implement real payment processing
- Add rate limiting and validation
- Use encrypted credential storage
- Add email verification
- Implement proper session management

## 💡 Key Design Decisions

- **Invite-Only**: Creates exclusivity and scarcity
- **Credit System**: Flexible virtual currency for platform features
- **Manual Approval**: Admin control over user activation
- **Locked Features**: Encourages credit purchases
- **Mobile-First**: Primary use case is on-the-go access
- **Dark Theme**: Premium, modern aesthetic
- **Glassmorphism**: Trendy 2026 design pattern