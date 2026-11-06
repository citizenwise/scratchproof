// Verify page glue. The checks themselves are the app's own code (verify-lib.js, ScratchProofVerify); this file only reads
// the dropped files in the browser and shows the results as text. Nothing is sent anywhere.
(function(root){
var PARTS={pickup:'Pickup',return:'Return',agent:'Agent’s answer'};
// Red team 2 M2: what the text has the form of, nothing more (any client can write such a record).
var KINDS={pickup:'Has the form of a ScratchProof pickup record',return:'Has the form of a ScratchProof return record',agent:'Has the form of a ScratchProof agent answer'};
var MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function two(n){return (n<10?'0':'')+n;}
function formatTime(iso){var d=new Date(iso);if(isNaN(d.getTime()))return iso;
return d.getUTCDate()+' '+MONTHS[d.getUTCMonth()]+' '+d.getUTCFullYear()+', '+two(d.getUTCHours())+':'+two(d.getUTCMinutes())+':'+two(d.getUTCSeconds())+' UTC';}
function partName(part){return PARTS[part]||part;}
// Red team 2 M3: a decline is never called an acknowledgement.
function sealTitle(s){if(!s.answer)return partName(s.part);return s.answer.declined?'Agent declined to sign':'Agent’s answer: signed';}
function span(ms){var m=Math.abs(ms),n,u;if(m>=172800000){n=m/86400000;u='days';}else if(m>=7200000){n=m/3600000;u='hours';}else{n=m/60000;u='minutes';}return Math.floor(n)+' '+u;}
function stampRows(t){
if(t.status==='checked')return [{label:'Timestamp signature',value:'Checked against FreeTSA’s certificate',state:'ok'},
{label:'Timestamp time',value:formatTime(t.genTime),state:'info'},{label:'Serial',value:t.serialHex,state:'info',mono:true}];
if(t.status==='none')return [{label:'Timestamp signature',value:'No independent timestamp in the file: this seal’s time rests on the phone clock alone',state:'warn'}];
return [{label:'Timestamp signature',value:'Does not check: '+t.reason,state:'bad'}];}
// Red team 2 M2: the phone's own time against FreeTSA's.
function clockRows(s){if((s.warnings||[]).indexOf('clock')<0)return [];
return [{label:'Phone clock',value:'Phone clock differed from the timestamp by '+span(s.clockGapMs)+'. The phone time ('+formatTime(s.phoneTime)+') cannot be relied on: it was wrong, or the seal was stamped later. Rely on the timestamp time.',state:'warn'}];}
function answerRows(s){var a=s.answer;if(!a)return [];
if(a.declined)return [{label:'Agent’s answer',value:'The agent declined to sign (sealed)',state:'info'}];
return [{label:'Agent’s answer',value:a.agentName?'A signature was drawn on the renter’s phone, attributed to '+a.agentName:'A signature was drawn on the renter’s phone (no name given)',state:'info'}];}
function placeText(l){return 'location '+l.lat+', '+l.lon+(l.accuracyM!=null?' (±'+l.accuracyM+' m)':'')+', as reported by the phone'+(l.mocked?' (marked as simulated)':'');}
// Red team 2 L7: what the seal holds besides its photos.
function contentRows(s){var c=s.contents;if(!c)return [];var kind=c.kind.charAt(0).toUpperCase()+c.kind.slice(1);
var marks=c.marks===0?'no damage marks':c.marks+(c.marks===1?' damage mark':' damage marks');
return [{label:'Sealed contents',value:kind+' · '+marks+' · '+(c.location?placeText(c.location):'no location'),state:'info'}];}
function sealRows(s){
var rows=[{label:'Root hash',value:s.hashMatches?'Matches the sealed text':'Does not match: this is not the text that was sealed',state:s.hashMatches?'ok':'bad',detail:s.hashMatches?s.rootHash:'In the file: '+s.rootHash+'\nComputed here: '+s.computedRootHash},
{label:'Sealed text',value:s.wellFormed?KINDS[s.part]:'Not a ScratchProof record of this kind',state:s.wellFormed?'ok':'bad'}];
rows=rows.concat(stampRows(s.timestamp),clockRows(s),answerRows(s),contentRows(s));
rows.push({label:'Proof code',value:s.proofCode,state:'info',mono:true});
if(!s.fingerprintsMatch)rows.push({label:'Photo list',value:'The file’s fingerprint list differs from the sealed text',state:'bad'});
return rows;}
function sealPill(s){if(!s.ok)return {text:'Check failed',state:'bad'};
return (s.warnings||[]).length?{text:'Passed, with warnings',state:'warn'}:{text:'All checks passed',state:'ok'};}
function stampOf(check,part){var s=check.seals.filter(function(x){return x.part===part;})[0];return s&&s.timestamp.status==='checked'?s.timestamp.genTime:null;}
// Red team 2 M2: a return or answer stamped before its pickup means the phone times cannot be right.
function orderRows(check){return (check.order||[]).map(function(o){var name=o.part==='return'?'The return':'The agent’s answer',at=stampOf(check,o.part),pick=stampOf(check,'pickup');
return {label:partName(o.part)+' stamp order',value:o.inOrder?name+' was stamped after the pickup':name+' was stamped at '+formatTime(at)+', before the pickup ('+formatTime(pick)+'): the times contradict each other',state:o.inOrder?'ok':'bad'};});}
function linkRows(check){return check.links.map(function(l){var name=l.part==='return'?'The return':'The agent’s answer';
return {label:partName(l.part)+' link',value:l.linked?name+' names this pickup’s root hash in its sealed text':name+' does not name the pickup in this file',state:l.linked?'ok':'bad'};}).concat(orderRows(check));}
function summarize(check){var bad=check.seals.filter(function(s){return !s.ok;}).length+check.links.filter(function(l){return !l.linked;}).length+(check.order||[]).filter(function(o){return !o.inOrder;}).length;
var warns=check.warnings||0;
if(!check.ok)return {ok:false,warn:false,title:'Something does not match',detail:bad+(bad===1?' check did not pass. ':' checks did not pass. ')+'See the details below: do not rely on the parts marked in red.'};
if(warns)return {ok:true,warn:true,title:'All checks passed, with warnings',detail:'The sealed texts match and the timestamp signatures check, but there '+(warns===1?'is 1 warning':'are '+warns+' warnings')+': read the rows marked in amber before you rely on the times.'};
return {ok:true,warn:false,title:'Every check passed',detail:'Each sealed text matches its root hash, each timestamp signature checks against FreeTSA’s certificate'+(check.links.length?', and the seals are linked to the pickup.':'.')};}
function matchPhotos(check,prints){var wanted={};check.seals.forEach(function(s){s.photos.forEach(function(p){wanted[p.sha256Hex]=true;});});
var matched={},unmatched=[];prints.forEach(function(p){if(wanted[p.hex]&&!matched[p.hex])matched[p.hex]=p.name;else if(!wanted[p.hex])unmatched.push(p.name);});
return {matched:matched,unmatched:unmatched};}
// Red team 2 L7: a match inside a failed seal is shown neutral, never green.
function photoRow(seal,p,matched,dropped){var hit=matched[p.sha256Hex];
var label='Photo '+p.id+' · taken '+formatTime(p.takenAt)+' (phone clock)';
if(hit)return {label:label,value:seal.ok?'Matches '+hit:'Same bytes as '+hit+', but this seal failed: do not rely on it',state:seal.ok?'ok':'info',detail:p.sha256Hex};
return {label:label,value:dropped?'No dropped photo matches':'Not checked',state:dropped?'warn':'info',detail:p.sha256Hex};}
// Red team 2 L11: one file at a time, so a folder of videos never sits in memory at once.
function fingerprintAll(files,read){var out=[];return files.reduce(function(p,f){return p.then(function(){return read(f).then(function(x){out.push(x);});});},Promise.resolve()).then(function(){return out;});}
var View={formatTime:formatTime,partName:partName,sealTitle:sealTitle,sealRows:sealRows,sealPill:sealPill,linkRows:linkRows,summarize:summarize,matchPhotos:matchPhotos,photoRow:photoRow,fingerprintAll:fingerprintAll};
root.ScratchVerifyView=View;
if(typeof module!=='undefined')module.exports={ScratchVerifyView:View};
if(typeof document==='undefined')return;

var MAX_PROOF=5*1024*1024,MAX_PHOTO=512*1024*1024,state={check:null,prints:[]};
function $(id){return document.getElementById(id);}
function el(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;}
function rowEl(r){var d=el('div','row state-'+r.state);d.appendChild(el('span','dot'));var b=el('div','row-body');
b.appendChild(el('div','row-label',r.label));b.appendChild(el('div','row-value'+(r.mono?' mono':''),r.value));
if(r.detail)b.appendChild(el('div','row-detail mono',r.detail));d.appendChild(b);return d;}
function photoEl(seal,p){return rowEl(photoRow(seal,p,matchPhotos(state.check,state.prints).matched,state.prints.length>0));}
function sealCard(s){var pill=sealPill(s),c=el('article','card seal is-'+pill.state);var h=el('header','seal-head');
h.appendChild(el('h3',null,sealTitle(s)));h.appendChild(el('span','pill pill-'+pill.state,pill.text));c.appendChild(h);
var facts=el('div','facts');sealRows(s).forEach(function(r){if(r.state!=='info')return c.appendChild(rowEl(r));
var f=el('div','fact');f.appendChild(el('div','row-label',r.label));f.appendChild(el('div','row-value'+(r.mono?' mono':''),r.value));facts.appendChild(f);});
if(facts.childNodes.length)c.appendChild(facts);
if(s.photos.length){c.appendChild(el('div','sub',s.photos.length+(s.photos.length===1?' sealed photo':' sealed photos')));s.photos.forEach(function(p){c.appendChild(photoEl(s,p));});}
return c;}
function render(){var check=state.check,sum=summarize(check),v=$('verdict');v.className='verdict '+(!sum.ok?'is-bad':sum.warn?'is-warn':'is-ok');v.textContent='';
v.appendChild(el('span','verdict-mark'));var t=el('div');t.appendChild(el('strong',null,sum.title));t.appendChild(el('p',null,sum.detail));v.appendChild(t);
var seals=$('seals');seals.textContent='';check.seals.forEach(function(s){seals.appendChild(sealCard(s));});
var links=$('links');links.textContent='';links.hidden=!check.links.length;
if(check.links.length){links.appendChild(el('h3',null,'Links between the seals'));linkRows(check).forEach(function(r){links.appendChild(rowEl(r));});}
var m=matchPhotos(check,state.prints),un=$('unmatched');un.textContent='';
m.unmatched.forEach(function(n){un.appendChild(rowEl({label:n,value:'Not in any seal in this file (an edited or re-sent copy never matches)',state:'warn'}));});
var total=0;check.seals.forEach(function(s){total+=s.photos.length;});$('photo-count').textContent=state.prints.length?Object.keys(m.matched).length+' of '+total+' sealed photos matched':'';
$('photos-card').hidden=total===0;$('result').hidden=false;}
function fail(msg){$('err').textContent=msg;$('err').hidden=false;$('result').hidden=true;}
function readProof(file){$('err').hidden=true;if(!file)return;
if(file.size>MAX_PROOF)return fail('That file is too large to be a ScratchProof proof file.');
$('file-name').textContent=file.name;
file.text().then(function(text){return root.ScratchProofVerify.verify(text);}).then(function(r){
if(!r.ok)return fail('This is not a ScratchProof proof file ('+r.error.message+').');state.check=r.value;state.prints=[];render();
$('result').scrollIntoView({behavior:'smooth',block:'start'});}).catch(function(){fail('The file could not be read.');});}
function readPhotos(files){var list=Array.prototype.slice.call(files).filter(function(f){return f.size<=MAX_PHOTO;});
$('photo-count').textContent='Fingerprinting '+list.length+(list.length===1?' file':' files')+' on this device…';
fingerprintAll(list,function(f){return f.arrayBuffer().then(function(b){return root.ScratchProofVerify.fingerprint(new Uint8Array(b));}).then(function(hex){return {name:f.name,hex:hex};});})
.then(function(prints){state.prints=state.prints.concat(prints);render();}).catch(function(){$('photo-count').textContent='A photo could not be read.';});}
function dropZone(zone,input,take){input.addEventListener('change',function(){take(input.files);input.value='';});
['dragenter','dragover'].forEach(function(n){zone.addEventListener(n,function(e){e.preventDefault();zone.classList.add('over');});});
['dragleave','drop'].forEach(function(n){zone.addEventListener(n,function(e){e.preventDefault();zone.classList.remove('over');});});
zone.addEventListener('drop',function(e){if(e.dataTransfer&&e.dataTransfer.files.length)take(e.dataTransfer.files);});}
// Red team 2 L9: GitHub Pages cannot send frame-ancestors, so the page refuses to be framed (a result could be overlaid).
function unframed(){if(window.top===window.self)return true;try{window.top.location=window.self.location.href;}catch(e){}document.documentElement.hidden=true;return false;}
function start(){if(!unframed())return;if(!root.ScratchProofVerify){fail('This browser cannot run the check (it needs WebCrypto).');return;}
dropZone($('drop'),$('file'),function(files){readProof(files[0]);});
dropZone($('photo-drop'),$('photos'),readPhotos);
window.addEventListener('dragover',function(e){e.preventDefault();});window.addEventListener('drop',function(e){e.preventDefault();});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})(typeof window!=='undefined'?window:globalThis);
