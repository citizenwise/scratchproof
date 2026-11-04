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
for(const f of ['index.html','dispute-letter.html','letter.js','style.css']){const s=readFileSync(new URL(f,import.meta.url),'utf8');
assert(!/fetch\(|XMLHttpRequest|sendBeacon|WebSocket/.test(s),f);
const WL='https://forms.gle/NnTyar7YSfQTSBLS7';const t=s.split(WL).join('');
if(f.endsWith('.html'))assert(!/(src|href|action)=["']https?:|href="\//.test(t),f+' abs link');}
// waitlist: a plain link to the owner's Google Form (no embed, no form posting from our page)
{const s=readFileSync(new URL('index.html',import.meta.url),'utf8');
assert(s.includes('<a class="btn" href="https://forms.gle/NnTyar7YSfQTSBLS7" target="_blank" rel="noopener noreferrer">'),'waitlist link');
assert(!/<form|<iframe|TODO/.test(s),'no form/embed/TODO');}
// brand notice: TM on the name in the nav and a copyright + trademark footer on every page
for(const f of ['index.html','dispute-letter.html']){const s=readFileSync(new URL(f,import.meta.url),'utf8');
assert(s.includes('<a href="index.html">ScratchProof™</a>'),f+' TM');
assert(/<footer class="legal">© 2026 ScratchProof\. ScratchProof™ and the ScratchProof logo are trademarks of ScratchProof\. All rights reserved\.<\/footer>/.test(s),f+' footer');}
console.log('all tests passed');
