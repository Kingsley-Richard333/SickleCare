// Shared utilities and simulated backend using localStorage
// Storage keys
const STORAGE_KEYS = {
  patients: 'sc_patients',
  doctors: 'sc_doctors',
  patientSession: 'sc_patient_session',
  doctorSession: 'sc_doctor_session',
  symptomHistory: 'sc_symptom_history',
};

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// Theme management
function initTheme() {
  const savedTheme = localStorage.getItem('sc_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  return savedTheme;
}

function toggleTheme() {
  const currentTheme =
    document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('sc_theme', newTheme);
  return newTheme;
}

function getThemeIcon(theme) {
  return theme === 'dark' ? '☀️' : '🌙';
}

function createNavbar(active = '') {
  // Use Router class for consistent path resolution
  const urls = router.getUrls();
  const patientSession = JSON.parse(
    localStorage.getItem('sc2_patient_session') || 'null',
  );
  const doctorSession = JSON.parse(
    localStorage.getItem('sc2_doctor_session') || 'null',
  );

  const links = [
    { href: urls.home, label: 'Home', key: 'home' },
    { href: urls.symptomCheck, label: 'Check Symptoms', key: 'symptoms' },
    { href: urls.findDoctors, label: 'Find Doctors', key: 'find' },
    { href: urls.learn, label: 'Learn', key: 'learn' },
  ];

  const nav = document.createElement('nav');
  nav.className = 'navbar';

  const currentTheme =
    document.documentElement.getAttribute('data-theme') || 'light';
  const themeIcon = getThemeIcon(currentTheme);

  const right =
    !patientSession && !doctorSession
      ? `<div class="badge" id="portalMenu">
         <a href="${urls.patientLogin}">Patient</a> · <a href="${urls.doctorLogin}">Doctor</a>
       </div>`
      : `<div class="row">
         <a class="button" href="${patientSession ? urls.patientDashboard : urls.doctorDashboard}">Dashboard</a>
         <button class="button" id="logoutBtn">Logout</button>
       </div>`;

  nav.innerHTML = `
    <div class="container navbar-inner">
      <a class="brand" href="${urls.home}">
        <span class="brand-badge">SC</span>
        <span>SickleCare</span>
      </a>
      <button class="nav-toggle" aria-label="Open Menu">☰</button>
      <div class="nav-links">
        ${links.map((l) => `<a href="${l.href}" class="${active === l.key ? 'active' : ''}">${l.label}</a>`).join('')}
        <button class="theme-toggle" id="themeToggle" aria-label="Toggle theme">${themeIcon}</button>
        ${right}
      </div>
    </div>`;

  document.body.prepend(nav);
  const toggle = nav.querySelector('.nav-toggle');
  const linksEl = nav.querySelector('.nav-links');
  toggle?.addEventListener('click', () => linksEl?.classList.toggle('open'));

  nav.querySelector('#logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('sc2_patient_session');
    localStorage.removeItem('sc2_doctor_session');
    window.location.href = urls.home;
  });

  const themeToggle = nav.querySelector('#themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const newTheme = toggleTheme();
      themeToggle.textContent = getThemeIcon(newTheme);
    });
  }
}

function createFooter() {
  const footer = document.createElement('footer');
  footer.className = 'footer';
  footer.innerHTML = `
    <div class="container footer-inner">
      <div>
        <strong>Need help?</strong> Call National SCD Helpline: <a href="tel:+1800123456">+1 800 123 456</a>
      </div>
      <div>
        <a href="mailto:support@sicklecare.org">Email Support</a>
      </div>
    </div>`;
  document.body.appendChild(footer);
}

// Auth simulation
function registerUser(role, data) {
  const key = role === 'patient' ? STORAGE_KEYS.patients : STORAGE_KEYS.doctors;
  const users = readJson(key, []);
  if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
    throw new Error('Email already registered');
  }
  users.push({ ...data, id: Date.now() });
  writeJson(key, users);
}

