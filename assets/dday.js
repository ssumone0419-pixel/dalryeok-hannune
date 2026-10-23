(()=>{'use strict';
const $=id=>document.getElementById(id),DAY=86400000,KEY='dalryeok-hannune-events-v1',pad=n=>String(n).padStart(2,'0');
const today=new Date(),todayIso=`${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;
$('startDate').value=todayIso.replaceAll('-','/');$('targetDate').value=todayIso.replaceAll('-','/');
try{const target=new URLSearchParams(location.search).get('date');if(target&&/^\d{4}-\d{2}-\d{2}$/.test(target)){const [y,m,d]=target.split('-').map(Number),check=new Date(Date.UTC(y,m-1,d));if(check.getUTCFullYear()===y&&check.getUTCMonth()+1===m&&check.getUTCDate()===d)$('targetDate').value=target.replaceAll('-','/')}}catch(e){}
let mode='dday',businessType='between',calculationToken=0;
const iso=d=>`${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`;
const parse=s=>{const normalized=(s||'').trim().replaceAll('/','-');if(!/^\d{4}-\d{2}-\d{2}$/.test(normalized))return null;const [y,m,d]=normalized.split('-').map(Number),dt=new Date(Date.UTC(y,m-1,d));return iso(dt)===normalized?dt:null};
const fmtDays=n=>n===0?'D-DAY':n>0?`D-${n}`:`D+${-n}`;
const setResult=(label,value,detail,day)=>{$('ddayResultLabel').textContent=label;$('ddayResult').textContent=value;$('ddayDetail').textContent=detail;$('ddayCalendar').hidden=!day;if(day)$('ddayCalendar').href=`calendar.html?date=${iso(day)}`};
const holidayCache=new Map();
async function getHolidays(year){
 if(holidayCache.has(year))return holidayCache.get(year);
 const response=await fetch(`/api/holidays?year=${year}`,{headers:{accept:'application/json'}});
 if(!response.ok)throw Error(`${year}년 공휴일 조회 실패 (HTTP ${response.status})`);
 const data=await response.json();if(!Array.isArray(data.holidays)||data.year!==year)throw Error(`${year}년 공휴일 응답 형식 오류`);
 const days=new Set();for(const h of data.holidays){if(h&&typeof h.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(h.date)&&h.date.startsWith(`${year}-`))days.add(h.date)}
 if(!days.size)throw Error(`${year}년 공식 공휴일 데이터가 비어 있습니다`);
 holidayCache.set(year,days);return days;
}
async function holidaySet(from,to){
 const years=[];for(let y=from;y<=to;y++)years.push(y);
 if(from<1900||to>2050||years.length>6)throw Error('영업일 계산은 1900~2050년, 최대 6개 연도 범위에서 지원합니다.');
 const sets=await Promise.all(years.map(getHolidays));return new Set(sets.flatMap(set=>[...set]));
}
const workday=(d,holidays)=>![0,6].includes(d.getUTCDay())&&!holidays.has(iso(d));
async function calculate(){
 const token=++calculationToken,a=parse($('startDate').value),b=parse($('targetDate').value);
 $('ddayError').textContent='';
 if(!a||(mode==='dday'||businessType==='between')&&!b){$('ddayError').textContent='날짜를 YYYY/MM/DD 형식으로 정확하게 입력해 주세요.';return}
 if(mode==='dday'){
  const delta=Math.round((b-a)/DAY);
  setResult('목표 날짜까지',fmtDays(delta),`${iso(a).replaceAll('-','/')} → ${iso(b).replaceAll('-','/')} · 날짜 차이 ${Math.abs(delta).toLocaleString('ko-KR')}일 (시작일 제외)`,b);return;
 }
 setResult('영업일 계산 중…','조회 중','공식 공휴일 데이터를 확인하고 있습니다.',null);
 try{
  if(businessType==='between'){
   if(b<a)throw Error('종료일은 시작일과 같거나 이후여야 합니다.');
   if((b-a)/DAY>2192)throw Error('한 번에 계산할 수 있는 기간은 최대 6년입니다.');
   const holidays=await holidaySet(a.getUTCFullYear(),b.getUTCFullYear());
   let count=0;for(let t=a.getTime()+DAY;t<=b.getTime();t+=DAY)if(workday(new Date(t),holidays))count++;
   if(token!==calculationToken)return;
   setResult('주말·공휴일 제외 영업일',`${count.toLocaleString('ko-KR')}일`,`${iso(a)} 다음 날부터 ${iso(b)}까지 · 시작일 제외 · 종료일 포함`,b);
  }else{
   const n=Number($('businessCount').value);
   if(!Number.isInteger(n)||n<1||n>1000)throw Error('추가할 영업일은 1~1000 사이의 정수로 입력해 주세요.');
   const upper=new Date(a.getTime()+(n*3+366)*DAY);
   const holidays=await holidaySet(a.getUTCFullYear(),upper.getUTCFullYear());
   let count=0,day=new Date(a);
   while(count<n){day=new Date(day.getTime()+DAY);if(day.getUTCFullYear()>2050)throw Error('계산 결과가 지원 연도인 2050년을 초과합니다.');if(workday(day,holidays))count++}
   if(token!==calculationToken)return;
   setResult(`${n}영업일 후 날짜`,iso(day).replaceAll('-','/'),`${iso(a)} 다음 날부터 주말·공휴일을 제외한 ${n}영업일 후`,day);
  }
 }catch(e){if(token!==calculationToken)return;setResult('영업일 계산 불가','조회 실패','공휴일 데이터를 확인할 수 없어 영업일 수를 표시하지 않습니다.',null);$('ddayError').textContent=e.message||'공휴일 조회에 실패했습니다.'}
}
function setMode(m){mode=m;for(const [id,val] of [['modeDday','dday'],['modeDiff','business']]){const active=m===val;$(id).classList.toggle('active',active);$(id).setAttribute('aria-pressed',String(active))}$('businessOptions').hidden=m!=='business';$('startLabel').firstChild.textContent=m==='dday'?'기준 날짜':'시작 날짜';updateBusinessType();calculate()}
function updateBusinessType(){businessType=$('businessType').value;const add=mode==='business'&&businessType==='add';$('businessCountWrap').hidden=!add;$('targetLabel').hidden=add;$('calculate').textContent=add?'영업일 후 날짜 계산하기 →':'날짜 계산하기 →'}
$('modeDday').onclick=()=>setMode('dday');$('modeDiff').onclick=()=>setMode('business');$('calculate').onclick=calculate;
$('businessType').addEventListener('change',()=>{updateBusinessType();calculate()});$('businessCount').addEventListener('change',calculate);
// Numeric keyboards cannot type '/', so insert separators automatically as users type or paste.
function formatDateDigits(value){
 const digits=String(value).replace(/\D/g,'').slice(0,8);
 if(digits.length<=4)return digits;
 if(digits.length<=6)return `${digits.slice(0,4)}/${digits.slice(4)}`;
 return `${digits.slice(0,4)}/${digits.slice(4,6)}/${digits.slice(6)}`;
}
for(const id of ['startDate','targetDate']){
 const field=$(id);
 field.addEventListener('input',()=>{
  const caret=field.selectionStart??field.value.length;
  const digitsBefore=field.value.slice(0,caret).replace(/\D/g,'').length;
  const formatted=formatDateDigits(field.value);
  field.value=formatted;
  let newCaret=0,seen=0;
  while(newCaret<formatted.length&&seen<digitsBefore){if(/\d/.test(formatted[newCaret]))seen++;newCaret++}
  if(digitsBefore===0)newCaret=0;
  try{field.setSelectionRange(newCaret,newCaret)}catch(e){}
  $('ddayError').textContent='';
 });
 field.addEventListener('change',()=>{
  const d=parse(field.value);
  if(d)field.value=iso(d).replaceAll('-','/');
  calculate();
 });
}
const grid=$('ddayEvents');function eventCard(e,target,kind){const d=Math.round((target-parse(todayIso))/DAY),box=document.createElement('article');box.className='dday-event';const h=document.createElement('h3');h.textContent=e.name;const count=document.createElement('strong');count.textContent=fmtDays(d);const p=document.createElement('p');p.textContent=`${iso(target)} · ${kind}`;const a=document.createElement('a');a.className='calendar-jump';a.href=`calendar.html?date=${iso(target)}`;a.textContent='달력에서 보기 →';box.append(h,count,p,a);grid.append(box)}
let entries=[];try{const raw=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(raw))throw Error();entries=raw.filter(e=>e&&typeof e.name==='string'&&typeof e.date==='string'&&['none','solar','lunar'].includes(e.repeat))}catch(e){$('eventNotice').textContent='저장된 기념일을 읽지 못했습니다. 브라우저 저장 설정을 확인하세요.'}
const lunarNext=new Map();const lunarEvents=entries.filter(e=>e.repeat==='lunar'&&Number.isInteger(e.lm)&&Number.isInteger(e.ld)&&typeof e.leap==='boolean');
if(lunarEvents.length&&window.DalryeokData){try{const raw=atob(window.DalryeokData.packed),n=window.DalryeokData.dayCount,base=Date.UTC(1900,0,1);for(let i=0;i<n;i++){const ms=base+i*DAY;if(ms<Date.UTC(today.getFullYear(),today.getMonth(),today.getDate()))continue;const v=(raw.charCodeAt(i*3)<<16)|(raw.charCodeAt(i*3+1)<<8)|raw.charCodeAt(i*3+2),m=(v>>>6)&15,d=(v>>>1)&31,leap=!!(v&1);for(const e of lunarEvents){if(!lunarNext.has(e.id)&&e.lm===m&&e.ld===d&&e.leap===leap)lunarNext.set(e.id,new Date(ms))}if(lunarNext.size===lunarEvents.length)break}}catch(e){$('eventNotice').textContent='음력 기념일 계산 데이터를 읽지 못했습니다.'}}
const sorted=[];for(const e of entries){const original=parse(e.date);if(!original)continue;let next=null,kind='한 번만';if(e.repeat==='none'){next=original}else if(e.repeat==='solar'){kind='매년 양력';const [_,m,d]=e.date.split('-').map(Number);for(let y=today.getFullYear();y<=2050;y++){const cand=parse(`${y}-${pad(m)}-${pad(d)}`);if(cand&&cand>=parse(todayIso)){next=cand;break}}}else{kind='매년 음력';next=lunarNext.get(e.id)||null}if(next)sorted.push({e,next,kind})}
sorted.sort((a,b)=>a.next-b.next);for(const {e,next,kind} of sorted)eventCard(e,next,kind);
if(!entries.length)$('eventNotice').textContent='저장된 기념일이 없습니다. 달력 탭에서 기념일을 등록하면 이곳에 자동 표시됩니다.';
else if(!sorted.length&&!$('eventNotice').textContent)$('eventNotice').textContent='표시할 예정 기념일이 없습니다. 지난 일회성 기념일 또는 지원 범위 밖의 날짜는 목록에서 제외됩니다.';
else if(sorted.length)$('eventNotice').textContent=`예정 기념일 ${sorted.length}개 · 달력과 같은 브라우저 저장소 사용`;
// On narrow screens, show saved anniversaries before the general date tips.
const aside=document.querySelector('.dday-aside');
const layout=document.querySelector('.dday-page .layout');
const events=document.querySelector('.dday-events');
if(aside&&layout&&events&&window.matchMedia){
 const mobile=window.matchMedia('(max-width: 600px)');
 const positionTips=()=>{
  if(mobile.matches){events.insertAdjacentElement('afterend',aside)}
  else{layout.append(aside)}
 };
 positionTips();
 if(mobile.addEventListener)mobile.addEventListener('change',positionTips);
 else if(mobile.addListener)mobile.addListener(positionTips);
}
calculate();})();