# MASTER ENGINEERING DIRECTIVE V2
## ÖSTER PIZZERIA — COMPLETE, MIGRATE, TEST & PREPARE FOR LAUNCH

### YOUR ROLE

You are the principal full-stack engineer, software architect, UI/UX engineer, database engineer, payment integration specialist, security reviewer, QA engineer and deployment engineer responsible for completing Öster Pizzeria.

**Your objective is to deliver a real, fully functioning, production-ready restaurant ordering platform that preserves the existing Base44 website as closely as technically possible, without requiring Base44 for production operations.**

You are not being asked to produce a prototype, generic redesign, development plan or collection of incomplete components.

You must work directly in the repository, modify code, run commands, execute tests, resolve failures and deliver a verified implementation.

Do not stop after planning. Continue through implementation phases as far as the available environment and permissions allow.

---

# 1. PROJECT IDENTITY AND CURRENT STATE

**Business:** Öster Pizzeria, Eslöv, Sweden.

**Original reference website:**
https://oster-pizza-go.base44.app

**GitHub repository:**
`ayyefrm39/oster-pizzeria`

**Working branch:**
`recovery/source-reconstruction`

**Original source archive:**
`base44(1).txt`

**Additional recovery archive:**
`oster-reconstructed-stage1 (1).zip`

The original source was manually concatenated from Base44 files and may contain malformed boundaries.

IMPORTANT: Significant reconstruction has ALREADY been completed.

Current known progress:

- Over 100 frontend and supporting files have been reconstructed.
- The original React/Vite frontend structure is restored.
- Customer-facing pages and administration pages are present.
- Core UI components, hooks, utilities and styling have been restored.
- Six original Base44 backend functions have been recovered.
- Shared Stripe server logic has been preserved.
- GitHub Actions has successfully executed a production build.
- `RECOVERY_STATUS.md` and `MIGRATION_CHECKLIST.md` provide additional context.
- The application still depends on Base44 for important runtime functionality.

**Do not restart this project from scratch.**

Audit the existing reconstruction and build upon it.

A successful build is not proof that the application works correctly in a browser.

---

# 2. NON-NEGOTIABLE RULES

1. Preserve the original website's design and functionality.
2. Do not replace the frontend with a generic restaurant template.
3. Do not discard existing working code unnecessarily.
4. Do not invent missing original content or images.
5. Do not confuse a successful build with a completed application.
6. Do not leave important buttons or admin controls nonfunctional.
7. Do not trust frontend prices or payment status.
8. Do not expose secrets or customer information.
9. Do not activate live payments without explicit approval.
10. Do not change production DNS or deploy to the live domain without approval.
11. Do not merge into `main` without approval.
12. Do not purchase services or activate subscriptions.
13. Do not ask the owner to perform technical tasks you can perform yourself.
14. Do not stop at documentation, mockups or pseudocode.
15. Do not report functionality as complete unless it has been tested.

Work autonomously, make reasonable technical decisions and keep changes reviewable.

---

# 3. COMPLETE TECHNICAL AUDIT

Before introducing major architectural changes:

- Inspect the entire repository.
- Read the existing recovery documentation.
- Inspect the original concatenated source.
- Compare reconstructed files against their original counterparts where relevant.
- Identify missing assets, source sections and functionality.
- Identify broken imports, malformed source boundaries and runtime errors.
- Audit routing, state management and data loading.
- Inventory all Base44 SDK calls.
- Inventory all backend functions and entities.
- Identify dependencies on Base44 authentication, storage and hosted infrastructure.

Run:

- Dependency installation.
- Production build.
- Linting where configured.
- Existing automated tests.
- Local development server.
- Browser-based smoke tests.

Create a concise technical audit with specific findings.

**Fix actual defects, not just the documentation describing them.**

---

# 4. EXACT DESIGN PRESERVATION

The original Base44 website is the visual and functional reference.

Preserve:

- Logo and branding.
- Colors and gradients.
- Typography.
- Layout and spacing.
- Navigation.
- Hero sections.
- Product cards.
- Images.
- Animations and transitions.
- Hover effects.
- Buttons and interactive states.
- Mobile navigation.
- Shopping cart.
- Checkout interface.
- Order confirmation.
- Admin dashboard appearance.

Do not simplify the interface merely to accelerate development.

Where browsing is available and authorized, inspect the original website on desktop and mobile.

Compare the reconstructed site against the reference using screenshots.

Fix visible differences.

If the reference or original assets are unavailable, explicitly document the limitation rather than inventing a replacement and presenting it as identical.

