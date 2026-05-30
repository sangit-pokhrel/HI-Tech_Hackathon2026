import mongoose from "mongoose";
import { connectDB } from "./db";
import { Merchant, Customer, Transaction, UtilityPayment, WalletActivity } from "./schema";

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

    console.log("🧹 Wiping old collections...");
    await Merchant.deleteMany({});
    await Customer.deleteMany({});
    await Transaction.deleteMany({});
    await UtilityPayment.deleteMany({});
    await WalletActivity.deleteMany({});

    const merchants: any[] = [];
    const customers: any[] = [];
    const transactions: any[] = [];
    const walletActivities: any[] = [];
    const utilityPayments: any[] = [];

    // ==========================================
    // 1. GENERATE 50 MERCHANTS
    // ==========================================
    console.log("Generating 50 micro-merchants...");
    for (let i = 1; i <= 50; i++) {
      const merchantId = `MRC-${String(i).padStart(5, "0")}`;
      const districtIndex = randomInt(0, districts.length - 1);

      merchants.push({
        _id: merchantId,
        merchant_code: merchantId,
        merchant_name: merchantNames[i - 1] || `${pick(ownerNames)} shop`,
        owner_name: ownerNames[i - 1] || pick(ownerNames),
        phone_number: generatePhone("980", i),
        business_type: pick(businessTypes),
        registration_status: pick(["registered", "unregistered", "in_process"]),
        location: {
          province: "Bagmati",
          district: districts[districtIndex],
          municipality: municipalities[districtIndex],
          ward_no: randomInt(1, 32)
        },
        wallet_age_months: randomInt(3, 48),
        business_started_year: randomInt(2015, 2025),
        is_active: true
      });
    }
    await Merchant.insertMany(merchants);
    console.log("✓ Merchants successfully seeded!");

    // ==========================================
    // 2. GENERATE 100 CUSTOMERS
    // ==========================================
    console.log("Generating 100 customer profiles...");
    for (let i = 1; i <= 100; i++) {
      const customerId = `CUS-${String(i).padStart(5, "0")}`;
      const districtIndex = randomInt(0, districts.length - 1);

      customers.push({
        _id: customerId,
        customer_code: customerId,
        customer_name: `${pick(customerFirstNames)} ${pick(customerLastNames)}`,
        phone_number: generatePhone("981", i),
        location: {
          province: "Bagmati",
          district: districts[districtIndex],
          municipality: municipalities[districtIndex],
          ward_no: randomInt(1, 32)
        },
        verified_status: pick(["verified", "unverified"]),
        balance: randomInt(500, 35000)
      });
    }
    await Customer.insertMany(customers);
    console.log("✓ Customers successfully seeded!");

    // ==========================================
    // 3. GENERATE 1000 TRANSACTIONS (LOGICALLY RELATED)
    // ==========================================
    console.log("Generating 1000 transaction records...");
    for (let i = 1; i <= 1000; i++) {
      const transactionId = `TXN-${String(i).padStart(8, "0")}`;
      const type = pick(["QR_PAYMENT", "WALLET_PAYMENT", "REFUND", "CASH_IN", "CASH_OUT", "SUPPLIER_PAYMENT", "BILL_PAYMENT"]);
      
      let amount = 0;
      let sender_code = "";
      let sender_name = "";
      let receiver_code = "";
      let receiver_name = "";
      let payment_channel = "QR";

      const merchant = pick(merchants);
      const customer = pick(customers);

      if (type === "QR_PAYMENT" || type === "WALLET_PAYMENT") {
        // B2C Customer pays Merchant
        sender_code = customer.customer_code;
        sender_name = customer.customer_name;
        receiver_code = merchant.merchant_code;
        receiver_name = merchant.merchant_name;
        amount = randomInt(50, 4500);
        payment_channel = type === "QR_PAYMENT" ? "QR" : "WALLET";
      } else if (type === "SUPPLIER_PAYMENT") {
        // B2B Merchant pays corporate Supplier
        sender_code = merchant.merchant_code;
        sender_name = merchant.merchant_name;
        receiver_code = `SPL-${String(randomInt(1, 10)).padStart(3, "0")}`;
        receiver_name = `${pick(customerLastNames)} Wholesalers Ltd.`;
        amount = randomInt(5000, 75000);
        payment_channel = "BANK_TRANSFER";
      } else if (type === "BILL_PAYMENT") {
        // B2B Merchant pays utility provider
        sender_code = merchant.merchant_code;
        sender_name = merchant.merchant_name;
        receiver_code = pick(["NEA", "KUKL", "SUBISU", "WORLDLINK", "NTC", "NCELL"]);
        receiver_name = receiver_code === "NEA" ? "Nepal Electricity Authority" : `${receiver_code} Utilities`;
        amount = randomInt(400, 9500);
        payment_channel = "WALLET";
      } else if (type === "CASH_IN") {
        // Merchant loads wallet balance from linked bank
        sender_code = `${merchant.merchant_code}-BANK`;
        sender_name = `${merchant.owner_name} Bank Acct`;
        receiver_code = merchant.merchant_code;
        receiver_name = merchant.merchant_name;
        amount = randomInt(2000, 50000);
        payment_channel = "BANK_TRANSFER";
      } else if (type === "CASH_OUT") {
        // Merchant sweeps wallet balance back to bank account
        sender_code = merchant.merchant_code;
        sender_name = merchant.merchant_name;
        receiver_code = `${merchant.merchant_code}-BANK`;
        receiver_name = `${merchant.owner_name} Bank Acct`;
        amount = randomInt(2000, 40000);
        payment_channel = "BANK_TRANSFER";
      } else { // REFUND
        // Merchant refunds Customer
        sender_code = merchant.merchant_code;
        sender_name = merchant.merchant_name;
        receiver_code = customer.customer_code;
        receiver_name = customer.customer_name;
        amount = randomInt(50, 1500);
        payment_channel = "WALLET";
      }

      const isSuccess = Math.random() > 0.03; // 97% success rate
      const status = type === "REFUND" ? "REFUNDED" : (isSuccess ? "SUCCESS" : "FAILED");
      const transTime = dateDaysAgo(randomInt(0, 90));

      // Nepalese coordinates bhaktapur/kathmandu bounding box
      const lat = randomFloat(27.65, 27.75, 4);
      const lon = randomFloat(85.25, 85.45, 4);

      transactions.push({
        _id: transactionId,
        transaction_code: transactionId,
        sender_code,
        sender_name,
        receiver_code,
        receiver_name,
        amount,
        transaction_type: type,
        status,
        payment_channel,
        transaction_growth_rate: randomFloat(-0.35, 1.25, 2),
        device_id: `DEV-${merchant.merchant_code}`,
        location: {
          district: merchant.location.district,
          latitude: lat,
          longitude: lon
        },
        transaction_time: transTime,
        remarks: `${merchant.business_type} ${type.toLowerCase().replace("_", " ")} record`,
        created_at: transTime
      });
    }
    await Transaction.insertMany(transactions);
    console.log("✓ 1000 Transactions successfully seeded!");

    // ==========================================
    // 4. GENERATE WALLET ACTIVITIES (WITH LOGICAL RUNNING BALANCE)
    // ==========================================
    console.log("Generating merchant wallet ledger histories...");
    let walletActCounter = 1;
    for (const merchant of merchants) {
      let balance = randomInt(5000, 25000);
      const activities = randomInt(8, 15);

      for (let j = 0; j < activities; j++) {
        const type = pick(["PAYMENT_RECEIVED", "CASH_IN", "CASH_OUT", "SUPPLIER_PAYMENT", "BILL_PAYMENT", "LOAN_REPAYMENT"]);
        const amount = randomInt(300, 15000);

        if (type === "PAYMENT_RECEIVED" || type === "CASH_IN") {
          balance += amount;
        } else {
          balance -= amount;
          if (balance < 0) balance = randomInt(1000, 5000); // Prevent negative balances
        }

        walletActivities.push({
          _id: `WAL-${String(walletActCounter).padStart(5, "0")}`,
          merchant_id: merchant.merchant_code,
          activity_type: type,
          amount,
          balance_after_transaction: balance,
          activity_time: dateDaysAgo(randomInt(0, 90)),
          created_at: now
        });
        walletActCounter++;
      }
    }
    await WalletActivity.insertMany(walletActivities);
    console.log(`✓ ${walletActCounter - 1} Wallet Activities successfully seeded!`);

    // ==========================================
    // 5. GENERATE UTILITY PAYMENTS
    // ==========================================
    console.log("Generating utility billing timelines...");
    let utilCounter = 1;
    for (const merchant of merchants) {
      const bills = randomInt(3, 6);
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
          paidDate = undefined; // No paid date
        } else {
          paymentStatus = "UNPAID";
          daysLate = randomInt(5, 25);
          paidDate = undefined; // Not paid yet
        }

        utilityPayments.push({
          _id: `UTIL-${String(utilCounter).padStart(5, "0")}`,
          merchant_id: merchant.merchant_code,
          sender_id: merchant.merchant_code,
          sender_name: merchant.merchant_name,
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
    await UtilityPayment.insertMany(utilityPayments);
    console.log(`✓ ${utilCounter - 1} Utility Payments successfully seeded!`);

    console.log("⭐ Database Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed with error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🍃 Database connection closed safely.");
  }
}

// Global execution timestamp reference matching seed files
const now = new Date("2026-05-30T00:00:00Z");

seed();
