// Variant B — "Peach Fuzz"
// Creamy off-white, soft coral accent, Nunito, rounded, warm pastels

const B_THEME = {
  bg:        "#fdf7f2",
  surface:   "#ffffff",
  surface2:  "#f5ece4",
  border:    "#ecddd3",
  text:      "#2c1f17",
  textMuted: "#9a7b6a",
  accent:    "#e8704a",
  accentSoft:"rgba(232,112,74,0.12)",
  positive:  "#3aab6e",
  maybe:     "#e8a530",
  negative:  "#e04f4f",
  tabBg:     "#ffffff",
  shadow:    "0 2px 16px rgba(44,31,23,0.08)",
};

function BDot({ color, size=8 }) {
  return <span style={{ display:"inline-block", width:size, height:size, borderRadius:"50%", background:color, flexShrink:0 }} />;
}

function BChip({ label, color, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display:"flex", alignItems:"center", gap:5, padding:"5px 13px",
      borderRadius:999, fontSize:12, fontWeight:700, cursor:"pointer",
      border:`1.5px solid ${active ? color : "#ecddd3"}`,
      background: active ? `${color}18` : "#ffffff",
      color: active ? color : "#9a7b6a",
      transition:"all 0.18s",
    }}>
      <BDot color={color} size={7}/>{label}
    </button>
  );
}

function BRsvpBtn({ label, active, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex:1, padding:"10px 0", borderRadius:14, fontSize:13, fontWeight:700,
      cursor:"pointer", transition:"all 0.18s",
      border: `2px solid ${active ? color : "#ecddd3"}`,
      background: active ? `${color}18` : "#ffffff",
      color: active ? color : "#9a7b6a",
    }}>{label}</button>
  );
}

