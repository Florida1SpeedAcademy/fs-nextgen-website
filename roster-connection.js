(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root&&root.document)api.mount(root);})(typeof window!=='undefined'?window:null,function(){
'use strict';
const TRACK='Track & Field — $225 registration';
const SITE='https://floridaspeedacademy.com';
const ENDPOINT='https://rxhkfyfjdzmurqgzbxad.supabase.co/functions/v1/fsa-roster-register';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FEES={hold:{label:'$50 spot hold',url:'https://buy.stripe.com/fZu7sNgISfWRdUb8HNcAo0b'},registration:{label:'$225 registration',url:'https://buy.stripe.com/8x200l2S2cKFbM3bTZcAo0a'}};
function validFee(kind){return kind==='hold'||kind==='registration';}
function paymentUrl(kind,reference){if(!validFee(kind)||!UUID.test(reference||''))throw Error('Invalid checkout reference or fee.');const url=new URL(FEES[kind].url);url.searchParams.set('client_reference_id',reference);return url.href;}
function nextUrl(reference,kind,auto){if(!UUID.test(reference||'')||(kind&&!validFee(kind)))throw Error('Invalid registration reference or fee.');const url=new URL('/registration.html',SITE);url.searchParams.set('registration_id',reference);if(kind)url.searchParams.set('fee',kind);if(auto===true){if(!validFee(kind))throw Error('Choose a payment option.');url.searchParams.set('checkout','1');}url.hash='track-payments';return url.href;}
function requestData(values,consent){
 if(consent!==true)throw Error('Private roster consent is required.');
 const data={program:values.Program,consent:true};
 const fields={first_name:['Athlete first name',80],last_name:['Athlete last name',80],guardian_name:['Parent/Guardian',100],email:['email',150],phone:['Phone',40]};
 for(const [key,[name,max]] of Object.entries(fields)){const value=String(values[name]||'').trim();if(!value||value.length>max||/[\x00-\x1f]/.test(value))throw Error('Check '+name+'.');data[key]=value;}
 if(data.program!==TRACK)throw Error('Track & Field is required.');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))throw Error('Check parent email.');data.email=data.email.toLowerCase();return data;
}
function mount(win){
 const doc=win.document;const section=doc.getElementById('track-payments');
 function node(tag,text,cls){const el=doc.createElement(tag);if(text)el.textContent=text;if(cls)el.className=cls;return el;}
 const params=new URLSearchParams(win.location.search);const reference=params.get('registration_id')||'';const selected=params.get('fee');
 if(section&&UUID.test(reference)){
  const links=section.querySelectorAll('a.pay');if(links.length!==2)return;
  const signup=doc.getElementById('signup');if(signup)signup.hidden=true;
  ['hold','registration'].forEach((kind,i)=>{links[i].href=paymentUrl(kind,reference);links[i].rel='noopener noreferrer';links[i].removeAttribute('target');if(validFee(selected)&&selected!==kind)links[i].parentElement.hidden=true;});
  const message=node('div','LIVE CHECKOUT. Your reference is ready; this page does not verify email delivery, payment, agreements, or enrollment. Already paid? Do not pay again; contact staff.','notice');message.setAttribute('role','status');section.prepend(message);
  const ref=node('p','Registration reference: '+reference,'note');ref.style.overflowWrap='anywhere';message.after(ref);
  const another=node('a','Register a different athlete');another.href=SITE+'/registration.html';ref.after(another);
  section.append(node('p','Verified payment is recorded separately. Staff clearance remains required. Save this page URL to resume this athlete’s checkout if needed.','note'));
  if(params.get('checkout')==='1'&&validFee(selected)){
   let safe=false;try{win.history.replaceState(null,'',nextUrl(reference,selected,false));safe=true;}catch{}
   if(safe){try{const key='fs-checkout:'+reference+':'+selected;if(win.sessionStorage.getItem(key)==='opened')safe=false;else win.sessionStorage.setItem(key,'opened');}catch{}}
   if(safe){message.textContent='Opening live Stripe checkout for '+FEES[selected].label+'. Payment is not confirmed until Stripe verifies it. If checkout does not open, use the selected payment button below.';try{win.location.assign(paymentUrl(selected,reference));}catch{message.textContent='Checkout could not open automatically. Use the selected payment button below. No payment is confirmed.';}}
  }
  return;
 }
 const form=doc.getElementById('registration-form');if(!form)return;
 const program=form.querySelector('[name="Program"]');const actions=form.querySelector('.actions');const button=form.querySelector('button[type="submit"]');const next=form.querySelector('[name="_next"]');const originalNext=next.value;const originalLabel=button.textContent;
 const choice=node('label','Payment option *');choice.style.marginTop='22px';const fee=node('select');fee.name='Payment option';fee.append(node('option','Choose the fee staff instructed you to pay'));fee.children[0].value='';for(const kind of ['hold','registration']){const option=node('option',FEES[kind].label);option.value=kind;fee.append(option);}choice.append(fee);form.insertBefore(choice,actions);
 const notice=node('p','Submit once to save the registration, send it through FormSubmit, and continue to your selected live Stripe checkout. Complete any FormSubmit verification. Payment happens in Stripe, not when you click this button. If you leave checkout, the request remains received but unpaid. Already paid? Contact staff before paying again.','note');form.insertBefore(notice,actions);
 const label=node('label',null,'check');const consent=node('input');consent.type='checkbox';consent.name='Private roster consent';consent.value='Yes - agrees to private Supabase roster processing';label.append(consent,node('span','For Track & Field, I agree to store athlete name, guardian contact details, program, and payment status privately in Supabase for roster administration. Birth date, school, street address, and questions are not copied into the roster.'));form.insertBefore(label,actions);
 const status=node('p',null,'status');status.tabIndex=-1;status.setAttribute('role','status');status.setAttribute('aria-live','polite');form.append(status);
 const fallback=node('button','SEND FORM FOR MANUAL REVIEW','action secondary');fallback.type='button';fallback.hidden=true;actions.append(fallback);
 let busy=false,lastPayload='',key='',locked=[];
 function isTrack(){return program.value===TRACK;}
 function visibility(){const track=isTrack();choice.hidden=!track;notice.hidden=!track;label.hidden=!track;fee.required=track;fee.disabled=!track;consent.required=track;consent.disabled=!track;button.textContent=track?'SUBMIT & CONTINUE TO PAYMENT':originalLabel;if(section)section.hidden=true;fallback.hidden=true;}
 function unlock(){for(const [el,disabled]of locked)el.disabled=disabled;locked=[];}
 function clearFields(){form.querySelectorAll('[data-roster-field]').forEach(el=>el.remove());}
 function hidden(name,value){let el=form.querySelector('input[data-roster-field="'+name+'"]');if(!el){el=node('input');el.type='hidden';el.name=name;el.dataset.rosterField=name;form.append(el);}el.value=value;}
 visibility();program.addEventListener('change',visibility);
 fallback.addEventListener('click',()=>{if(busy||!form.reportValidity())return;clearFields();next.value=originalNext;hidden('Roster matching','Manual review required - no automatic checkout');hidden('Requested payment',validFee(fee.value)?FEES[fee.value].label:'None');busy=true;button.disabled=true;fallback.disabled=true;status.textContent='Sending to FormSubmit for manual review only. Checkout will not open automatically.';try{win.HTMLFormElement.prototype.submit.call(form);}catch{busy=false;button.disabled=false;fallback.disabled=false;status.textContent='Form submission could not start. Contact staff; do not pay again.';}});
 form.addEventListener('submit',async event=>{
  if(!isTrack())return;event.preventDefault();if(busy||!form.reportValidity())return;
  let payload;const kind=fee.value;try{if(!validFee(kind))throw Error('Choose a payment option.');payload=requestData(Object.fromEntries(new win.FormData(form)),consent.checked);if(!win.crypto||typeof win.crypto.randomUUID!=='function'||typeof win.AbortController!=='function')throw Error('Use manual review or a supported browser.');}catch(error){status.textContent=error.message;if(!win.crypto||typeof win.crypto.randomUUID!=='function'||typeof win.AbortController!=='function')fallback.hidden=false;return;}
  const serialized=JSON.stringify(payload);if(serialized!==lastPayload){try{key=win.crypto.randomUUID();lastPayload=serialized;}catch{status.textContent='A private reference could not be created. Use manual review or contact staff.';fallback.hidden=false;return;}}
  busy=true;locked=Array.from(form.elements).map(el=>[el,el.disabled]);for(const [el]of locked)el.disabled=true;fallback.hidden=true;status.textContent='Saving your private registration reference. Please wait…';
  const controller=new win.AbortController();const timer=win.setTimeout(()=>controller.abort(),15000);
  try{
   const response=await win.fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',referrerPolicy:'no-referrer',signal:controller.signal,body:JSON.stringify({...payload,submission_key:key})});if(!response.ok)throw Error();const result=await response.json();const destination=nextUrl(result.registration_id,kind,true);
   unlock();clearFields();next.value=destination;hidden('Registration ID',result.registration_id);hidden('Requested payment',FEES[kind].label);hidden('Roster matching','Reference created - payment and enrollment not yet verified');button.disabled=true;fallback.disabled=true;status.textContent='Reference saved. Continuing to FormSubmit, then Stripe. Complete any form verification. No payment is confirmed yet.';win.HTMLFormElement.prototype.submit.call(form);
  }catch{unlock();busy=false;button.disabled=false;fallback.disabled=false;fallback.hidden=false;next.value=originalNext;status.textContent='The registration handoff could not finish. No automatic checkout was opened. Retry, or send the form for manual review. Do not pay again if you already paid.';}
  finally{win.clearTimeout(timer);}
 });
 win.addEventListener('pageshow',event=>{if(!event.persisted)return;unlock();busy=false;button.disabled=false;fallback.disabled=false;next.value=originalNext;clearFields();status.textContent='';visibility();});
}
return {TRACK,validFee,paymentUrl,nextUrl,requestData,mount};
});
