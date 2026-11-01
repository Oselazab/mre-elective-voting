const VOTE_API_URL="https://script.google.com/macros/s/AKfycbw054r-0FzZAiJCbNnrQor6ddpsk6d6Bfi1OGHtiOU1ekP1bgjXGwBByqkujjqW58TTzw/exec";
const CLOSED=new Set(["eep-456","cse-426"]);
const selected=new Set();
let courses=[],query="",sort="code",pendingRequestId="";
const $=selector=>document.querySelector(selector);
const esc=value=>String(value??"").replace(/[&<>\"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
function updateBallot(){
 const count=selected.size;
 $("#selectedCount").textContent=`${count} / 6 selected`;
 $("#selectedCount").classList.toggle("complete",count===6);
 const picked=courses.filter(course=>selected.has(course.id));
 $("#selectedPreview").innerHTML=picked.length?picked.map(course=>`<span>${esc(course.code)} · ${esc(course.title)}</span>`).join(""):"Your selected courses will appear here.";
 $("#submitVote").disabled=count!==6;
 $("#formStatus").textContent=count===6?"Six choices selected. Add your name and student ID to save.":`Choose ${6-count} more course${6-count===1?"":"s"}.`;
 const heroFoot=document.querySelector(".stat-foot");
 if(heroFoot)heroFoot.textContent=count===6?"Six choices ready to save":`${count} of 6 choices selected`;
 $("#submitVote").textContent=$("#savedVoteState").value==="found"?"Update my saved choices →":"Save my six choices →";
}
function toggleCourse(id){
 if(CLOSED.has(id))return;
 if(selected.has(id))selected.delete(id);
 else if(selected.size<6)selected.add(id);
 else {$("#formStatus").textContent="You can select up to six courses. Remove one to choose another.";return;}
 render();updateBallot();
}
function render(){
 const list=courses.filter(course=>(course.code+" "+course.title+" "+course.description).toLowerCase().includes(query));
 list.sort((a,b)=>sort==="name"?a.title.localeCompare(b.title):a.code.localeCompare(b.code));
 $("#count").textContent=list.length+" course"+(list.length===1?"":"s");
 $("#courses").innerHTML=list.map(course=>{
  const closed=CLOSED.has(course.id),picked=selected.has(course.id);
  const action=closed?'<span class="vote-btn closed">Already selected</span>':`<span class="vote-btn ${picked?"picked":""}">${picked?"Selected ✓":"Click to choose +"}</span>`;
  return `<article class="course ${closed?"is-closed":""} ${picked?"is-picked":""}" ${closed?"":"role=\"button\" tabindex=\"0\" aria-pressed=\""+picked+"\" data-course=\""+esc(course.id)+"\""}>
   <div class="course-top"><span class="code">${esc(course.code)}</span><span class="badge">${closed?"Previously selected":picked?"In your six":"Open elective"}</span></div>
   <h3>${esc(course.title)}</h3><p class="description">${esc(course.description)}</p>
   <div class="course-bottom"><span class="choice-label">${closed?"Already voted · closed":"2020 MRE bylaws"}</span>${action}</div></article>`;
 }).join("");
 $("#courses").querySelectorAll("[data-course]").forEach(card=>{
  card.addEventListener("click",()=>toggleCourse(card.dataset.course));
  card.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();toggleCourse(card.dataset.course);}});
 });
}
function addHidden(form,name,value){const input=document.createElement("input");input.type="hidden";input.name=name;input.value=value;form.append(input);}
function sendToBackend(action){
 if(VOTE_API_URL==="SET_AFTER_GOOGLE_DEPLOYMENT"){$("#formStatus").textContent="Saving is being connected. Please try again later.";return;}
 const studentName=$("#studentName").value.trim(),studentId=$("#studentId").value.trim();
 if(!studentName||!studentId){$("#formStatus").textContent="Enter both your name and student ID.";(!studentName?$("#studentName"):$("#studentId")).focus();return;}
 if(action==="save"&&selected.size!==6){$("#formStatus").textContent="Select exactly six open courses before saving.";return;}
 const bridge=$("#voteBridge"),form=document.createElement("form");
 form.method="POST";form.action=VOTE_API_URL;form.target=bridge.name;form.hidden=true;
 pendingRequestId=crypto.randomUUID();
 addHidden(form,"action",action);addHidden(form,"studentName",studentName);addHidden(form,"studentId",studentId);addHidden(form,"requestId",pendingRequestId);
 if(action==="save")courses.filter(course=>selected.has(course.id)).forEach(course=>addHidden(form,"course",course.formLabel));
 document.body.append(form);$("#loadSavedVote").disabled=true;$("#submitVote").disabled=true;
 $("#formStatus").textContent=action==="lookup"?"Looking for your saved choices…":"Saving your six choices…";
 form.submit();form.remove();
}
function handleBackendMessage(event){
 const allowedOrigins=["https://script.google.com","https://script.googleusercontent.com"];
 if(!allowedOrigins.includes(event.origin)||!event.data||event.data.source!=="mre-voting-backend")return;
 let result;try{result=JSON.parse(decodeURIComponent(event.data.payload));}catch{return;}
 if(!result||!result.ok){$("#formStatus").textContent=result?.message||"We couldn’t save your choices. Please try again.";$("#loadSavedVote").disabled=false;updateBallot();return;}
 if(result.action==="lookup"){
  if(!result.found){$("#savedVoteState").value="";$("#formStatus").textContent="No saved vote was found for that student ID. Choose six courses, then save.";}
  else{
   const ids=new Set(result.courses.map(label=>courses.find(course=>course.formLabel===label)?.id).filter(Boolean));
   selected.clear();ids.forEach(id=>selected.add(id));$("#savedVoteState").value="found";render();updateBallot();
   $("#formStatus").textContent="Your saved choices are loaded. Change any selections, then update your vote.";
  }
  $("#loadSavedVote").disabled=false;return;
 }
 $("#savedVoteState").value="found";$("#formStatus").textContent=result.updated?"Your saved vote has been updated. You can change it again any time.":"Your vote has been saved. You can load and change it any time.";
 $("#loadSavedVote").disabled=false;updateBallot();
}
async function init(){
 try{const response=await fetch("courses.json");if(!response.ok)throw Error();courses=await response.json();render();updateBallot();$("#status").textContent="Course descriptions loaded. Click six open electives to build your vote."}
 catch{$("#status").textContent="The course list could not be loaded. Please refresh the page."}
}
$("#search").addEventListener("input",event=>{query=event.target.value.trim().toLowerCase();render()});
$("#sort").addEventListener("change",event=>{sort=event.target.value;render()});
$("#voteForm").addEventListener("submit",event=>{event.preventDefault();sendToBackend("save")});
$("#loadSavedVote").addEventListener("click",()=>sendToBackend("lookup"));
$("#studentName").addEventListener("input",()=>{$("#savedVoteState").value="";updateBallot()});
$("#studentId").addEventListener("input",()=>{if($("#savedVoteState").value==="found"){selected.clear();render()}$("#savedVoteState").value="";updateBallot()});
window.addEventListener("message",handleBackendMessage);
init();
