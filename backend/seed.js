const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Category = require('./models/Category');
const Account = require('./models/Account');
const Transaction = require('./models/Transaction');
const LedgerService = require('./services/ledgerService');

const URI = "mongodb+srv://cosmosjay21_db_user:x6MDW5Kfpjd2ks8l@cluster0.lcj99yy.mongodb.net/?appName=Cluster0"; // Replace with your string

async function runSeed() {
    try {
        console.log("🚀 Starting Seed Process...");
        await mongoose.connect(URI);
        
        // 1. CLEANUP EVERYTHING
        console.log("🧹 Wiping database...");
        await Promise.all([
            User.deleteMany({}),
            Category.deleteMany({}),
            Account.deleteMany({}),
            Transaction.deleteMany({})
        ]);

        // 2. CREATE THE USER (Your Login Credentials)
        console.log("👤 Creating User...");

        const user = await User.create({
            firstName: 'Demo',
            lastName: 'User',
            email: 'demo@stepseven.app',
            password: 'password123',
            isActive: true, // IMPORTANT: Your controller checks for this!
            currency: {
                code: 'NGN',
                symbol: '₦',
                subunitName: 'kobo',
                subunitToUnit: 100
            }
        });

        const USER_ID = user._id;

        // 3. CATEGORIES
        console.log("📂 Creating Categories...");
        const cats = await Category.insertMany([
            { name: 'Salary', type: 'INCOME', icon: 'cash', color: '#4CAF50', user: USER_ID },
            { name: 'Food', type: 'EXPENSE', icon: 'restaurant', color: '#FF5722', user: USER_ID },
            { name: 'Rent', type: 'EXPENSE', icon: 'home', color: '#2196F3', user: USER_ID }
        ]);
//ndhhdhhdh
        // 4. ACCOUNTS
        console.log("🏦 Creating Account...");
        const gtBank = await Account.create({
            name: 'GTBank Savings',
            type: 'ASSET',
            subType: 'BANK',
            balance: 0, 
            user: USER_ID
        });

        // 5. TRANSACTIONS
        console.log("💰 Recording Initial Income...");
        const income = 50000000; // ₦500k in kobo

        await Transaction.create({
            user: USER_ID, 
            type: 'INCOME', 
            amount: income, 
            account: gtBank._id,
            category: cats[0]._id, 
            description: 'Opening Balance', 
            // .toISOString() ensures it matches "YYYY-MM-DDTHH:mm:ss.sssZ"
            date: new Date().toISOString() 
        });
        await LedgerService.recordIncome(gtBank._id, income);

        console.log("💸 Recording Initial Expense...");
        const expense = 500000; // ₦5k
        await Transaction.create({
            user: USER_ID,
            type: 'EXPENSE',
            amount: expense,
            account: gtBank._id,
            category: cats[1]._id,
            description: 'Initial Seed Expense',
            date: new Date().toISOString() // Fixed here too
        });
        await LedgerService.recordExpense(gtBank._id, expense);
        console.log(`
        ------------------------------------
        ✨ SEEDING SUCCESSFUL!
        
        LOGIN CREDENTIALS:
        Email: demo@stepseven.app
        Password: password123
        
        Initial Balance: ₦${income / 100}
        ------------------------------------
        `);
        
        process.exit(0);
    } catch (err) {
        console.error("❌ SEED FAILED:", err.message);
        process.exit(1);
    }
}

runSeed();