import express from "express";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// RajaOngkir and other APIs frequently have incomplete certificate chains or expired SSL certificates.
// Bypassing TLS unauthorized rejection ensures reliability in proxy requests.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const app = express();
const PORT = 3000;

// Body parser limit and configurations
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // --- PAKASIR PAYMENT GATEWAY PROXY ENDPOINTS ---

  // Helper function to fetch dynamic Pakasir configuration from Supabase, client overrides, or environment
  async function getPakasirConfig(clientProject?: string, clientApiKey?: string) {
    const sandboxKey = "rE24cpoGsJwlDvQ3AnFMRX9SgZsGaVDE";
    const sandboxProject = "pasar-tegalsari";

    // Detect if server-side environment variables have custom configurations (e.g., set on Vercel Dashboard)
    // Support all common permutations, prefixes, and common typos of Pakasir and General API environment variables
    const envApiKey = process.env.PAKASIR_API_KEY || 
                      process.env.PAKASIR_APIKEY || 
                      process.env.API_KEY_PAKASIR || 
                      process.env.PAKASIR_KEY || 
                      process.env.API_KEY || 
                      process.env.APIKEY;

    const envProjectName = process.env.PAKASIR_PROJECT_NAME || 
                           process.env.PAKASIR_MERCHANT_ID || 
                           process.env.PAKASIR_MERCHAND_ID || 
                           process.env.PAKASIR_PROJECT || 
                           process.env.PAKASIR_MERCHANT || 
                           process.env.PAKASIR_MERCHAND || 
                           process.env.MERCHANT_ID || 
                           process.env.MERCHAND_ID || 
                           process.env.PROJECT_NAME || 
                           process.env.PROJECT_ID || 
                           process.env.PROJECT || 
                           process.env.MERCHANT;

    const hasServerCustomConfig = envApiKey && envApiKey.trim() !== "" && envApiKey !== sandboxKey;

    // Detect if the client passed a genuine, non-sandbox and non-empty custom API key
    const isClientCustom = clientApiKey && clientApiKey !== sandboxKey && clientApiKey !== "xxx123" && clientApiKey.trim() !== "";
    
    // If the server-side environment has custom configurations (from Vercel or local .env), ALWAYS prioritize them
    // unless the client explicitly passes a different custom key (i.e. not sandbox and not xxx123)
    if (hasServerCustomConfig && !isClientCustom) {
      return {
        apiKey: envApiKey,
        project: envProjectName || sandboxProject,
        enabled: true
      };
    }

    // If client provided a specific custom key (different from sandbox), use that (for dynamic setups)
    if (clientProject && isClientCustom) {
      return {
        apiKey: clientApiKey,
        project: clientProject,
        enabled: true
      };
    }

    let finalProject = envProjectName || clientProject || sandboxProject;
    let finalApiKey = envApiKey || (clientApiKey && clientApiKey !== "xxx123" ? clientApiKey : sandboxKey);
    let finalEnabled = true;

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    // Only query database if client did not supply BOTH project and api_key or if client is using default sandbox key
    if (!clientProject || !clientApiKey || clientApiKey === "xxx123" || clientApiKey === sandboxKey) {
      if (supabaseUrl && supabaseKey) {
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/app_settings?id=eq.global_settings&select=*`, {
            headers: {
              "apikey": supabaseKey,
              "Authorization": `Bearer ${supabaseKey}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
              const settings = data[0];
              let extra: any = {};
              let aboutUs = settings.about_us || '';
              const tagStartIndex = aboutUs.lastIndexOf('[METADATA_JSON:');
              if (tagStartIndex !== -1) {
                const tagContentStart = tagStartIndex + '[METADATA_JSON:'.length;
                const lastBracketIndex = aboutUs.lastIndexOf(']');
                if (lastBracketIndex > tagContentStart) {
                  const jsonStr = aboutUs.substring(tagContentStart, lastBracketIndex).trim();
                  try {
                    extra = JSON.parse(jsonStr);
                  } catch (e) {
                    console.error('Error parsing metadata JSON for Pakasir:', e);
                  }
                }
              }

              const apiKey = settings.pakasir_api_key || extra.pakasir_api_key;
              const project = settings.pakasir_merchant_id || settings.pakasir_project_name || extra.pakasir_merchant_id;
              
              // If we found a non-sandbox, non-placeholder key in DB, prioritize it
              if (apiKey && apiKey !== "xxx123" && apiKey !== sandboxKey) {
                finalApiKey = apiKey;
              } else if (hasServerCustomConfig) {
                // If DB is empty or sandbox, but server has custom env key, use server env key
                finalApiKey = envApiKey;
              }

              if (project && project !== sandboxProject) {
                finalProject = project;
              } else if (envProjectName) {
                finalProject = envProjectName;
              }

              finalEnabled = settings.pakasir_enabled !== undefined ? !!settings.pakasir_enabled : (extra.pakasir_enabled !== undefined ? !!extra.pakasir_enabled : true);

              return { apiKey: finalApiKey, project: finalProject, enabled: finalEnabled };
            }
          }
        } catch (err) {
          console.error('Error fetching app settings for Pakasir proxy:', err);
        }
      }
    }

    return {
      apiKey: finalApiKey,
      project: finalProject,
      enabled: finalEnabled
    };
  }

  // API: Debug Pakasir Config
  app.get("/api/pakasir/debug-config", async (req, res) => {
    try {
      const config = await getPakasirConfig();
      const maskedKey = config.apiKey 
        ? (config.apiKey.length > 6 
            ? `${config.apiKey.slice(0, 3)}...${config.apiKey.slice(-3)}` 
            : "***")
        : "none";

      // Safely scan all active environment variables to report keys that are set
      const detectedEnvKeys = Object.keys(process.env).filter(key => {
        const k = key.toUpperCase();
        return (k.includes("PAKASIR") || k.includes("MERCHANT") || k.includes("MERCHAND") || k === "API_KEY" || k === "APIKEY" || k === "PROJECT_ID" || k === "PROJECT_NAME" || k === "PROJECT") &&
               process.env[key] && process.env[key]!.trim() !== "";
      });

      return res.json({
        success: true,
        project: config.project,
        enabled: config.enabled,
        apiKeyMasked: maskedKey,
        apiKeyLength: config.apiKey ? config.apiKey.length : 0,
        vercelEnvironment: !!process.env.VERCEL,
        nodeEnv: process.env.NODE_ENV,
        envKeysDetectedOnServer: detectedEnvKeys
      });
    } catch (err: any) {
      return res.json({ success: false, error: err.message });
    }
  });

  // API: Transaction create proxy
  app.post("/api/pakasir/create", async (req, res) => {
    const { method, order_id, amount, project, api_key } = req.body;
    if (!method || !order_id || !amount) {
      return res.status(400).json({ success: false, message: "Missing required parameters: method, order_id, amount" });
    }

    try {
      const config = await getPakasirConfig(project, api_key);
      console.log(`[Pakasir Proxy] Creating transaction for order ${order_id}, method: ${method}, project: ${config.project}`);

      const response = await fetch(`https://app.pakasir.com/api/transactioncreate/${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project: config.project,
          order_id: order_id,
          amount: Number(amount),
          api_key: config.apiKey
        })
      });

      const data = await response.json();
      console.log(`[Pakasir Proxy] Response status: ${response.status}`, data);

      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          message: data.message || "Failed to create Pakasir transaction",
          error: data
        });
      }

      return res.json({ success: true, data });
    } catch (err: any) {
      console.error("[Pakasir Proxy Error] Failed to create transaction:", err.message);
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // API: Payment simulation proxy
  app.post("/api/pakasir/simulate", async (req, res) => {
    const { order_id, amount, project, api_key } = req.body;
    if (!order_id || !amount) {
      return res.status(400).json({ success: false, message: "Missing required parameters: order_id, amount" });
    }

    try {
      const config = await getPakasirConfig(project, api_key);
      console.log(`[Pakasir Proxy] Simulating payment for order ${order_id}, amount: ${amount}, project: ${config.project}`);

      const response = await fetch(`https://app.pakasir.com/api/paymentsimulation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project: config.project,
          order_id: order_id,
          amount: Number(amount),
          api_key: config.apiKey
        })
      });

      const data = await response.json();
      console.log(`[Pakasir Proxy] Simulation Response:`, data);

      // Instantly register the simulated transaction in memory for immediate UI response
      const cleanSimId = order_id.toString().trim();
      completedOrdersMemory.add(cleanSimId);
      completedOrdersMemory.add(cleanSimId.toLowerCase());
      await updateSupabaseOrderStatus(cleanSimId, "processing");

      return res.json({ success: true, data });
    } catch (err: any) {
      console.error("[Pakasir Proxy Error] Failed to simulate payment:", err.message);
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // API: Transaction Cancel proxy
  app.post("/api/pakasir/cancel", async (req, res) => {
    const { order_id, amount, project, api_key } = req.body;
    if (!order_id || !amount) {
      return res.status(400).json({ success: false, message: "Missing required parameters: order_id, amount" });
    }

    try {
      const config = await getPakasirConfig(project, api_key);
      const response = await fetch(`https://app.pakasir.com/api/transactioncancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project: config.project,
          order_id: order_id,
          amount: Number(amount),
          api_key: config.apiKey
        })
      });

      const data = await response.json();
      return res.json({ success: true, data });
    } catch (err: any) {
      console.error("[Pakasir Proxy Error] Failed to cancel transaction:", err.message);
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // API: Disbursement Create proxy (Pencairan Saldo Otomatis)
  app.post("/api/pakasir/disbursement/create", async (req, res) => {
    const { wdId, amount, bank_name, bank_account_number, bank_account_name, project, api_key } = req.body;
    if (!wdId || !amount || !bank_name || !bank_account_number || !bank_account_name) {
      return res.status(400).json({ success: false, message: "Missing required parameters for disbursement" });
    }

    try {
      const config = await getPakasirConfig(project, api_key);
      console.log(`[Pakasir Proxy] Creating disbursement/withdraw for ${wdId}, bank: ${bank_name}, amount: ${amount}`);

      // Map bank names to lowercase codes
      const bankCode = bank_name.toString().trim().toLowerCase()
        .replace(/mandiri/i, 'mandiri')
        .replace(/bca/i, 'bca')
        .replace(/bri/i, 'bri')
        .replace(/bni/i, 'bni')
        .replace(/gopay/i, 'gopay')
        .replace(/ovo/i, 'ovo')
        .replace(/dana/i, 'dana')
        .replace(/shopeepay/i, 'shopeepay');

      if (config.enabled && config.apiKey !== "xxx123") {
        const response = await fetch(`https://app.pakasir.com/api/disbursementcreate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project: config.project,
            api_key: config.apiKey,
            disbursement_id: wdId,
            order_id: wdId,
            amount: Number(amount),
            bank: bankCode,
            bank_account_number: bank_account_number,
            bank_account_name: bank_account_name
          })
        });

        const data = await response.json();
        console.log(`[Pakasir Proxy] Disbursement Response:`, data);

        if (response.ok) {
          await updateSupabaseWithdrawalStatus(wdId, "approved");
          return res.json({ success: true, is_simulated: false, data });
        } else {
          return res.status(response.status).json({
            success: false,
            message: data.message || "Gagal melakukan pencairan dana via Pakasir",
            error: data
          });
        }
      } else {
        // Fallback to simulation mode if Pakasir is not configured or in sandbox
        console.log(`[Pakasir Proxy] Pakasir API not active or key is default. Running simulated withdrawal.`);
        await updateSupabaseWithdrawalStatus(wdId, "approved");
        return res.json({
          success: true,
          is_simulated: true,
          message: "Simulasi penarikan berhasil diselesaikan!",
          data: {
            disbursement_id: wdId,
            status: "success",
            bank_code: bankCode,
            bank_account_number,
            amount,
            note: "Simulated via Pakasir Proxy (Sandbox)"
          }
        });
      }
    } catch (err: any) {
      console.error("[Pakasir Proxy Error] Disbursement failed:", err.message);
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // API: Disbursement Simulation proxy
  app.post("/api/pakasir/disbursement/simulate", async (req, res) => {
    const { wdId, amount, bank_name, bank_account_number, bank_account_name } = req.body;
    if (!wdId || !amount) {
      return res.status(400).json({ success: false, message: "Missing required parameters" });
    }

    try {
      console.log(`[Pakasir Proxy] Simulating disbursement/withdraw for ${wdId}, amount: ${amount}`);
      await updateSupabaseWithdrawalStatus(wdId, "approved");
      return res.json({
        success: true,
        is_simulated: true,
        message: "Simulasi penarikan via Pakasir sukses!",
        data: {
          disbursement_id: wdId,
          status: "success",
          amount: Number(amount)
        }
      });
    } catch (err: any) {
      console.error("[Pakasir Proxy Error] Disbursement simulation failed:", err.message);
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // In-memory cache of completed order IDs (acts as fallback in local/offline modes or for fast state sync)
  const completedOrdersMemory = new Set<string>();

  // Helper to extract status from various possible payment response bodies
  function extractStatus(obj: any): string {
    if (!obj) return "";
    
    const statusKeys = [
      "status", 
      "payment_status", 
      "transaction_status", 
      "state", 
      "payment_state", 
      "trx_status"
    ];
    
    for (const key of statusKeys) {
      if (obj[key] && typeof obj[key] === "string") {
        return obj[key].trim().toLowerCase();
      }
    }
    
    const nestedKeys = ["data", "payment", "transaction", "trx", "result"];
    for (const key of nestedKeys) {
      if (obj[key] && typeof obj[key] === "object") {
        const nestedStatus = extractStatus(obj[key]);
        if (nestedStatus) return nestedStatus;
      }
    }
    
    return "";
  }

  // Helper to extract order_id from various possible payload formats
  function findOrderId(body: any, query: any): string {
    const candidates = [
      body?.order_id,
      body?.id_order,
      body?.orderId,
      body?.external_id,
      body?.reference,
      body?.reference_id,
      body?.invoice,
      body?.invoice_id,
      body?.payment_reference,
      body?.id,
      query?.order_id,
      query?.id_order,
      query?.orderId,
      query?.external_id,
      query?.reference,
      query?.id
    ];

    if (body?.data) {
      candidates.push(
        body.data.order_id,
        body.data.id_order,
        body.data.orderId,
        body.data.external_id,
        body.data.reference,
        body.data.id
      );
    }

    if (body?.transaction) {
      candidates.push(
        body.transaction.order_id,
        body.transaction.id_order,
        body.transaction.orderId,
        body.transaction.id
      );
    }

    if (body?.payment) {
      candidates.push(
        body.payment.order_id,
        body.payment.id_order,
        body.payment.orderId,
        body.payment.id
      );
    }

    for (const val of candidates) {
      if (val && typeof val === "string" && val.trim().length > 0) {
        return val.trim();
      }
      if (val && typeof val === "number") {
        return val.toString();
      }
    }
    return "";
  }

  // Helper to update Supabase order status directly
  async function updateSupabaseOrderStatus(orderId: string, status: string) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        console.log(`[Pakasir Sync] Proactively updating order ${orderId} status to '${status}' in Supabase...`);
        const patchResponse = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`, {
          method: "PATCH",
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
          },
          body: JSON.stringify({
            status: status
          })
        });

        if (patchResponse.ok) {
          console.log(`[Pakasir Sync] Successfully updated order ${orderId} in Supabase to '${status}'.`);
          return true;
        } else {
          const errText = await patchResponse.text();
          console.error(`[Pakasir Sync Error] Failed to update order ${orderId} in Supabase:`, errText);
        }
      } catch (e: any) {
        console.error(`[Pakasir Sync Error] Exception while updating Supabase:`, e.message);
      }
    }
    return false;
  }

  // Helper to update Supabase withdrawal status directly
  async function updateSupabaseWithdrawalStatus(wdId: string, status: string) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        console.log(`[Pakasir Sync] Proactively updating withdrawal ${wdId} status to '${status}' in Supabase...`);
        const patchResponse = await fetch(`${supabaseUrl}/rest/v1/withdrawal_requests?id=eq.${wdId}`, {
          method: "PATCH",
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
          },
          body: JSON.stringify({
            status: status,
            completed_at: status === 'approved' ? new Date().toISOString() : null
          })
        });

        if (patchResponse.ok) {
          console.log(`[Pakasir Sync] Successfully updated withdrawal ${wdId} in Supabase to '${status}'.`);
          return true;
        } else {
          const errText = await patchResponse.text();
          console.error(`[Pakasir Sync Error] Failed to update withdrawal ${wdId} in Supabase:`, errText);
        }
      } catch (e: any) {
        console.error(`[Pakasir Sync Error] Exception while updating Supabase withdrawal:`, e.message);
      }
    }
    return false;
  }

  // API: Get Pakasir transaction status from memory OR by proactively calling Pakasir status API
  app.get("/api/pakasir/status/:order_id", async (req, res) => {
    const { order_id } = req.params;
    const clean_id = order_id.trim();
    
    // 1. Check in-memory fast cache first
    if (completedOrdersMemory.has(clean_id) || completedOrdersMemory.has(clean_id.toLowerCase())) {
      return res.json({ order_id, completed: true, source: "memory" });
    }

    // 2. Resolve amount either from query param or by querying Supabase
    let amount = Number(req.query.amount);
    
    if (!amount) {
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        try {
          console.log(`[Pakasir Status Checker] Fetching order ${order_id} from Supabase to find amount...`);
          const ordResponse = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${order_id}`, {
            headers: {
              "apikey": supabaseKey,
              "Authorization": `Bearer ${supabaseKey}`
            }
          });
          if (ordResponse.ok) {
            const ords = await ordResponse.json();
            if (ords && ords.length > 0) {
              amount = Number(ords[0].total_amount);
              console.log(`[Pakasir Status Checker] Found amount from Supabase order: ${amount}`);
            }
          }
        } catch (dbErr: any) {
          console.error(`[Pakasir Status Checker] DB Fetch error:`, dbErr.message);
        }
      }
    }

    if (!amount) {
      console.warn(`[Pakasir Status Checker Warning] Cannot check status because amount is not provided/found for order ${order_id}.`);
      return res.json({ order_id, completed: false, error: "Missing amount for status check" });
    }

    // 3. Proactively check Pakasir status API directly using transactiondetail GET API
    try {
      const clientProject = req.query.project as string | undefined;
      const clientApiKey = req.query.api_key as string | undefined;
      const config = await getPakasirConfig(clientProject, clientApiKey);
      console.log(`[Pakasir Status Checker] Proactively querying Pakasir Detail API for order ${order_id} with amount ${amount}...`);
      
      const queryParams = new URLSearchParams({
        project: config.project,
        amount: String(Math.round(amount)),
        order_id: order_id,
        api_key: config.apiKey
      });

      const url = `https://app.pakasir.com/api/transactiondetail?${queryParams.toString()}`;
      const response = await fetch(url, {
        method: "GET"
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[Pakasir Status Checker] Response for order ${order_id}:`, data);
        
        const extracted = extractStatus(data);
        const isSuccess = ["completed", "success", "paid", "settlement", "sukses", "berhasil", "done"].includes(extracted);
        
        if (isSuccess) {
          console.log(`[Pakasir Status Checker] Order ${order_id} is completed according to Pakasir API. Syncing database...`);
          completedOrdersMemory.add(clean_id);
          completedOrdersMemory.add(clean_id.toLowerCase());
          await updateSupabaseOrderStatus(order_id, "processing");
          return res.json({ order_id, completed: true, source: "pakasir_api" });
        }
      } else {
        console.error(`[Pakasir Status Checker Error] Pakasir API status check returned non-ok: ${response.status}`);
      }
    } catch (err: any) {
      console.error(`[Pakasir Status Checker Error] Exception during proactive check:`, err.message);
    }

    return res.json({ order_id, completed: false, source: "checked_failed" });
  });

  // Webhook Receiver (Extremely resilient to match any format, supporting both POST and GET, and multiple route path variations)
  const handleWebhookRequest = async (req: any, res: any) => {
    console.log("[Pakasir Webhook] Received request method:", req.method);
    console.log("[Pakasir Webhook] Raw headers:", req.headers);
    console.log("[Pakasir Webhook] Received webhook payload/body:", req.body);
    console.log("[Pakasir Webhook] Received webhook query:", req.query);

    let payload = req.body || {};
    
    // If body is a string or buffer, parse it
    if (typeof payload === "string" && payload.trim().length > 0) {
      try {
        payload = JSON.parse(payload);
      } catch (e) {
        console.error("[Pakasir Webhook] Failed to parse string body as JSON:", e);
        try {
          const params = new URLSearchParams(payload);
          const formObj: any = {};
          for (const [k, v] of params.entries()) {
            formObj[k] = v;
          }
          payload = formObj;
        } catch (formErr) {
          console.error("[Pakasir Webhook] Failed to parse string body as form-url-encoded:", formErr);
        }
      }
    } else if (Buffer.isBuffer(payload)) {
      try {
        payload = JSON.parse(payload.toString());
      } catch (e) {
        console.error("[Pakasir Webhook] Failed to parse Buffer body as JSON:", e);
      }
    }

    const order_id = findOrderId(payload, req.query);
    if (!order_id) {
      console.warn("[Pakasir Webhook Warning] Received webhook but could not find order_id in payload or query.");
      return res.status(200).json({ success: false, message: "Missing order_id but acknowledged" }); // Always 200 to Pakasir to prevent retry loops
    }

    const clean_id = order_id.trim();

    // Identify status from the payload
    const rawStatus = extractStatus(payload) || payload.status || req.query.status || "";
    const lowerStatus = rawStatus.toString().toLowerCase();
    const isSuccess = ["completed", "success", "paid", "settlement", "sukses", "berhasil", "done"].includes(lowerStatus);

    console.log(`[Pakasir Webhook] Processed Order ID: ${clean_id}, Raw Status: ${rawStatus}, Is Success: ${isSuccess}`);

    if (isSuccess) {
      console.log(`[Pakasir Webhook] Storing order ${clean_id} in completedOrdersMemory cache.`);
      completedOrdersMemory.add(clean_id);
      completedOrdersMemory.add(clean_id.toLowerCase());
      await updateSupabaseOrderStatus(clean_id, "processing");
    }

    return res.json({ success: true, message: "Webhook processed successfully", order_id: clean_id, is_success: isSuccess });
  };

  const webhookPaths = [
    "/api/pakasir/webhook",
    "/api/pakasir/notification",
    "/api/pakasir/callback",
    "/api/pakasir/notification/callback"
  ];

  app.post(webhookPaths, handleWebhookRequest);
  app.get(webhookPaths, handleWebhookRequest);

  // Complete list of Indonesian Provinces (RajaOngkir mapped IDs)
  const PROVINCES_DATA = [
    { province_id: "1", province: "Bali" },
    { province_id: "2", province: "Bangka Belitung" },
    { province_id: "3", province: "Banten" },
    { province_id: "4", province: "Bengkulu" },
    { province_id: "5", province: "DI Yogyakarta" },
    { province_id: "6", province: "DKI Jakarta" },
    { province_id: "7", province: "Gorontalo" },
    { province_id: "8", province: "Jambi" },
    { province_id: "9", province: "Jawa Barat" },
    { province_id: "10", province: "Jawa Tengah" },
    { province_id: "11", province: "Jawa Timur" },
    { province_id: "12", province: "Kalimantan Barat" },
    { province_id: "13", province: "Kalimantan Selatan" },
    { province_id: "14", province: "Kalimantan Tengah" },
    { province_id: "15", province: "Kalimantan Timur" },
    { province_id: "16", province: "Kalimantan Utara" },
    { province_id: "17", province: "Kepulauan Riau" },
    { province_id: "18", province: "Lampung" },
    { province_id: "19", province: "Maluku" },
    { province_id: "20", province: "Maluku Utara" },
    { province_id: "21", province: "Nanggroe Aceh Darussalam (NAD)" },
    { province_id: "22", province: "Nusa Tenggara Barat (NTB)" },
    { province_id: "23", province: "Nusa Tenggara Timur (NTT)" },
    { province_id: "24", province: "Papua" },
    { province_id: "25", province: "Papua Barat" },
    { province_id: "26", province: "Riau" },
    { province_id: "27", province: "Sulawesi Barat" },
    { province_id: "28", province: "Sulawesi Selatan" },
    { province_id: "29", province: "Sulawesi Tengah" },
    { province_id: "30", province: "Sulawesi Tenggara" },
    { province_id: "31", province: "Sulawesi Utara" },
    { province_id: "32", province: "Sumatera Barat" },
    { province_id: "33", province: "Sumatera Selatan" },
    { province_id: "34", province: "Sumatera Utara" }
  ];

  // Comprehensive static database of crucial Indonesian Cities/Regencies
  const CITIES_DATA = [
    // 1: Bali
    { city_id: "17", province_id: "1", province: "Bali", type: "Kabupaten", city_name: "Badung", postal_code: "80351" },
    { city_id: "114", province_id: "1", province: "Bali", type: "Kota", city_name: "Denpasar", postal_code: "80111" },
    { city_id: "128", province_id: "1", province: "Bali", type: "Kabupaten", city_name: "Gianyar", postal_code: "80511" },
    { city_id: "88", province_id: "1", province: "Bali", type: "Kabupaten", city_name: "Buleleng", postal_code: "81111" },
    { city_id: "447", province_id: "1", province: "Bali", type: "Kabupaten", city_name: "Tabanan", postal_code: "82111" },
    
    // 2: Bangka Belitung
    { city_id: "332", province_id: "2", province: "Bangka Belitung", type: "Kota", city_name: "Pangkal Pinang", postal_code: "33111" },
    { city_id: "50", province_id: "2", province: "Bangka Belitung", type: "Kabupaten", city_name: "Belitung", postal_code: "33411" },
    { city_id: "28", province_id: "2", province: "Bangka Belitung", type: "Kabupaten", city_name: "Bangka", postal_code: "33211" },
    
    // 3: Banten
    { city_id: "102", province_id: "3", province: "Banten", type: "Kota", city_name: "Cilegon", postal_code: "42411" },
    { city_id: "402", province_id: "3", province: "Banten", type: "Kota", city_name: "Serang", postal_code: "42111" },
    { city_id: "455", province_id: "3", province: "Banten", type: "Kota", city_name: "Tangerang", postal_code: "15111" },
    { city_id: "457", province_id: "3", province: "Banten", type: "Kota", city_name: "Tangerang Selatan", postal_code: "15411" },
    
    // 4: Bengkulu
    { city_id: "53", province_id: "4", province: "Bengkulu", type: "Kota", city_name: "Bengkulu", postal_code: "38111" },
    { city_id: "374", province_id: "4", province: "Bengkulu", type: "Kabupaten", city_name: "Rejang Lebong", postal_code: "39111" },
    
    // 5: DI Yogyakarta
    { city_id: "501", province_id: "5", province: "DI Yogyakarta", type: "Kota", city_name: "Yogyakarta", postal_code: "55111" },
    { city_id: "419", province_id: "5", province: "DI Yogyakarta", type: "Kabupaten", city_name: "Sleman", postal_code: "55511" },
    { city_id: "39", province_id: "5", province: "DI Yogyakarta", type: "Kabupaten", city_name: "Bantul", postal_code: "55711" },
    
    // 6: DKI Jakarta
    { city_id: "151", province_id: "6", province: "DKI Jakarta", type: "Kota", city_name: "Jakarta Barat", postal_code: "11210" },
    { city_id: "152", province_id: "6", province: "DKI Jakarta", type: "Kota", city_name: "Jakarta Pusat", postal_code: "10110" },
    { city_id: "153", province_id: "6", province: "DKI Jakarta", type: "Kota", city_name: "Jakarta Selatan", postal_code: "12110" },
    { city_id: "154", province_id: "6", province: "DKI Jakarta", type: "Kota", city_name: "Jakarta Timur", postal_code: "13110" },
    { city_id: "155", province_id: "6", province: "DKI Jakarta", type: "Kota", city_name: "Jakarta Utara", postal_code: "14110" },
    
    // 7: Gorontalo
    { city_id: "131", province_id: "7", province: "Gorontalo", type: "Kota", city_name: "Gorontalo", postal_code: "96111" },
    
    // 8: Jambi
    { city_id: "156", province_id: "8", province: "Jambi", type: "Kota", city_name: "Jambi", postal_code: "36111" },
    { city_id: "271", province_id: "8", province: "Jambi", type: "Kabupaten", city_name: "Merangin", postal_code: "37311" },
    
    // 9: Jawa Barat
    { city_id: "23", province_id: "9", province: "Jawa Barat", type: "Kota", city_name: "Bandung", postal_code: "40111" },
    { city_id: "54", province_id: "9", province: "Jawa Barat", type: "Kabupaten", city_name: "Bekasi", postal_code: "17111" },
    { city_id: "75", province_id: "9", province: "Jawa Barat", type: "Kabupaten", city_name: "Bogor", postal_code: "16111" },
    { city_id: "115", province_id: "9", province: "Jawa Barat", type: "Kota", city_name: "Depok", postal_code: "16411" },
    { city_id: "109", province_id: "9", province: "Jawa Barat", type: "Kota", city_name: "Cirebon", postal_code: "45111" },
    { city_id: "126", province_id: "9", province: "Jawa Barat", type: "Kabupaten", city_name: "Garut", postal_code: "44111" },
    { city_id: "469", province_id: "9", province: "Jawa Barat", type: "Kota", city_name: "Tasikmalaya", postal_code: "46111" },
    { city_id: "438", province_id: "9", province: "Jawa Barat", type: "Kota", city_name: "Sukabumi", postal_code: "43111" },
    
    // 10: Jawa Tengah
    { city_id: "399", province_id: "10", province: "Jawa Tengah", type: "Kota", city_name: "Semarang", postal_code: "50135" },
    { city_id: "446", province_id: "10", province: "Jawa Tengah", type: "Kota", city_name: "Surakarta", postal_code: "57111" },
    { city_id: "209", province_id: "10", province: "Jawa Tengah", type: "Kabupaten", city_name: "Kudus", postal_code: "59311" },
    { city_id: "41", province_id: "10", province: "Jawa Tengah", type: "Kabupaten", city_name: "Banyumas", postal_code: "53111" },
    { city_id: "103", province_id: "10", province: "Jawa Tengah", type: "Kabupaten", city_name: "Cilacap", postal_code: "53211" },
    { city_id: "229", province_id: "10", province: "Jawa Tengah", type: "Kabupaten", city_name: "Magelang", postal_code: "56111" },
    { city_id: "344", province_id: "10", province: "Jawa Tengah", type: "Kota", city_name: "Pekalongan", postal_code: "51111" },
    
    // 11: Jawa Timur
    { city_id: "42", province_id: "11", province: "Jawa Timur", type: "Kabupaten", city_name: "Banyuwangi", postal_code: "68416" },
    { city_id: "444", province_id: "11", province: "Jawa Timur", type: "Kota", city_name: "Surabaya", postal_code: "60111" },
    { city_id: "445", province_id: "11", province: "Jawa Timur", type: "Kota", city_name: "Malang", postal_code: "65111" },
    { city_id: "409", province_id: "11", province: "Jawa Timur", type: "Kabupaten", city_name: "Sidoarjo", postal_code: "61211" },
    { city_id: "133", province_id: "11", province: "Jawa Timur", type: "Kabupaten", city_name: "Gresik", postal_code: "61111" },
    { city_id: "335", province_id: "11", province: "Jawa Timur", type: "Kabupaten", city_name: "Pasuruan", postal_code: "67111" },
    { city_id: "177", province_id: "11", province: "Jawa Timur", type: "Kabupaten", city_name: "Kediri", postal_code: "64111" },
    { city_id: "162", province_id: "11", province: "Jawa Timur", type: "Kabupaten", city_name: "Jember", postal_code: "68111" },
    { city_id: "221", province_id: "11", province: "Jawa Timur", type: "Kota", city_name: "Madiun", postal_code: "63111" },
    { city_id: "370", province_id: "11", province: "Jawa Timur", type: "Kota", city_name: "Probolinggo", postal_code: "67211" },
    { city_id: "63", province_id: "11", province: "Jawa Timur", type: "Kota", city_name: "Blitar", postal_code: "66111" },
    
    // 12: Kalimantan Barat
    { city_id: "359", province_id: "12", province: "Kalimantan Barat", type: "Kota", city_name: "Pontianak", postal_code: "78111" },
    { city_id: "416", province_id: "12", province: "Kalimantan Barat", type: "Kota", city_name: "Singkawang", postal_code: "79111" },
    
    // 13: Kalimantan Selatan
    { city_id: "36", province_id: "13", province: "Kalimantan Selatan", type: "Kota", city_name: "Banjarmasin", postal_code: "70111" },
    { city_id: "35", province_id: "13", province: "Kalimantan Selatan", type: "Kota", city_name: "Banjarbaru", postal_code: "70711" },
    
    // 14: Kalimantan Tengah
    { city_id: "326", province_id: "14", province: "Kalimantan Tengah", type: "Kota", city_name: "Palangka Raya", postal_code: "73111" },
    
    // 15: Kalimantan Timur
    { city_id: "387", province_id: "15", province: "Kalimantan Timur", type: "Kota", city_name: "Samarinda", postal_code: "75111" },
    { city_id: "19", province_id: "15", province: "Kalimantan Timur", type: "Kota", city_name: "Balikpapan", postal_code: "76111" },
    
    // 16: Kalimantan Utara
    { city_id: "466", province_id: "16", province: "Kalimantan Utara", type: "Kota", city_name: "Tarakan", postal_code: "77111" },
    
    // 17: Kepulauan Riau
    { city_id: "48", province_id: "17", province: "Kepulauan Riau", type: "Kota", city_name: "Batam", postal_code: "29411" },
    { city_id: "462", province_id: "17", province: "Kepulauan Riau", type: "Kota", city_name: "Tanjung Pinang", postal_code: "29111" },
    
    // 18: Lampung
    { city_id: "27", province_id: "18", province: "Lampung", type: "Kota", city_name: "Bandar Lampung", postal_code: "35111" },
    { city_id: "286", province_id: "18", province: "Lampung", type: "Kota", city_name: "Metro", postal_code: "34111" },
    
    // 19: Maluku
    { city_id: "13", province_id: "19", province: "Maluku", type: "Kota", city_name: "Ambon", postal_code: "97111" },
    
    // 20: Maluku Utara
    { city_id: "467", province_id: "20", province: "Maluku Utara", type: "Kota", city_name: "Ternate", postal_code: "97711" },
    
    // 21: Nanggroe Aceh Darussalam (NAD)
    { city_id: "21", province_id: "21", province: "Nanggroe Aceh Darussalam (NAD)", type: "Kota", city_name: "Banda Aceh", postal_code: "23111" },
    
    // 22: Nusa Tenggara Barat (NTB)
    { city_id: "272", province_id: "22", province: "Nusa Tenggara Barat", type: "Kota", city_name: "Mataram", postal_code: "83111" },
    { city_id: "216", province_id: "22", province: "Nusa Tenggara Barat", type: "Kabupaten", city_name: "Lombok Barat", postal_code: "83311" },
    { city_id: "218", province_id: "22", province: "Nusa Tenggara Barat", type: "Kabupaten", city_name: "Lombok Timur", postal_code: "83611" },
    
    // 23: Nusa Tenggara Timur (NTT)
    { city_id: "211", province_id: "23", province: "Nusa Tenggara Timur", type: "Kota", city_name: "Kupang", postal_code: "85111" },
    
    // 24: Papua
    { city_id: "159", province_id: "24", province: "Papua", type: "Kota", city_name: "Jayapura", postal_code: "99111" },
    
    // 25: Papua Barat
    { city_id: "411", province_id: "25", province: "Papua Barat", type: "Kota", city_name: "Sorong", postal_code: "98411" },
    
    // 26: Riau
    { city_id: "345", province_id: "26", province: "Riau", type: "Kota", city_name: "Pekanbaru", postal_code: "28111" },
    { city_id: "119", province_id: "26", province: "Riau", type: "Kota", city_name: "Dumai", postal_code: "28811" },
    
    // 27: Sulawesi Barat
    { city_id: "246", province_id: "27", province: "Sulawesi Barat", type: "Kabupaten", city_name: "Mamuju", postal_code: "91511" },
    
    // 28: Sulawesi Selatan
    { city_id: "223", province_id: "28", province: "Sulawesi Selatan", type: "Kota", city_name: "Makassar", postal_code: "90111" },
    { city_id: "132", province_id: "28", province: "Sulawesi Selatan", type: "Kabupaten", city_name: "Gowa", postal_code: "92111" },
    { city_id: "331", province_id: "28", province: "Sulawesi Selatan", type: "Kota", city_name: "Parepare", postal_code: "91111" },
    
    // 29: Sulawesi Tengah
    { city_id: "333", province_id: "29", province: "Sulawesi Tengah", type: "Kota", city_name: "Palu", postal_code: "94111" },
    
    // 30: Sulawesi Tenggara
    { city_id: "186", province_id: "30", province: "Sulawesi Tenggara", type: "Kota", city_name: "Kendari", postal_code: "93111" },
    
    // 31: Sulawesi Utara
    { city_id: "226", province_id: "31", province: "Sulawesi Utara", type: "Kota", city_name: "Manado", postal_code: "95111" },
    { city_id: "60", province_id: "31", province: "Sulawesi Utara", type: "Kota", city_name: "Bitung", postal_code: "95511" },
    
    // 32: Sumatera Barat
    { city_id: "318", province_id: "32", province: "Sumatera Barat", type: "Kota", city_name: "Padang", postal_code: "25111" },
    { city_id: "85", province_id: "32", province: "Sumatera Barat", type: "Kota", city_name: "Bukittinggi", postal_code: "26111" },
    
    // 33: Sumatera Selatan
    { city_id: "327", province_id: "33", province: "Sumatera Selatan", type: "Kota", city_name: "Palembang", postal_code: "30111" },
    { city_id: "367", province_id: "33", province: "Sumatera Selatan", type: "Kota", city_name: "Prabumulih", postal_code: "31111" },
    
    // 34: Sumatera Utara
    { city_id: "278", province_id: "34", province: "Sumatera Utara", type: "Kota", city_name: "Medan", postal_code: "20111" },
    { city_id: "113", province_id: "34", province: "Sumatera Utara", type: "Kabupaten", city_name: "Deli Serdang", postal_code: "20511" },
    { city_id: "57", province_id: "34", province: "Sumatera Utara", type: "Kota", city_name: "Binjai", postal_code: "20711" }
  ];

  // Helper to format names nicely (e.g. "KABUPATEN BANYUWANGI" -> "Banyuwangi")
  function formatName(str: string): string {
    if (!str) return "";
    return str.toLowerCase().split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  // Shipping Provinces Endpoint
  app.get("/api/shipping/provinces", async (req, res) => {
    const isLiveMode = !!process.env.BINDERBYTE_API_KEY;
    const key = process.env.BINDERBYTE_API_KEY;

    if (isLiveMode) {
      try {
        console.log(`[BinderByte Wilayah] Fetching provinces from live BinderByte API...`);
        const url = `https://api.binderbyte.com/v1/list_wilayah?api_key=${key}&type=provinsi`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json() as any;
          if (data && data.status === 200 && Array.isArray(data.value)) {
            const mapped = data.value.map((item: any) => ({
              province_id: String(item.id),
              province: formatName(item.name)
            }));
            return res.json({
              success: true,
              results: mapped
            });
          }
        }
        console.warn(`[BinderByte Wilayah Warning] Live API response not successful, falling back to public Emsifa API.`);
      } catch (err: any) {
        console.error(`[BinderByte Wilayah Error] Failed to fetch live provinces:`, err.message);
      }
    }

    // Free Open Emsifa API Fallback to show ALL provinces
    try {
      console.log(`[Emsifa Wilayah] Fetching complete provinces from Emsifa API fallback...`);
      const response = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json`);
      if (response.ok) {
        const data = await response.json() as any;
        if (Array.isArray(data)) {
          const mapped = data.map((item: any) => ({
            province_id: String(item.id),
            province: formatName(item.name)
          }));
          return res.json({
            success: true,
            results: mapped
          });
        }
      }
    } catch (err: any) {
      console.error(`[Emsifa Fallback Error] Failed to fetch provinces from Emsifa:`, err.message);
    }

    return res.json({
      success: true,
      results: PROVINCES_DATA
    });
  });

  // Shipping Cities Endpoint
  app.get("/api/shipping/cities", async (req, res) => {
    const { provinceId } = req.query;
    const isLiveMode = !!process.env.BINDERBYTE_API_KEY;
    const key = process.env.BINDERBYTE_API_KEY;

    if (isLiveMode && provinceId) {
      try {
        console.log(`[BinderByte Wilayah] Fetching cities for province ${provinceId} from live BinderByte API...`);
        const url = `https://api.binderbyte.com/v1/list_wilayah?api_key=${key}&type=kabupaten&id_provinsi=${provinceId}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json() as any;
          if (data && data.status === 200 && Array.isArray(data.value)) {
            const mapped = data.value.map((item: any) => {
              const rawName = item.name || "";
              let type = "Kabupaten";
              let cityName = rawName;
              if (rawName.toUpperCase().startsWith("KABUPATEN ")) {
                type = "Kabupaten";
                cityName = formatName(rawName.substring(10));
              } else if (rawName.toUpperCase().startsWith("KOTA ")) {
                type = "Kota";
                cityName = formatName(rawName.substring(5));
              } else {
                cityName = formatName(rawName);
              }

              return {
                city_id: String(item.id),
                province_id: String(provinceId),
                province: "",
                type: type,
                city_name: cityName,
                postal_code: ""
              };
            });
            return res.json({
              success: true,
              results: mapped
            });
          }
        }
        console.warn(`[BinderByte Wilayah Warning] Live API response not successful, falling back to public Emsifa API.`);
      } catch (err: any) {
        console.error(`[BinderByte Wilayah Error] Failed to fetch live cities:`, err.message);
      }
    }

    // Free Open Emsifa API Fallback to show ALL cities for the province
    if (provinceId) {
      try {
        console.log(`[Emsifa Wilayah] Fetching complete cities for province ${provinceId} from Emsifa API fallback...`);
        const response = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinceId}.json`);
        if (response.ok) {
          const data = await response.json() as any;
          if (Array.isArray(data)) {
            const mapped = data.map((item: any) => {
              const rawName = item.name || "";
              let type = "Kabupaten";
              let cityName = rawName;
              if (rawName.toUpperCase().startsWith("KABUPATEN ")) {
                type = "Kabupaten";
                cityName = formatName(rawName.substring(10));
              } else if (rawName.toUpperCase().startsWith("KOTA ")) {
                type = "Kota";
                cityName = formatName(rawName.substring(5));
              } else {
                cityName = formatName(rawName);
              }

              return {
                city_id: String(item.id),
                province_id: String(provinceId),
                province: "",
                type: type,
                city_name: cityName,
                postal_code: ""
              };
            });
            return res.json({
              success: true,
              results: mapped
            });
          }
        }
      } catch (err: any) {
        console.error(`[Emsifa Fallback Error] Failed to fetch cities from Emsifa:`, err.message);
      }
    }

    let filteredCities = CITIES_DATA;
    if (provinceId) {
      filteredCities = CITIES_DATA.filter(c => c.province_id === String(provinceId));
    }
    return res.json({
      success: true,
      results: filteredCities
    });
  });

  // Shipping Districts (Kecamatan) Endpoint
  app.get("/api/shipping/districts", async (req, res) => {
    const { cityId } = req.query;
    const isLiveMode = !!process.env.BINDERBYTE_API_KEY;
    const key = process.env.BINDERBYTE_API_KEY;

    if (!cityId) {
      return res.json({ success: true, results: [] });
    }

    if (isLiveMode) {
      try {
        console.log(`[BinderByte Wilayah] Fetching districts for city ${cityId} from live BinderByte API...`);
        const url = `https://api.binderbyte.com/v1/list_wilayah?api_key=${key}&type=kecamatan&id_kabupaten=${cityId}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json() as any;
          if (data && data.status === 200 && Array.isArray(data.value)) {
            const mapped = data.value.map((item: any) => ({
              district_id: String(item.id),
              city_id: String(cityId),
              district_name: formatName(item.name)
            }));
            return res.json({
              success: true,
              results: mapped
            });
          }
        }
        console.warn(`[BinderByte Wilayah Warning] Live API response not successful, falling back to public Emsifa API.`);
      } catch (err: any) {
        console.error(`[BinderByte Wilayah Error] Failed to fetch live districts:`, err.message);
      }
    }

    // Free Open Emsifa API Fallback to show ALL districts for the city
    try {
      console.log(`[Emsifa Wilayah] Fetching complete districts for city ${cityId} from Emsifa API fallback...`);
      const response = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${cityId}.json`);
      if (response.ok) {
        const data = await response.json() as any;
        if (Array.isArray(data)) {
          const mapped = data.map((item: any) => ({
            district_id: String(item.id),
            city_id: String(cityId),
            district_name: formatName(item.name)
          }));
          return res.json({
            success: true,
            results: mapped
          });
        }
      }
    } catch (err: any) {
      console.error(`[Emsifa Fallback Error] Failed to fetch districts from Emsifa:`, err.message);
    }

    // Static fallback for Tegalsari / Banyuwangi area
    return res.json({
      success: true,
      results: [
        { district_id: "351001", city_id: String(cityId), district_name: "Tegalsari" },
        { district_id: "351002", city_id: String(cityId), district_name: "Genteng" },
        { district_id: "351003", city_id: String(cityId), district_name: "Banyuwangi" },
        { district_id: "351004", city_id: String(cityId), district_name: "Rogojampi" }
      ]
    });
  });

  // --- BINDERBYTE PACKAGE TRACKING ENDPOINT ---
  app.get("/api/binderbyte/track", async (req, res) => {
    const { courier, awb } = req.query;
    const isLiveMode = !!process.env.BINDERBYTE_API_KEY;
    const key = process.env.BINDERBYTE_API_KEY;

    if (!courier || !awb) {
      return res.status(400).json({ success: false, error: "Parameter courier dan awb wajib diisi." });
    }

    if (isLiveMode) {
      try {
        console.log(`[BinderByte Tracker] Tracking resi ${awb} via ${courier}...`);
        const url = `https://api.binderbyte.com/v1/track?api_key=${key}&courier=${courier}&awb=${awb}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          return res.json(data);
        } else {
          const errText = await response.text();
          return res.status(response.status).json({ success: false, error: errText });
        }
      } catch (err: any) {
        console.error(`[BinderByte Tracker Error]:`, err.message);
        return res.status(500).json({ success: false, error: err.message });
      }
    }

    // BinderByte Simulation Mode (if no API Key configured)
    console.log(`[BinderByte Tracker Simulation] Tracking mock resi: ${awb} via ${courier}`);
    
    // Determine random statuses
    const listStatus = ["ON_PROCESS", "DELIVERED", "RECEIVED"];
    const status = listStatus[Math.abs(String(awb).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % listStatus.length];
    
    const now = new Date();
    const dateStr = now.toISOString().replace('T', ' ').substring(0, 19);
    
    return res.json({
      status: 200,
      message: "Successfully tracked (Simulation Mode)",
      data: {
        summary: {
          awb: String(awb),
          courier: String(courier).toUpperCase(),
          service: "REG",
          status: status,
          date: dateStr,
          desc: status === "DELIVERED" || status === "RECEIVED" ? "Paket telah diterima oleh [YBS] (Ybs Bersangkutan)" : "Paket sedang dalam perjalanan / Transit HUB",
          amount: "15.000",
          weight: "1 Kg"
        },
        detail: {
          origin: "TEGALSARI, BANYUWANGI",
          destination: "KOTA SURABAYA, JAWA TIMUR",
          shipper: "UMKM Tegalsari Hub",
          receiver: "Pelanggan Setia"
        },
        history: [
          {
            date: new Date(now.getTime() - 3600000 * 2).toISOString().replace('T', ' ').substring(0, 19),
            desc: status === "DELIVERED" || status === "RECEIVED" ? "Paket telah sampai di alamat tujuan dan diterima dengan baik." : "Paket keluar dari HUB Banyuwangi menuju kota tujuan.",
            location: status === "DELIVERED" || status === "RECEIVED" ? "KOTA SURABAYA" : "BANYUWANGI"
          },
          {
            date: new Date(now.getTime() - 3600000 * 6).toISOString().replace('T', ' ').substring(0, 19),
            desc: "Paket berhasil disortir di transit center Tegalsari.",
            location: "TEGALSARI"
          },
          {
            date: new Date(now.getTime() - 3600000 * 12).toISOString().replace('T', ' ').substring(0, 19),
            desc: "Vendor UMKM menyerahkan paket ke agen pengiriman.",
            location: "TEGALSARI"
          }
        ]
      }
    });
  });

  // --- BINDERBYTE PRICING PROXY ENDPOINT ---
  // Helper to extract a clean city/district string formatted for BinderByte (e.g. "kecamatan, kota")
  function resolveBinderByteLocation(input: string): string {
    if (!input) return "tegalsari,banyuwangi";
    const trimmed = input.trim().toLowerCase();

    // If already contains a comma e.g. "tegalsari, banyuwangi", return as is
    if (trimmed.includes(",")) {
      return trimmed;
    }

    // If it is a numeric ID, look it up in CITIES_DATA
    if (/^\d+$/.test(trimmed)) {
      const found = CITIES_DATA.find(c => c.city_id === trimmed);
      if (found) {
        return found.city_name.toLowerCase();
      }
      return "banyuwangi";
    }

    let clean = trimmed;
    // Remove common prefixes
    clean = clean.replace(/^(?:kabupaten|kab\.|kota)\s+/i, "").trim();
    // Remove trailing postal code or numbers
    clean = clean.split(/[\d.]/)[0].trim();

    return clean;
  }

  // Helper to extract a clean city name from address or city ID
  function resolveCityName(input: string): string {
    if (!input) return "BANYUWANGI";
    const trimmed = input.trim();
    
    // If it is a numeric ID, look it up in CITIES_DATA
    if (/^\d+$/.test(trimmed)) {
      const found = CITIES_DATA.find(c => c.city_id === trimmed);
      if (found) {
        return found.city_name.toUpperCase();
      }
      return "BANYUWANGI";
    }

    let clean = trimmed.toUpperCase();
    
    // Remove common prefixes
    clean = clean.replace(/^(?:KABUPATEN|KAB\.|KOTA)\s+/i, "").trim();
    
    // Remove any trailing numbers or postal code
    clean = clean.split(/[\d,.]/)[0].trim();

    if (clean.length > 2) {
      return clean;
    }

    return "BANYUWANGI";
  }

  app.post("/api/binderbyte/cost", async (req, res) => {
    const { origin, destination, weight, courier, couriers } = req.body;
    const isLiveMode = !!process.env.BINDERBYTE_API_KEY;
    const key = process.env.BINDERBYTE_API_KEY;
    
    const finalOrigin = resolveBinderByteLocation(origin);
    const finalDestination = resolveBinderByteLocation(destination);
    const finalWeight = weight || 1000;
    const finalCourier = courier || "jne";

    if (isLiveMode) {
      try {
        console.log(`[BinderByte API] Querying real BinderByte rate endpoint for origin="${finalOrigin}", destination="${finalDestination}"...`);
        const courierList = couriers || [finalCourier];
        const allCosts: any[] = [];
        
        for (const c of courierList) {
          const url = `https://api.binderbyte.com/v1/cost?api_key=${key}&courier=${c}&origin=${encodeURIComponent(finalOrigin)}&destination=${encodeURIComponent(finalDestination)}&weight=${finalWeight}`;
          console.log(`[BinderByte API] Request URL: ${url}`);
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json() as any;
            
            // Handle multiple BinderByte response variations safely
            let costsFromApi: any[] = [];
            if (data?.data?.costs && Array.isArray(data.data.costs)) {
              costsFromApi = data.data.costs;
            } else if (data?.data?.results && Array.isArray(data.data.results)) {
              for (const r of data.data.results) {
                if (r.costs && Array.isArray(r.costs)) {
                  costsFromApi.push(...r.costs.map((item: any) => ({
                    service: item.service,
                    description: item.description,
                    price: item.cost !== undefined ? item.cost : item.price,
                    etd: item.etd
                  })));
                }
              }
            } else if (data?.data && Array.isArray(data.data)) {
              costsFromApi = data.data;
            }

            if (costsFromApi.length > 0) {
              const formatted = costsFromApi.map((item: any) => ({
                service: item.service.toUpperCase().startsWith(c.toUpperCase()) ? item.service : `${c.toUpperCase()} ${item.service}`,
                description: item.description || item.service,
                cost: item.price !== undefined ? item.price : (item.cost !== undefined ? item.cost : 11000),
                etd: item.etd || "2-3 Hari"
              }));
              allCosts.push(...formatted);
            }
          } else {
            console.warn(`[BinderByte API Warning] Cost endpoint returned non-OK status: ${response.status}`);
          }
        }

        if (allCosts.length > 0) {
          return res.json({
            isMock: false,
            platform: "binderbyte",
            results: allCosts
          });
        }
      } catch (err: any) {
        console.warn(`[BinderByte Warning] Live connection failed, using BinderByte Simulation Mode. Error: ${err.message}`);
      }
    }

    // BinderByte Simulation Fallback
    console.log(`[BinderByte Simulation] Generating mock rates for BinderByte...`);
    const weightKg = finalWeight / 1000;
    const requestedCouriers = couriers || [finalCourier];
    const mockCosts: any[] = [];

    const baseTariffs: Record<string, { service: string, desc: string, rate: number, etd: string }[]> = {
      jne: [
        { service: "JNE REG", desc: "Layanan Reguler JNE", rate: 11000, etd: "2-3 Hari" },
        { service: "JNE YES", desc: "Layanan Yakin Esok Sampai JNE", rate: 22000, etd: "1 Hari" }
      ],
      sicepat: [
        { service: "SICEPAT REG", desc: "SiCepat Reguler", rate: 11500, etd: "1-2 Hari" },
        { service: "SICEPAT BEST", desc: "SiCepat Besok Sampai Tujuan", rate: 20000, etd: "1 Hari" }
      ],
      jnt: [
        { service: "J&T EZ", desc: "J&T Express EZ", rate: 11000, etd: "2-3 Hari" },
        { service: "J&T Super", desc: "J&T Express Super Fast", rate: 23000, etd: "1-2 Hari" }
      ],
      pos: [
        { service: "POS Reguler", desc: "Pos Reguler Kantor Pos", rate: 10000, etd: "2-4 Hari" },
        { service: "POS Nextday", desc: "Pos Next Day Kilat Khusus", rate: 19000, etd: "1-2 Hari" }
      ],
      tiki: [
        { service: "TIKI REG", desc: "TIKI Reguler Service", rate: 10500, etd: "2-3 Hari" },
        { service: "TIKI ONS", desc: "TIKI Over Night Service", rate: 21000, etd: "1 Hari" }
      ],
      anteraja: [
        { service: "ANTERAJA REG", desc: "AnterAja Regular", rate: 10000, etd: "1-3 Hari" },
        { service: "ANTERAJA SDS", desc: "AnterAja Same Day Service", rate: 25000, etd: "1 Hari" }
      ],
      wahana: [
        { service: "WAHANA Normal", desc: "Wahana Service Normal", rate: 8000, etd: "3-5 Hari" }
      ],
      ninja: [
        { service: "NINJA REG", desc: "Ninja Reguler", rate: 10500, etd: "2-3 Hari" }
      ],
      lion: [
        { service: "LION REGPACK", desc: "Lion Parcel Regpack", rate: 10000, etd: "2-3 Hari" }
      ]
    };

    for (const c of requestedCouriers) {
      const lowerCourier = c.toLowerCase();
      const services = baseTariffs[lowerCourier] || [
        { service: `${c.toUpperCase()} REG`, desc: `${c.toUpperCase()} Regular Service`, rate: 11000, etd: "2-3 Hari" }
      ];
      for (const s of services) {
        mockCosts.push({
          service: s.service,
          description: s.desc,
          cost: Math.max(s.rate - 2000, Math.round(s.rate * weightKg)),
          etd: s.etd
        });
      }
    }

    return res.json({
      isMock: true,
      platform: "binderbyte",
      success: true,
      results: mockCosts
    });
  });

  // --- SMART ENGINE (100% FREE, NO API KEY) ENDPOINT ---
  app.post("/api/smartengine/cost", async (req, res) => {
    const { origin, destination, weight, courier, couriers } = req.body;
    
    const finalOrigin = origin || "42"; // default City ID
    const finalDestination = destination || "42";
    const finalWeight = weight || 1000;
    const finalCourier = courier || "jne";
    const finalCouriers = couriers || [finalCourier];

    console.log(`[Smart Shipping Engine] Calculating local premium cost for ${finalCouriers.join(", ")}`);

    let distanceCoef = 1.0;
    let etdText = "2-3 Hari";
    
    if (finalOrigin === finalDestination) {
      distanceCoef = 0.6;
      etdText = "1-2 Hari";
    } else {
      const origNum = parseInt(finalOrigin) || 0;
      const destNum = parseInt(finalDestination) || 0;
      const diff = Math.abs(origNum - destNum);
      
      if (diff < 15) {
        distanceCoef = 0.9;
        etdText = "2-3 Hari";
      } else if (diff < 100) {
        distanceCoef = 1.3;
        etdText = "2-4 Hari";
      } else {
        distanceCoef = 2.2;
        etdText = "3-6 Hari";
      }
    }

    const weightKg = finalWeight / 1000;
    const results: any[] = [];

    const courierRates: Record<string, { reg: number; eco: number; fast: number; name: string }> = {
      jne: { reg: 11000, eco: 8000, fast: 19000, name: "JNE Express" },
      sicepat: { reg: 10500, eco: 7500, fast: 18000, name: "SiCepat" },
      jnt: { reg: 11000, eco: 8000, fast: 20000, name: "J&T Express" },
      pos: { reg: 9500, eco: 7000, fast: 17000, name: "POS Indonesia" },
      tiki: { reg: 10000, eco: 7500, fast: 17500, name: "TIKI" },
      anteraja: { reg: 10000, eco: 7500, fast: 18000, name: "AnterAja" },
      gosend: { reg: 15000, eco: 15000, fast: 25000, name: "GoSend" },
      grab: { reg: 15000, eco: 15000, fast: 24000, name: "Grab Express" },
      paxel: { reg: 12000, eco: 9000, fast: 22000, name: "Paxel" },
      lion: { reg: 10500, eco: 8000, fast: 18500, name: "Lion Parcel" }
    };

    for (const c of finalCouriers) {
      const code = String(c).toLowerCase();
      const rateInfo = courierRates[code] || { reg: 11000, eco: 8000, fast: 19000, name: code.toUpperCase() };

      const regCost = Math.round(rateInfo.reg * distanceCoef * weightKg);
      const ecoCost = Math.round(rateInfo.eco * distanceCoef * weightKg);
      const fastCost = Math.round(rateInfo.fast * distanceCoef * weightKg);

      results.push({
        service: `${code.toUpperCase()} REG`,
        description: `${rateInfo.name} Layanan Reguler`,
        cost: Math.max(9000, regCost),
        etd: etdText
      });

      if (distanceCoef > 0.8) {
        results.push({
          service: `${code.toUpperCase()} ECO`,
          description: `${rateInfo.name} Layanan Hemat / Ekonomis`,
          cost: Math.max(7000, ecoCost),
          etd: "4-7 Hari"
        });
      }

      results.push({
        service: `${code.toUpperCase()} YES`,
        description: `${rateInfo.name} Layanan Premium Cepat`,
        cost: Math.max(15000, fastCost),
        etd: "1 Hari"
      });
    }

    return res.json({
      success: true,
      platform: "smartengine",
      isLocalEngine: true,
      results: results
    });
  });

  // --- UNIFIED SHIPPING CALCULATOR ENDPOINT ---
  app.post("/api/shipping/calculate", async (req, res) => {
    const { origin, destination, weight, courier, couriers } = req.body;
    
    console.log(`[Unified Shipping] Cost calculation request received for platform "binderbyte"`);

    try {
      const binderbyteRes = await fetch(`http://localhost:3000/api/binderbyte/cost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination, weight, courier, couriers })
      });
      const data = await binderbyteRes.json();
      return res.json(data);
    } catch (err: any) {
      console.error(`[Unified Shipping Error] Failed to calculate shipping with binderbyte:`, err.message);
      return res.status(500).json({
        success: false,
        error: err.message,
        message: "Unified shipping calculation failed"
      });
    }
  });

async function startServer() {
  if (!process.env.VERCEL) {
    // Define Vite middleware configuration or Static files
    if (process.env.NODE_ENV !== "production") {
      try {
        const viteModuleName = "vi" + "te";
        const { createServer: createViteServer } = await import(viteModuleName);
        const vite = await createViteServer({
          server: { middlewareMode: true },
          appType: "spa",
        });
        app.use(vite.middlewares);
      } catch (viteErr: any) {
        console.error("Vite dynamic middleware failed to load:", viteErr.message);
      }
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[Express UMKM Server] Running fullstack server on port ${PORT}`);
    });
  }
}

startServer();

export default app;
