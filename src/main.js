// ─── State ───

const state = {
  apiKey: localStorage.getItem('peekaboo_api_key') || '',
  cameraOn: false,
  stream: null,
  messages: [],        // conversation history for API
  messageCount: 0,
  isThinking: false,
  pendingSnapshot: null,  // staged image data URL awaiting caption + send
  model: 'qwen/qwen3.6-plus:free',
};

const CAPTURE_WIDTH = 640;
const CAPTURE_HEIGHT = 360;

// ─── DOM ───

const $ = (sel) => document.querySelector(sel);
const modal = $('#api-modal');
const app = $('#app');
const apiKeyInput = $('#api-key-input');
const apiKeySubmit = $('#api-key-submit');
const webcam = $('#webcam');
const canvas = $('#capture-canvas');
const ctx = canvas.getContext('2d');
const placeholder = $('#camera-placeholder');
const liveBadge = $('#live-badge');
const thinkingBadge = $('#thinking-badge');
const avatarGlow = $('#avatar-glow');
const chatMessages = $('#chat-messages');
const chatInput = $('#chat-input');
const btnSend = $('#btn-send');
const btnCamera = $('#btn-camera');
const btnSnapshot = $('#btn-snapshot');
const btnEnd = $('#btn-end');
const msgCount = $('#msg-count');
const iconCameraOn = $('#icon-camera-on');
const iconCameraOff = $('#icon-camera-off');
const pillSnapshot = $('#pill-snapshot');
const pillModel = $('#pill-model');
const snapshotPreview = $('#snapshot-preview');
const snapshotPreviewImg = $('#snapshot-preview-img');
const snapshotDismiss = $('#snapshot-preview-dismiss');

// ─── Init ───

canvas.width = CAPTURE_WIDTH;
canvas.height = CAPTURE_HEIGHT;

if (state.apiKey) {
  showApp();
} else {
  modal.classList.remove('hidden');
}

// ─── API Key ───

apiKeySubmit.addEventListener('click', submitApiKey);
apiKeyInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') submitApiKey();
});

function submitApiKey() {
  const key = apiKeyInput.value.trim();
  if (!key) {
    apiKeyInput.style.borderColor = '#e24b4a';
    return;
  }
  state.apiKey = key;
  localStorage.setItem('peekaboo_api_key', key);
  showApp();
}

function showApp() {
  modal.classList.add('hidden');
  app.classList.remove('hidden');
  startCamera();
  chatInput.focus();
}

// ─── Camera ───

async function startCamera() {
  try {
    state.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
    webcam.srcObject = state.stream;
    state.cameraOn = true;
    placeholder.classList.add('hidden');
    liveBadge.classList.remove('hidden');
    btnCamera.classList.add('active');
  } catch (err) {
    console.warn('Camera access denied:', err);
    state.cameraOn = false;
    placeholder.classList.remove('hidden');
  }
}

function stopCamera() {
  if (state.stream) {
    state.stream.getTracks().forEach((t) => t.stop());
    state.stream = null;
  }
  webcam.srcObject = null;
  state.cameraOn = false;
  placeholder.classList.remove('hidden');
  liveBadge.classList.add('hidden');
  btnCamera.classList.remove('active');
}

function toggleCamera() {
  if (state.cameraOn) {
    stopCamera();
  } else {
    startCamera();
  }
}

