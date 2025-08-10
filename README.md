# 🚴 1010 Bike - Modern E-commerce Platform

A full-stack, serverless e-commerce platform built with Next.js 15, featuring a complete bike shop with admin dashboard, payment processing, and modern UI.

![1010 Bike](public/images/1010-1.svg)

## 🚀 Features

### 🛍️ Customer Features

- **Product Catalog** - Browse bikes with advanced filtering and search
- **Shopping Cart** - Add/remove items with persistent cart across sessions
- **User Authentication** - Secure sign-up/sign-in with NextAuth.js
- **Order Management** - Track order history and status
- **Payment Processing** - Integrated PayPal payments
- **Responsive Design** - Mobile-first design with Tailwind CSS
- **Dark/Light Mode** - Theme switching with next-themes

### 👨‍💼 Admin Features

- **Admin Dashboard** - Sales analytics and order overview
- **Product Management** - CRUD operations for bike inventory
- **Order Management** - Process and track customer orders
- **User Management** - View and manage customer accounts
- **Sales Analytics** - Monthly sales reports and metrics

### 🔧 Technical Features

- **Serverless Architecture** - Auto-scaling with Vercel deployment
- **Database** - PostgreSQL with Prisma ORM (Neon serverless)
- **Authentication** - NextAuth.js with JWT strategy
- **File Uploads** - Image handling for product photos
- **TypeScript** - Full type safety throughout the application
- **Modern UI** - Shadcn/ui components with Tailwind CSS

## 🛠️ Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Shadcn/ui** - Modern component library
- **next-themes** - Dark mode support

### Backend

- **Next.js API Routes** - Serverless backend functions
- **Prisma** - Database ORM and migrations
- **NextAuth.js** - Authentication and session management
- **Server Actions** - Direct server-side operations

### Database & Deployment

- **Neon PostgreSQL** - Serverless database
- **Vercel** - Serverless hosting platform
- **PayPal API** - Payment processing

## 📦 Installation

### Prerequisites

- Node.js 18+
- PostgreSQL database (or Neon account)
- PayPal Developer account

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/1010bike.git
cd 1010bike
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# App Configuration
NEXT_PUBLIC_APP_NAME="1010 Bike"
NEXT_PUBLIC_APP_DESCRIPTION="A modern bike e-commerce platform"
NEXT_PUBLIC_SERVER_URL="http://localhost:3000"

# PayPal
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_APP_SECRET="your-paypal-secret"
PAYPAL_API_URL="https://api-m.sandbox.paypal.com" # Use sandbox for testing

# Pagination
PAGE_SIZE=12

# Featured Products
NEXT_PUBLIC_FEATURED_PRODUCTS_LIMIT=4

# Payment Methods
PAYMENT_METHODS="Paypal, Stripe, CashOnDelivery"
DEFAULT_PAYMENT="Paypal"
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# (Optional) Seed database with sample data
npx prisma db seed
```

### 5. Create Admin User

```sql
-- Connect to your database and run:
UPDATE "User" SET role = 'admin' WHERE email = 'your-email@example.com';
```

### 6. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🗂️ Project Structure

```
1010bike/
├── app/                    # Next.js App Router
│   ├── (root)/            # Public routes
│   ├── admin/             # Admin dashboard
│   ├── user/              # User dashboard
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/            # Reusable UI components
│   ├── shared/           # Shared components
│   └── ui/               # Shadcn/ui components
├── lib/                  # Utilities and configuration
│   ├── actions/          # Server actions
│   ├── constants/        # App constants
│   └── utils.ts          # Utility functions
├── prisma/               # Database schema and migrations
├── public/               # Static assets
└── types/                # TypeScript type definitions
```

## 🔑 Key Components

### Authentication

- JWT-based authentication with NextAuth.js
- Role-based access control (user/admin)
- Protected routes and API endpoints

### Database Schema

```prisma
model User {
  id       String @id @default(cuid())
  name     String
  email    String @unique
  password String
  role     String @default("user")
  orders   Order[]
}

model Product {
  id          String @id @default(cuid())
  name        String
  slug        String @unique
  price       Decimal
  description String
  images      String[]
  category    String
  brand       String
  stock       Int
}

model Order {
  id              String @id @default(cuid())
  userId          String
  totalPrice      Decimal
  isPaid          Boolean @default(false)
  isDelivered     Boolean @default(false)
  shippingAddress Json
  orderItems      OrderItem[]
}
```

### Payment Flow

1. User adds items to cart
2. Proceeds to checkout
3. PayPal payment processing
4. Order confirmation and tracking

## 🚀 Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production

```env
DATABASE_URL="your-production-database-url"
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://your-domain.com"
PAYPAL_CLIENT_ID="your-production-paypal-client-id"
PAYPAL_APP_SECRET="your-production-paypal-secret"
PAYPAL_API_URL="https://api-m.paypal.com" # Production PayPal API
```

## 📊 Monitoring & Analytics

### Cost Monitoring

- **Vercel**: Dashboard → Analytics/Usage
- **Neon**: Console → Usage/Billing
- **PayPal**: Developer Dashboard → Reports

### Performance

- Serverless functions auto-scale based on demand
- Database hibernates during low traffic
- Global CDN for static assets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you have any questions or need help:

1. Check the [Issues](https://github.com/yourusername/1010bike/issues) page
2. Create a new issue with detailed information
3. Join our community discussions

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Prisma](https://prisma.io/) - Database toolkit
- [Vercel](https://vercel.com/) - Deployment platform
- [Neon](https://neon.tech/) - Serverless PostgreSQL

---

**Built with ❤️ by [Your Name]**

_A modern, serverless e-commerce solution for the digital age._
