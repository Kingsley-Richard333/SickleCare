// Theme management
function initTheme() {
  const savedTheme = localStorage.getItem('sc_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  return savedTheme;
}

document.addEventListener('DOMContentLoaded', ()=>{
  initTheme();
  const session = JSON.parse(localStorage.getItem('sc2_patient_session') || 'null');
  if(!session){ window.location.href = '../auth/patient-login.html'; return; }
  document.getElementById('patientName').textContent = session.name || 'Patient';

  // UI refs
  const saveSymptomBtn = document.getElementById('saveSymptom');
  const saveSoreBtn = document.getElementById('saveSore');
  const chatBtn = document.getElementById('chatBtn');
  const chatModal = document.getElementById('chatModal');
  const closeChat = document.getElementById('closeChat');

  // Suggestions
  const suggestions = [
    'Drink more water',
    'Avoid stress',
    'Rest under warm condition',
    'Avoid strenuous exercise',
    'Keep routine medications nearby'
  ];
  const sugEl = document.getElementById('suggestions');
  sugEl.innerHTML = suggestions.map(s => `<li class="list-item">${s}</li>`).join('');

  // Storage helpers per user
  const storeKey = `sc2_symptoms_${session.id}`;
  const soreKey = `sc2_sores_${session.id}`;
  const read = (k) => JSON.parse(localStorage.getItem(k) || '[]');
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  // Save symptom entry
  saveSymptomBtn?.addEventListener('click', ()=>{
    const entry = {
      date: new Date().toISOString(),
      range: document.getElementById('range').value,
      region: document.getElementById('region').value,
      severity: Number(document.getElementById('severity').value),
      notes: document.getElementById('notes').value.trim()
    };
    const list = read(storeKey);
    list.push(entry);
    write(storeKey, list);
    renderChart(list);
    simpleToast('Symptom saved');
  });

  // Save sore entry
  saveSoreBtn?.addEventListener('click', ()=>{
    const entry = {
      date: new Date().toISOString(),
      location: document.getElementById('soreLocation').value,
      status: document.getElementById('soreStatus').value
    };
    const list = read(soreKey);
    list.push(entry);
    write(soreKey, list);
    simpleToast('Sore saved');
  });

  // Chat functionality
  let currentChatDoctorId = null;
  let chatRefreshInterval = null;

  // Chat modal
  chatBtn?.addEventListener('click', ()=> {
    loadAvailableDoctors();
    chatModal.showModal();
  });
  closeChat?.addEventListener('click', ()=> {
    chatModal.close();
    if (chatRefreshInterval) {
      clearInterval(chatRefreshInterval);
      chatRefreshInterval = null;
    }
  });

  // Load available doctors
  function loadAvailableDoctors() {
    const doctors = JSON.parse(localStorage.getItem('sc2_doctors') || '[]');
    const doctorListEl = document.getElementById('doctorList');
    const availableDoctors = doctors.filter(d => {
      const statusKey = `sc2_doctor_status_${d.id}`;
      return localStorage.getItem(statusKey) === 'available';
    });

    if (availableDoctors.length === 0) {
      doctorListEl.innerHTML = '<div class="helper">No available doctors at the moment</div>';
      return;
    }

    doctorListEl.innerHTML = availableDoctors.map(doc => `
      <div class="chat-list-item ${currentChatDoctorId === doc.id ? 'active' : ''}" 
           data-doctor-id="${doc.id}" 
           data-doctor-name="${doc.fullName || 'Doctor'}">
        <strong>${doc.fullName || 'Doctor'}</strong>
        <span class="helper">${doc.specialty || 'General'}</span>
      </div>
    `).join('');

    // Add click handlers
    doctorListEl.querySelectorAll('.chat-list-item').forEach(item => {
      item.addEventListener('click', () => {
        const doctorId = item.dataset.doctorId;
        const doctorName = item.dataset.doctorName;
        selectDoctor(doctorId, doctorName);
        // Update active state
        doctorListEl.querySelectorAll('.chat-list-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      });
    });
  }

  // Select doctor to chat with
  function selectDoctor(doctorId, doctorName) {
    currentChatDoctorId = doctorId;
    document.getElementById('chatMessages').innerHTML = '';
    loadChatMessages(doctorId);
    
    // Focus input
    setTimeout(() => {
      const input = document.getElementById('chatInput');
      if (input) input.focus();
    }, 100);
    
    // Start auto-refresh
    if (chatRefreshInterval) clearInterval(chatRefreshInterval);
    chatRefreshInterval = setInterval(() => loadChatMessages(doctorId), 2000);
  }

  // Load chat messages
  function loadChatMessages(doctorId) {
    if (!doctorId) {
      document.getElementById('chatMessages').innerHTML = '<div class="helper" style="text-align: center; padding: 20px;">Select a doctor to start chatting</div>';
      return;
    }
    const chatKey = `sc2_chat_${session.id}_${doctorId}`;
    const messages = JSON.parse(localStorage.getItem(chatKey) || '[]');
    const messagesEl = document.getElementById('chatMessages');
    
    if (messages.length === 0) {
      messagesEl.innerHTML = '<div class="helper" style="text-align: center; padding: 20px;">No messages yet. Start the conversation!</div>';
      return;
    }
    
    messagesEl.innerHTML = messages.map(msg => {
      const isPatient = msg.senderId === session.id;
      const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="chat-message ${isPatient ? 'sent' : 'received'}">
          <div class="message-content">
            <p>${escapeHtml(msg.text)}</p>
            <span class="message-time">${time}</span>
          </div>
        </div>
      `;
    }).join('');
    
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // Send message
  const sendBtn = document.getElementById('sendMessage');
  const chatInput = document.getElementById('chatInput');
  
  function sendMessage() {
    if (!currentChatDoctorId) {
      simpleToast('Please select a doctor first');
      return;
    }
    
    const text = chatInput.value.trim();
    if (!text) return;

    const chatKey = `sc2_chat_${session.id}_${currentChatDoctorId}`;
    const messages = JSON.parse(localStorage.getItem(chatKey) || '[]');
    
    messages.push({
      senderId: session.id,
      senderName: session.name || 'Patient',
      receiverId: currentChatDoctorId,
      text: text,
      timestamp: new Date().toISOString()
    });
    
    localStorage.setItem(chatKey, JSON.stringify(messages));
    chatInput.value = '';
    loadChatMessages(currentChatDoctorId);
  }

  sendBtn?.addEventListener('click', sendMessage);
  chatInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Chart
  const existing = read(storeKey);
  renderChart(existing);
});

function simpleToast(msg){
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(()=> t.remove(), 2500);
}

function renderChart(entries){
  const byDay = {};
  entries.forEach(e => {
    const d = new Date(e.date).toLocaleDateString();
    byDay[d] = (byDay[d] || 0) + (e.severity >= 5 ? 1 : 0);
  });
  const labels = Object.keys(byDay).slice(-7);
  const data = labels.map(l => byDay[l]);
  const canvas = document.getElementById('painChart');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // Simple bar chart
  const w = canvas.width || canvas.clientWidth;
  const h = canvas.height || canvas.clientHeight;
  const pad = 24;
  const barW = (w - pad*2) / Math.max(labels.length,1) - 8;
  const max = Math.max(1, ...data);
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  ctx.fillStyle = isDark ? '#1e2a3f' : '#e6eef6';
  ctx.fillRect(0,0,w,h);
  labels.forEach((lab, i)=>{
    const x = pad + i * (barW + 8);
    const val = data[i];
    const bh = ((h - pad*2) * val) / max;
    const y = h - pad - bh;
    ctx.fillStyle = isDark ? '#4a9eff' : '#1f7ae0';
    ctx.fillRect(x, y, barW, bh);
    ctx.fillStyle = isDark ? '#e8f0ff' : '#0b2545';
    ctx.font = '12px sans-serif';
    ctx.fillText(String(val), x, y - 4);
  });
}

