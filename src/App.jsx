import { Routes, Route } from "react-router-dom";
import Layout from "./Layout.jsx";
import Home from "./pages/Home.jsx";
import ComingSoon from "./pages/ComingSoon.jsx";
import SymptomCheck from "./pages/SymptomCheck.jsx";
import FindDoctors from "./pages/FindDoctors.jsx";
import Learn from "./pages/Learn.jsx";
import Article from "./pages/Article.jsx";
import Login from "./pages/Login.jsx";
import PatientDashboard from "./pages/PatientDashboard.jsx";
import DoctorDashboard from "./pages/DoctorDashboard.jsx";
import Diary from "./pages/Diary.jsx";
import Card from "./pages/Card.jsx";
import Medicines from "./pages/Medicines.jsx";
import Appointments from "./pages/Appointments.jsx";
import Admin from "./pages/Admin.jsx";
import Privacy from "./pages/Privacy.jsx";
import Sharing from "./pages/Sharing.jsx";
import DoctorPatients from "./pages/DoctorPatients.jsx";
import PatientView from "./pages/PatientView.jsx";
import Messages from "./pages/Messages.jsx";
import Account from "./pages/Account.jsx";
import Terms from "./pages/Terms.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="symptom-check" element={<SymptomCheck />} />
        <Route path="find-doctors" element={<FindDoctors />} />
        <Route path="learn" element={<Learn />} />
        <Route path="learn/:slug" element={<Article />} />
        <Route path="patient-login" element={<Login role="patient" />} />
        <Route path="patient" element={<ProtectedRoute role="patient"><PatientDashboard /></ProtectedRoute>} />
        <Route path="patient/diary" element={<ProtectedRoute role="patient"><Diary /></ProtectedRoute>} />
        <Route path="patient/card" element={<ProtectedRoute role="patient"><Card /></ProtectedRoute>} />
        <Route path="patient/medicines" element={<ProtectedRoute role="patient"><Medicines /></ProtectedRoute>} />
        <Route path="patient/appointments" element={<ProtectedRoute role="patient"><Appointments /></ProtectedRoute>} />
        <Route path="admin" element={<ProtectedRoute role="admin"><Admin /></ProtectedRoute>} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="patient/sharing" element={<ProtectedRoute role="patient"><Sharing /></ProtectedRoute>} />
        <Route path="doctor/patients" element={<ProtectedRoute role="doctor"><DoctorPatients /></ProtectedRoute>} />
        <Route path="doctor/patients/:id" element={<ProtectedRoute role="doctor"><PatientView /></ProtectedRoute>} />
        <Route path="patient/messages" element={<ProtectedRoute role="patient"><Messages /></ProtectedRoute>} />
        <Route path="doctor/messages" element={<ProtectedRoute role="doctor"><Messages /></ProtectedRoute>} />
        <Route path="account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="doctor-login" element={<Login role="doctor" />} />
        <Route path="doctor" element={<ProtectedRoute role="doctor"><DoctorDashboard /></ProtectedRoute>} />
        <Route path="*" element={<ComingSoon title="Page not found" text="That page doesn't exist. Use the menu to find what you need." />} />
      </Route>
    </Routes>
  );
}
