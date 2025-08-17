// -------------------- Core (funções puras) --------------------

function b64url (buffer) {
  const bytes = new Uint8Array(buffer instanceof ArrayBuffer ? buffer : new TextEncoder().encode(buffer))
  let str = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    str += String.fromCharCode(bytes[i])
  }

  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function jsonToB64Url (obj) {
  return b64url(JSON.stringify(obj))
}

function buildSigningInput (header, payload) {
  const h = jsonToB64Url(header)
  const p = jsonToB64Url(payload)
  return `${h}.${p}`
}

function parsePayload (raw) {
  const trimmed = (raw || '').trim()
  if (!trimmed) return {}
  return JSON.parse(trimmed)
}

// -------------------- Gateway (crypto) --------------------

async function signHMACSHA256(key, dataStr) {
  const enc = new TextEncoder()
  const keyData = enc.encode(key)
  const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(dataStr))
  return b64url(signature)
}

async function createJWT({ header, payload }, key, signer = signHMACSHA256) {
  const signingInput = buildSigningInput(header, payload)
  const signature = await signer(key, signingInput)
  return `${signingInput}.${signature}`
}

// -------------------- Adapter / UI (efeitos colaterais) --------------------

const DOM = {
  keyInput: document.getElementById('keyInput'),
  payloadInput: document.getElementById('payloadInput'),
  generateBtn: document.getElementById('generateBtn'),
  clearBtn: document.getElementById('clearBtn'),
  tokenOutput: document.getElementById('tokenOutput'),
  copyBtn: document.getElementById('copyBtn'),
  copiedToast: document.getElementById('copiedToast'),
  alertEl: document.getElementById('alert'),
  alertMessage: document.getElementById('alertMessage'),
  alertClose: document.getElementById('alertClose')
}

function showAlert(message, timeout = 3000) {
  const { alertEl, alertMessage } = DOM
  if (!alertEl) return

  alertMessage.textContent = message
  alertEl.hidden = false
  alertEl.setAttribute('aria-hidden', 'false')

  if (window.__alertTimeout) clearTimeout(window.__alertTimeout)

    window.__alertTimeout = setTimeout(() => {
    alertEl.hidden = true
    alertEl.setAttribute('aria-hidden', 'true')
  }, timeout)
}

DOM.alertClose && DOM.alertClose.addEventListener('click', () => {
  if (DOM.alertEl) {
    DOM.alertEl.hidden = true
    DOM.alertEl.setAttribute('aria-hidden', 'true')
  }
})

function showToast() {
  const el = DOM.copiedToast
  if (!el) return
  el.classList.add('show')
  setTimeout(() => el.classList.remove('show'), 1400)
}

function setToken(token) {
  if (DOM.tokenOutput) DOM.tokenOutput.value = token
}

function setLoading(loading) {
  const btn = DOM.generateBtn
  if (!btn) return

  btn.disabled = loading
  btn.textContent = loading ? 'Gerando...' : 'Gerar Token'
}

function clearFields() {
  if (DOM.keyInput) DOM.keyInput.value = ''
  if (DOM.payloadInput) DOM.payloadInput.value = ''
  if (DOM.tokenOutput) DOM.tokenOutput.value = ''
}

async function copyTokenToClipboard() {
  const token = DOM.tokenOutput && DOM.tokenOutput.value
  if (!token) return

  try {
    await navigator.clipboard.writeText(token)
    showToast()
  } catch (e) {
    if (DOM.tokenOutput && typeof DOM.tokenOutput.select === 'function') {
      DOM.tokenOutput.select()
      document.execCommand('copy')
      showToast()
    } else {
      showAlert('Não foi possível copiar automaticamente. Copie o token manualmente.')
    }
  }
}

// -------------------- Application wiring --------------------

async function handleGenerate() {
  try {
    setLoading(true)
    const key = (DOM.keyInput && DOM.keyInput.value || '').trim()
    if (!key) {
      showAlert('A key é obrigatória para gerar o token.')
      return
    }

    let payload = {}
    try {
      payload = parsePayload(DOM.payloadInput && DOM.payloadInput.value)
    } catch (e) {
      showAlert('Payload inválido: por favor insira JSON válido.')
      return
    }

    const header = { alg: 'HS256', typ: 'JWT' }
    const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60
    const nowSec = Math.floor(Date.now() / 1000)
    const payloadWithExp = Object.assign({}, payload)
    if (payloadWithExp.exp === undefined) {
      payloadWithExp.exp = nowSec + ONE_YEAR_SECONDS
    }

    const token = await createJWT({ header, payload: payloadWithExp }, key)
    setToken(token)

    localStorage.setItem('jwt_payload', (DOM.payloadInput && DOM.payloadInput.value) || '')
  } finally {
    setLoading(false)
  }
}

if (DOM.generateBtn) DOM.generateBtn.addEventListener('click', handleGenerate)
if (DOM.clearBtn) DOM.clearBtn.addEventListener('click', clearFields)
if (DOM.copyBtn) DOM.copyBtn.addEventListener('click', copyTokenToClipboard)

function loadSavedPayload () {
  const saved = localStorage.getItem('jwt_payload')
  if (saved != null && DOM.payloadInput) DOM.payloadInput.value = saved
}
loadSavedPayload()

[DOM.keyInput, DOM.payloadInput].forEach(el => {
  if (!el) return
  el.addEventListener('keydown', (ev) => {
    const key = ev && ev.key
    const shift = ev && ev.shiftKey
    const target = ev && ev.target
    const tagName = target && target.tagName && String(target.tagName).toUpperCase()
    const isTextarea = tagName === 'TEXTAREA'

    if (key === 'Enter' && !shift && !isTextarea) {
      ev.preventDefault()
      if (DOM.generateBtn) DOM.generateBtn.click()
    }
  })
})
