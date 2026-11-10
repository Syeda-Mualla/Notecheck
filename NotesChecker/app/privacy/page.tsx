export default function PrivacyPage() {
  return (
    <main style={{
      maxWidth: 800, margin: "40px auto",
      padding: 24, fontFamily: "Arial, sans-serif",
      lineHeight: 1.7
    }}>
      <h1>NDIS Notes Checker — Privacy Policy</h1>
      <p>Last updated: 17 October 2026</p>

      <h2>Information we process</h2>
      <p>
        We process your Google account information for sign-in,
        including your name and email address. We also process
        participant profiles, goals, instructions, session dates,
        times and notes entered or generated in the application.
      </p>

      <h2>How information is used</h2>
      <p>
        Information is used to provide sign-in, save and retrieve
        drafts, generate and review notes, check session times,
        and export documents when you request it.
      </p>

      <h2>Service providers</h2>
      <p>
        Supabase provides authentication and database storage.
        Google Gemini processes the content sent for AI generation
        and review, including relevant goals, instructions and notes.
        MilesWeb hosts the application. These providers process
        information under their applicable terms and privacy policies.
      </p>

      <h2>Google Drive access</h2>
      <p>
        When you choose to export, the application requests Google
        Drive permission to create a Google Doc containing your
        selected draft. Exported documents are stored in the Google
        account you authorise. You can revoke the application's
        access through your Google Account settings.
      </p>

      <h2>Storage and deletion</h2>
      <p>
        Saved drafts are stored so you can return to them later.
        To request deletion of your account or saved application
        data, contact the email below. Exported Google Docs are
        managed separately through your Google Drive. Revoking
        Google access does not automatically delete saved drafts.
      </p>

      <h2>Your responsibilities</h2>
      <p>
        Only enter information you are authorised to share and
        process. Review AI-generated content for accuracy before use.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy enquiries and deletion requests:
        {" "}
        <a href="mailto:syedamualla@gmail.com">
          syedamualla@gmail.com
        </a>
      </p>

      <a href="/">Back to NDIS Notes Checker</a>
    </main>
  );
}