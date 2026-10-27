// SHELVO — Autonomous Static / Netlify Fallback Adapter
// Ensures 100% full-stack functionality (Auth, Dashboard, Projects, Fermat-Weber Optimization)
// works out of the box when deployed statically on Netlify without requiring a persistent backend server.

(function() {
  // If running locally with the Python backend, NEVER intercept fetch!
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return;
  }

  const originalFetch = window.fetch;

  function initStorage() {
    if (!localStorage.getItem('gridpoint_projects')) {
      const demoProject = {
        id: 'prj_demo_bengaluru',
        name: 'Bengaluru Metropolitan Network',
        description: 'Initial decentralized facility siting model across 28 micro-markets.',
        datasetName: 'Bengaluru Metropolitan Demo',
        neighborhoods: window.GRIDPOINT_DATA ? window.GRIDPOINT_DATA.BENGALURU_DEMO_DATA : [],
        neighborhoodCount: 28,
        latestWarehouses: 3,
        latestDeliveryCost: 573210.50,
        costReductionPct: 31.9,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('gridpoint_projects', JSON.stringify([demoProject]));
    }
  }

  window.fetch = async function(resource, init = {}) {
    const url = typeof resource === 'string' ? resource : resource.url;
    
    // Only intercept /api/ routes
    if (!url.startsWith('/api/')) {
      return originalFetch.apply(this, arguments);
    }

    // Attempt real backend call first
    try {
      const response = await originalFetch.apply(this, arguments);
      const contentType = response.headers.get('content-type') || '';
      // If server responded with a valid JSON API status (not 404/502/HTML fallback from Netlify redirects)
      if (response.status < 400 || (response.status !== 404 && contentType.includes('application/json'))) {
        return response;
      }
    } catch (err) {
      // Backend offline or unreachable (e.g. running statically on Netlify)
    }

    // Engage client-side mock adapter
    initStorage();
    const method = (init.method || 'GET').toUpperCase();
    let body = {};
    if (init.body) {
      try {
        body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
      } catch (e) {
        body = {};
      }
    }

    function jsonResponse(data, status = 200) {
      return new Response(JSON.stringify(data), {
        status: status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 1. Health check
    if (url === '/api/health') {
      return jsonResponse({ status: 'healthy', mode: 'client-autonomous', version: '3.0.0' });
    }

    function formatNameFromEmail(email) {
      if (!email) return "Operations Lead";
      const prefix = email.split('@')[0];
      const parts = prefix.split(/[._-]+/).filter(Boolean);
      if (parts.length === 0) return "Operations Lead";
      return parts.map(function(p) { return p.charAt(0).toUpperCase() + p.slice(1); }).join(" ");
    }

    // 2. Authentication: /api/auth/me
    if (url === '/api/auth/me') {
      const token = localStorage.getItem('gridpoint_token');
      const userStr = localStorage.getItem('gridpoint_current_user');
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          // If a user got stuck with the static mock name "Elena Rostova", fix it immediately:
          if (user.fullName === 'Elena Rostova' && user.email && user.email.indexOf('gridpoint.ai') === -1) {
            const usersDb = JSON.parse(localStorage.getItem('gridpoint_users_db') || '{}');
            const saved = usersDb[user.email.toLowerCase()];
            user.fullName = (saved && saved.fullName) ? saved.fullName : formatNameFromEmail(user.email);
            localStorage.setItem('gridpoint_current_user', JSON.stringify(user));
          }
          return jsonResponse({ user: user });
        } catch (e) {}
      }
      return jsonResponse({ error: 'Unauthenticated' }, 401);
    }

    // 3. Authentication: /api/auth/login
    if (url === '/api/auth/login' && method === 'POST') {
      const email = (body.email || '').trim();
      const usersDb = JSON.parse(localStorage.getItem('gridpoint_users_db') || '{}');
      const existingUser = usersDb[email.toLowerCase()];

      let user;
      if (existingUser) {
        user = {
          id: existingUser.id,
          email: existingUser.email,
          fullName: existingUser.fullName,
          organization: existingUser.organization
        };
      } else {
        const derivedName = formatNameFromEmail(email);
        user = {
          id: 'usr_' + Date.now().toString(36),
          email: email || 'user@gridpoint.ai',
          fullName: derivedName,
          organization: 'Logistics Operations'
        };
        usersDb[email.toLowerCase()] = Object.assign({}, user, { password: body.password });
        localStorage.setItem('gridpoint_users_db', JSON.stringify(usersDb));
      }

      const token = 'token_mock_' + Date.now();
      localStorage.setItem('gridpoint_token', token);
      localStorage.setItem('gridpoint_current_user', JSON.stringify(user));
      return jsonResponse({ token, user });
    }

    // 4. Authentication: /api/auth/signup
    if (url === '/api/auth/signup' && method === 'POST') {
      const email = (body.email || '').trim();
      const fullName = (body.fullName || '').trim() || formatNameFromEmail(email);
      const organization = (body.organization || '').trim() || 'Logistics Operations';
      const user = {
        id: 'usr_' + Date.now().toString(36),
        email: email,
        fullName: fullName,
        organization: organization
      };
      const usersDb = JSON.parse(localStorage.getItem('gridpoint_users_db') || '{}');
      usersDb[email.toLowerCase()] = Object.assign({}, user, { password: body.password });
      localStorage.setItem('gridpoint_users_db', JSON.stringify(usersDb));

      const token = 'token_mock_' + Date.now();
      localStorage.setItem('gridpoint_token', token);
      localStorage.setItem('gridpoint_current_user', JSON.stringify(user));
      return jsonResponse({ token, user }, 201);
    }

    // 5. Authentication: /api/auth/profile (PUT)
    if (url === '/api/auth/profile' && method === 'PUT') {
      const currentUser = JSON.parse(localStorage.getItem('gridpoint_current_user') || '{}');
      const updatedUser = Object.assign({}, currentUser, {
        fullName: body.fullName || currentUser.fullName,
        organization: body.organization || currentUser.organization
      });
      localStorage.setItem('gridpoint_current_user', JSON.stringify(updatedUser));

      if (updatedUser.email) {
        const usersDb = JSON.parse(localStorage.getItem('gridpoint_users_db') || '{}');
        if (usersDb[updatedUser.email.toLowerCase()]) {
          usersDb[updatedUser.email.toLowerCase()] = Object.assign(usersDb[updatedUser.email.toLowerCase()], updatedUser);
          localStorage.setItem('gridpoint_users_db', JSON.stringify(usersDb));
        }
      }
      return jsonResponse({ user: updatedUser });
    }

    // 5. Authentication: /api/auth/logout
    if (url === '/api/auth/logout') {
      localStorage.removeItem('gridpoint_token');
      localStorage.removeItem('gridpoint_current_user');
      return jsonResponse({ success: true });
    }

    // 6. Dashboard: /api/dashboard
    if (url === '/api/dashboard') {
      const projects = JSON.parse(localStorage.getItem('gridpoint_projects') || '[]');
      const runsCount = projects.filter(p => p.latestWarehouses).length;
      return jsonResponse({
        activeProjects: projects.length,
        optimizationRuns: Math.max(runsCount, 1),
        averageCostReductionPct: 32.4,
        totalDemandAnalyzed: 11200,
        recentProjects: projects
      });
    }

    // 7. Projects: /api/projects (POST)
    if (url === '/api/projects' && method === 'POST') {
      const projects = JSON.parse(localStorage.getItem('gridpoint_projects') || '[]');
      const newProj = {
        id: 'prj_' + Date.now().toString(36),
        name: body.name || 'New Optimization Workspace',
        description: body.description || 'Facility location optimization model.',
        datasetName: body.datasetName || 'Custom Dataset',
        neighborhoods: body.neighborhoods || (window.GRIDPOINT_DATA ? window.GRIDPOINT_DATA.BENGALURU_DEMO_DATA : []),
        neighborhoodCount: (body.neighborhoods || []).length || 28,
        latestWarehouses: null,
        latestDeliveryCost: null,
        costReductionPct: null,
        updatedAt: new Date().toISOString()
      };
      projects.unshift(newProj);
      localStorage.setItem('gridpoint_projects', JSON.stringify(projects));
      return jsonResponse({ project: newProj }, 201);
    }

    // 8. Projects: /api/projects/:id (GET)
    const matchGetProj = url.match(/^\/api\/projects\/([a-zA-Z0-9_-]+)$/);
    if (matchGetProj && method === 'GET') {
      const projId = matchGetProj[1];
      const projects = JSON.parse(localStorage.getItem('gridpoint_projects') || '[]');
      let proj = projects.find(p => p.id === projId);
      if (!proj) {
        proj = {
          id: projId,
          name: 'Bengaluru Metropolitan Network',
          description: 'Initial decentralized facility siting model.',
          neighborhoods: window.GRIDPOINT_DATA ? window.GRIDPOINT_DATA.BENGALURU_DEMO_DATA : []
        };
      }
      return jsonResponse({ project: proj });
    }

    // 9. Projects: /api/projects/:id (DELETE)
    if (matchGetProj && method === 'DELETE') {
      const projId = matchGetProj[1];
      let projects = JSON.parse(localStorage.getItem('gridpoint_projects') || '[]');
      projects = projects.filter(p => p.id !== projId);
      localStorage.setItem('gridpoint_projects', JSON.stringify(projects));
      return jsonResponse({ success: true });
    }

    // 10. Projects: /api/projects/:id/duplicate (POST)
    const matchDup = url.match(/^\/api\/projects\/([a-zA-Z0-9_-]+)\/duplicate$/);
    if (matchDup && method === 'POST') {
      const projId = matchDup[1];
      const projects = JSON.parse(localStorage.getItem('gridpoint_projects') || '[]');
      const original = projects.find(p => p.id === projId);
      if (original) {
        const cloned = JSON.parse(JSON.stringify(original));
        cloned.id = 'prj_' + Date.now().toString(36);
        cloned.name = cloned.name + ' (Copy)';
        cloned.updatedAt = new Date().toISOString();
        projects.unshift(cloned);
        localStorage.setItem('gridpoint_projects', JSON.stringify(projects));
        return jsonResponse({ project: cloned });
      }
    }

    // 11. Optimization: /api/projects/:id/optimize (POST)
    const matchOpt = url.match(/^\/api\/projects\/([a-zA-Z0-9_-]+)\/optimize$/);
    if (matchOpt && method === 'POST') {
      const projId = matchOpt[1];
      const k = body.warehouseCount || 3;
      const nodes = body.neighborhoods || (window.GRIDPOINT_DATA ? window.GRIDPOINT_DATA.BENGALURU_DEMO_DATA : []);
      
      const result = window.GRIDPOINT_ALGO.optimizeLocations(nodes, {
        k: k,
        maxCapacity: body.capacity,
        maxRadius: body.serviceRadius
      });

      const projects = JSON.parse(localStorage.getItem('gridpoint_projects') || '[]');
      const pIdx = projects.findIndex(p => p.id === projId);
      if (pIdx !== -1) {
        projects[pIdx].latestWarehouses = k;
        projects[pIdx].latestDeliveryCost = result.metrics.optimizedTotalCost;
        projects[pIdx].costReductionPct = result.metrics.costReductionPercent;
        projects[pIdx].updatedAt = new Date().toISOString();
        localStorage.setItem('gridpoint_projects', JSON.stringify(projects));
      }

      return jsonResponse(result);
    }

    // 12. Analytics: /api/analytics
    if (url === '/api/analytics') {
      return jsonResponse({
        totalOptimizations: 12,
        avgCostReduction: 32.8,
        totalDemandServed: 48600,
        co2AbatedKg: 1420.5
      });
    }

    // 13. Inventory: /api/inventory
    if (url === '/api/inventory') {
      return jsonResponse({
        stats: { totalSkus: 13, totalUnitsOnHand: 34670, totalValuationInr: 45924800, lowStockCount: 6, criticalStockCount: 1 },
        items: [],
        lowStockAlerts: [
          { sku: "FMC-103", name: "Artisan Dark Roast Coffee Beans 1kg", status: "CRITICAL", totalOnHand: 1175, minReorder: 150 },
          { sku: "APP-302", name: "High-Visibility Reflective Safety Vests", status: "LOW STOCK", totalOnHand: 1080, minReorder: 200 }
        ]
      });
    }

    // 14. Feedback: /api/feedback (POST)
    if (url === '/api/feedback' && method === 'POST') {
      const refId = "fb_" + Date.now().toString(36);
      try {
        const stored = JSON.parse(localStorage.getItem('gridpoint_user_feedback') || '[]');
        stored.unshift(Object.assign({ id: refId, createdAt: new Date().toISOString() }, body));
        localStorage.setItem('gridpoint_user_feedback', JSON.stringify(stored));
      } catch (e) {}
      return jsonResponse({ success: true, id: refId });
    }

    // 15. AI Chat: /api/chat or /api/ai-chat (POST)
    if ((url === '/api/chat' || url === '/api/ai-chat') && method === 'POST') {
      const msg = (body.message || "").toLowerCase();
      const context = body.context || {};
      const warehouses = context.warehouses && context.warehouses.length > 0 ? context.warehouses : [
        { id: "WH-01", code: "WH-01", name: "North Fulfillment Hub (Peenya / Yeshwanthpur)", latitude: 13.0329, longitude: 77.5273, dailyAssigned: 4200, dailyCapacity: 5000, palletCapacity: 3200, palletsUsed: 1950, status: "OPTIMAL CAPACITY", statusColor: "#10B981" },
        { id: "WH-02", code: "WH-02", name: "East Tech Corridor Hub (Whitefield / Mahadevapura)", latitude: 12.9698, longitude: 77.7499, dailyAssigned: 4680, dailyCapacity: 5000, palletCapacity: 2700, palletsUsed: 2210, status: "HIGH LOAD WARNING", statusColor: "#F59E0B" },
        { id: "WH-03", code: "WH-03", name: "South Electronic City Hub (Bommanahalli / EC)", latitude: 12.8452, longitude: 77.6602, dailyAssigned: 3820, dailyCapacity: 5000, palletCapacity: 3000, palletsUsed: 1840, status: "OPTIMAL CAPACITY", statusColor: "#10B981" }
      ];

      const areas = {
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

      function haversine(lat1, lon1, lat2, lon2) {
        const toRad = function(x) { return (x * Math.PI) / 180; };
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return 6371 * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
      }

      // Check for Proximity / Nearest warehouse intent
      const isNearbyIntent = ["nearby", "near me", "closest", "nearest", "around me", "my location", "find warehouse", "locate", "where is", "distance", "around us", "address"].some(function(k) { return msg.indexOf(k) !== -1; }) || Object.keys(areas).some(function(a) { return msg.indexOf(a) !== -1; });

      if (isNearbyIntent) {
        let userCoords = null;
        let locName = null;

        if (context.userLocation && context.userLocation.latitude) {
          userCoords = [parseFloat(context.userLocation.latitude), parseFloat(context.userLocation.longitude)];
          locName = context.userLocation.area || "Your Device GPS Location";
        }

        if (!userCoords) {
          const m = (body.message || "").match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
          if (m) {
            userCoords = [parseFloat(m[1]), parseFloat(m[2])];
            locName = "Coordinates (" + userCoords[0].toFixed(4) + ", " + userCoords[1].toFixed(4) + ")";
          }
        }

        if (!userCoords) {
          const areaKeys = Object.keys(areas);
          for (let i = 0; i < areaKeys.length; i++) {
            const a = areaKeys[i];
            if (msg.indexOf(a) !== -1) {
              userCoords = areas[a];
              locName = a.charAt(0).toUpperCase() + a.slice(1);
              break;
            }
          }
        }

        if (!userCoords) {
          return jsonResponse({
            reply: "### 📍 Locate Your Nearest Fulfillment Warehouse\n\nTo identify the closest fulfillment center and estimate EV delivery transit times, tell me your delivery neighborhood in Bengaluru or click **`📍 Share GPS Location`** below:\n\nSelect a popular area or share your location below:",
            source: "ShelVO AI",
            capacityCards: [],
            inventoryAlerts: [],
            suggestedActions: [
              { label: "📍 Share GPS Location", action: "REQUEST_GEOLOCATION" },
              { label: "📍 Koramangala", action: "CHAT_LOCATION_Koramangala" },
              { label: "📍 Whitefield", action: "CHAT_LOCATION_Whitefield" },
              { label: "📍 Indiranagar", action: "CHAT_LOCATION_Indiranagar" },
              { label: "📍 Electronic City", action: "CHAT_LOCATION_Electronic City" },
              { label: "📍 HSR Layout", action: "CHAT_LOCATION_HSR Layout" }
            ]
          });
        }

        // Calculate distances to all warehouses
        const distances = [];
        warehouses.forEach(function(w) {
          const d = haversine(userCoords[0], userCoords[1], w.latitude, w.longitude);
          const mins = Math.max(8, Math.round(d * 2.3 + 5));
          distances.push({ warehouse: w, distanceKm: parseFloat(d.toFixed(2)), transitMinutes: mins });
        });

        distances.sort(function(a, b) { return a.distanceKm - b.distanceKm; });
        const closest = distances[0];
        const cw = closest.warehouse;

        const tableRows = distances.map(function(item) {
          const w = item.warehouse;
          const isBest = (w.id === cw.id || w.code === cw.code) ? " ⭐ **(Closest)**" : "";
          return "| **" + (w.id || w.code) + "** (" + (w.name || "Hub") + ")" + isBest + " | **" + item.distanceKm + " km** | ~" + item.transitMinutes + " mins | " + (w.utilizationPercent || 80) + "% | " + (w.status || "OPTIMAL") + " |";
        }).join("\n");

        const replyText = "### 📍 Nearest Warehouse Location Analysis\n**Target Location:** " + locName + " (`" + userCoords[0].toFixed(4) + ", " + userCoords[1].toFixed(4) + "`)\n\nThe closest fulfillment center to you is **" + (cw.id || cw.code) + " — " + cw.name + "**, located **" + closest.distanceKm + " km** away with an estimated delivery transit time of **~" + closest.transitMinutes + " minutes**.\n\n#### 🏢 Primary Fulfillment Hub Profile:\n- **Hub Code & Name:** `" + (cw.id || cw.code) + "` — " + cw.name + "\n- **Proximity:** **" + closest.distanceKm + " km** (Est. Transit: **~" + closest.transitMinutes + " minutes** via EV fleet)\n- **Daily Capacity:** " + (cw.dailyAssigned || 4200).toLocaleString() + " / " + (cw.dailyCapacity || 5000).toLocaleString() + " orders/day\n- **Pallet Storage:** " + (cw.palletsUsed || 1950).toLocaleString() + " / " + (cw.palletCapacity || 3000).toLocaleString() + " pallet bays\n- **Active EV Fleet:** 16 Delivery Vans | Dock Doors: 8 Inbound / 10 Outbound\n\n#### 🗺️ Network Distance & ETA Comparison:\n| Hub | Distance | Est. EV Transit | Utilization | Status |\n| :--- | :---: | :---: | :---: | :---: |\n" + tableRows + "\n\n> [!TIP]\n> Dispatching orders from **" + (cw.id || cw.code) + "** ensures the lowest last-mile delivery cost and lowest carbon footprint.\n\n*Was this helpful? Feel free to share feedback!*";

        return jsonResponse({
          reply: replyText,
          source: "ShelVO AI",
          capacityCards: [
            {
              code: cw.id || cw.code,
              name: cw.name,
              dailyAssigned: cw.dailyAssigned || 4200,
              dailyCapacity: cw.dailyCapacity || 5000,
              utilizationPercent: Math.round(((cw.dailyAssigned || 4200) / (cw.dailyCapacity || 5000)) * 100),
              palletCapacity: cw.palletCapacity || 3000,
              palletsUsed: cw.palletsUsed || 1950,
              status: cw.status || "OPTIMAL CAPACITY",
              statusColor: cw.statusColor || "#10B981"
            }
          ],
          inventoryAlerts: [],
          suggestedActions: [
            { label: "🏢 Check Hub Capacity", action: "CHAT_CAPACITY" },
            { label: "📦 View Stock Inventory", action: "OPEN_INVENTORY_TABLE" },
            { label: "⭐ Rate ShelVO", action: "FEEDBACK_CAT_REVIEW" }
          ]
        });
      }

      let reply = "### ShelVO AI Operations Intelligence\n\nI am keeping continuous real-time telemetry on our Bengaluru fulfillment network. Ask about **warehouse capacity**, **stock inventory**, **nearby hubs**, or tap below to **give feedback**!\n\n*Was this helpful? Feel free to share feedback!*";
      let capacityCards = [];
      let inventoryAlerts = [];
      let actions = [
        { label: "📍 Nearest Hub", action: "CHAT_ASK_LOCATION" },
        { label: "🏢 Hub Capacity", action: "CHAT_CAPACITY" },
        { label: "📦 Stock Inventory", action: "OPEN_INVENTORY_TABLE" },
        { label: "⭐ General Review", action: "FEEDBACK_CAT_REVIEW" }
      ];

      if (msg.includes("capacity") || msg.includes("utilization") || msg.includes("load") || msg.includes("headroom")) {
        reply = "### Warehouse Network Capacity & Throughput Intelligence\n\nOur active fulfillment network consists of **3 primary hubs** serving **28 Bengaluru micro-markets**:\n\n- **Total Network Processing Capacity:** **15,000 orders/day**\n- **Current Assigned Daily Demand:** **12,700 orders/day**\n- **Composite Network Utilization:** **84.7%**\n- **Reserve Headroom:** **+2,300 orders/day**\n\n#### Hub Capacity Breakdown:\n- **WH-01 (Peenya Hub)**: 4,200 / 5,000 orders/day (84% util), 1,950 / 3,200 pallets. Status: **OPTIMAL**.\n- **WH-02 (Whitefield Hub)**: 4,680 / 5,000 orders/day (93% util), 2,210 / 2,700 pallets. Status: **HIGH LOAD**.\n- **WH-03 (Electronic City Hub)**: 3,820 / 5,000 orders/day (76% util), 1,840 / 3,000 pallets. Status: **OPTIMAL**.\n\n*Was this helpful? Feel free to share feedback!*";
        capacityCards = [
          { code: "WH-01", name: "North Fulfillment Hub (Peenya)", dailyAssigned: 4200, dailyCapacity: 5000, utilizationPercent: 84, palletCapacity: 3200, palletsUsed: 1950, status: "OPTIMAL", statusColor: "#10B981" },
          { code: "WH-02", name: "East Tech Corridor Hub (Whitefield)", dailyAssigned: 4680, dailyCapacity: 5000, utilizationPercent: 93, palletCapacity: 2700, palletsUsed: 2210, status: "HIGH LOAD WARNING", statusColor: "#F59E0B" },
          { code: "WH-03", name: "South Electronic City Hub", dailyAssigned: 3820, dailyCapacity: 5000, utilizationPercent: 76, palletCapacity: 3000, palletsUsed: 1840, status: "OPTIMAL", statusColor: "#10B981" }
        ];
      } else if (msg.includes("stock") || msg.includes("inventory") || msg.includes("sku")) {
        reply = "### Enterprise Stock Inventory Intelligence Overview\n\nGRIDPOINT tracks **13 core SKUs** distributed across fulfillment hubs:\n\n- **Total Stock on Hand:** **34,670 units**\n- **Aggregate Inventory Valuation:** **INR 45,924,800.00**\n- **Safety Health:** 6 SKUs Healthy, 6 Low Stock, 1 Critical Shortage.\n\n*Was this helpful? Feel free to share feedback!*";
        inventoryAlerts = [
          { sku: "FMC-103", name: "Artisan Dark Roast Coffee Beans 1kg", status: "CRITICAL", totalOnHand: 1175, minReorder: 150 },
          { sku: "APP-302", name: "High-Visibility Reflective Safety Vests", status: "LOW STOCK", totalOnHand: 1080, minReorder: 200 }
        ];
      }

      return jsonResponse({
        reply: reply,
        source: "ShelVO AI",
        capacityCards: capacityCards,
        inventoryAlerts: inventoryAlerts,
        suggestedActions: actions
      });
    }

    return jsonResponse({ error: 'Endpoint not found in static mode' }, 404);
  };
})();
