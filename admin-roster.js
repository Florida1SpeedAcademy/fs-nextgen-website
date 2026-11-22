(()=>{"use strict";
const $=id=>document.getElementById(id);
const cfg=window.FSA_ROSTER_CONFIG||{};
const show=(id,yes)=>{$(id).hidden=!yes;};
let db=null,session=null,rows=[],unmatched=[],loaded=false;
const usd=cents=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format((Number(cents)||0)/100);
const date=s=>s?new Date(s).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"}):"—";
function message(text){$("message").textContent=text;show("message",!!text);}
function status(row){
 if(row.balance<=0&&row.paid>0)return"paid";
 if(row.paid>0)return"partial";
 return"unpaid";
}
function td(tr,text,cls){const cell=document.createElement("td");cell.textContent=text;if(cls)cell.className=cls;tr.append(cell);return cell;}
function combined(athletes,payments){
 const byId=new Map(athletes.map(a=>[a.id,{...a,paid:0,balance:0}]));
 const left=[];
 for(const p of payments){
  if(p.currency!=="usd")continue;
  const net=Math.max(0,Number(p.amount_cents||0)-Number(p.amount_refunded_cents||0));
  if(net<=0)continue;
  const row=p.registration_id&&byId.get(p.registration_id);
  if(row)row.paid+=net;else left.push({...p,net});
 }
 const results=Array.from(byId.values()).map(r=>({...r,balance:Math.max(0,Number(r.total_due_cents||0)-r.paid)}));
 return {results,left};
}
function render(){
 const q=$("search").value.toLocaleLowerCase().trim(),filter=$("filter").value;
 const visible=rows.filter(r=>(filter==="all"||status(r)===filter)&&(!q||[r.first_name,r.last_name,r.guardian_name,r.guardian_email].join(" ").toLocaleLowerCase().includes(q)));
 const body=$("roster-body");body.replaceChildren();
 for(const r of visible){
  const tr=document.createElement("tr");
  const name=td(tr,[r.first_name,r.last_name].join(" "));name.style.fontWeight="800";
  const guardian=td(tr,r.guardian_name||"—");const contact=document.createElement("div");contact.className="muted";contact.textContent=r.guardian_email||"";guardian.append(contact);
  td(tr,r.program||"Track & Field");td(tr,usd(r.paid),"money");td(tr,usd(r.balance),"money");
  const state=td(tr,"");const flag=document.createElement("span");flag.className="status "+status(r);flag.textContent=({paid:"PAID",partial:"PARTIAL",unpaid:"UNPAID"})[status(r)];state.append(flag);
  td(tr,date(r.created_at));body.append(tr);
 }
 show("roster-empty",!visible.length);
 const due=rows.reduce((sum,r)=>sum+r.balance,0),collected=rows.reduce((sum,r)=>sum+r.paid,0);
 $("athlete-count").textContent=String(rows.length);
 $("paid-count").textContent=String(rows.filter(r=>status(r)==="paid").length);
 $("collected-total").textContent=usd(collected);
 $("balance-total").textContent=usd(due);
 const other=$("unmatched-body");other.replaceChildren();
 for(const r of unmatched){
  const tr=document.createElement("tr");td(tr,r.checkout_session_id||"—");td(tr,usd(r.net),"money");td(tr,date(r.created_at));td(tr,"Manual verification needed");other.append(tr);
 }
 show("unmatched-empty",!unmatched.length);
}
function csvCell(value){
 let s=String(value??"");
 if(/^[=+\-@\t\r]/.test(s))s="'"+s;
 return '"'+s.replace(/"/g,'""')+'"';
}
function exportCsv(){
 if(!loaded){message("Load the secure roster before exporting.");return;}
 const headings=["Athlete first name","Athlete last name","Guardian","Guardian email","Program","Season","Paid USD","Balance USD","Payment status","Registered"];
 const data=rows.map(r=>[r.first_name,r.last_name,r.guardian_name,r.guardian_email,r.program,r.season,(r.paid/100).toFixed(2),(r.balance/100).toFixed(2),status(r),r.created_at]);
 const csv=[headings,...data].map(row=>row.map(csvCell).join(",")).join("\r\n");
 const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
 const link=document.createElement("a");link.href=url;link.download="FSNextGen-Private-Roster-2027.csv";document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function load(){
 if(!session)return;loaded=false;show("auth-panel",false);show("roster-panel",false);message("Verifying administrator access…");
 try{
  const {data:auth,error:authError}=await db.from("fsa_roster_admins").select("user_id").eq("user_id",session.user.id).limit(1);
  if(authError)throw authError;
  if(!auth?.length){message("This account is not approved for the private athlete roster. Contact the website administrator.");await db.auth.signOut();show("auth-panel",true);return;}
  const [athletes,payments]=await Promise.all([
   db.from("fsa_athlete_roster").select("id,first_name,last_name,guardian_name,guardian_email,program,season,total_due_cents,created_at").eq("season",2027).order("created_at",{ascending:false}).limit(1000),
   db.from("fsa_roster_payments").select("checkout_session_id,registration_id,amount_cents,amount_refunded_cents,payment_status,currency,created_at").in("payment_status",["paid","partially_refunded","refunded"]).order("created_at",{ascending:false}).limit(1000)
  ]);
  if(athletes.error)throw athletes.error;if(payments.error)throw payments.error;
  if((athletes.data||[]).length>=1000||(payments.data||[]).length>=1000)throw Error("More than 1,000 records. Add secure pagination before exporting or reviewing totals.");
  const {results,left}=combined(athletes.data||[],payments.data||[]);rows=results;unmatched=left;loaded=true;
  $("staff-email").textContent="Signed in: "+(session.user.email||"approved staff");
  show("roster-panel",true);message("");
  render();
 }catch(e){message("The roster could not load securely. Check staff authorization, the database setup, and your connection. "+(e.message||""));show("auth-panel",false);}
}
async function start(){
 const valid=cfg.supabaseUrl?.startsWith("https://")&&cfg.supabasePublishableKey?.length>15&&window.supabase?.createClient;
 if(!valid){show("setup-panel",true);return;}
 db=window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 const {data,error}=await db.auth.getSession();
 if(error)message("Could not verify your staff session. Please sign in again.");
 session=data?.session||null;
 if(session)await load();else show("auth-panel",true);
 db.auth.onAuthStateChange((event,next)=>{
  if(event==="SIGNED_OUT"){session=null;rows=[];unmatched=[];loaded=false;show("roster-panel",false);show("auth-panel",true);}
  if(event==="SIGNED_IN"&&next){session=next;setTimeout(load,0);}
 });
}
$("login-form").addEventListener("submit",async e=>{
 e.preventDefault();if(!db)return;
 const email=$("admin-email").value.trim().toLowerCase();const button=$("login-form").querySelector("button");button.disabled=true;message("Sending secure sign-in email…");
 const {error}=await db.auth.signInWithOtp({email,options:{emailRedirectTo:"https://floridaspeedacademy.com/admin-roster.html",shouldCreateUser:false}});
 button.disabled=false;message(error?"Sign-in could not be sent. Ask the admin to authorize this staff account.":"Check your staff email for a one-time sign-in link.");
});
$("logout").addEventListener("click",async()=>{if(db)await db.auth.signOut();message("Signed out.");});
$("refresh").addEventListener("click",load);
$("search").addEventListener("input",render);$("filter").addEventListener("change",render);
$("export").addEventListener("click",exportCsv);
start().catch(()=>{show("setup-panel",true);message("Roster initialization failed. Please contact the site administrator.");});
})();