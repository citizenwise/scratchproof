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
for(const f of ['index.html','dispute-letter.html','privacy.html','terms.html','letter.js','style.css']){const s=readFileSync(new URL(f,import.meta.url),'utf8');
assert(!/fetch\(|XMLHttpRequest|sendBeacon|WebSocket/.test(s),f);
const WL='https://forms.gle/NnTyar7YSfQTSBLS7';const t=s.split(WL).join('');
if(f.endsWith('.html'))assert(!/(src|href|action)=["']https?:|href="\//.test(t),f+' abs link');}
// waitlist: a plain link to the owner's Google Form (no embed, no form posting from our page)
{const s=readFileSync(new URL('index.html',import.meta.url),'utf8');
assert(s.includes('<a class="btn" href="https://forms.gle/NnTyar7YSfQTSBLS7" target="_blank" rel="noopener noreferrer">'),'waitlist link');
assert(!/<form|<iframe|TODO/.test(s),'no form/embed/TODO');}
// brand notice: TM on the name in the nav and a copyright + trademark footer on every page
for(const f of ['index.html','dispute-letter.html','privacy.html','terms.html']){const s=readFileSync(new URL(f,import.meta.url),'utf8');
assert(s.includes('<a href="index.html">ScratchProof™</a>'),f+' TM');
assert(/<footer class="legal">© 2026 ScratchProof\. ScratchProof™ and the ScratchProof logo are trademarks of ScratchProof\. All rights reserved\.<\/footer>/.test(s),f+' footer');}
// every page links Privacy and Terms; the app links /scratchproof/privacy and /scratchproof/terms
for(const f of ['index.html','dispute-letter.html','privacy.html','terms.html']){const s=readFileSync(new URL(f,import.meta.url),'utf8');
assert(s.includes('<a href="privacy.html">Privacy</a>')&&s.includes('<a href="terms.html">Terms</a>'),f+' legal links');}
// privacy: what the app really does (no account, no analytics, hash-only timestamp, RevenueCat, on-device encryption)
{const s=readFileSync(new URL('privacy.html',import.meta.url),'utf8');
for(const w of ['No account','no analytics','FreeTSA','only the fingerprint','RevenueCat','encrypted on your phone','We do not sell','Delete the app','Last updated','Contact'])assert(s.includes(w),'privacy: '+w);
assert(!/TODO|\[contact\]/i.test(s),'privacy: no placeholders');}
// privacy: location (app PR 16) is optional, when in use only, sealed with the photos, kept on the phone and never sent
{const s=readFileSync(new URL('privacy.html',import.meta.url),'utf8');
for(const w of ['Location (optional)','only while you use the app','never in the background','sealed with the photos','stays on your phone','never sent anywhere','Skip, use time only','Location on sealed photos','no map'])assert(s.includes(w),'privacy location: '+w);
const sent=s.slice(s.indexOf('<h2>What is sent'),s.indexOf('<h2>Permissions'));assert(sent.length>0&&!/location/i.test(sent),'privacy: location is not in what is sent');}
// terms: honest limits of the seal, store billing, not legal advice
{const s=readFileSync(new URL('terms.html',import.meta.url),'utf8');
for(const w of ['not legal advice','renews automatically','Apple','Google Play','refund','does not prove when','Last updated','Contact'])assert(s.includes(w),'terms: '+w);
assert(!/TODO|\[contact\]/i.test(s),'terms: no placeholders');}
console.log('all tests passed');
