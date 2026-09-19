# CargoGuard branding and repository hygiene

Product: **CargoGuard**. Full title: **CargoGuard | Shipping Document Verification**.

Evidence-backed shipping document verification for the Averis × Monash Hackathon 2026

## Presentation changes

- Browser title and description now use the final title and tagline; application metadata identifies CargoGuard. Removed the development-preview metadata marker.
- Navigation brand subtitle now reads “DOCUMENT VERIFICATION”. Dashboard heading reads “Shipping Document Verification”, with the exact competition tagline. Footer uses the final full title. Navigation routes, actions, loading/error behavior, and all case calculations are unchanged.
- The existing shield favicon now has an accessible CargoGuard name. There is no web manifest to rename.
- README uses the final full title and tagline, clear live-demo links, portable setup instructions, and explicit naming/domain recommendations. Removed machine-specific development-workspace commands.
- Package name was already `cargoguard`; added the final tagline as its description. Dependency versions and the lockfile are unchanged.
- Local deployment resource labels use `cargoguard-d1` and `cargoguard-r2`; the logical DB binding and database ID are unchanged. The local-only database ID is a deliberate Wrangler development value, replaced by the hosting service for production.
- Removed the unused authentication helper, two unused D1 example files, three unreferenced starter SVGs, and an empty configuration placeholder comment. No application imports referenced these files.

## Intentionally retained

`.openai/hosting.json` is **required and retained**. Vite imports it, the Sites build plugin packages it with migrations, and the deployment service uses its project identity and logical D1 binding. It contains no credentials. Removing it would break this deployment flow.

The hosting plugin's upstream attribution, MIT license, authentication protocol paths, and platform environment-variable name remain accurate technical references. They are not CargoGuard product branding. The existing public hostname is a working hosting address and remains unchanged. The ignored development-tool directories remain in `.gitignore` to prevent accidental publication.

Reusable UI library source and its upstream license remain; they do not introduce platform names into CargoGuard pages. No dependency upgrade or general UI rewrite is included. Empty `.env.example` variable declarations document optional integrations, not live secrets. Localhost addresses remain only where they explain local setup, evaluation endpoints, test defaults, or historical verification; judges' live-demo links use public HTTPS.

All official evaluation response files, run records, provenance hashes, and prior deployment JSON records are preserved byte for byte. Historical local paths and deployment IDs remain evidence of the recorded runs rather than being retroactively rebranded. The optional external AI adapter remains accurately described as unconfigured; production uses the evaluated local engine.

## Naming and domain recommendation

Recommended GitHub repository name: **`cargoguard`**. The existing `forlorinna/CargoGuard-AI` remote remains connected so published source links continue to work; this pass does not rename the hosted repository.

For the competition, use the verified [current public demo](https://cargoguard-shipping-verify.xiongrunxin.chatgpt.site). A future provider-independent address should be `cargoguard` under a domain the team owns. No ownership or availability of a new domain is implied, and the working production URL is not sacrificed for cosmetic naming.