function captureFrame() {
  if (!state.cameraOn) return null;

  ctx.save();
  ctx.translate(CAPTURE_WIDTH, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(webcam, 0, 0, CAPTURE_WIDTH, CAPTURE_HEIGHT);
  ctx.restore();

  // Flash effect
  webcam.classList.add('flash');
  setTimeout(() => webcam.classList.remove('flash'), 300);

  return canvas.toDataURL('image/jpeg', 0.7);
}

// ─── Chat ───

function addMessage(role, text, imageDataUrl) {
  state.messageCount++;
  msgCount.textContent = `${state.messageCount} message${state.messageCount !== 1 ? 's' : ''}`;

  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const wrapper = document.createElement('div');
  wrapper.className = role === 'user' ? 'msg-user' : 'msg-ai';

  let html = '';

  if (role === 'user' && imageDataUrl) {
    html += `<img src="${imageDataUrl}" class="msg-snapshot" alt="snapshot" />`;
  }

  const bubbleClass = role === 'user' ? 'msg-bubble-user' : 'msg-bubble-ai';
  html += `<div class="${bubbleClass}">${escapeHtml(text)}</div>`;
  html += `<p class="msg-time">${time}</p>`;

  wrapper.innerHTML = html;
  chatMessages.appendChild(wrapper);
  scrollToBottom();
}

function showTyping() {
  const wrapper = document.createElement('div');
  wrapper.className = 'msg-ai';
  wrapper.id = 'typing-indicator';
  wrapper.innerHTML = `
    <div class="msg-bubble-ai">
      <div class="typing-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  chatMessages.appendChild(wrapper);
  scrollToBottom();
}

function removeTyping() {
  const el = $('#typing-indicator');
  if (el) el.remove();
}

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function setThinking(on) {
  state.isThinking = on;
  thinkingBadge.classList.toggle('hidden', !on);
  avatarGlow.classList.toggle('active', on);
  if (on) showTyping();
  else removeTyping();
}

// ─── Snapshot staging ───

function stageSnapshot() {
  const img = captureFrame();
  if (!img) return;
  state.pendingSnapshot = img;
  snapshotPreviewImg.src = img;
  snapshotPreview.classList.remove('hidden');
  chatInput.placeholder = 'Add a caption...';
  chatInput.focus();
}

function clearSnapshot() {
  state.pendingSnapshot = null;
  snapshotPreview.classList.add('hidden');
  snapshotPreviewImg.src = '';
  chatInput.placeholder = 'Type a message...';
}

// ─── API ───

async function sendMessage(text) {
  const imageDataUrl = state.pendingSnapshot;
  clearSnapshot();

  addMessage('user', text, imageDataUrl);

  // Build user content
  const content = [];
  if (imageDataUrl) {
    content.push({
      type: 'image_url',
      image_url: { url: imageDataUrl },
    });
  }
  content.push({ type: 'text', text });

  state.messages.push({ role: 'user', content });

  setThinking(true);

  try {
    const body = {
      model: state.model,
      messages: [
        {
          role: 'system',
          content: 'You are Peekaboo, a friendly AI assistant on a live video call. The user may share camera snapshots with their messages. Describe what you see naturally, as if you\'re on a FaceTime call. Be concise, warm, and conversational. If no image is provided, just chat normally.',
        },
        ...state.messages,
      ],
    };

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Peekaboo',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `API error ${res.status}`);
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || 'No response received.';

    // Strip <think>...</think> tags from reasoning models
    const cleanReply = reply.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    state.messages.push({ role: 'assistant', content: cleanReply });

    setThinking(false);
    addMessage('assistant', cleanReply);
  } catch (err) {
    setThinking(false);
    addMessage('assistant', `Error: ${err.message}`);
    console.error('API error:', err);
  }
}

// ─── Event Listeners ───

btnSend.addEventListener('click', handleSend);
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

function handleSend() {
  const text = chatInput.value.trim();
  if (!text || state.isThinking) return;
  chatInput.value = '';
  sendMessage(text);
}

btnCamera.addEventListener('click', toggleCamera);

btnSnapshot.addEventListener('click', stageSnapshot);
pillSnapshot.addEventListener('click', stageSnapshot);
snapshotDismiss.addEventListener('click', clearSnapshot);

btnEnd.addEventListener('click', () => {
  stopCamera();
  clearSnapshot();
  state.messages = [];
  state.messageCount = 0;
  msgCount.textContent = '0 messages';
  chatMessages.innerHTML = `
    <div class="msg-system">
      <div class="msg-bubble-system">Session ended</div>
    </div>
  `;
});

// ─── Model Picker ───

const modelModal = $('#model-modal');
const modelInput = $('#model-input');
const modelSubmit = $('#model-submit');
const modelCurrentDisplay = $('#model-current-display');
const badgeModel = $('#badge-model');
const modelName = $('#model-name');

function openModelPicker() {
  modelInput.value = state.model;
  modelCurrentDisplay.textContent = state.model;
  modelModal.classList.remove('hidden');
  modelInput.focus();
  modelInput.select();
}

function closeModelPicker() {
  modelModal.classList.add('hidden');
}

function applyModel() {
  const val = modelInput.value.trim();
  if (!val) return;
  state.model = val;
  // Show short display name (last segment, strip :free etc.)
  const short = val.split('/').pop().replace(/:free$/, '');
  modelName.textContent = short;
  pillModel.textContent = `Model: ${short}`;
  modelCurrentDisplay.textContent = val;
  closeModelPicker();
}

badgeModel.addEventListener('click', openModelPicker);
pillModel.addEventListener('click', openModelPicker);

modelSubmit.addEventListener('click', applyModel);
modelInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') applyModel();
  if (e.key === 'Escape') closeModelPicker();
});

modelModal.addEventListener('click', (e) => {
  if (e.target === modelModal) closeModelPicker();
});

// ─── Image Lightbox with Drawing ───

const lightbox = $('#lightbox');
const lbCanvas = $('#lb-canvas');
const lbCtx = lbCanvas.getContext('2d');
const lbClose = $('#lb-close');
const lbReattach = $('#lb-reattach');
const lbUndo = $('#lb-undo');
const lbClear = $('#lb-clear');
const lbToolDraw = $('#lb-tool-draw');
const lbToolErase = $('#lb-tool-erase');

const lb = {
  baseImage: null,      // original Image element
  sourceDataUrl: null,   // original data URL
  strokes: [],          // array of stroke snapshots (ImageData) for undo
  drawing: false,
  tool: 'draw',         // 'draw' | 'erase'
  color: '#e24b4a',
  size: 4,
  maxW: 0,
  maxH: 0,
};

function openLightbox(imgDataUrl) {
  lb.sourceDataUrl = imgDataUrl;
  lb.strokes = [];

  const img = new Image();
  img.onload = () => {
    lb.baseImage = img;

    // Fit to viewport with padding
    const pad = 120;
    const maxW = window.innerWidth - pad * 2;
    const maxH = window.innerHeight - 200;
    const scale = Math.min(maxW / img.width, maxH / img.height, 1);
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);

    lbCanvas.width = w;
    lbCanvas.height = h;
    lb.maxW = w;
    lb.maxH = h;

    lbCtx.drawImage(img, 0, 0, w, h);
    lb.strokes.push(lbCtx.getImageData(0, 0, w, h));

    lightbox.classList.remove('hidden');
  };
  img.src = imgDataUrl;
}

function closeLightbox() {
  lightbox.classList.add('hidden');
  lb.strokes = [];
  lb.baseImage = null;
}

// Drawing on canvas
lbCanvas.addEventListener('pointerdown', (e) => {
  lb.drawing = true;
  lbCanvas.setPointerCapture(e.pointerId);
  lbCtx.beginPath();
  const rect = lbCanvas.getBoundingClientRect();
  lbCtx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
});

lbCanvas.addEventListener('pointermove', (e) => {
  if (!lb.drawing) return;
  const rect = lbCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  lbCtx.lineWidth = lb.tool === 'erase' ? lb.size * 4 : lb.size;
  lbCtx.lineCap = 'round';
  lbCtx.lineJoin = 'round';

  if (lb.tool === 'erase') {
    lbCtx.globalCompositeOperation = 'destination-out';
    lbCtx.strokeStyle = 'rgba(0,0,0,1)';
  } else {
    lbCtx.globalCompositeOperation = 'source-over';
    lbCtx.strokeStyle = lb.color;
  }

  lbCtx.lineTo(x, y);
  lbCtx.stroke();
});

lbCanvas.addEventListener('pointerup', () => {
  if (!lb.drawing) return;
  lb.drawing = false;
  lbCtx.closePath();
  lbCtx.globalCompositeOperation = 'source-over';

  // If eraser was used, re-composite: base image + remaining drawings
  if (lb.tool === 'erase') {
    // Get current drawings
    const drawn = lbCtx.getImageData(0, 0, lb.maxW, lb.maxH);
    // Redraw base then overlay
    lbCtx.drawImage(lb.baseImage, 0, 0, lb.maxW, lb.maxH);
    lbCtx.putImageData(drawn, 0, 0);
  }

  lb.strokes.push(lbCtx.getImageData(0, 0, lb.maxW, lb.maxH));
});

// Tool selection
lbToolDraw.addEventListener('click', () => {
  lb.tool = 'draw';
  lbToolDraw.classList.add('active');
  lbToolErase.classList.remove('active');
  lbCanvas.style.cursor = 'crosshair';
});

lbToolErase.addEventListener('click', () => {
  lb.tool = 'erase';
  lbToolErase.classList.add('active');
  lbToolDraw.classList.remove('active');
  lbCanvas.style.cursor = 'grab';
});

// Color swatches
document.querySelectorAll('.lb-color-swatch').forEach((swatch) => {
  swatch.addEventListener('click', () => {
    document.querySelectorAll('.lb-color-swatch').forEach((s) => s.classList.remove('active'));
    swatch.classList.add('active');
    lb.color = swatch.dataset.color;
    // Switch to draw tool when picking a color
    lb.tool = 'draw';
    lbToolDraw.classList.add('active');
    lbToolErase.classList.remove('active');
    lbCanvas.style.cursor = 'crosshair';
  });
});

// Brush sizes
document.querySelectorAll('.lb-size-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.lb-size-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    lb.size = parseInt(btn.dataset.size, 10);
  });
});

// Undo
lbUndo.addEventListener('click', () => {
  if (lb.strokes.length > 1) {
    lb.strokes.pop();
    lbCtx.putImageData(lb.strokes[lb.strokes.length - 1], 0, 0);
  }
});

// Clear all drawings (restore base image)
lbClear.addEventListener('click', () => {
  lbCtx.clearRect(0, 0, lb.maxW, lb.maxH);
  lbCtx.drawImage(lb.baseImage, 0, 0, lb.maxW, lb.maxH);
  lb.strokes = [lbCtx.getImageData(0, 0, lb.maxW, lb.maxH)];
});

// Close
lbClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

// Reattach — export drawn-on image and stage it as a pending snapshot
lbReattach.addEventListener('click', () => {
  const dataUrl = lbCanvas.toDataURL('image/jpeg', 0.85);
  state.pendingSnapshot = dataUrl;
  snapshotPreviewImg.src = dataUrl;
  snapshotPreview.classList.remove('hidden');
  chatInput.placeholder = 'Add a caption...';
  closeLightbox();
  chatInput.focus();
});

// Click handler for snapshot images in chat — delegated
chatMessages.addEventListener('click', (e) => {
  const img = e.target.closest('.msg-snapshot');
  if (img) {
    openLightbox(img.src);
  }
});
