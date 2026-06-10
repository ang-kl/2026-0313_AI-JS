import React, { useEffect, useMemo, useRef, useState } from 'react';

// ?view=leap — the "behind the corner" stakeholder web for ONE live MyCareersFuture posting.
// Self-contained: pulls the posting via /api/mcf {action:"job"}, derives the web from real fields.

const COL = { budget:'#d6409f', compliance:'#1668c7', distortion:'#e8810c', fit:'#0aa2c0' };
const DEFAULT_UUID = '2320493d0e875075d4dbfa6a893b3fdb'; // Transformation Mgr, Metta Welfare (live demo)
const STOP = new Set('the a an and or of to for in on with at by is are be as your you our we who will can'.split(' '));

const fmtK = (n) => (n == null ? '?' : n >= 1000 ? (n/1000).toFixed(n%1000?1:0)+'k' : ''+n);
const trim = (s, n) => (s && s.length > n ? s.slice(0, n-1) + '…' : s || '');
const tok = (s) => String(s||'').toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length>2 && !STOP.has(t));
const parseUuid = (s) => { const m = String(s||'').match(/[0-9a-f]{32}/i); return m ? m[0] : String(s||'').trim(); };

function deriveItems(job, demand) {
  const sen = (job.positionLevels||[]).join(' / ') || '—';
  const band = (job.salaryMin||job.salaryMax) ? `$${fmtK(job.salaryMin)}–${fmtK(job.salaryMax)}` : 'pay undisclosed';
  const skills = job.skills || [];
  const ageDays = job.postedDate ? Math.round((Date.now()-Date.parse(job.postedDate))/864e5) : null;
  const resp = (job.responsibilitiesText||'').split(/\n|•|•|;|\.\s/).map(s=>s.replace(/^[\s\-*•]+/,'').trim()).filter(s=>s.length>10).slice(0,4);
  const inflated = /manager|lead|senior|head|chief|specialist/i.test(job.title||'') && job.minimumYearsExperience!=null && job.minimumYearsExperience<=3;
  return [
    {id:'director',name:'Director',sub:'budget + narrative',w:1,flow:'budget',
      label: inflated ? 'title looks inflated vs experience bar' : `funded at ${sen}`,
      note:`Seniority: ${sen}. Band: ${band}.${job.minimumYearsExperience!=null?` Bar: ${job.minimumYearsExperience}+ yrs.`:''} ${inflated?'Title seniority outruns the stated experience bar — possible inflation.':'Title and band look broadly aligned.'}`, src:'derived'},
    {id:'hr',name:'HR',sub:'writes the JD',w:.6,flow:'compliance',
      label:'FCF: advertise ≥14 days',
      note:`Under the Fair Consideration Framework, the role must run on MyCareersFuture ≥14 days before any EP/S-Pass hire. Posting age: ${ageDays!=null?ageDays+' days':'unknown'}.`, src:'given'},
    {id:'ats',name:'ATS',sub:'keyword filter',w:.5,flow:'distortion',
      label:`${skills.length} keyword tags`,
      note:`Literal tag match: ${skills.slice(0,10).join(', ')||'—'}. Mirror exact words to pass it — it cannot read your real work; a human must.`, src:'given'},
    {id:'skeptic',name:'Skeptic',sub:'demand check',w:.55,flow:'compliance',
      label: demand==null?'demand unknown':`≈${demand}${demand>=30?'+':''} similar live`,
      note: demand==null?'Live demand not measured for this title.':`${demand}${demand>=30?'+':''} similar live postings (rough sample). ${demand<8?"Thin market — apply, but don't over-invest.":demand<20?'Moderate market.':'Healthy market.'}`, src:'inferred'},
    {id:'hm',name:'Hiring Mgr',sub:'the real job',w:.7,flow:'fit',
      label: resp[0] ? trim(resp[0],40) : 'the real duties',
      note: resp.length ? ('Behind the advert, the real core:\n• '+resp.join('\n• ')) : 'The ad does not clearly state the real duties.', src:'derived'},
    {id:'seeker',name:'You',sub:'the candidate',w:.8,flow:'fit',
      label:'your proof vs the real job',
      note:'Paste your CV (top-left) to light up the tags you can prove vs the gaps — a rough keyword overlap.', src:'derived'},
  ];
}

