import mongoose from "mongoose";
import { connectDB } from "./db";
import { User, Merchant, Customer, Transaction, UtilityPayment, WalletActivity } from "./schema";

const businessTypes = [
  "TEA_SHOP", "GROCERY", "RESTAURANT", "VEGETABLE_SHOP", "PHARMACY",
  "MOBILE_REPAIR", "STATIONERY", "CLOTHING_STORE", "BEAUTY_PARLOUR",
  "MEAT_SHOP", "BAKERY", "DAIRY_SHOP", "CYBER_CAFE", "HARDWARE_STORE",
  "SNACK_SHOP"
];

const districts = [
  "Kathmandu", "Lalitpur", "Bhaktapur", "Pokhara", "Chitwan",
  "Biratnagar", "Butwal", "Dharan", "Hetauda", "Nepalgunj"
];

const municipalities = [
  "Kathmandu Metropolitan City", "Lalitpur Metropolitan City", "Madhyapur Thimi",
  "Pokhara Metropolitan City", "Bharatpur Metropolitan City", "Biratnagar Metropolitan City",
  "Butwal Sub-Metropolitan City", "Dharan Sub-Metropolitan City", "Hetauda Sub-Metropolitan City",
  "Nepalgunj Sub-Metropolitan City"
];

const merchantNames = [
  "Maya Tea Stall", "Ram Grocery Store", "Sita Fresh Vegetables", "Himalayan Snacks Corner",
  "New Baneshwor Pharmacy", "Everest Mobile Repair", "Patan Stationery Hub", "Pokhara Mini Mart",
  "Bhaktapur Dairy Shop", "Lumbini Clothing Center", "Annapurna Bakery", "Namaste Meat Shop",
  "Sunrise Beauty Parlour", "City Cyber Point", "Bishal Hardware Store", "Gurung MoMo Center",
  "Shrestha Kirana Pasal", "Thapa Tea House", "Green Valley Grocery", "Fresh Farm Vegetable Shop",
  "New Road Mobile Care", "Sajha Stationery", "Dharan Snack House", "Butwal Mini Store",
  "Hetauda Dairy Corner", "Biratnagar Pharmacy", "Nepalgunj Hardware", "Lalitpur Bakery House",
  "Kathmandu Fast Food", "Chitwan Cold Store", "Pokhara Tea Point", "Boudha Grocery House",
  "Koteshwor Mobile Hub", "Gwarko Vegetable Center", "Kalanki Kirana Store", "Satdobato Pharmacy",
  "Itahari Snack Shop", "Janakpur Mini Mart", "Damak Dairy Store", "Banepa Hardware",
  "Kirtipur Tea Stall", "Balaju Grocery", "Lagankhel Fashion Store", "Maharajgunj Beauty Studio",
  "Tokha Bakery", "Balkhu Meat Center", "Kumaripati Stationery", "Suryabinayak Mobile Repair",
  "Pulchowk Coffee Corner", "Sanepa Fresh Mart"
];

const ownerNames = [
  "Maya Shrestha", "Ram Bahadur Thapa", "Sita Sharma", "Bishal Gurung", "Anita Karki",
  "Ramesh Adhikari", "Puja Tamang", "Suman Rai", "Nisha Maharjan", "Deepak Bhandari",
  "Sarita Lama", "Krishna Sapkota", "Binita Khadka", "Amit Joshi", "Prakash Pandey",
  "Sanjay Shrestha", "Kalpana Gurung", "Milan Thapa", "Rojina Tamang", "Bibek K.C.",
  "Sabina Rai", "Dipesh Maharjan", "Manisha Adhikari", "Raj Kumar Lama", "Sujata Sharma",
  "Nabin Bhandari", "Rita Khadka", "Kiran Pandey", "Anil Joshi", "Pratima Sapkota",
  "Sunil Karki", "Asmita Gurung", "Roshan Rai", "Pabitra Tamang", "Sagar Shrestha",
  "Kabita Thapa", "Umesh Lama", "Srijana Maharjan", "Dinesh Adhikari", "Bimala Sharma",
  "Arjun K.C.", "Rupa Khadka", "Santosh Pandey", "Mina Joshi", "Rajendra Bhandari",
  "Laxmi Sapkota", "Niraj Karki", "Sushma Rai", "Hemanta Gurung", "Alisha Tamang"
];

