// Variant A — "Obsidian"
// Dark charcoal, violet accent, DM Sans, sharp geometric, glowing indicators

const A_THEME = {
  bg:        "#0f0f11",
  surface:   "#1a1a1f",
  surface2:  "#222228",
  border:    "#2e2e38",
  text:      "#f0eff8",
  textMuted: "#7a7a94",
  accent:    "#8b5cf6",
  accentGlow:"rgba(139,92,246,0.25)",
  accentSoft:"rgba(139,92,246,0.15)",
  positive:  "#10b981",
  maybe:     "#f59e0b",
  negative:  "#ef4444",
  tabBg:     "#111116",
};

function AStatusDot({ color, size=8 }) {
  return <span style={{ display:"inline-block", width:size, height:size, borderRadius:"50%", background:color, boxShadow:`0 0 6px ${color}` }} />;
}

function ARsvpPill({ status, active, onClick, theme }) {
  const cfg = {
    attending: { label:"Going",    color: theme.positive },
    maybe:     { label:"Maybe",    color: theme.maybe },
    declined:  { label:"Can't go", color: theme.negative },
  }[status];
  return (
    <button onClick={onClick} style={{
      padding:"8px 16px", borderRadius:999, fontSize:13, fontWeight:600, cursor:"pointer",
      border: active ? `2px solid ${cfg.color}` : `2px solid ${theme.border}`,
      background: active ? `rgba(${status==="attending"?"16,185,129":status==="maybe"?"245,158,11":"239,68,68"},0.15)` : "transparent",
      color: active ? cfg.color : theme.textMuted, transition:"all 0.18s",
    }}>{cfg.label}</button>
  );
}