function loginUser(role, email, password) {
  const key = role === 'patient' ? STORAGE_KEYS.patients : STORAGE_KEYS.doctors;
  const users = readJson(key, []);
  const user = users.find(
    (u) =>
      u.email.toLowerCase() === email.toLowerCase() && u.password === password,
  );
  if (!user) throw new Error('Invalid credentials');
  const sessionKey =
    role === 'patient'
      ? STORAGE_KEYS.patientSession
      : STORAGE_KEYS.doctorSession;
  writeJson(sessionKey, {
    id: user.id,
    email: user.email,
    name: user.fullName || user.name || '',
  });
  return user;
}

function logout(role) {
  const sessionKey =
    role === 'patient'
      ? STORAGE_KEYS.patientSession
      : STORAGE_KEYS.doctorSession;
  localStorage.removeItem(sessionKey);
}

function currentUser(role) {
  const sessionKey =
    role === 'patient'
      ? STORAGE_KEYS.patientSession
      : STORAGE_KEYS.doctorSession;
  return readJson(sessionKey, null);
}

// Symptom logic
function evaluateSeverity(scores) {
  const values = Object.values(scores).map(Number);
  const avg = values.reduce((a, b) => a + b, 0) / Math.max(values.length, 1);
  if (avg < 3)
    return {
      level: 'mild',
      message: 'Symptoms appear mild. Consider self‑care tips below.',
    };
  if (avg < 6)
    return {
      level: 'moderate',
      message:
        'Moderate severity. Monitor closely and consider contacting a doctor.',
    };
  return {
    level: 'severe',
    message: 'High severity. Seek medical attention soon.',
  };
}

function saveSymptomEntry(entry) {
  const list = readJson(STORAGE_KEYS.symptomHistory, []);
  list.push({ ...entry, ts: new Date().toISOString() });
  writeJson(STORAGE_KEYS.symptomHistory, list);
}

