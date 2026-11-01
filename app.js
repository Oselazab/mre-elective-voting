const FORM_RESPONSE_URL="https://docs.google.com/forms/d/e/1FAIpQLScacgrt_p3nNlk8RZUKSHQOeGY9jnAoZa6Kt7aY1CP8CgeYMw/formResponse";
const COURSE_ENTRY="entry.814126807";
const NAME_ENTRY="entry.1184840467";
const ID_ENTRY="entry.771655426";
const CLOSED=new Set(["eep-456","cse-426"]);
const selected=new Set();
let courses=[],query="",sort="code",submissionPending=false;
const $=selector=>document.querySelector(selector);
const esc=value=>String(value??"").replace(/[&<>\"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
function updateBallot(){
 const count=selected.size;
 $("#selectedCount").textContent=`${count} / 6 selected`;
 $("#selectedCount").classList.toggle("complete",count===6);
 const picked=courses.filter(course=>selected.has(course.id));
 $("#selectedPreview").innerHTML=picked.length?picked.map(course=>`<span>${esc(course.code)} · ${esc(course.title)}</span>`).join(""):"Your selected courses will appear here.";
 $("#submitVote").disabled=count!==6;
 $("#formStatus").textContent=count===6?"Six choices selected. Add your name and student ID to submit.":`Choose ${6-count} more course${6-count===1?"":"s"}.`;
 const heroFoot=document.querySelector(".stat-foot");
 if(heroFoot)heroFoot.textContent=count===6?"Six choices ready to submit":`${count} of 6 choices selected`;
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
function submitVote(event){
 event.preventDefault();
 const studentName=$("#studentName").value.trim(),studentId=$("#studentId").value.trim();
 if(!studentName||!studentId){$("#formStatus").textContent="Enter both your name and student ID.";(!studentName?$("#studentName"):$("#studentId")).focus();return;}
 if(selected.size!==6){$("#formStatus").textContent="Select exactly six open courses before submitting.";return;}
 const form=document.createElement("form");form.method="POST";form.action=FORM_RESPONSE_URL;form.target="googleReceipt";form.hidden=true;
 addHidden(form,NAME_ENTRY,studentName);addHidden(form,ID_ENTRY,studentId);
 courses.filter(course=>selected.has(course.id)).forEach(course=>addHidden(form,COURSE_ENTRY,course.formLabel));
 addHidden(form,"fvv","1");addHidden(form,"pageHistory","0");addHidden(form,"fbzx","-4242965672675970618");
 document.body.append(form);
 submissionPending=true;$("#submitVote").disabled=true;$("#formStatus").textContent="Submitting your choices…";
 form.submit();form.remove();
}
async function init(){
 try{const response=await fetch("courses.json");if(!response.ok)throw Error();courses=await response.json();render();updateBallot();$("#status").textContent="Course descriptions loaded. Click six open electives to build your vote."}
 catch{$("#status").textContent="The course list could not be loaded. Please refresh the page."}
}
$("#search").addEventListener("input",event=>{query=event.target.value.trim().toLowerCase();render()});
$("#sort").addEventListener("change",event=>{sort=event.target.value;render()});
$("#voteForm").addEventListener("submit",submitVote);
$("#googleReceipt").addEventListener("load",()=>{
 if(!submissionPending)return;
 submissionPending=false;$("#receipt").hidden=false;$("#formStatus").textContent="Your vote has been sent to the response list.";
 $("#receipt").scrollIntoView({behavior:"smooth",block:"center"});
});
init();