function cvCoverage(skills, cvText){
  if(!cvText) return null;
  const T = new Set(tok(cvText));
  const proof=[], gap=[];
  (skills||[]).forEach(s=>{ const has = tok(s).some(t=>T.has(t)); (has?proof:gap).push(s); });
  return {proof, gap};
}

// BF2 (stewardship arc, v3/script/v3-stewardship-spec.md): capability bridge vs governance
// firewall - goal protocol 1 / Rumelt's kernel. A TRANSPARENT word-balance read of the ad's
// own text (the Leap idiom: derived heuristics, tagged - like the inflated-title check), not
// a measurement and not an LLM judgement: build-stems vs governance-stems, verdict hedged
// ("reads like"), counts shown, withheld when the text is too thin to defend.
const BRIDGE_STEMS = ['build','develop','launch','implement','deliver','design','creat','grow','driv','transform','improv','establish','expand','innovat','scale'];
const FIREWALL_STEMS = ['comply','complian','govern','audit','risk','control','polic','regulat','assur','oversight','safeguard','approv','monitor','legal'];
function bridgeOrFirewall(job){
  // title + description only: responsibilitiesText is EXTRACTED from description (mcf.js),
  // so including both would double-count every duty word and break "counts you can check".
  const T = tok((job.title||'')+' '+(job.description||''));
  const b = T.filter(t=>BRIDGE_STEMS.some(st=>t.startsWith(st))).length;
  const f = T.filter(t=>FIREWALL_STEMS.some(st=>t.startsWith(st))).length;
  if (b+f < 4) return {verdict:'unclear', b, f};
  return {verdict: f >= b*1.4 ? 'firewall' : b >= f*1.4 ? 'bridge' : 'mixed', b, f};
}