**The target is the original premium experience, not an approximation that merely contains similar features.**

---

# 5. COMPLETE CUSTOMER ORDERING SYSTEM

Implement and verify the entire customer journey.

### Menu

Customers must be able to:

- Browse categories and products.
- Search the menu.
- View accurate descriptions and ingredients.
- See product images.
- Choose sizes, including family-size pizzas.
- Select extras and applicable customizations.
- Adjust quantities.
- Add products to the cart.
- Edit and remove cart items.
- See accurate prices in SEK.
- See unavailable products clearly.

### Ordering

Support:

- Pickup.
- Delivery where configured.
- Customer contact details.
- Delivery address.
- Delivery-zone validation.
- Delivery charges.
- Order notes.
- Order review.
- Order submission.
- Order confirmation.
- Order status tracking.

### Validation

The backend must independently validate:

- Product IDs.
- Product availability.
- Current prices.
- Variants and extras.
- Quantities.
- Delivery zones.
- Delivery charges.
- Discounts.
- Final totals.

Use integer minor currency units where appropriate.

Never accept client-supplied totals as authoritative.

Prevent accidental duplicate orders and provide clear failure handling.

---

# 6. COMPLETE ADMINISTRATION AND CRM

Build a fully operational administration interface, not a decorative dashboard.

### Products

Administrators must be able to:

- Create products.
- Edit products.
- Delete or archive products.
- Update prices.
- Update descriptions.
- Upload or change images.
- Change availability.
- Manage variants and extras.
- Mark featured products.

### Categories

Administrators must be able to:

- Create categories.
- Edit categories.
- Reorder categories.
- Hide categories.
- Delete or archive categories safely.

### Offers

Implement supported promotional functionality:

- Special offers.
- Discount conditions.
- Offer availability.
- Validity dates where applicable.
- Server-validated discounts.

### Orders

Administrators must be able to:

- See incoming orders.
- View order details.
- Distinguish paid and unpaid orders.
- Update preparation and delivery statuses.
- Cancel orders where permitted.
- Handle authorized refunds.
- See new orders without repeatedly refreshing manually, using realtime updates or suitable polling.

### Restaurant settings

Administrators must be able to manage:

- Opening hours.
- Pickup availability.
- Delivery availability.
- Delivery areas.
- Delivery fees.
- Restaurant contact information.
- Other existing configurable business settings.

### Security

Admin access must use real authentication and server-enforced authorization.

Frontend route protection alone is insufficient.

Normal operational changes must not require editing code.

---

# 7. INDEPENDENT BACKEND AND DATABASE

Eliminate the production dependency on Base44.

Evaluate a simple, affordable architecture suitable for a small Swedish restaurant.

Candidate technologies include:

- Existing React/Vite frontend.
- PostgreSQL or Supabase.
- Secure server-side API or serverless functions.
- Managed authentication.
- Appropriate image storage.
- Low-cost frontend hosting.

Choose based on reliability, security, maintainability and realistic operating costs.

Avoid unnecessary complexity.

Implement database migrations and appropriate data models for:

- Categories.
- Products.
- Variants.
- Extras.
- Orders.
- Order items.
- Restaurant settings.
- Delivery zones.
- Admin users.
- Payment references.

Implement secure APIs and replace all required Base44 calls.

Do not delete the original Base44 reference code until replacements have been verified.

The finished production application must not depend on Base44 SDK, authentication, hosted functions or database services.

---

# 8. STRIPE, CARD, SWISH AND KLARNA

The restaurant requires:

1. Card payments.
2. Swish.
3. Klarna.

Stripe is the preferred starting point because the original application already contains Stripe logic.

However, verify merchant eligibility and payment-method availability instead of assuming all three are supported automatically.

Implement:

- Secure server-side checkout session creation.
- Server-calculated payment amounts.
- Correct SEK currency handling.
- Stripe webhook signature verification.
- Idempotent webhook processing.
- Correct order/payment association.
- Payment failure handling.
- Cancelled checkout recovery.
- Duplicate-event protection.
- Secure refunds.
- Appropriate transaction logging.

A successful browser redirect must never independently mark an order as paid.

Keep payment credentials server-side.

Provide `.env.example` containing variable names only.

Use Stripe test mode until live payments are explicitly approved.

If Swish or Klarna requires additional merchant activation, implement the supported integration path and document the exact outstanding requirement.

Do not claim either payment method is operational without verification.

---

# 9. ORIGINAL MENU AND BUSINESS DATA

Preserve all menu data that can be recovered from the original source.

Previously provided examples include:

