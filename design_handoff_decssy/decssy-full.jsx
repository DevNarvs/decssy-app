// Decssy — Full Prototype (Peach Fuzz variant)
// All 15 screens, full navigation, realistic interactions

// ── Theme ───────────────────────────────────────────────────────────────────

const T = {
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
  shadow:    "0 2px 16px rgba(44,31,23,0.08)",
  shadowMd:  "0 4px 24px rgba(44,31,23,0.12)",
};

// ── Tiny primitives ──────────────────────────────────────────────────────────

function Dot({ color, size = 8 }) {
  return <span style={{ display:"inline-block", width:size, height:size, borderRadius:"50%", background:color, flexShrink:0 }} />;
}

function Avatar({ name, color, size = 34 }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%",
      background: color ? `${color}22` : T.surface2,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize: size * 0.38, fontWeight:800,
      color: color || T.accent, flexShrink:0,
    }}>{name[0]}</div>
  );
}

function Btn({ label, onPress, variant="primary", style={} }) {
  const base = {
    borderRadius:16, padding:"14px 20px", fontSize:15, fontWeight:800,
    cursor:"pointer", border:"none", transition:"all 0.15s", ...style,
  };
  const variants = {
    primary: { background:T.accent, color:"white", boxShadow:"0 6px 20px rgba(232,112,74,0.32)" },
    ghost:   { background:"transparent", color:T.accent, border:`2px solid ${T.accent}` },
    danger:  { background:"transparent", color:T.negative, border:`2px solid ${T.negative}` },
    muted:   { background:T.surface2, color:T.textMuted, border:`1.5px solid ${T.border}` },
  };
  return (
    <button onClick={onPress} style={{ ...base, ...variants[variant] }}
      onMouseOver={e => e.currentTarget.style.opacity="0.85"}
      onMouseOut={e  => e.currentTarget.style.opacity="1"}>
      {label}
    </button>
  );
}

function Card({ children, style={}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background:T.surface, borderRadius:20, padding:"14px 16px",
      boxShadow:T.shadow, border:`1.5px solid ${T.border}`,
      cursor: onClick ? "pointer" : "default",
      transition: onClick ? "transform 0.15s, box-shadow 0.15s" : "none",
      ...style,
    }}
    onMouseOver={e => { if(onClick){ e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow=T.shadowMd; }}}
    onMouseOut={e  => { if(onClick){ e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow=T.shadow; }}}
    >{children}</div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontSize:11, fontWeight:800, color:T.textMuted, textTransform:"uppercase", letterSpacing:1.2, marginBottom:10 }}>{children}</div>;
}

function Divider() {
  return <div style={{ height:1, background:T.border, margin:"4px 0" }} />;
}

function BackBtn({ onPress }) {
  return (
    <button onClick={onPress} style={{
      width:36, height:36, borderRadius:"50%", background:T.surface,
      border:`1.5px solid ${T.border}`, fontSize:18, cursor:"pointer",
      color:T.textMuted, display:"flex", alignItems:"center", justifyContent:"center",
      flexShrink:0, boxShadow:T.shadow,
    }}>‹</button>
  );
}

// ── Bottom Nav ───────────────────────────────────────────────────────────────

function BottomNav({ tab, setTab, unreadCount = 0 }) {
  const tabs = [
    { id:"cal",    icon:"📅", label:"Calendar" },
    { id:"groups", icon:"👥", label:"Groups" },
    { id:"find",   icon:"🔍", label:"Find" },
    { id:"inbox",  icon:"🔔", label:"Inbox", badge: unreadCount },
  ];
  return (
    <div style={{
      position:"absolute", bottom:0, left:0, right:0, zIndex:20,
      background:T.surface, borderTop:`1.5px solid ${T.border}`,
      display:"flex", padding:"8px 0 28px",
      boxShadow:"0 -4px 20px rgba(44,31,23,0.06)",
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setTab(t.id)} style={{
          flex:1, background:"none", border:"none", cursor:"pointer",
          display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:"4px 0",
          position:"relative",
        }}>
          <div style={{
            width:44, height:36, borderRadius:14,
            display:"flex", alignItems:"center", justifyContent:"center",
            background: tab === t.id ? T.accentSoft : "transparent",
            transition:"background 0.18s", position:"relative",
          }}>
            <span style={{ fontSize:20 }}>{t.icon}</span>
            {t.badge > 0 && (
              <div style={{
                position:"absolute", top:2, right:4, width:16, height:16,
                borderRadius:"50%", background:T.accent, color:"white",
                fontSize:9, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center",
              }}>{t.badge}</div>
            )}
          </div>
          <span style={{ fontSize:10, fontWeight:800, color: tab === t.id ? T.accent : T.textMuted, transition:"color 0.18s" }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── Screen: Onboarding ───────────────────────────────────────────────────────

function OnboardingScreen({ onDone }) {
  const [step, setStep] = React.useState(0); // 0=welcome, 1=profile, 2=fork
  const [tz, setTz] = React.useState("Asia/Manila");
  const [name, setName] = React.useState("Marvin");

  const steps = [
    // Step 0: Welcome
    <div key="welcome" style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flex:1, padding:"32px 28px", textAlign:"center" }}>
      <div style={{ fontSize:64, marginBottom:24 }}>🗓️</div>
      <div style={{ fontSize:32, fontWeight:900, color:T.text, letterSpacing:"-0.5px", marginBottom:12 }}>
        Welcome to Decssy<span style={{ color:T.accent }}>.</span>
      </div>
      <div style={{ fontSize:16, color:T.textMuted, lineHeight:1.6, marginBottom:40, maxWidth:280 }}>
        A shared calendar for your group chat — plan together without the chaos.
      </div>
      <Btn label="Get started →" onPress={() => setStep(1)} style={{ width:"100%" }}/>
    </div>,

    // Step 1: Profile
    <div key="profile" style={{ display:"flex", flexDirection:"column", flex:1, padding:"48px 24px 32px" }}>
      <div style={{ fontSize:26, fontWeight:900, color:T.text, marginBottom:6 }}>Set up your profile</div>
      <div style={{ fontSize:14, color:T.textMuted, marginBottom:32 }}>This is how friends will see you.</div>

      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:28 }}>
        <div style={{
          width:80, height:80, borderRadius:24, background:T.accentSoft,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:32, fontWeight:800, color:T.accent, marginBottom:10,
          border:`2px dashed ${T.accent}`,
        }}>{name[0] || "?"}</div>
        <div style={{ fontSize:12, color:T.accent, fontWeight:700 }}>Tap to add photo</div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div>
          <SectionLabel>Display name</SectionLabel>
          <input value={name} onChange={e => setName(e.target.value)} style={{
            width:"100%", boxSizing:"border-box", background:T.surface,
            border:`2px solid ${T.border}`, borderRadius:14, padding:"12px 16px",
            fontSize:15, color:T.text, fontFamily:"inherit", outline:"none",
          }}/>
        </div>
        <div>
          <SectionLabel>Timezone</SectionLabel>
          <div style={{
            background:T.surface, border:`2px solid ${T.border}`, borderRadius:14,
            padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center",
          }}>
            <span style={{ fontSize:15, color:T.text }}>{tz}</span>
            <span style={{ fontSize:12, color:T.accent, fontWeight:700 }}>Auto-detected ✓</span>
          </div>
        </div>
      </div>
      <div style={{ flex:1 }}/>
      <Btn label="Continue →" onPress={() => setStep(2)} style={{ width:"100%" }}/>
    </div>,

    // Step 2: Create or join
    <div key="fork" style={{ display:"flex", flexDirection:"column", flex:1, padding:"48px 24px 32px" }}>
      <div style={{ fontSize:26, fontWeight:900, color:T.text, marginBottom:6 }}>You're all set!</div>
      <div style={{ fontSize:14, color:T.textMuted, marginBottom:36 }}>What would you like to do first?</div>

      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <Card onClick={onDone} style={{ padding:"20px 18px" }}>
          <div style={{ fontSize:28, marginBottom:8 }}>✨</div>
          <div style={{ fontSize:16, fontWeight:800, color:T.text, marginBottom:4 }}>Create a group</div>
          <div style={{ fontSize:13, color:T.textMuted, lineHeight:1.5 }}>Start a group and invite your friends, family, or team.</div>
        </Card>
        <Card onClick={onDone} style={{ padding:"20px 18px" }}>
          <div style={{ fontSize:28, marginBottom:8 }}>🔗</div>
          <div style={{ fontSize:16, fontWeight:800, color:T.text, marginBottom:4 }}>I have an invite link</div>
          <div style={{ fontSize:13, color:T.textMuted, lineHeight:1.5 }}>Paste or scan a link to join an existing group.</div>
        </Card>
      </div>
    </div>,
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:T.bg, fontFamily:"'Nunito',sans-serif" }}>
      {step > 0 && (
        <div style={{ padding:"56px 20px 0", display:"flex", alignItems:"center" }}>
          <BackBtn onPress={() => setStep(s => s - 1)}/>
          <div style={{ flex:1, display:"flex", justifyContent:"center", gap:6, marginRight:36 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: i === step ? 20 : 6, height:6, borderRadius:999,
                background: i <= step ? T.accent : T.border,
                transition:"all 0.3s",
              }}/>
            ))}
          </div>
        </div>
      )}
      {steps[step]}
    </div>
  );
}

