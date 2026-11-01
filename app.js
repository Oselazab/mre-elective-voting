const CLOSED=new Set(["eep-456","cse-426"]);
let courses=[],query="",sort="code";
const $=selector=>document.querySelector(selector);
const esc=value=>String(value??"").replace(/[&<>\"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
function render(){
 const list=courses.filter(course=>(course.code+" "+course.title).toLowerCase().includes(query));
 list.sort((a,b)=>sort==="name"?a.title.localeCompare(b.title):a.code.localeCompare(b.code));
 $("#count").textContent=list.length+" course"+(list.length===1?"":"s");
 $("#courses").innerHTML=list.map(course=>{
  const closed=CLOSED.has(course.id);
  const action=closed?'<span class="vote-btn closed">Already selected</span>':'<a class="vote-btn" href="#ballot">Choose in ballot ↓</a>';
  return '<article class="course '+(closed?'is-closed':'')+'"><div class="course-top"><span class="code">'+esc(course.code)+'</span><span class="badge">'+(closed?'Previously selected':'Open elective')+'</span></div><h3>'+esc(course.title)+'</h3><div class="meta">'+(closed?'Already voted · closed to new selections':'Official elective · 2020 MRE bylaws')+'</div><div class="course-bottom"><span class="choice-label">'+(closed?'Not in ballot':'One of 26 choices')+'</span>'+action+'</div></article>'
 }).join("");
}
async function init(){
 try{const response=await fetch("courses.json");if(!response.ok)throw Error();courses=await response.json();render();$("#status").textContent="Course list loaded. Select six courses in the ballot below."}
 catch{$("#status").textContent="The course list could not be loaded. Please refresh the page."}
}
$("#search").addEventListener("input",event=>{query=event.target.value.trim().toLowerCase();render()});
$("#sort").addEventListener("change",event=>{sort=event.target.value;render()});
init();
