// Dispute letter page glue (red team 2 L9: no inline script, so the page can carry a strict CSP). Nothing is sent.
(function(){
var $=function(i){return document.getElementById(i)};
$('f').addEventListener('submit',function(e){e.preventDefault();
var v={};['company','bookingRef','pickupDate','returnDate','amount','region'].forEach(function(k){v[k]=$(k).value;});
var r=ScratchLetter.generateLetter(v);$('err').hidden=r.ok;$('out').hidden=!r.ok;
if(r.ok)$('letter').value=r.text;else $('err').textContent='Please fill in: '+r.missing.join(', ');});
$('copy').addEventListener('click',function(){var t=$('letter');t.select();if(navigator.clipboard)navigator.clipboard.writeText(t.value);else document.execCommand('copy');});
$('dl').addEventListener('click',function(){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([$('letter').value],{type:'text/plain'}));a.download='dispute-letter.txt';a.click();});
})();