export default function LeapView(){
  const stageRef = useRef(null);
  const [input,setInput] = useState('');
  const [cv,setCv] = useState('');
  const [job,setJob] = useState(null);
  const [demand,setDemand] = useState(null);
  const [status,setStatus] = useState('Loading a live sample posting…');
  const [sel,setSel] = useState(null);
  const [showCV,setShowCV] = useState(false);
  const [showReal,setShowReal] = useState(false);
  const [showLabels,setShowLabels] = useState(false);
  const [size,setSize] = useState({w:800,h:560});
  const [narrow,setNarrow] = useState(false);

  useEffect(()=>{ const e=stageRef.current; if(!e) return;
    const ro = new ResizeObserver(()=>{ const r=e.getBoundingClientRect(); setSize({w:Math.max(320,r.width),h:Math.max(320,r.height)}); });
    ro.observe(e); return ()=>ro.disconnect();
  },[]);

  useEffect(()=>{ const mq=()=>setNarrow(window.innerWidth<760); mq();
    window.addEventListener('resize',mq); return ()=>window.removeEventListener('resize',mq);
  },[]);

  async function load(uuidRaw){
    const uuid = parseUuid(uuidRaw);
    if(!uuid){ setStatus('Paste a MyCareersFuture job link or UUID.'); return; }
    setStatus('Fetching the posting from MyCareersFuture…'); setJob(null); setSel(null);
    try{
      const r = await fetch('/api/mcf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'job',uuid})});
      const d = await r.json();
      if(!d || !d.job){ setStatus(d?.message || 'Could not find that posting (it may have expired).'); return; }
      setJob(d.job); setDemand(d.demand ?? null); setStatus('');
    }catch(e){ setStatus('Network error reaching the posting.'); }
  }
  useEffect(()=>{ load(DEFAULT_UUID); },[]);

  const items = useMemo(()=> job ? deriveItems(job, demand) : [], [job, demand]);
  const cov = useMemo(()=> job ? cvCoverage(job.skills, cv) : null, [job, cv]);
  const bf = useMemo(()=> job ? bridgeOrFirewall(job) : null, [job]);

  // layout
  const W=size.w, H=size.h, s=Math.max(.62,Math.min(1.25,Math.min(W,H)/620));
  const hub={x:W/2,y:H/2,r:Math.max(40,48*s)};
  const rx=W*0.40, ry=H*0.40, n=items.length||1;
  const pos = {}; items.forEach((it,i)=>{ const a=(-90+i*360/n)*Math.PI/180; pos[it.id]={x:W/2+rx*Math.cos(a),y:H/2+ry*Math.sin(a),r:(18+it.w*16)*s}; });

  function curve(p,off){ const mx=(p.x+hub.x)/2,my=(p.y+hub.y)/2,dx=hub.x-p.x,dy=hub.y-p.y,L=Math.hypot(dx,dy)||1;
    const cx=mx-dy/L*off,cy=my+dx/L*off, a1=Math.atan2(cy-p.y,cx-p.x), a2=Math.atan2(cy-hub.y,cx-hub.x);
    return {d:`M${p.x+Math.cos(a1)*(p.r+2)},${p.y+Math.sin(a1)*(p.r+2)} Q${cx},${cy} ${hub.x+Math.cos(a2)*(hub.r+7)},${hub.y+Math.sin(a2)*(hub.r+7)}`,mx:cx,my:cy}; }

  const tagCol={given:'#0d4c97',derived:'#7c3aed',inferred:'#9a4f06'};
  const selItem = items.find(i=>i.id===sel);

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100dvh',fontFamily:'-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif',color:'#16202e',background:'#f4f6fb'}}>
      <header style={{padding:'10px 16px',borderBottom:'1px solid #d8e0ec',background:'#fff'}}>
        <div style={{fontSize:'1rem',fontWeight:700}}>The job's hidden web — <em>behind the corner of the advert</em></div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:8,alignItems:'center'}}>
          <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Paste MyCareersFuture job link or UUID"
            onKeyDown={e=>{if(e.key==='Enter')load(input);}}
            style={{flex:'1 1 280px',minWidth:0,padding:'10px 12px',minHeight:44,border:'1px solid #d8e0ec',borderRadius:8,fontSize:'.85rem'}}/>
          <button onClick={()=>load(input)} style={btn(true)}>Load job</button>
          <button onClick={()=>{setShowCV(!showCV);}} aria-pressed={showCV} style={btn(showCV)}>👤 CV overlay</button>
          <button onClick={()=>setShowReal(!showReal)} aria-pressed={showReal} style={btn(showReal)}>🫥 Advert → Real</button>
          <button onClick={()=>setShowLabels(!showLabels)} aria-pressed={showLabels} style={btn(showLabels)}>🏷 Labels</button>
        </div>
        {showCV && <textarea value={cv} onChange={e=>setCv(e.target.value)} placeholder="Paste your CV text here — rough keyword overlap vs the job's tags"
          style={{width:'100%',marginTop:8,height:54,padding:'7px 10px',border:'1px solid #d8e0ec',borderRadius:8,fontSize:'.8rem',resize:'vertical'}}/>}
      </header>

      <main style={{flex:1,display:'flex',flexDirection:narrow?'column':'row',minHeight:0}}>
        <div ref={stageRef} style={{...(narrow?{flex:'0 0 auto',height:'min(58dvh,480px)',width:'100%'}:{flex:'1 1 420px',minWidth:0}),position:'relative',background:'radial-gradient(circle at 50% 46%,#fff,#eef2f8)'}}>
          {status ? <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',color:'#5b6b82',padding:20,textAlign:'center'}}>{status}</div> :
          <svg viewBox={`0 0 ${W} ${H}`} style={{position:'absolute',inset:0,width:'100%',height:'100%'}} role="img" aria-label="Job stakeholder web">
            <defs>{Object.entries(COL).map(([k,c])=>(
              <marker key={k} id={'m-'+k} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" fill={c}/></marker>))}
            </defs>
            {items.map((it,i)=>{ const p=pos[it.id]; const flow=(showCV&&it.id==='seeker')?'fit':it.flow;
              const off=(i%2?1:-1)*(24+(i%3)*10)*s; const c=curve(p,off);
              const on=!sel||sel===it.id; const spot=!showReal||it.flow==='distortion'||it.id==='seeker';
              const op=on?(spot?.92:.16):.12; const wide=showCV&&it.id==='seeker';
              return (<g key={it.id}>
                <path d={c.d} fill="none" stroke={COL[flow]} strokeWidth={wide?3.2:(sel===it.id?2.4:1.4)}
                  strokeDasharray={flow==='distortion'?'6 5':''} opacity={op} markerEnd={`url(#m-${flow})`}/>
                {(showLabels||sel===it.id)&&op>.3 && (()=>{ const txt=(showCV&&it.id==='seeker'&&cov)?`you prove ${cov.proof.length}/${job.skills.length} tags`:it.label; const w=txt.length*5.6+10;
                  return <g><rect x={c.mx-w/2} y={c.my-9} width={w} height={18} rx={5} fill="#fff" stroke="#e2e8f2"/>
                    <text x={c.mx} y={c.my+3.5} textAnchor="middle" fontSize="11" fontWeight="600" fill={COL[flow]}>{txt}</text></g>; })()}
              </g>);
            })}
            {/* hub */}
            <g tabIndex={0} style={{cursor:'pointer'}} onClick={()=>setSel('HUB')} onKeyDown={e=>{if(e.key==='Enter')setSel('HUB');}}>
              <circle cx={hub.x} cy={hub.y} r={hub.r} fill="#fff" stroke={showReal?COL.fit:'#8a98ab'} strokeWidth="3"/>
              <circle cx={hub.x} cy={hub.y} r={hub.r} fill={showReal?COL.fit:'#8a98ab'} opacity=".1"/>
              <text x={hub.x} y={hub.y-2} textAnchor="middle" fontSize={13*Math.max(.85,s)} fontWeight="700">THE JOB</text>
              <text x={hub.x} y={hub.y+14} textAnchor="middle" fontSize={9.5*Math.max(.85,s)} fill="#5b6b82">{showReal?'real':'advert'}</text>
            </g>
            {items.map(it=>{ const p=pos[it.id]; const on=!sel||sel===it.id;
              const col=(showCV&&it.id==='seeker')?COL.fit:'#6b7d96';
              return (<g key={'n'+it.id} tabIndex={0} style={{cursor:'pointer'}} opacity={on?1:.34}
                  onClick={()=>setSel(it.id)} onKeyDown={e=>{if(e.key==='Enter')setSel(it.id);}}>
                <circle cx={p.x} cy={p.y} r={p.r} fill="#fff" stroke={col} strokeWidth="2"/>
                <circle cx={p.x} cy={p.y} r={p.r} fill={col} opacity=".1"/>
                <text x={p.x} y={p.y+3} textAnchor="middle" fontSize={Math.max(10,11.5*s)} fontWeight="700">{it.name}</text>
              </g>);
            })}
          </svg>}
        </div>

        <aside style={{...(narrow?{flex:'1 1 auto',width:'100%',minHeight:0,borderTop:'1px solid #d8e0ec'}:{flex:'0 0 320px',borderLeft:'1px solid #d8e0ec'}),maxWidth:'100%',overflow:'auto',background:'#fff',padding:14}}>
          {sel==='HUB' && job ? (
            <div><h2 style={h2}>THE JOB</h2>
              <p style={row}><b>{job.title}</b><br/>{job.employer} · {(job.salaryMin||job.salaryMax)?`$${fmtK(job.salaryMin)}–${fmtK(job.salaryMax)}`:'pay undisclosed'}</p>
              <p style={row}><span style={k}>advert</span><br/>{(job.positionLevels||[]).join(' / ')||'—'}{job.minimumYearsExperience!=null?` · ${job.minimumYearsExperience}+ yrs`:''}</p>
              {bf && <p style={row}><span style={k}>why this role exists</span><br/>
                {bf.verdict==='bridge' ? `Reads like a capability bridge - hired to close a capability gap. Build words outweigh governance words ${bf.b}:${bf.f} in the ad's own text.`
                 : bf.verdict==='firewall' ? `Reads like a governance firewall - hired to hold a control or liability line. Governance words outweigh build words ${bf.f}:${bf.b} in the ad's own text.`
                 : bf.verdict==='mixed' ? `Mixed mandate - the ad asks for both delivery and control (build vs governance words ${bf.b}:${bf.f}).`
                 : 'Too little duty text for a defensible bridge-vs-firewall read - withheld.'}
                {' '}<span style={{...tag,color:tagCol.inferred,borderColor:tagCol.inferred+'55'}}>inferred</span></p>}
              <p style={row}><a href={job.mcfUrl} target="_blank" rel="noreferrer">open on MyCareersFuture →</a></p>
              <p style={hint}>Use “Advert → Real” to spotlight what the ad hides.</p></div>
          ) : selItem ? (
            <div><h2 style={h2}>{selItem.name}</h2>
              <p style={row}><span style={k}>{selItem.sub}</span></p>
              <p style={{...row,whiteSpace:'pre-line'}}>{selItem.note}</p>
              {selItem.id==='seeker'&&cov&&<p style={row}><span style={k}>CV overlap</span><br/>Proof: {cov.proof.join(', ')||'—'}<br/>Gaps: {cov.gap.join(', ')||'—'}</p>}
              <span style={{...tag,color:tagCol[selItem.src],borderColor:tagCol[selItem.src]+'55'}}>{selItem.src}</span></div>
          ) : (
            <div><h2 style={h2}>Tap the job or a stakeholder</h2>
              <p style={hint}>{job?`Live: ${job.title} · ${job.employer}. The centre is the advert; the ring is the forces that shaped it. Each arrow is a pressure one party puts on the job.`:'Loading…'}</p>
              <p style={hint}>Paste a different MyCareersFuture link above to analyse any role. Turn on CV overlay to map your proof.</p></div>
          )}
          <div style={{marginTop:12,fontSize:'.7rem',color:'#5b6b82',lineHeight:1.5}}>
            <b style={{color:'#16202e'}}>Flows:</b> <span style={{color:COL.budget}}>budget/inflation</span> · <span style={{color:COL.compliance}}>compliance</span> · <span style={{color:COL.distortion}}>distortion</span> · <span style={{color:COL.fit}}>genuine fit</span><br/>
            Job fields verbatim from MyCareersFuture; flows are derived analysis (tagged). Demand is a rough sample.
          </div>
        </aside>
      </main>
    </div>
  );
}

const btn = (on) => ({background:on?'#1668c7':'#eef3fb',color:on?'#fff':'#16202e',border:'1px solid '+(on?'#1668c7':'#d8e0ec'),borderRadius:999,padding:'7px 14px',minHeight:44,display:'inline-flex',alignItems:'center',fontSize:'.85rem',cursor:'pointer'});
const h2 = {fontSize:'.98rem',margin:'.1em 0 .5em'};
const row = {margin:'.5em 0',fontSize:'.87rem',lineHeight:1.5};
const k = {color:'#5b6b82',fontSize:'.7rem',textTransform:'uppercase',letterSpacing:'.05em'};
const hint = {color:'#5b6b82',fontSize:'.83rem',lineHeight:1.5};
const tag = {display:'inline-block',fontSize:'.64rem',fontWeight:700,padding:'2px 8px',borderRadius:999,border:'1px solid'};
