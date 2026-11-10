# Sicklecare launch checklist

Everything that can be built is built. What is left needs a person: a reviewer, an account, or a decision.
Tick each box in order.

## A. People must check the content (nothing goes live before these)
- [ ] A doctor reviews the symptom checker: the questions in `src/i18n/en.js` (keys starting `sc.`) and the thresholds in `src/lib/assess.js`. If they change a rule, update `tests/assess.test.js` and run `npm test`.
- [ ] A doctor reviews the Learn guides (`src/data/articles.js`), the pain-slider messages (`pain.*`), and the emergency card wording (`src/pages/Card.jsx`).
- [ ] A lawyer reviews the privacy policy and terms (`src/pages/Privacy.jsx`, `Terms.jsx`) for the countries you serve. Then set `draft: false` in `src/config.js` and add your contact email.
- [ ] Confirm the emergency number: it is `EMERGENCY_NUMBER` (currently 112) at the top of `src/pages/SymptomCheck.jsx`. Check it is right for every country you serve.
- [ ] A fluent speaker AND a medical professional check French and Spanish. Then set `reviewed: true` in `src/i18n/fr.js` and `es.js`, or remove a language until it is checked.
- [ ] Decide how you will verify doctors' registration numbers (for example with the national medical council) before you click Approve.
- [ ] A security professional reviews the database rules in `supabase/setup.sql` before real health records go in.

## B. Set it up (in this order)
- [ ] Supabase: create a project. Choose a plan with backups.
- [ ] SQL Editor: paste and run `supabase/setup.sql` once. (Project that ran the older separate files? Run `supabase/fixes.sql` instead.)
- [ ] Resend (or another email service): create an account, verify your own domain, create an API key.
- [ ] Edge Functions: deploy `notify` (JWT verification OFF) and `delete-account` (JWT verification ON). Add secrets WEBHOOK_SECRET, RESEND_API_KEY, MAIL_FROM, SITE_URL.
- [ ] Edit `supabase/notifications.sql` (project reference and the same secret) and run it. Do not publish the edited copy.
- [ ] Supabase Authentication: set Site URL and Redirect URLs to your live address; use your own email sender (SMTP); turn on CAPTCHA and keep the built-in rate limits; set a minimum password length of 8 or more.
- [ ] Netlify: deploy with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The `_headers` file adds the security headers. After deploying, open the site and check there are no errors in the browser console.
- [ ] Sign up with your own email, then in SQL Editor: `update public.profiles set role = 'admin' where email = 'you@example.com';`
- [ ] Admin page: add real doctors and hospitals to the directory.

## C. Test (use real phones, and at least two patient accounts)
- [ ] Run `npm test` on your computer. All tests should pass.
- [ ] Sign-up, email confirmation, log in, log out, for patient and doctor.
- [ ] Patient A cannot see anything of patient B: diary, medicines, card, appointments, messages.
- [ ] Doctor sees a patient ONLY after the patient shares, and loses access the moment sharing stops.
- [ ] Booking: request, confirm, decline, cancel. Messaging both ways. Email alerts arrive.
- [ ] Patient sees a doctor's visit on "Who has looked at my records".
- [ ] Download my data works. Delete my account works and removes everything.
- [ ] Symptom checker: try one answer set for each of the three results, in each language.
- [ ] Install on Android (Chrome) and iPhone (Safari, Add to Home Screen). Turn data off and check the symptom checker and emergency card still open.

## D. Pilot, then launch
- [ ] Invite a small group: a few patients and one or two doctors. Ask them what confused them.
- [ ] Fix what they find, then widen the invitation gradually.
- [ ] Decide who answers support emails and who handles privacy requests.
- [ ] Optional now, later if you want the stores: build the phone apps (`MOBILE.md`).

## Not built (decide later)
- Phone push notifications for messages (email alerts exist).
- Translating the Learn guides, privacy policy, terms, and signed-in pages. Translate these AFTER the English text has been reviewed, so reviewers do not have to check three versions that keep changing.
