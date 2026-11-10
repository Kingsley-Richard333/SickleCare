import { Link } from "react-router-dom";
import { ORG } from "../config.js";

export default function Privacy() {
  return (
    <article className="wrap page prose">
      <h1>Privacy policy</h1>
      <p className="mins">Last updated {ORG.updated}</p>
      {ORG.draft && <p className="notice">Draft text. It must be reviewed by a lawyer before launch.</p>}

      <p>{ORG.name} helps people with sickle cell disease check symptoms, track their health, and reach doctors. Health information is private, so this page explains in plain words what we keep, who can see it, and what you can ask us to do.</p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account details:</strong> your name, email, and a password (stored in a scrambled form, so we cannot read it). Doctors also give a medical registration number.</li>
        <li><strong>Health details you add:</strong> genotype, blood group, allergies, medicines, your doctor, and an emergency contact.</li>
        <li><strong>Your diary and medicines:</strong> pain levels, where it hurts, triggers, mood, notes, medicine times, and which doses you ticked off.</li>
        <li><strong>Messages:</strong> what you send to a doctor and what they send back.</li>
        <li><strong>Appointments:</strong> the doctor, time, reason, status, and any note the doctor adds.</li>
      </ul>
      <p>The symptom checker does not save your answers. We do not use advertising or tracking tools.</p>

      <h2>Who can see it</h2>
      <ul>
        <li><strong>You</strong> can see everything you add.</li>
        <li><strong>A doctor</strong> can see the appointments booked with them: your name, the time, your reason, and their notes. They can see your health details, pain diary, and medicines only if you choose to share them with that doctor on the Sharing page. They can look but not change anything, and you can stop sharing at any time.</li>
        <li><strong>Administrators</strong> can see doctors' names, emails, and registration numbers, and overall counts. They cannot see patients' health records through the app.</li>
        <li><strong>Messages</strong> are visible only to you and the doctor in the conversation, and only while you are sharing your records with that doctor. If you stop sharing, the doctor can no longer see or send messages.</li>
        <li>We do not sell your information or share it for advertising.</li>
      </ul>

      <h2>Where it is kept</h2>
      <p>Your information is stored with our database provider, Supabase, the site is hosted by Netlify, and alert emails are sent through Resend. They process data for us under their own security measures. On your device, we save a copy of your emergency card, your light or dark choice, and the app itself so it works without internet. Log out on shared phones so the saved card is removed.</p>

      <h2>Why we use it</h2>
      <p>Only to run the service: sign you in, show your records back to you, send appointment requests to the doctor you choose, remind you about medicines, email you alerts about new messages, appointment updates, and doctor approval, and keep the platform safe. These emails never contain message text or health details. Your consent is asked for when you create an account.</p>

      <h2>How long we keep it</h2>
      <p>We keep your information until you delete your account. You can do this yourself on the Account page. When an account is deleted, its health details, diary, medicines, appointments, and messages are deleted with it. If we keep backups, copies in them are removed when the backups expire.</p>

      <h2>Your choices</h2>
      <p>You can download or delete your information yourself on the Account page, and turn email alerts off there. To correct something or withdraw your consent, update it in the app or email us at {ORG.email}. You can also complain to the data-protection authority in your country.</p>

      <h2>Children</h2>
      <p>Many people with sickle cell disease are children. If you are under 18, a parent or guardian should help you set up the account and agree to this policy for you.</p>

      <h2>Security</h2>
      <p>Data is sent over an encrypted connection, and each person can only open their own records. No online service is perfectly secure, so please use a strong password and keep it private. If we find a breach that affects you, we will tell you.</p>

      <h2>Changes</h2>
      <p>If we change this policy in a way that matters, we will tell you in the app. See also our <Link to="/terms">Terms of use</Link>.</p>

      <h2>Contact</h2>
      <p>{ORG.name}, {ORG.email}</p>
    </article>
  );
}
