import { Link } from "react-router-dom";
import { ORG } from "../config.js";

export default function Terms() {
  return (
    <article className="wrap page prose">
      <h1>Terms of use</h1>
      <p className="mins">Last updated {ORG.updated}</p>
      {ORG.draft && <p className="notice">Draft text. It must be reviewed by a lawyer before launch.</p>}

      <div className="callout">
        <strong>In an emergency, do not use this app. Go to the nearest hospital.</strong>
        <p>Chest pain, trouble breathing, fever, sudden weakness, vision changes, or severe pain that medicine does not ease need urgent medical care.</p>
      </div>

      <h2>What {ORG.name} is, and is not</h2>
      <p>{ORG.name} gives general information and simple tools. It is not a doctor and does not give a diagnosis or treatment. The symptom checker and guides are a help, not a replacement for professional medical advice. Always follow your own doctor's plan, and get medical help if you are worried, whatever the app says.</p>

      <h2>Your account</h2>
      <ul>
        <li>Give true details and keep your password private. You are responsible for what happens under your account.</li>
        <li>If you are under 18, a parent or guardian must agree to these terms for you.</li>
        <li>Doctors must give a real medical registration number. We check it, and we may refuse or remove an account that is not genuine.</li>
      </ul>

      <h2>Appointments and doctors</h2>
      <p>An appointment request is not confirmed until the doctor confirms it. Doctors and clinics listed here are independent. We do not employ them and are not responsible for the care they give.</p>

      <h2>Messages</h2>
      <p>Messages are not for emergencies, and doctors are not required to reply within any set time. If you are very unwell, go to the hospital. You can only message doctors you are sharing your records with. Keep messages respectful and about care.</p>

      <h2>Using the service fairly</h2>
      <p>Do not misuse the service: do not try to see other people's records, give false information, pretend to be a doctor, or disrupt the app.</p>

      <h2>Reminders and availability</h2>
      <p>Medicine reminders are a convenience and may not always arrive, for example if your phone is off or notifications are blocked. Do not rely on them alone. We try to keep the service running but cannot promise it will always be available or error-free.</p>

      <h2>Responsibility</h2>
      <p>We work hard to give accurate information, but we cannot promise it is complete or right for your situation. To the extent the law allows, {ORG.name} is not responsible for harm that comes from relying on the app instead of seeking medical care.</p>

      <h2>Changes and ending</h2>
      <p>We may update these terms and will tell you about important changes. You can stop using the app and ask us to delete your account at any time. How we handle your information is in our <Link to="/privacy">Privacy policy</Link>.</p>

      <h2>Contact</h2>
      <p>{ORG.name}, {ORG.email}</p>
    </article>
  );
}
