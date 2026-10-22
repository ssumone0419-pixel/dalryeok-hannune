
(()=>{'use strict';
const $=id=>document.getElementById(id), pad=n=>String(n).padStart(2,'0');
const BASE=Date.UTC(1900,0,1), DAY=86400000, COUNT=window.DalryeokData.dayCount;
const raw=atob(window.DalryeokData.packed);
if(raw.length!==COUNT*3)throw Error('공식 날짜 데이터가 손상되었습니다.');
const byLunar=new Map(), monthDays=new Map(), leapMonths=new Set();
function decode(i){const p=i*3,v=(raw.charCodeAt(p)<<16)|(raw.charCodeAt(p+1)<<8)|raw.charCodeAt(p+2);return {year:1800+(v>>>10),month:(v>>>6)&15,day:(v>>>1)&31,leap:!!(v&1)}}
function lunarKey(y,m,d,l){return `${y}-${m}-${d}-${l?1:0}`}
function monthKey(y,m,l){return `${y}-${m}-${l?1:0}`}
function dateOf(i){return new Date(BASE+i*DAY).toISOString().slice(0,10)}
for(let i=0;i<COUNT;i++){const l=decode(i),key=lunarKey(l.year,l.month,l.day,l.leap),mk=monthKey(l.year,l.month,l.leap);if(byLunar.has(key))throw Error('음력 데이터에 중복이 있습니다.');byLunar.set(key,i);monthDays.set(mk,Math.max(monthDays.get(mk)||0,l.day));if(l.leap)leapMonths.add(`${l.year}-${l.month}`)}
let mode='solar',last='';
const solarStr=(y,m,d)=>`${y}년 ${m}월 ${d}일`;
function fill(el,start,end,selected){el.innerHTML='';for(let i=start;i<=end;i++){const opt=document.createElement('option');opt.value=i;opt.textContent=`${i}${el.id==='year'?'년':el.id==='month'?'월':'일'}`;el.appendChild(opt)}el.value=String(Math.min(end,Math.max(start,selected)))}
function solarIndex(y,m,d){const t=Date.UTC(y,m-1,d),check=new Date(t);if(check.getUTCFullYear()!==y||check.getUTCMonth()+1!==m||check.getUTCDate()!==d)return -1;const i=(t-BASE)/DAY;return Number.isInteger(i)&&i>=0&&i<COUNT?i:-1}
function selectedLunarMonth(){const value=$('month').value;return {month:parseInt(value,10),leap:value.endsWith('L')}}
function fillMonths(year,selectedMonth,selectedLeap=false){
 const el=$('month');el.innerHTML='';
 for(let m=1;m<=12;m++){
  const regular=document.createElement('option');regular.value=String(m);regular.textContent=leapMonths.has(`${year}-${m}`)?`${m}월 (평달)`:`${m}월`;el.appendChild(regular);
  if(leapMonths.has(`${year}-${m}`)){
   const leap=document.createElement('option');leap.value=`${m}L`;leap.textContent=`윤${m}월`;el.appendChild(leap);
  }
 }
 const target=String(selectedMonth)+(selectedLeap?'L':'');
 el.value=Array.from(el.options).some(o=>o.value===target)?target:String(selectedMonth);
 $('monthHelp').textContent=Array.from(el.options).some(o=>o.value.endsWith('L'))?'이 해의 윤달은 월 목록에서 바로 선택할 수 있습니다.':'';
 $('monthHelp').hidden=!$('monthHelp').textContent;
}
function refreshDays(){
 const y=+$('year').value,old=+$('day').value||1;
 const {month,leap}=mode==='lunar'?selectedLunarMonth():{month:+$('month').value,leap:false};
 const max=mode==='solar'?new Date(Date.UTC(y,month,0)).getUTCDate():(monthDays.get(monthKey(y,month,leap))||0);
 fill($('day'),1,Math.max(1,max),Math.min(old,Math.max(1,max)));
}
function onYearChange(){
 if(mode==='lunar'){
  const {month,leap}=selectedLunarMonth();fillMonths(+$('year').value,month,leap);
 }
 refreshDays();
}
function switchMode(next){
 mode=next;
 $('solarTab').classList.toggle('active',mode==='solar');$('lunarTab').classList.toggle('active',mode==='lunar');$('solarTab').setAttribute('aria-pressed',String(mode==='solar'));$('lunarTab').setAttribute('aria-pressed',String(mode==='lunar'));
 $('inputTitle').textContent=mode==='solar'?'변환할 양력 날짜를 선택하세요':'변환할 음력 날짜를 선택하세요';
 $('resultLabel').textContent=mode==='solar'?'음력 변환 결과':'양력 변환 결과';$('error').textContent='';
 const today=new Date();let y=today.getFullYear(),m=today.getMonth()+1,d=today.getDate(),isLeap=false;
 if(mode==='lunar'){
  const i=solarIndex(y,m,d),l=i>=0?decode(i):decode(COUNT-1);
  y=l.year;m=l.month;d=l.day;isLeap=l.leap;
 }
 fill($('year'),mode==='solar'?1900:1899,2050,y);
 if(mode==='lunar')fillMonths(y,m,isLeap);else{fill($('month'),1,12,m);for(const option of $('month').options)option.textContent=option.value+'월';$('monthHelp').hidden=true;}
 refreshDays();$('day').value=String(d);convert();
}
function convert(){
 const y=+$('year').value,d=+$('day').value;
 const {month:m,leap}=mode==='lunar'?selectedLunarMonth():{month:+$('month').value,leap:false};
 $('error').textContent='';
 try{
  if(mode==='solar'){
   const i=solarIndex(y,m,d);if(i<0)throw Error('양력 1900-01-01부터 2050-12-31까지만 지원합니다.');
   const l=decode(i);last=`양력 ${solarStr(y,m,d)} → 음력 ${l.year}년 ${l.leap?'윤':''}${l.month}월 ${l.day}일`;
   $('resultDate').textContent=`${l.year}년 ${l.leap?'윤':''}${l.month}월 ${l.day}일`;
   $('resultSub').textContent=`${l.leap?'윤달':'평달'} · 양력 ${y}.${pad(m)}.${pad(d)}`;
  }else{
   const i=byLunar.get(lunarKey(y,m,d,leap));
   if(i===undefined)throw Error('해당 음력 날짜는 지원 범위에 없거나 존재하지 않습니다.');
   const [sy,sm,sd]=dateOf(i).split('-').map(Number);
   last=`음력 ${y}년 ${leap?'윤':''}${m}월 ${d}일 → 양력 ${solarStr(sy,sm,sd)}`;
   $('resultDate').textContent=solarStr(sy,sm,sd);
   $('resultSub').textContent=`음력 ${y}년 ${leap?'윤':''}${m}월 ${d}일`;
  }
 }catch(e){$('error').textContent=e.message;$('resultDate').textContent='변환할 수 없습니다';$('resultSub').textContent='날짜를 다시 확인해 주세요.';last=''}
}
$('solarTab').onclick=()=>switchMode('solar');$('lunarTab').onclick=()=>switchMode('lunar');
$('convert').onclick=convert;$('year').onchange=onYearChange;$('month').onchange=refreshDays;
$('copy').onclick=async()=>{if(!last)return;try{await navigator.clipboard.writeText(last);$('copy').textContent='복사 완료 ✓';setTimeout(()=>$('copy').textContent='결과 복사하기',1500)}catch(e){$('error').textContent='브라우저에서 복사를 허용하지 않았습니다.'}};
switchMode('solar');})();
