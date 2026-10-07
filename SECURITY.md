# Website deployment and verification

This is a static website with no accounts, database or email delivery server. The enquiry form opens a draft in the visitor's email application; the visitor must send it. There are no API keys or credentials in the client code.

## Hosting

Serve the site over HTTPS. `_headers` supplies CSP, frame protection, MIME sniffing protection, a referrer policy, restricted device permissions and HSTS for hosts that support this file (including Netlify/Cloudflare Pages). On other hosts, configure the same HTTP response headers in the host settings. The HTML CSP applies resource restrictions even without `_headers`, but iframe protection and HSTS require response headers. Do not assume these response headers are active merely because the file exists.

The CSP permits only local scripts/images and Google's font stylesheet/font endpoints. No tracking or analytics scripts are installed. External fonts load only after consent. New third-party resources require a deliberate policy and consent review.

The consent cookie records a non-sensitive preference for 180 days, with SameSite=Lax and Secure on HTTPS; JavaScript reads it, so it is intentionally not HttpOnly. Essential cookie storage has a localStorage fallback. This is not an authentication cookie. The cookie path is `/`; publish at the site root.

## Enquiries

The site consistently uses infinitetechnologysolutions6@gmail.com, as confirmed by the business owner. Confirm that this business mailbox is monitored before publishing. Configure a verified server-side mail provider if automatic delivery is required; use server-side validation, rate limiting and a spam honeypot, and keep provider credentials off the browser. Never claim delivery based on opening a mailto draft. Local validation and message lengths improve the current draft experience but cannot verify a recipient mailbox.

## Final live checks

Verify the actual response headers and TLS on the production URL. Test one genuine draft from a configured mail application and confirm receipt with the business owner. Phone/WhatsApp/map links are outbound links, not integrations that this static site can confirm remotely. Test consent accept/reject, cross-page persistence, withdrawal, keyboard navigation and mobile layouts on the live origin.

## Repeat the local browser audit

Install Playwright in a development environment, then run `node tests/browser-audit.cjs`. Set `CHROME_PATH` to an installed Chrome executable if Playwright's browser binaries are unavailable; set `NODE_PATH` if the package was installed outside this repository. The test serves local files through Playwright routing at a synthetic HTTPS origin, applies the configured CSP, and stubs external font responses. It checks local functionality without calling anyone or sending email. It does not establish that production hosting headers, Google Fonts availability or mailbox delivery work.

Final local audit: seven site pages at 375, 768, 1024 and 1440 pixels; image and background decoding; local link destinations and anchors; responsive menu/dropdown and Escape behavior; all project filter categories; cookie preferences, secure consent cookie, persistence and withdrawal; required/invalid email form validation and encoded draft creation. No JavaScript or CSP errors and no horizontal overflow were found. Photography credits also use an external local stylesheet compatible with the CSP.

Implementation references: [MDN CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy), [frame-ancestors header requirement](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors), and [cookie configuration](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/Cookies).