// ── Screen: Event Detail (Bottom Sheet) ─────────────────────────────────────

function EventDetailSheet({ event, onClose, onEdit }) {
  const [rsvp, setRsvp] = React.useState("attending");
  const [comment, setComment] = React.useState("");
  const [comments, setComments] = React.useState(event.comments);
  const g = groupById(event.groupId);
  const going  = event.attendees.filter(a => a.status === "attending").length;
  const maybe_ = event.attendees.filter(a => a.status === "maybe").length;

  function send() {
    if (!comment.trim()) return;
    setComments(c => [...c, { author:"Marvin", body:comment, ago:"now" }]);
    setComment("");
  }

  const rsvpColors = { attending:T.positive, maybe:T.maybe, declined:T.negative };

  return (
    <div style={{
      position:"absolute", inset:0, background:"rgba(44,31,23,0.35)", zIndex:50,
      display:"flex", flexDirection:"column", justifyContent:"flex-end",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background:T.bg, borderRadius:"28px 28px 0 0",
        padding:"0 20px 100px", maxHeight:"88%", overflowY:"auto",
        boxShadow:"0 -8px 40px rgba(44,31,23,0.14)",
      }}>
        {/* Handle */}
        <div style={{ display:"flex", justifyContent:"center", padding:"14px 0 10px" }}>
          <div style={{ width:40, height:5, borderRadius:3, background:T.border }}/>
        </div>

        {/* Color accent bar */}
        <div style={{ height:5, borderRadius:999, background:g.color, marginBottom:18, opacity:0.85 }}/>

        {/* Header */}
        <div style={{ marginBottom:18 }}>
          <div style={{ fontSize:22, fontWeight:900, color:T.text, letterSpacing:"-0.3px", marginBottom:5 }}>{event.title}</div>
          <div style={{ fontSize:13, color:T.textMuted, marginBottom:3 }}>
            {event.isAllDay
              ? `${fmtDate(event.startUtc)} · All day`
              : `${fmtDate(event.startUtc)} · ${fmtTime(event.startUtc)} – ${fmtTime(event.endUtc)}`}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <Dot color={g.color} size={8}/>
            <span style={{ fontSize:13, color:T.textMuted }}>{g.name}</span>
            <span style={{ fontSize:13, color:T.border }}>·</span>
            <span style={{ fontSize:13, color:T.textMuted }}>By {event.by}</span>
          </div>
          {event.description && (
            <div style={{ fontSize:13, color:T.text, lineHeight:1.6, marginTop:10, padding:"10px 14px", background:T.surface, borderRadius:12, border:`1px solid ${T.border}` }}>
              {event.description}
            </div>
          )}
        </div>

        {/* RSVP — only for personal_shared */}
        {event.type === "personal_shared" && (
          <Card style={{ marginBottom:14 }}>
            <SectionLabel>Your RSVP</SectionLabel>
            <div style={{ display:"flex", gap:8 }}>
              {[
                { key:"attending", label:"✓ Going" },
                { key:"maybe",     label:"? Maybe" },
                { key:"declined",  label:"✕ Can't go" },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setRsvp(key)} style={{
                  flex:1, padding:"10px 0", borderRadius:14, fontSize:12, fontWeight:800, cursor:"pointer",
                  border:`2px solid ${rsvp === key ? rsvpColors[key] : T.border}`,
                  background: rsvp === key ? `${rsvpColors[key]}18` : T.surface,
                  color: rsvp === key ? rsvpColors[key] : T.textMuted, transition:"all 0.18s",
                }}>{label}</button>
              ))}
            </div>
          </Card>
        )}

        {/* Attendees */}
        <Card style={{ marginBottom:14 }}>
          <SectionLabel>Attendees ({going} going{maybe_ ? `, ${maybe_} maybe` : ""})</SectionLabel>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {event.attendees.map((a, i) => {
              const sc = a.status === "attending" ? T.positive : a.status === "maybe" ? T.maybe : T.negative;
              const sl = a.status === "attending" ? "Going" : a.status === "maybe" ? "Maybe" : "Can't go";
              return (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <Avatar name={a.name} color={g.color}/>
                  <div style={{ flex:1, fontSize:14, fontWeight:700, color:T.text }}>{a.name}{a.you ? " (you)" : ""}</div>
                  <Dot color={sc} size={7}/>
                  <span style={{ fontSize:12, color:T.textMuted }}>{sl}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Comments */}
        <Card style={{ marginBottom:14 }}>
          <SectionLabel>Comments{comments.length > 0 ? ` (${comments.length})` : ""}</SectionLabel>
          {comments.length === 0 && (
            <div style={{ fontSize:13, color:T.textMuted, textAlign:"center", padding:"8px 0" }}>No comments yet. Be the first!</div>
          )}
          <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom: comments.length ? 14 : 0 }}>
            {comments.map((c, i) => (
              <div key={i} style={{ display:"flex", gap:10 }}>
                <Avatar name={c.author} color={g.color} size={30}/>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", gap:8, alignItems:"baseline" }}>
                    <span style={{ fontSize:13, fontWeight:800, color:T.text }}>{c.author}</span>
                    <span style={{ fontSize:11, color:T.textMuted }}>{c.ago}</span>
                  </div>
                  <div style={{ fontSize:13, color:T.text, marginTop:2, lineHeight:1.5 }}>{c.body}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <input value={comment} onChange={e => setComment(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Add a comment…" style={{
                flex:1, background:T.bg, border:`2px solid ${T.border}`,
                borderRadius:999, padding:"9px 14px", fontSize:13, color:T.text,
                fontFamily:"inherit", outline:"none",
              }}/>
            <button onClick={send} style={{
              width:36, height:36, borderRadius:"50%", background:T.accent, border:"none",
              color:"white", fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
            }}>→</button>
          </div>
        </Card>

        {/* Creator actions */}
        {event.byId === "u1" && (
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={onEdit} style={{
              flex:1, padding:"11px", borderRadius:14, fontSize:13, fontWeight:800,
              background:T.accentSoft, border:`1.5px solid ${T.accent}`, color:T.accent, cursor:"pointer",
            }}>Edit event</button>
            <button style={{
              flex:1, padding:"11px", borderRadius:14, fontSize:13, fontWeight:800,
              background:"transparent", border:`1.5px solid ${T.negative}`, color:T.negative, cursor:"pointer",
            }}>Cancel event</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Screen: Event Create / Edit ──────────────────────────────────────────────

function EventCreateScreen({ onBack, prefill = {} }) {
  const [type,  setType]  = React.useState(prefill.type  || "personal_shared");
  const [title, setTitle] = React.useState(prefill.title || "");
  const [group, setGroup] = React.useState(prefill.groupId || "g1");
  const [allDay, setAllDay] = React.useState(false);
  const [repeat, setRepeat] = React.useState("none");
  const [saved, setSaved] = React.useState(false);

  if (saved) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flex:1, padding:32, gap:16, textAlign:"center" }}>
        <div style={{ fontSize:56 }}>✅</div>
        <div style={{ fontSize:22, fontWeight:900, color:T.text }}>Event created!</div>
        <div style={{ fontSize:14, color:T.textMuted }}>Your group will see it right away.</div>
        <Btn label="Back to calendar" onPress={onBack} style={{ marginTop:12, width:"100%" }}/>
      </div>
    );
  }

  const g = groupById(group);

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:T.bg }}>
      {/* Header */}
      <div style={{ padding:"56px 18px 14px", display:"flex", alignItems:"center", gap:12 }}>
        <BackBtn onPress={onBack}/>
        <div style={{ flex:1, fontSize:18, fontWeight:900, color:T.text }}>New event</div>
        <button onClick={() => setSaved(true)} style={{
          background:T.accent, border:"none", borderRadius:14, padding:"8px 18px",
          color:"white", fontSize:14, fontWeight:800, cursor:"pointer",
          boxShadow:"0 4px 16px rgba(232,112,74,0.3)",
        }}>Save</button>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"0 18px 32px", display:"flex", flexDirection:"column", gap:14 }}>
        {/* Type */}
        <Card>
          <SectionLabel>Type</SectionLabel>
          <div style={{ display:"flex", gap:8 }}>
            {[
              { key:"personal_shared", label:"👤 Personal" },
              { key:"group_shared",    label:"👥 Group event" },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setType(key)} style={{
                flex:1, padding:"10px 0", borderRadius:14, fontSize:13, fontWeight:800, cursor:"pointer",
                border:`2px solid ${type === key ? T.accent : T.border}`,
                background: type === key ? T.accentSoft : T.surface,
                color: type === key ? T.accent : T.textMuted, transition:"all 0.18s",
              }}>{label}</button>
            ))}
          </div>
          {type === "personal_shared" && (
            <div style={{ marginTop:10, fontSize:12, color:T.textMuted, lineHeight:1.5, padding:"8px 12px", background:T.surface2, borderRadius:10 }}>
              Broadcast your availability — friends can RSVP.
            </div>
          )}
          {type === "group_shared" && (
            <div style={{ marginTop:10, fontSize:12, color:T.textMuted, lineHeight:1.5, padding:"8px 12px", background:T.surface2, borderRadius:10 }}>
              Everyone in the group is auto-added as attending.
            </div>
          )}
        </Card>

        {/* Title */}
        <Card>
          <SectionLabel>Title</SectionLabel>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="What's happening?" style={{
              width:"100%", boxSizing:"border-box", background:T.bg,
              border:`2px solid ${T.border}`, borderRadius:12, padding:"11px 14px",
              fontSize:15, color:T.text, fontFamily:"inherit", outline:"none", fontWeight:600,
            }}/>
        </Card>

        {/* Group */}
        <Card>
          <SectionLabel>Group</SectionLabel>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {GROUPS.map(gr => (
              <div key={gr.id} onClick={() => setGroup(gr.id)} style={{
                display:"flex", alignItems:"center", gap:12, padding:"10px 12px",
                borderRadius:12, cursor:"pointer",
                background: group === gr.id ? `${gr.color}14` : T.bg,
                border:`1.5px solid ${group === gr.id ? gr.color : T.border}`,
                transition:"all 0.15s",
              }}>
                <div style={{ width:28, height:28, borderRadius:8, background:`${gr.color}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:gr.color }}>{gr.name[0]}</div>
                <span style={{ fontSize:14, fontWeight:700, color: group === gr.id ? gr.color : T.text }}>{gr.name}</span>
                {group === gr.id && <span style={{ marginLeft:"auto", color:gr.color, fontSize:16 }}>✓</span>}
              </div>
            ))}
          </div>
        </Card>

        {/* All day toggle */}
        <Card>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: allDay ? 0 : 14 }}>
            <span style={{ fontSize:14, fontWeight:800, color:T.text }}>All day</span>
            <div onClick={() => setAllDay(v => !v)} style={{
              width:46, height:26, borderRadius:13, cursor:"pointer", position:"relative",
              background: allDay ? T.accent : T.border, transition:"background 0.2s",
            }}>
              <div style={{
                position:"absolute", top:3, left: allDay ? 23 : 3, width:20, height:20,
                borderRadius:"50%", background:"white", transition:"left 0.2s",
                boxShadow:"0 1px 4px rgba(0,0,0,0.2)",
              }}/>
            </div>
          </div>

          {!allDay && (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:T.textMuted, marginBottom:6 }}>Starts</div>
                <div style={{ display:"flex", gap:8 }}>
                  <div style={{ flex:1, background:T.bg, border:`1.5px solid ${T.border}`, borderRadius:12, padding:"10px 12px", fontSize:13, color:T.text, fontWeight:600 }}>
                    {prefill.date || "May 10, 2026"}
                  </div>
                  <div style={{ width:90, background:T.bg, border:`1.5px solid ${T.border}`, borderRadius:12, padding:"10px 12px", fontSize:13, color:T.text, fontWeight:600 }}>
                    {prefill.startTime || "7:00 PM"}
                  </div>
                </div>
              </div>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:T.textMuted, marginBottom:6 }}>Ends</div>
                <div style={{ display:"flex", gap:8 }}>
                  <div style={{ flex:1, background:T.bg, border:`1.5px solid ${T.border}`, borderRadius:12, padding:"10px 12px", fontSize:13, color:T.text, fontWeight:600 }}>
                    {prefill.date || "May 10, 2026"}
                  </div>
                  <div style={{ width:90, background:T.bg, border:`1.5px solid ${T.border}`, borderRadius:12, padding:"10px 12px", fontSize:13, color:T.text, fontWeight:600 }}>
                    {prefill.endTime || "10:00 PM"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Repeats */}
        <Card>
          <SectionLabel>Repeats</SectionLabel>
          <select value={repeat} onChange={e => setRepeat(e.target.value)} style={{
            width:"100%", background:T.bg, border:`1.5px solid ${T.border}`, borderRadius:12,
            padding:"11px 14px", fontSize:14, color:T.text, fontFamily:"inherit", outline:"none", fontWeight:600,
          }}>
            <option value="none">Doesn't repeat</option>
            <option value="daily">Every day</option>
            <option value="weekly">Every week</option>
            <option value="monthly">Every month</option>
            <option value="yearly">Every year</option>
          </select>
        </Card>

        {/* Description */}
        <Card>
          <SectionLabel>Description (optional)</SectionLabel>
          <textarea placeholder="Add details…" rows={3} style={{
            width:"100%", boxSizing:"border-box", background:T.bg,
            border:`2px solid ${T.border}`, borderRadius:12, padding:"11px 14px",
            fontSize:13, color:T.text, fontFamily:"inherit", outline:"none", resize:"none", lineHeight:1.5,
          }}/>
        </Card>

        <Btn label="Save event" onPress={() => setSaved(true)} style={{ width:"100%" }}/>
      </div>
    </div>
  );
}

// ── Screen: Calendar ─────────────────────────────────────────────────────────

function CalendarScreen({ onEventTap, onCreateEvent }) {
  const [month, setMonth] = React.useState(4);
  const [year]  = React.useState(2026);
  const [activeFilter, setActiveFilter] = React.useState(null);
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const days    = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);
  const filtered = activeFilter ? EVENTS.filter(e => e.groupId === activeFilter) : EVENTS;
  const upcoming = filtered.filter(e => e.startUtc.getMonth() === month).sort((a,b) => a.startUtc - b.startUtc);

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* Header */}
      <div style={{ padding:"64px 18px 10px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <div style={{ fontSize:24, fontWeight:900, color:T.text, letterSpacing:"-0.5px" }}>
          Decssy<span style={{ color:T.accent }}>.</span>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <Avatar name="Marvin" color={T.accent} size={34}/>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ flexShrink:0, display:"flex", gap:6, padding:"0 18px 12px", flexWrap:"wrap" }}>
          {GROUPS.map(g => (
            <button key={g.id} onClick={() => setActiveFilter(activeFilter === g.id ? null : g.id)} style={{
              display:"flex", alignItems:"center", gap:5, padding:"5px 12px",
              borderRadius:999, fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap",
              border:`1.5px solid ${activeFilter === g.id ? g.color : T.border}`,
              background: activeFilter === g.id ? `${g.color}18` : T.surface,
              color: activeFilter === g.id ? g.color : T.textMuted, transition:"all 0.18s",
            }}>
              <Dot color={g.color} size={7}/>{g.name}
            </button>
          ))}
      </div>

      {/* Scrollable content below chips */}
      <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column" }}>

      {/* Month nav */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 18px 10px" }}>
        <button onClick={() => setMonth(m => m > 0 ? m-1 : 11)} style={{
          width:34, height:34, borderRadius:"50%", background:T.surface,
          border:`1.5px solid ${T.border}`, color:T.textMuted, fontSize:18,
          cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:T.shadow,
          flexShrink:0,
        }}>‹</button>
        <div style={{ fontSize:16, fontWeight:900, color:T.text, whiteSpace:"nowrap" }}>{monthNames[month]} {year}</div>
        <button onClick={() => setMonth(m => m < 11 ? m+1 : 0)} style={{
          width:34, height:34, borderRadius:"50%", background:T.surface,
          border:`1.5px solid ${T.border}`, color:T.textMuted, fontSize:18,
          cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:T.shadow,
          flexShrink:0,
        }}>›</button>
      </div>

      {/* Calendar grid */}
      <div style={{ background:T.surface, margin:"0 12px", borderRadius:24, padding:"10px 8px 14px", boxShadow:T.shadow, marginBottom:16 }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:6 }}>
          {["S","M","T","W","T","F","S"].map((d,i) => (
            <div key={i} style={{ textAlign:"center", fontSize:11, fontWeight:800, color:T.textMuted }}>{d}</div>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"3px 0" }}>
          {Array.from({ length:firstDay }).map((_,i) => <div key={`e${i}`}/>)}
          {Array.from({ length:days }).map((_,i) => {
            const d = i+1;
            const evs = eventsOnDay(d, month, year).filter(e => !activeFilter || e.groupId === activeFilter);
            const isToday = d === 7 && month === 4 && year === 2026;
            return (
              <div key={d} style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"2px 0" }}>
                <div style={{
                  width:30, height:30, borderRadius:"50%",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:13, fontWeight: isToday ? 900 : 500,
                  background: isToday ? T.accent : "transparent",
                  color: isToday ? "white" : T.text,
                }}>{d}</div>
                <div style={{ display:"flex", gap:2, marginTop:2, height:6 }}>
                  {evs.slice(0,3).map((e,ei) => <Dot key={ei} color={groupById(e.groupId).color} size={5}/>)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming */}
      <div style={{ padding:"0 18px", marginBottom:12 }}><SectionLabel>Upcoming</SectionLabel></div>
      <div style={{ display:"flex", flexDirection:"column", gap:10, padding:"0 12px", paddingBottom:100 }}>
        {upcoming.length === 0 && (
          <div style={{ textAlign:"center", padding:"32px 0", color:T.textMuted, fontSize:14 }}>
            No events this month.<br/>
            <span style={{ color:T.accent, fontWeight:700, cursor:"pointer" }} onClick={onCreateEvent}>Create one →</span>
          </div>
        )}
        {upcoming.map(e => {
          const g = groupById(e.groupId);
          return (
            <Card key={e.id} onClick={() => onEventTap(e)} style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:4, alignSelf:"stretch", borderRadius:999, background:g.color, flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:800, color:T.text }}>{e.title}</div>
                <div style={{ fontSize:12, color:T.textMuted, marginTop:2 }}>
                  {e.isAllDay ? `${fmtDate(e.startUtc)} · All day` : `${fmtDate(e.startUtc)} · ${fmtTime(e.startUtc)}`}
                </div>
                <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>
                  {e.type === "group_shared" ? "Group event" : `${e.attendees.filter(a=>a.status==="attending").length} attending`}
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <Dot color={g.color} size={7}/>
                <span style={{ fontSize:11, color:T.textMuted }}>{g.name}</span>
              </div>
            </Card>
          );
        })}
      </div>

      </div>{/* end scrollable content */}

      {/* FAB */}
      <button onClick={onCreateEvent} style={{
        position:"absolute", bottom:88, right:16,
        width:52, height:52, borderRadius:"50%",
        background:T.accent, border:"none", color:"white",
        fontSize:26, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
        boxShadow:"0 6px 24px rgba(232,112,74,0.4)", zIndex:15,
      }}>+</button>
    </div>
  );
}

// ── Screen: Groups ────────────────────────────────────────────────────────────

function GroupsScreen({ navigate }) {
  return (
    <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"64px 18px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ fontSize:24, fontWeight:900, color:T.text }}>Groups<span style={{ color:T.accent }}>.</span></div>
        <button onClick={() => navigate("group-create")} style={{
          background:T.accent, border:"none", borderRadius:14, padding:"8px 16px",
          color:"white", fontSize:13, fontWeight:800, cursor:"pointer", boxShadow:"0 4px 16px rgba(232,112,74,0.3)",
        }}>+ New</button>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10, padding:"0 12px", paddingBottom:100 }}>
        {GROUPS.map(g => {
          const nextEvent = EVENTS.filter(e => e.groupId === g.id).sort((a,b) => a.startUtc - b.startUtc)[0];
          return (
            <Card key={g.id} onClick={() => navigate("group-detail", { groupId:g.id })} style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{
                width:48, height:48, borderRadius:16, background:`${g.color}18`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:22, fontWeight:900, color:g.color, flexShrink:0,
              }}>{g.name[0]}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15, fontWeight:800, color:T.text }}>{g.name}</div>
                <div style={{ fontSize:12, color:T.textMuted, marginTop:2 }}>{g.members} members</div>
                {nextEvent && (
                  <div style={{ fontSize:11, color:T.accent, marginTop:3, fontWeight:700 }}>
                    Next: {nextEvent.title}, {fmtDate(nextEvent.startUtc)}
                  </div>
                )}
              </div>
              <span style={{ fontSize:18, color:T.textMuted }}>›</span>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── Screen: Group Detail ──────────────────────────────────────────────────────

function GroupDetailScreen({ groupId, navigate, onBack }) {
  const g = groupById(groupId);
  const members = MEMBERS[groupId] || MEMBERS.g1;
  const [showHistory, setShowHistory] = React.useState(false);

  return (
    <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <div style={{ padding:"56px 18px 14px", display:"flex", alignItems:"center", gap:10 }}>
        <BackBtn onPress={onBack}/>
        <div style={{ flex:1, fontSize:17, fontWeight:900, color:T.text }}>{g.name}</div>
        <button style={{
          width:34, height:34, borderRadius:"50%", background:T.surface,
          border:`1.5px solid ${T.border}`, color:T.textMuted, cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:16,
        }}>⋯</button>
      </div>

      <div style={{ padding:"0 18px", display:"flex", flexDirection:"column", gap:14, paddingBottom:100 }}>
        {/* Group card */}
        <Card style={{ padding:"18px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
            <div style={{
              width:52, height:52, borderRadius:18, background:`${g.color}18`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:26, fontWeight:900, color:g.color,
            }}>{g.name[0]}</div>
            <div>
              <div style={{ fontSize:18, fontWeight:900, color:T.text }}>{g.name}</div>
              <div style={{ fontSize:13, color:T.textMuted }}>{g.description}</div>
              <div style={{ fontSize:12, color:T.textMuted, marginTop:2 }}>{members.length} members · You're the owner</div>
            </div>
          </div>
          <button onClick={() => navigate("invite", { groupId })} style={{
            width:"100%", background:T.accent, border:"none", borderRadius:14,
            padding:"13px", color:"white", fontSize:14, fontWeight:800, cursor:"pointer",
            boxShadow:"0 4px 16px rgba(232,112,74,0.3)",
          }}>📤 Invite people</button>
        </Card>

        {/* Members */}
        <Card>
          <SectionLabel>Members ({members.length})</SectionLabel>
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            {members.map((m, i) => (
              <div key={m.id}>
                <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0" }}>
                  <Avatar name={m.name} color={g.color}/>
                  <div style={{ flex:1 }}>
                    <span style={{ fontSize:14, fontWeight:700, color:T.text }}>{m.name}{m.you ? " (you)" : ""}</span>
                    {m.role === "owner" && (
                      <span style={{ marginLeft:8, fontSize:11, background:T.accentSoft, color:T.accent, borderRadius:999, padding:"2px 8px", fontWeight:800 }}>owner</span>
                    )}
                  </div>
                  {m.joined && <span style={{ fontSize:11, color:T.textMuted }}>{m.joined}</span>}
                </div>
                {i < members.length - 1 && <Divider/>}
              </div>
            ))}
          </div>
        </Card>

        {/* History */}
        <Card>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer" }} onClick={() => setShowHistory(v => !v)}>
            <SectionLabel>History</SectionLabel>
            <span style={{ fontSize:14, color:T.textMuted, marginTop:-8 }}>{showHistory ? "▲" : "▼"}</span>
          </div>
          {showHistory && (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {AUDIT_LOG.map((a, i) => (
                <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:T.accent, marginTop:5, flexShrink:0 }}/>
                  <div style={{ flex:1 }}>
                    <span style={{ fontSize:13, color:T.text, fontWeight:600 }}>
                      {a.action === "created" ? `Group created by ${a.actor}` :
                       a.action === "member_joined" ? `${a.actor} joined` :
                       a.action === "ownership_transferred" ? `Ownership transferred to ${a.actor}` : a.action}
                    </span>
                    <div style={{ fontSize:11, color:T.textMuted, marginTop:1 }}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Danger zone */}
        <Card>
          <SectionLabel>Danger zone</SectionLabel>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <button style={{ width:"100%", background:"transparent", border:`1.5px solid ${T.border}`, borderRadius:12, padding:"11px", fontSize:13, fontWeight:800, color:T.textMuted, cursor:"pointer", textAlign:"left" }}>
              Transfer ownership
            </button>
            <button style={{ width:"100%", background:"transparent", border:`1.5px solid ${T.negative}`, borderRadius:12, padding:"11px", fontSize:13, fontWeight:800, color:T.negative, cursor:"pointer", textAlign:"left" }}>
              Delete group
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Screen: Invite QR ─────────────────────────────────────────────────────────

function InviteScreen({ groupId, onBack }) {
  const g = groupById(groupId);
  const [copied, setCopied] = React.useState(false);

  function copy() {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"56px 18px 20px", display:"flex", alignItems:"center", gap:12 }}>
        <BackBtn onPress={onBack}/>
        <div style={{ fontSize:17, fontWeight:900, color:T.text }}>{g.name} · Invite</div>
      </div>
      <div style={{ padding:"0 18px", display:"flex", flexDirection:"column", gap:16, paddingBottom:100 }}>
        {/* QR */}
        <Card style={{ alignItems:"center", display:"flex", flexDirection:"column", padding:24 }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.textMuted, marginBottom:16 }}>Scan to join {g.name}</div>
          <div style={{
            background:"white", borderRadius:16, padding:16,
            boxShadow:T.shadow, border:`1px solid ${T.border}`,
          }}>
            <svg width={160} height={160} viewBox="0 0 21 19" style={{ imageRendering:"pixelated", display:"block" }}>
              {[
                [1,1,1,1,1,1,1,0,1,1,0,0,1,0,1,1,1,1,1,1,1],
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
                [1,1,1,1,1,1,1,0,1,0,1,0,0,0,1,1,0,0,1,1,0],
              ].map((row,y) => row.map((cell,x) =>
                cell ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={T.text}/> : null
              ))}
            </svg>
          </div>
          <div style={{
            marginTop:14, display:"flex", alignItems:"center", gap:8, width:"100%",
            background:T.bg, border:`1.5px solid ${T.border}`, borderRadius:12, padding:"10px 14px",
          }}>
            <span style={{ flex:1, fontSize:13, color:T.text, fontWeight:600 }}>decssy.app/join/abc123XYZ</span>
            <button onClick={copy} style={{
              background: copied ? T.positive : T.accent, border:"none", borderRadius:10,
              padding:"6px 12px", fontSize:12, fontWeight:800, color:"white", cursor:"pointer", transition:"background 0.2s",
            }}>{copied ? "Copied!" : "Copy"}</button>
          </div>
        </Card>

        <button style={{
          width:"100%", background:T.accent, border:"none", borderRadius:16,
          padding:"14px", color:"white", fontSize:14, fontWeight:800, cursor:"pointer",
          boxShadow:"0 6px 20px rgba(232,112,74,0.3)",
        }}>📤 Share via…</button>

        <div style={{ textAlign:"center", fontSize:12, color:T.textMuted, fontWeight:600 }}>
          Expires in 7 days · 0 of ∞ uses
        </div>

        <button style={{
          width:"100%", background:"transparent", border:`2px solid ${T.negative}`,
          borderRadius:14, padding:"11px", color:T.negative, fontSize:13, fontWeight:800, cursor:"pointer",
        }}>Revoke this invite</button>
      </div>
    </div>
  );
}

// ── Screen: Group Create ──────────────────────────────────────────────────────

function GroupCreateScreen({ onBack }) {
  const colors = ["#10B981","#6366F1","#F59E0B","#EF4444","#EC4899","#06B6D4","#8B5CF6","#84CC16"];
  const [name, setName] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [color, setColor] = React.useState("#10B981");
  const [saved, setSaved] = React.useState(false);

  if (saved) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flex:1, padding:32, gap:16, textAlign:"center" }}>
        <div style={{ width:72, height:72, borderRadius:22, background:`${color}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, fontWeight:900, color }}>{name[0] || "G"}</div>
        <div style={{ fontSize:22, fontWeight:900, color:T.text }}>Group created!</div>
        <div style={{ fontSize:14, color:T.textMuted }}>Invite people with a QR code or link.</div>
        <Btn label="Back to groups" onPress={onBack} style={{ marginTop:12, width:"100%" }}/>
      </div>
    );
  }

  return (
    <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"56px 18px 20px", display:"flex", alignItems:"center", gap:12 }}>
        <BackBtn onPress={onBack}/>
        <div style={{ flex:1, fontSize:17, fontWeight:900, color:T.text }}>New group</div>
      </div>
      <div style={{ padding:"0 18px", display:"flex", flexDirection:"column", gap:14, paddingBottom:32 }}>
        {/* Color + name preview */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"20px 0" }}>
          <div style={{
            width:72, height:72, borderRadius:22, background:`${color}22`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:32, fontWeight:900, color, marginBottom:4,
          }}>{name[0] || "G"}</div>
        </div>

        <Card>
          <SectionLabel>Group name</SectionLabel>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Family, Gym Buddies…" style={{
              width:"100%", boxSizing:"border-box", background:T.bg,
              border:`2px solid ${T.border}`, borderRadius:12, padding:"11px 14px",
              fontSize:15, color:T.text, fontFamily:"inherit", outline:"none", fontWeight:700,
            }}/>
        </Card>

        <Card>
          <SectionLabel>Description (optional)</SectionLabel>
          <input value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="What's this group for?" style={{
              width:"100%", boxSizing:"border-box", background:T.bg,
              border:`2px solid ${T.border}`, borderRadius:12, padding:"11px 14px",
              fontSize:14, color:T.text, fontFamily:"inherit", outline:"none",
            }}/>
        </Card>

        <Card>
          <SectionLabel>Color</SectionLabel>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {colors.map(c => (
              <div key={c} onClick={() => setColor(c)} style={{
                width:36, height:36, borderRadius:10, background:c, cursor:"pointer",
                border:`3px solid ${color === c ? T.text : "transparent"}`,
                transition:"border 0.15s", boxShadow: color === c ? `0 0 0 2px white inset` : "none",
              }}/>
            ))}
          </div>
        </Card>

        <Btn label={name ? `Create "${name}"` : "Create group"} onPress={() => name && setSaved(true)} style={{ width:"100%", opacity: name ? 1 : 0.5 }}/>
      </div>
    </div>
  );
}

