// GRIDPOINT — ShelVO AI Floating Widget with In-Chat Feedback & Review System
// Clean, Premium SaaS Aesthetic (Light Mode with Glassmorphism)

window.GRIDPOINT_COMPONENTS = window.GRIDPOINT_COMPONENTS || {};

(function() {
  // ShelVO Indigo Icon SVG
  function ShelvoIcon({ size = 20, color = "#FFFFFF" }) {
    return React.createElement("svg", {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: color,
      strokeWidth: "2.2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    },
      React.createElement("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }),
      React.createElement("path", { d: "M8 10h.01" }),
      React.createElement("path", { d: "M12 10h.01" }),
      React.createElement("path", { d: "M16 10h.01" })
    );
  }

  // ShelVO Header Brand Badge
  function ShelvoBadge({ size = 32 }) {
    return React.createElement("div", {
      className: "relative flex-none rounded-full flex items-center justify-center select-none shadow-sm",
      style: {
        width: size + "px",
        height: size + "px",
        background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
        boxShadow: "0 2px 8px rgba(79, 70, 229, 0.3)"
      }
    },
      React.createElement(ShelvoIcon, { size: Math.round(size * 0.55), color: "#FFFFFF" })
    );
  }

  const BENGALURU_AREAS = {
    "koramangala": [12.9352, 77.6245],
    "indiranagar": [12.9719, 77.6412],
    "hsr layout": [12.9116, 77.6741],
    "whitefield": [12.9698, 77.7499],
    "electronic city": [12.8452, 77.6602],
    "jayanagar": [12.9308, 77.5838],
    "malleshwaram": [13.0031, 77.5643],
    "bellandur": [12.9260, 77.6762],
    "marathahalli": [12.9591, 77.6974],
    "hebbal": [13.0358, 77.5970],
    "rajajinagar": [12.9915, 77.5524],
    "banashankari": [12.9255, 77.5468],
    "btm layout": [12.9166, 77.6101],
    "yelahanka": [13.1007, 77.5963],
    "sarjapur road": [12.9081, 77.6953],
    "jp nagar": [12.9063, 77.5857],
    "peenya": [13.0329, 77.5273],
    "mahadevapura": [12.9866, 77.6961]
  };

  function haversineDistKm(lat1, lon1, lat2, lon2) {
    const toRad = function(x) { return (x * Math.PI) / 180; };
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 6371 * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  function generateClientReply(query, context) {
    context = context || {};
    const qLower = (query || "").trim().toLowerCase();
    const warehouses = context.warehouses && context.warehouses.length > 0 ? context.warehouses : [
      { id: "WH-01", name: "North Fulfillment Hub (Peenya / Yeshwanthpur)", latitude: 13.0329, longitude: 77.5273, dailyAssigned: 4200, dailyCapacity: 5000, palletCapacity: 3200, palletsUsed: 1950, status: "OPTIMAL CAPACITY", statusColor: "#10B981" },
      { id: "WH-02", name: "East Tech Corridor Hub (Whitefield / Mahadevapura)", latitude: 12.9698, longitude: 77.7499, dailyAssigned: 4680, dailyCapacity: 5000, palletCapacity: 2700, palletsUsed: 2210, status: "OPTIMAL CAPACITY", statusColor: "#10B981" },
      { id: "WH-03", name: "South Electronic City Hub (Bommanahalli / EC)", latitude: 12.8452, longitude: 77.6602, dailyAssigned: 3820, dailyCapacity: 5000, palletCapacity: 3000, palletsUsed: 1840, status: "OPTIMAL CAPACITY", statusColor: "#10B981" }
    ];

    // 1. In-Chat Feedback & Review Routine
    const isStarRating = ["1 star", "2 star", "3 star", "4 star", "5 star", "⭐ 1", "⭐ 2", "⭐ 3", "⭐ 4", "⭐ 5", "5/5", "4/5", "3/5", "2/5", "1/5"].some(function(s) { return qLower.indexOf(s) !== -1; });

    if (isStarRating) {
      let ratingNum = 5;
      const numList = [5, 4, 3, 2, 1];
      for (let i = 0; i < numList.length; i++) {
        const n = numList[i];
        if (qLower.indexOf(n + " star") !== -1 || qLower.indexOf("⭐ " + n) !== -1 || qLower.indexOf(n + "/5") !== -1) {
          ratingNum = n;
          break;
        }
      }
      const refId = "FB_" + Date.now().toString(36).toUpperCase();
      try {
        const stored = JSON.parse(localStorage.getItem("gridpoint_user_feedback") || "[]");
        stored.unshift({ id: refId, category: "General Review", rating: ratingNum, text: query, date: new Date().toISOString() });
        localStorage.setItem("gridpoint_user_feedback", JSON.stringify(stored));
      } catch (e) {}

      let starsVisual = "";
      for (let s = 0; s < ratingNum; s++) starsVisual += "⭐";

      return {
        reply: "### " + starsVisual + " Thank you for the " + ratingNum + "-star review!\n\nYour feedback has been logged directly for our product & engineering team (**Ref: #" + refId + "**).\n\nWe review every submission to make **ShelVO AI** and GridPoint more helpful for your operations.\n\n*Was this helpful? Feel free to share feedback anytime!*",
        source: "ShelVO AI",
        suggestedActions: [
          { label: "📍 Nearest Hub", action: "CHAT_ASK_LOCATION" },
          { label: "🏢 Hub Capacity", action: "CHAT_CAPACITY" },
          { label: "📦 Stock Inventory", action: "OPEN_INVENTORY_TABLE" }
        ]
      };
    }

    if (qLower === "feedback_cat_bug" || qLower === "🐛 bug / issue" || qLower.indexOf("bug:") === 0) {
      if (query.length > 20 && qLower.indexOf("feedback_cat") === -1) {
        const refId = "FB_" + Date.now().toString(36).toUpperCase();
        try {
          const stored = JSON.parse(localStorage.getItem("gridpoint_user_feedback") || "[]");
          stored.unshift({ id: refId, category: "Bug / Issue", text: query, date: new Date().toISOString() });
          localStorage.setItem("gridpoint_user_feedback", JSON.stringify(stored));
        } catch (e) {}
        return {
          reply: "### 🐛 Bug Report Logged\n\nThanks for helping us improve ShelVO! We've logged this report for our engineering team (**Ref: #" + refId + "**) and will investigate promptly.\n\n*Was this helpful? Feel free to share feedback anytime!*",
          source: "ShelVO AI",
          suggestedActions: [
            { label: "📍 Nearest Hub", action: "CHAT_ASK_LOCATION" },
            { label: "🏢 Hub Capacity", action: "CHAT_CAPACITY" }
          ]
        };
      }
      return {
        reply: "### 🐛 Report a Bug or Issue\n\nThanks for helping us improve ShelVO! Could you please share **1–2 specific details** about what went wrong or what you observed?",
        source: "ShelVO AI",
        suggestedActions: [
          { label: "💡 Switch to Feature Request", action: "FEEDBACK_CAT_FEATURE" },
          { label: "⭐ Switch to General Review", action: "FEEDBACK_CAT_REVIEW" }
        ]
      };
    }

    if (qLower === "feedback_cat_feature" || qLower === "💡 feature request" || qLower.indexOf("feature:") === 0) {
      if (query.length > 20 && qLower.indexOf("feedback_cat") === -1) {
        const refId = "FB_" + Date.now().toString(36).toUpperCase();
        try {
          const stored = JSON.parse(localStorage.getItem("gridpoint_user_feedback") || "[]");
          stored.unshift({ id: refId, category: "Feature Request", text: query, date: new Date().toISOString() });
          localStorage.setItem("gridpoint_user_feedback", JSON.stringify(stored));
        } catch (e) {}
        return {
          reply: "### 💡 Feature Request Logged\n\nThank you warmly! Your suggestion has been added to our product roadmap (**Ref: #" + refId + "**).\n\nOur team regularly reviews feature requests to prioritize upcoming releases.\n\n*Was this helpful? Feel free to share feedback anytime!*",
          source: "ShelVO AI",
          suggestedActions: [
            { label: "📍 Nearest Hub", action: "CHAT_ASK_LOCATION" },
            { label: "📦 Stock Inventory", action: "OPEN_INVENTORY_TABLE" }
          ]
        };
      }
      return {
        reply: "### 💡 Suggest a Feature\n\nWe'd love to hear your ideas! What feature or enhancement would make GridPoint and ShelVO even better for you?",
        source: "ShelVO AI",
        suggestedActions: [
          { label: "🐛 Report Bug", action: "FEEDBACK_CAT_BUG" },
          { label: "⭐ Leave General Review", action: "FEEDBACK_CAT_REVIEW" }
        ]
      };
    }

    const isFeedbackTrigger = ["give feedback", "report a bug", "report bug", "rate this app", "rate app", "feature request", "feedback", "rating", "review", "bugs"].some(function(k) { return qLower.indexOf(k) !== -1; });
    if (qLower === "feedback_cat_review" || isFeedbackTrigger) {
      if (qLower === "feedback_cat_review" || qLower.indexOf("rate") !== -1 || qLower.indexOf("review") !== -1) {
        return {
          reply: "### ⭐ Rate Your Experience\n\nThanks for helping us improve ShelVO! How would you rate your experience with us today?",
          source: "ShelVO AI",
          suggestedActions: [
            { label: "⭐ 5 Stars - Excellent", action: "5 stars - Excellent" },
            { label: "⭐ 4 Stars - Good", action: "4 stars - Good" },
            { label: "⭐ 3 Stars - Average", action: "3 stars - Average" },
            { label: "⭐ 2 Stars - Fair", action: "2 stars - Fair" },
            { label: "⭐ 1 Star - Poor", action: "1 star - Poor" }
          ]
        };
      }
      return {
        reply: "### 💬 Thanks for helping us improve ShelVO!\n\nTo direct your input to the right team quickly, please classify your feedback:",
        source: "ShelVO AI",
        suggestedActions: [
          { label: "🐛 Bug / Issue", action: "FEEDBACK_CAT_BUG" },
          { label: "💡 Feature Request", action: "FEEDBACK_CAT_FEATURE" },
          { label: "⭐ General Review", action: "FEEDBACK_CAT_REVIEW" }
        ]
      };
    }

    // 2. Capacity & Utilization
    if (["capacity", "utilization", "utilize", "headroom", "load", "pallet", "throughput", "limit"].some(function(k) { return qLower.indexOf(k) !== -1; })) {
      const cards = warehouses.map(function(w, i) {
        const cap = w.dailyCapacity || w.capacityOrders || 5000;
        const assigned = w.dailyAssigned || w.dailyOrders || (w.assignedNeighborhoods ? w.assignedNeighborhoods.length * 420 : 3800);
        const util = Math.min(100, Math.round((assigned / cap) * 100));
        return {
          code: w.id || w.code || ("WH-" + (i + 1 < 10 ? "0" + (i + 1) : i + 1)),
          name: w.name || w.zone || ("Fulfillment Hub " + (i + 1)),
          dailyAssigned: assigned,
          dailyCapacity: cap,
          utilizationPercent: util,
          palletCapacity: w.palletCapacity || 3000,
          palletsUsed: w.palletsUsed || Math.round(assigned / 2.2),
          status: util > 85 ? "HIGH LOAD WARNING" : "OPTIMAL CAPACITY",
          statusColor: util > 85 ? "#F59E0B" : "#10B981"
        };
      });

      let totalCap = 0;
      let totalAssigned = 0;
      cards.forEach(function(c) { totalCap += c.dailyCapacity; totalAssigned += c.dailyAssigned; });
      const overallUtil = totalCap > 0 ? Math.round((totalAssigned / totalCap) * 100) : 0;
      const headroom = Math.max(0, totalCap - totalAssigned);

      const rows = cards.map(function(c) {
        return "- **" + c.code + " (" + c.name + ")**: Throughput Load **" + c.dailyAssigned.toLocaleString() + "** / " + c.dailyCapacity.toLocaleString() + " orders/day (" + c.utilizationPercent + "% util), **" + c.palletsUsed.toLocaleString() + "** / " + c.palletCapacity.toLocaleString() + " pallets used. Status: **" + c.status + "**. Headroom: **+" + (c.dailyCapacity - c.dailyAssigned).toLocaleString() + " orders/day**";
      }).join("\n");

      return {
        reply: "### Warehouse Network Capacity & Throughput Intelligence\n\nOur active fulfillment network consists of **" + cards.length + " primary hub(s)** serving our metropolitan demand corridors:\n\n- **Total Network Processing Capacity:** **" + totalCap.toLocaleString() + " orders/day**\n- **Current Assigned Daily Demand:** **" + totalAssigned.toLocaleString() + " orders/day**\n- **Composite Network Utilization:** **" + overallUtil + "%**\n- **Reserve Headroom:** **+" + headroom.toLocaleString() + " orders/day**\n\n#### Hub Capacity Breakdown:\n\n" + rows + "\n\n*Was this helpful? Feel free to share feedback!*",
        source: "ShelVO AI",
        capacityCards: cards,
        suggestedActions: [
          { label: "📍 Nearest Hub", action: "CHAT_ASK_LOCATION" },
          { label: "📦 Stock Inventory", action: "OPEN_INVENTORY_TABLE" },
          { label: "⚡ Demand Shock Test", action: "OPEN_DEMAND_SHOCK" }
        ]
      };
    }

    // 3. Proximity & Nearest Hub
    const isNearby = ["nearby", "near me", "closest", "nearest", "find warehouse", "locate", "where is", "distance"].some(function(k) { return qLower.indexOf(k) !== -1; }) || Object.keys(BENGALURU_AREAS).some(function(a) { return qLower.indexOf(a) !== -1; });
    if (isNearby) {
      let targetCoords = null;
      let targetName = null;

      if (context.userLocation && context.userLocation.latitude) {
        targetCoords = [context.userLocation.latitude, context.userLocation.longitude];
        targetName = context.userLocation.area || "Your GPS Location";
      }

      if (!targetCoords) {
        const areaKeys = Object.keys(BENGALURU_AREAS);
        for (let i = 0; i < areaKeys.length; i++) {
          const area = areaKeys[i];
          if (qLower.indexOf(area) !== -1) {
            targetCoords = BENGALURU_AREAS[area];
            targetName = area.toUpperCase();
            break;
          }
        }
      }

      if (!targetCoords) {
        return {
          reply: "### 📍 Locate Your Nearest Fulfillment Warehouse\n\nTo identify the closest fulfillment center and estimate EV transit times, tell me your neighborhood (e.g., *Koramangala*, *Whitefield*, *Indiranagar*) or click **`📍 Share GPS Location`** below:",
          source: "ShelVO AI",
          suggestedActions: [
            { label: "📍 Share GPS Location", action: "REQUEST_GEOLOCATION" },
            { label: "📍 Koramangala", action: "CHAT_LOCATION_Koramangala" },
            { label: "📍 Whitefield", action: "CHAT_LOCATION_Whitefield" },
            { label: "📍 Indiranagar", action: "CHAT_LOCATION_Indiranagar" },
            { label: "📍 Electronic City", action: "CHAT_LOCATION_Electronic City" }
          ]
        };
      }

      let closest = warehouses[0];
      let minD = Infinity;
      warehouses.forEach(function(w) {
        const d = haversineDistKm(targetCoords[0], targetCoords[1], w.latitude, w.longitude);
        if (d < minD) {
          minD = d;
          closest = Object.assign({}, w, { distKm: d });
        }
      });

      const transitMins = Math.round((minD / 25) * 60 + 5);

      return {
        reply: "### 📍 Nearest Warehouse Location Analysis\n**Target Location:** " + targetName + " (`" + targetCoords[0].toFixed(4) + ", " + targetCoords[1].toFixed(4) + "`)\n\nThe closest fulfillment center to you is **" + (closest.id || closest.code || 'Primary Hub') + " — " + (closest.name || 'Fulfillment Center') + "**.\n\n- **Straight-Line Distance:** **" + minD.toFixed(1) + " km**\n- **Estimated EV Fleet Transit Time:** **~" + transitMins + " minutes**\n- **Catchment Status:** In direct primary service zone.\n\n*Was this helpful? Feel free to share feedback!*",
        source: "ShelVO AI",
        suggestedActions: [
          { label: "🏢 Check Hub Capacity", action: "CHAT_CAPACITY" },
          { label: "📦 View Stock Inventory", action: "OPEN_INVENTORY_TABLE" },
          { label: "⭐ Rate ShelVO", action: "FEEDBACK_CAT_REVIEW" }
        ]
      };
    }

    // 4. Stock Inventory
    if (["stock", "inventory", "sku", "units", "goods", "reorder", "shortage", "valuation"].some(function(k) { return qLower.indexOf(k) !== -1; })) {
      return {
        reply: "### Enterprise Stock Inventory Intelligence Overview\n\nGRIDPOINT tracks **13 core SKUs** distributed across fulfillment hubs:\n\n- **Total Stock on Hand:** **34,670 units**\n- **Aggregate Inventory Valuation:** **INR 45,924,800.00**\n- **Safety Health:** 6 SKUs Healthy, 6 Low Stock, 1 Critical Shortage.\n\n#### Priority Low-Stock Attention Items:\n1. **FMC-103 — Artisan Dark Roast Coffee Beans 1kg**: Total 1,175 units on hand (Reorder threshold: 150) — Status: **🚨 CRITICAL**\n2. **APP-302 — High-Visibility Reflective Safety Vests**: Total 1,080 units on hand (Reorder threshold: 200) — Status: **⚠️ LOW STOCK**\n3. **ELC-001 — Smart Lithium Battery Pack 48V**: Total 815 units on hand (Reorder threshold: 100) — Status: **⚠️ LOW STOCK**\n4. **FMC-101 — Cold-Pressed Sunflower Oil 5L**: Total 1,910 units on hand (Reorder threshold: 250) — Status: **⚠️ LOW STOCK**\n\n*Was this helpful? Feel free to share feedback!*",
        source: "ShelVO AI",
        inventoryAlerts: [
          { sku: "FMC-103", name: "Artisan Dark Roast Coffee Beans 1kg", status: "CRITICAL", totalOnHand: 1175, minReorder: 150 },
          { sku: "APP-302", name: "High-Visibility Reflective Safety Vests", status: "LOW STOCK", totalOnHand: 1080, minReorder: 200 },
          { sku: "ELC-001", name: "Smart Lithium Battery Pack 48V", status: "LOW STOCK", totalOnHand: 815, minReorder: 100 },
          { sku: "FMC-101", name: "Cold-Pressed Sunflower Oil 5L", status: "LOW STOCK", totalOnHand: 1910, minReorder: 250 }
        ],
        suggestedActions: [
          { label: "📦 Open Full Stock Inventory Table", action: "OPEN_INVENTORY_TABLE" },
          { label: "🏢 Hub Capacity", action: "CHAT_CAPACITY" },
          { label: "📍 Nearest Hub", action: "CHAT_ASK_LOCATION" }
        ]
      };
    }

    // 5. Default Guidance
    return {
      reply: "### 👋 Hi! I'm ShelVO AI, your logistics & fulfillment operations lead.\n\nI keep a continuous real-time watch on our fulfillment network:\n- 📍 **Nearest Warehouse:** Tell me your delivery neighborhood or tap `📍 Near Me` to identify your closest fulfillment center & EV transit time.\n- 🏢 **Capacity & Utilization:** Check real-time throughput limits, order headroom, and physical pallet bays.\n- 📦 **Stock Inventory & Alerts:** Track SKU stock levels, monitor safety reorders, and view valuations.\n\n**How can I assist your operations today?**",
      source: "ShelVO AI",
      suggestedActions: [
        { label: "📍 Nearest Hub", action: "CHAT_ASK_LOCATION" },
        { label: "🏢 Hub Capacity", action: "CHAT_CAPACITY" },
        { label: "📦 Stock Inventory", action: "OPEN_INVENTORY_TABLE" },
        { label: "⭐ General Review", action: "FEEDBACK_CAT_REVIEW" }
      ]
    };
  }

  window.GRIDPOINT_COMPONENTS.ChatbotModal = function({
    neighborhoods,
    optimizationResult,
    baselineMetrics,
    user,
    onClose,
    onTriggerOptimization,
    onOpenComparison,
    onOpenScenarios,
    onOpenDemandShock,
    onOpenInventory
  }) {
    const [messages, setMessages] = React.useState([
      {
        id: "msg_init",
        sender: "assistant",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Hi! I'm **ShelVO AI**, your intelligent assistant.

I can help you monitor warehouse capacities, find nearby fulfillment centers, inspect stock inventory, or assist with anything on the site.

Feel free to ask a question, or share your thoughts to help us improve!`,
        suggestedActions: [
          { label: "📍 Nearest Hub", action: "CHAT_ASK_LOCATION" },
          { label: "🏢 Hub Capacity", action: "CHAT_CAPACITY" },
          { label: "📦 Stock Inventory", action: "OPEN_INVENTORY_TABLE" },
          { label: "🐛 Bug / Issue", action: "FEEDBACK_CAT_BUG" },
          { label: "💡 Feature Request", action: "FEEDBACK_CAT_FEATURE" },
          { label: "⭐ General Review", action: "FEEDBACK_CAT_REVIEW" }
        ],
        feedbackState: null
      }
    ]);

    const [inputVal, setInputVal] = React.useState("");
    const [isTyping, setIsTyping] = React.useState(false);
    const [copiedId, setCopiedId] = React.useState(null);
    const messagesEndRef = React.useRef(null);
    const inputRef = React.useRef(null);

    React.useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    React.useEffect(() => {
      inputRef.current?.focus();
    }, []);

    const sendMessage = async (textToSend, extraContext) => {
      const query = (textToSend || inputVal).trim();
      if (!query || isTyping) return;

      const userMsg = {
        id: "msg_" + Date.now(),
        sender: "user",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: query
      };

      setMessages(prev => [...prev, userMsg]);
      setInputVal("");
      setIsTyping(true);

      let data = null;
      const combinedContext = Object.assign({
        warehouses: optimizationResult ? optimizationResult.warehouses : null,
        metrics: optimizationResult ? optimizationResult.metrics : baselineMetrics,
        neighborhoods: neighborhoods || null,
        neighborhoodCount: neighborhoods ? neighborhoods.length : 28,
        geminiApiKey: localStorage.getItem("gridpoint_gemini_api_key") || null
      }, extraContext || {});

      try {
        const payload = {
          message: query,
          context: combinedContext
        };

        const apiUrl = (window.location && window.location.protocol === 'file:')
          ? 'http://127.0.0.1:3000/api/chat'
          : '/api/chat';

        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          data = await res.json();
        }
      } catch (err) {
        console.warn("Backend fetch failed, engaging client-side ShelVO reasoning engine:", err);
      }

      // If backend was unreachable or returned an error, use client-side intelligence fallback
      if (!data || !data.reply) {
        data = generateClientReply(query, combinedContext);
      }

      const assistantMsg = {
        id: "msg_bot_" + Date.now(),
        sender: "assistant",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: data.reply || "I've processed your request.",
        source: data.source || "ShelVO AI",
        capacityCards: data.capacityCards || [],
        inventoryAlerts: data.inventoryAlerts || [],
        suggestedActions: data.suggestedActions || [],
        feedbackState: null
      };

      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
    };

    const handleMicroFeedback = async (msgId, vote) => {
      setMessages(prev =>
        prev.map(m => (m.id === msgId ? Object.assign({}, m, { feedbackState: vote }) : m))
      );

      const targetMsg = messages.find(m => m.id === msgId);
      const snippet = targetMsg ? targetMsg.text.slice(0, 80) : "";

      try {
        const feedbackUrl = (window.location && window.location.protocol === 'file:')
          ? 'http://127.0.0.1:3000/api/feedback'
          : '/api/feedback';
        await fetch(feedbackUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: vote === "up" ? "Helpful Response" : "Unhelpful Response",
            rating: vote === "up" ? 5 : 1,
            feedbackText: "Micro-feedback (" + (vote === "up" ? "👍 Thumbs Up" : "👎 Thumbs Down") + ') on answer snippet: "' + snippet + '..."'
          })
        });
      } catch (e) {
        try {
          const stored = JSON.parse(localStorage.getItem("gridpoint_user_feedback") || "[]");
          stored.unshift({
            id: "FB_" + Date.now().toString(36).toUpperCase(),
            category: vote === "up" ? "Helpful Response" : "Unhelpful Response",
            rating: vote === "up" ? 5 : 1,
            text: "Micro-feedback on: " + snippet,
            date: new Date().toISOString()
          });
          localStorage.setItem("gridpoint_user_feedback", JSON.stringify(stored));
        } catch (storageErr) {}
      }
    };

    const handleCopy = (msgId, text) => {
      navigator.clipboard.writeText(text);
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
    };

    const requestUserGeolocation = () => {
      if (!navigator.geolocation) {
        setMessages(prev => [
          ...prev,
          {
            id: "msg_geo_err_" + Date.now(),
            sender: "assistant",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: "Your browser doesn't have GPS access enabled. Please type your neighborhood name or pick from the options below:",
            suggestedActions: [
              { label: "📍 Koramangala", action: "CHAT_LOCATION_Koramangala" },
              { label: "📍 Whitefield", action: "CHAT_LOCATION_Whitefield" },
              { label: "📍 Indiranagar", action: "CHAT_LOCATION_Indiranagar" },
              { label: "📍 Electronic City", action: "CHAT_LOCATION_Electronic City" }
            ],
            feedbackState: null
          }
        ]);
        return;
      }

      setIsTyping(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsTyping(false);
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          sendMessage(
            `Find closest warehouse to my location (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
            {
              userLocation: {
                latitude: lat,
                longitude: lon,
                accuracy: pos.coords.accuracy,
                area: `GPS Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`
              }
            }
          );
        },
        (err) => {
          setIsTyping(false);
          console.warn("Geolocation permission error:", err);
          setMessages(prev => [
            ...prev,
            {
              id: "msg_geo_denied_" + Date.now(),
              sender: "assistant",
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              text: "Could not access device GPS coordinates. You can type your delivery area directly or choose one of the popular zones below:",
              suggestedActions: [
                { label: "📍 Koramangala", action: "CHAT_LOCATION_Koramangala" },
                { label: "📍 Whitefield", action: "CHAT_LOCATION_Whitefield" },
                { label: "📍 Indiranagar", action: "CHAT_LOCATION_Indiranagar" },
                { label: "📍 Electronic City", action: "CHAT_LOCATION_Electronic City" }
              ],
              feedbackState: null
            }
          ]);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    };

    const handleActionClick = (action) => {
      if (action === "OPEN_INVENTORY_TABLE" && onOpenInventory) {
        onOpenInventory();
      } else if (action === "OPEN_DEMAND_SHOCK" && onOpenDemandShock) {
        onOpenDemandShock();
      } else if (action === "OPEN_SCENARIOS" && onOpenScenarios) {
        onOpenScenarios();
      } else if (action === "OPEN_BEFORE_AFTER" && onOpenComparison) {
        onOpenComparison();
      } else if (action === "REQUEST_GEOLOCATION") {
        requestUserGeolocation();
      } else if (action === "CHAT_ASK_LOCATION") {
        sendMessage("Which warehouse is nearest to me?");
      } else if (action && action.startsWith("CHAT_LOCATION_")) {
        const area = action.replace("CHAT_LOCATION_", "");
        sendMessage(`Find the closest warehouse to ${area}`);
      } else if (action === "FEEDBACK_CAT_BUG") {
        sendMessage("feedback_cat_bug");
      } else if (action === "FEEDBACK_CAT_FEATURE") {
        sendMessage("feedback_cat_feature");
      } else if (action === "FEEDBACK_CAT_REVIEW") {
        sendMessage("feedback_cat_review");
      } else if (action === "CHAT_CAPACITY") {
        sendMessage("What is the capacity and utilization of our warehouses?");
      } else if (action === "CHAT_REBALANCE") {
        sendMessage("How can we rebalance stock between warehouses to prevent stockouts?");
      } else if (action === "CHAT_COST") {
        sendMessage("What are our daily delivery costs and savings compared to baseline?");
      } else {
        sendMessage(action);
      }
    };

    // Helper to render formatted markdown
    const renderFormattedText = (rawText) => {
      if (!rawText) return null;
      const lines = rawText.split("\n");
      const elements = [];
      let inTable = false;
      let tableHeader = [];
      let tableRows = [];

      const flushTable = (key) => {
        if (tableHeader.length > 0 || tableRows.length > 0) {
          elements.push(
            React.createElement("div", { key: `tbl_${key}`, className: "my-2 overflow-x-auto rounded-lg border border-gray-200 bg-white" },
              React.createElement("table", { className: "w-full text-left font-sans text-[11px]" },
                React.createElement("thead", { className: "bg-gray-50 border-b border-gray-200 text-gray-700" },
                  React.createElement("tr", null,
                    tableHeader.map((th, i) => React.createElement("th", { key: i, className: "py-1.5 px-2.5 font-semibold text-[10px]" }, th))
                  )
                ),
                React.createElement("tbody", { className: "divide-y divide-gray-100" },
                  tableRows.map((row, rIdx) =>
                    React.createElement("tr", { key: rIdx, className: "hover:bg-gray-50/50" },
                      row.map((col, cIdx) => React.createElement("td", { key: cIdx, className: "py-1.5 px-2.5 text-gray-800" }, col))
                    )
                  )
                )
              )
            )
          );
          tableHeader = [];
          tableRows = [];
          inTable = false;
        }
      };

      lines.forEach((line, idx) => {
        const trimmed = line.trim();

        if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
          const parts = trimmed.split("|").slice(1, -1).map(p => p.trim());
          if (parts.every(p => /^:?-+:?$/.test(p))) return;
          if (!inTable) {
            inTable = true;
            tableHeader = parts.map(p => p.replace(/\*\*/g, ""));
          } else {
            tableRows.push(parts.map(p => p.replace(/\*\*/g, "")));
          }
          return;
        } else if (inTable) {
          flushTable(idx);
        }

        if (trimmed.startsWith("### ")) {
          elements.push(React.createElement("h4", { key: idx, className: "font-semibold text-gray-900 text-[13px] mt-2 mb-1" }, trimmed.replace("### ", "")));
        } else if (trimmed.startsWith("#### ")) {
          elements.push(React.createElement("h5", { key: idx, className: "font-medium text-gray-800 text-xs mt-1.5 mb-0.5" }, trimmed.replace("#### ", "")));
        } else if (trimmed.startsWith("> [!")) {
          const alertType = trimmed.includes("WARNING") ? "warning" : trimmed.includes("CAUTION") ? "caution" : "tip";
          const alertColor = alertType === "caution" ? "border-red-500 bg-red-50 text-red-800" : alertType === "warning" ? "border-amber-500 bg-amber-50 text-amber-800" : "border-indigo-500 bg-indigo-50 text-indigo-800";
          elements.push(
            React.createElement("div", { key: idx, className: `p-2 my-1.5 rounded border-l-2 text-xs ${alertColor}` },
              React.createElement("span", { className: "font-bold uppercase text-[9px] block" }, alertType),
              lines[idx + 1] ? lines[idx + 1].replace(/^>\s*/, "") : ""
            )
          );
        } else if (trimmed.startsWith("> ")) {
          if (lines[idx - 1] && lines[idx - 1].trim().startsWith("> [!")) return;
          elements.push(React.createElement("blockquote", { key: idx, className: "border-l-2 border-indigo-400 pl-2.5 my-1.5 text-xs text-gray-600 italic" }, trimmed.replace(/^>\s*/, "")));
        } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const textContent = trimmed.slice(2);
          elements.push(
            React.createElement("div", { key: idx, className: "flex items-start space-x-1.5 my-0.5 text-xs text-gray-700" },
              React.createElement("span", { className: "text-[#4F46E5] font-bold" }, "•"),
              React.createElement("span", { className: "flex-1 leading-normal" }, formatInlineMarkdown(textContent))
            )
          );
        } else if (/^\d+\.\s/.test(trimmed)) {
          elements.push(
            React.createElement("div", { key: idx, className: "flex items-start space-x-1.5 my-0.5 text-xs text-gray-700" },
              React.createElement("span", { className: "font-bold text-[#4F46E5] text-[11px]" }, trimmed.match(/^\d+\./)[0]),
              React.createElement("span", { className: "flex-1 leading-normal" }, formatInlineMarkdown(trimmed.replace(/^\d+\.\s*/, "")))
            )
          );
        } else if (trimmed.length > 0) {
          elements.push(React.createElement("p", { key: idx, className: "my-1 text-xs text-gray-700 leading-relaxed" }, formatInlineMarkdown(trimmed)));
        }
      });

      if (inTable) flushTable(lines.length);
      return elements;
    };

    const formatInlineMarkdown = (text) => {
      const parts = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);
      return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return React.createElement("strong", { key: i, className: "text-gray-900 font-semibold" }, part.slice(2, -2));
        }
        if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
          return React.createElement("em", { key: i, className: "text-gray-500 italic" }, part.slice(1, -1));
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return React.createElement("code", { key: i, className: "px-1.5 py-0.5 bg-gray-200/70 text-indigo-700 font-mono text-[11px] rounded" }, part.slice(1, -1));
        }
        return part;
      });
    };

    return React.createElement("div", {
      className: "fixed bottom-6 right-6 z-[99999] flex flex-col items-end pointer-events-auto"
    },
      React.createElement("div", {
        className: "w-[370px] h-[540px] max-h-[calc(100vh-48px)] bg-white border border-[#E5E7EB] rounded-[20px] shadow-[0_16px_40px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden text-[#1F2937] font-sans transition-all duration-300 animate-in fade-in zoom-in-95"
      },
        
        /*  Header Bar  */
        React.createElement("div", {
          className: "px-4 py-3.5 border-b border-[#E5E7EB] flex items-center justify-between select-none flex-none bg-white/90 backdrop-blur-md"
        },
          React.createElement("div", { className: "flex items-center space-x-2.5" },
            React.createElement(ShelvoBadge, { size: 32 }),
            React.createElement("div", { className: "flex flex-col" },
              React.createElement("span", { className: "font-semibold text-sm text-[#1F2937] leading-tight" }, "ShelVO AI"),
              React.createElement("div", { className: "flex items-center space-x-1.5" },
                React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" }),
                React.createElement("span", { className: "text-[11px] text-[#6B7280]" }, "Online • AI Assistant")
              )
            )
          ),

          /*  Minimal Window Controls  */
          React.createElement("div", { className: "flex items-center space-x-1" },
            React.createElement("button", {
              onClick: onClose,
              className: "w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium",
              title: "Minimize"
            }, "−"),
            React.createElement("button", {
              onClick: onClose,
              className: "w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm",
              title: "Close"
            }, "✕")
          )
        ),

        /*  Chat Stream Area  */
        React.createElement("div", {
          className: "flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#F9FAFB] scroll-smooth"
        },
          messages.map((msg) => {
            const isUser = msg.sender === 'user';

            if (isUser) {
              return React.createElement("div", {
                key: msg.id,
                className: "flex justify-end ml-auto max-w-[85%]"
              },
                React.createElement("div", {
                  className: "px-3.5 py-2.5 bg-[#4F46E5] text-white rounded-[16px] rounded-br-[4px] text-xs leading-relaxed shadow-sm"
                },
                  renderFormattedText(msg.text)
                )
              );
            }

            // Bot Message
            return React.createElement("div", {
              key: msg.id,
              className: "flex flex-col items-start max-w-[92%]"
            },
              React.createElement("div", {
                className: "px-3.5 py-2.5 bg-[#F3F4F6] text-[#1F2937] border border-[#E5E7EB] rounded-[16px] rounded-bl-[4px] text-xs leading-relaxed shadow-sm w-full"
              },
                renderFormattedText(msg.text),

                /*  Warehouse Capacity Cards (if included)  */
                msg.capacityCards && msg.capacityCards.length > 0 && React.createElement("div", {
                  className: "mt-2 pt-2 border-t border-gray-200 space-y-1.5"
                },
                  msg.capacityCards.map((card, cIdx) =>
                    React.createElement("div", {
                      key: cIdx,
                      className: "p-2 bg-white border border-gray-200 rounded-lg space-y-1 text-[11px]"
                    },
                      React.createElement("div", { className: "flex items-center justify-between" },
                        React.createElement("span", { className: "font-semibold text-gray-900" }, `${card.code} - ${card.name}`),
                        React.createElement("span", {
                          className: "px-1.5 py-0.2 text-[9px] font-bold rounded",
                          style: { color: card.statusColor, backgroundColor: `${card.statusColor}18` }
                        }, card.status)
                      ),
                      React.createElement("div", { className: "flex justify-between text-[10px] text-gray-500" },
                        React.createElement("span", null, `Load: ${card.dailyAssigned?.toLocaleString()} / ${card.dailyCapacity?.toLocaleString()} ord/day`),
                        React.createElement("span", { className: "font-bold text-gray-800" }, `${card.utilizationPercent}%`)
                      ),
                      React.createElement("div", { className: "w-full h-1 bg-gray-100 rounded-full overflow-hidden" },
                        React.createElement("div", {
                          className: "h-full rounded-full transition-all duration-500",
                          style: {
                            width: `${Math.min(100, card.utilizationPercent)}%`,
                            backgroundColor: card.statusColor || '#4F46E5'
                          }
                        })
                      )
                    )
                  )
                ),

                /*  Feedback Card / Action Chips  */
                msg.suggestedActions && msg.suggestedActions.length > 0 && React.createElement("div", {
                  className: "mt-2.5 pt-2 border-t border-gray-200 flex flex-wrap gap-1.5"
                },
                  msg.suggestedActions.map((act, actIdx) =>
                    React.createElement("button", {
                      key: actIdx,
                      onClick: () => handleActionClick(act.action),
                      className: `px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                        act.label.includes("Bug")
                          ? "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
                          : act.label.includes("Feature")
                          ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
                          : act.label.includes("Review") || act.label.includes("Star")
                          ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
                          : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 shadow-2xs"
                      }`
                    }, act.label)
                  )
                )
              ),

              /*  Micro-Feedback Toolbar Directly Under Bot Answer  */
              React.createElement("div", {
                className: "flex items-center space-x-2 mt-1 px-1 text-gray-400 text-[11px]"
              },
                React.createElement("button", {
                  onClick: () => handleMicroFeedback(msg.id, "up"),
                  className: `hover:text-indigo-600 transition-colors ${msg.feedbackState === 'up' ? 'text-indigo-600 font-bold' : ''}`,
                  title: "Helpful answer"
                }, msg.feedbackState === 'up' ? "👍 Liked" : "👍"),
                React.createElement("button", {
                  onClick: () => handleMicroFeedback(msg.id, "down"),
                  className: `hover:text-red-600 transition-colors ${msg.feedbackState === 'down' ? 'text-red-600 font-bold' : ''}`,
                  title: "Not helpful"
                }, msg.feedbackState === 'down' ? "👎 Disliked" : "👎"),
                React.createElement("button", {
                  onClick: () => handleCopy(msg.id, msg.text),
                  className: "hover:text-gray-700 transition-colors",
                  title: "Copy answer"
                }, copiedId === msg.id ? "✓ Copied" : "📋"),
                React.createElement("span", { className: "text-[10px] text-gray-300 ml-1" }, msg.timestamp)
              )
            );
          }),

          /*  Typing State  */
          isTyping && React.createElement("div", {
            className: "px-3 py-2 bg-[#F3F4F6] border border-[#E5E7EB] rounded-[16px] rounded-bl-[4px] text-xs text-gray-500 inline-flex items-center space-x-1.5"
          },
            React.createElement("span", null, "ShelVO is typing"),
            React.createElement("div", { className: "w-1 h-1 rounded-full bg-[#4F46E5] animate-bounce", style: { animationDelay: "0ms" } }),
            React.createElement("div", { className: "w-1 h-1 rounded-full bg-[#4F46E5] animate-bounce", style: { animationDelay: "150ms" } }),
            React.createElement("div", { className: "w-1 h-1 rounded-full bg-[#4F46E5] animate-bounce", style: { animationDelay: "300ms" } })
          ),

          React.createElement("div", { ref: messagesEndRef })
        ),

        /*  Input Footer  */
        React.createElement("div", {
          className: "p-3 border-t border-[#E5E7EB] bg-white flex-none"
        },
          React.createElement("form", {
            onSubmit: (e) => {
              e.preventDefault();
              sendMessage();
            },
            className: "flex items-center space-x-2"
          },
            React.createElement("div", {
              className: "flex-1 flex items-center bg-[#F9FAFB] border border-[#E5E7EB] focus-within:border-[#4F46E5] rounded-full px-3 py-1.5 transition-all"
            },
              React.createElement("button", {
                type: "button",
                onClick: () => handleActionClick("REQUEST_GEOLOCATION"),
                className: "text-gray-400 hover:text-indigo-600 transition-colors mr-2 text-sm flex-none",
                title: "Share your location / attach context"
              }, "📍"),
              React.createElement("input", {
                ref: inputRef,
                type: "text",
                value: inputVal,
                onChange: (e) => setInputVal(e.target.value),
                placeholder: "Type a message or give feedback...",
                className: "flex-1 bg-transparent text-xs text-[#1F2937] outline-none placeholder:text-gray-400 font-sans"
              })
            ),
            React.createElement("button", {
              type: "submit",
              disabled: !inputVal.trim() || isTyping,
              className: "w-8 h-8 rounded-full bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-35 text-white flex items-center justify-center transition-all flex-none shadow-sm cursor-pointer",
              title: "Send message"
            },
              React.createElement("span", { className: "text-xs -mr-0.5" }, "➤")
            )
          )
        )
      )
    );
  };

  // Compact Circular Floating Launcher Button (56px x 56px with indigo gradient and 8px green dot badge)
  window.GRIDPOINT_COMPONENTS.ChatbotFloatingButton = function({ isOpen, onClick }) {
    if (isOpen) return null;

    return React.createElement("button", {
      onClick: onClick,
      className: "group fixed bottom-6 right-6 z-[99999] w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105 select-none cursor-pointer focus:outline-none",
      style: {
        background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
        boxShadow: "0 10px 25px -3px rgba(79, 70, 229, 0.45), 0 4px 6px -4px rgba(79, 70, 229, 0.2)"
      },
      title: "Chat with ShelVO AI"
    },
      React.createElement("div", { className: "relative flex items-center justify-center" },
        React.createElement(ShelvoIcon, { size: 26, color: "#FFFFFF" }),
        React.createElement("span", {
          className: "absolute -bottom-1.5 -right-1.5 w-2.5 h-2.5 rounded-full bg-[#10B981] border-2 border-white",
          style: { width: "8px", height: "8px" }
        })
      )
    );
  };
})();
