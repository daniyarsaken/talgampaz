const fs = require('fs');
const html = fs.readFileSync('/home/user/talgampaz/index.html','utf8');

// --- extract BRANCHES array literal from index.html ---
const start = html.indexOf('const BRANCHES = [');
const s = html.indexOf('[', start);
let depth=0, end=-1;
for(let i=s;i<html.length;i++){ const ch=html[i]; if(ch==='[')depth++; else if(ch===']'){depth--; if(depth===0){end=i;break;}} }
const BRANCHES = eval(html.slice(s, end+1));
console.log('branches:', BRANCHES.length);

const esc = t => String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const genText = g => g>0 ? '+'+g+' буын' : (g<0 ? g+' буын' : 'қатар буын');
let id=0; const nid = () => 't'+(id++);

function leafXml(t){
  const title = esc(t.term + ' — ' + t.gloss);
  const note  = esc(t.tr + ' · ' + genText(t.gen) + '\n' + t.desc);
  return `<topic id="${nid()}"><title>${title}</title><notes><plain>${note}</plain></notes></topic>`;
}
function groupXml(label, note, kids){
  const n = note ? `<notes><plain>${esc(note)}</plain></notes>` : '';
  return `<topic id="${nid()}"><title>${esc(label)}</title>${n}<children><topics type="attached">${kids}</topics></children></topic>`;
}
function isLeaf(o){ return o.term !== undefined; }
function nodeXml(o){
  if(isLeaf(o)) return leafXml(o);
  return groupXml(o.label, o.note || '', (o.children||[]).map(nodeXml).join(''));
}

const cats = BRANCHES.map(nodeXml).join('');
const root = `<topic id="root"><title>МЕН</title><notes><plain>Қазақ туыстық жүйесі — «Мен» (ego) орталықта. Тармақтарды ашып, туыстық атаулары мен түсініктемелерін қараңыз.</plain></notes><children><topics type="attached">${cats}</topics></children></topic>`;

const content = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<xmap-content xmlns="urn:xmind:xmap:xmlns:content:2.0" xmlns:fo="http://www.w3.org/1999/XSL/Format" xmlns:svg="http://www.w3.org/2000/svg" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:xlink="http://www.w3.org/1999/xlink" version="2.0">
<sheet id="sheet1"><title>Қазақ туыстық ағашы</title>${root}</sheet>
</xmap-content>`;

const meta = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<meta xmlns="urn:xmind:xmap:xmlns:meta:2.0" version="2.0"><Creator><Name>Қазақ туыстық ағашы</Name></Creator></meta>`;

const manifest = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<manifest xmlns="urn:xmind:xmap:xmlns:manifest:1.0">
<file-entry full-path="content.xml" media-type="text/xml"/>
<file-entry full-path="META-INF/" media-type=""/>
<file-entry full-path="META-INF/manifest.xml" media-type="text/xml"/>
<file-entry full-path="meta.xml" media-type="text/xml"/>
</manifest>`;

const dir = '/tmp/claude-0/-home-user-talgampaz/8ec2f66a-cda1-5452-9373-8fb1fd1f075b/scratchpad/xmindbuild';
fs.rmSync(dir, {recursive:true, force:true});
fs.mkdirSync(dir+'/META-INF', {recursive:true});
fs.writeFileSync(dir+'/content.xml', content);
fs.writeFileSync(dir+'/meta.xml', meta);
fs.writeFileSync(dir+'/META-INF/manifest.xml', manifest);
console.log('topics generated (incl. root):', id+1);
console.log('files written to', dir);