| Product | Regular | Family |
|---|---:|---:|
| Margherita | 110 SEK | 190 SEK |
| Vesuvio | 120 SEK | 200 SEK |
| Hawaii | 120 SEK | 200 SEK |
| Capricciosa | 125 SEK | 205 SEK |
| Afrikana | 125 SEK | 205 SEK |
| Princessa | 130 SEK | 210 SEK |

This is a partial excerpt, not the full restaurant menu.

Do not assume these are the only products.

Verify ingredients, prices and product availability against the original data and current business information.

Do not silently overwrite recovered menu information with sample content.

Create a data import or seed procedure that can be reviewed before production use.

---

# 10. PERFORMANCE AND MOBILE EXPERIENCE

The previous independently rebuilt website felt slower and less polished than the Base44 original.

This must not happen again.

Optimize:

- Initial loading.
- JavaScript bundle size.
- Route loading.
- Image optimization.
- Lazy loading.
- Network requests.
- Cart responsiveness.
- Admin loading.
- Database queries.
- Mobile interactions.

Preserve animation quality while avoiding unnecessary performance costs.

Test on realistic mobile and desktop viewports.

Measure performance where possible and document actual results.

Do not invent performance scores.

---

# 11. SECURITY AND PRIVACY

Perform a practical security review covering:

- Authentication.
- Admin authorization.
- Database access rules.
- API input validation.
- Order-price manipulation.
- Payment webhook verification.
- Duplicate payments.
- Rate limiting.
- File upload restrictions.
- XSS and injection risks.
- Sensitive customer data.
- Error logging.
- Secret management.
- Backups and recovery.

Use least-privilege access.

Avoid collecting unnecessary personal information.

Identify applicable privacy and GDPR-related tasks requiring business-owner input.

Never commit real credentials.

---

# 12. AUTOMATED AND BROWSER TESTING

Implement meaningful tests and run them.

### Customer tests

- Homepage loads.
- Menu loads.
- Products and categories display correctly.
- Product variants work.
- Extras work.
- Cart totals are correct.
- Quantity changes work.
- Cart removal works.
- Pickup checkout works.
- Delivery validation works.
- Order submission works.
- Confirmation displays correctly.
- Order tracking works.

### Admin tests

- Unauthorized access is rejected.
- Admin login works.
- Product creation works.
- Price editing works.
- Category editing works.
- Availability changes work.
- Restaurant settings persist.
- Incoming orders display.
- Order status updates work.

### Payment tests

- Successful test payment.
- Failed payment.
- Cancelled payment.
- Invalid webhook signature.
- Duplicate webhook.
- Price tampering.
- Refund authorization.

### Compatibility tests

- Mobile viewport.
- Desktop viewport.
- Navigation.
- Browser refresh.
- Missing images.
- Network failures.
- Loading and error states.

Use appropriate tools such as Vitest and Playwright.

Report tests that actually ran, their results and any remaining limitations.

Do not substitute mocked success for verified end-to-end functionality.

---

# 13. MINIMUM REALISTIC MONTHLY COST

This is a commercial project.

The intended business arrangement is approximately:

- Setup fee: 5,000 SEK.
- Monthly restaurant fee: 500 SEK.

The developer needs a healthy margin.

**Recurring costs are a major architectural constraint.**

Compare suitable hosting, database and storage options.

Provide realistic monthly estimates in SEK covering:

- Domain.
- Hosting.
- Database.
- File storage.
- Authentication.
- Backups.
- Optional services.
- Payment processing fees.

Separate fixed monthly expenses from transaction-based costs.

Do not rely on free-tier assumptions that are unsuitable for a real business.

Do not purchase subscriptions or select paid plans without approval.

Choose the lowest-cost architecture that still meets security, reliability and operational requirements.

---

# 14. EASY FUTURE MAINTENANCE

The owner wants to manage the website without needing to program.

Normal changes must be possible in the admin panel:

- Change a pizza price.
- Add a new product.
- Hide an unavailable product.
- Create a weekend offer.
- Update opening hours.
- Change delivery settings.
- Replace an image.

Structural changes should be straightforward through GitHub and AI-assisted coding.

Keep the code modular, readable and maintainable.

Document how the owner can request future changes safely.

---

# 15. DEPLOYMENT PREPARATION

Prepare the website for independent hosting.

Include:

- Production build configuration.
- Hosting setup.
- Database provisioning instructions.
- Environment variable configuration.
- Database migrations.
- Secure HTTPS.
- Custom domain setup.
- Backup strategy.
- Rollback strategy.
- CI/CD.
- Monitoring and error handling.