// Page initializers (called per page)
const Page = {
  home() {
    createNavbar('home');
    createFooter();
  },
  symptom() {
    createNavbar('symptoms');
    createFooter();
    const form = document.getElementById('symptomForm');
    const result = document.getElementById('symptomResult');
    form?.addEventListener('input', () => {
      const outputs = form.querySelectorAll('[data-output]');
      outputs.forEach((out) => {
        const id = out.getAttribute('data-output');
        const input = form.querySelector(`#${id}`);
        if (input) out.textContent = input.value;
      });
    });
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const scores = {
        pain: Number(document.getElementById('pain').value),
        fatigue: Number(document.getElementById('fatigue').value),
        fever: Number(document.getElementById('fever').value),
        dizziness: Number(document.getElementById('dizziness').value),
      };
      const assessment = evaluateSeverity(scores);
      saveSymptomEntry({ scores, assessment });
      result.innerHTML = `
        <div class="card">
          <h3>Assessment: <span class="badge ${assessment.level === 'mild' ? 'success' : assessment.level === 'moderate' ? 'warn' : 'error'}">${assessment.level.toUpperCase()}</span></h3>
          <p>${assessment.message}</p>
          ${
            assessment.level === 'mild'
              ? `
            <ul class="list">
              <li class="list-item">Hydration: drink water regularly.</li>
              <li class="list-item">Rest and keep warm.</li>
              <li class="list-item">Over-the-counter pain relief if advised by your doctor.</li>
            </ul>`
              : `
            <div class="btn-row">
              <a class="button primary" href="${router.getUrls().findDoctors}">Find Nearby Doctors</a>
              <a class="button" href="tel:+1800123456">Call Helpline</a>
            </div>`
          }
        </div>`;
      showToast('Assessment updated', 'success');
    });
  },
  patientSignup() {
    createNavbar();
    createFooter();
    const form = document.getElementById('patientSignupForm');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      if (data.password !== data.confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
      }
      try {
        registerUser('patient', data);
        showToast('Registration complete', 'success');
        window.location.href = router.getUrls().patientLogin;
      } catch (err) {
        showToast(err.message || 'Registration failed', 'error');
      }
    });
  },
  patientLogin() {
    createNavbar();
    createFooter();
    const form = document.getElementById('patientLoginForm');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      try {
        loginUser('patient', data.email, data.password);
        showToast('Login successful', 'success');
        window.location.href = router.getUrls().symptomCheck;
      } catch (err) {
        showToast('Invalid credentials', 'error');
      }
    });
  },
  doctorSignup() {
    createNavbar();
    createFooter();
    const form = document.getElementById('doctorSignupForm');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      if (data.password !== data.confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
      }
      try {
        registerUser('doctor', data);
        showToast('Registration complete', 'success');
        window.location.href = router.getUrls().doctorLogin;
      } catch (err) {
        showToast(err.message || 'Registration failed', 'error');
      }
    });
  },
  doctorLogin() {
    createNavbar();
    createFooter();
    const form = document.getElementById('doctorLoginForm');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      try {
        loginUser('doctor', data.email, data.password);
        showToast('Login successful', 'success');
        window.location.href = router.getUrls().findDoctors;
      } catch (err) {
        showToast('Invalid credentials', 'error');
      }
    });
  },
  findDoctors() {
    createNavbar('find');
    createFooter();
    const stored = JSON.parse(localStorage.getItem('sc2_doctors') || '[]');
    const data = stored.length
      ? stored.map((d) => ({
          id: d.id,
          name: d.fullName,
          specialization: d.specialty || 'General',
          hospital: d.hospitalName || 'Hospital',
          phone: d.phone || '+000',
          address: d.location || '',
        }))
      : [
          {
            id: 1,
            name: 'Dr. Amina Bello',
            specialization: 'Hematologist',
            hospital: 'Lagos Teaching Hospital',
            phone: '+234 801 234 5678',
            address: 'Lagos',
          },
          {
            id: 2,
            name: 'Dr. John Smith',
            specialization: 'Pediatric Hematologist',
            hospital: 'Abuja Central Hospital',
            phone: '+234 802 555 0199',
            address: 'Abuja',
          },
          {
            id: 3,
            name: 'HopeCare Clinic',
            specialization: 'Emergency',
            hospital: 'Clinic',
            phone: '+234 805 111 2222',
            address: 'Port Harcourt',
          },
        ];
    const list = document.getElementById('doctorList');
    const q = document.getElementById('search');
    function isAvailable(id) {
      return (
        (localStorage.getItem(`sc2_doctor_status_${id}`) || 'offline') ===
        'available'
      );
    }
    function render(filter = '') {
      const f = (filter || '').toLowerCase();
      list.innerHTML = '';
      let items = data.filter((d) =>
        [d.name, d.specialization, d.hospital, d.address].some((x) =>
          (x || '').toLowerCase().includes(f),
        ),
      );
      const patSession = JSON.parse(
        localStorage.getItem('sc2_patient_session') || 'null',
      );
      if (patSession) {
        const patients = JSON.parse(
          localStorage.getItem('sc2_patients') || '[]',
        );
        const me = patients.find((p) => p.id === patSession.id);
        if (me && me.location) {
          const loc = me.location.toLowerCase();
          items = items.filter((d) =>
            (d.address || '').toLowerCase().includes(loc),
          );
        }
        items = items.filter((d) => isAvailable(d.id));
      }
      if (!items.length) {
        const none = document.createElement('div');
        none.className = 'helper';
        none.textContent = 'No available doctors match your search.';
        list.appendChild(none);
        return;
      }
      items.forEach((d) => {
        const li = document.createElement('div');
        li.className = 'list-item';
        li.innerHTML = `
          <strong>${d.name}</strong>
          <span class="helper">${d.specialization} · ${d.hospital}</span>
          <span>${d.address}</span>
          <div class="btn-row">
            <a class="button" href="tel:${d.phone.replace(/\s+/g, '')}">Call</a>
            <a class="button" target="_blank" href="https://www.google.com/maps/search/${encodeURIComponent(d.hospital + ' ' + d.address)}">View Location</a>
          </div>`;
        list.appendChild(li);
      });
    }
    render('');
    q?.addEventListener('input', (e) => render(e.target.value));
  },
  learn() {
    createNavbar('learn');
    createFooter();
  },
};

// Auto-init: pages set data-page attribute on body
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  const page = document.body.getAttribute('data-page');
  if (!page) {
    createNavbar();
    createFooter();
    return;
  }
  const fn = Page[page];
  if (typeof fn === 'function') fn();
  else {
    createNavbar();
    createFooter();
  }
});
