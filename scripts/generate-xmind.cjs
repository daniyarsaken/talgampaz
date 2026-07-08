const fs = require('fs');
const html = fs.readFileSync('/home/user/talgampaz/index.html','utf8');

// --- extract BRANCHES array literal ---
const start = html.indexOf('const BRANCHES = [');
const s = html.indexOf('[', start);
let depth=0, end=-1;
for(let i=s;i<html.length;i++){ const ch=html[i]; if(ch==='[')depth++; else if(ch===']'){depth--; if(depth===0){end=i;break;}} }
const BRANCHES = eval(html.slice(s, end+1));

const genText = g => g>0 ? '+'+g+' буын' : (g<0 ? g+' буын' : 'қатар буын');
let uid=0; const nid = () => 't'+(uid++);
const isLeaf = o => o.term !== undefined;

function noteFor(o){
  if(isLeaf(o)) return `${o.tr} · ${genText(o.gen)}\nKZ: ${o.desc}\nRU: ${o.descRu||''}`;
  return o.note || '';
}
function titleFor(o){
  if(isLeaf(o)) return `${o.term} — ${o.gloss}`;
  return o.labelRu ? `${o.label} — ${o.labelRu}` : o.label;
}
// build XMind Zen content.json topic
function topic(o){
  const t = { id: nid(), title: titleFor(o) };
  const note = noteFor(o);
  if(note) t.notes = { plain: { content: note } };
  const kids = o.children || [];
  if(kids.length) t.children = { attached: kids.map(topic) };
  return t;
}
const root = {
  id: 'root', class: 'topic', title: 'МЕН — Я (ego)',
  notes: { plain: { content: 'Қазақ туыстық жүйесі — «Мен» орталықта. / Казахская система родства — в центре «Я». Екі тілде.' } },
  children: { attached: BRANCHES.map(topic) }
};
const content = [{
  id: 'sheet1', class: 'sheet', title: 'Қазақ туыстық ағашы / Дерево родства',
  rootTopic: root
}];
const manifest = { "file-entries": { "content.json": {}, "metadata.json": {} } };
const metadata = { creator: { name: 'Qazaq tuystyq agashy' } };

const dir = '/tmp/claude-0/-home-user-talgampaz/8ec2f66a-cda1-5452-9373-8fb1fd1f075b/scratchpad/xmindbuild';
fs.rmSync(dir, {recursive:true, force:true}); fs.mkdirSync(dir, {recursive:true});
fs.writeFileSync(dir+'/content.json', JSON.stringify(content));
fs.writeFileSync(dir+'/manifest.json', JSON.stringify(manifest));
fs.writeFileSync(dir+'/metadata.json', JSON.stringify(metadata));
console.log('topics:', uid+1, '(incl root)');
console.log('JSON valid:', !!JSON.parse(JSON.stringify(content)));
