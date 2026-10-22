(()=>{
'use strict';
const $=id=>document.getElementById(id), pad=n=>String(n).padStart(2,'0');
const today=new Date(),initialYear=today.getFullYear(),minYear=1900,maxYear=2050;
const sel=$('holidayYear');
for(let y=minYear;y<=maxYear;y++){const opt=document.createElement('option');opt.value=String(y);opt.textContent=y+'년';sel.append(opt)}
sel.value=String(Math.min(maxYear,Math.max(minYear,initialYear)));
const fmt=d=>`${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`;
const date=(y,m,d)=>new Date(Date.UTC(y,m-1,d));
const label=d=>`${d.getUTCMonth()+1}월 ${d.getUTCDate()}일`;
const dayLabel=d=>['일','월','화','수','목','금','토'][d.getUTCDay()];
const dayMs=86400000;
const dayAdd=(d,n)=>new Date(d.getTime()+n*dayMs);
const holidayMap=new Map();
const isWeekend=d=>[0,6].includes(d.getUTCDay());
const isRest=d=>isWeekend(d)||holidayMap.has(fmt(d));
function streaks(start,end,leave){
 const found=[];let runStart=null,last=null;
 for(let d=start;d<=end;d=dayAdd(d,1)){
  if(isRest(d)||(leave&&fmt(d)===leave)){if(!runStart)runStart=d;last=d}
  else if(runStart){found.push({start:runStart,end:last,days:Math.round((last-runStart)/dayMs)+1});runStart=null}
 }
 if(runStart)found.push({start:runStart,end:last,days:Math.round((last-runStart)/dayMs)+1});
 return found;
}
function text(tag,value,cls){const el=document.createElement(tag);el.textContent=value;if(cls)el.className=cls;return el}
function render(year){
 const start=date(year,1,1),end=date(year,12,31),holidays=[...holidayMap.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
 $('summary').textContent=`공휴일 표시 날짜 ${holidays.length}일 · 공식 API 기준`;
 const byMonth=Array.from({length:12},()=>[]);
 for(const [iso,names] of holidays){const m=Number(iso.slice(5,7));byMonth[m-1].push({iso,names})}
 const list=$('holidayList');list.replaceChildren();
 for(let m=1;m<=12;m++){
  const box=text('div','','month-card');box.append(text('h3',`${m}월 · ${byMonth[m-1].length}일`));
  if(!byMonth[m-1].length)box.append(text('div','등록된 공휴일 없음','empty'));
  for(const h of byMonth[m-1]){const d=date(Number(h.iso.slice(0,4)),m,Number(h.iso.slice(8,10)));const item=text('div','','holiday-item');const t=text('time',`${m}월 ${d.getUTCDate()}일 (${dayLabel(d)})`);t.dateTime=h.iso;item.append(t,text('span',h.names.join(' · ')));box.append(item)}
  list.append(box)
 }
 const base=streaks(start,end,null).filter(x=>x.days>=3);
 const candidates=[];
 // Check the complete calendar year; a leave day must be a working weekday within the selected year.
 for(let d=start;d<=end;d=dayAdd(d,1)){
  if(isRest(d))continue;
  const leave=fmt(d),segment=streaks(dayAdd(d,-10),dayAdd(d,10),leave).find(s=>s.start<=d&&s.end>=d);
  if(segment&&segment.days>=4&&segment.days>streaks(dayAdd(d,-10),dayAdd(d,10),null).reduce((mx,s)=>s.start<=d&&s.end>=d?s.days:mx,0)){
   candidates.push({...segment,leave})
  }
 }
 // Avoid duplicates and redundant leave suggestions for the same range.
 const unique=new Map();
 for(const c of candidates){const k=`${fmt(c.start)}|${fmt(c.end)}`;if(!unique.has(k))unique.set(k,c)}
 const all=[...base.map(s=>({...s,type:'기본 연휴'})),...[...unique.values()].map(s=>({...s,type:'연차 1일 활용'}))];
 all.sort((a,b)=>b.days-a.days||a.start-b.start);
 const golden=$('golden');golden.replaceChildren();
 if(!all.length)golden.append(text('p','표시할 3일 이상 연휴가 없습니다.','empty'));
 for(const s of all.slice(0,18)){
  const card=text('article','','gold-card');
  card.append(text('div',s.type,'type'),text('h3',`${s.days}일 연휴`),text('div',`${label(s.start)} (${dayLabel(s.start)}) ~ ${label(s.end)} (${dayLabel(s.end)})`,'range'));
  const names=[...holidayMap.entries()].filter(([iso])=>iso>=fmt(s.start)&&iso<=fmt(s.end)).flatMap(([,n])=>n);
  if(names.length)card.append(text('p',[...new Set(names)].join(' · ')));
  if(s.leave)card.append(text('p',`연차 추천: ${label(date(Number(s.leave.slice(0,4)),Number(s.leave.slice(5,7)),Number(s.leave.slice(8,10))))}`,'leave'));
  golden.append(card)
 }
}
let requestId=0;
async function load(){
 const year=Number(sel.value),id=++requestId;
 $('notice').className='notice';$('notice').textContent=`${year}년 공식 공휴일을 조회하고 있습니다…`;
 $('golden').replaceChildren();$('holidayList').replaceChildren();$('summary').textContent='조회 중…';
 try{
  const res=await fetch(`/api/holidays?year=${year}`,{headers:{accept:'application/json'}});
  if(!res.ok)throw Error('API 연결 실패');
  const data=await res.json();
  if(!Array.isArray(data.holidays))throw Error('응답 형식 오류');
  if(id!==requestId)return;
  holidayMap.clear();
  for(const item of data.holidays){
   if(!/^\d{4}-\d{2}-\d{2}$/.test(item.date)||!item.date.startsWith(String(year))||typeof item.name!=='string')continue;
   const arr=holidayMap.get(item.date)||[];if(!arr.includes(item.name))arr.push(item.name);holidayMap.set(item.date,arr)
  }
  if(!holidayMap.size){$('notice').textContent='공식 API에 공휴일 데이터가 없습니다. 이 연도의 공휴일이 없다는 뜻은 아닙니다.';$('summary').textContent='데이터 없음';return}
  $('notice').textContent='한국천문연구원 특일 정보 API 기준 · 임시공휴일 등은 공식 데이터 반영 후 표시됩니다.';
  render(year);
 }catch(e){
  if(id!==requestId)return;
  $('notice').className='notice error';$('notice').textContent='공휴일 데이터를 불러오지 못했습니다. API 설정이나 연결 상태를 확인하고 다시 조회해 주세요.';
  $('summary').textContent='조회 실패';
 }
}
sel.addEventListener('change',load);load();
})();
