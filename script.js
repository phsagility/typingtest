
// Typing Test – SLIGHTLY HARDER MEDIUM: net WPM + last-two-words edit + next-word blocker
let startTime, timerInterval, testCompleted = false; let typedTextRaw = '';
const displayTextEl = document.getElementById('displayText');
const displayText = displayTextEl.innerText;
const typingShell = document.getElementById('typingShell');
const typingInput = document.getElementById('typingInput');
typingInput.addEventListener('paste', (e) => e.preventDefault());
typingInput.addEventListener('copy', (e) => e.preventDefault());
typingInput.addEventListener('cut', (e) => e.preventDefault());
const typingOverlay = document.getElementById('typingOverlay');
const timeEl = document.getElementById('time');
const wpmEl = document.getElementById('wpm');
const accuracyEl = document.getElementById('accuracy');
const finishedBtn = document.getElementById('finishedBtn');
const retakeBtn = document.getElementById('retakeBtn');
const newApplicantBtn = document.getElementById('newApplicantBtn');
const downloadBtn = document.getElementById('downloadBtn');
const rTime = document.getElementById('rTime');
const rWpm = document.getElementById('rWpm');
const rAcc = document.getElementById('rAcc');
const historyList = document.getElementById('historyList');

const wordBounds = getWordBoundaries(displayText);

function startTimer(){ startTime = Date.now(); timerInterval = setInterval(updateTimeAndStats, 1000); }
function updateTimeAndStats(){ const elapsed = Math.floor((Date.now()-startTime)/1000); const m = Math.floor(elapsed/60); const s = elapsed%60; timeEl.textContent = m>0?`${m}m ${s}s`:`${s}s`; calculateStats(); }

typingInput.addEventListener('input', ()=>{ if(testCompleted) return; if(!startTime) startTimer(); typedTextRaw = typingInput.value; renderOverlay(); renderDisplayFollowingCaret(); calculateStats(); if(typedTextRaw.length >= displayText.length) finishTest(); });

typingInput.addEventListener('scroll', ()=>{ typingOverlay.scrollTop = typingInput.scrollTop; typingOverlay.scrollLeft = typingInput.scrollLeft; });

function renderOverlay(){ let segments=[], currentType=null, buffer=''; for(let i=0;i<typedTextRaw.length;i++){ const ok = (i<displayText.length && typedTextRaw[i]===displayText[i]); const type = ok?'correct':'incorrect'; if(currentType===null){ currentType=type; buffer=typedTextRaw[i]; } else if(type===currentType){ buffer+=typedTextRaw[i]; } else { segments.push({type:currentType,text:buffer}); currentType=type; buffer=typedTextRaw[i]; } } if(buffer) segments.push({type:currentType,text:buffer}); let html=''; for(const seg of segments){ html += `<span class="${seg.type}">${escapeHtml(seg.text)}</span>`; } typingOverlay.innerHTML = html; }

function findWordIndexAtPos(pos){
  let idx=0;
  for(let i=0;i<wordBounds.length;i++){
    const {start,end} = wordBounds[i];
    if(pos < start){ idx=i; break; }
    if(pos >= start && pos < end){ idx=i; break; }
    if(pos === end){ idx = Math.min(i+1, wordBounds.length-1); break; }
    if(i === wordBounds.length-1) idx=i;
  }
  return idx;
}

function renderDisplayFollowingCaret(){ const pos = typingInput.selectionStart ?? typedTextRaw.length; if(pos>=displayText.length){ displayTextEl.innerText = displayText; return; } const idx = findWordIndexAtPos(pos); let html=''; for(let i=0;i<wordBounds.length;i++){ const wb=wordBounds[i]; const w=escapeHtml(displayText.slice(wb.start,wb.end)); const t=escapeHtml(displayText.slice(wb.end,wb.nextStart)); html += (i===idx)?`<span class="current">${w}</span>${t}`:`${w}${t}`; } displayTextEl.innerHTML = html; }

function calculateStats(){
  if(!startTime){ wpmEl.textContent='0'; accuracyEl.textContent='0%'; return; }
  const minutes=(Date.now()-startTime)/60000;
  // Gross WPM by characters
  const grossWPM = minutes>0 ? (typedTextRaw.length / 5) / minutes : 0;
  // Error count: number of incorrect characters in the typed portion
  let errors=0; const len=Math.min(typedTextRaw.length, displayText.length);
  let correct=0;
  for(let i=0;i<len;i++) {
    if(typedTextRaw[i]===displayText[i]) correct++; else errors++;
  }
  // Net WPM = gross - errors per minute (standard typing scoring)
  const netWPM = Math.max(0, Math.round(grossWPM - (errors / minutes || 0)));
  const acc = displayText.length?Math.round((correct/displayText.length)*100):0;
  wpmEl.textContent = String(netWPM);
  accuracyEl.textContent = String(acc);
}

function finishTest(){ if(!startTime) startTime=Date.now(); testCompleted=true; clearInterval(timerInterval); typingShell.classList.add('locked'); typingInput.readOnly=true; rTime.textContent=timeEl.textContent; rWpm.textContent=wpmEl.textContent; rAcc.textContent=`${accuracyEl.textContent}%`.replace('%%','%'); downloadBtn.classList.remove('hidden'); const item={ name: localStorage.getItem('fullName'), date: localStorage.getItem('date'), time: rTime.textContent, wpm: rWpm.textContent, accuracy: accuracyEl.textContent }; saveHistory(item); prependHistoryItem(item); }

