// Decssy — shared data + helpers for the full prototype

const GROUPS = [
  { id: "g1", name: "Family",      color: "#10B981", members: 7,  description: "Our family group" },
  { id: "g2", name: "Gym Buddies", color: "#6366F1", members: 4,  description: "Early morning crew" },
  { id: "g3", name: "Work Team",   color: "#F59E0B", members: 10, description: "Daily standups + offsites" },
  { id: "g4", name: "Soccer",      color: "#EF4444", members: 12, description: "Sunday league" },
];

const MEMBERS = {
  g1: [
    { id:"u1", name:"Marvin",  you:true,  role:"owner",  joined:"" },
    { id:"u2", name:"Anna",    you:false, role:"member", joined:"Mar 12" },
    { id:"u3", name:"Ben",     you:false, role:"member", joined:"Mar 12" },
    { id:"u4", name:"Cara",    you:false, role:"member", joined:"Mar 14" },
    { id:"u5", name:"Dylan",   you:false, role:"member", joined:"Apr 2" },
    { id:"u6", name:"Mom",     you:false, role:"member", joined:"Mar 1" },
    { id:"u7", name:"Dad",     you:false, role:"member", joined:"Mar 1" },
  ],
  g2: [
    { id:"u1", name:"Marvin",  you:true,  role:"owner",  joined:"" },
    { id:"u3", name:"Ben",     you:false, role:"member", joined:"Feb 8" },
    { id:"u4", name:"Cara",    you:false, role:"member", joined:"Feb 8" },
    { id:"u8", name:"Jake",    you:false, role:"member", joined:"Mar 20" },
  ],
  g3: [
    { id:"u1", name:"Marvin",  you:true,  role:"member", joined:"Jan 15" },
    { id:"u2", name:"Anna",    you:false, role:"owner",  joined:"Jan 15" },
  ],
  g4: [
    { id:"u1", name:"Marvin",  you:true,  role:"member", joined:"Apr 5" },
    { id:"u3", name:"Ben",     you:false, role:"member", joined:"Apr 5" },
  ],
};

const EVENTS = [
  {
    id:"e1", groupId:"g1", title:"Movie Night",
    type:"personal_shared", isAllDay:false,
    startUtc: new Date(2026,4,9,19,0), endUtc: new Date(2026,4,9,22,0),
    by:"Marvin", byId:"u1", description:"At Marcus's place — bring snacks!",
    attendees:[
      {name:"Marvin",status:"attending",you:true},
      {name:"Anna",  status:"attending"},
      {name:"Ben",   status:"attending"},
      {name:"Cara",  status:"attending"},
      {name:"Dylan", status:"maybe"},
    ],
    comments:[
      {author:"Anna",  body:"Should we grab dinner first?", ago:"2h"},
      {author:"Marvin",body:"yeah, 6pm at the diner?",     ago:"1h"},
    ],
  },
  {
    id:"e2", groupId:"g1", title:"Family Brunch",
    type:"group_shared", isAllDay:true,
    startUtc: new Date(2026,4,10), endUtc: new Date(2026,4,10),
    by:"Anna", byId:"u2", description:"Sunday brunch at Mom's. She's making her famous pancakes.",
    attendees:[
      {name:"Marvin",status:"attending",you:true},
      {name:"Anna",  status:"attending"},
      {name:"Ben",   status:"attending"},
      {name:"Cara",  status:"attending"},
      {name:"Mom",   status:"attending"},
      {name:"Dad",   status:"attending"},
    ],
    comments:[],
  },
  {
    id:"e3", groupId:"g2", title:"HIIT Session",
    type:"group_shared", isAllDay:false,
    startUtc: new Date(2026,4,12,6,0), endUtc: new Date(2026,4,12,7,0),
    by:"Ben", byId:"u3", description:"Don't forget water bottle & towel.",
    attendees:[
      {name:"Marvin",status:"attending",you:true},
      {name:"Ben",   status:"attending"},
      {name:"Cara",  status:"maybe"},
      {name:"Jake",  status:"attending"},
    ],
    comments:[],
  },
  {
    id:"e4", groupId:"g3", title:"Standup",
    type:"group_shared", isAllDay:false,
    startUtc: new Date(2026,4,14,9,0), endUtc: new Date(2026,4,14,9,30),
    by:"Anna", byId:"u2", description:"Daily 30-min sync.",
    attendees:[
      {name:"Marvin",status:"attending",you:true},
      {name:"Anna",  status:"attending"},
    ],
    comments:[{author:"Ben",body:"I'll be 5 min late",ago:"4h"}],
  },
  {
    id:"e5", groupId:"g1", title:"Mom's Birthday",
    type:"group_shared", isAllDay:true,
    startUtc: new Date(2026,4,22), endUtc: new Date(2026,4,22),
    by:"Cara", byId:"u4", description:"Don't forget the cake! Surprise party.",
    attendees:[
      {name:"Marvin",status:"attending",you:true},
      {name:"Anna",  status:"attending"},
      {name:"Ben",   status:"attending"},
      {name:"Cara",  status:"attending"},
    ],
    comments:[],
  },
];