// ── Screen: Find Free Day ─────────────────────────────────────────────────────

function FindScreen({ navigate }) {
  const [searched, setSearched] = React.useState(false);
  const [group, setGroup] = React.useState("g1");
  const [loading, setLoading] = React.useState(false);

  function search() {
    setLoading(true);
    setTimeout(() => { setLoading(false); setSearched(true); }, 800);
  }

  const g = groupById(group);

  return (
    <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"64px 18px 16px" }}>
        <div style={{ fontSize:24, fontWeight:900, color:T.text, marginBottom:4 }}>Find a Free Day<span style={{ color:T.accent }}>.</span></div>
        <div style={{ fontSize:13, color:T.textMuted }}>See when everyone's available.</div>
      </div>
      <div style={{ padding:"0 18px", display:"flex", flexDirection:"column", gap:14, paddingBottom:100 }}>
        <Card>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <SectionLabel>Group</SectionLabel>
              <select value={group} onChange={e => setGroup(e.target.value)} style={{
                width:"100%", background:T.bg, border:`2px solid ${T.border}`, borderRadius:12,
                padding:"11px 14px", fontSize:14, color:T.text, fontFamily:"inherit", outline:"none", fontWeight:700,
              }}>
                {GROUPS.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <SectionLabel>Between</SectionLabel>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <div style={{ flex:1, background:T.bg, border:`2px solid ${T.border}`, borderRadius:12, padding:"11px 14px", fontSize:13, color:T.text, fontWeight:600 }}>May 10</div>
                <span style={{ color:T.accent, fontWeight:900 }}>→</span>
                <div style={{ flex:1, background:T.bg, border:`2px solid ${T.border}`, borderRadius:12, padding:"11px 14px", fontSize:13, color:T.text, fontWeight:600 }}>May 24</div>
              </div>
            </div>
            <div>
              <SectionLabel>Duration</SectionLabel>
              <select style={{ width:"100%", background:T.bg, border:`2px solid ${T.border}`, borderRadius:12, padding:"11px 14px", fontSize:14, color:T.text, fontFamily:"inherit", outline:"none", fontWeight:600 }}>
                <option>All day</option>
                <option selected>2 hours</option>
                <option>3 hours</option>
                <option>4 hours</option>
              </select>
            </div>
            <div>
              <SectionLabel>Time of day</SectionLabel>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {[
                  { label:"Morning (8am – 12pm)", checked:false },
                  { label:"Afternoon (12 – 5pm)", checked:true  },
                  { label:"Evening (5 – 10pm)",   checked:true  },
                ].map((opt, i) => (
                  <label key={i} style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
                    <div style={{
                      width:20, height:20, borderRadius:6,
                      background: opt.checked ? T.accent : T.bg,
                      border:`2px solid ${opt.checked ? T.accent : T.border}`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:12, color:"white", flexShrink:0,
                    }}>{opt.checked ? "✓" : ""}</div>
                    <span style={{ fontSize:13, color:T.text, fontWeight:600 }}>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <SectionLabel>Include people</SectionLabel>
              <span style={{ fontSize:12, color:T.accent, fontWeight:800, cursor:"pointer", marginTop:-8 }}>
                {(MEMBERS[group] || MEMBERS.g1).length} of {(MEMBERS[group] || MEMBERS.g1).length} ✏
              </span>
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {(MEMBERS[group] || MEMBERS.g1).slice(0,5).map((m,i) => (
                <div key={i} style={{
                  display:"flex", alignItems:"center", gap:5, padding:"4px 10px",
                  borderRadius:999, background:T.accentSoft, border:`1px solid ${T.border}`,
                }}>
                  <Avatar name={m.name} color={g.color} size={18}/>
                  <span style={{ fontSize:11, fontWeight:700, color:T.text }}>{m.name}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <button onClick={search} disabled={loading} style={{
          background: loading ? T.textMuted : T.accent, border:"none", borderRadius:16,
          padding:"15px", color:"white", fontSize:15, fontWeight:800, cursor: loading ? "wait" : "pointer",
          boxShadow: loading ? "none" : "0 6px 24px rgba(232,112,74,0.35)", transition:"all 0.2s",
        }}>
          {loading ? "Finding times…" : "Find times"}
        </button>

        {searched && (
          <>
            <div style={{ marginTop:4 }}><SectionLabel>Results ({FIND_FREE_RESULTS.length} slots)</SectionLabel></div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {FIND_FREE_RESULTS.map((r, i) => (
                <Card key={i} style={{ border:`1.5px solid ${r.busy.length === 0 ? T.accent : T.border}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                    <div>
                      <div style={{ fontSize:15, fontWeight:800, color:T.text }}>{r.date}</div>
                      <div style={{ fontSize:13, color:T.textMuted, marginTop:1 }}>{r.time}</div>
                    </div>
                    {r.busy.length === 0 && (
                      <span style={{ background:T.accentSoft, color:T.accent, borderRadius:999, padding:"3px 10px", fontSize:11, fontWeight:800 }}>✨ All free</span>
                    )}
                  </div>
                  <div style={{ fontSize:12, color: r.busy.length === 0 ? T.positive : T.textMuted, fontWeight:700, marginBottom: r.busy.length === 0 ? 10 : 0 }}>
                    {r.busy.length === 0 ? `All ${r.freeCount} members free` : `${r.freeCount} of ${r.total} free · ${r.busy.join(", ")} busy`}
                  </div>
                  {r.busy.length === 0 && (
                    <button onClick={() => navigate("event-create", {
                      type:"group_shared", groupId:group,
                      date: r.date, startTime: r.time.split("–")[0].trim(), endTime: r.time.split("–")[1].trim(),
                    })} style={{
                      background:"transparent", border:`2px solid ${T.accent}`,
                      borderRadius:10, padding:"7px 14px", color:T.accent,
                      fontSize:12, fontWeight:800, cursor:"pointer",
                    }}>Create event from slot →</button>
                  )}
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Screen: Inbox ─────────────────────────────────────────────────────────────

function InboxScreen() {
  const [notes, setNotes] = React.useState(NOTIFICATIONS);
  const unread = notes.filter(n => !n.read).length;

  return (
    <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"64px 18px 14px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ fontSize:24, fontWeight:900, color:T.text }}>Inbox<span style={{ color:T.accent }}>.</span></div>
        {unread > 0 && (
          <button onClick={() => setNotes(n => n.map(x => ({ ...x, read:true })))} style={{
            background:T.accentSoft, border:"none", borderRadius:999, padding:"5px 14px",
            color:T.accent, fontSize:12, fontWeight:800, cursor:"pointer",
          }}>Mark all read</button>
        )}
      </div>

      {[
        { label:"Today",     items: notes.filter(n => !n.read) },
        { label:"Earlier",   items: notes.filter(n => n.read) },
      ].map(section => {
        if (!section.items.length) return null;
        return (
          <div key={section.label} style={{ marginBottom:8 }}>
            <div style={{ padding:"4px 18px 8px", fontSize:11, fontWeight:800, color:T.textMuted, textTransform:"uppercase", letterSpacing:1.2 }}>{section.label}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8, padding:"0 12px" }}>
              {section.items.map(n => {
                const g = groupById(n.groupId);
                return (
                  <Card key={n.id} style={{
                    border:`1.5px solid ${!n.read ? T.accent : T.border}`,
                    display:"flex", alignItems:"flex-start", gap:10,
                    background: !n.read ? `${T.accent}06` : T.surface,
                  }}>
                    <div style={{
                      width:36, height:36, borderRadius:12, background:T.accentSoft,
                      display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0,
                    }}>{notifIcon(n.type)}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:n.read ? 600 : 800, color:T.text, lineHeight:1.4 }}>{n.text}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:5 }}>
                        <Dot color={g.color} size={6}/>
                        <span style={{ fontSize:11, color:T.textMuted, fontWeight:600 }}>{g.name} · {n.time}</span>
                      </div>
                    </div>
                    {!n.read && <div style={{ width:8, height:8, borderRadius:"50%", background:T.accent, marginTop:4, flexShrink:0 }}/>}
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {notes.every(n => n.read) && (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"48px 32px", textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🎉</div>
          <div style={{ fontSize:16, fontWeight:800, color:T.text, marginBottom:6 }}>All caught up!</div>
          <div style={{ fontSize:13, color:T.textMuted }}>No new notifications.</div>
        </div>
      )}
    </div>
  );
}

// ── Screen: Invite Landing (public) ──────────────────────────────────────────

function InviteLandingScreen({ onJoin }) {
  const g = GROUPS[0];
  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      height:"100%", padding:"32px 28px", textAlign:"center", background:T.bg,
    }}>
      <div style={{ fontSize:32, fontWeight:900, color:T.text, marginBottom:4 }}>
        Decssy<span style={{ color:T.accent }}>.</span>
      </div>
      <div style={{ fontSize:14, color:T.textMuted, marginBottom:40 }}>Your shared group calendar</div>

      <div style={{ fontSize:16, color:T.textMuted, marginBottom:20, fontWeight:600 }}>You've been invited to</div>

      <Card style={{ width:"100%", alignItems:"center", display:"flex", flexDirection:"column", padding:"24px 20px", marginBottom:32 }}>
        <div style={{
          width:60, height:60, borderRadius:18, background:`${g.color}18`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:26, fontWeight:900, color:g.color, marginBottom:10,
        }}>{g.name[0]}</div>
        <div style={{ fontSize:20, fontWeight:900, color:T.text, marginBottom:4 }}>{g.name}</div>
        <div style={{ fontSize:13, color:T.textMuted }}>7 members · Created by Marvin</div>
        <div style={{ marginTop:12, display:"flex", gap:6 }}>
          {MEMBERS.g1.slice(0,5).map((m,i) => (
            <Avatar key={i} name={m.name} color={g.color} size={28}/>
          ))}
        </div>
      </Card>

      <Btn label="Sign in to join the group" onPress={onJoin} style={{ width:"100%", marginBottom:16 }}/>
      <div style={{ fontSize:13, color:T.textMuted, lineHeight:1.6 }}>
        New to Decssy? You'll create your<br/>account and join in one step.
      </div>
      <div style={{ marginTop:20, fontSize:12, color:T.textMuted, fontWeight:600 }}>
        🕐 Invite expires in 5 days
      </div>
    </div>
  );
}

// ── Root App ─────────────────────────────────────────────────────────────────

function DecssyApp({ accentColor, fontChoice, showInviteLanding }) {
  const [tab,         setTab]         = React.useState("cal");
  const [screen,      setScreen]      = React.useState(null);
  const [screenProps, setScreenProps] = React.useState({});
  const [activeEvent, setActiveEvent] = React.useState(null);
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  // Compute derived theme values from props (don't mutate shared T)
  // Synchronously update shared T so all children read the new values
  if (accentColor) { T.accent = accentColor; T.accentSoft = accentColor + '20'; }

  function navigate(s, props = {}) {
    setScreen(s);
    setScreenProps(props);
  }
  function goBack() {
    setScreen(null);
    setScreenProps({});
  }

  const unreadCount = NOTIFICATIONS.filter(n => !n.read).length;

  // Full-screen stacked screens (no bottom nav)
  if (showInviteLanding) {
    return (
      <div style={{ width:"100%", height:"100%", position:"relative", overflow:"hidden", fontFamily: fontChoice || "'Nunito',sans-serif" }}>
        <InviteLandingScreen onJoin={() => setShowOnboarding(true)}/>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <div style={{ width:"100%", height:"100%", position:"relative", overflow:"hidden", fontFamily: fontChoice || "'Nunito',sans-serif" }}>
        <OnboardingScreen onDone={() => setShowOnboarding(false)}/>
      </div>
    );
  }

  if (screen === "event-detail" && activeEvent) {
    return (
      <div style={{ width:"100%", height:"100%", position:"relative", overflow:"hidden", fontFamily: fontChoice || "'Nunito',sans-serif", background:T.bg }}>
        <CalendarScreen onEventTap={() => {}} onCreateEvent={() => navigate("event-create")}/>
        <EventDetailSheet
          event={activeEvent}
          onClose={goBack}
          onEdit={() => navigate("event-create", { ...activeEvent })}
        />
      </div>
    );
  }

  if (screen === "event-create") {
    return (
      <div style={{ width:"100%", height:"100%", position:"relative", overflow:"hidden", fontFamily: fontChoice || "'Nunito',sans-serif", background:T.bg, display:"flex", flexDirection:"column" }}>
        <EventCreateScreen onBack={goBack} prefill={screenProps}/>
      </div>
    );
  }

  if (screen === "group-detail") {
    return (
      <div style={{ width:"100%", height:"100%", position:"relative", overflow:"hidden", fontFamily: fontChoice || "'Nunito',sans-serif", background:T.bg, display:"flex", flexDirection:"column" }}>
        <GroupDetailScreen groupId={screenProps.groupId} navigate={navigate} onBack={goBack}/>
      </div>
    );
  }

  if (screen === "invite") {
    return (
      <div style={{ width:"100%", height:"100%", position:"relative", overflow:"hidden", fontFamily: fontChoice || "'Nunito',sans-serif", background:T.bg, display:"flex", flexDirection:"column" }}>
        <InviteScreen groupId={screenProps.groupId} onBack={goBack}/>
      </div>
    );
  }

  if (screen === "group-create") {
    return (
      <div style={{ width:"100%", height:"100%", position:"relative", overflow:"hidden", fontFamily: fontChoice || "'Nunito',sans-serif", background:T.bg, display:"flex", flexDirection:"column" }}>
        <GroupCreateScreen onBack={goBack}/>
      </div>
    );
  }

  if (screen === "invite-landing") {
    return (
      <div style={{ width:"100%", height:"100%", position:"relative", overflow:"hidden", fontFamily: fontChoice || "'Nunito',sans-serif" }}>
        <InviteLandingScreen onJoin={() => setShowOnboarding(true)}/>
      </div>
    );
  }

  // Main tab view
  return (
    <div style={{
      width:"100%", height:"100%", background:T.bg,
      fontFamily: fontChoice || "'Nunito',sans-serif",
      display:"flex", flexDirection:"column",
      position:"relative", overflow:"hidden",
    }}>
      {tab === "cal" && (
        <CalendarScreen
          onEventTap={e => { setActiveEvent(e); navigate("event-detail"); }}
          onCreateEvent={() => navigate("event-create")}
        />
      )}
      {tab === "groups" && <GroupsScreen navigate={navigate}/>}
      {tab === "find"   && <FindScreen navigate={navigate}/>}
      {tab === "inbox"  && <InboxScreen/>}
      <BottomNav tab={tab} setTab={t => { setTab(t); setScreen(null); }} unreadCount={unreadCount}/>
    </div>
  );
}

Object.assign(window, { DecssyApp });
