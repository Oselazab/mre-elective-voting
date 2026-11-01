const OWNER="Oselazab",REPO="mre-elective-voting",CLOSED=new Set(["eep-456","cse-426"]);let courses=[],counts=new Map(),query="",sort="votes";
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function voteUrl(c){return "https://github.com/"+OWNER+"/"+REPO+"/issues/new?template=elective-vote.md&title="+encodeURIComponent("Vote: "+c.code+" — "+c.title)+"&labels=elective-vote"}
function render(){
 let list=courses.filter(c=>(c.code+" "+c.title).toLowerCase().includes(query));
 list.sort((a,b)=>sort==="name"?a.title.localeCompare(b.title):sort==="code"?a.code.localeCompare(b.code):(Number(counts.get(b.id)||0)-Number(counts.get(a.id)||0))||a.code.localeCompare(b.code));
 $("#count").textContent=list.length+" course"+(list.length===1?"":"s");
 $("#community").textContent=[...counts.values()].reduce((a,b)=>a+b,0);
 $("#courses").innerHTML=list.map(c=>{const closed=CLOSED.has(c.id),n=counts.get(c.id)||0;const action=closed?'<span class="vote-btn closed">Closed</span>':'<a class="vote-btn" href="'+voteUrl(c)+'" target="_blank" rel="noreferrer">Vote on GitHub ↗</a>';return '<article class="course '+(closed?'is-closed':'')+'"><div class="course-top"><span class="code">'+esc(c.code)+'</span><span class="badge">'+(closed?'Already selected':'Official elective')+'</span></div><h3>'+esc(c.title)+'</h3><div class="meta">'+(closed?'Previously voted · closed to new ballots':'2020 MRE bylaws')+'</div><div class="course-bottom"><div class="vote-count"><span>↗</span>'+n+' vote'+(n===1?'':'s')+'</div>'+action+'</div></article>'}).join("")
}
async function loadVotes(){
 const voters=new Map();let page=1,more=true;
 while(more&&page<=10){
  const url="https://api.github.com/repos/"+OWNER+"/"+REPO+"/issues?state=all&labels=elective-vote&per_page=100&page="+page;
  const response=await fetch(url,{headers:{Accept:"application/vnd.github+json"}});
  if(!response.ok)throw Error(response.status===403?"GitHub public API rate limit reached. Try refreshing later.":"Could not load vote totals from GitHub.");
  const issues=await response.json();
  for(const issue of issues){if(issue.pull_request||(issue.labels||[]).some(label=>label.name==="duplicate-vote"))continue;const match=(issue.title||"").match(/^Vote:\s*([A-Z]{3}\s\d{3})\b/i);if(!match||!issue.user?.login)continue;const course=courses.find(item=>item.code.toLowerCase()===match[1].toLowerCase());if(!course||CLOSED.has(course.id))continue;if(!voters.has(course.id))voters.set(course.id,new Set());voters.get(course.id).add(issue.user.login.toLowerCase())}
  more=issues.length===100;page++
 }
 counts=new Map([...voters].map(([id,set])=>[id,set.size]));$("#status").textContent="Vote totals updated from GitHub.";render()
}
async function init(){try{const response=await fetch("courses.json");if(!response.ok)throw Error("Could not load the course list.");courses=await response.json();render();await loadVotes()}catch(error){$("#status").textContent=error.message||"Could not load course data.";if(!courses.length)$("#courses").innerHTML='<div class="loading">Please refresh the page to try again.</div>'}}
$("#search").addEventListener("input",event=>{query=event.target.value.trim().toLowerCase();render()});$("#sort").addEventListener("change",event=>{sort=event.target.value;render()});init();
