(()=>{'use strict';
const $=id=>document.getElementById(id);
const types={'Consulta general':'General Enquiry','Reparación de vivienda':'Home Repair Assistance','Educación':'Education Support','Infraestructura y obras públicas':'Infrastructure / Public Works','Asistencia social':'Social Assistance Guidance','Asunto comunitario':'Community Matter'};
const preferences={'Teléfono':'Phone','WhatsApp':'WhatsApp','Correo electrónico':'Email'};
function result(el,message,error=false){el.hidden=false;el.classList.toggle('error',error);el.textContent=message;}
async function post(url,body){const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(response.status===429?'Demasiadas solicitudes. Inténtelo de nuevo más tarde.':'Compruebe los datos e inténtelo de nuevo, o llame a la oficina.');return data;}
$('enquiry').addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget,button=form.querySelector('button[type="submit"]');
  if(!form.reportValidity())return;
  const value=id=>$(id).value.trim();
  const payload={fullName:value('name'),phone:value('phone'),email:value('email'),dob:value('dob'),address:value('address'),type:types[value('type')]||'General Enquiry',preferred:preferences[value('preferred')]||'Phone',message:value('message')};
  button.disabled=true;button.textContent='ENVIANDO…';
  try{const data=await post('/api/public/enquiries',payload);form.reset();result($('enquiry-result'),`Consulta recibida. Su referencia es ${data.reference}. Guarde este número para consultar el estado de su caso.`);$('reference').value=data.reference;}
  catch(error){result($('enquiry-result'),`No se pudo enviar la consulta. ${error.message}`,true)}
  finally{button.disabled=false;button.textContent='ENVIAR CONSULTA →'}
});
$('tracker').addEventListener('submit',async event=>{
  event.preventDefault();const button=event.currentTarget.querySelector('button[type="submit"]');
  if(!event.currentTarget.reportValidity())return;
  button.disabled=true;button.textContent='CONSULTANDO…';
  try{const data=await post('/api/public/track',{reference:$('reference').value.trim(),contact:$('contact').value.trim()});const c=data.case||{};result($('tracking-result'),`Referencia: ${c.reference||'—'} · Estado: ${c.publicStatus||'Recibida'} · Actualización: ${c.publicUpdate||'Sin actualización pública.'} · Próximo paso: ${c.publicNextStep||'La oficina revisará la consulta.'}`);}
  catch(error){result($('tracking-result'),`No se pudo encontrar la consulta con esos datos. ${error.message}`,true)}
  finally{button.disabled=false;button.textContent='CONSULTAR ESTADO →'}
});
})();
