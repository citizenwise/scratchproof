(function(root){
var REG={
US:{name:'United States',routes:['If you paid by credit card, you can dispute the charge with your card issuer, usually within a limited window after the statement date, so check your card terms and act promptly.','You can also file a complaint with your state attorney general or consumer protection office and the Federal Trade Commission.']},
UK:{name:'United Kingdom',routes:['If you paid by card, you may be able to ask your card provider to review the charge (chargeback, or Section 75 for credit cards in some cases). Check the time limits with your provider.','You can also contact Trading Standards or Citizens Advice, and ask for the company\'s complaints procedure and any alternative dispute resolution scheme it uses.']},
EU:{name:'European Union',routes:['If you paid by card, you can ask your bank or card provider to review the charge, and time limits apply.','You can also contact your national consumer protection authority or the European Consumer Centre (ECC-Net) in your country.']}};
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function generateLetter(f){
f=f||{};var miss=[];
['company','bookingRef','pickupDate','returnDate','amount','region'].forEach(function(k){if(!f[k]||!String(f[k]).trim())miss.push(k);});
if(f.region&&!REG[f.region]&&miss.indexOf('region')<0)miss.push('region');
if(miss.length)return{ok:false,missing:miss,text:''};
var r=REG[f.region],c=esc(String(f.company).trim()),b=esc(String(f.bookingRef).trim()),p=esc(String(f.pickupDate).trim()),d=esc(String(f.returnDate).trim()),a=esc(String(f.amount).trim());
var t=['To: '+c+' - Customer Relations / Damage Claims','','Re: Booking reference '+b+' - charge of '+a+'','',
'Dear Sir or Madam,','',
'I rented a vehicle from you (booking reference '+b+') from '+p+' to '+d+'. I have been billed '+a+' for alleged damage. I do not accept this charge at this time, and I ask you to suspend collection while it is reviewed.','',
'So that I can understand the claim, please send me the following within 14 days:',
'1. The timestamped photographs of the vehicle taken at pickup and at return.',
'2. The signed damage sheet or condition report for this rental.',
'3. The repair invoice, or if no repair was done, the basis for the charge.',
'4. A full breakdown of how the amount of '+a+' was calculated, including any administrative, processing or loss-of-use fees and the policy they come from.','',
'I kept my own records of the vehicle\'s condition and will compare them with your evidence.','',
'If this is not resolved, I may pursue other routes ('+r.name+'):'];
r.routes.forEach(function(x){t.push('- '+x);});
t.push('','I would prefer to settle this directly and politely, and look forward to your reply.','','Yours faithfully,','[Your name]','[Your contact details]','','This letter is a general template and is not legal advice.');
return{ok:true,missing:[],text:t.join('\n')};}
var api={generateLetter:generateLetter,esc:esc,REGIONS:REG};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ScratchLetter=api;
})(typeof window!=='undefined'?window:this);
