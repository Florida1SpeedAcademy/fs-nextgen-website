(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root&&root.document)api.mount(root);})(typeof window!=='undefined'?window:null,function(){
'use strict';
const TRACK='Track & Field — $225 registration';
const ENDPOINT='https://rxhkfyfjdzmurqgzbxad.supabase.co/functions/v1/fs-register';
const SITE='https://floridaspeedacademy.com';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function requestData(values,consent){
 if(consent!==true)throw Error('Private roster consent is required.');
 const fields={first_name:'Athlete first name',last_name:'Athlete last name',guardian_name:'Parent/Guardian',email:'email',phone:'Phone'};
 const limits={first_name:80,last_name:80,guardian_name:100,email:150,phone:40};
 const data={program:values.Program,consent:true};
 for(const [key,name]of Object.entries(fields)){const value=String(values[name]||'').trim();if(!value||value.length>limits[key]||/[\r\n\x00-\x1f]/.test(value))throw Error('Check '+name+'.');data[key]=value;}
 if(data.program!==TRACK)throw Error('Track & Field is required for automatic matching.');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))throw Error('Check parent email.');
 data.email=data.email.toLowerCase();return data;
}
function paymentUrl(kind,reference){
 if(!UUID.test(reference||''))throw Error('Invalid registration reference.');
 const bases={hold:'https://buy.stripe.com/fZu7sNgISfWRdUb8HNcAo0b',registration:'https://buy.stripe.com/8x200l2S2cKFbM3bTZcAo0a'};
 if(!bases[kind])throw Error('Invalid fee.');
 const url=new URL(bases[kind]);url.searchParams.set('client_reference_id',reference);return url.href;
}
function nextUrl(reference){if(!UUID.test(reference||''))throw Error('Invalid registration reference.');const url=new URL('/registration.html',SITE);url.searchParams.set('registration_id',reference);url.hash='track-payments';return url.href;}
function mount(win){
 const doc=win.document;const params=new URLSearchParams(win.location.search);const reference=params.get('registration_id')||'';
 if(UUID.test(reference)){
  const section=doc.getElementById('track-payments');const links=section?.querySelectorAll('a.pay');
  if(section&&links&&links.length===2){
   links[0].href=paymentUrl('hold',reference);links[1].href=paymentUrl('registration',reference);
   for(const link of links){link.rel='noopener noreferrer';link.removeAttribute('target');}
   const signup=doc.getElementById('signup');if(signup)signup.hidden=true;
   const heading=doc.createElement('h1');heading.textContent='REGISTRATION AND PAYMENT';section.prepend(heading);
   const message=doc.createElement('div');message.className='notice';message.textContent='LIVE PAYMENT LINKS. You have returned from the form service. This page does not verify email delivery, payment, signed agreements, or enrollment. Choose only the fee staff instructed you to pay. Save this page URL for this athlete; do not pay again if you already paid.';heading.after(message);
   const refText=doc.createElement('p');refText.className='note';refText.style.overflowWrap='anywhere';refText.textContent='Registration reference: '+reference;message.after(refText);
   const another=doc.createElement('a');another.href=SITE+'/registration.html';another.textContent='Register a different athlete';refText.after(another);
   const details=doc.createElement('p');details.className='note';details.textContent='A verified $50 payment marks the private record Spot held. A verified $225 payment marks it Registration paid—staff review. Neither automatically completes enrollment or publishes an athlete profile. Payment notifications may take time to process.';section.append(details);
   return;
  }
 }
 const form=doc.getElementById('registration-form');if(!form)return;
 const program=form.querySelector('[name="Program"]');const actions=form.querySelector('.actions');
 const notice=doc.createElement('p');notice.className='note';notice.textContent='For Track & Field, submit this form before paying. A private registration reference will link checkout to the athlete. Required agreements and staff clearance remain separate.';form.insertBefore(notice,actions);
 const label=doc.createElement('label');label.className='check';const consent=doc.createElement('input');consent.type='checkbox';consent.name='Private roster consent';consent.value='Yes - agrees to private Supabase roster processing';
 const copy=doc.createElement('span');copy.textContent='For Track & Field, I agree to store athlete name, guardian contact details, program, and payment status privately in Supabase for roster administration. Birth date, school, street address, and questions are not copied into the roster.';label.append(consent,copy);form.insertBefore(label,actions);
 const status=doc.createElement('p');status.className='status';status.tabIndex=-1;status.setAttribute('role','status');status.setAttribute('aria-live','polite');form.append(status);
 const fallback=doc.createElement('button');fallback.type='button';fallback.className='action secondary';fallback.textContent='SEND FORM FOR MANUAL REVIEW';fallback.hidden=true;actions.append(fallback);
 const button=form.querySelector('button[type="submit"]');const next=form.querySelector('[name="_next"]');const originalNext=next.value;
 let busy=false,lastPayload='',key='';
 function isTrack(){return program.value===TRACK;}
 function visibility(){label.hidden=!isTrack();notice.hidden=!isTrack();consent.required=isTrack();}
 visibility();program.addEventListener('change',visibility);
 function hidden(name,value){let node=form.querySelector('input[data-roster-field="'+name+'"]');if(!node){node=doc.createElement('input');node.type='hidden';node.name=name;node.dataset.rosterField=name;form.append(node);}node.value=value;}
 fallback.addEventListener('click',()=>{if(busy||!form.reportValidity())return;next.value=originalNext;hidden('Roster matching','Manual review required - automatic reference unavailable');status.textContent='Continuing to FormSubmit for manual review. No automatic payment matching is confirmed.';win.HTMLFormElement.prototype.submit.call(form);});
 for(const link of doc.querySelectorAll('#track-payments a.pay')){link.href='#signup';link.removeAttribute('target');link.addEventListener('click',event=>{event.preventDefault();status.textContent='Submit the Track & Field registration first. Its return page will provide payment links tied to the athlete reference. Already submitted? Use your saved payment page or ask staff for help; do not pay twice.';form.scrollIntoView({behavior:'smooth'});status.focus();});}
 form.addEventListener('submit',async event=>{
  if(!isTrack())return;event.preventDefault();if(busy||!form.reportValidity())return;
  let payload;try{payload=requestData(Object.fromEntries(new win.FormData(form)),consent.checked);}catch(error){status.textContent=error.message;return;}
  const serialized=JSON.stringify(payload);if(serialized!==lastPayload){try{key=win.crypto.randomUUID();}catch{status.textContent='This browser cannot create a registration reference. Use manual review or contact staff.';fallback.hidden=false;return;}lastPayload=serialized;}
  busy=true;button.disabled=true;fallback.hidden=true;status.textContent='Saving the private athlete reference. Please wait…';
  const controller=new win.AbortController();const timer=win.setTimeout(()=>controller.abort(),15000);
  try{
   const response=await win.fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',referrerPolicy:'no-referrer',signal:controller.signal,body:JSON.stringify({...payload,submission_key:key})});
   if(!response.ok)throw Error();const result=await response.json();next.value=nextUrl(result.registration_id);hidden('Registration ID',result.registration_id);hidden('Roster matching','Reference created; payment and enrollment not yet verified');
   status.textContent='Reference saved. Continuing to FormSubmit to send your registration. Follow its instructions; payment comes afterward.';win.clearTimeout(timer);win.HTMLFormElement.prototype.submit.call(form);
  }catch{status.textContent='Automatic roster matching could not be prepared. Your form has not been sent to FormSubmit yet. Retry, or choose Send form for manual review. Do not pay again if you already paid.';busy=false;button.disabled=false;fallback.hidden=false;}
  finally{win.clearTimeout(timer);}
 });
 win.addEventListener('pageshow',event=>{if(!event.persisted)return;busy=false;button.disabled=false;fallback.hidden=true;next.value=originalNext;form.querySelectorAll('[data-roster-field]').forEach(node=>node.remove());status.textContent='';visibility();});
}
return {TRACK,requestData,paymentUrl,nextUrl,mount};
});