function ABottomSheet({ event, onClose, theme }) {
  const [rsvp, setRsvp] = React.useState("attending");
  const [comment, setComment] = React.useState("");
  const [comments, setComments] = React.useState(event.comments);
  const g = groupById(event.groupId);
  const going = event.attendees.filter(a=>a.status==="attending").length;
  const maybe = event.attendees.filter(a=>a.status==="maybe").length;

  function sendComment() {
    if (!comment.trim()) return;
    setComments(c=>[...c, {author:"Marvin", body:comment, ago:"now"}]);
    setComment("");
  }

  return (
    <div style={{
      position:"absolute", inset:0, background:"rgba(0,0,0,0.65)", zIndex:100,
      display:"flex", flexDirection:"column", justifyContent:"flex-end",
    }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:theme.surface, borderRadius:"20px 20px 0 0",
        padding:"0 20px 32px", maxHeight:"82%", overflowY:"auto",
        border:`1px solid ${theme.border}`, borderBottom:"none",
      }}>
        {/* Handle */}
        <div style={{display:"flex",justifyContent:"center",padding:"12px 0 8px"}}>
          <div style={{width:36,height:4,borderRadius:2,background:theme.border}} />
        </div>

        {/* Header */}
        <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:16}}>
          <AStatusDot color={g.color} size={10} />
          <div style={{flex:1}}>
            <div style={{fontSize:20,fontWeight:700,color:theme.text,lineHeight:1.2}}>{event.title}</div>
            <div style={{fontSize:13,color:theme.textMuted,marginTop:4}}>
              {event.isAllDay ? `${fmtDate(event.startUtc)} · All day` : `${fmtDate(event.startUtc)} · ${fmtTime(event.startUtc)} – ${fmtTime(event.endUtc)}`}
            </div>
            <div style={{fontSize:13,color:theme.textMuted}}>{g.name} · By {event.by}</div>
          </div>
        </div>

        {event.type === "personal_shared" && (
          <>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:theme.textMuted,textTransform:"uppercase",marginBottom:10}}>Your RSVP</div>
            <div style={{display:"flex",gap:8,marginBottom:20}}>
              {["attending","maybe","declined"].map(s=>(
                <ARsvpPill key={s} status={s} active={rsvp===s} onClick={()=>setRsvp(s)} theme={theme}/>
              ))}
            </div>
          </>
        )}

        <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:theme.textMuted,textTransform:"uppercase",marginBottom:10}}>
          Attendees ({going} going{maybe?`, ${maybe} maybe`:""})
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
          {event.attendees.map((a,i)=>{
            const statusColor = a.status==="attending"?theme.positive:a.status==="maybe"?theme.maybe:theme.negative;
            return (
              <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:30,height:30,borderRadius:"50%",background:theme.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:theme.accent,border:`1.5px solid ${theme.border}`}}>
                  {a.name[0]}
                </div>
                <div style={{flex:1,fontSize:14,color:theme.text}}>{a.name}{a.you?" (you)":""}</div>
                <AStatusDot color={statusColor} size={7}/>
                <span style={{fontSize:12,color:theme.textMuted}}>{a.status==="attending"?"Going":a.status==="maybe"?"Maybe":"Can't go"}</span>
              </div>
            );
          })}
        </div>

        {comments.length>0 && (
          <>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:theme.textMuted,textTransform:"uppercase",marginBottom:10}}>Comments</div>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
              {comments.map((c,i)=>(
                <div key={i} style={{background:theme.surface2,borderRadius:12,padding:"10px 12px",border:`1px solid ${theme.border}`}}>
                  <div style={{fontSize:13,fontWeight:600,color:theme.accent,marginBottom:2}}>{c.author}</div>
                  <div style={{fontSize:13,color:theme.text}}>{c.body}</div>
                  <div style={{fontSize:11,color:theme.textMuted,marginTop:4}}>{c.ago}</div>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <input value={comment} onChange={e=>setComment(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&sendComment()}
            placeholder="Add a comment…" style={{
              flex:1, background:theme.surface2, border:`1.5px solid ${theme.border}`,
              borderRadius:999, padding:"9px 14px", fontSize:13, color:theme.text,
              outline:"none", fontFamily:"inherit",
            }}/>
          <button onClick={sendComment} style={{
            width:36,height:36,borderRadius:"50%",background:theme.accent,border:"none",
            color:"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16
          }}>→</button>
        </div>
      </div>
    </div>
  );
}

function ACalendarScreen({ theme, onEventTap }) {
  const [month, setMonth] = React.useState(4); // May = index 4
  const [year]  = React.useState(2026);
  const [activeFilter, setActiveFilter] = React.useState(null);

  const days = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const upcoming = EVENTS.filter(e=>e.startUtc.getMonth()===month).sort((a,b)=>a.startUtc-b.startUtc);

  return (
    <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column"}}>
      {/* Top bar */}
      <div style={{padding:"64px 18px 8px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontSize:22,fontWeight:800,color:theme.text,letterSpacing:"-0.5px"}}>
          <span style={{color:theme.accent}}>D</span>ecssy
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <button style={{background:theme.surface2,border:`1px solid ${theme.border}`,borderRadius:8,padding:"5px 10px",fontSize:12,color:theme.textMuted,cursor:"pointer"}}>Filter</button>
          <div style={{width:32,height:32,borderRadius:"50%",background:theme.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"white"}}>M</div>
        </div>
      </div>

      {/* Group filter chips */}
      <div style={{display:"flex",gap:6,padding:"0 18px 12px",overflowX:"auto",scrollbarWidth:"none"}}>
        {GROUPS.map(g=>(
          <button key={g.id} onClick={()=>setActiveFilter(activeFilter===g.id?null:g.id)} style={{
            display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:999,
            border:`1.5px solid ${activeFilter===g.id?g.color:theme.border}`,
            background:activeFilter===g.id?`rgba(${hexToRgb(g.color)},0.15)`:"transparent",
            color:activeFilter===g.id?g.color:theme.textMuted,
            fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.18s",
          }}>
            <span style={{width:7,height:7,borderRadius:"50%",background:g.color,display:"inline-block"}}/>
            {g.name}
          </button>
        ))}
      </div>

      {/* Month nav */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 18px 10px"}}>
        <button onClick={()=>setMonth(m=>m>0?m-1:11)} style={{background:"none",border:"none",color:theme.textMuted,fontSize:20,cursor:"pointer",lineHeight:1}}>‹</button>
        <div style={{fontSize:16,fontWeight:700,color:theme.text}}>{monthNames[month]} {year}</div>
        <button onClick={()=>setMonth(m=>m<11?m+1:0)} style={{background:"none",border:"none",color:theme.textMuted,fontSize:20,cursor:"pointer",lineHeight:1}}>›</button>
      </div>

      {/* Calendar grid */}
      <div style={{padding:"0 10px",marginBottom:4}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:4}}>
          {["S","M","T","W","T","F","S"].map((d,i)=>(
            <div key={i} style={{textAlign:"center",fontSize:11,fontWeight:600,color:theme.textMuted,padding:"3px 0"}}>{d}</div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"2px 0"}}>
          {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`}/>)}
          {Array.from({length:days}).map((_,i)=>{
            const d = i+1;
            const evs = eventsOnDay(d, month, year);
            const isToday = d===7 && month===4 && year===2026;
            return (
              <div key={d} style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"3px 0",cursor:"pointer"}}>
                <div style={{
                  width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:13,fontWeight:isToday?700:400,
                  background:isToday?theme.accent:"transparent",
                  color:isToday?"white":theme.text,
                  boxShadow:isToday?`0 0 10px ${theme.accentGlow}`:"none",
                }}>{d}</div>
                <div style={{display:"flex",gap:2,marginTop:2,height:7}}>
                  {evs.slice(0,3).map((e,ei)=>{
                    const g = groupById(e.groupId);
                    return <AStatusDot key={ei} color={g.color} size={5}/>;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div style={{margin:"8px 18px",borderTop:`1px solid ${theme.border}`}}/>

      {/* Upcoming */}
      <div style={{padding:"0 18px",fontSize:11,fontWeight:700,letterSpacing:1.5,color:theme.textMuted,textTransform:"uppercase",marginBottom:10}}>Upcoming</div>
      <div style={{display:"flex",flexDirection:"column",gap:0,paddingBottom:90}}>
        {upcoming.map(e=>{
          const g = groupById(e.groupId);
          return (
            <div key={e.id} onClick={()=>onEventTap(e)} style={{
              display:"flex",alignItems:"flex-start",gap:12,padding:"12px 18px",
              borderBottom:`1px solid ${theme.border}`,cursor:"pointer",
              transition:"background 0.15s",
            }}
            onMouseOver={ev=>ev.currentTarget.style.background=theme.surface2}
            onMouseOut={ev=>ev.currentTarget.style.background="transparent"}>
              <div style={{width:3,alignSelf:"stretch",borderRadius:999,background:g.color,flexShrink:0,marginTop:2}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:theme.text}}>{e.title}</div>
                <div style={{fontSize:12,color:theme.textMuted,marginTop:2}}>
                  {e.isAllDay ? `${fmtDate(e.startUtc)} · All day` : `${fmtDate(e.startUtc)} · ${fmtTime(e.startUtc)}`}
                </div>
                <div style={{fontSize:12,color:theme.textMuted}}>{e.type==="group_shared"?"Auto-attended":e.attendees.filter(a=>a.status==="attending").length+" attending"}</div>
              </div>
              <div style={{fontSize:11,color:theme.textMuted}}>{e.isAllDay?"All day":fmtTime(e.startUtc)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AGroupsScreen({ theme }) {
  const [selected, setSelected] = React.useState(null);
  const [showQR, setShowQR] = React.useState(false);

  if (showQR && selected) {
    const g = groupById(selected);
    return (
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",padding:"16px 20px"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
          <button onClick={()=>setShowQR(false)} style={{background:"none",border:"none",color:theme.textMuted,fontSize:20,cursor:"pointer"}}>‹</button>
          <div style={{fontSize:16,fontWeight:700,color:theme.text}}>{g.name} · Invite</div>
        </div>
        <div style={{background:theme.surface2,borderRadius:20,padding:20,display:"flex",flexDirection:"column",alignItems:"center",border:`1px solid ${theme.border}`,marginBottom:20}}>
          {/* Fake QR grid */}
          <svg width={160} height={160} viewBox="0 0 21 21" style={{imageRendering:"pixelated"}}>
            {[[1,1,1,1,1,1,1,0,1,1,0,0,1,0,1,1,1,1,1,1,1],
              [1,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,1],
              [1,0,1,1,1,0,1,0,1,0,1,1,0,0,1,0,1,1,1,0,1],
              [1,0,1,1,1,0,1,0,0,1,0,1,1,0,1,0,1,1,1,0,1],
              [1,0,1,1,1,0,1,0,1,0,0,0,1,0,1,0,1,1,1,0,1],
              [1,0,0,0,0,0,1,0,1,1,0,1,0,0,1,0,0,0,0,0,1],
              [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
              [0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0],
              [1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,0,1,1,0],
              [0,1,0,0,1,0,0,0,1,0,1,1,0,1,0,1,0,0,1,0,1],
              [1,1,1,0,1,1,1,1,0,1,0,0,1,0,1,1,1,0,0,1,1],
              [0,0,0,0,0,0,0,0,1,1,1,0,0,1,0,0,0,1,1,0,0],
              [1,1,1,1,1,1,1,0,1,0,1,1,0,0,1,0,1,0,1,0,1],
              [1,0,0,0,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0,1,0],
              [1,0,1,1,1,0,1,0,1,0,1,0,1,1,1,0,1,1,0,0,1],
              [1,0,1,1,1,0,1,0,0,0,1,1,0,0,0,1,0,0,1,1,0],
              [1,0,1,1,1,0,1,0,1,0,0,1,1,0,1,0,1,0,0,1,1],
              [1,0,0,0,0,0,1,0,0,1,0,0,1,1,0,0,1,1,0,0,1],
              [1,1,1,1,1,1,1,0,1,0,1,0,0,0,1,1,0,0,1,1,0]
            ].map((row,y)=>row.map((cell,x)=>(
              cell ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={theme.text}/> : null
            )))}
          </svg>
        </div>
        <div style={{fontSize:13,color:theme.textMuted,marginBottom:10}}>Or share the link:</div>
        <div style={{background:theme.surface2,border:`1px solid ${theme.border}`,borderRadius:12,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <span style={{fontSize:13,color:theme.text}}>decssy.app/join/abc123XYZ</span>
          <button style={{background:theme.accent,border:"none",borderRadius:8,padding:"5px 10px",fontSize:12,color:"white",cursor:"pointer",fontWeight:600}}>Copy</button>
        </div>
        <div style={{textAlign:"center",fontSize:12,color:theme.textMuted,marginBottom:16}}>Expires in 7 days · 0 of ∞ uses</div>
        <button style={{background:"transparent",border:`1.5px solid ${theme.negative}`,borderRadius:12,padding:"10px",color:theme.negative,fontSize:13,fontWeight:600,cursor:"pointer"}}>Revoke this invite</button>
      </div>
    );
  }

  if (selected) {
    const g = groupById(selected);
    const members = [{name:"Marvin",role:"owner",joined:""},{name:"Anna",role:"member",joined:"Mar 12"},{name:"Ben",role:"member",joined:"Mar 12"},{name:"Cara",role:"member",joined:"Mar 14"}];
    return (
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"16px 18px",display:"flex",alignItems:"center",gap:12}}>
          <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:theme.textMuted,fontSize:20,cursor:"pointer"}}>‹</button>
          <div style={{fontSize:16,fontWeight:700,color:theme.text,flex:1}}>{g.name}</div>
          <button style={{background:"none",border:"none",color:theme.textMuted,fontSize:20,cursor:"pointer"}}>⋯</button>
        </div>
        <div style={{padding:"0 18px 16px",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:44,height:44,borderRadius:14,background:g.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,boxShadow:`0 0 14px ${g.color}44`}}>
            {g.name[0]}
          </div>
          <div>
            <div style={{fontSize:16,fontWeight:700,color:theme.text}}>{g.name}</div>
            <div style={{fontSize:13,color:theme.textMuted}}>{g.members} members · You're the owner</div>
          </div>
        </div>
        <div style={{margin:"0 18px 16px"}}>
          <button onClick={()=>setShowQR(true)} style={{
            width:"100%",background:theme.accentSoft,border:`1.5px solid ${theme.accent}`,
            borderRadius:14,padding:"13px",color:theme.accent,fontSize:14,fontWeight:700,cursor:"pointer"
          }}>📤 Invite people</button>
        </div>
        <div style={{padding:"0 18px",fontSize:11,fontWeight:700,letterSpacing:1.5,color:theme.textMuted,textTransform:"uppercase",marginBottom:10}}>Members ({g.members})</div>
        {members.map((m,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 18px",borderBottom:`1px solid ${theme.border}`}}>
            <div style={{width:34,height:34,borderRadius:"50%",background:theme.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:theme.accent,border:`1.5px solid ${theme.border}`}}>{m.name[0]}</div>
            <div style={{flex:1}}>
              <span style={{fontSize:14,fontWeight:600,color:theme.text}}>{m.name}{m.name==="Marvin"?" (you)":""}</span>
              {m.role==="owner"&&<span style={{marginLeft:6,fontSize:11,color:theme.accent,fontWeight:600,background:theme.accentSoft,padding:"2px 6px",borderRadius:999}}>owner</span>}
            </div>
            {m.joined&&<div style={{fontSize:12,color:theme.textMuted}}>Joined {m.joined}</div>}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"64px 18px 12px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontSize:22,fontWeight:800,color:theme.text,letterSpacing:"-0.5px"}}>Groups</div>
        <button style={{background:theme.accent,border:"none",borderRadius:10,padding:"7px 14px",color:"white",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ New</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:0}}>
        {GROUPS.map(g=>(
          <div key={g.id} onClick={()=>setSelected(g.id)} style={{
            display:"flex",alignItems:"center",gap:14,padding:"16px 18px",
            borderBottom:`1px solid ${theme.border}`,cursor:"pointer",transition:"background 0.15s",
          }}
          onMouseOver={e=>e.currentTarget.style.background=theme.surface2}
          onMouseOut={e=>e.currentTarget.style.background="transparent"}>
            <div style={{width:44,height:44,borderRadius:14,background:`${g.color}22`,border:`2px solid ${g.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:g.color}}>
              {g.name[0]}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:700,color:theme.text}}>{g.name}</div>
              <div style={{fontSize:12,color:theme.textMuted,marginTop:2}}>{g.members} members</div>
            </div>
            <div style={{fontSize:11,color:theme.textMuted}}>›</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AFindScreen({ theme }) {
  const [searched, setSearched] = React.useState(false);
  const [group, setGroup] = React.useState("g1");
  const [created, setCreated] = React.useState(null);

  if (created !== null) {
    return (
      <div style={{flex:1,display:"flex",flexDirection:"column",padding:"24px 20px",gap:16}}>
        <button onClick={()=>setCreated(null)} style={{alignSelf:"flex-start",background:"none",border:"none",color:theme.textMuted,fontSize:14,cursor:"pointer"}}>‹ Back</button>
        <div style={{background:theme.surface2,borderRadius:16,padding:20,border:`1px solid ${theme.accent}`}}>
          <div style={{fontSize:12,color:theme.accent,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>New Event</div>
          <div style={{fontSize:15,fontWeight:700,color:theme.text,marginBottom:6}}>Title</div>
          <input placeholder="Event title…" style={{width:"100%",boxSizing:"border-box",background:theme.surface,border:`1px solid ${theme.border}`,borderRadius:10,padding:"10px 12px",color:theme.text,fontSize:14,fontFamily:"inherit",outline:"none",marginBottom:12}}/>
          <div style={{fontSize:13,color:theme.textMuted}}>📅 {FIND_FREE_RESULTS[created].date} · {FIND_FREE_RESULTS[created].time}</div>
          <div style={{fontSize:13,color:theme.textMuted,marginTop:4}}>👥 {groupById(group).name} · Group event</div>
          <button style={{marginTop:16,width:"100%",background:theme.accent,border:"none",borderRadius:12,padding:"12px",color:"white",fontSize:14,fontWeight:700,cursor:"pointer"}}>Save event</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",padding:"64px 18px 16px"}}>
      <div style={{fontSize:22,fontWeight:800,color:theme.text,letterSpacing:"-0.5px",marginBottom:20}}>Find a Free Day</div>

      <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:20}}>
        <div>
          <div style={{fontSize:12,fontWeight:700,color:theme.textMuted,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Group</div>
          <select value={group} onChange={e=>setGroup(e.target.value)} style={{width:"100%",background:theme.surface2,border:`1.5px solid ${theme.border}`,borderRadius:12,padding:"10px 14px",color:theme.text,fontSize:14,fontFamily:"inherit",outline:"none",cursor:"pointer"}}>
            {GROUPS.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div>
          <div style={{fontSize:12,fontWeight:700,color:theme.textMuted,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Between</div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{flex:1,background:theme.surface2,border:`1.5px solid ${theme.border}`,borderRadius:12,padding:"10px 14px",fontSize:13,color:theme.text}}>May 10</div>
            <div style={{color:theme.textMuted}}>→</div>
            <div style={{flex:1,background:theme.surface2,border:`1.5px solid ${theme.border}`,borderRadius:12,padding:"10px 14px",fontSize:13,color:theme.text}}>May 24</div>
          </div>
        </div>
        <div>
          <div style={{fontSize:12,fontWeight:700,color:theme.textMuted,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Duration</div>
          <div style={{background:theme.surface2,border:`1.5px solid ${theme.border}`,borderRadius:12,padding:"10px 14px",fontSize:13,color:theme.text}}>2 hours</div>
        </div>
      </div>

      <button onClick={()=>setSearched(true)} style={{
        background:theme.accent,border:"none",borderRadius:14,padding:"14px",
        color:"white",fontSize:15,fontWeight:700,cursor:"pointer",marginBottom:24,
        boxShadow:`0 4px 20px ${theme.accentGlow}`,
      }}>Find times</button>

      {searched && (
        <>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:theme.textMuted,textTransform:"uppercase",marginBottom:12}}>Results (4 slots)</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {FIND_FREE_RESULTS.map((r,i)=>(
              <div key={i} style={{background:theme.surface2,borderRadius:14,padding:"12px 14px",border:`1px solid ${r.busy.length===0?theme.accent:theme.border}`}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                  <div>
                    <span style={{fontSize:14,fontWeight:700,color:theme.text}}>{r.date}</span>
                    <span style={{fontSize:13,color:theme.textMuted,marginLeft:8}}>{r.time}</span>
                  </div>
                  {r.busy.length===0&&<span style={{fontSize:11,color:theme.accent,fontWeight:700,background:theme.accentSoft,padding:"2px 8px",borderRadius:999}}>✨ All free</span>}
                </div>
                <div style={{fontSize:12,color:r.busy.length===0?theme.positive:theme.textMuted}}>
                  {r.busy.length===0?`All ${r.freeCount} free`:`${r.freeCount} of ${r.total} free (${r.busy.join(", ")} busy)`}
                </div>
                {r.busy.length===0&&(
                  <button onClick={()=>setCreated(i)} style={{marginTop:8,background:"transparent",border:`1px solid ${theme.accent}`,borderRadius:8,padding:"6px 12px",color:theme.accent,fontSize:12,fontWeight:600,cursor:"pointer"}}>
                    Create event from slot →
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AInboxScreen({ theme }) {
  const [notes, setNotes] = React.useState(NOTIFICATIONS);
  const unread = notes.filter(n=>!n.read).length;

  return (
    <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"64px 18px 12px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontSize:22,fontWeight:800,color:theme.text,letterSpacing:"-0.5px"}}>Notifications</div>
        {unread>0&&<button onClick={()=>setNotes(n=>n.map(x=>({...x,read:true})))} style={{background:"none",border:"none",color:theme.accent,fontSize:12,fontWeight:600,cursor:"pointer"}}>Mark all read</button>}
      </div>
      {[{label:"Today",filter:n=>!n.read},{label:"Earlier",filter:n=>n.read}].map(section=>{
        const items = notes.filter(section.filter);
        if(!items.length) return null;
        return (
          <div key={section.label}>
            <div style={{padding:"8px 18px 6px",fontSize:11,fontWeight:700,letterSpacing:1.5,color:theme.textMuted,textTransform:"uppercase"}}>{section.label}</div>
            {items.map(n=>{
              const g = groupById(n.group);
              return (
                <div key={n.id} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"12px 18px",borderBottom:`1px solid ${theme.border}`,background:!n.read?`${theme.accent}08`:"transparent"}}>
                  {!n.read&&<div style={{width:7,height:7,borderRadius:"50%",background:theme.accent,marginTop:5,flexShrink:0,boxShadow:`0 0 6px ${theme.accent}`}}/>}
                  {n.read&&<div style={{width:7,flexShrink:0}}/>}
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,color:theme.text,lineHeight:1.4}}>{n.text}</div>
                    <div style={{fontSize:11,color:theme.textMuted,marginTop:4,display:"flex",alignItems:"center",gap:6}}>
                      <span style={{width:7,height:7,borderRadius:"50%",background:g.color,display:"inline-block"}}/>
                      {g.name} · {n.time}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function ABottomNav({ tab, setTab, theme }) {
  const tabs = [
    { id:"cal",    icon:"📅", label:"Calendar" },
    { id:"groups", icon:"👥", label:"Groups" },
    { id:"find",   icon:"🔍", label:"Find" },
    { id:"inbox",  icon:"🔔", label:"Inbox" },
  ];
  return (
    <div style={{
      position:"absolute",bottom:0,left:0,right:0,
      background:theme.tabBg, borderTop:`1px solid ${theme.border}`,
      display:"flex", padding:"8px 0 28px", zIndex:10,
    }}>
      {tabs.map(t=>(
        <button key={t.id} onClick={()=>setTab(t.id)} style={{
          flex:1, background:"none", border:"none", cursor:"pointer",
          display:"flex", flexDirection:"column", alignItems:"center", gap:3,
          padding:"4px 0",
        }}>
          <span style={{fontSize:18}}>{t.icon}</span>
          <span style={{fontSize:10,fontWeight:600,color:tab===t.id?theme.accent:theme.textMuted,transition:"color 0.18s"}}>{t.label}</span>
          {tab===t.id && <div style={{width:4,height:4,borderRadius:"50%",background:theme.accent,boxShadow:`0 0 6px ${theme.accent}`}}/>}
        </button>
      ))}
    </div>
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

function DecssyVariantA({ accentColor, darkBg }) {
  const [tab, setTab] = React.useState("cal");
  const [activeEvent, setActiveEvent] = React.useState(null);

  const theme = {
    ...A_THEME,
    bg: darkBg || A_THEME.bg,
    accent: accentColor || A_THEME.accent,
    accentGlow: `rgba(${hexToRgb(accentColor||A_THEME.accent)},0.25)`,
    accentSoft: `rgba(${hexToRgb(accentColor||A_THEME.accent)},0.15)`,
  };

  return (
    <div style={{
      width:"100%",height:"100%",background:theme.bg,
      fontFamily:"'DM Sans',sans-serif",display:"flex",flexDirection:"column",
      position:"relative",overflow:"hidden",color:theme.text,
    }}>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      {tab==="cal"    && <ACalendarScreen theme={theme} onEventTap={setActiveEvent}/>}
      {tab==="groups" && <AGroupsScreen theme={theme}/>}
      {tab==="find"   && <AFindScreen theme={theme}/>}
      {tab==="inbox"  && <AInboxScreen theme={theme}/>}
      {activeEvent && <ABottomSheet event={activeEvent} onClose={()=>setActiveEvent(null)} theme={theme}/>}
      <ABottomNav tab={tab} setTab={setTab} theme={theme}/>
    </div>
  );
}

Object.assign(window, { DecssyVariantA });
