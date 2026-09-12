const fs = require('fs');
const lines = fs.readFileSync('C:/Users/HP/.gemini/antigravity-ide/brain/491b0d00-2da8-482a-8e7e-5faee09754cb/.system_generated/logs/transcript.jsonl', 'utf8').split('\n');
let lastUser = '';
for(let i=lines.length-1; i>=0; i--) {
  if(!lines[i]) continue;
  try {
    const obj = JSON.parse(lines[i]);
    if(obj.type === 'USER_INPUT') {
      lastUser = obj.content;
      break;
    }
  } catch(e) {}
}
fs.writeFileSync('data/raw/debug.txt', lastUser);
console.log('Done');
