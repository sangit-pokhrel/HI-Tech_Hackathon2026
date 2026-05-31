import { Elysia, t } from "elysia";
import { User } from "../db/schema";

export const authRoutes = new Elysia({ prefix: "/api/auth" })
  // Inject global JWT instance to allow route handler to call sign/verify
  .post("/register", async ({ body, set, jwt }: any) => {
    try {
      const { name, phone, email, password, user_type, location } = body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ phone }, { email }],
      });

      if (existingUser) {
        set.status = 400;
        return {
          success: false,
          message: "A user with this email or phone number already exists",
        };
      }

      // Generate a new custom USR ID
      const count = await User.countDocuments();
      const userId = `USR-${String(count + 1).padStart(5, "0")}`;

      const newUser = new User({
        _id: userId,
        user_code: userId,
        name,
        phone,
        email,
        password, // Pre-save hook hashes this
        user_type: user_type || "CUSTOMER",
        location: location || {
          province: "Bagmati",
          district: "Kathmandu",
          municipality: "Kathmandu Metropolitan City",
          ward_no: 1,
        },
        verified_status: "verified", // Auto-verify in demo
        balance: 1000,
        is_active: true,
      });

      const savedUser = await newUser.save();
      
      // Remove password before returning
      const userObj = savedUser.toObject();
      delete userObj.password;

      // Sign JWT
      const token = await jwt.sign({
        id: savedUser._id,
        email: savedUser.email,
        name: savedUser.name,
        user_type: savedUser.user_type,
      });

      set.status = 201;
      return {
        success: true,
        message: "User registered successfully",
        token,
        user: userObj,
      };
    } catch (error: any) {
      set.status = 400;
      return {
        success: false,
        message: error.message || "Failed to register user",
      };
    }
  }, {
    body: t.Object({
      name: t.String({ minLength: 1 }),
      phone: t.String({ minLength: 1 }),
      email: t.String({ format: "email" }),
      password: t.String({ minLength: 6 }),
      user_type: t.Optional(t.String()),
      location: t.Optional(t.Object({
        province: t.Optional(t.String()),
        district: t.String(),
        municipality: t.String(),
        ward_no: t.Numeric(),
      })),
    })
  })
  .post("/login", async ({ body, set, jwt }: any) => {
    try {
      const { email, password } = body;

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        set.status = 401;
        return {
          success: false,
          message: "Invalid email or password",
        };
      }

      // Verify password
      const isPasswordValid = Bun.password.verifySync(password, user.password || "");
      if (!isPasswordValid) {
        set.status = 401;
        return {
          success: false,
          message: "Invalid email or password",
        };
      }

      // Sign JWT
      const token = await jwt.sign({
        id: user._id,
        email: user.email,
        name: user.name,
        user_type: user.user_type,
      });

      const userObj = user.toObject();
      delete userObj.password;

      return {
        success: true,
        message: "Login successful",
        token,
        user: userObj,
      };
    } catch (error: any) {
      set.status = 400;
      return {
        success: false,
        message: error.message || "Failed to log in",
      };
    }
  }, {
    body: t.Object({
      email: t.String({ format: "email" }),
      password: t.String({ minLength: 1 }),
    })
  });
