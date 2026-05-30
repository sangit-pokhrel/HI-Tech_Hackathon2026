import mongoose from "mongoose";
import { connectDB } from "./db";
import {
  User,
  Merchant,
  Customer,
  Transaction,
  UtilityPayment,
  WalletActivity,
  LoanApplication,
  RepaymentRecord,
  SocialEdge,
  PsychometricQuestion,
  PsychometricAnswer,
  MerchantFeature,
  ModelPrediction,
  CreditScore,
  MLTrainingRun,
} from "./schema";

const businessTypes = [
  "TEA_SHOP", "GROCERY", "RESTAURANT", "VEGETABLE_SHOP", "AGRICULTURE", "FRUIT_SHOP", "PHARMACY",
  "MOBILE_REPAIR", "STATIONERY", "CLOTHING_STORE", "BEAUTY_PARLOUR",
  "MEAT_SHOP", "BAKERY", "DAIRY_SHOP", "CYBER_CAFE", "HARDWARE_STORE",
  "SNACK_SHOP", "OTHER"
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

const now = new Date("2026-05-30T00:00:00Z");

async function seed() {
  try {
    console.log("🍃 Preparing connection to MongoDB testdb...");
    await connectDB();

    console.log("🧹 Wiping all 15 old collections completely...");
    const collections = [
      "merchants", "customers", "users", "transactions", "utilitypayments",
      "walletactivities", "loanapplications", "repaymentrecords", "socialedges",
      "psychometricquestions", "psychometricanswers", "merchantfeatures",
      "modelpredictions", "creditscores", "mltrainingruns"
    ];
    for (const coll of collections) {
      try {
        await mongoose.connection.db.dropCollection(coll);
        console.log(`✓ Wiped ${coll}`);
      } catch (e) { }
    }

    const usersData: any[] = [];
    const merchantsData: any[] = [];
    const customersData: any[] = [];
    const transactionsData: any[] = [];
    const walletActivitiesData: any[] = [];
    const utilityPaymentsData: any[] = [];
    const loanApplicationsData: any[] = [];
    const repaymentRecordsData: any[] = [];
    const socialEdgesData: any[] = [];
    const psychometricAnswersData: any[] = [];
    const merchantFeaturesData: any[] = [];
    const modelPredictionsData: any[] = [];
    const creditScoresData: any[] = [];

    // ==========================================
    // 1. GENERATE 100 CENTRALIZED USERS — ALL VERIFIED
    // ==========================================
    console.log("Generating 100 centralized users (all verified)...");
    // 30 Merchants, 20 BOTH, 50 Customers (100 users total)
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
        // ✅ ALL users are verified — no unverified users in this system
        verified_status: "verified",
        balance: randomInt(5000, 75000),
        is_active: true,
        created_at: dateDaysAgo(randomInt(90, 400))
      });
    }
    await User.insertMany(usersData);
    console.log("✓ 100 Users (all verified) successfully seeded!");

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
          user_id: user._id,
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
          user_id: user._id,
          customer_code: cusId,
          customer_name: user.name
        });
        cusCounter++;
      }
    }
    await Merchant.insertMany(merchantsData);
    await Customer.insertMany(customersData);
    console.log(`✓ ${merchantsData.length} Merchant Profiles & ${customersData.length} Customer Profiles successfully seeded!`);

    // ==========================================
    // 3. SEED PSYCHOMETRIC QUESTION SCENARIOS
    // ==========================================
    console.log("Seeding psychometric quiz scenario questions...");
    const psychometricQuestions = [
      {
        _id: "QST-00001",
        question_code: "QST-00001",
        question_text: "A Kalimati wholesale vegetable distributor offers you a 15% discount if you pay Rs. 30,000 cash 10 days in advance, but your digital wallet reserves are tight. What do you do?",
        trait_measured: "RISK_CONTROL",
        options: {
          A: { text: "Politely decline. Keeping emergency cash reserves in the wallet is critical to protect daily tea shop cash flow.", score: 80 },
          B: { text: "Secure the discount! Spend the wallet reserves and count on high vegetable sales in the next few days to replenish.", score: 40 },
          C: { text: "Reach out to a trusted peer merchant in your bazaar to borrow the cash, securing the discount without emptying your reserves.", score: 100 },
          D: { text: "Avoid advances entirely and pay higher price on delivery.", score: 20 }
        },
        best_option: "C",
        is_active: true
      },
      {
        _id: "QST-00002",
        question_code: "QST-00002",
        question_text: "A customer who runs a local mobile repair shop asks for Rs. 5,000 worth of goods on informal bazaar credit (Udharo) without signing a formal ledger. How do you respond?",
        trait_measured: "HONESTY",
        options: {
          A: { text: "Decline informal request. Insist on recording the credit terms digitally in an app or physical ledger before handing over goods.", score: 100 },
          B: { text: "Provide it immediately. They are a close neighbor, and community networks require trusting their word with zero paperwork.", score: 30 },
          C: { text: "Agree to a smaller credit amount (Rs. 2,000 max) as a test of their creditworthiness, and set a strict repayment deadline.", score: 70 },
          D: { text: "Report them to bazaar committee for bad credit habits.", score: 10 }
        },
        best_option: "A",
        is_active: true
      },
      {
        _id: "QST-00003",
        question_code: "QST-00003",
        question_text: "Your monthly NEA electricity bill is issued, but you notice a minor error that will require visiting the local office to resolve. What is your action?",
        trait_measured: "PLANNING",
        options: {
          A: { text: "Pay the bill immediately via eSewa to preserve a clean on-time payment track, and resolve the dispute later.", score: 100 },
          B: { text: "Delay the payment until you visit the electricity office in person next week, even if it goes past the 5-day prompt reward window.", score: 50 },
          C: { text: "Ignore the bill entirely until they threaten connection cutoff, and focus cash flows on buying store stock.", score: 10 },
          D: { text: "Pay the bill and ignore the error to avoid bureaucratic hassle.", score: 70 }
        },
        best_option: "A",
        is_active: true
      },
      {
        _id: "QST-00004",
        question_code: "QST-00004",
        question_text: "You intend to buy a new commercial refrigerator for your snack store. How do you plan the funding?",
        trait_measured: "CONSCIENTIOUSNESS",
        options: {
          A: { text: "Accumulate incremental digital savings over 6 months in your wallet, showing steady growth before purchasing.", score: 100 },
          B: { text: "Take a high-interest local informal loan (Sahakari or local lender) to buy it today, hoping it increases sales instantly.", score: 30 },
          C: { text: "Apply for a digital, dynamic micro-credit loan using your verified transaction history, choosing a plan matched to your weekly volume.", score: 90 },
          D: { text: "Buy a cheap second-hand refrigerator with cash flow without thinking of warranty or efficiency.", score: 40 }
        },
        best_option: "A",
        is_active: true
      }
    ];
    await PsychometricQuestion.insertMany(psychometricQuestions);
    console.log("✓ Seeded 4 psychometric question scenarios!");

    // ==========================================
    // 4. ALL USERS ARE VERIFIED — NO FILTER NEEDED
    // ==========================================
    // Since all users are verified, these are just aliases for full arrays
    const verifiedUsers = usersData;         // all 100
    const verifiedMerchants = merchantsData; // all 50
    const verifiedCustomers = customersData; // all 70

    const merchantUsers = verifiedUsers.filter(u => u.user_type === "MERCHANT" || u.user_type === "BOTH");
    const customerUsers = verifiedUsers.filter(u => u.user_type === "CUSTOMER" || u.user_type === "BOTH");

    console.log(`All ${verifiedUsers.length} users verified. Seeding full ledgers for ${verifiedMerchants.length} merchants.`);

    // ==========================================
    // 5. GENERATE 5000 TRANSACTIONS
    // ==========================================
    console.log("Generating 5000 interconnected transaction records (400-day window)...");
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
        sender_id = customerUser._id;
        receiver_id = merchantUser._id;
        amount = randomInt(50, 4500);
        payment_channel = type === "QR_PAYMENT" ? "QR" : "WALLET";
      } else if (type === "SUPPLIER_PAYMENT") {
        sender_id = merchantUser._id;
        const wholesaler = pick(verifiedUsers);
        receiver_id = wholesaler._id;
        amount = randomInt(5000, 75000);
        payment_channel = "BANK_TRANSFER";
      } else if (type === "BILL_PAYMENT") {
        sender_id = merchantUser._id;
        const provider = pick(verifiedUsers);
        receiver_id = provider._id;
        amount = randomInt(400, 9500);
        payment_channel = "WALLET";
      } else if (type === "CASH_IN") {
        sender_id = merchantUser._id;
        receiver_id = merchantUser._id;
        amount = randomInt(2000, 50000);
        payment_channel = "BANK_TRANSFER";
      } else if (type === "CASH_OUT") {
        sender_id = merchantUser._id;
        receiver_id = merchantUser._id;
        amount = randomInt(2000, 40000);
        payment_channel = "BANK_TRANSFER";
      } else {
        // REFUND
        sender_id = merchantUser._id;
        receiver_id = customerUser._id;
        amount = randomInt(50, 1500);
        payment_channel = "WALLET";
      }

      const isSuccess = Math.random() > 0.03; // 97% success rate
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
    // 6. GENERATE WALLET ACTIVITIES
    // ==========================================
    console.log("Generating wallet ledger histories for all users...");
    let walletActCounter = 1;
    for (const user of verifiedUsers) {
      let balance = user.balance;
      const activities = randomInt(15, 40);

      for (let j = 0; j < activities; j++) {
        const type = pick(["PAYMENT_RECEIVED", "CASH_IN", "CASH_OUT", "SUPPLIER_PAYMENT", "BILL_PAYMENT", "LOAN_REPAYMENT", "REMITTANCE_RECEIVED"]);
        const amount = randomInt(300, 15000);

        if (type === "PAYMENT_RECEIVED" || type === "CASH_IN" || type === "REMITTANCE_RECEIVED") {
          balance += amount;
        } else {
          balance -= amount;
          if (balance < 0) balance = randomInt(1000, 5000);
        }

        walletActivitiesData.push({
          _id: `WAL-${String(walletActCounter).padStart(5, "0")}`,
          user_id: user._id,
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
    console.log(`✓ ${walletActivitiesData.length} Wallet Activities successfully seeded!`);

    // ==========================================
    // 7. GENERATE UTILITY PAYMENTS
    // ==========================================
    console.log("Generating utility payment timelines for all merchants...");
    let utilCounter = 1;
    for (const merchant of verifiedMerchants) {
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
          merchant_id: merchant._id,
          sender_id: merchant.user_id,
          bill_type: pick(["ELECTRICITY", "WATER", "INTERNET", "MOBILE_TOPUP", "REMITTANCE"]),
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
    console.log(`✓ ${utilityPaymentsData.length} Utility Payments successfully seeded!`);

    // ==========================================
    // 8. GENERATE LOAN APPLICATIONS & REPAYMENTS
    // ==========================================
    console.log("Generating loan applications and repayment schedules...");
    let loanCounter = 1;
    let repayCounter = 1;
    for (const merchant of verifiedMerchants) {
      // 80% have a loan history
      if (Math.random() > 0.8) continue;

      const requested = randomInt(5, 25) * 10000; // Rs. 50,000 to Rs. 250,000
      const status = pick(["PENDING", "APPROVED", "DISBURSED", "CLOSED", "REJECTED"]);
      const approved = (status === "APPROVED" || status === "DISBURSED" || status === "CLOSED")
        ? requested
        : 0;

      const loanId = `LON-${String(loanCounter).padStart(5, "0")}`;
      const loanApp = {
        _id: loanId,
        loan_application_code: loanId,
        merchant_id: merchant._id,
        requested_amount: requested,
        approved_amount: approved,
        loan_purpose: pick(["INVENTORY_PURCHASE", "SHOP_EXPANSION", "EQUIPMENT_PURCHASE", "WORKING_CAPITAL", "SEASONAL_STOCK", "EMERGENCY_BUSINESS_NEED"]),
        preferred_repayment_type: pick(["DAILY", "WEEKLY", "MONTHLY"]),
        application_status: status,
        applied_at: dateDaysAgo(randomInt(60, 180)),
        decided_at: dateDaysAgo(randomInt(30, 60))
      };
      loanApplicationsData.push(loanApp);

      if (status === "DISBURSED" || status === "CLOSED") {
        const installmentsCount = randomInt(3, 6);
        const eachDue = Math.round(approved / installmentsCount);

        for (let k = 1; k <= installmentsCount; k++) {
          const dueDate = new Date(loanApp.applied_at);
          dueDate.setDate(dueDate.getDate() + k * 30);

          let repaymentStatus = "PENDING";
          let paidAmount = 0;
          let paidDate: Date | undefined;
          let daysLate = 0;
          let mlDefault = 0;

          if (status === "CLOSED" || (status === "DISBURSED" && k < installmentsCount)) {
            const paidRoll = Math.random();
            if (paidRoll < 0.8) {
              repaymentStatus = "PAID_ON_TIME";
              paidDate = new Date(dueDate);
              paidDate.setDate(paidDate.getDate() - randomInt(0, 3));
            } else if (paidRoll < 0.95) {
              repaymentStatus = "PAID_LATE";
              daysLate = randomInt(1, 10);
              paidDate = new Date(dueDate);
              paidDate.setDate(paidDate.getDate() + daysLate);
            } else {
              repaymentStatus = "DEFAULT";
              daysLate = 45;
              mlDefault = 1;
            }
            paidAmount = eachDue;
          } else {
            repaymentStatus = "PENDING";
          }

          repaymentRecordsData.push({
            _id: `RPY-${String(repayCounter).padStart(6, "0")}`,
            repayment_code: `RPY-${String(repayCounter).padStart(6, "0")}`,
            loan_application_id: loanId,
            merchant_id: merchant._id,
            due_amount: eachDue,
            paid_amount: paidAmount,
            due_date: dueDate,
            paid_date: paidDate,
            repayment_status: repaymentStatus,
            days_late: daysLate,
            ml_target_default: mlDefault
          });
          repayCounter++;
        }
      }
      loanCounter++;
    }
    await LoanApplication.insertMany(loanApplicationsData);
    await RepaymentRecord.insertMany(repaymentRecordsData);
    console.log(`✓ ${loanApplicationsData.length} Loans & ${repaymentRecordsData.length} Repayments successfully seeded!`);

    // ==========================================
    // 9. GENERATE COMMUNITY SOCIAL TRUST EDGES
    // ==========================================
    console.log("Generating community trust graph edges...");
    let edgeCounter = 1;
    for (const merchant of verifiedMerchants) {
      const edgesCount = randomInt(2, 4);
      for (let j = 0; j < edgesCount; j++) {
        const targetType = pick(["CUSTOMER", "SUPPLIER", "MERCHANT"]);
        let targetId = "";

        if (targetType === "MERCHANT") {
          const otherMerchant = pick(verifiedMerchants.filter(m => m._id !== merchant._id));
          targetId = otherMerchant ? otherMerchant._id : merchant._id;
        } else if (targetType === "CUSTOMER") {
          const otherCustomer = pick(verifiedCustomers);
          targetId = otherCustomer ? otherCustomer._id : merchant._id;
        } else {
          targetId = `SPL-${String(randomInt(1, 10)).padStart(5, "0")}`;
        }

        if (targetId && targetId !== merchant._id) {
          socialEdgesData.push({
            _id: `EDG-${String(edgeCounter).padStart(5, "0")}`,
            source_merchant_id: merchant._id,
            target_entity_type: targetType,
            target_entity_id: targetId,
            relationship_type: pick(["REGULAR_CUSTOMER", "SUPPLIER", "GUARANTOR", "BUSINESS_REFERENCE", "B2B_COUNTERPARTY"]),
            trust_strength: randomInt(3, 10),
            transaction_count: randomInt(5, 120),
            total_transaction_value: randomInt(5000, 300000)
          });
          edgeCounter++;
        }
      }
    }
    await SocialEdge.insertMany(socialEdgesData);
    console.log(`✓ ${socialEdgesData.length} Social trust graph edges seeded!`);

    // ==========================================
    // 10. GENERATE PSYCHOMETRIC TEST ANSWERS
    // ==========================================
    console.log("Generating merchant psychometric answers...");
    let ansCounter = 1;
    for (const merchant of verifiedMerchants) {
      for (const q of psychometricQuestions) {
        const chosenOptKey = pick(["A", "B", "C"]) as "A" | "B" | "C";
        const chosenOpt = q.options[chosenOptKey];

        psychometricAnswersData.push({
          _id: `ANS-${String(ansCounter).padStart(5, "0")}`,
          merchant_id: merchant._id,
          question_id: q._id,
          selected_option: chosenOptKey,
          raw_score: chosenOpt.score,
          normalized_score: chosenOpt.score * 10,
          response_time_ms: randomInt(3000, 20000),
          consistency_flag: Math.random() > 0.15,
          answered_at: dateDaysAgo(randomInt(1, 30))
        });
        ansCounter++;
      }
    }
    await PsychometricAnswer.insertMany(psychometricAnswersData);
    console.log(`✓ ${psychometricAnswersData.length} Merchant answers stored!`);

    // ==========================================
    // 11. GENERATE ML FEATURES, PREDICTIONS, CREDIT SCORES
    // ==========================================
    console.log("Populating ML model outputs: features, predictions, SajiloScores...");
    let modelCounter = 1;
    for (const merchant of verifiedMerchants) {
      const merchantAnswers = psychometricAnswersData.filter(ans => ans.merchant_id === merchant._id);
      const psychometricAvg = merchantAnswers.length > 0
        ? merchantAnswers.reduce((a, b) => a + b.normalized_score, 0) / merchantAnswers.length
        : 700;

      const hasDefaults = repaymentRecordsData.some(r => r.merchant_id === merchant._id && r.ml_target_default === 1);
      const defaultProb = hasDefaults ? randomFloat(0.65, 0.95) : randomFloat(0.02, 0.28);
      const predictedClass = defaultProb > 0.5 ? "DEFAULT" : (defaultProb > 0.2 ? "LATE" : "GOOD");

      // A. Features
      merchantFeaturesData.push({
        _id: `FET-${String(modelCounter).padStart(5, "0")}`,
        merchant_id: merchant._id,
        features: {
          monthly_revenue_avg: randomInt(25000, 140000),
          active_days_ratio: randomFloat(0.4, 0.96),
          transaction_growth_rate: randomFloat(-0.25, 0.95),
          supplier_payment_ratio: randomFloat(0.3, 0.95),
          wallet_velocity_score: randomFloat(0.2, 0.9),
          transaction_gravity_score: randomFloat(0.3, 0.88),
          liquidity_buffer_score: randomFloat(0.1, 0.95),
          remittance_security_score: randomFloat(0.5, 0.99),
          airtime_consistency_score: randomFloat(0.4, 0.98),
          utility_calibration_score: randomFloat(0.35, 0.96),
          micro_obligation_score: randomFloat(0.25, 0.9),
          social_pagerank_score: randomFloat(0.1, 0.85),
          collusion_safety_score: randomFloat(0.6, 0.99),
          guarantor_health_score: randomFloat(0.4, 0.95),
          psychometric_avg: psychometricAvg,
          conscientiousness_score: psychometricAvg / 1000,
          risk_decision_consistency_score: randomFloat(0.5, 0.95),
          customer_diversity_score: randomFloat(0.3, 0.92),
          repeat_customer_ratio: randomFloat(0.2, 0.8),
          refund_rate: randomFloat(0.01, 0.08),
          failed_payment_rate: randomFloat(0.01, 0.12),
          cashout_speed_score: randomFloat(0.4, 0.95),
          loan_to_income_ratio: randomFloat(0.05, 0.45),
          suspicious_spike_score: randomFloat(0.01, 0.35),
          seasonal_pattern_score: randomFloat(0.2, 0.75),
          repayment_consistency_score: hasDefaults ? randomFloat(0.1, 0.45) : randomFloat(0.85, 0.99),
          repayment_plan_daily_fit: randomFloat(0.1, 0.9),
          repayment_plan_weekly_fit: randomFloat(0.2, 0.9),
          repayment_plan_seasonal_fit: randomFloat(0.1, 0.7)
        },
        ml_target: {
          repayment_outcome: predictedClass,
          default_probability_label: hasDefaults ? 1 : 0
        }
      });

      // B. Predictions
      modelPredictionsData.push({
        _id: `PRD-${String(modelCounter).padStart(5, "0")}`,
        merchant_id: merchant._id,
        model_version: "random_forest_v1.0",
        default_probability: defaultProb,
        repayment_probability: 1 - defaultProb,
        predicted_class: predictedClass,
        confidence: randomFloat(0.72, 0.98),
        top_features: [
          { feature_name: "repayment_consistency_score", contribution: -0.32 },
          { feature_name: "monthly_revenue_avg", contribution: 0.18 },
          { feature_name: "psychometric_avg", contribution: 0.15 }
        ],
        predicted_at: now
      });

      // C. Blended CreditScore
      const sajiloScore = Math.max(100, Math.min(1000, Math.round(
        (1 - defaultProb) * 750 + (psychometricAvg / 1000) * 250
      )));

      let riskBand = "BRONZE";
      let decision = "APPROVED";
      if (sajiloScore >= 850) { riskBand = "PLATINUM"; decision = "APPROVED"; }
      else if (sajiloScore >= 720) { riskBand = "GOLD"; decision = "APPROVED"; }
      else if (sajiloScore >= 580) { riskBand = "SILVER"; decision = "APPROVED"; }
      else if (sajiloScore >= 420) { riskBand = "BRONZE"; decision = "MICRO_CREDIT_ONLY"; }
      else { riskBand = "WATCH"; decision = "REJECTED"; }

      const parentUser = usersData.find(u => u._id === merchant.user_id);
      const accountAgeMonths = parentUser
        ? Math.ceil((now.getTime() - new Date(parentUser.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30))
        : 5;

      creditScoresData.push({
        _id: `SCR-${String(modelCounter).padStart(5, "0")}`,
        merchant_id: merchant._id,
        factor_scores: {
          f1_livelihood_rhythm: randomInt(120, 195),
          f2_cash_flow_elasticity: randomInt(110, 175),
          f3_smart_digital_footprint: randomInt(130, 215),
          f4_community_trust_graph: randomInt(100, 190),
          f5_psychometric: Math.round((psychometricAvg / 1000) * 200),
          fraud_penalty: hasDefaults ? 150 : 0
        },
        ml_scores: {
          ml_repayment_score: sajiloScore,
          default_probability: defaultProb,
          repayment_probability: 1 - defaultProb
        },
        final_sajilo_score: sajiloScore,
        risk_band: accountAgeMonths < 3 ? "THIN_FILE" : riskBand,
        decision,
        suggested_loan_amount: decision === "REJECTED" ? 0 : randomInt(20000, 150000),
        repayment_plan: pick(["DAILY", "WEEKLY", "MONTHLY"]),
        fraud_flags: hasDefaults ? ["LATE_REPAYMENT_SPIKE"] : [],
        explanation: `Blended Sajilo Bishwas credit index computed at ${sajiloScore} based on alternative metrics.`,
        calculated_at: now
      });

      modelCounter++;
    }
    await MerchantFeature.insertMany(merchantFeaturesData);
    await ModelPrediction.insertMany(modelPredictionsData);
    await CreditScore.insertMany(creditScoresData);
    console.log(`✓ Seeded ${merchantFeaturesData.length} Features, Predictions, and Sajilo Credit Scores!`);

    // ==========================================
    // 12. SEED ML TRAINING RUN DATA
    // ==========================================
    console.log("Seeding machine learning training runs...");
    const trainingRuns = [
      {
        _id: "RUN-00001",
        model_version: "random_forest_v1.0",
        algorithm: "RandomForest",
        training_records: 1250,
        feature_count: 29,
        metrics: {
          accuracy: 0.912,
          precision: 0.895,
          recall: 0.923,
          f1_score: 0.908,
          roc_auc: 0.945
        },
        artifact_path: "/opt/models/random_forest_v1.0.bin",
        trained_at: dateDaysAgo(30)
      },
      {
        _id: "RUN-00002",
        model_version: "xgboost_v1.1",
        algorithm: "XGBoost",
        training_records: 1420,
        feature_count: 29,
        metrics: {
          accuracy: 0.938,
          precision: 0.921,
          recall: 0.945,
          f1_score: 0.932,
          roc_auc: 0.968
        },
        artifact_path: "/opt/models/xgboost_v1.1.json",
        trained_at: dateDaysAgo(5)
      }
    ];
    await MLTrainingRun.insertMany(trainingRuns);
    console.log("✓ ML Training run logs populated successfully!");

    console.log("⭐ Database Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed with error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🍃 Database connection closed safely.");
  }
}

seed();