const customerFirstNames = [
  "Anil", "Rita", "Suman", "Puja", "Bikash", "Nisha", "Ramesh", "Sarita", "Deepak",
  "Manisha", "Krishna", "Bibek", "Sabina", "Rajesh", "Binita", "Amit", "Sunita",
  "Dinesh", "Prakash", "Mina", "Sanjay", "Anjali", "Roshan", "Srijana", "Hari"
];

const customerLastNames = [
  "Sharma", "Karki", "Thapa", "Shrestha", "Rai", "Gurung", "Lama", "Tamang",
  "Joshi", "Adhikari", "Pandey", "K.C.", "Khadka", "Maharjan", "Sapkota", "Bhandari"
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2) {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

function pick(arr: any[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function dateDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(randomInt(7, 21), randomInt(0, 59), randomInt(0, 59), 0);
  return d;
}

function generatePhone(prefix: string, index: number) {
  return `${prefix}${String(index).padStart(7, "0")}`;
}

async function seed() {
  try {
    console.log("🍃 Preparing connection to MongoDB testdb...");
    await connectDB();

    console.log("🧹 Wiping old collections completely...");
    try { await mongoose.connection.db.dropCollection("merchants"); } catch (e) {}
    try { await mongoose.connection.db.dropCollection("customers"); } catch (e) {}
    try { await mongoose.connection.db.dropCollection("users"); } catch (e) {}
    try { await mongoose.connection.db.dropCollection("transactions"); } catch (e) {}
    try { await mongoose.connection.db.dropCollection("utilitypayments"); } catch (e) {}
    try { await mongoose.connection.db.dropCollection("walletactivities"); } catch (e) {}

    const usersData: any[] = [];
    const merchantsData: any[] = [];
    const customersData: any[] = [];
    const transactionsData: any[] = [];
    const walletActivitiesData: any[] = [];
    const utilityPaymentsData: any[] = [];

    // ==========================================
    // 1. GENERATE 100 CENTRALIZED USERS
    // ==========================================
    console.log("Generating 100 centralized users...");
    // 30 Merchants, 50 Customers, 20 BOTH (100 users total)
    for (let i = 1; i <= 100; i++) {
      const userId = `USR-${String(i).padStart(5, "0")}`;
      const districtIndex = randomInt(0, districts.length - 1);
      
      let user_type = "CUSTOMER";
      if (i <= 30) {
        user_type = "MERCHANT";
      } else if (i > 30 && i <= 50) {
        user_type = "BOTH";
      }

      usersData.push({
        _id: userId,
        user_code: userId,
        name: i <= 50 ? ownerNames[i - 1] : `${pick(customerFirstNames)} ${pick(customerLastNames)}`,
        phone: generatePhone("980", i),
        user_type,
        location: {
          province: "Bagmati",
          district: districts[districtIndex],
          municipality: municipalities[districtIndex],
          ward_no: randomInt(1, 32)
        },
        verified_status: pick(["verified", "unverified"]),
        balance: randomInt(5000, 75000),
        occupation: pick(["AGRICULTURE", "RETAIL", "SERVICES", "TRANSPORT", "REMITTANCE", "OTHER"]),
        linked_bank_count: randomInt(0, 3),
        nid_verified: Math.random() > 0.3,
        is_active: true
      });
    }
    await User.insertMany(usersData);
    console.log("✓ 100 Users successfully seeded!");

    // ==========================================
    // 2. CREATE MERCHANT & CUSTOMER PROFILES (INTERCONNECTED)
    // ==========================================
    console.log("Creating Merchant and Customer interconnected profiles...");
    let mrcCounter = 1;
    let cusCounter = 1;

    for (const user of usersData) {
      if (user.user_type === "MERCHANT" || user.user_type === "BOTH") {
        const mrcId = `MRC-${String(mrcCounter).padStart(5, "0")}`;
        merchantsData.push({
          _id: mrcId,
          user_id: user._id, // Connected
          merchant_code: mrcId,
          merchant_name: merchantNames[mrcCounter - 1] || `${user.name} Stall`,
          business_type: pick(businessTypes),
          registration_status: pick(["registered", "unregistered", "in_process"]),
          wallet_age_months: randomInt(3, 48),
          business_started_year: randomInt(2015, 2025),
          is_active: true
        });
        mrcCounter++;
      }

      if (user.user_type === "CUSTOMER" || user.user_type === "BOTH") {
        const cusId = `CUS-${String(cusCounter).padStart(5, "0")}`;
        customersData.push({
          _id: cusId,
          user_id: user._id, // Connected
          customer_code: cusId,
          customer_name: user.name
        });
        cusCounter++;
      }
    }
    await Merchant.insertMany(merchantsData);
    await Customer.insertMany(customersData);
    console.log(`✓ ${mrcCounter - 1} Merchant Profiles & ${cusCounter - 1} Customer Profiles successfully seeded!`);

    // ==========================================
    // 3. GENERATE 5000 TRANSACTIONS (INTERCONNECTED VIA parent USER IDs)
    //    Spread over 400 days for year-over-year F1.3 seasonality testing
    // ==========================================
    console.log("Generating 5000 interconnected transaction records (400-day window)...");
    
    // Group verified Users by types for transaction creation (unverified users cannot do transactions!)
    const merchantUsers = usersData.filter(u => (u.user_type === "MERCHANT" || u.user_type === "BOTH") && u.verified_status === "verified");
    const customerUsers = usersData.filter(u => (u.user_type === "CUSTOMER" || u.user_type === "BOTH") && u.verified_status === "verified");

    for (let i = 1; i <= 5000; i++) {
      const transactionId = `TXN-${String(i).padStart(8, "0")}`;
      const type = pick(["QR_PAYMENT", "WALLET_PAYMENT", "REFUND", "CASH_IN", "CASH_OUT", "SUPPLIER_PAYMENT", "BILL_PAYMENT"]);
      
      let amount = 0;
      let sender_id = "";
      let receiver_id = "";
      let payment_channel = "QR";

      const merchantUser = pick(merchantUsers);
      const customerUser = pick(customerUsers);

      if (type === "QR_PAYMENT" || type === "WALLET_PAYMENT") {
        // Customer pays Merchant
        sender_id = customerUser._id;
        receiver_id = merchantUser._id;
        amount = randomInt(50, 4500);
        payment_channel = type === "QR_PAYMENT" ? "QR" : "WALLET";
      } else if (type === "SUPPLIER_PAYMENT") {
        // Merchant pays corporate supplier user
        sender_id = merchantUser._id;
        // Wholesaler is generated randomly from the higher end of users
        const wholesaler = pick(usersData);
        receiver_id = wholesaler._id;
        amount = randomInt(5000, 75000);
        payment_channel = "BANK_TRANSFER";
      } else if (type === "BILL_PAYMENT") {
        // Merchant pays utility provider corporate account
        sender_id = merchantUser._id;
        const provider = pick(usersData);
        receiver_id = provider._id;
        amount = randomInt(400, 9500);
        payment_channel = "WALLET";
      } else if (type === "CASH_IN") {
        // Sweep in from external linked bank to merchant user account
        sender_id = merchantUser._id;
        receiver_id = merchantUser._id;
        amount = randomInt(2000, 50000);
        payment_channel = "BANK_TRANSFER";
      } else if (type === "CASH_OUT") {
        // Sweep out from merchant user wallet to external
        sender_id = merchantUser._id;
        receiver_id = merchantUser._id;
        amount = randomInt(2000, 40000);
        payment_channel = "BANK_TRANSFER";
      } else { // REFUND
        // Merchant refunds customer
        sender_id = merchantUser._id;
        receiver_id = customerUser._id;
        amount = randomInt(50, 1500);
        payment_channel = "WALLET";
      }

      const isSuccess = Math.random() > 0.03; // 97% success
      const status = type === "REFUND" ? "REFUNDED" : (isSuccess ? "SUCCESS" : "FAILED");
      const transTime = dateDaysAgo(randomInt(0, 400));

      const lat = randomFloat(27.65, 27.75, 4);
      const lon = randomFloat(85.25, 85.45, 4);

      transactionsData.push({
        _id: transactionId,
        transaction_code: transactionId,
        sender_id,
        receiver_id,
        amount,
        transaction_type: type,
        status,
        payment_channel,
        transaction_growth_rate: randomFloat(-0.35, 1.25, 2),
        device_id: `DEV-${merchantUser._id}`,
        location: {
          district: merchantUser.location.district,
          latitude: lat,
          longitude: lon
        },
        transaction_time: transTime,
        remarks: `${merchantUser.user_type} ${type.toLowerCase().replace("_", " ")} record`,
        created_at: transTime
      });
    }
    await Transaction.insertMany(transactionsData);
    console.log(`✓ ${transactionsData.length} Transactions successfully seeded!`);

    // ==========================================
    // 4. GENERATE WALLET ACTIVITIES (LINKED TO CENTRALIZED USER WALLET)
    // ==========================================
    console.log("Generating centralized User wallet ledger histories...");
    let walletActCounter = 1;
    for (const user of usersData) {
      if (user.verified_status !== "verified") continue;
      let balance = user.balance;
      const activities = randomInt(15, 40);

      for (let j = 0; j < activities; j++) {
        const type = pick(["PAYMENT_RECEIVED", "CASH_IN", "CASH_OUT", "SUPPLIER_PAYMENT", "BILL_PAYMENT", "LOAN_REPAYMENT"]);
        const amount = randomInt(300, 15000);

        if (type === "PAYMENT_RECEIVED" || type === "CASH_IN") {
          balance += amount;
        } else {
          balance -= amount;
          if (balance < 0) balance = randomInt(1000, 5000);
        }

        walletActivitiesData.push({
          _id: `WAL-${String(walletActCounter).padStart(5, "0")}`,
          user_id: user._id, // Linked to User
          activity_type: type,
          amount,
          balance_after_transaction: balance,
          activity_time: dateDaysAgo(randomInt(0, 400)),
          created_at: now
        });
        walletActCounter++;
      }
    }
    await WalletActivity.insertMany(walletActivitiesData);
    console.log(`✓ ${walletActCounter - 1} Wallet Activities successfully seeded!`);

    // ==========================================
    // 5. GENERATE UTILITY PAYMENTS (CONNECTED TO MERCHANT & CENTRALIZED USER)
    // ==========================================
    console.log("Generating utility payment timelines...");
    let utilCounter = 1;
    for (const merchant of merchantsData) {
      const parentUser = usersData.find(u => u._id === merchant.user_id);
      if (!parentUser || parentUser.verified_status !== "verified") continue;
      const bills = randomInt(2, 4);
      for (let j = 0; j < bills; j++) {
        const dueDate = dateDaysAgo(randomInt(5, 90));
        const paymentRoll = Math.random();
        
        let paymentStatus = "ON_TIME";
        let daysLate = 0;
        let paidDate: Date | undefined = new Date(dueDate);

        if (paymentRoll < 0.15) {
          paymentStatus = "PAID_EARLY";
          paidDate.setDate(paidDate.getDate() - randomInt(1, 5));
        } else if (paymentRoll >= 0.15 && paymentRoll < 0.75) {
          paymentStatus = "ON_TIME";
        } else if (paymentRoll >= 0.75 && paymentRoll < 0.90) {
          paymentStatus = "LATE";
          daysLate = randomInt(1, 15);
          paidDate.setDate(paidDate.getDate() + daysLate);
        } else if (paymentRoll >= 0.90 && paymentRoll < 0.96) {
          paymentStatus = "MISSED";
          daysLate = 30;
          paidDate = undefined;
        } else {
          paymentStatus = "UNPAID";
          daysLate = randomInt(5, 25);
          paidDate = undefined;
        }

        utilityPaymentsData.push({
          _id: `UTIL-${String(utilCounter).padStart(5, "0")}`,
          merchant_id: merchant._id, // Linked to Merchant profile
          sender_id: merchant.user_id, // Linked to parent User
          bill_type: pick(["ELECTRICITY", "WATER", "INTERNET", "MOBILE_TOPUP"]),
          bill_amount: randomInt(300, 8500),
          due_date: dueDate,
          paid_date: paidDate,
          payment_status: paymentStatus,
          days_late: daysLate,
          created_at: now
        });
        utilCounter++;
      }
    }
    await UtilityPayment.insertMany(utilityPaymentsData);
    console.log(`✓ ${utilCounter - 1} Utility Payments successfully seeded!`);

    console.log("⭐ Database Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed with error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🍃 Database connection closed safely.");
  }
}

const now = new Date("2026-05-30T00:00:00Z");

seed();
