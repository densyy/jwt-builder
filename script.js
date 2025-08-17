// Funções utilitárias
const b64url = (buffer) => {
  const bytes = new Uint8Array(buffer instanceof ArrayBuffer ? buffer : new TextEncoder().encode(buffer));
  let str = '';
  for (let i = 0; i < bytes.byteLength; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const jsonToB64Url = (obj) => b64url(JSON.stringify(obj));

async function signHMACSHA256(key, dataStr){
  const enc = new TextEncoder();
  const keyData = enc.encode(key);
  const cryptoKey = await crypto.subtle.importKey('raw', keyData, {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(dataStr));
  return b64url(signature);
}

// DOM
const keyInput = document.getElementById('keyInput');
const payloadInput = document.getElementById('payloadInput');
const generateBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');
const tokenOutput = document.getElementById('tokenOutput');
const copyBtn = document.getElementById('copyBtn');
const copiedToast = document.getElementById('copiedToast');

function showToast() {
  copiedToast.classList.add('show');
  setTimeout(() => copiedToast.classList.remove('show'), 1400);
}

function setToken(token){
  tokenOutput.value = token;
}

async function generateJWT(){
  const key = keyInput.value.trim();
  if(!key){
    alert('A key é obrigatória para gerar o token.');
    return;
  }

  let payload = {};
  const raw = payloadInput.value.trim();
  if(raw){
    try{
      payload = JSON.parse(raw);
    }catch(e){
      alert('Payload inválido: por favor insira JSON válido.');
      return;
    }
  }

  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = jsonToB64Url(header);
  const payloadB64 = jsonToB64Url(payload);
  const signingInput = `${headerB64}.${payloadB64}`;
  const signatureB64 = await signHMACSHA256(key, signingInput);
  const token = `${signingInput}.${signatureB64}`;
  setToken(token);
}

// Events
generateBtn.addEventListener('click', async (e) => {
  generateBtn.disabled = true;
  generateBtn.textContent = 'Gerando...';
  try{
    await generateJWT();
  }finally{
    generateBtn.disabled = false;
    generateBtn.textContent = 'Gerar Token';
  }
});

clearBtn.addEventListener('click', () => {
  keyInput.value = '';
  payloadInput.value = '';
  tokenOutput.value = '';
});

copyBtn.addEventListener('click', async () => {
  const token = tokenOutput.value;
  if(!token) return;
  try{
    await navigator.clipboard.writeText(token);
    showToast();
  }catch(e){
    // fallback
    tokenOutput.select();
    document.execCommand('copy');
    showToast();
  }
});

// Accessibility: allow Enter to submit when focused in inputs
[keyInput, payloadInput].forEach(el => el.addEventListener('keydown', (ev) => {
  if(ev.key === 'Enter' && ev.shiftKey === false && ev.target.tagName !== 'TEXTAREA'){
    ev.preventDefault();
    generateBtn.click();
  }
}));
