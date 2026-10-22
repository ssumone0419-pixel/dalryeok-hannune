// Cloudflare Pages Function. Keep HOLIDAY_API_KEY in encrypted project secrets.
const json=(value,status=200,extra={})=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=300',...extra}});
const decodeXml=s=>s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
function parseXml(xml){
 const field=(s,k)=>decodeXml((s.match(new RegExp(`<${k}>([\\s\\S]*?)</${k}>`))||[])[1]||'');
 const resultCode=field(xml,'resultCode');
 if(resultCode && resultCode!=='00')throw new Error('upstream rejected request: '+resultCode);
 const total=Number(field(xml,'totalCount')||0);
 const items=[];for(const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)){
  const item=match[1],date=field(item,'locdate'),name=field(item,'dateName'),flag=field(item,'isHoliday');
  if(/^\d{8}$/.test(date)&&name&&flag==='Y')items.push({date:`${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)}`,name:name.slice(0,80)});
 }
 return {items,total};
}
export async function onRequestGet({request,env}){
 const u=new URL(request.url),year=u.searchParams.get('year');
 if(!/^\d{4}$/.test(year||'')||Number(year)<1900||Number(year)>2050)return json({error:'지원 연도는 1900~2050년입니다.'},400);
 if(!env.HOLIDAY_API_KEY)return json({error:'공휴일 API 설정이 아직 완료되지 않았습니다.'},503,{'cache-control':'no-store'});
 const cacheKey=new Request(`${u.origin}/api/holidays?year=${year}`,{method:'GET'});
 const cache=caches.default;
 const hit=await cache.match(cacheKey);if(hit)return hit;
 try{
  const endpoint=new URL('https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo');
  endpoint.searchParams.set('serviceKey',env.HOLIDAY_API_KEY);endpoint.searchParams.set('solYear',year);endpoint.searchParams.set('numOfRows','100');endpoint.searchParams.set('pageNo','1');
  const upstream=await fetch(endpoint.toString(),{signal:AbortSignal.timeout(9000)});
  if(!upstream.ok)throw Error('upstream HTTP '+upstream.status);
  const xml=await upstream.text();if(xml.length>250000)throw Error('upstream response too large');
  if(!/<response[\s>]/.test(xml))throw Error('unexpected upstream format');
  const {items,total}=parseXml(xml);if(total>100)throw Error('upstream pagination limit exceeded');
  const response=json({year:Number(year),holidays:items,source:'KASI',updatedAt:new Date().toISOString()},200,{'cache-control':'public, max-age=300, s-maxage=21600'});
  await cache.put(cacheKey,response.clone());return response;
 }catch(e){return json({error:'공휴일 정보를 가져올 수 없습니다. 잠시 후 다시 시도해 주세요.'},502,{'cache-control':'no-store'});}
}
