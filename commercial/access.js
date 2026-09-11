"use strict";

(async () => {
  const gate = document.createElement("section");
  gate.id = "accessGate";
  gate.innerHTML = '<h1>Commercial Calculator Access</h1><p id="accessMessage">Checking your membership access…</p><p><a href="../member-dashboard.html">Return to Member Dashboard</a></p>';
  document.body.prepend(gate);

  const message = document.getElementById("accessMessage");
  const client = window.supabase.createClient(
    "https://oaqehddiqtgplxydxbxv.supabase.co",
    "sb_publishable_o_3xMc9QOsgV-8kqBFkLnw_tuvUyWD8",
    { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
  );

  fetch("https://loadcalcpro-hcml-api.onrender.com/health", {
    method: "GET", mode: "no-cors", cache: "no-store", keepalive: true
  }).catch(() => {});

  try {
    const { data } = await client.auth.getSession();
    if (!data.session) {
      message.textContent = "Please sign in through the Member Dashboard to use the Commercial calculator.";
      return;
    }

    const response = await fetch("https://loadcalcpro-hcml-api.onrender.com/api/v2/access", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.session.access_token}`
      },
      body: JSON.stringify({ calculator: "commercial" })
    });
    const result = await response.json();
    if (response.ok && result.active === true && result.commercial_access === true) {
      gate.remove();
      document.getElementById("accessStyles").remove();
      return;
    }
    message.textContent = "Commercial calculator access is not active for this account.";
  } catch {
    message.textContent = "We could not verify Commercial calculator access. Please return to the Member Dashboard and try again.";
  }
})();
