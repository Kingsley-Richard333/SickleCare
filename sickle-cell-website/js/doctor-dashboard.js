// Theme management
function initTheme() {
  const savedTheme = localStorage.getItem('sc_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  return savedTheme;
}

document.addEventListener('DOMContentLoaded', ()=>{
  initTheme();
  const session = JSON.parse(localStorage.getItem('sc2_doctor_session') || 'null');
  if(!session){ window.location.href = '../auth/doctor-login.html'; return; }
  document.getElementById('doctorName').textContent = session.name || 'Doctor';

  // Load patients (mocked from localStorage signups)
  const patients = JSON.parse(localStorage.getItem('sc2_patients') || '[]');
  const list = document.getElementById('patientList');
  if(!patients.length){ list.innerHTML = '<div class="helper">No nearby patients found</div>'; }
  list.innerHTML = patients.slice(-10).map(p => renderPatientRow(p)).join('');

  // Availability toggle persisted
  const statusKey = `sc2_doctor_status_${session.id}`;
  const toggle = document.getElementById('statusToggle');
  const statusNote = document.getElementById('statusNote');
  toggle.checked = (localStorage.getItem(statusKey) || 'offline') === 'available';
  setStatusNote();
  toggle.addEventListener('change', ()=>{
    localStorage.setItem(statusKey, toggle.checked ? 'available' : 'offline');
    setStatusNote();
  });
  function setStatusNote(){ statusNote.textContent = toggle.checked ? 'You are visible to patients' : 'You are offline'; }

  // Profile from signup
  const profile = document.getElementById('profileInfo');
  const doc = JSON.parse(localStorage.getItem('sc2_doctors') || '[]').find(d=> d.id === session.id) || {};
  profile.innerHTML = `
    <div>Hospital: <strong>${doc.hospitalName || '—'}</strong></div>
    <div>Specialty: <strong>${doc.specialty || '—'}</strong></div>
    <div>Experience: <strong>${doc.experience || '0'} years</strong></div>`;

  // Chat functionality
  let currentChatPatientId = null;
  let chatRefreshInterval = null;
  const chatModal = document.getElementById('chatModal');
  const closeChat = document.getElementById('closeChat');

  // Chat modal
  document.getElementById('chatPatient')?.addEventListener('click', ()=> {
    loadChatPatients();
    chatModal.showModal();
  });
  
  closeChat?.addEventListener('click', ()=> {
    chatModal.close();
    if (chatRefreshInterval) {
      clearInterval(chatRefreshInterval);
      chatRefreshInterval = null;
    }
  });

  // Load patients for chat
  function loadChatPatients() {
    const patients = JSON.parse(localStorage.getItem('sc2_patients') || '[]');
    const patientListEl = document.getElementById('chatPatientList');
    
    if (patients.length === 0) {
      patientListEl.innerHTML = '<div class="helper">No patients available</div>';
      return;
    }

    patientListEl.innerHTML = patients.map(patient => {
      // Get last message time
      const chatKey = `sc2_chat_${patient.id}_${session.id}`;
      const messages = JSON.parse(localStorage.getItem(chatKey) || '[]');
      const lastMessage = messages[messages.length - 1];
      const lastMessageTime = lastMessage ? new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      
      return `
        <div class="chat-list-item ${currentChatPatientId === patient.id ? 'active' : ''}" 
             data-patient-id="${patient.id}" 
             data-patient-name="${patient.fullName || 'Patient'}">
          <strong>${patient.fullName || 'Patient'}</strong>
          <span class="helper">${lastMessageTime ? `Last: ${lastMessageTime}` : 'No messages'}</span>
        </div>
      `;
    }).join('');

    // Add click handlers
    patientListEl.querySelectorAll('.chat-list-item').forEach(item => {
      item.addEventListener('click', () => {
        const patientId = item.dataset.patientId;
        const patientName = item.dataset.patientName;
        selectPatient(patientId, patientName);
        // Update active state
        patientListEl.querySelectorAll('.chat-list-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      });
    });
  }

  // Select patient to chat with
  function selectPatient(patientId, patientName) {
    currentChatPatientId = patientId;
    document.getElementById('chatMessages').innerHTML = '';
    loadChatMessages(patientId);
    
    // Focus input
    setTimeout(() => {
      const input = document.getElementById('chatInput');
      if (input) input.focus();
    }, 100);
    
    // Start auto-refresh
    if (chatRefreshInterval) clearInterval(chatRefreshInterval);
    chatRefreshInterval = setInterval(() => loadChatMessages(patientId), 2000);
  }

  // Load chat messages
  function loadChatMessages(patientId) {
    if (!patientId) {
      document.getElementById('chatMessages').innerHTML = '<div class="helper" style="text-align: center; padding: 20px;">Select a patient to start chatting</div>';
      return;
    }
    const chatKey = `sc2_chat_${patientId}_${session.id}`;
    const messages = JSON.parse(localStorage.getItem(chatKey) || '[]');
    const messagesEl = document.getElementById('chatMessages');
    
    if (messages.length === 0) {
      messagesEl.innerHTML = '<div class="helper" style="text-align: center; padding: 20px;">No messages yet. Start the conversation!</div>';
      return;
    }
    
    messagesEl.innerHTML = messages.map(msg => {
      const isDoctor = msg.senderId === session.id;
      const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="chat-message ${isDoctor ? 'sent' : 'received'}">
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
    if (!currentChatPatientId) {
      toast('Please select a patient first');
      return;
    }
    
    const text = chatInput.value.trim();
    if (!text) return;

    const chatKey = `sc2_chat_${currentChatPatientId}_${session.id}`;
    const messages = JSON.parse(localStorage.getItem(chatKey) || '[]');
    
    messages.push({
      senderId: session.id,
      senderName: session.name || 'Doctor',
      receiverId: currentChatPatientId,
      text: text,
      timestamp: new Date().toISOString()
    });
    
    localStorage.setItem(chatKey, JSON.stringify(messages));
    chatInput.value = '';
    loadChatMessages(currentChatPatientId);
  }

  sendBtn?.addEventListener('click', sendMessage);
  chatInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  // Helper function for escaping HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Other interactions
  document.getElementById('callPatient')?.addEventListener('click', ()=> toast('Calling patient (placeholder)'));
  document.getElementById('markComplete')?.addEventListener('click', ()=>{
    document.getElementById('interactionNote').textContent = 'Consultation marked as completed.';
    toast('Consultation completed');
  });

  // Modal for patient details
  const modal = document.getElementById('patientModal');
  const closeBtn = document.getElementById('closePatientModal');
  closeBtn?.addEventListener('click', ()=> modal.close());
  window.viewPatient = function(email){
    const p = patients.find(x=> x.email === email);
    const logs = JSON.parse(localStorage.getItem(`sc2_symptoms_${(p && p.id) || 'unknown'}`) || '[]');
    const box = document.getElementById('patientDetail');
    box.innerHTML = logs.slice(-10).reverse().map(l => {
      const date = new Date(l.date).toLocaleString();
      const region = escapeHtml(l.region || '');
      const severity = l.severity || 0;
      const notes = escapeHtml(l.notes || '');
      return `<div class="card" style="color: var(--text);">${date} — ${region} (${severity}) — ${notes}</div>`;
    }).join('') || '<div class="helper" style="color: var(--muted);">No logs yet</div>';
    modal.showModal();
  }
});

function renderPatientRow(p){
  // last recorded pain
  const logs = JSON.parse(localStorage.getItem(`sc2_symptoms_${p.id}`) || '[]');
  const last = logs[logs.length - 1];
  const sev = last ? Number(last.severity) : 0;
  const level = sev < 3 ? 'Mild' : sev < 6 ? 'Moderate' : 'Severe';
  return `
    <div class="table-row">
      <div class="cell"><strong>${p.fullName}</strong></div>
      <div class="cell">${p.age || '—'}</div>
      <div class="cell">${p.location || '—'}</div>
      <div class="cell">${last ? new Date(last.date).toLocaleDateString() : '—'}</div>
      <div class="cell">${sev}</div>
      <div class="cell"><span class="badge ${level.toLowerCase()}">${level}</span></div>
      <div class="cell"><button class="button" onclick="viewPatient('${p.email}')">View Details</button></div>
    </div>`;
}

function toast(msg){
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(()=> t.remove(), 2500);
}