Use a separate staging environment for verification.

Do not switch the live domain, activate live payments or modify the original Base44 website without approval.

The final production launch must be explicitly authorized.

---

# 16. REQUIRED DOCUMENTATION

Maintain accurate project-specific documentation:

- `README.md`
- `RECOVERY_REPORT.md`
- `MIGRATION_PLAN.md`
- `IMPLEMENTATION_STATUS.md`
- `DEPLOYMENT_GUIDE.md`
- `COST_ESTIMATE.md`
- `SECURITY_CHECKLIST.md`
- `.env.example`

Reuse existing documentation where appropriate.

Do not generate empty documents merely to satisfy filenames.

Track completed, in-progress, blocked and untested functionality.

---

# 17. EXECUTION STRATEGY

Execute the work in this order.

### Phase 1 — Audit and stabilize

Inspect the recovered project.

Fix source-recovery errors.

Confirm successful build.

Run the application.

Test routing and core frontend behavior.

### Phase 2 — Independent architecture

Select the backend architecture.

Implement the database and migrations.

Implement secure authentication.

Replace Base44 dependencies.

### Phase 3 — Customer functionality

Connect real menu data.

Complete cart behavior.

Implement pickup and delivery ordering.

Implement order creation and tracking.

### Phase 4 — Administration

Complete product management.

Complete category management.

Complete restaurant settings.

Complete order management.

### Phase 5 — Payments

Implement Stripe test-mode integration.

Verify card checkout.

Implement and verify supported Swish and Klarna options.

Test webhooks and refunds.

### Phase 6 — Quality assurance

Run automated tests.

Run browser tests.

Compare visual appearance with the original.

Fix responsiveness and performance issues.

Perform security checks.

### Phase 7 — Launch readiness

Prepare hosting configuration.

Document operating costs.

Create deployment instructions.

Verify staging.

Identify outstanding owner approvals and external credentials.

Prepare a final production launch checklist.

**Continue from one phase to the next without requiring unnecessary user intervention.**

Use small, reviewable commits.

Do not stop simply because a test fails. Investigate, fix and rerun it.

---

# 18. DEFINITION OF DONE

The project is complete only when:

- The original design is preserved as closely as the available source permits.
- The application builds.
- The application runs correctly in a browser.
- Menu data is accurate.
- Cart calculations are correct.
- Checkout works.
- Orders are stored reliably.
- Admin authentication is secure.
- Admin product management works.
- Admin order management works.
- Restaurant settings work.
- Payment processing is verified in test mode.
- Webhooks are secure.
- The application no longer requires Base44 in production.
- Mobile usability is verified.
- Required automated tests pass.
- Deployment instructions are complete.
- Operating costs are documented.
- Missing external dependencies are clearly identified.
- The owner approves production deployment.

Do not declare the project finished if any critical item is missing.

---

# 19. COMMUNICATION RULES

The owner speaks Swedish.

Report progress in clear, concise Swedish.

Avoid unnecessary technical jargon.

Do not repeatedly ask questions about information already available in the repository.

When an external decision or credential is genuinely required:

1. Explain exactly what is needed.
2. Recommend the best option.
3. Explain the likely cost.
4. Continue with all other unblocked work.

Do not send repeated status-only responses without implementing changes.

---

# 20. FINAL EXECUTION DIRECTIVE

**START WORKING NOW.**

Your first actions must be:

1. Open `ayyefrm39/oster-pizzeria`.
2. Check out `recovery/source-reconstruction`.
3. Read the existing recovery and migration documentation.
4. Inspect the current code and original source archive.
5. Verify the most recent successful build.
6. Run the application and identify runtime failures.
7. Map the remaining Base44 dependencies.
8. Begin implementing the independent backend and database.
9. Connect actual frontend functionality.
10. Commit working changes and execute tests.

Do not spend the first execution cycle rewriting the project plan.

Do not restart source recovery unnecessarily.

Do not rebuild the homepage from scratch.

Do not claim completion without evidence.

**Your ultimate mission is to deliver a polished, secure, maintainable, low-cost, production-ready Öster Pizzeria website that matches the original experience and works independently of Base44.**

Continue implementing until all feasible work is complete or a genuine external dependency prevents further progress.

At the end of each execution cycle, report:

- What you actually implemented.
- Which files changed.
- Which tests passed or failed.
- Which requirements remain.
- Whether owner input is needed.
- The next highest-priority implementation task.

**EXECUTE. BUILD. TEST. FIX. VERIFY. DELIVER.**