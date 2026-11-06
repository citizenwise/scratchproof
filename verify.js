// Verify page glue. The checks themselves are the app's own code (verify-lib.js, ScratchProofVerify); this file only reads
// the dropped files in the browser and shows the results as text. Nothing is sent anywhere.
(function(root){
var PARTS={pickup:'Pickup',return:'Return',agent:'Agent’s acknowledgement'};
var KINDS={pickup:'A ScratchProof pickup record',return:'A ScratchProof return record',agent:'A ScratchProof agent acknowledgement'};
var MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function two(n){return (n<10?'0':'')+n;}
function formatTime(iso){var d=new Date(iso);if(isNaN(d.getTime()))return iso;
return d.getUTCDate()+' '+MONTHS[d.getUTCMonth()]+' '+d.getUTCFullYear()+', '+two(d.getUTCHours())+':'+two(d.getUTCMinutes())+':'+two(d.getUTCSeconds())+' UTC';}
function partName(part){return PARTS[part]||part;}
function stampRows(t){
if(t.status==='checked')return [{label:'Timestamp signature',value:'Checked against FreeTSA’s certificate',state:'ok'},
{label:'Timestamp time',value:formatTime(t.genTime),state:'info'},{label:'Serial',value:t.serialHex,state:'info',mono:true}];
if(t.status==='none')return [{label:'Timestamp signature',value:'No independent timestamp in the file: this seal’s time rests on the phone clock alone',state:'warn'}];
return [{label:'Timestamp signature',value:'Does not check: '+t.reason,state:'bad'}];}
function sealRows(s){
var rows=[{label:'Root hash',value:s.hashMatches?'Matches the sealed text':'Does not match: this is not the text that was sealed',state:s.hashMatches?'ok':'bad',detail:s.hashMatches?s.rootHash:'In the file: '+s.rootHash+'\nComputed here: '+s.computedRootHash},
{label:'Sealed text',value:s.wellFormed?KINDS[s.part]:'Not a ScratchProof record of this kind',state:s.wellFormed?'ok':'bad'}];
rows=rows.concat(stampRows(s.timestamp));
rows.push({label:'Proof code',value:s.proofCode,state:'info',mono:true});
if(!s.fingerprintsMatch)rows.push({label:'Photo list',value:'The file’s fingerprint list differs from the sealed text',state:'bad'});
return rows;}
function linkRows(check){return check.links.map(function(l){var name=l.part==='return'?'The return':'The agent’s acknowledgement';
return {label:partName(l.part)+' link',value:l.linked?name+' names this pickup’s root hash in its sealed text':name+' does not name the pickup in this file',state:l.linked?'ok':'bad'};});}
function summarize(check){var bad=check.seals.filter(function(s){return !s.ok;}).length+check.links.filter(function(l){return !l.linked;}).length;
if(check.ok)return {ok:true,title:'Every check passed',detail:'Each sealed text matches its root hash, each timestamp signature checks against FreeTSA’s certificate'+(check.links.length?', and the seals are linked to the pickup.':'.')};
return {ok:false,title:'Something does not match',detail:bad+(bad===1?' check did not pass. ':' checks did not pass. ')+'See the details below: do not rely on the parts marked in red.'};}
function matchPhotos(check,prints){var wanted={};check.seals.forEach(function(s){s.photos.forEach(function(p){wanted[p.sha256Hex]=true;});});
var matched={},unmatched=[];prints.forEach(function(p){if(wanted[p.hex]&&!matched[p.hex])matched[p.hex]=p.name;else if(!wanted[p.hex])unmatched.push(p.name);});
return {matched:matched,unmatched:unmatched};}
var View={formatTime:formatTime,partName:partName,sealRows:sealRows,linkRows:linkRows,summarize:summarize,matchPhotos:matchPhotos};
root.ScratchVerifyView=View;
if(typeof module!=='undefined')module.exports={ScratchVerifyView:View};
if(typeof document==='undefined')return;

var MAX_PROOF=5*1024*1024,MAX_PHOTO=512*1024*1024,state={check:null,prints:[]};
function $(id){return document.getElementById(id);}
function el(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;}
function rowEl(r){var d=el('div','row state-'+r.state);d.appendChild(el('span','dot'));var b=el('div','row-body');
b.appendChild(el('div','row-label',r.label));b.appendChild(el('div','row-value'+(r.mono?' mono':''),r.value));
if(r.detail)b.appendChild(el('div','row-detail mono',r.detail));d.appendChild(b);return d;}
function photoEl(p){var hit=state.check&&matchPhotos(state.check,state.prints).matched[p.sha256Hex];
var r={label:'Photo '+p.id+' · taken '+formatTime(p.takenAt)+' (phone clock)',value:hit?'Matches '+hit:(state.prints.length?'No dropped photo matches':'Not checked'),state:hit?'ok':(state.prints.length?'warn':'info'),detail:p.sha256Hex};
return rowEl(r);}
function sealCard(s){var c=el('article','card seal'+(s.ok?' is-ok':' is-bad'));var h=el('header','seal-head');
h.appendChild(el('h3',null,partName(s.part)));h.appendChild(el('span','pill '+(s.ok?'pill-ok':'pill-bad'),s.ok?'All checks passed':'Check failed'));c.appendChild(h);
var facts=el('div','facts');sealRows(s).forEach(function(r){if(r.state!=='info')return c.appendChild(rowEl(r));
var f=el('div','fact');f.appendChild(el('div','row-label',r.label));f.appendChild(el('div','row-value'+(r.mono?' mono':''),r.value));facts.appendChild(f);});
if(facts.childNodes.length)c.appendChild(facts);
if(s.photos.length){c.appendChild(el('div','sub',s.photos.length+(s.photos.length===1?' sealed photo':' sealed photos')));s.photos.forEach(function(p){c.appendChild(photoEl(p));});}
return c;}
function render(){var check=state.check,sum=summarize(check),v=$('verdict');v.className='verdict '+(sum.ok?'is-ok':'is-bad');v.textContent='';
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
Promise.all(list.map(function(f){return f.arrayBuffer().then(function(b){return root.ScratchProofVerify.fingerprint(new Uint8Array(b));}).then(function(hex){return {name:f.name,hex:hex};});}))
.then(function(prints){state.prints=state.prints.concat(prints);render();}).catch(function(){$('photo-count').textContent='A photo could not be read.';});}
function dropZone(zone,input,take){input.addEventListener('change',function(){take(input.files);input.value='';});
['dragenter','dragover'].forEach(function(n){zone.addEventListener(n,function(e){e.preventDefault();zone.classList.add('over');});});
['dragleave','drop'].forEach(function(n){zone.addEventListener(n,function(e){e.preventDefault();zone.classList.remove('over');});});
zone.addEventListener('drop',function(e){if(e.dataTransfer&&e.dataTransfer.files.length)take(e.dataTransfer.files);});}
function start(){if(!root.ScratchProofVerify){fail('This browser cannot run the check (it needs WebCrypto).');return;}
dropZone($('drop'),$('file'),function(files){readProof(files[0]);});
dropZone($('photo-drop'),$('photos'),readPhotos);
window.addEventListener('dragover',function(e){e.preventDefault();});window.addEventListener('drop',function(e){e.preventDefault();});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})(typeof window!=='undefined'?window:globalThis);
