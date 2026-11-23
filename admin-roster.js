(() => {
  "use strict";
  const el = id => document.getElementById(id);
  const cfg = window.FSA_ROSTER_CONFIG || {};
  const currency = cents => new Intl.NumberFormat("en-US", { style:"currency", currency:"USD" }).format((Number(cents)||0)/100);
  const day = value => value ? new Date(value).toLocaleDateString("en-US", {month:"short",day:"numeric",year:"numeric"}) : "—";
  const statusLabels = Object.freeze({paid:"PAID",partial:"PARTIAL",unpaid:"UNPAID",unassigned:"PLAN NEEDED",review:"REVIEW"});
  const planOptions = Object.freeze({indoor:"Indoor · $150",outdoor:"Outdoor · $275",combined:"Indoor + outdoor · $300"});
  const show = (id, visible) => { el(id).hidden = !visible; };
  let api = null, user = null, roster = [], review = [], loaded = false, locked = false, isPasswordRecovery = false;

  function notify(text) {
    el("message").textContent = text || "";
    show("message", Boolean(text));
  }
  function cell(tr, text, klass) {
    const td = document.createElement("td");
    td.textContent = text == null ? "" : String(text);
    if (klass) td.className = klass;
    tr.append(td);
    return td;
  }
  function safeValue(x) { return String(x ?? "").toLowerCase(); }
  function status(r) {
    if (r.flaggedAmount > 0) return "review";
    if (!r.plan) return r.paid > 0 ? "partial" : "unassigned";
    if (r.paid >= r.total && r.total > 0) return "paid";
    if (r.paid > 0) return "partial";
    return "unpaid";
  }
  function formatPlan(plan) { return plan && planOptions[plan] ? planOptions[plan] : "Not assigned"; }
  function visibleRows() {
    const query = safeValue(el("search").value.trim()), filter = el("filter").value;
    const view = el("archive-view").value;
    return roster.filter(r => {
      const archiveMatch = view === "all" || (view === "active" ? !r.archived : r.archived);
      const match = filter === "all" || status(r) === filter;
      return archiveMatch && match && (!query ||
        [r.first_name,r.last_name,r.guardian_name,r.email,r.phone].some(value => safeValue(value).includes(query)));
    });
  }
  function render() {
    if (!loaded) return;
    const tbody = el("roster-body");
    tbody.replaceChildren();
    const filtered = visibleRows();
    for (const athlete of filtered) {
      const row = document.createElement("tr");
      const name = cell(row, (athlete.first_name||"") + " " + (athlete.last_name||""));
      name.style.fontWeight = "850";
      const archiveButton = document.createElement("button");
      archiveButton.type = "button";
      archiveButton.className = "archive-action";
      archiveButton.textContent = athlete.archived ? "Restore entry" : "Archive entry";
      archiveButton.setAttribute("aria-label", archiveButton.textContent + " for " + athlete.first_name + " " + athlete.last_name);
      if (!athlete.archived && (athlete.paid > 0 || athlete.flaggedAmount > 0)) {
        archiveButton.disabled = true;
        archiveButton.title = "This registration has a verified or flagged payment. Do not archive it without payment review.";
      }
      archiveButton.addEventListener("click", async () => {
        if (locked) return;
        const originalState = Boolean(athlete.archived);
        if (!originalState && !window.confirm("Archive " + athlete.first_name + " " + athlete.last_name + "? This removes the entry from the active roster but keeps the registration for restoration.")) return;
        locked = true;
        archiveButton.disabled = true;
        notify(originalState ? "Restoring roster entry…" : "Archiving roster entry…");
        try {
          const operation = originalState
            ? api.from("roster_archives").delete().eq("registration_id", athlete.id).select("registration_id").single()
            : api.from("roster_archives").insert({registration_id: athlete.id}).select("registration_id").single();
          const response = await operation;
          if (response.error || response.data?.registration_id !== athlete.id) throw response.error || Error("No matching record was changed");
          athlete.archived = !originalState;
          render();
          notify(originalState ? "Entry restored to the active roster." : "Entry archived. Use Archived entries to restore it.");
        } catch {
          notify("Unable to change this entry. Your roster was not updated; refresh and check staff access.");
        } finally {
          locked = false;
          render();
        }
      });
      name.append(archiveButton);
      const guardian = cell(row, athlete.guardian_name||"—");
      const contact = document.createElement("div");
      contact.className = "muted";
      contact.textContent = [athlete.email,athlete.phone].filter(Boolean).join(" · ");
      guardian.append(contact);

      const planCell = cell(row,"");
      const container = document.createElement("div"); container.className = "plan-control";
      const select = document.createElement("select");
      select.setAttribute("aria-label","Season package for "+athlete.first_name+" "+athlete.last_name);
      const none = document.createElement("option");none.value="";none.textContent="Select season";select.append(none);
      for (const [value,label] of Object.entries(planOptions)) {
        const option = document.createElement("option");option.value=value;option.textContent=label;select.append(option);
      }
      select.value = athlete.plan || "";
      const save = document.createElement("button");
      save.type = "button"; save.className = "button dark"; save.textContent = "Save"; save.disabled = true;
      select.addEventListener("change", () => {save.disabled = !select.value || select.value === (athlete.plan||"");});
      save.addEventListener("click", async () => {
        const chosen = select.value;
        if (!planOptions[chosen] || locked || chosen === athlete.plan) return;
        locked = true; save.disabled = true;select.disabled = true;
        notify("Saving "+athlete.first_name+"'s season package…");
        try {
          const result = await api.from("roster_dues")
            .upsert({registration_id:athlete.id,plan:chosen},{onConflict:"registration_id"})
            .select("registration_id,plan,total_due_cents").single();
          if (result.error) throw result.error;
          athlete.plan = result.data.plan;
          athlete.total = result.data.total_due_cents;
          notify("Season package saved. The balance has been recalculated from verified payments.");
        } catch {
          notify("Could not save the plan. It has not been changed. Check staff access and try again.");
        } finally {
          locked = false; render();
        }
      });
      if (athlete.archived) { select.disabled = true; save.disabled = true; }
      container.append(select,save);planCell.append(container);
      if (athlete.flaggedAmount > 0) {
        const hint = document.createElement("small");hint.className="tiny";
        hint.textContent = "Payment flagged for review";
        planCell.append(hint);
      }
      cell(row,currency(athlete.paid),"money");
      cell(row,athlete.plan?currency(Math.max(0,athlete.total-athlete.paid)):"Not set","money");
      const payment = cell(row,"");
      const label = document.createElement("span");label.className="status "+status(athlete);
      label.textContent = statusLabels[status(athlete)];payment.append(label);
      const clearance = cell(row,athlete.staff_clearance || "pending");
      const registered = document.createElement("div");
      registered.className = "tiny";registered.textContent = day(athlete.created_at);clearance.append(registered);
      tbody.append(row);
    }
    show("roster-empty", filtered.length===0);
    const active = roster.filter(r=>!r.archived);
    const verified = active.reduce((total,r)=>total+r.paid,0);
    const assigned = active.filter(r=>r.plan);
    const balance = assigned.reduce((total,r)=>total+Math.max(0,r.total-r.paid),0);
    const unassigned = active.length-assigned.length;
    el("athlete-count").textContent=String(active.length);
    el("paid-count").textContent=String(active.filter(r=>status(r)==="paid").length);
    el("collected-total").textContent=currency(verified);
    el("balance-total").textContent=currency(balance);
    el("roster-note").textContent = active.length + " active entry/entries; " + (roster.length - active.length) + " archived. " + unassigned + " active athlete(s) do not yet have an assigned package. Balances exclude unassigned packages; payments must be Stripe-verified. Use Archived entries to restore a removed row.";

    const issueBody=el("unmatched-body");issueBody.replaceChildren();
    for (const item of review) {
      const tr = document.createElement("tr");
      cell(tr,item.identifier);cell(tr,item.reason);cell(tr,day(item.when));cell(tr,"Contact staff for verification.");
      issueBody.append(tr);
    }
    show("unmatched-empty",review.length===0);
  }
  function calculate(registrations,payments,plans,flags,issues,archives) {
    const flagged = new Set(flags.map(x=>x.payment_intent_id).filter(Boolean));
    const archiveIds = new Set(archives.map(x=>x.registration_id));
    const byId = new Map(registrations.map(r=>[r.id,{...r,paid:0,flaggedAmount:0,plan:null,total:null,archived:archiveIds.has(r.id)}]));
    const due = new Map(plans.map(x=>[x.registration_id,x]));
    const warnings=[];
    for (const pay of payments) {
      const reg = byId.get(pay.registration_id);
      if (!reg) {
        warnings.push({identifier:pay.session_id,reason:"Payment not linked to an active registration",when:pay.verified_at});
        continue;
      }
      if (flagged.has(pay.payment_intent_id)) {reg.flaggedAmount+=Number(pay.amount_cents)||0;continue;}
      reg.paid += Number(pay.amount_cents)||0;
    }
    for (const r of byId.values()) {
      const selected=due.get(r.id);
      if (selected && planOptions[selected.plan]) {
        r.plan=selected.plan;
        r.total=Number(selected.total_due_cents)||0;
      }
    }
    for (const x of flags) {
      warnings.push({identifier:x.payment_intent_id||"Flagged payment",reason:x.reason||"Refund or dispute flagged",when:x.updated_at});
    }
    for (const x of issues) {
      warnings.push({identifier:x.event_id||"Webhook issue",reason:x.reason||"Requires review",when:x.created_at});
    }
    return {roster:Array.from(byId.values()),review:warnings};
  }
  async function fetchAll(table,columns,filter) {
    let request=api.from(table).select(columns).limit(1000);
    if (filter) request=filter(request);
    const {data,error}=await request;
    if (error) throw error;
    if ((data||[]).length>=1000) throw Error("Roster exceeds the safe 1,000-record view limit. Contact the administrator for pagination.");
    return data||[];
  }
  async function load() {
    if (!api || locked) return;
    loaded=false;show("roster-panel",false);show("auth-panel",false);
    notify("Verifying your staff account and loading the private roster…");
    try {
      const check=await api.auth.getUser();
      if (check.error || !check.data?.user) throw Error("Sign in again to continue.");
      user=check.data.user;
      const auth=await api.rpc("roster_staff_authorized");
      if (auth.error) throw auth.error;
      if (auth.data!==true) {
        notify("This account is not approved to view the private athlete roster.");
        await api.auth.signOut();show("auth-panel",true);return;
      }
      const [registrations,payments,plans,flags,issues,archives]=await Promise.all([
        fetchAll("roster_registrations","id,first_name,last_name,guardian_name,email,phone,program,season,staff_clearance,created_at", q=>q.eq("season","2027")),
        fetchAll("roster_payments","session_id,registration_id,payment_intent_id,payment_link_id,kind,amount_cents,verified_at"),
        fetchAll("roster_dues","registration_id,plan,total_due_cents"),
        fetchAll("roster_payment_flags","payment_intent_id,reason,updated_at"),
        fetchAll("roster_issues","event_id,reason,created_at,resolved_at", q=>q.is("resolved_at",null)),
        fetchAll("roster_archives","registration_id,archived_at")
      ]);
      const computed=calculate(registrations,payments,plans,flags,issues,archives);
      roster=computed.roster;review=computed.review;
      user = check.data.user;loaded=true;
      el("staff-email").textContent="Signed in as "+user.email;
      show("roster-panel",true);notify("");
      render();
      if (isPasswordRecovery) {
        el("security-details").open = true;
        notify("You're signed in through account recovery. Set a new personal password below.");
      }
    } catch(err) {
      notify("The secure roster could not load. " + (err?.message||"Please contact the site administrator."));
      show("auth-panel",true);
    }
  }
  function csvEscape(value) {
    let s=String(value??"");
    if (/^[=+\-@\t\r]/.test(s)) s="'"+s;
    return '"'+s.replace(/"/g,'""')+'"';
  }
  function exportCsv() {
    if (!loaded)return;
    const headers=["Athlete first name","Athlete last name","Guardian","Guardian email","Guardian phone","Season","Plan","Verified paid USD","Unresolved flagged USD","Outstanding USD","Payment status","Enrollment clearance","Registered","Roster state"];
    const data=visibleRows().map(r=>[
      r.first_name,r.last_name,r.guardian_name,r.email,r.phone,r.season,formatPlan(r.plan),
      (r.paid/100).toFixed(2),(r.flaggedAmount/100).toFixed(2),
      r.plan?(Math.max(0,r.total-r.paid)/100).toFixed(2):"",
      status(r),r.staff_clearance,r.created_at,r.archived ? "Archived" : "Active"
    ]);
    const text=[headers,...data].map(row=>row.map(csvEscape).join(",")).join("\r\n");
    const url=URL.createObjectURL(new Blob([text],{type:"text/csv;charset=utf-8"}));
    const link=document.createElement("a");link.href=url;link.download="Florida-Speed-Academy-Private-Roster-2027.csv";
    document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    notify("Exported "+data.length+" visible roster records. Keep this CSV private.");
  }
  async function init() {
    if (!cfg.supabaseUrl?.startsWith("https://") || !cfg.supabasePublishableKey?.startsWith("sb_publishable_") || !window.supabase?.createClient) {
      show("setup-panel",true);return;
    }
    api=window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
    });
    api.auth.onAuthStateChange((event,session)=>{
      if (event==="SIGNED_OUT") {
        user=null;roster=[];review=[];loaded=false;
        show("roster-panel",false);show("auth-panel",true);
      }
      if (event==="PASSWORD_RECOVERY") {
        isPasswordRecovery = true;
        if (session?.user) setTimeout(load,0);
      }
      if (event==="SIGNED_IN" && session?.user) setTimeout(load,0);
    });
    const session=await api.auth.getSession();
    if (session.data?.session) await load();
    else show("auth-panel",true);
  }
  el("login-form").addEventListener("submit",async e=>{
    e.preventDefault(); if (!api)return;
    const email=el("admin-email").value.trim().toLowerCase();
    const password=el("admin-password").value;
    if (!email || !password)return;
    const button=el("login-form").querySelector("button[type=submit]");
    button.disabled=true;notify("Checking your private login…");
    try {
      const {error}=await api.auth.signInWithPassword({email,password});
      if (error)throw error;
      el("admin-password").value="";
      notify("Login verified. Loading your private roster…");
      await load();
    } catch(error) {
      const code=String(error?.code||"").toLowerCase(),status=Number(error?.status||0);
      const msg=String(error?.message||"").toLowerCase();
      if (status===429 || code.includes("rate_limit")) notify("Too many login attempts. Please allow the security limit to reset before trying again.");
      else if (code==="invalid_credentials" || msg.includes("invalid login credentials")) notify("Email or password not recognized. If you haven't created your personal password yet, use 'Forgot or need to set password?' below.");
      else if (msg.includes("email not confirmed")) notify("Your account email must be confirmed before you can sign in.");
      else notify("Could not sign in. Check your internet connection and the admin account information.");
    } finally {button.disabled=false;el("admin-password").value="";}
  });
  el("forgot-password").addEventListener("click",async()=>{
    if(!api)return;
    const email=el("admin-email").value.trim().toLowerCase();
    if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
      notify("Enter your account email first, then choose password recovery.");
      return;
    }
    const button=el("forgot-password");button.disabled=true;
    notify("Requesting a secure password-setup email…");
    try {
      const {error}=await api.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+"/admin-roster.html"});
      if(error)throw error;
      notify("If this email belongs to an authorized account, check your inbox for a password-recovery link. When you return, open 'Personal login settings' to set your password.");
    } catch(error){
      const code=String(error?.code||"").toLowerCase(),status=Number(error?.status||0),msg=String(error?.message||"").toLowerCase();
      if(status===429||code.includes("rate_limit")||msg.includes("rate limit")){
        notify("Supabase has temporarily reached its email limit. No new reset email was sent. If you're already signed in on another tab, you can set your password under Personal login settings without email.");
      } else notify("Password setup email could not be sent. Check your Supabase Auth email settings or try using an existing signed-in session.");
    } finally {button.disabled=false;}
  });
  el("password-form").addEventListener("submit",async e=>{
    e.preventDefault();if(!api || !loaded || !user)return;
    const password=el("new-password").value;
    const confirmed=el("confirm-password").value;
    if(password.length<12){notify("Choose a password with at least 12 characters.");return;}
    if(password!==confirmed){notify("Your passwords do not match.");return;}
    const button=el("password-form").querySelector("button[type=submit]");button.disabled=true;
    notify("Saving your personal login password securely…");
    try {
      const check=await api.rpc("roster_staff_authorized");
      if(check.error || check.data!==true) throw Error("not authorized");
      const {error}=await api.auth.updateUser({password});
      if(error)throw error;
      isPasswordRecovery=false;
      el("new-password").value="";el("confirm-password").value="";
      el("security-details").open=false;
      notify("Personal password saved. You can now sign into your roster using your email and password without requesting a login link.");
    }catch(error){
      const msg=String(error?.message||"").toLowerCase();
      if(msg.includes("reauthentication")||msg.includes("reauthenticate")||msg.includes("nonce")){
        notify("Supabase requires a fresh verification before changing your password. Use 'Forgot or need to set password?' on the login page when email sending is available.");
      } else if(msg.includes("weak") || msg.includes("password")){
        notify("Supabase rejected that password. Try a stronger, unique password of 12 or more characters.");
      } else {
        notify("Password was not updated. Please check your staff session or retry from the signed-in roster.");
      }
    }finally{button.disabled=false;el("new-password").value="";el("confirm-password").value="";}
  });
  el("logout").addEventListener("click",async()=>{
    if(api)await api.auth.signOut();notify("Signed out of the private roster.");
  });
  el("refresh").addEventListener("click",load);
  el("filter").addEventListener("change",render);
  el("archive-view").addEventListener("change",render);
  el("search").addEventListener("input",render);
  el("export").addEventListener("click",exportCsv);
  init().catch(()=>{show("setup-panel",true);notify("The secure roster could not initialize.");});
})();