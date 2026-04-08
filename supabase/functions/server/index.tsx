import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Initialize Supabase client with service role key
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('Supabase URL:', supabaseUrl);
console.log('Service key available:', !!supabaseServiceKey);
console.log('Anon key available:', !!supabaseAnonKey);

// Enable CORS
app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

app.use("*", logger(console.log));

// Helper functions using KV store
async function getStorage(key: string) {
  return await kv.get(key);
}

async function setStorage(key: string, value: any) {
  return await kv.set(key, value);
}

async function getAllByPrefix(prefix: string) {
  return await kv.getByPrefix(prefix);
}

async function deleteStorage(key: string) {
  return await kv.del(key);
}

// Initialize admin user
const ADMIN_USER = {
  id: "admin-001",
  username: "edgeadmin",
  password: "Godson123",
  isAdmin: true,
  credits: 999999,
  name: "EDGE Admin",
  email: "admin@edge.com",
  status: "active" as const,
};

// Initialize admin user in KV store on startup
(async () => {
  try {
    await setStorage("user:admin-001", ADMIN_USER);
    console.log("Server initialized. Admin user created:", ADMIN_USER.username);

    // Initialize default invite codes if they don't exist
    const existingCodes = await getStorage('invite-codes');
    if (!existingCodes) {
      await setStorage('invite-codes', ['EDGE2026', 'EDGE100', 'EDGE3000']);
      console.log('Initialized default invite codes: EDGE2026, EDGE100, EDGE3000');
    }
  } catch (error) {
    console.error("Failed to initialize server:", error);
  }
})();

