import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { Xslt, XmlParser } from "xslt-processor";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { Server as SocketIOServer } from "socket.io";
import "dotenv/config";

const app = express();
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: "*" }
});

// Socket.io Admin & User Session Management
const activeUsers = new Map<string, { id: string, name: string, avatar: string, unread: number }>();

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join-user", (user: { id: string, name: string, avatar?: string }) => {
    socket.join(user.id);
    activeUsers.set(user.id, { id: user.id, name: user.name, avatar: user.avatar || '', unread: 0 });
    io.to("admins").emit("active-users", Array.from(activeUsers.values()));
  });

  socket.on("join-admin", () => {
    socket.join("admins");
    socket.emit("active-users", Array.from(activeUsers.values()));
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// Safe write helper for Vercel's read-only filesystem
function safeWriteXML(filePath: string, data: string) {
  try {
    fs.writeFileSync(filePath, data);
  } catch (err: any) {
    if (err.code === 'EROFS') {
      console.warn(`[Vercel] Ignored write to read-only filesystem: ${filePath}`);
    } else {
      console.error(`[FS] Write error for ${filePath}:`, err.message);
    }
  }
}

// Initialize Supabase (Server-side)
  const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
  
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log("Supabase Service Role Key detected. Bypassing RLS for server-side logic.");
  }

  let supabase: any = null;
  if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder')) {
    // Clean URL
    let cleanUrl = supabaseUrl.trim();
    if (cleanUrl.includes('/rest/v1')) {
      cleanUrl = cleanUrl.split('/rest/v1')[0];
    }
    cleanUrl = cleanUrl.replace(/\/$/, '');
    
    supabase = createClient(cleanUrl, supabaseKey.trim());
    console.log("Supabase Server Client Initialized.");
  } else {
    console.warn("Supabase credentials missing on server. Wishlist persistence will be disabled.");
  }

  // Initialize Gemini
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('your_key_here')) {
    console.error("CRITICAL: GEMINI_API_KEY is missing or using placeholder in .env file!");
    console.error("AI features will be disabled until a valid key is provided.");
  } else {
    console.log("Gemini AI Initialized successfully.");
  }

  const ai = new GoogleGenAI({
    apiKey: apiKey || "dummy-key",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Debug middleware to log all API calls
  app.use("/api", (req, res, next) => {
    console.log(`[Backend] ${req.method} ${req.url}`);
    next();
  });

  const DATA_PATH = path.join(process.cwd(), "data");

  // API: Get Fleet from XML
  app.get("/api/fleet", (req, res) => {
    console.log("[API] GET /api/fleet");
    try {
      const xmlStr = fs.readFileSync(path.join(DATA_PATH, "fleet.xml"), "utf-8");
      const doc = new DOMParser().parseFromString(xmlStr, "text/xml");
      const carsNode = doc.getElementsByTagName("car");
      const cars = [];
      for (let i = 0; i < carsNode.length; i++) {
        const car = carsNode[i];
        cars.push({
          id: car.getElementsByTagName("id")[0].textContent,
          name: car.getElementsByTagName("name")[0].textContent,
          type: car.getElementsByTagName("type")[0].textContent,
          powertrain: car.getElementsByTagName("powertrain")[0]?.textContent || "Gasoline",
          price: car.getElementsByTagName("price")[0].textContent,
          features: car.getElementsByTagName("features")[0]?.textContent || "",
          specifications: {
            engine: car.getElementsByTagName("engine")[0]?.textContent || "N/A",
            safety: car.getElementsByTagName("safety")[0]?.textContent || "N/A",
            fuelEconomy: car.getElementsByTagName("fuelEconomy")[0]?.textContent || "N/A",
          },
          image: car.getElementsByTagName("image")[0].textContent,
          status: car.getElementsByTagName("status")[0].textContent,
        });
      }
      res.json(cars);
    } catch (error) {
      res.status(500).json({ error: "Failed to parse fleet XML" });
    }
  });

  // API: Get Locations from XML
  app.get("/api/locations", (req, res) => {
    try {
      const xmlStr = fs.readFileSync(path.join(DATA_PATH, "locations.xml"), "utf-8");
      const doc = new DOMParser().parseFromString(xmlStr, "text/xml");
      const hubsNode = doc.getElementsByTagName("hub");
      const hubs = [];
      for (let i = 0; i < hubsNode.length; i++) {
        const hub = hubsNode[i];
        hubs.push({
          id: hub.getElementsByTagName("id")[0].textContent,
          city: hub.getElementsByTagName("city")[0].textContent,
          country: hub.getElementsByTagName("country")[0].textContent,
          address: hub.getElementsByTagName("address")[0].textContent,
          type: hub.getElementsByTagName("type")[0].textContent,
          lat: parseFloat(hub.getElementsByTagName("lat")[0]?.textContent || "0"),
          lng: parseFloat(hub.getElementsByTagName("lng")[0]?.textContent || "0"),
        });
      }
      res.json(hubs);
    } catch (error) {
      res.status(500).json({ error: "Failed to parse locations XML" });
    }
  });

  // API: Send Message (Kafka Simulation)
  const messageQueue: any[] = [];
  console.log("Notification Consumer Started.");
  
  // Simulation: Background Consumer Loop
  setInterval(() => {
    if (messageQueue.length > 0) {
      const msg = messageQueue.shift();
      console.log(`[Kafka-Consumer] Message processed offset ${Date.now()}`);
      
      try {
        const filePath = path.join(DATA_PATH, "messages.xml");
        let xmlStr = fs.readFileSync(filePath, "utf-8");
        if (!xmlStr || xmlStr.trim() === "") xmlStr = '<?xml version="1.0" encoding="UTF-8"?><messages></messages>';
        const doc = new DOMParser().parseFromString(xmlStr, "text/xml");
        const root = doc.getElementsByTagName("messages")[0];
        
        const msgNode = doc.createElement("message");
        
        const createChild = (name: string, text: string) => {
          const node = doc.createElement(name);
          node.appendChild(doc.createTextNode(text));
          return node;
        };
        
        msgNode.appendChild(createChild("senderName", msg.senderName));
        msgNode.appendChild(createChild("senderRole", msg.senderRole));
        msgNode.appendChild(createChild("text", msg.text));
        msgNode.appendChild(createChild("userId", msg.userId || ""));
        msgNode.appendChild(createChild("timestamp", new Date().toLocaleTimeString()));
        
        root.appendChild(msgNode);
        
        const serialized = new XMLSerializer().serializeToString(doc);
        safeWriteXML(filePath, serialized);
        
        // Socket.io Broadcast
        const messagePayload = {
          senderName: msg.senderName,
          senderRole: msg.senderRole,
          text: msg.text,
          userId: msg.userId,
          timestamp: new Date().toLocaleTimeString()
        };
        
        // Send to Admins
        io.to("admins").emit("new-message", messagePayload);
        // Send back to the user room
        if (msg.userId) {
          io.to(msg.userId).emit("new-message", messagePayload);
        }

      } catch (err) {
        console.error("Failed to update messages XML", err);
      }
    }
  }, 1000);

  app.post("/api/messages", (req, res) => {
    const { senderName, senderRole, text, userId } = req.body;
    console.log(`[Kafka-Producer] Message produced: ${text} for user ${userId}`);
    messageQueue.push({ senderName, senderRole, text, userId });
    res.json({ status: "queued", offset: Date.now() });
  });

  // Helper to get a Supabase client (global or scoped by user token)
  const getSupabaseClient = (params: { authHeader?: string | null, token?: string | null }) => {
    if (!supabaseUrl || !supabaseKey) return null;
    
    const cleanUrl = supabaseUrl.trim().split('/rest/v1')[0].replace(/\/$/, '');

    // Priority 1: Service Role Key (Bypass RLS)
    // If we have service role, we use the global admin 'supabase' client already initialized
    if (process.env.SUPABASE_SERVICE_ROLE_KEY && supabase) {
      return supabase;
    }

    // Priority 2: Scoped User Client (Satisfy RLS)
    const token = params.token || (params.authHeader?.startsWith('Bearer ') ? params.authHeader.split(' ')[1] : null);
    
    if (token && token !== 'undefined' && token !== 'null') {
      try {
        return createClient(cleanUrl, process.env.VITE_SUPABASE_ANON_KEY || '', {
          global: { headers: { Authorization: `Bearer ${token}` } }
        });
      } catch (e) {
        console.warn("[Supabase] Scoped client creation failed, using default.");
      }
    }

    return supabase;
  };

  // --- RENTALS SYSTEM (PROXY) ---
  app.post("/api/my-rentals", async (req, res) => {
    if (!supabase) return res.status(503).json({ error: "Supabase not configured on server" });
    
    // We use POST instead of GET to avoid 431 Header/URI limits for large tokens
    const { userId, _token } = req.body;
    const authHeader = req.headers.authorization;
    
    try {
      const client = getSupabaseClient({ authHeader, token: _token });
      if (!client) throw new Error("Could not initialize database client.");

      let { data, error } = await client
        .from('rentals')
        .select('*')
        .eq('user_id', userId);
      
      // If Cloudflare/Supabase proxy rejected it due to massive JWT header (431/413)
      if (error && (error.status === 413 || error.status === 431) && _token) {
        console.warn("[Backend] JWT token was too large. Retrying fetch with Anon key...");
        const fallbackClient = getSupabaseClient({ authHeader: null, token: null });
        if (fallbackClient) {
          const fallbackResponse = await fallbackClient.from('rentals').select('*').eq('user_id', userId);
          data = fallbackResponse.data;
          error = fallbackResponse.error;
        }
      }

      if (error) {
        const errMsg = typeof error.message === 'string' && error.message.includes('<!DOCTYPE') 
          ? "Supabase Infrastructure Error (520)" 
          : error.message;
        return res.status(error.status || 400).json({ error: errMsg, details: error });
      }
      
      res.json(data || []);
    } catch (err: any) {
      console.error("Rentals Fetch Exception:", err.message);
      res.status(500).json({ error: "Failed to fetch records. Check Supabase RLS policies." });
    }
  });

  app.post("/api/rentals", async (req, res) => {
    if (!supabase) return res.status(503).json({ error: "Supabase not configured on server" });
    
    const { _token, ...rentalData } = req.body;
    const authHeader = req.headers.authorization;
    
    try {
      const client = getSupabaseClient({ authHeader, token: _token });
      if (!client) throw new Error("Could not initialize database client.");

      const postPayload = { ...rentalData, created_at: new Date().toISOString() };

      let { data, error } = await client
        .from('rentals')
        .insert(postPayload)
        .select();
      
      // If Cloudflare/Supabase proxy rejected it due to massive JWT header (431/413)
      if (error && (error.status === 413 || error.status === 431) && _token) {
        console.warn("[Backend] JWT token was too large. Retrying insert with Anon key...");
        const fallbackClient = getSupabaseClient({ authHeader: null, token: null });
        if (fallbackClient) {
          const fallbackResponse = await fallbackClient.from('rentals').insert(postPayload).select();
          data = fallbackResponse.data;
          error = fallbackResponse.error;
        }
      }

      if (error) {
        const errMsg = typeof error.message === 'string' && error.message.includes('<!DOCTYPE') 
          ? "Supabase Infrastructure Error (520)" 
          : error.message;
        return res.status(error.status || 400).json({ error: errMsg, details: error });
      }
      
      res.json({ status: "ok", data });
    } catch (err: any) {
      console.error("Rentals Insert Exception:", err.message);
      res.status(500).json({ error: "Failed to save record. Check Supabase RLS policies." });
    }
  });

  app.post("/api/admin/rentals", async (req, res) => {
    if (!supabase) return res.status(503).json({ error: "Supabase not configured on server" });
    
    // We expect the admin to be making this request
    const fallbackClient = getSupabaseClient({ authHeader: null, token: null });
    if (!fallbackClient) return res.status(500).json({ error: "Could not initialize database client." });

    try {
      const { data, error } = await fallbackClient
        .from('rentals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      console.error("Admin Rentals Fetch Exception:", err.message);
      res.status(500).json({ error: "Failed to fetch records. Check Supabase RLS policies." });
    }
  });

  app.post("/api/admin/rentals/update", async (req, res) => {
    if (!supabase) return res.status(503).json({ error: "Supabase not configured on server" });
    const { rental_id, status } = req.body;
    
    const fallbackClient = getSupabaseClient({ authHeader: null, token: null });
    if (!fallbackClient) return res.status(500).json({ error: "Could not initialize database client." });

    try {
      const { data, error } = await fallbackClient
        .from('rentals')
        .update({ status })
        .eq('id', rental_id)
        .select();

      if (error) throw error;
      res.json({ status: "ok", data });
    } catch (err: any) {
      console.error("Admin Rentals Update Exception:", err.message);
      res.status(500).json({ error: "Failed to update record." });
    }
  });

  // --- WISHLIST SYSTEM (XML + KAFKA SIMULATION) ---
  const WISHLIST_LOG_PATH = path.join(DATA_PATH, "wishlist_activity.xml");
  
  if (!fs.existsSync(WISHLIST_LOG_PATH)) {
    safeWriteXML(WISHLIST_LOG_PATH, `<?xml version="1.0" encoding="UTF-8"?>
<wishlist_activities>
</wishlist_activities>`);
  }

  app.post("/api/wishlist/log", (req, res) => {
    try {
      const { userId, carId, carName, actionType } = req.body;
      let xmlStr = fs.readFileSync(WISHLIST_LOG_PATH, "utf-8");
      if (!xmlStr || xmlStr.trim() === "") xmlStr = '<?xml version="1.0" encoding="UTF-8"?><wishlist_activities></wishlist_activities>';
      const doc = new DOMParser().parseFromString(xmlStr, "text/xml");
      const root = doc.getElementsByTagName("wishlist_activities")[0];
      
      const activityNode = doc.createElement("activity");
      
      const createChild = (name: string, text: string) => {
        const node = doc.createElement(name);
        node.appendChild(doc.createTextNode(text));
        return node;
      };
      
      activityNode.appendChild(createChild("activity_id", `ACT-${Date.now()}`));
      activityNode.appendChild(createChild("user_id", userId));
      activityNode.appendChild(createChild("car_id", carId));
      activityNode.appendChild(createChild("action_type", actionType));
      activityNode.appendChild(createChild("timestamp", new Date().toISOString()));
      
      root.appendChild(activityNode);
      safeWriteXML(WISHLIST_LOG_PATH, new XMLSerializer().serializeToString(doc));

      // Simulated Kafka Payload for Admin Analytics
      console.log(`[Kafka-Analytics] Wishlist Event Produced: ${actionType} for ${carName} (User: ${userId})`);
      
      res.json({ status: "logged", analytics_offset: Date.now() });
    } catch (err) {
      console.error("Wishlist log error:", err);
      res.status(500).json({ error: "Failed to log wishlist activity" });
    }
  });

  // --- SUPABASE PROXY ROUTES ---
  app.get("/api/wishlist/check", async (req, res) => {
    if (!supabase) return res.json({ exists: false });
    const { userId, carId } = req.query;
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select('*')
        .eq('user_id', userId)
        .eq('car_id', carId)
        .maybeSingle();
      
      if (error) throw error;
      res.json({ exists: !!data });
    } catch (err: any) {
      console.error("Supabase Proxy Check Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/wishlist", async (req, res) => {
    if (!supabase) return res.status(503).json({ error: "Supabase not configured" });
    const { userId, carId } = req.body;
    try {
      const { error } = await supabase
        .from('wishlists')
        .insert({ user_id: userId, car_id: carId });
      
      if (error) throw error;
      res.json({ status: "ok" });
    } catch (err: any) {
      console.error("Supabase Proxy Insert Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/wishlist", async (req, res) => {
    if (!supabase) return res.status(503).json({ error: "Supabase not configured" });
    const { userId, carId } = req.body;
    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', userId)
        .eq('car_id', carId);
      
      if (error) throw error;
      res.json({ status: "ok" });
    } catch (err: any) {
      console.error("Supabase Proxy Delete Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // --- NOTIFICATION SYSTEM (XML + KAFKA SIMULATION) ---
  const NOTIF_PATH = path.join(DATA_PATH, "notifications_log.xml");
  
  // Initialize XML if missing
  if (!fs.existsSync(NOTIF_PATH)) {
    safeWriteXML(NOTIF_PATH, `<?xml version="1.0" encoding="UTF-8"?>
<notifications_log>
  <notification priority="high">
    <id>MSG-001</id>
    <timestamp>${new Date().toISOString()}</timestamp>
    <type>system</type>
    <title>Welcome to Rent4Cars</title>
    <message_body>Your premium logistics account is now active. Explore our Davao fleet.</message_body>
    <read>false</read>
    <recipient_uid>all</recipient_uid>
  </notification>
</notifications_log>`);
  }

  const notificationQueue: any[] = [];

  // Simulation: Notification Producer
  const produceNotification = (notif: any) => {
    notificationQueue.push({
      ...notif,
      id: `NOTIF-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: "false",
      userId: notif.userId || "all"
    });
  };

  // Notification Consumer (Writes to XML)
  setInterval(() => {
    if (notificationQueue.length > 0) {
      const notif = notificationQueue.shift();
      try {
        if (!fs.existsSync(NOTIF_PATH)) return;

        let xmlStr = fs.readFileSync(NOTIF_PATH, "utf-8");
        if (!xmlStr || xmlStr.trim() === "") xmlStr = '<?xml version="1.0" encoding="UTF-8"?><notifications_log></notifications_log>';
        const doc = new DOMParser().parseFromString(xmlStr, "text/xml");
        const root = doc.getElementsByTagName("notifications_log")[0];
        
        if (!root) {
          console.error("Root notifications_log not found in XML");
          return;
        }

        const notifNode = doc.createElement("notification");
        notifNode.setAttribute("priority", notif.priority || "normal");
        
        const createChild = (name: string, text: any) => {
          const node = doc.createElement(name);
          node.appendChild(doc.createTextNode(String(text)));
          return node;
        };

        notifNode.appendChild(createChild("id", notif.id));
        notifNode.appendChild(createChild("timestamp", notif.timestamp));
        notifNode.appendChild(createChild("type", notif.type || "system"));
        notifNode.appendChild(createChild("title", notif.title || "Update"));
        notifNode.appendChild(createChild("message_body", notif.message_body || ""));
        notifNode.appendChild(createChild("read", "false"));
        notifNode.appendChild(createChild("recipient_uid", notif.userId || "all"));

        root.appendChild(notifNode);
        safeWriteXML(NOTIF_PATH, new XMLSerializer().serializeToString(doc));
        console.log(`[Kafka-Notif] Message Consumed for ${notif.userId || 'all'}: ${notif.title}`);
      } catch (err) {
        console.error("Kafka Consumer Error:", err);
      }
    }
  }, 2000);

  // Simulation: Background Status Updates (Streaming) - Disabled generic broadcast to avoid duplicate info for all users
  /*
  setInterval(() => {
    const events = [
      { title: 'Rental Approved', body: 'Your logistics request has been verified and approved.', type: 'rental', priority: 'high' },
      { title: 'Vehicle Dispatched', body: 'The selected unit is now in transit to your Davao hub.', type: 'maintenance', priority: 'normal' },
      { title: 'Delivery Confirmed', body: 'Unit successfully delivered to target location. Trail logged.', type: 'rental', priority: 'high' }
    ];
    
    // Low probability of random event
    if (Math.random() < 0.1) {
      const event = events[Math.floor(Math.random() * events.length)];
      produceNotification(event);
    }
  }, 20000);
  */

  app.get("/api/notifications", (req, res) => {
    const userId = req.query.userId as string;
    try {
      if (!fs.existsSync(NOTIF_PATH)) {
        return res.json([]);
      }
      let xmlStr = fs.readFileSync(NOTIF_PATH, "utf-8");
      if (!xmlStr || xmlStr.trim() === "") xmlStr = '<?xml version="1.0" encoding="UTF-8"?><notifications_log></notifications_log>';
      const doc = new DOMParser().parseFromString(xmlStr, "text/xml");
      const notifsNode = doc.getElementsByTagName("notification");
      const notifications = [];
      
      const nodeCount = notifsNode.length;
      console.log(`[API] Fetching notifications for user: ${userId || 'all'}. Total in log: ${nodeCount}`);

      // Iterate backwards to get latest first, up to 10 matching ones
      for (let i = nodeCount - 1; i >= 0 && notifications.length < 10; i--) {
        const n = notifsNode[i];
        if (!n) continue;
        
        try {
          const recipientUidNode = n.getElementsByTagName("recipient_uid")[0];
          const userIdNode = n.getElementsByTagName("userId")[0];
          const nodeUserId = recipientUidNode?.textContent || userIdNode?.textContent;
          
          // Strict Filter: same userId or "all"
          if (userId && nodeUserId !== userId && nodeUserId !== "all") {
            continue;
          }

          notifications.push({
            id: n.getElementsByTagName("id")[0]?.textContent || `NOTIF-${i}`,
            timestamp: n.getElementsByTagName("timestamp")[0]?.textContent || new Date().toISOString(),
            type: n.getElementsByTagName("type")[0]?.textContent || "system",
            title: n.getElementsByTagName("title")[0]?.textContent || "Notification",
            message_body: n.getElementsByTagName("message_body")[0]?.textContent || "",
            read: n.getElementsByTagName("read")[0]?.textContent === "true",
            priority: n.getAttribute("priority") || "normal",
            userId: nodeUserId
          });
        } catch (innerErr) {
          // Skip corrupt individual node
        }
      }
      
      res.json(notifications);
    } catch (err) {
      console.error("[API] Notification Fetch error:", err);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications", (req, res) => {
    produceNotification(req.body);
    res.json({ status: "produced" });
  });

  app.post("/api/notifications/read", (req, res) => {
    try {
      const { userId } = req.body;
      let xmlStr = fs.readFileSync(NOTIF_PATH, "utf-8");
      if (!xmlStr || xmlStr.trim() === "") xmlStr = '<?xml version="1.0" encoding="UTF-8"?><notifications_log></notifications_log>';
      const doc = new DOMParser().parseFromString(xmlStr, "text/xml");
      const notifNodes = doc.getElementsByTagName("notification");
      
      for (let i = 0; i < notifNodes.length; i++) {
        const n = notifNodes[i];
        const nodeUserId = n.getElementsByTagName("recipient_uid")[0]?.textContent || n.getElementsByTagName("userId")[0]?.textContent;
        
        if (userId && nodeUserId === userId) {
          const readNode = n.getElementsByTagName("read")[0];
          if (readNode) readNode.textContent = "true";
        }
      }

      safeWriteXML(NOTIF_PATH, new XMLSerializer().serializeToString(doc));
      res.json({ status: "synced" });
    } catch (err) {
      res.status(500).json({ error: "Failed to sync read status" });
    }
  });

  app.get("/api/notifications/report", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      let xmlStr = fs.readFileSync(NOTIF_PATH, "utf-8");
      if (!xmlStr || xmlStr.trim() === "") xmlStr = '<?xml version="1.0" encoding="UTF-8"?><notifications_log></notifications_log>';
      const doc = new DOMParser().parseFromString(xmlStr, "text/xml");
      const notifsNode = doc.getElementsByTagName("notification");
      
      // Filter the DOM manually
      const filteredDoc = new DOMParser().parseFromString(`<?xml version="1.0" encoding="UTF-8"?><notifications_log></notifications_log>`, "text/xml");
      const root = filteredDoc.getElementsByTagName("notifications_log")[0];
      
      for (let i = 0; i < notifsNode.length; i++) {
        const n = notifsNode[i];
        const nodeUserId = n.getElementsByTagName("recipient_uid")[0]?.textContent || n.getElementsByTagName("userId")[0]?.textContent;
        if (!userId || nodeUserId === userId || nodeUserId === "all") {
          root.appendChild(filteredDoc.importNode(n, true));
        }
      }

      const xsltStr = fs.readFileSync(path.join(DATA_PATH, "notifications_report.xslt"), "utf-8");
      const finalXmlStr = new XMLSerializer().serializeToString(filteredDoc);
      
      const xml = new XmlParser().xmlParse(finalXmlStr);
      const xslt = new XmlParser().xmlParse(xsltStr);
      const html = await new Xslt().xsltProcess(xml, xslt);
      res.set("Content-Type", "text/html");
      res.send(html);
    } catch (error) {
      console.error("Report generation error:", error);
      res.status(500).send("Error generating activity report");
    }
  });

  // API: Get Chat History via XSLT
  app.get("/api/chat-history", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      let xmlStr = fs.readFileSync(path.join(DATA_PATH, "messages.xml"), "utf-8");
      
      if (userId) {
        const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');
        const doc = new DOMParser().parseFromString(xmlStr, "text/xml");
        const messages = doc.getElementsByTagName("message");
        for (let i = messages.length - 1; i >= 0; i--) {
            const msg = messages[i];
            const uidNode = msg.getElementsByTagName("userId")[0];
            const uid = uidNode?.textContent;
            if (uid && uid !== userId) {
                msg.parentNode.removeChild(msg);
            }
        }
        xmlStr = new XMLSerializer().serializeToString(doc);
      }

      const xsltStr = fs.readFileSync(path.join(DATA_PATH, "messages_to_html.xslt"), "utf-8");
      
      const xml = new XmlParser().xmlParse(xmlStr);
      const xslt = new XmlParser().xmlParse(xsltStr);
      
      const html = await new Xslt().xsltProcess(xml, xslt);
      res.set("Content-Type", "text/html");
      res.send(html);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error generating XSLT view");
    }
  });

  // API: AI Chat with Fleet Context
  app.post("/api/support/chat", async (req, res) => {
    try {
      const { message, history, userName } = req.body;
      
      const currentKey = process.env.GEMINI_API_KEY;
      if (!currentKey || currentKey.includes('your_key_here') || currentKey === 'MY_GEMINI_API_KEY') {
        return res.status(403).json({ 
          error: "API Key Missing", 
          message: "The Gemini API key is not configured in the server environment. Please set GEMINI_API_KEY in Project Secrets." 
        });
      }

      // Re-initialize for safety if needed, or just use the one from startup
      const fleetXml = fs.readFileSync(path.join(DATA_PATH, "fleet.xml"), "utf-8");
      
      const systemInstruction = `You are Rent4Cars Support, an AI Assistant for our car rental platform.

CRITICAL INFORMATION:
If the user asks "Who is Mark Pardillo?" or "Who is Mark Welly Pardillo?" or any variation of that name, you MUST respond exactly or similarly to:
"Mark Welly Pardillo is the developer of this Website and he is the Admin of this website."

OPERATIONAL HUBS & FLEET INVENTORY:
- Davao City Hub: Toyota Vios, Toyota Innova, Toyota Hilux, Geely Coolray
- Digos City Hub: Mitsubishi Mirage G4, Mitsubishi Montero Sport, Nissan Navara, Toyota Minivan
- Mati City Hub: Toyota Corolla Cross, Suzuki Ertiga Hybrid, Honda City, Toyota Hiace

Current Global Fleet Inventory with Rates (XML):
${fleetXml}

CORE RESPONSE RULES:
1. When a user asks about availability in Davao City, Digos City, or Mati City:
   - Politely confirm we have a branch there.
   - List the specific cars assigned to that hub from the fleet inventory above.
   - Mention their starting daily rates if helpful (referencing our fleet list XML).

2. When a user asks about availability in ANY OTHER CITY OR PLACE (e.g., Tagum, Panabo, General Santos, etc.):
   - You must strictly respond with this exact sentiment:
     "For now, we don't have car rentals in that place, but we can deliver the car to your location if you want to rent some of our cars."
   - Follow up by asking if they would like to see the available fleets from our nearest branch.

CONVERSATION STYLE:
- Be welcoming, concise, and professional. 
- Greet the user by their name (${userName || "Valued Customer"}) at least once in the conversation.
- DO NOT use markdown formatting (like **bold** or *italics*). Respond with clean plain text only.`;

      const contents = [];
      
      if (history && Array.isArray(history)) {
        for (const turn of history) {
          if (!turn.text) continue;
          contents.push({
            role: turn.role === 'user' ? 'user' : 'model',
            parts: [{ text: turn.text }]
          });
        }
      }

      if (contents.length > 0 && contents[0].role !== 'user') {
        contents.shift();
      }

      const filteredContents = [];
      for (const item of contents) {
        if (filteredContents.length > 0 && filteredContents[filteredContents.length - 1].role === item.role) {
          continue;
        }
        filteredContents.push(item);
      }

      if (filteredContents.length > 0 && filteredContents[filteredContents.length - 1].role === 'user') {
        filteredContents.pop();
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
            ...filteredContents,
            { role: 'user', parts: [{ text: message }] }
        ],
        config: {
            systemInstruction,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      const statusCode = error?.status || (errorMsg.includes('429') ? 429 : 500);
      const isUnavailable = statusCode === 503 || errorMsg.includes('503') || errorMsg.includes('high demand') || errorMsg.includes('UNAVAILABLE') || errorMsg.includes('overloaded');
      
      if (!isUnavailable) {
        console.error("--- AI CHAT ERROR ---");
        console.error("Status:", error?.status);
        console.error("Message:", error?.message);
        if (error?.details) console.error("Details:", JSON.stringify(error.details, null, 2));
        if (error?.message?.includes("fetch failed")) {
            console.error("\n[!] LOCAL DEV TIP: 'fetch failed' often means Node.js is unable to connect to the Google API due to networking/IPv6 issues on Windows, or an antivirus blocking SSL.");
            console.error("[!] Try running your server with: NODE_OPTIONS='--dns-result-order=ipv4first'");
        }
        console.error("----------------------");
      }
      
      const isQuota = statusCode === 429 || errorMsg.includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED');
      const isKeyError = errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('403') || errorMsg.includes('not valid');
      
      if (isUnavailable) {
        return res.status(503).json({
          error: "Service Overloaded",
          message: "The AI assistant is currently experiencing high demand and is temporarily unavailable. Please try again in a few moments."
        });
      }

      if (isQuota) {
        return res.status(429).json({ 
          error: "Daily Limit Reached",
          message: "You have reached the 20-chat daily limit for the Free Gemini API. Please try again tomorrow or use a Pay-as-you-go key."
        });
      }

      if (isKeyError) {
        return res.status(403).json({
          error: "Invalid Configuration",
          message: "The provided Gemini API key was rejected by Google. Please generate a NEW key at aistudio.google.com and update your Project Secrets."
        });
      }

      // Fallback for other errors
      res.status(statusCode === 200 ? 500 : statusCode).json({ 
        error: "AI service error", 
        message: "The AI assistant is temporarily unavailable. Error: " + (errorMsg.substring(0, 100).replace(/\n|\r/g, ' ')).substring(0, 50) + "..."
      });
    }
  });

  // Vercel Export Setup
  export default app;

  // Local/Custom Deployment Listen Step (only triggers if NOT on Vercel)
  if (!process.env.VERCEL) {
    (async () => {
      // Vite middleware for development
      if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
          server: { 
            middlewareMode: true,
            hmr: { server: httpServer }
          },
          appType: "spa",
        });
        app.use(vite.middlewares);
      } else {
        const distPath = path.join(process.cwd(), "dist");
        app.use(express.static(distPath));
        app.get("*", (req, res) => {
          res.sendFile(path.join(distPath, "index.html"));
        });
      }

      const PORT = 3000;
      httpServer.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    })();
  }