function BBottomSheet({ event, onClose, theme }) {
  const [rsvp, setRsvp] = React.useState("attending");
  const [comment, setComment] = React.useState("");
  const [comments, setComments] = React.useState(event.comments);
  const g = groupById(event.groupId);
  const going = event.attendees.filter(a=>a.status==="attending").length;
  const maybe_ = event.attendees.filter(a=>a.status==="maybe").length;

  function send() {
    if (!comment.trim()) return;
    setComments(c=>[...c,{author:"Marvin",body:comment,ago:"now"}]);
    setComment("");
  }

  return (
    <div style={{position:"absolute",inset:0,background:"rgba(44,31,23,0.3)",zIndex:100,display:"flex",flexDirection:"column",justifyContent:"flex-end"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:theme.bg, borderRadius:"28px 28px 0 0",
        padding:"0 20px 36px", maxHeight:"85%", overflowY:"auto",
        boxShadow:"0 -8px 40px rgba(44,31,23,0.12)",
      }}>
        <div style={{display:"flex",justifyContent:"center",padding:"14px 0 10px"}}>
          <div style={{width:40,height:5,borderRadius:3,background:theme.border}}/>
        </div>

        {/* Color bar */}
        <div style={{height:4,borderRadius:999,background:g.color,marginBottom:16,opacity:0.8}}/>

        <div style={{marginBottom:16}}>
          <div style={{fontSize:21,fontWeight:800,color:theme.text,letterSpacing:"-0.3px",marginBottom:4}}>{event.title}</div>
          <div style={{fontSize:13,color:theme.textMuted}}>
            {event.isAllDay ? `${fmtDate(event.startUtc)} · All day` : `${fmtDate(event.startUtc)} · ${fmtTime(event.startUtc)} – ${fmtTime(event.endUtc)}`}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginTop:4}}>
            <BDot color={g.color} size={8}/>
            <span style={{fontSize:13,color:theme.textMuted}}>{g.name} · By {event.by}</span>
          </div>
        </div>

        {event.type==="personal_shared" && (
          <div style={{marginBottom:18}}>
            <div style={{fontSize:12,fontWeight:700,color:theme.textMuted,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Your RSVP</div>
            <div style={{display:"flex",gap:8}}>
              <BRsvpBtn label="✓ Going"    active={rsvp==="attending"} color={theme.positive} onClick={()=>setRsvp("attending")}/>
              <BRsvpBtn label="? Maybe"    active={rsvp==="maybe"}     color={theme.maybe}    onClick={()=>setRsvp("maybe")}/>
              <BRsvpBtn label="✕ Can't go" active={rsvp==="declined"}  color={theme.negative} onClick={()=>setRsvp("declined")}/>
            </div>
          </div>
        )}

        <div style={{background:theme.surface,borderRadius:20,padding:"14px 16px",marginBottom:14,boxShadow:theme.shadow}}>
          <div style={{fontSize:12,fontWeight:700,color:theme.textMuted,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>
            Attendees ({going} going{maybe_?`, ${maybe_} maybe`:""})
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:9}}>
            {event.attendees.map((a,i)=>{
              const sc = a.status==="attending"?theme.positive:a.status==="maybe"?theme.maybe:theme.negative;
              const sl = a.status==="attending"?"Going":a.status==="maybe"?"Maybe":"Can't go";
              return (
                <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:`${g.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:g.color}}>{a.name[0]}</div>
                  <div style={{flex:1,fontSize:14,fontWeight:600,color:theme.text}}>{a.name}{a.you?" (you)":""}</div>
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <BDot color={sc} size={7}/>
                    <span style={{fontSize:12,color:theme.textMuted}}>{sl}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {comments.length>0&&(
          <div style={{background:theme.surface,borderRadius:20,padding:"14px 16px",marginBottom:14,boxShadow:theme.shadow}}>
            <div style={{fontSize:12,fontWeight:700,color:theme.textMuted,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Comments</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {comments.map((c,i)=>(
                <div key={i} style={{display:"flex",gap:10}}>
                  <div style={{width:30,height:30,borderRadius:"50%",background:theme.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:theme.accent,flexShrink:0}}>{c.author[0]}</div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",gap:8,alignItems:"baseline"}}>
                      <span style={{fontSize:13,fontWeight:700,color:theme.text}}>{c.author}</span>
                      <span style={{fontSize:11,color:theme.textMuted}}>{c.ago}</span>
                    </div>
                    <div style={{fontSize:13,color:theme.text,marginTop:2,lineHeight:1.4}}>{c.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <input value={comment} onChange={e=>setComment(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}
            placeholder="Add a comment…" style={{
              flex:1,background:theme.surface,border:`2px solid ${theme.border}`,
              borderRadius:999,padding:"10px 16px",fontSize:13,color:theme.text,
              fontFamily:"inherit",outline:"none",
            }}/>
          <button onClick={send} style={{
            width:40,height:40,borderRadius:"50%",background:theme.accent,border:"none",
            color:"white",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
          }}>→</button>
        </div>
      </div>
    </div>
  );
}

function BCalendarScreen({ theme, onEventTap }) {
  const [month, setMonth] = React.useState(4);
  const [year] = React.useState(2026);
  const [activeFilter, setActiveFilter] = React.useState(null);
  const monthNames=["January","February","March","April","May","June","July","August","September","October","November","December"];
  const days = daysInMonth(year,month);
  const firstDay = firstDayOfMonth(year,month);
  const upcoming = EVENTS.filter(e=>e.startUtc.getMonth()===month).sort((a,b)=>a.startUtc-b.startUtc);

  return (
    <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column"}}>
      {/* Header */}
      <div style={{padding:"64px 18px 10px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontSize:23,fontWeight:900,color:theme.text,letterSpacing:"-0.5px"}}>
          Decssy<span style={{color:theme.accent}}>.</span>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button style={{background:theme.surface,border:`1.5px solid ${theme.border}`,borderRadius:10,padding:"5px 11px",fontSize:12,fontWeight:700,color:theme.textMuted,cursor:"pointer",boxShadow:theme.shadow}}>Filter</button>
          <div style={{width:34,height:34,borderRadius:"50%",background:theme.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"white"}}>M</div>
        </div>
      </div>

      {/* Chips */}
      <div style={{display:"flex",gap:6,padding:"0 18px 14px",overflowX:"auto",scrollbarWidth:"none"}}>
        {GROUPS.map(g=><BChip key={g.id} label={g.name} color={g.color} active={activeFilter===g.id} onClick={()=>setActiveFilter(activeFilter===g.id?null:g.id)}/>)}
      </div>

      {/* Month nav */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 18px 12px"}}>
        <button onClick={()=>setMonth(m=>m>0?m-1:11)} style={{width:36,height:36,borderRadius:"50%",background:theme.surface,border:`1.5px solid ${theme.border}`,color:theme.textMuted,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:theme.shadow}}>‹</button>
        <div style={{fontSize:17,fontWeight:800,color:theme.text}}>{monthNames[month]} {year}</div>
        <button onClick={()=>setMonth(m=>m<11?m+1:0)} style={{width:36,height:36,borderRadius:"50%",background:theme.surface,border:`1.5px solid ${theme.border}`,color:theme.textMuted,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:theme.shadow}}>›</button>
      </div>

      {/* Grid */}
      <div style={{background:theme.surface,margin:"0 12px",borderRadius:24,padding:"12px 8px 16px",boxShadow:theme.shadow,marginBottom:16}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:6}}>
          {["S","M","T","W","T","F","S"].map((d,i)=>(
            <div key={i} style={{textAlign:"center",fontSize:11,fontWeight:700,color:theme.textMuted}}>{d}</div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"4px 0"}}>
          {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`}/>)}
          {Array.from({length:days}).map((_,i)=>{
            const d=i+1;
            const evs=eventsOnDay(d,month,year);
            const isToday = d===7&&month===4&&year===2026;
            return (
              <div key={d} style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"2px 0"}}>
                <div style={{
                  width:30,height:30,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:13,fontWeight:isToday?800:500,
                  background:isToday?theme.accent:"transparent",
                  color:isToday?"white":theme.text,
                }}>{d}</div>
                <div style={{display:"flex",gap:2,marginTop:2,height:6}}>
                  {evs.slice(0,3).map((e,ei)=><BDot key={ei} color={groupById(e.groupId).color} size={5}/>)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming */}
      <div style={{padding:"0 18px",fontSize:12,fontWeight:800,color:theme.textMuted,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Upcoming</div>
      <div style={{display:"flex",flexDirection:"column",gap:10,padding:"0 12px",paddingBottom:90}}>
        {upcoming.map(e=>{
          const g=groupById(e.groupId);
          return (
            <div key={e.id} onClick={()=>onEventTap(e)} style={{
              background:theme.surface,borderRadius:18,padding:"14px 16px",
              boxShadow:theme.shadow,cursor:"pointer",display:"flex",alignItems:"center",gap:12,
              border:`1.5px solid ${theme.border}`,transition:"transform 0.15s,box-shadow 0.15s",
            }}
            onMouseOver={ev=>{ev.currentTarget.style.transform="translateY(-1px)";ev.currentTarget.style.boxShadow="0 4px 20px rgba(44,31,23,0.12)"}}
            onMouseOut={ev=>{ev.currentTarget.style.transform="none";ev.currentTarget.style.boxShadow=theme.shadow}}>
              <div style={{width:4,alignSelf:"stretch",borderRadius:999,background:g.color,flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:theme.text}}>{e.title}</div>
                <div style={{fontSize:12,color:theme.textMuted,marginTop:2}}>
                  {e.isAllDay?`${fmtDate(e.startUtc)} · All day`:`${fmtDate(e.startUtc)} · ${fmtTime(e.startUtc)}`}
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <BDot color={g.color} size={8}/>
                <div style={{fontSize:11,color:theme.textMuted,marginTop:4}}>{e.isAllDay?"All day":fmtTime(e.startUtc)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BGroupsScreen({ theme }) {
  const [selected, setSelected] = React.useState(null);
  const [showQR, setShowQR] = React.useState(false);

  if (showQR && selected) {
    const g = groupById(selected);
    return (
      <div style={{flex:1,overflowY:"auto",padding:"16px 18px"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
          <button onClick={()=>setShowQR(false)} style={{width:36,height:36,borderRadius:"50%",background:theme.surface,border:`1.5px solid ${theme.border}`,fontSize:18,cursor:"pointer",color:theme.textMuted,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
          <div style={{fontSize:16,fontWeight:800,color:theme.text}}>{g.name} · Invite</div>
        </div>
        <div style={{background:theme.surface,borderRadius:24,padding:24,boxShadow:theme.shadow,marginBottom:20,display:"flex",flexDirection:"column",alignItems:"center",border:`1.5px solid ${theme.border}`}}>
          <svg width={160} height={160} viewBox="0 0 21 19" style={{imageRendering:"pixelated",marginBottom:8}}>
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
            ].map((row,y)=>row.map((cell,x)=>cell?<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={theme.text}/>:null))}
          </svg>
          <div style={{fontSize:12,color:theme.textMuted,fontWeight:600}}>Scan to join {g.name}</div>
        </div>
        <div style={{fontSize:13,color:theme.textMuted,marginBottom:8,fontWeight:600}}>Or share the link:</div>
        <div style={{background:theme.surface,border:`1.5px solid ${theme.border}`,borderRadius:16,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,boxShadow:theme.shadow}}>
          <span style={{fontSize:13,color:theme.text,fontWeight:600}}>decssy.app/join/abc123XYZ</span>
          <button style={{background:theme.accent,border:"none",borderRadius:10,padding:"6px 12px",fontSize:12,fontWeight:700,color:"white",cursor:"pointer"}}>Copy</button>
        </div>
        <div style={{textAlign:"center",fontSize:12,color:theme.textMuted,marginBottom:16,fontWeight:500}}>Expires in 7 days · 0 of ∞ uses</div>
        <button style={{width:"100%",background:"transparent",border:`2px solid ${theme.negative}`,borderRadius:16,padding:"11px",color:theme.negative,fontSize:13,fontWeight:700,cursor:"pointer"}}>Revoke this invite</button>
      </div>
    );
  }

  if (selected) {
    const g = groupById(selected);
    const members=[{name:"Marvin",role:"owner",joined:""},{name:"Anna",role:"member",joined:"Mar 12"},{name:"Ben",role:"member",joined:"Mar 12"},{name:"Cara",role:"member",joined:"Mar 14"}];
    return (
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"16px 18px",display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setSelected(null)} style={{width:36,height:36,borderRadius:"50%",background:theme.surface,border:`1.5px solid ${theme.border}`,fontSize:18,cursor:"pointer",color:theme.textMuted,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
          <div style={{flex:1,fontSize:16,fontWeight:800,color:theme.text}}>{g.name}</div>
          <button style={{width:36,height:36,borderRadius:"50%",background:theme.surface,border:`1.5px solid ${theme.border}`,fontSize:18,cursor:"pointer",color:theme.textMuted,display:"flex",alignItems:"center",justifyContent:"center"}}>⋯</button>
        </div>
        <div style={{margin:"0 18px 20px",background:theme.surface,borderRadius:24,padding:20,boxShadow:theme.shadow,border:`1.5px solid ${theme.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
            <div style={{width:52,height:52,borderRadius:18,background:`${g.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:800,color:g.color}}>
              {g.name[0]}
            </div>
            <div>
              <div style={{fontSize:17,fontWeight:800,color:theme.text}}>{g.name}</div>
              <div style={{fontSize:13,color:theme.textMuted}}>{g.members} members · Owner</div>
            </div>
          </div>
          <button onClick={()=>setShowQR(true)} style={{width:"100%",background:theme.accent,border:"none",borderRadius:16,padding:"13px",color:"white",fontSize:14,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 16px rgba(232,112,74,0.3)"}}>
            📤 Invite people
          </button>
        </div>
        <div style={{padding:"0 18px 10px",fontSize:12,fontWeight:800,color:theme.textMuted,textTransform:"uppercase",letterSpacing:1}}>Members ({g.members})</div>
        <div style={{display:"flex",flexDirection:"column",gap:8,padding:"0 12px",paddingBottom:90}}>
          {members.map((m,i)=>(
            <div key={i} style={{background:theme.surface,borderRadius:18,padding:"12px 16px",boxShadow:theme.shadow,border:`1.5px solid ${theme.border}`,display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:`${g.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,color:g.color}}>{m.name[0]}</div>
              <div style={{flex:1,fontSize:14,fontWeight:700,color:theme.text}}>{m.name}{m.name==="Marvin"?" (you)":""}</div>
              {m.role==="owner"&&<span style={{background:`${theme.accent}18`,color:theme.accent,borderRadius:999,padding:"3px 10px",fontSize:11,fontWeight:800}}>owner</span>}
              {m.joined&&<span style={{fontSize:12,color:theme.textMuted}}>{m.joined}</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"64px 18px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontSize:23,fontWeight:900,color:theme.text}}>Groups<span style={{color:theme.accent}}>.</span></div>
        <button style={{background:theme.accent,border:"none",borderRadius:14,padding:"8px 16px",color:"white",fontSize:13,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 16px rgba(232,112,74,0.3)"}}>+ New</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10,padding:"0 12px",paddingBottom:90}}>
        {GROUPS.map(g=>(
          <div key={g.id} onClick={()=>setSelected(g.id)} style={{
            background:theme.surface,borderRadius:22,padding:"16px 18px",
            boxShadow:theme.shadow,border:`1.5px solid ${theme.border}`,
            display:"flex",alignItems:"center",gap:14,cursor:"pointer",
            transition:"transform 0.15s,box-shadow 0.15s",
          }}
          onMouseOver={ev=>{ev.currentTarget.style.transform="translateY(-1px)";ev.currentTarget.style.boxShadow="0 6px 24px rgba(44,31,23,0.12)"}}
          onMouseOut={ev=>{ev.currentTarget.style.transform="none";ev.currentTarget.style.boxShadow=theme.shadow}}>
            <div style={{width:48,height:48,borderRadius:16,background:`${g.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:800,color:g.color,flexShrink:0}}>
              {g.name[0]}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:800,color:theme.text}}>{g.name}</div>
              <div style={{fontSize:12,color:theme.textMuted,marginTop:2}}>{g.members} members</div>
            </div>
            <span style={{fontSize:18,color:theme.textMuted}}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BFindScreen({ theme }) {
  const [searched, setSearched] = React.useState(false);
  const [group, setGroup] = React.useState("g1");
  const [created, setCreated] = React.useState(null);

  if (created!==null) {
    return (
      <div style={{flex:1,padding:"20px 18px",display:"flex",flexDirection:"column",gap:16}}>
        <button onClick={()=>setCreated(null)} style={{alignSelf:"flex-start",background:"none",border:"none",color:theme.textMuted,fontSize:14,fontWeight:700,cursor:"pointer"}}>‹ Back</button>
        <div style={{background:theme.surface,borderRadius:24,padding:20,boxShadow:theme.shadow,border:`1.5px solid ${theme.accent}`}}>
          <div style={{fontSize:12,fontWeight:800,color:theme.accent,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>New Event</div>
          <input placeholder="Event title…" style={{width:"100%",boxSizing:"border-box",background:theme.bg,border:`2px solid ${theme.border}`,borderRadius:14,padding:"11px 14px",fontSize:14,color:theme.text,fontFamily:"inherit",outline:"none",marginBottom:12}}/>
          <div style={{fontSize:13,color:theme.textMuted,fontWeight:600}}>📅 {FIND_FREE_RESULTS[created].date} · {FIND_FREE_RESULTS[created].time}</div>
          <div style={{fontSize:13,color:theme.textMuted,fontWeight:600,marginTop:4}}>👥 {groupById(group).name} · Group event</div>
          <button style={{marginTop:16,width:"100%",background:theme.accent,border:"none",borderRadius:16,padding:"13px",color:"white",fontSize:14,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 16px rgba(232,112,74,0.3)"}}>Save event</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{flex:1,overflowY:"auto",padding:"64px 18px 18px",display:"flex",flexDirection:"column"}}>
      <div style={{fontSize:23,fontWeight:900,color:theme.text,marginBottom:20}}>Find a Free Day<span style={{color:theme.accent}}>.</span></div>
      <div style={{background:theme.surface,borderRadius:24,padding:18,boxShadow:theme.shadow,border:`1.5px solid ${theme.border}`,marginBottom:16,display:"flex",flexDirection:"column",gap:14}}>
        <div>
          <div style={{fontSize:12,fontWeight:800,color:theme.textMuted,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Group</div>
          <select value={group} onChange={e=>setGroup(e.target.value)} style={{width:"100%",background:theme.bg,border:`2px solid ${theme.border}`,borderRadius:14,padding:"10px 14px",color:theme.text,fontSize:14,fontFamily:"inherit",outline:"none",fontWeight:600}}>
            {GROUPS.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div>
          <div style={{fontSize:12,fontWeight:800,color:theme.textMuted,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Between</div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{flex:1,background:theme.bg,border:`2px solid ${theme.border}`,borderRadius:14,padding:"10px 14px",fontSize:13,color:theme.text,fontWeight:600}}>May 10</div>
            <div style={{color:theme.accent,fontWeight:800}}>→</div>
            <div style={{flex:1,background:theme.bg,border:`2px solid ${theme.border}`,borderRadius:14,padding:"10px 14px",fontSize:13,color:theme.text,fontWeight:600}}>May 24</div>
          </div>
        </div>
        <div>
          <div style={{fontSize:12,fontWeight:800,color:theme.textMuted,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Duration</div>
          <div style={{background:theme.bg,border:`2px solid ${theme.border}`,borderRadius:14,padding:"10px 14px",fontSize:13,color:theme.text,fontWeight:600}}>2 hours</div>
        </div>
      </div>
      <button onClick={()=>setSearched(true)} style={{background:theme.accent,border:"none",borderRadius:18,padding:"15px",color:"white",fontSize:15,fontWeight:800,cursor:"pointer",marginBottom:20,boxShadow:"0 6px 24px rgba(232,112,74,0.35)"}}>Find times</button>
      {searched&&(
        <>
          <div style={{fontSize:12,fontWeight:800,color:theme.textMuted,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Results (4 slots)</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {FIND_FREE_RESULTS.map((r,i)=>(
              <div key={i} style={{background:theme.surface,borderRadius:20,padding:"14px 16px",boxShadow:theme.shadow,border:`1.5px solid ${r.busy.length===0?theme.accent:theme.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:800,color:theme.text}}>{r.date}</div>
                    <div style={{fontSize:13,color:theme.textMuted,fontWeight:600}}>{r.time}</div>
                  </div>
                  {r.busy.length===0&&<span style={{background:`${theme.accent}18`,color:theme.accent,borderRadius:999,padding:"3px 10px",fontSize:11,fontWeight:800}}>✨ All free</span>}
                </div>
                <div style={{fontSize:12,color:r.busy.length===0?theme.positive:theme.textMuted,fontWeight:600,marginBottom:r.busy.length===0?8:0}}>
                  {r.busy.length===0?`All ${r.freeCount} members free`:`${r.freeCount} of ${r.total} free · ${r.busy.join(", ")} busy`}
                </div>
                {r.busy.length===0&&<button onClick={()=>setCreated(i)} style={{background:"transparent",border:`2px solid ${theme.accent}`,borderRadius:12,padding:"7px 14px",color:theme.accent,fontSize:12,fontWeight:800,cursor:"pointer"}}>Create event from slot →</button>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function BInboxScreen({ theme }) {
  const [notes, setNotes] = React.useState(NOTIFICATIONS);
  const unread = notes.filter(n=>!n.read).length;
  return (
    <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"64px 18px 12px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontSize:23,fontWeight:900,color:theme.text}}>Inbox<span style={{color:theme.accent}}>.</span></div>
        {unread>0&&<button onClick={()=>setNotes(n=>n.map(x=>({...x,read:true})))} style={{background:`${theme.accent}18`,border:"none",borderRadius:999,padding:"5px 12px",color:theme.accent,fontSize:12,fontWeight:800,cursor:"pointer"}}>Mark all read</button>}
      </div>
      {[{label:"Today",filter:n=>!n.read},{label:"Earlier",filter:n=>n.read}].map(section=>{
        const items = notes.filter(section.filter);
        if(!items.length) return null;
        return (
          <div key={section.label} style={{marginBottom:8}}>
            <div style={{padding:"8px 18px 8px",fontSize:11,fontWeight:800,color:theme.textMuted,textTransform:"uppercase",letterSpacing:1}}>{section.label}</div>
            <div style={{display:"flex",flexDirection:"column",gap:8,padding:"0 12px"}}>
              {items.map(n=>{
                const g=groupById(n.group);
                return (
                  <div key={n.id} style={{background:theme.surface,borderRadius:18,padding:"12px 16px",boxShadow:theme.shadow,border:`1.5px solid ${!n.read?theme.accent:theme.border}`,display:"flex",alignItems:"flex-start",gap:10}}>
                    {!n.read?<div style={{width:9,height:9,borderRadius:"50%",background:theme.accent,marginTop:4,flexShrink:0}}/>:<div style={{width:9,flexShrink:0}}/>}
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600,color:theme.text,lineHeight:1.4}}>{n.text}</div>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginTop:5}}>
                        <BDot color={g.color} size={7}/>
                        <span style={{fontSize:11,color:theme.textMuted,fontWeight:600}}>{g.name} · {n.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BBottomNav({ tab, setTab, theme }) {
  const tabs=[
    {id:"cal",icon:"📅",label:"Calendar"},
    {id:"groups",icon:"👥",label:"Groups"},
    {id:"find",icon:"🔍",label:"Find"},
    {id:"inbox",icon:"🔔",label:"Inbox"},
  ];
  return (
    <div style={{
      position:"absolute",bottom:0,left:0,right:0,
      background:theme.tabBg,
      borderTop:`1.5px solid ${theme.border}`,
      display:"flex",padding:"10px 0 28px",zIndex:10,
      boxShadow:"0 -4px 20px rgba(44,31,23,0.06)",
    }}>
      {tabs.map(t=>(
        <button key={t.id} onClick={()=>setTab(t.id)} style={{
          flex:1,background:"none",border:"none",cursor:"pointer",
          display:"flex",flexDirection:"column",alignItems:"center",gap:3,
          padding:"4px 0",
        }}>
          <div style={{
            width:40,height:40,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",
            background:tab===t.id?`${theme.accent}18`:"transparent",
            transition:"background 0.18s",
          }}>
            <span style={{fontSize:18}}>{t.icon}</span>
          </div>
          <span style={{fontSize:10,fontWeight:800,color:tab===t.id?theme.accent:theme.textMuted,transition:"color 0.18s"}}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

function DecssyVariantB({ accentColor }) {
  const [tab, setTab] = React.useState("cal");
  const [activeEvent, setActiveEvent] = React.useState(null);

  const theme = {
    ...B_THEME,
    accent: accentColor || B_THEME.accent,
  };

  return (
    <div style={{
      width:"100%",height:"100%",background:theme.bg,
      fontFamily:"'Nunito',sans-serif",
      display:"flex",flexDirection:"column",
      position:"relative",overflow:"hidden",color:theme.text,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@500;600;700;800;900&display=swap" rel="stylesheet"/>
      {tab==="cal"    && <BCalendarScreen theme={theme} onEventTap={setActiveEvent}/>}
      {tab==="groups" && <BGroupsScreen theme={theme}/>}
      {tab==="find"   && <BFindScreen theme={theme}/>}
      {tab==="inbox"  && <BInboxScreen theme={theme}/>}
      {activeEvent && <BBottomSheet event={activeEvent} onClose={()=>setActiveEvent(null)} theme={theme}/>}
      <BBottomNav tab={tab} setTab={setTab} theme={theme}/>
    </div>
  );
}

Object.assign(window, { DecssyVariantB });
