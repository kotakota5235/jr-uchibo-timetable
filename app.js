const $ = id => document.getElementById(id);
const state = {route:'chiba', direction:'down', page:0, trains:[]};
const PAGE = 8, SCALE = 8;
const format = m => `${Math.floor(m/60)%24}:${String(m%60).padStart(2,'0')}`;
const full = m => `${m>=1440?'翌日 ':''}${format(m)}`;
const minutes = v => {const [h,m]=v.split(':').map(Number);return h*60+m+(h<3?1440:0)};
function now(){const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tokyo',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date());$('time').value=parts;state.page=0;render()}
const routeInfo = {
 chiba: {names:['千葉','本千葉','蘇我','蘇我','浜野','八幡宿','五井','姉ケ崎'], start:'2026年9月25日', source:'20260924_c02.pdf', edition:'2026年9月24日'},
 nagaura: {names:['袖ケ浦','長浦'], start:'2026年10月5日', source:'20261003_c02.pdf', edition:'2026年10月3日'},
 kisarazu: {names:['袖ケ浦','巌根','木更津'], start:'2026年10月5日', source:'20261003_c02.pdf', edition:'2026年10月3日'}
};
function stations(){const names=[...routeInfo[state.route].names];return state.direction==='down'?names:names.reverse()}
function render(){
 const info=routeInfo[state.route];
 $('effective').textContent=info.start+'〜当分の間';
 $('source-label').textContent='出典：JR東日本 千葉事業本部 · '+info.edition+'現在';
 $('source-link').href=info.source;
 $('endpoint-note').textContent=stations().at(-1)==='袖ケ浦'?'袖ケ浦はPDF掲載の発時刻を表示しています（到着時刻の記載なし）。':'';
 $('notice-text').textContent=state.route==='chiba'?'9月25日からの臨時時刻表です。電力設備の影響で遅れる場合があります。':'10月5日からの臨時時刻表です。10月4日以前の移動には使えません。';
 const pair=state.route==='chiba'?['千葉','姉ケ崎']:['袖ケ浦',state.route==='nagaura'?'長浦':'木更津'];
 if(state.direction==='up')pair.reverse();
 $('origin').textContent=pair[0];$('destination').textContent=pair[1];
 document.querySelectorAll('[data-route]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.route===state.route)));
 const value=$('time').value; if(!value)return;
 state.trains=window.TIMETABLE[state.route][state.direction].filter(t=>t[0]>=minutes(value));
 $('results').hidden=!state.trains.length;$('empty').hidden=!!state.trains.length;
 $('reset').hidden=false;
 if(!state.trains.length){$('empty-title').textContent='指定時刻以降の列車はありません';$('empty-text').textContent='このPDFに掲載された最終列車の出発時刻を過ぎています。始発から確認できます。';return}
 const selected=state.trains.slice(state.page*PAGE,(state.page+1)*PAGE);
 const base=Math.floor(selected[0][0]/10)*10, last=Math.ceil(Math.max(...selected.map(t=>t.at(-1)))/10)*10;
 const width=matchMedia('(max-width:650px)').matches?146:164;
 const canvas=document.createElement('div');canvas.className='canvas';canvas.style.width=`${selected.length*width+82}px`;canvas.style.height=`${(last-base)*SCALE+160}px`;
 for(let t=base;t<=last;t+=10){const tick=document.createElement('div');tick.className='tick';tick.style.top=`${80+(t-base)*SCALE}px`;tick.innerHTML=`<span>${format(t)}</span>`;canvas.append(tick)}
 selected.forEach((train,i)=>{const b=document.createElement('button');b.className='train'+(train.at(-1)-train[0]<12?' short':'')+(i===0&&state.page===0?' first':'');b.style.left=`${80+i*width}px`;b.style.top=`${80+(train[0]-base)*SCALE}px`;b.style.height=`${(train.at(-1)-train[0])*SCALE}px`;b.setAttribute('aria-label',`${pair[0]} ${full(train[0])}発、${pair[1]} ${full(train.at(-1))}${pair[1]==='袖ケ浦'?'発':'着'}。途中駅を見る`);b.innerHTML=`<span class="departure"><span class="duration ${i===0&&state.page===0?'next-label':''}">${train.at(-1)-train[0]}分 · 乗換なし</span>${full(train[0])}</span><span class="rail"></span><span class="train-label"><b>${pair[0]}</b>発</span><span class="train-label end"><b>${pair[1]}</b>${pair[1]==='袖ケ浦'?'発':'着'}</span><span class="arrival">${full(train.at(-1))}</span>`;b.onclick=()=>detail(train);canvas.append(b)});
 $('board').replaceChildren(canvas);$('board').scrollTo(0,0);
 $('count').textContent=`${value}以降 · ${state.trains.length}本`;
 $('range').textContent=`${state.page*PAGE+1}–${state.page*PAGE+selected.length} / ${state.trains.length}本`;
 $('previous').disabled=state.page===0;$('next').disabled=(state.page+1)*PAGE>=state.trains.length;
}
function detail(train){const names=stations();$('detail-title').textContent=`${names[0]} → ${names.at(-1)}`;$('detail-duration').textContent=`${full(train[0])}発 · ${full(train.at(-1))}${names.at(-1)==='袖ケ浦'?'発':'着'} · ${train.at(-1)-train[0]}分 · 乗換なし`;$('stops').innerHTML=names.map((name,i)=>`<li><span>${name}</span><time>${full(train[i])} <small>${(i===names.length-1&&name!=='袖ケ浦')||name==='蘇我'&&names[i+1]==='蘇我'?'着':'発'}</small></time></li>`).join('');$('detail-note').textContent=state.route==='chiba'?'途中駅は発時刻、千葉・姉ケ崎は終着の着時刻。蘇我は着・発を掲載。':'袖ケ浦・巌根はPDF記載の発時刻です。長浦・木更津は終着の着時刻です。';$('detail').showModal()}
document.querySelectorAll('[data-route]').forEach(b=>b.onclick=()=>{state.route=b.dataset.route;state.page=0;render()});
$('reverse').onclick=()=>{state.direction=state.direction==='down'?'up':'down';state.page=0;render()};
$('time').onchange=()=>{if($('time').value){state.page=0;render()}};
$('now').onclick=now;
function first(){state.page=0;$('time').value='03:00';render()}
$('first').onclick=first;$('reset').onclick=first;
$('previous').onclick=()=>{state.page--;render()};$('next').onclick=()=>{state.page++;render()};
$('close').onclick=()=>$('detail').close();$('detail').onclick=e=>{if(e.target===$('detail')){const r=$('detail').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('detail').close()}};
now();
