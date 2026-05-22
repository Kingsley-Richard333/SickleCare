/**
 * UNIFIED ROUTING SYSTEM
 * Fixes all relative path issues across the entire site
 * 
 * File Structure:
 * index.html (root)
 * ├── /html/pages/symptom-check.html
 * ├── /html/pages/find-doctors.html
 * ├── /html/pages/learn.html
 * ├── /auth/patient-login.html
 * ├── /auth/patient-signup.html
 * ├── /auth/doctor-login.html
 * ├── /auth/doctor-signup.html
 * ├── /dashboards/patient-dashboard.html
 * ├── /dashboards/doctor-list.html
 * └── /dashboards/doctor-dashboard.html
 */

class Router {
  constructor() {
    this.currentPath = window.location.pathname.replace(/\\/g, "/");
    this.isRoot = !this.currentPath.includes("/html/") && !this.currentPath.includes("/auth/") && !this.currentPath.includes("/dashboards/");
    this.isHtmlPage = this.currentPath.includes("/html/pages/");
    this.isAuthPage = this.currentPath.includes("/auth/");
    this.isDashboard = this.currentPath.includes("/dashboards/");
  }

  // Get relative path to root from current file
  getToRoot() {
    if (this.isRoot) return ".";
    if (this.isHtmlPage) return "../..";
    if (this.isAuthPage) return "..";
    if (this.isDashboard) return "..";
    return ".";
  }

  // Get relative path to /html from current file
  getToHtml() {
    if (this.isRoot) return "./html";
    if (this.isHtmlPage) return "..";
    if (this.isAuthPage) return "../html";
    if (this.isDashboard) return "../html";
    return "./html";
  }

  // Get relative path to /auth from current file
  getToAuth() {
    if (this.isRoot) return "./auth";
    if (this.isHtmlPage) return "../../auth";
    if (this.isAuthPage) return ".";
    if (this.isDashboard) return "../auth";
    return "./auth";
  }

  // Get relative path to /dashboards from current file
  getToDashboards() {
    if (this.isRoot) return "./dashboards";
    if (this.isHtmlPage) return "../../dashboards";
    if (this.isAuthPage) return "../dashboards";
    if (this.isDashboard) return ".";
    return "./dashboards";
  }

  // Get absolute URLs for navigation
  getUrls() {
    const root = this.getToRoot();
    const html = this.getToHtml();
    const auth = this.getToAuth();
    const dashboards = this.getToDashboards();

    return {
      // Main pages
      home: `${root}/index.html`,
      symptomCheck: `${html}/pages/symptom-check.html`,
      findDoctors: `${html}/pages/find-doctors.html`,
      learn: `${html}/pages/learn.html`,
      
      // Auth pages
      patientLogin: `${auth}/patient-login.html`,
      patientSignup: `${auth}/patient-signup.html`,
      doctorLogin: `${auth}/doctor-login.html`,
      doctorSignup: `${auth}/doctor-signup.html`,
      
      // Dashboards
      patientDashboard: `${dashboards}/patient-dashboard.html`,
      doctorDashboard: `${dashboards}/doctor-dashboard.html`,
      doctorList: `${dashboards}/doctor-list.html`,
    };
  }

  // Navigate with redirects
  navigate(page) {
    const urls = this.getUrls();
    if (urls[page]) {
      window.location.href = urls[page];
    }
  }
}

// Global router instance
const router = new Router();
