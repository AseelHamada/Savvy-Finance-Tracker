# Personal Finance Tracker

A comprehensive single-page application (SPA) built with Next.js and Tailwind CSS for managing personal finances, including income tracking, expense management, and savings goals.

## Features

### Core Functionality
- **Wallet Management**: Create and manage multiple wallets (Bank, Cash, Credit, Investment, etc.)
- **Transaction Tracking**: Add income and expense transactions with categories
- **Savings Goals**: Set and track financial goals with progress visualization
- **Real-time Dashboard**: Overview of total balance, monthly income/expenses, and savings

### Key Components
- **Summary Cards**: Display total balance, monthly income, expenses, and savings
- **Recent Transactions Table**: View and manage transaction history
- **Goals Tracker**: Monitor savings progress with visual indicators
- **Add Forms**: Easy-to-use forms for adding wallets, transactions, and goals

### Technical Features
- **State Management**: Zustand for efficient state handling
- **Local Storage**: Persistent data storage in browser
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **TypeScript**: Type-safe development experience
- **Modern UI**: Clean, intuitive interface with Lucide React icons

## Technology Stack

- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom components
- **State Management**: Zustand with persistence middleware
- **Icons**: Lucide React
- **Language**: TypeScript

## Getting Started

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd personal-finance-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Usage Guide

### Creating Your First Wallet

1. Click the "Add Wallet" button in the header
2. Fill in wallet details:
   - **Wallet Name**: e.g., "Main Bank Account"
   - **Wallet Type**: Bank, Cash, Credit Card, Investment, or Other
   - **Initial Balance**: Starting amount
   - **Currency**: USD, EUR, GBP, etc.
3. Click "Add Wallet" to create

### Adding Transactions

1. Click the "Add Transaction" button
2. Select transaction type (Income/Expense)
3. Fill in transaction details:
   - **Amount**: Transaction value
   - **Description**: What the transaction was for
   - **Category**: Transaction category
   - **Wallet**: Which wallet to use
   - **Date**: Transaction date
4. Click "Add Transaction"

### Managing Savings Goals

1. In the Goals section, click "Add Goal"
2. Enter goal information:
   - **Goal Name**: e.g., "Emergency Fund"
   - **Target Amount**: Amount you want to save
   - **Deadline**: Target completion date
   - **Category**: Goal category
3. Track progress and add funds as you save

## Data Structure

### Wallet
```typescript
interface Wallet {
  id: string;
  name: string;
  type: 'bank' | 'cash' | 'credit' | 'investment' | 'other';
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}
```

### Transaction
```typescript
interface Transaction {
  id: string;
  walletId: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}
```

### Goal
```typescript
interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}
```

## State Management

The application uses Zustand for state management with the following stores:

- **Finance Store**: Manages wallets, transactions, and goals
- **Local Storage Integration**: Automatic persistence of data
- **Computed Values**: Real-time calculations for balances and statistics

## Customization

### Adding New Categories
Modify the category arrays in `AddTransactionForm.tsx`:
```typescript
const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other Income'];
const expenseCategories = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Healthcare', 'Education', 'Other Expense'];
```

### Custom Styling
Update `tailwind.config.js` to modify the theme:
```javascript
theme: {
  extend: {
    colors: {
      // Add custom colors here
    }
  }
}
```

## Browser Support

This application supports all modern browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Security Considerations

- All data is stored locally in the browser
- No server-side data transmission
- Client-side validation for all inputs
- XSS protection through React's built-in safeguards

## Future Enhancements

Potential features for future versions:
- [ ] Data export/import functionality
- [ ] Advanced reporting and analytics
- [ ] Budget tracking and alerts
- [ ] Recurring transactions
- [ ] Multi-currency support
- [ ] Cloud synchronization
- [ ] Mobile app version

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues, questions, or feature requests, please open an issue on the GitHub repository.

---

**Built with Next.js, TypeScript, and Tailwind CSS**