const FIND_FREE_RESULTS = [
  { date:"Sat May 9",  time:"2:00 – 4:00 PM", freeCount:4, total:4, busy:[] },
  { date:"Sun May 10", time:"3:00 – 5:00 PM", freeCount:4, total:4, busy:[] },
  { date:"Mon May 11", time:"2:00 – 4:00 PM", freeCount:3, total:4, busy:["Anna"] },
  { date:"Tue May 12", time:"6:00 – 8:00 PM", freeCount:4, total:4, busy:[] },
  { date:"Thu May 14", time:"7:00 – 9:00 PM", freeCount:3, total:4, busy:["Dylan"] },
];

const NOTIFICATIONS = [
  { id:"n1", read:false, type:"rsvp",    text:'Anna RSVP\'d "Going" to Movie Night',    time:"2h ago",    groupId:"g1", eventId:"e1" },
  { id:"n2", read:false, type:"comment", text:'Ben commented on Standup: "I\'ll be 5 min late"', time:"4h ago", groupId:"g3", eventId:"e4" },
  { id:"n3", read:false, type:"join",    text:"Dylan joined Family group",              time:"6h ago",    groupId:"g1" },
  { id:"n4", read:true,  type:"update",  text:"Marvin updated Movie Night time",        time:"Yesterday", groupId:"g1", eventId:"e1" },
  { id:"n5", read:true,  type:"event",   text:"Family Brunch was added by Anna",        time:"2 days ago",groupId:"g1", eventId:"e2" },
  { id:"n6", read:true,  type:"rsvp",    text:'Cara RSVP\'d "Maybe" to HIIT Session',  time:"3 days ago",groupId:"g2", eventId:"e3" },
];

const AUDIT_LOG = [
  { action:"member_joined",  actor:"Dylan",  time:"Apr 2" },
  { action:"member_joined",  actor:"Cara",   time:"Mar 14" },
  { action:"member_joined",  actor:"Anna, Ben", time:"Mar 12" },
  { action:"created",        actor:"Marvin", time:"Mar 1" },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function groupById(id) { return GROUPS.find(g => g.id === id) || GROUPS[0]; }

function fmtDate(d) {
  if (!d) return "";
  const days   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${days[d.getDay()]} ${months[d.getMonth()]} ${d.getDate()}`;
}
function fmtDateLong(d) {
  if (!d) return "";
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
function fmtTime(d) {
  if (!d) return "";
  let h = d.getHours(), m = d.getMinutes(), ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2,"0")} ${ampm}`;
}
function daysInMonth(year, month)  { return new Date(year, month+1, 0).getDate(); }
function firstDayOfMonth(year, month) { return new Date(year, month, 1).getDay(); }
function eventsOnDay(day, month, year) {
  return EVENTS.filter(e => {
    const d = e.startUtc;
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
  });
}
function notifIcon(type) {
  return { rsvp:"✓", comment:"💬", join:"👋", update:"✏️", event:"📅" }[type] || "🔔";
}

Object.assign(window, {
  GROUPS, MEMBERS, EVENTS, FIND_FREE_RESULTS, NOTIFICATIONS, AUDIT_LOG,
  groupById, fmtDate, fmtDateLong, fmtTime,
  daysInMonth, firstDayOfMonth, eventsOnDay, notifIcon,
});
