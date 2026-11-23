(() => {
  "use strict";
  const el = id => document.getElementById(id);
  const cfg = window.FSA_ROSTER_CONFIG || {};
  const currency = cents => new Intl.NumberFormat("en-US", { style:"currency", currency:"USD" }).format((Number(cents)||0)/100);
  const day = value => value ? new Date(value).toLocaleDateString("en-US", {month:"short",day:"numeric",year:"numeric"}) : "—";
  const statusLabels = Object.freeze({paid:"PAID",partial:"PARTIAL",unpaid:"UNPAID",unassigned:"PLAN NEEDED",review:"REVIEW"});
  const planOptions = Object.freeze({indoor:"Indoor · $150",outdoor:"Outdoor · $275",combined:"Indoor + outdoor · $300"});
  const show = (id, visible) => { el(id).hidden = !visible; };
  let api = null, user = null, roster = [], review = [], loaded = false, locked = false;

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
    if (!r.plan) return "unassigned";
    if (r.paid >= r.total && r.total > 0) return "paid";
    if (r.paid > 0) return "partial";
    return "unpaid";
  }
  function formatPlan(plan) { return plan && planOptions[plan] ? planOptions[plan] : "Not assigned"; }
  function visibleRows() {
    const query = safeValue(el("search").value.trim()), filter = el("filter").value;
    return roster.filter(r => {
      const match = filter === "all" || status(r) === filter;
      return match && (!query ||
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
    const verified = roster.reduce((total,r)=>total+r.paid,0);
    const assigned = roster.filter(r=>r.plan);
    const balance = assigned.reduce((total,r)=>total+Math.max(0,r.total-r.paid),0);
    const unassigned = roster.length-assigned.length;
    el("athlete-count").textContent=String(roster.length);
    el("paid-count").textContent=String(roster.filter(r=>status(r)==="paid").length);
    el("collected-total").textContent=currency(verified);
    el("balance-total").textContent=currency(balance);
    el("roster-note").textContent = unassigned + " athlete(s) do not yet have an assigned package. Outstanding balances exclude those athletes; payments are counted only if verified by Stripe and not flagged for review. Payments do not establish enrollment approval.";

    const issueBody=el("unmatched-body");issueBody.replaceChildren();
    for (const item of review) {
      const tr = document.createElement("tr");
      cell(tr,item.identifier);cell(tr,item.reason);cell(tr,day(item.when));cell(tr,"Contact staff for verification.");
      issueBody.append(tr);
    }
    show("unmatched-empty",review.length===0);
  }
  function calculate(registrations,payments,plans,flags,issues) {
    const flagged = new Set(flags.map(x=>x.payment_intent_id).filter(Boolean));
    const byId = new Map(registrations.map(r=>[r.id,{...r,paid:0,flaggedAmount:0,plan:null,total:null}]));
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
      const [registrations,payments,plans,flags,issues]=await Promise.all([
        fetchAll("roster_registrations","id,first_name,last_name,guardian_name,email,phone,program,season,staff_clearance,created_at", q=>q.eq("season","2027")),
        fetchAll("roster_payments","session_id,registration_id,payment_intent_id,payment_link_id,kind,amount_cents,verified_at"),
        fetchAll("roster_dues","registration_id,plan,total_due_cents"),
        fetchAll("roster_payment_flags","payment_intent_id,reason,updated_at"),
        fetchAll("roster_issues","event_id,reason,created_at,resolved_at", q=>q.is("resolved_at",null))
      ]);
      const computed=calculate(registrations,payments,plans,flags,issues);
      roster=computed.roster;review=computed.review;
      user = check.data.user;loaded=true;
      el("staff-email").textContent="Signed in as "+user.email;
      show("roster-panel",true);notify("");
      render();
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
    const headers=["Athlete first name","Athlete last name","Guardian","Guardian email","Guardian phone","Season","Plan","Verified paid USD","Unresolved flagged USD","Outstanding USD","Payment status","Enrollment clearance","Registered"];
    const data=visibleRows().map(r=>[
      r.first_name,r.last_name,r.guardian_name,r.email,r.phone,r.season,formatPlan(r.plan),
      (r.paid/100).toFixed(2),(r.flaggedAmount/100).toFixed(2),
      r.plan?(Math.max(0,r.total-r.paid)/100).toFixed(2):"",
      status(r),r.staff_clearance,r.created_at
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
      if (event==="SIGNED_IN" && session?.user) setTimeout(load,0);
    });
    const session=await api.auth.getSession();
    if (session.data?.session) await load();
    else show("auth-panel",true);
  }
  el("login-form").addEventListener("submit",async e=>{
    e.preventDefault();if (!api)return;
    const email=el("admin-email").value.trim().toLowerCase();
    if (!email)return;
    const button=el("login-form").querySelector("button");button.disabled=true;
    notify("Sending your secure staff sign-in email…");
    try {
      const result=await api.auth.signInWithOtp({email,options:{
        shouldCreateUser:true,
        emailRedirectTo:window.location.origin+"/admin-roster.html"
      }});
      if (result.error) throw result.error;
      notify("Check your staff inbox for a one-time sign-in link. Only approved addresses can access roster records.");
    } catch {
      notify("Could not send the sign-in link. Check your email and the site's authorized redirect setting.");
    } finally {button.disabled=false;}
  });
  el("logout").addEventListener("click",async()=>{
    if(api)await api.auth.signOut();notify("Signed out of the private roster.");
  });
  el("refresh").addEventListener("click",load);
  el("filter").addEventListener("change",render);
  el("search").addEventListener("input",render);
  el("export").addEventListener("click",exportCsv);
  init().catch(()=>{show("setup-panel",true);notify("The secure roster could not initialize.");});
})();