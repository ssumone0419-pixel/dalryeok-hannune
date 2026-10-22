
(()=>{'use strict';
const $=id=>document.getElementById(id), DAY=86400000, BASE=Date.UTC(1900,0,1), COUNT=window.DalryeokData.dayCount, KEY='dalryeok-hannune-events-v1';
const raw=atob(window.DalryeokData.packed);if(raw.length!==COUNT*3)throw Error('날짜 데이터 오류');
const lunarByDay=[],lunarToIndex=new Map(),lunarMonths=new Map();
const pad=n=>String(n).padStart(2,'0');
const holidayYears=new Map(),holidayPending=new Map();let holidayEnabled=true;
async function loadHolidayYear(year){
 if(holidayYears.has(year))return;
 if(holidayPending.has(year))return holidayPending.get(year);
 const task=(async()=>{const res=await fetch(`/api/holidays?year=${year}`,{headers:{accept:'application/json'}});if(!res.ok)throw Error('API 응답 오류');const data=await res.json();if(!Array.isArray(data.holidays))throw Error('공휴일 응답 오류');const mapped=new Map();for(const item of data.holidays){if(!/^\d{4}-\d{2}-\d{2}$/.test(item.date)||typeof item.name!=='string')continue;const names=mapped.get(item.date)||[];if(!names.includes(item.name))names.push(item.name);mapped.set(item.date,names)}holidayYears.set(year,mapped)})();
 holidayPending.set(year,task);try{await task}finally{holidayPending.delete(year)}
}
let holidayGeneration=0;
async function syncHolidays(start,end){
 const generation=++holidayGeneration;if(!holidayEnabled){$('holidayStatus').textContent='공휴일 표시 꺼짐';return}
 const from=solarDate(start).getUTCFullYear(),to=solarDate(end).getUTCFullYear();const years=Array.from({length:to-from+1},(_,i)=>from+i);
 if(years.every(y=>holidayYears.has(y))){$('holidayStatus').textContent='공휴일 정보 표시 중';return}
 $('holidayStatus').textContent='공휴일 불러오는 중…';const results=await Promise.allSettled(years.map(loadHolidayYear));if(generation!==holidayGeneration)return;
 $('holidayStatus').textContent=results.some(r=>r.status==='rejected')?'공휴일 정보를 불러오지 못했습니다. 다시 조회하면 재시도합니다.':'공휴일 정보 표시 중';render();
}
function holidayNames(i){if(!holidayEnabled)return [];const date=iso(i);return holidayYears.get(Number(date.slice(0,4)))?.get(date)||[]}
$('showHolidays').onchange=e=>{holidayEnabled=e.target.checked;render()};

const solarDate=i=>new Date(BASE+i*DAY);const iso=i=>solarDate(i).toISOString().slice(0,10);
const solarIndex=(y,m,d)=>{const ms=Date.UTC(y,m-1,d),v=new Date(ms);if(v.getUTCFullYear()!==y||v.getUTCMonth()+1!==m||v.getUTCDate()!==d)return -1;const i=(ms-BASE)/DAY;return Number.isInteger(i)&&i>=0&&i<COUNT?i:-1};
const lk=(y,m,d,l)=>`${y}-${m}-${d}-${l?1:0}`;const mk=(y,m,l)=>`${y}-${m}-${l?1:0}`;
for(let i=0;i<COUNT;i++){const p=i*3,v=(raw.charCodeAt(p)<<16)|(raw.charCodeAt(p+1)<<8)|raw.charCodeAt(p+2),l={y:1800+(v>>>10),m:(v>>>6)&15,d:(v>>>1)&31,leap:!!(v&1)};lunarByDay.push(l);lunarToIndex.set(lk(l.y,l.m,l.d,l.leap),i);const key=mk(l.y,l.m,l.leap);if(!lunarMonths.has(key))lunarMonths.set(key,{y:l.y,m:l.m,leap:l.leap,start:i,length:0});lunarMonths.get(key).length++}
const orderedMonths=[...lunarMonths.values()].sort((a,b)=>a.start-b.start);
let events=[];try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(v))events=v.filter(validEvent);else setStatus('기념일 데이터 형식이 올바르지 않습니다. 기존 데이터를 덮어쓰지 마세요.')}catch(e){setStatus('저장된 기념일을 읽을 수 없습니다. 브라우저 저장 설정을 확인하세요.')}
function validEvent(e){return e&&typeof e.id==='string'&&typeof e.name==='string'&&e.name.length<=60&&['none','solar','lunar'].includes(e.repeat)&&typeof e.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(e.date)&&typeof e.ly==='number'&&typeof e.lm==='number'&&typeof e.ld==='number'&&typeof e.leap==='boolean'&&solarIndex(...e.date.split('-').map(Number))>=0&&e.lm>=1&&e.lm<=12&&e.ld>=1&&e.ld<=30}
function setStatus(s){$('status').textContent=s}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(events));return true}catch(e){setStatus('저장 실패: 브라우저 사이트 데이터 설정을 확인하세요.');return false}}
const today=new Date(),todayIdx=solarIndex(today.getFullYear(),today.getMonth()+1,today.getDate());let selected=todayIdx>=0?todayIdx:0,mode='solar';let solarYear=solarDate(selected).getUTCFullYear(),solarMonth=solarDate(selected).getUTCMonth()+1;let lunarPos=orderedMonths.findIndex(m=>selected>=m.start&&selected<m.start+m.length);if(lunarPos<0)lunarPos=0;
function matches(e,i){const l=lunarByDay[i],s=iso(i);if(e.repeat==='none')return e.date===s;if(e.repeat==='solar')return e.date.slice(5)===s.slice(5);return e.lm===l.m&&e.ld===l.d&&e.leap===l.leap}
function getRange(){if(mode==='solar'){const start=Math.max(0,solarIndex(solarYear,solarMonth,1)),end=solarIndex(solarYear,solarMonth,new Date(Date.UTC(solarYear,solarMonth,0)).getUTCDate());return {start,end,title:`${solarYear}년 ${solarMonth}월`}}const l=orderedMonths[lunarPos];return {start:l.start,end:l.start+l.length-1,title:`음력 ${l.y}년 ${l.leap?'윤':''}${l.m}월`}}
function updateDateSelectors(){
 const year=$('yearSelect'),month=$('monthSelect');
 const y=mode==='solar'?solarYear:orderedMonths[lunarPos].y;
 const years=mode==='solar'?Array.from({length:151},(_,i)=>1900+i):[...new Set(orderedMonths.map(m=>m.y))];
 if(year.options.length!==years.length||year.options[0]?.value!==String(years[0])){
  year.replaceChildren();
  for(const n of years){const o=document.createElement('option');o.value=String(n);o.textContent=n+'년';year.append(o)}
 }
 year.value=String(y);
 const monthItems=mode==='solar'?Array.from({length:12},(_,i)=>({value:String(i+1),label:(i+1)+'월'})):orderedMonths.map((m,i)=>({...m,value:String(i),label:(m.leap?'윤':'')+m.m+'월'})).filter(m=>m.y===y);
 month.replaceChildren();
 for(const m of monthItems){const o=document.createElement('option');o.value=m.value;o.textContent=m.label;month.append(o)}
 month.value=mode==='solar'?String(solarMonth):String(lunarPos);
}
function jumpToRange(){
 const {start,end}=getRange();
 selected=Math.max(start,Math.min(selected,end));
 render();
}
$('yearSelect').onchange=()=>{
 const y=Number($('yearSelect').value);
 if(mode==='solar'){solarYear=y}
 else{
  const old=orderedMonths[lunarPos];
  let p=orderedMonths.findIndex(m=>m.y===y&&m.m===old.m&&m.leap===old.leap);
  if(p<0)p=orderedMonths.findIndex(m=>m.y===y&&m.m===old.m&&!m.leap);
  if(p<0)p=orderedMonths.findIndex(m=>m.y===y);
  if(p>=0)lunarPos=p;
 }
 jumpToRange();
};
$('monthSelect').onchange=()=>{
 if(mode==='solar')solarMonth=Number($('monthSelect').value);
 else lunarPos=Number($('monthSelect').value);
 jumpToRange();
};
function eventIndexForRange(start,end){const byDay=new Map();for(let i=start;i<=end;i++)byDay.set(i,[]);for(const e of events){if(e.repeat==='none'){const i=solarIndex(...e.date.split('-').map(Number));if(byDay.has(i))byDay.get(i).push(e);continue}for(let i=start;i<=end;i++){if(matches(e,i))byDay.get(i).push(e)}}return byDay}
function render(){const {start,end,title}=getRange();const visibleEvents=eventIndexForRange(start,end);syncHolidays(start,end);$('monthTitle').textContent=title;updateDateSelectors();$('view').value=mode;$('days').replaceChildren();const first=solarDate(start).getUTCDay();for(let n=0;n<first;n++){const empty=document.createElement('div');empty.className='empty';$('days').append(empty)}
for(let i=start;i<=end;i++){const l=lunarByDay[i],s=solarDate(i),dow=s.getUTCDay(),button=document.createElement('button');button.type='button';button.className='day'+(i===selected?' selected':'')+(dow===0?' sunday':dow===6?' saturday':'');const main=document.createElement('span');main.className='main-date';main.textContent=mode==='solar'?String(s.getUTCDate()):String(l.d);const sub=document.createElement('span');sub.className='sub-date';sub.textContent=mode==='solar'?`${l.leap?'윤':''}${l.m}.${pad(l.d)}`:`양력 ${s.getUTCMonth()+1}.${pad(s.getUTCDate())}`;button.append(main,sub);const holiday=holidayNames(i);if(holiday.length){button.classList.add('holiday');const tag=document.createElement('span');tag.className='holiday-tag';tag.textContent=holiday.join(' · ');button.append(tag)}const matched=visibleEvents.get(i)||[];if(matched.length){button.classList.add('has-event');const tag=document.createElement('span');tag.className='event-tag';tag.textContent='★ '+matched[0].name+(matched.length>1?` 외 ${matched.length-1}개`:'');button.append(tag)}button.setAttribute('aria-pressed',String(i===selected));button.setAttribute('aria-label',`${iso(i)}, 음력 ${l.leap?'윤':''}${l.m}월 ${l.d}일, 공휴일 ${holiday.join(' · ')||'없음'}, 기념일 ${matched.length}개`);button.onclick=()=>{selected=i;render()};$('days').append(button)}
$('prev').disabled=mode==='solar'?(solarYear===1900&&solarMonth===1):lunarPos===0;$('next').disabled=mode==='solar'?(solarYear===2050&&solarMonth===12):lunarPos===orderedMonths.length-1;
$('calendarNote').textContent=mode==='solar'?'큰 숫자는 양력 날짜, 아래 작은 숫자는 음력 월·일입니다.':'큰 숫자는 음력 날짜, 아래 작은 숫자는 양력 월·일입니다. 일부 음력 월은 지원 범위 경계에서 잘릴 수 있습니다.';
const l=lunarByDay[selected];$('selectedDate').textContent=iso(selected);$('selectedLunar').textContent=`음력 ${l.y}년 ${l.leap?'윤':''}${l.m}월 ${l.d}일`;
$('events').replaceChildren();for(const e of (visibleEvents.get(selected)||[])){const li=document.createElement('li'),name=document.createElement('span'),del=document.createElement('button');name.className='name';name.textContent=e.name+' · '+({none:'1회',solar:'매년 양력',lunar:'매년 음력'}[e.repeat]);del.type='button';del.textContent='삭제';del.onclick=()=>{if(confirm('이 기념일을 삭제하시겠습니까?')){const previous=events;events=events.filter(v=>v.id!==e.id);if(!persist()){events=previous;return}render();setStatus('기념일을 삭제했습니다.')}};li.append(name,del);$('events').append(li)}renderAllEvents()}
function renderAllEvents(){
 const list=$('allEventsList');list.replaceChildren();$('allEventsCount').textContent=`(${events.length})`;$('allEventsEmpty').hidden=events.length!==0;
 for(const e of [...events].sort((a,b)=>a.date.localeCompare(b.date)||a.name.localeCompare(b.name))){
  const li=document.createElement('li');li.className='all-event';
  const info=document.createElement('div');info.className='all-event-main';
  const name=document.createElement('div');name.className='all-event-name';name.textContent='★ '+e.name;
  const date=document.createElement('div');date.className='all-event-date';
  const kind={none:'한 번만',solar:'매년 양력',lunar:'매년 음력'}[e.repeat]||'한 번만';
  date.textContent=`${e.date} 등록 · ${kind}`+(e.repeat==='lunar'?` (${e.leap?'윤':''}${e.lm}월 ${e.ld}일)`:'');
  info.append(name,date);
  const actions=document.createElement('div');actions.className='all-event-actions';
  const go=document.createElement('button');go.type='button';go.textContent='날짜 보기';go.onclick=()=>{
   const idx=solarIndex(...e.date.split('-').map(Number));if(idx<0){setStatus('지원 범위를 벗어난 날짜입니다.');return}
   selected=idx;mode='solar';const d=solarDate(idx);solarYear=d.getUTCFullYear();solarMonth=d.getUTCMonth()+1;render();document.querySelector('.toolbar').scrollIntoView({behavior:'smooth',block:'start'});
  };
  const del=document.createElement('button');del.type='button';del.textContent='삭제';del.onclick=()=>{if(!confirm(`「${e.name}」 기념일을 삭제하시겠습니까?`))return;const previous=events;events=events.filter(v=>v.id!==e.id);if(!persist()){events=previous;return}render();setStatus('기념일을 삭제했습니다.')};
  actions.append(go,del);li.append(info,actions);list.append(li);
 }
}
$('prev').onclick=()=>move(-1);$('next').onclick=()=>move(1);
function move(step){if(mode==='solar'){let x=solarYear*12+solarMonth-1+step;x=Math.max(1900*12,Math.min(2050*12+11,x));solarYear=Math.floor(x/12);solarMonth=x%12+1}else lunarPos=Math.max(0,Math.min(orderedMonths.length-1,lunarPos+step));const r=getRange();selected=Math.max(r.start,Math.min(selected,r.end));render()}
$('view').onchange=()=>{mode=$('view').value;const s=solarDate(selected),l=lunarByDay[selected];solarYear=s.getUTCFullYear();solarMonth=s.getUTCMonth()+1;lunarPos=orderedMonths.findIndex(m=>selected>=m.start&&selected<m.start+m.length);render()};
$('today').onclick=()=>{if(todayIdx<0){setStatus('오늘 날짜가 지원 범위(1900~2050년) 밖입니다.');return}selected=todayIdx;const s=solarDate(selected);solarYear=s.getUTCFullYear();solarMonth=s.getUTCMonth()+1;lunarPos=orderedMonths.findIndex(m=>selected>=m.start&&selected<m.start+m.length);render()};
$('eventForm').onsubmit=e=>{e.preventDefault();const name=$('eventName').value.trim(),repeat=$('repeat').value;if(!name||name.length>60){setStatus('기념일 이름은 1~60자로 입력해 주세요.');return}const l=lunarByDay[selected];const entry={id:String(Date.now())+'-'+Math.random().toString(36).slice(2),name,repeat,date:iso(selected),ly:l.y,lm:l.m,ld:l.d,leap:l.leap};events.push(entry);if(!persist()){events=events.filter(v=>v!==entry);return}$('eventName').value='';render();setStatus('✓ '+iso(selected)+'에 「'+name+'」 기념일을 등록했습니다. 달력 날짜 칸에 표시됩니다.')};
function drawRounded(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function wrapText(ctx,str,maxWidth,maxLines){const chars=[...str],lines=[];let line='';for(const c of chars){if(ctx.measureText(line+c).width>maxWidth&&line){lines.push(line);line=c}else line+=c}if(line)lines.push(line);if(lines.length>maxLines){const shortened=lines.slice(0,maxLines);let last=shortened[maxLines-1];while(last&&ctx.measureText(last+'…').width>maxWidth)last=last.slice(0,-1);shortened[maxLines-1]=last+'…';return shortened}return lines}
function saveCalendarImage(){
try{
 const {start,end,title}=getRange(),cols=7,offset=solarDate(start).getUTCDay(),rows=Math.ceil((offset+end-start+1)/7);
 const visibleEvents=eventIndexForRange(start,end);const maxEvents=Math.max(0,...[...visibleEvents.values()].map(x=>x.length));const W=1400,padX=56,top=172,headH=60,cellW=(W-padX*2)/7,cellH=Math.min(230,Math.max(146,118+Math.min(maxEvents,4)*24)),bottom=65,H=top+headH+rows*cellH+bottom;
 const c=document.createElement('canvas');c.width=W*2;c.height=H*2;const g=c.getContext('2d');if(!g)throw Error('Canvas를 사용할 수 없습니다.');g.scale(2,2);
 g.fillStyle='#ffffff';g.fillRect(0,0,W,H);g.fillStyle='#183c79';g.font='bold 27px sans-serif';g.fillText('달력한눈에',padX,62);g.fillStyle='#172d50';g.font='bold 39px sans-serif';g.fillText(title,padX,119);
 g.fillStyle='#71819b';g.font='19px sans-serif';g.fillText(mode==='solar'?'양력 날짜 · 아래 작은 숫자는 음력':'음력 날짜 · 아래 작은 숫자는 양력',padX,151);
 const labels=['일','월','화','수','목','금','토'];for(let col=0;col<7;col++){const x=padX+col*cellW;g.fillStyle='#f2f6fd';g.fillRect(x,top,cellW,headH);g.fillStyle=col===0?'#d4424b':col===6?'#2e6fcb':'#4c5d76';g.font='bold 23px sans-serif';g.textAlign='center';g.fillText(labels[col],x+cellW/2,top+38)}g.textAlign='left';
 for(let i=start;i<=end;i++){
  const idx=offset+i-start,row=Math.floor(idx/7),col=idx%7,x=padX+col*cellW,y=top+headH+row*cellH;
  g.fillStyle=i===selected?'#edf4ff':'#ffffff';g.fillRect(x,y,cellW,cellH);
  g.strokeStyle='#e0e7f0';g.lineWidth=1;g.strokeRect(x+.5,y+.5,cellW,cellH);
  const d=solarDate(i),l=lunarByDay[i],primary=mode==='solar'?d.getUTCDate():l.d;
  g.fillStyle=holidayNames(i).length||col===0?'#d4424b':col===6?'#2e6fcb':'#202c42';g.font='bold 28px sans-serif';g.fillText(String(primary),x+14,y+37);
  g.fillStyle='#64748b';g.font='19px sans-serif';g.fillText(mode==='solar'?`${l.leap?'윤':''}${l.m}.${pad(l.d)}`:`양력 ${d.getUTCMonth()+1}.${pad(d.getUTCDate())}`,x+14,y+65);
  const hol=holidayNames(i);if(hol.length){g.fillStyle='#c23d4b';g.font='bold 15px sans-serif';g.fillText(hol.join(' · ').slice(0,18),x+14,y+88)}const matched=visibleEvents.get(i)||[];if(matched.length){g.fillStyle='#2c5ec0';g.font='bold 17px sans-serif';let yy=y+(hol.length?112:90);for(const line of wrapText(g,matched.map(e=>e.name).join(' · '),cellW-25,Math.max(2,Math.floor((cellH-94)/22)))){g.fillText(line,x+14,yy);yy+=22}}
 }
 g.fillStyle='#7b879a';g.font='17px sans-serif';g.fillText('달력한눈에 · 개인 기념일 포함 · 1900~2050년 공식 음양력 데이터 기준',padX,H-26);
 c.toBlob(blob=>{if(!blob){setStatus('PNG 이미지 생성에 실패했습니다.');return}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`달력한눈에_${mode==='solar'?'양력':'음력'}_${title.replace(/\s/g,'_')}.png`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);setStatus('현재 달력 이미지를 PNG로 저장했습니다.')},'image/png');
}catch(err){setStatus('이미지 저장 실패: '+err.message)}
}
$('saveImage').onclick=saveCalendarImage;
render();
})();