// AUTH ROUTES
app.post("/make-server-037031d9/auth/register", async (c) => {
  try {
    const userData = await c.req.json();

    console.log(`Registration attempt for email: ${userData.email}, username: ${userData.username}`);

    // Validate required fields (email is now optional)
    if (!userData.username || !userData.password) {
      console.error('Missing required fields:', {
        hasUsername: !!userData.username,
        hasPassword: !!userData.password
      });
      return c.json({
        success: false,
        error: "Username and password are required"
      }, 400);
    }

    // If email is provided, validate format
    if (userData.email && userData.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        console.error('Invalid email format:', userData.email);
        return c.json({
          success: false,
          error: "Please provide a valid email address"
        }, 400);
      }
    }

    // Check if username already exists
    const existingUsers = await getAllByPrefix("user:");
    const usernameExists = existingUsers.some((u) => u.username === userData.username);

    if (usernameExists) {
      console.log(`Registration failed: Username ${userData.username} already exists`);
      return c.json({ success: false, error: "Username already exists" }, 400);
    }

    // Generate email from username if not provided or empty
    const userEmail = (userData.email && userData.email.trim() !== '')
      ? userData.email
      : `${userData.username}@edge-platform.local`;

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userEmail,
      password: userData.password,
      user_metadata: {
        username: userData.username,
        name: userData.name || '',
        purpose: userData.purpose || ''
      },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (authError) {
      console.error('Supabase Auth error:', authError);
      return c.json({ success: false, error: authError.message }, 400);
    }

    console.log('Supabase user created:', authData.user?.id);

    // Store additional user data in KV store
    const userId = authData.user!.id;
    const user = {
      id: userId,
      username: userData.username,
      email: userData.email || '',
      name: userData.name || '',
      purpose: userData.purpose || '',
      selectedPlan: userData.selectedPlan || '',
      planName: userData.planName || '',
      planPrice: userData.planPrice || '',
      planCredits: userData.planCredits || 0,
      isAdmin: false,
      credits: 0,
      status: "pending",
    };
    await setStorage(`user:${userId}`, user);

    console.log(`User registered successfully: ${user.username} (${userId})`);
    return c.json({ success: true, user });
  } catch (error) {
    console.error("Registration error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post("/make-server-037031d9/auth/login", async (c) => {
  try {
    const { username, password, email } = await c.req.json();

    console.log(`Login attempt for username: ${username}, email: ${email}`);

    // Check admin
    if (username === ADMIN_USER.username && password === ADMIN_USER.password) {
      console.log("Admin login successful");
      return c.json({ success: true, user: ADMIN_USER });
    }

    // Find user by username to get email
    let userEmail = email;
    if (!userEmail && username) {
      const users = await getAllByPrefix("user:");
      const foundUser = users.find((u) => u.username === username);
      if (foundUser) {
        userEmail = foundUser.email;
      }
    }

    if (!userEmail) {
      console.log(`Login failed: Could not find email for username ${username}`);
      return c.json({ success: false, error: "Invalid credentials" }, 401);
    }

    // Authenticate with Supabase Auth using email
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: password,
    });

    if (authError) {
      console.error('Supabase Auth error:', authError);
      return c.json({ success: false, error: "Invalid credentials" }, 401);
    }

    console.log('Supabase authentication successful:', authData.user?.id);

    // Get user data from KV store
    const user = await getStorage(`user:${authData.user!.id}`);

    if (user) {
      console.log(`User login successful: ${user.username}`);
      return c.json({
        success: true,
        user,
        session: authData.session
      });
    }

    console.log(`Login failed: User data not found in storage for ${authData.user!.id}`);
    return c.json({ success: false, error: "User data not found" }, 404);
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.get("/make-server-037031d9/auth/user/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const user = await getStorage(`user:${userId}`);
    if (user) {
      return c.json(user);
    }
    return c.json({ error: "User not found" }, 404);
  } catch (error) {
    console.error("Get user error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.put("/make-server-037031d9/auth/user/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const updates = await c.req.json();
    const user = await getStorage(`user:${userId}`);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    const updatedUser = { ...user, ...updates };
    await setStorage(`user:${userId}`, updatedUser);
    return c.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Update user error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.get("/make-server-037031d9/auth/users", async (c) => {
  try {
    const users = await getAllByPrefix("user:");
    return c.json(users);
  } catch (error) {
    console.error("Get all users error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Admin: Edit user details (including email/password in Supabase Auth)
app.put("/make-server-037031d9/admin/user/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const updates = await c.req.json();
    const user = await getStorage(`user:${userId}`);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Update Supabase Auth if email or password is being changed
    if (updates.email || updates.password) {
      const authUpdates: any = {};
      if (updates.email) authUpdates.email = updates.email;
      if (updates.password) authUpdates.password = updates.password;

      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        authUpdates
      );

      if (authError) {
        console.error('Supabase Auth update error:', authError);
        return c.json({ success: false, error: authError.message }, 400);
      }
    }

    // Update KV store
    const updatedUser = { ...user, ...updates };
    // Don't store password in KV
    delete updatedUser.password;
    await setStorage(`user:${userId}`, updatedUser);

    return c.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Admin update user error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Admin: Delete user
app.delete("/make-server-037031d9/admin/user/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");

    // Delete from Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) {
      console.error('Supabase Auth delete error:', authError);
      // Continue even if auth delete fails - user might not exist in auth
    }

    // Delete from KV store
    await deleteStorage(`user:${userId}`);

    // Delete related data
    const notifications = await getAllByPrefix(`notification:${userId}:`);
    for (const notif of notifications) {
      await deleteStorage(`notification:${userId}:${notif.id}`);
    }

    const purchases = await getAllByPrefix(`purchase:${userId}:`);
    for (const purchase of purchases) {
      await deleteStorage(`purchase:${userId}:${purchase.id}`);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// WITHDRAWAL ROUTES
app.post("/make-server-037031d9/withdrawals", async (c) => {
  try {
    const withdrawalData = await c.req.json();
    const withdrawalId = `withdrawal-${Date.now()}`;
    const withdrawal = {
      ...withdrawalData,
      id: withdrawalId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setStorage(`withdrawal:${withdrawalId}`, withdrawal);
    return c.json({ success: true, withdrawal });
  } catch (error) {
    console.error("Create withdrawal error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.get("/make-server-037031d9/withdrawals", async (c) => {
  try {
    const userId = c.req.query("userId");
    const withdrawals = await getAllByPrefix("withdrawal:");

    if (userId) {
      return c.json(withdrawals.filter((w) => w.userId === userId));
    }

    return c.json(withdrawals);
  } catch (error) {
    console.error("Get withdrawals error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.put("/make-server-037031d9/withdrawals/:withdrawalId", async (c) => {
  try {
    const withdrawalId = c.req.param("withdrawalId");
    const updates = await c.req.json();
    const withdrawal = await getStorage(`withdrawal:${withdrawalId}`);

    if (!withdrawal) {
      return c.json({ error: "Withdrawal not found" }, 404);
    }

    const updatedWithdrawal = {
      ...withdrawal,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await setStorage(`withdrawal:${withdrawalId}`, updatedWithdrawal);
    return c.json({ success: true, withdrawal: updatedWithdrawal });
  } catch (error) {
    console.error("Update withdrawal error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// REQUEST ROUTES
app.post("/make-server-037031d9/requests", async (c) => {
  try {
    const requestData = await c.req.json();
    const requestId = `request-${Date.now()}`;
    const request = {
      ...requestData,
      id: requestId,
      createdAt: new Date().toISOString(),
      messages: [],
    };
    await setStorage(`request:${requestId}`, request);
    return c.json({ success: true, request });
  } catch (error) {
    console.error("Create request error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.get("/make-server-037031d9/requests", async (c) => {
  try {
    const userId = c.req.query("userId");
    const requests = await getAllByPrefix("request:");

    if (userId) {
      return c.json(requests.filter((r) => r.userId === userId));
    }

    return c.json(requests);
  } catch (error) {
    console.error("Get requests error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.put("/make-server-037031d9/requests/:requestId", async (c) => {
  try {
    const requestId = c.req.param("requestId");
    const updates = await c.req.json();
    const request = await getStorage(`request:${requestId}`);

    if (!request) {
      return c.json({ error: "Request not found" }, 404);
    }

    const updatedRequest = { ...request, ...updates };
    await setStorage(`request:${requestId}`, updatedRequest);
    return c.json({ success: true, request: updatedRequest });
  } catch (error) {
    console.error("Update request error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-037031d9/requests/:requestId/message", async (c) => {
  try {
    const requestId = c.req.param("requestId");
    const { message, from, userId } = await c.req.json();
    const request = await getStorage(`request:${requestId}`);

    if (!request) {
      return c.json({ error: "Request not found" }, 404);
    }

    const newMessage = {
      id: `msg-${Date.now()}`,
      text: message,
      from,
      timestamp: new Date().toISOString(),
    };

    request.messages = [...(request.messages || []), newMessage];
    await setStorage(`request:${requestId}`, request);

    // Create notification for user
    if (from === "admin" && userId) {
      const notificationId = `notification-${Date.now()}`;
      const notification = {
        id: notificationId,
        userId,
        type: "message",
        title: "New Message",
        message: `Admin replied to your request: ${request.businessName || "Request"}`,
        requestId,
        createdAt: new Date().toISOString(),
        read: false,
      };
      await setStorage(`notification:${userId}:${notificationId}`, notification);
    }

    return c.json({ success: true, request });
  } catch (error) {
    console.error("Add message error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// NOTIFICATION ROUTES
app.post("/make-server-037031d9/notifications", async (c) => {
  try {
    const notificationData = await c.req.json();

    if (notificationData.broadcast) {
      // Send to all users
      const allUsers = await getAllByPrefix("user:");
      const users = allUsers.filter((u) => !u.isAdmin);
      let count = 0;

      for (const user of users) {
        const notificationId = `notification-${Date.now()}-${count}`;
        const notification = {
          id: notificationId,
          userId: user.id,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          createdAt: new Date().toISOString(),
          read: false,
        };
        await setStorage(`notification:${user.id}:${notificationId}`, notification);
        count++;
      }

      return c.json({ success: true, sent: count });
    } else {
      // Send to specific user
      const notificationId = `notification-${Date.now()}`;
      const notification = {
        id: notificationId,
        ...notificationData,
        createdAt: new Date().toISOString(),
        read: false,
      };
      await setStorage(`notification:${notificationData.userId}:${notificationId}`, notification);
      return c.json({ success: true, notification });
    }
  } catch (error) {
    console.error("Create notification error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.get("/make-server-037031d9/notifications/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const notifications = await getAllByPrefix(`notification:${userId}:`);
    return c.json(notifications);
  } catch (error) {
    console.error("Get notifications error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.delete("/make-server-037031d9/notifications/:userId/:notificationId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const notificationId = c.req.param("notificationId");
    await deleteStorage(`notification:${userId}:${notificationId}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Delete notification error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// STORE ROUTES
app.post("/make-server-037031d9/store/products", async (c) => {
  try {
    const productData = await c.req.json();
    const productId = `store-product-${Date.now()}`;
    const product = {
      ...productData,
      id: productId,
      type: "store",
    };
    await setStorage(`store-product:${productId}`, product);
    return c.json({ success: true, product });
  } catch (error) {
    console.error("Add store product error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.get("/make-server-037031d9/store/products", async (c) => {
  try {
    const products = await getAllByPrefix("store-product:");
    return c.json(products);
  } catch (error) {
    console.error("Get store products error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.delete("/make-server-037031d9/store/products/:productId", async (c) => {
  try {
    const productId = c.req.param("productId");
    await deleteStorage(`store-product:${productId}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Delete store product error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-037031d9/store/purchase", async (c) => {
  try {
    const { userId, productId } = await c.req.json();
    const purchaseId = `purchase-${Date.now()}`;
    const purchase = {
      id: purchaseId,
      userId,
      productId,
      purchasedAt: new Date().toISOString(),
    };
    await setStorage(`purchase:${userId}:${purchaseId}`, purchase);
    return c.json({ success: true, purchase });
  } catch (error) {
    console.error("Purchase error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.get("/make-server-037031d9/store/purchases/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const purchases = await getAllByPrefix(`purchase:${userId}:`);
    return c.json(purchases);
  } catch (error) {
    console.error("Get purchases error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// MARKETPLACE ROUTES
app.get("/make-server-037031d9/marketplace/seller/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const seller = await getStorage(`seller:${userId}`);
    return c.json({ isSeller: !!seller, seller });
  } catch (error) {
    console.error("Check seller error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-037031d9/marketplace/seller", async (c) => {
  try {
    const { userId } = await c.req.json();
    const seller = {
      userId,
      activatedAt: new Date().toISOString(),
      totalSales: 0,
      totalEarnings: 0,
    };
    await setStorage(`seller:${userId}`, seller);
    return c.json({ success: true, seller });
  } catch (error) {
    console.error("Activate seller error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-037031d9/marketplace/products", async (c) => {
  try {
    const productData = await c.req.json();
    const productId = `marketplace-product-${Date.now()}`;
    const product = {
      ...productData,
      id: productId,
      type: "marketplace",
      createdAt: new Date().toISOString(),
    };
    await setStorage(`marketplace-product:${productId}`, product);
    return c.json({ success: true, product });
  } catch (error) {
    console.error("Add marketplace product error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.get("/make-server-037031d9/marketplace/products", async (c) => {
  try {
    const userId = c.req.query("userId");
    const products = await getAllByPrefix("marketplace-product:");

    if (userId) {
      return c.json(products.filter((p) => p.sellerId === userId));
    }

    return c.json(products);
  } catch (error) {
    console.error("Get marketplace products error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.delete("/make-server-037031d9/marketplace/products/:productId", async (c) => {
  try {
    const productId = c.req.param("productId");
    const { userId } = await c.req.json();
    const product = await getStorage(`marketplace-product:${productId}`);

    if (!product || product.sellerId !== userId) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    await deleteStorage(`marketplace-product:${productId}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Delete marketplace product error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-037031d9/marketplace/purchase", async (c) => {
  try {
    const { buyerId, productId } = await c.req.json();
    const product = await getStorage(`marketplace-product:${productId}`);

    if (!product) {
      return c.json({ error: "Product not found" }, 404);
    }

    const purchaseId = `marketplace-purchase-${Date.now()}`;
    const purchase = {
      id: purchaseId,
      buyerId,
      productId,
      sellerId: product.sellerId,
      price: product.price,
      purchasedAt: new Date().toISOString(),
    };
    await setStorage(`marketplace-purchase:${buyerId}:${purchaseId}`, purchase);

    // Update seller stats
    const seller = await getStorage(`seller:${product.sellerId}`);
    if (seller) {
      seller.totalSales += 1;
      seller.totalEarnings += product.price;
      await setStorage(`seller:${product.sellerId}`, seller);
    }

    return c.json({ success: true, purchase });
  } catch (error) {
    console.error("Marketplace purchase error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.get("/make-server-037031d9/marketplace/profile/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const seller = await getStorage(`seller:${userId}`);

    if (!seller) {
      return c.json({ error: "Seller not found" }, 404);
    }

    return c.json(seller);
  } catch (error) {
    console.error("Get seller profile error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.get("/make-server-037031d9/marketplace/check-seller/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const seller = await getStorage(`seller:${userId}`);

    if (!seller) {
      return c.json({ isSeller: false });
    }

    return c.json({ isSeller: true, seller });
  } catch (error) {
    console.error("Check seller error:", error);
    return c.json({ isSeller: false, error: error.message }, 500);
  }
});

// PAYMENT SETTINGS ROUTES
app.get("/make-server-037031d9/payment/settings", async (c) => {
  try {
    const settings = await getStorage("payment-settings") || {
      stripeEnabled: false,
      paypalEnabled: false,
      cryptoEnabled: false,
    };
    return c.json(settings);
  } catch (error) {
    console.error("Get payment settings error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.put("/make-server-037031d9/payment/settings", async (c) => {
  try {
    const settings = await c.req.json();
    await setStorage("payment-settings", settings);
    return c.json({ success: true, settings });
  } catch (error) {
    console.error("Update payment settings error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// INVITE CODE ROUTES
app.get("/make-server-037031d9/invite/codes", async (c) => {
  try {
    const codes = await getStorage('invite-codes') || ['EDGE2026', 'EDGE100', 'EDGE3000'];
    return c.json({ codes });
  } catch (error) {
    console.error("Get invite codes error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-037031d9/invite/codes", async (c) => {
  try {
    const { code } = await c.req.json();
    const codes = await getStorage('invite-codes') || [];

    if (!codes.includes(code)) {
      codes.push(code);
      await setStorage('invite-codes', codes);
    }

    return c.json({ success: true, codes });
  } catch (error) {
    console.error("Add invite code error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.delete("/make-server-037031d9/invite/codes/:code", async (c) => {
  try {
    const code = c.req.param("code");
    const codes = await getStorage('invite-codes') || [];
    const updatedCodes = codes.filter((c: string) => c !== code);
    await setStorage('invite-codes', updatedCodes);
    return c.json({ success: true, codes: updatedCodes });
  } catch (error) {
    console.error("Delete invite code error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-037031d9/invite/validate", async (c) => {
  try {
    const { code } = await c.req.json();
    const codes = await getStorage('invite-codes') || ['EDGE2026', 'EDGE100', 'EDGE3000'];
    const isValid = codes.includes(code);
    return c.json({ valid: isValid });
  } catch (error) {
    console.error("Validate invite code error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// FILE UPLOAD ROUTE (Supabase Storage)
app.post("/make-server-037031d9/upload", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const bucket = (formData.get('bucket') as string) || 'uploads';

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomStr}.${fileExt}`;
    const filePath = `${bucket}/${fileName}`;

    // Convert File to ArrayBuffer
    const fileBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(fileBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, uint8Array, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('Supabase Storage error:', error);
      return c.json({ error: error.message }, 500);
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return c.json({
      success: true,
      url: publicUrl,
      fileName: fileName,
      filePath: filePath
    });
  } catch (error) {
    console.error("File upload error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Health check
app.get("/make-server-037031d9/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Test Supabase connection
app.get("/make-server-037031d9/test-supabase", async (c) => {
  try {
    const { data, error } = await supabase.auth.getSession();
    return c.json({
      success: true,
      supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasAnonKey: !!supabaseAnonKey,
      sessionError: error?.message || null,
      message: 'Supabase connection successful'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error.message,
      supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasAnonKey: !!supabaseAnonKey,
    }, 500);
  }
});

serve(app.fetch);