function saveHistory(item){ const h=JSON.parse(localStorage.getItem('typingHistory'))||[]; h.push(item); localStorage.setItem('typingHistory', JSON.stringify(h)); }
function loadHistoryForCurrentApplicant(){ historyList.innerHTML=''; const h=JSON.parse(localStorage.getItem('typingHistory'))||[]; const n=localStorage.getItem('fullName'); const d=localStorage.getItem('date'); h.filter(x=>x.name===n && x.date===d).reverse().forEach(prependHistoryItem); }
function prependHistoryItem(item){ const li=document.createElement('li'); li.textContent=`${item.name}\n ${item.date}\n Time: ${item.time}\n WPM: ${item.wpm}\n Accuracy: ${item.accuracy}%`; historyList.insertBefore(li, historyList.firstChild); }

finishedBtn.addEventListener('click', ()=>{ if(!testCompleted) finishTest(); });
retakeBtn.addEventListener('click', ()=>{ typedTextRaw=''; typingInput.value=''; typingOverlay.innerHTML=''; typingShell.classList.remove('locked'); typingInput.readOnly=false; testCompleted=false; startTime=null; timeEl.textContent='0s'; wpmEl.textContent='0'; accuracyEl.textContent='0%'; displayTextEl.innerText=displayText; downloadBtn.classList.add('hidden'); typingInput.focus(); });
newApplicantBtn.addEventListener('click', ()=>{ localStorage.removeItem('fullName'); localStorage.removeItem('date'); window.location.href='login.html'; });

const { jsPDF } = window.jspdf || {};
if (jsPDF) {
  downloadBtn.addEventListener('click', ()=>{ const doc = new jsPDF(); const name=localStorage.getItem('fullName'); const date=localStorage.getItem('date'); const time=timeEl.textContent; const wpm=wpmEl.textContent; const acc=accuracyEl.textContent; doc.setFontSize(16); doc.text('Typing Test Result',20,20); doc.text(`Name: ${name}`,20,40); doc.text(`Date: ${date}`,20,50); doc.text(`Time Taken: ${time}`,20,60); doc.text(`WPM: ${wpm}`,20,70); doc.text(`Accuracy: ${acc}%`,20,80); doc.text('Typed Text:',20,100); doc.setFontSize(12); doc.text(typedTextRaw,20,110,{maxWidth:170}); doc.save('TypingTestResult.pdf'); });
} else {
  downloadBtn.title = 'Connect to the internet to enable PDF export';
}

function getWordBoundaries(text){ const bounds=[]; let i=0,n=text.length; while(i<n){ while(i<n && /\s/.test(text[i])) i++; const start=i; while(i<n && !/\s/.test(text[i])) i++; const end=i; let j=i; while(j<n && /\s/.test(text[j])) j++; bounds.push({start,end,nextStart:j}); } return bounds.filter(b=>b.start<b.end); }
function escapeHtml(str){ return str.replace(/[&<>"']/g, (c)=>({'&':'&','<':'<','>':'>','"':'"','\'':'&#39;'}[c])); }

// Initialize history for current applicant on load
window.addEventListener('DOMContentLoaded', loadHistoryForCurrentApplicant);

// RULE: Can't go to next word until current word is correct
typingInput.addEventListener('keydown', (e) => {
  if (testCompleted) return;
  const isWordAdvance = (e.key === ' ' || e.key === 'Enter');
  if (!isWordAdvance) return; // enforce only at word boundaries
  const current = typingInput.value;
  const pos = typingInput.selectionStart;
  if (current.slice(0,pos) !== displayText.slice(0,pos)) { e.preventDefault(); return; }
  const expectedNextChar = displayText[pos] || '';
  const nextChar = (e.key === 'Enter') ? '\n' : ' ';
  if (expectedNextChar !== nextChar) { e.preventDefault(); return; }
});

// RULE: Only last TWO words are editable
function getAllowedMinPos(){
  const pos = typingInput.selectionStart;
  const idx = findWordIndexAtPos(pos);
  const allowedIdx = Math.max(0, idx-1); // allow current + previous word only
  return wordBounds[allowedIdx]?.start ?? 0;
}
function enforceCaretMin(){
  const min = getAllowedMinPos();
  const s = typingInput.selectionStart; const e = typingInput.selectionEnd;
  if (s < min) {
    const newStart = min;
    const newEnd = Math.max(min, e);
    typingInput.setSelectionRange(newStart, newEnd);
  }
}
// prevent moving caret before allowed window with nav keys
typingInput.addEventListener('keydown', (e) => {
  const navKeys = new Set(['Backspace','ArrowLeft','Home']);
  if (!navKeys.has(e.key)) return;
  const min = getAllowedMinPos();
  const s = typingInput.selectionStart; const ePos = typingInput.selectionEnd;
  if (e.key === 'Backspace' && s <= min && s === ePos) { e.preventDefault(); return; }
  if (e.key === 'ArrowLeft' && (s - 1) < min) { e.preventDefault(); return; }
  if (e.key === 'Home') { e.preventDefault(); typingInput.setSelectionRange(min, min); return; }
});

document.addEventListener('selectionchange', () => {
  if (document.activeElement === typingInput) enforceCaretMin();
});

typingInput.addEventListener('mouseup', enforceCaretMin);
typingInput.addEventListener('keyup', enforceCaretMin);
typingInput.addEventListener('focus', enforceCaretMin);
