import {createRequire} from 'module';import {readFileSync} from 'fs';import assert from 'assert';
const {generateLetter}=createRequire(import.meta.url)('./letter.js');
const base={company:'Acme',bookingRef:'AB123',pickupDate:'2027-01-01',returnDate:'2027-01-05',amount:'$440'};
for(const region of ['US','UK','EU']){const r=generateLetter({...base,region});assert(r.ok,region);
for(const w of ['AB123','$440','repair invoice','damage sheet','not legal advice'])assert(r.text.includes(w),region+w);}
assert(generateLetter({...base,region:'US'}).text!==generateLetter({...base,region:'UK'}).text);
for(const k of Object.keys(base)){const x={...base,region:'US'};delete x[k];const r=generateLetter(x);assert(!r.ok&&r.missing.includes(k),k);}
assert(!generateLetter({...base,region:'XX'}).ok);
const e=generateLetter({...base,company:'<script>alert(1)</script>',region:'US'}).text;
assert(!e.includes('<script>')&&e.includes('&lt;script&gt;'));
for(const f of ['index.html','dispute-letter.html','privacy.html','terms.html','verify.html','letter.js','verify.js','verify-lib.js','style.css']){const s=readFileSync(new URL(f,import.meta.url),'utf8');
assert(!/fetch\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|importScripts|navigator\.share/.test(s),f);
const WL='https://forms.gle/NnTyar7YSfQTSBLS7';const t=s.split(WL).join('');
if(f.endsWith('.html'))assert(!/(src|href|action)=["']https?:|href="\//.test(t),f+' abs link');}
// waitlist: a plain link to the owner's Google Form (no embed, no form posting from our page)
{const s=readFileSync(new URL('index.html',import.meta.url),'utf8');
assert(s.includes('<a class="btn" href="https://forms.gle/NnTyar7YSfQTSBLS7" target="_blank" rel="noopener noreferrer">'),'waitlist link');
assert(!/<form|<iframe|TODO/.test(s),'no form/embed/TODO');}
// brand notice: TM on the name in the nav and a copyright + trademark footer on every page
for(const f of ['index.html','dispute-letter.html','privacy.html','terms.html','verify.html']){const s=readFileSync(new URL(f,import.meta.url),'utf8');
assert(s.includes('<a href="index.html">ScratchProof™</a>'),f+' TM');
assert(/<footer class="legal">© 2026 ScratchProof\. ScratchProof™ and the ScratchProof logo are trademarks of ScratchProof\. All rights reserved\.<\/footer>/.test(s),f+' footer');}
// every page links Privacy and Terms; the app links /scratchproof/privacy and /scratchproof/terms
for(const f of ['index.html','dispute-letter.html','privacy.html','terms.html','verify.html']){const s=readFileSync(new URL(f,import.meta.url),'utf8');
assert(s.includes('<a href="privacy.html">Privacy</a>')&&s.includes('<a href="terms.html">Terms</a>'),f+' legal links');}
// privacy: what the app really does (no account, no analytics, hash-only timestamp, RevenueCat, on-device encryption)
{const s=readFileSync(new URL('privacy.html',import.meta.url),'utf8');
for(const w of ['No account','no analytics','FreeTSA','only the fingerprint','RevenueCat','encrypted on your phone','We do not sell','Delete the app','Last updated','Contact'])assert(s.includes(w),'privacy: '+w);
assert(!/TODO|\[contact\]/i.test(s),'privacy: no placeholders');}
// privacy: the photo zip (a plaintext copy, only when the user shares it) and Settings > Delete all data
{const s=readFileSync(new URL('privacy.html',import.meta.url),'utf8');
const kept=s.slice(s.indexOf('<h2>What stays on your phone'),s.indexOf('<h2>Location'));
for(const w of ['Nothing leaves the phone unless you share it yourself','Share photos (zip)','not encrypted','deleted from the phone after sharing'])assert(kept.includes(w),'privacy zip: '+w);
const rights=s.slice(s.indexOf('<h2>Your choices'));
for(const w of ['Delete all data','Purchases stay with your App Store or Google Play account'])assert(rights.includes(w),'privacy delete: '+w);}
// privacy: location (app PR 16) is optional, when in use only, sealed with the photos, kept on the phone and never sent
{const s=readFileSync(new URL('privacy.html',import.meta.url),'utf8');
for(const w of ['Location (optional)','only while you use the app','never in the background','sealed with the photos','stays on your phone','never sent anywhere','Skip, use time only','Location on sealed photos','no map'])assert(s.includes(w),'privacy location: '+w);
const sent=s.slice(s.indexOf('<h2>What is sent'),s.indexOf('<h2>Permissions'));assert(sent.length>0&&!/location/i.test(sent),'privacy: location is not in what is sent');}
// privacy: the agreement scan (app agreement PR) reads the text on the phone; nothing is sent and the text is not kept
{const s=readFileSync(new URL('privacy.html',import.meta.url),'utf8');
const scan=s.slice(s.indexOf('<h2>Agreement scan'),s.indexOf('<h2>What is sent'));
for(const w of ['Agreement scan (optional)','text recognition runs on your phone','nothing is sent','no model is downloaded','usage reports','The recognised text is not kept','encrypted on your phone','not sealed'])assert(scan.includes(w),'privacy agreement: '+w);
const sent=s.slice(s.indexOf('<h2>What is sent'),s.indexOf('<h2>Permissions'));assert(sent.length>0&&!/agreement/i.test(sent),'privacy: the agreement is not in what is sent');
assert(s.slice(s.indexOf('<h2>Permissions')).includes('photo of your rental agreement'),'privacy: camera for the agreement');}
// terms: honest limits of the seal, store billing, not legal advice
{const s=readFileSync(new URL('terms.html',import.meta.url),'utf8');
for(const w of ['not legal advice','renews automatically','Apple','Google Play','refund','does not prove when','Last updated','Contact'])assert(s.includes(w),'terms: '+w);
assert(!/TODO|\[contact\]/i.test(s),'terms: no placeholders');}
// verify page (app PR 19): the app's own seal check (verify-lib.js, built by the app repo's tools/build-verify-web.ts) on real
// FreeTSA-stamped proof files; the copies in test-fixtures/ are byte-identical to the app repo's seal fixtures.
{const vm=await import('vm');const {webcrypto}=await import('crypto');
const PAGES=['index.html','dispute-letter.html','privacy.html','terms.html','verify.html'];
for(const f of PAGES)assert(readFileSync(new URL(f,import.meta.url),'utf8').includes('<a href="verify.html">Verify a proof</a>'),f+' nav: verify');
assert(/<a href="verify\.html">[^<]*proof file[^<]*<\/a>/.test(readFileSync(new URL('index.html',import.meta.url),'utf8')),'index links the verify page');
const box={crypto:webcrypto,TextEncoder,TextDecoder};vm.createContext(box);
vm.runInContext(readFileSync(new URL('verify-lib.js',import.meta.url),'utf8'),box);const lib=box.ScratchProofVerify;
assert(lib&&typeof lib.verify==='function'&&typeof lib.fingerprint==='function','verify-lib exposes ScratchProofVerify');
const fx=n=>readFileSync(new URL('test-fixtures/proof-'+n+'.scratchproof-proof.json',import.meta.url),'utf8');
const run=async n=>{const r=await lib.verify(fx(n));assert(r.ok,n+' parses');return r.value;};
const pickupOf=c=>c.seals.find(s=>s.part==='pickup');
const valid=await run('valid');assert(valid.ok,'valid passes');
assert.deepEqual(valid.seals.map(s=>[s.part,s.hashMatches,s.wellFormed,s.timestamp.status]),[['pickup',true,true,'checked'],['return',true,true,'checked'],['agent',true,true,'checked']]);
assert.deepEqual(valid.links,[{part:'return',linked:true},{part:'agent',linked:true}]);
const tm=await run('tampered-manifest');assert(!tm.ok&&!pickupOf(tm).hashMatches,'tampered manifest fails on the hash');
const tt=await run('tampered-token');assert(!tt.ok&&pickupOf(tt).timestamp.reason==='the time stamp signature does not verify','tampered token fails on the signature');
const wc=await run('wrong-cert');assert(!wc.ok&&/certificate/.test(pickupOf(wc).timestamp.reason),'wrong cert fails on the certificate');
assert(!(await lib.verify('{"not":"a proof file"}')).ok,'not a proof file');
const photo=n=>new Uint8Array(readFileSync(new URL('test-fixtures/proof-photo-'+n+'.png',import.meta.url)));
const prints=[];for(const n of ['front','rear','return'])prints.push({name:n+'.png',hex:await lib.fingerprint(photo(n))});
assert.deepEqual(prints.map(p=>p.hex),[...pickupOf(valid).photos,...valid.seals[1].photos].map(p=>p.sha256Hex),'photo fingerprints');
// the page glue: pure view helpers (no DOM here)
const {ScratchVerifyView:V}=createRequire(import.meta.url)('./verify.js');
assert.equal(V.summarize(valid).ok,true);assert.equal(V.summarize(valid).title,'Every check passed');
for(const c of [tm,tt,wc])assert.equal(V.summarize(c).title,'Something does not match');
const rows=V.sealRows(pickupOf(valid));const row=l=>rows.find(r=>r.label===l);
assert.equal(row('Root hash').state,'ok');assert.equal(row('Timestamp signature').state,'ok');
assert.equal(row('Proof code').value,pickupOf(valid).proofCode);assert.equal(row('Serial').value,pickupOf(valid).timestamp.serialHex);
assert(/^6 Nov 2026, \d\d:\d\d:\d\d UTC$/.test(row('Timestamp time').value),row('Timestamp time').value);
const bad=V.sealRows(pickupOf(tt));assert(bad.some(r=>r.state==='bad'&&r.value.includes('the time stamp signature does not verify')),'reason shown');
assert.equal(V.sealRows(pickupOf(tm)).find(r=>r.label==='Root hash').state,'bad');
assert.deepEqual(V.linkRows(valid).map(r=>r.state),['ok','ok']);assert.deepEqual(V.linkRows(tm).map(r=>r.state),['bad','bad']);
const m=V.matchPhotos(valid,[...prints,{name:'other.jpg',hex:'0'.repeat(64)}]);
assert.equal(m.matched[pickupOf(valid).photos[0].sha256Hex],'front.png');assert.deepEqual(m.unmatched,['other.jpg']);
assert.equal(V.partName('agent'),'Agent’s acknowledgement');
// honest wording, same as the app's; nothing leaves the browser
const page=readFileSync(new URL('verify.html',import.meta.url),'utf8');const glue=readFileSync(new URL('verify.js',import.meta.url),'utf8');
for(const w of ['runs in your browser','Nothing is uploaded','existed, unchanged','independent timestamp (RFC 3161, from FreeTSA)','does not show when each photo was taken','not a qualified timestamp authority','.scratchproof-proof.json','not legal advice'])assert(page.includes(w),'verify wording: '+w);
for(const s of [page,glue])assert(!/trusted|genuine|authentic|guarantee/i.test(s),'no overclaiming words');
assert(page.includes("connect-src 'none'"),'CSP blocks every connection');
assert(page.includes('<script src="verify-lib.js"></script>')&&page.includes('<script src="verify.js"></script>')&&!/<script>/.test(page),'external scripts only');
assert(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(|new Function/.test(glue),'file content is rendered as text only');
assert(/<input[^>]+type="file"[^>]+accept="[^"]*\.json/.test(page),'proof file picker');}
console.log('all tests passed');
