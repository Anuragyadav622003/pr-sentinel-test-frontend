/**
 * GitHub App "Setup URL" landing page.
 *
 * After install/update, GitHub redirects here with:
 *   ?installation_id=...&setup_action=install|update&state=...
 *
 * Configure this path in your GitHub App settings:
 *   http://localhost:3001/github/setup   (local)
 *   https://<your-domain>/github/setup     (production)
 */
export { default } from "../installation/callback/page";
