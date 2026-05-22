// Minimal auth/session handling for two roles + shared navbar
const AUTH_KEYS = {
  patients: "sc2_patients",
  doctors: "sc2_doctors",
  patientSession: "sc2_patient_session",
  doctorSession: "sc2_doctor_session"
};

function readJSON(key, fallback){ try{ const v = localStorage.getItem(key); return v? JSON.parse(v): fallback; } catch { return fallback; } }
function writeJSON(key, v){ localStorage.setItem(key, JSON.stringify(v)); }

// Theme management
function initTheme() {
  const savedTheme = localStorage.getItem('sc_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  return savedTheme;
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('sc_theme', newTheme);
  return newTheme;
}

function getThemeIcon(theme) {
  return theme === 'dark' ? '☀️' : '🌙';
}

function buildNavbar(){
  const header = document.getElementById("navbar");
  if(!header) return;
  
  // Use the unified router for all paths
  const urls = router.getUrls();
  const patientSession = JSON.parse(localStorage.getItem('sc2_patient_session') || 'null');
  const doctorSession = JSON.parse(localStorage.getItem('sc2_doctor_session') || 'null');
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const themeIcon = getThemeIcon(currentTheme);
  
  const right = (!patientSession && !doctorSession)
    ? `<div class="row">
         <a class="button" href="${urls.patientLogin}">Patient</a>
         <a class="button" href="${urls.doctorLogin}">Doctor</a>
       </div>`
    : `<div class="row">
         <a class="button" href="${patientSession ? urls.patientDashboard : urls.doctorDashboard}">Dashboard</a>
         <button id="logoutBtn" class="button">Logout</button>
       </div>`;
  
  header.innerHTML = `
    <div class="nav-inner">
      <a class="brand" href="${urls.home}">
        <span class="brand-badge">SC</span>
        <span>SickleCare</span>
      </a>
      <button class="nav-toggle" aria-label="Open Menu">☰</button>
      <div class="nav-links">
        <nav class="row">
          <a class="button" href="${urls.symptomCheck}">Check Symptoms</a>
          <a class="button" href="${urls.findDoctors}">Find Doctors</a>
          <a class="button" href="${urls.learn}">Learn</a>
          <button class="theme-toggle" id="themeToggle" aria-label="Toggle theme">${themeIcon}</button>
        </nav>
        ${right}
      </div>
    </div>`;
  
  const btn = document.getElementById("logoutBtn");
  btn?.addEventListener("click", () => {
    localStorage.removeItem(AUTH_KEYS.patientSession);
    localStorage.removeItem(AUTH_KEYS.doctorSession);
    router.navigate('home');
  });
  
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const newTheme = toggleTheme();
      themeToggle.textContent = getThemeIcon(newTheme);
    });
  }
  
  // Hamburger menu toggle
  const navToggle = header.querySelector(".nav-toggle");
  const navLinks = header.querySelector(".nav-links");
  if (navToggle && navLinks) {
    const newToggle = navToggle.cloneNode(true);
    navToggle.parentNode.replaceChild(newToggle, navToggle);
    
    newToggle.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      const links = header.querySelector(".nav-links");
      if (links) {
        links.classList.toggle("open");
      }
    });
    
    const allLinks = navLinks.querySelectorAll("a, button");
    allLinks.forEach(link => {
      link.addEventListener("click", function() {
        navLinks.classList.remove("open");
      });
    });
  }
}

function registerPatient(data){
  const users = readJSON(AUTH_KEYS.patients, []);
  if(users.some(u => u.email.toLowerCase() === data.email.toLowerCase())) throw new Error("Email already registered");
  users.push({ ...data, id: Date.now() });
  writeJSON(AUTH_KEYS.patients, users);
}
function registerDoctor(data){
  const users = readJSON(AUTH_KEYS.doctors, []);
  if(users.some(u => u.email.toLowerCase() === data.email.toLowerCase())) throw new Error("Email already registered");
  users.push({ ...data, id: Date.now() });
  writeJSON(AUTH_KEYS.doctors, users);
}

function loginPatient(email, password){
  const users = readJSON(AUTH_KEYS.patients, []);
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if(!user) throw new Error("Invalid credentials");
  writeJSON(AUTH_KEYS.patientSession, { id:user.id, name:user.fullName, email:user.email });
}
function loginDoctor(email, password){
  const users = readJSON(AUTH_KEYS.doctors, []);
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if(!user) throw new Error("Invalid credentials");
  writeJSON(AUTH_KEYS.doctorSession, { id:user.id, name:user.fullName, email:user.email });
}

function currentPatient(){ return readJSON(AUTH_KEYS.patientSession, null); }
function currentDoctor(){ return readJSON(AUTH_KEYS.doctorSession, null); }

function toast(msg){
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(()=> t.remove(), 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  buildNavbar();
  const page = document.body.getAttribute('data-page');
  const urls = router.getUrls();
  
  // Patients
  if(page === 'patientSignup'){
    const form = document.getElementById('patientSignup');
    form?.addEventListener('submit', (e)=>{
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      try{ registerPatient(data); toast('Signup successful'); router.navigate('patientLogin'); }
      catch(err){ toast(err.message || 'Signup failed'); }
    });
  }
  if(page === 'patientLogin'){
    const form = document.getElementById('patientLogin');
    form?.addEventListener('submit', (e)=>{
      e.preventDefault();
      const { email, password } = Object.fromEntries(new FormData(form).entries());
      try{ loginPatient(email, password); toast('Login successful'); router.navigate('patientDashboard'); }
      catch{ toast('Invalid credentials'); }
    });
  }
  // Doctors
  if(page === 'doctorSignup'){
    const form = document.getElementById('doctorSignup');
    form?.addEventListener('submit', (e)=>{
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      try{ registerDoctor(data); toast('Signup successful'); router.navigate('doctorLogin'); }
      catch(err){ toast(err.message || 'Signup failed'); }
    });
  }
  if(page === 'doctorLogin'){
    const form = document.getElementById('doctorLogin');
    form?.addEventListener('submit', (e)=>{
      e.preventDefault();
      const { email, password } = Object.fromEntries(new FormData(form).entries());
      try{ loginDoctor(email, password); toast('Login successful'); router.navigate('doctorDashboard'); }
      catch{ toast('Invalid credentials'); }
    });
  }
});
