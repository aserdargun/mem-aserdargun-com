# Azure deployment contract

- Repository: `aserdargun/mem-aserdargun-com`
- Production branch: `main`
- Subscription: `aserdargun subscription 4` (`a78f5745-b16b-415a-aaf9-9cfd5d19c6a3`), explicitly passed to Azure CLI commands
- Resource group: `rg-mem-aserdargun-com`
- Static Web App: `swa-mem-aserdargun-com`
- Location / SKU: West Europe / **Free**
- Generated URL: https://yellow-pebble-060d84e03.1.azurestaticapps.net
- Artifact: `dist/`
- Workflow: `.github/workflows/deploy-swa-mem-aserdargun-com.yml`
- GitHub Actions secret: `AZURE_STATIC_WEB_APPS_API_TOKEN_SWA_MEM_ASERDARGUN_COM`
- Concurrency: `swa-mem-aserdargun-com-production`, in-progress deploys are not cancelled
- Public URL: https://mem.aserdargun.com/
- Domain verification: on 2026-09-21, both the custom domain and generated hostname returned HTTPS 200, the MEM page title and release commit `3336e63b05a5231032c7d7269eb79a3306186bda`. This is an observation of the existing release, not publication of the current content changes. No DNS or Azure resource settings were changed during this review.

## Release pipeline

1. Check out the intended commit and install locked npm dependencies on Node 22.
2. Install Playwright Chromium and its Linux system dependencies.
3. Run domain tests, type-check, production build, static artifact verification and the local browser suite.
4. Upload the prebuilt `dist` directory using the SHA-pinned official Azure deployment action. The existing Azure resource reports GitHub as its provider and this repository on main. Reuse the single checked-in workflow; do not generate a second deployment workflow.
5. Fetch live `release.json`, require the intended commit and a clean source tree, and verify every public asset's SHA-256 and content type.
6. Run the same browser suite against the deployed generated hostname. Tests use isolated browser contexts and fictional localStorage data; they do not change shared server state.

All production actions are pinned to immutable commits resolved from their official GitHub repositories. Deployments run on `main` pushes and `workflow_dispatch`. A failed or queued workflow is not a successful release.

## Evidence and operations

`release.json` is produced during build and includes the Git commit, build timestamp and SHA-256 manifest. A local build with tracked edits is marked `sourceTreeDirty: true`; the live verifier rejects such a published artifact. Azure consumes `staticwebapp.config.json`, so its hash is checked locally rather than requested as a public file.

The workflow's deploy step returns the generated production URL. Use `gh run view` to inspect the deploy and verification steps. Azure environment status must be `Ready` on `main`, its update time must correspond to the deploy step, and live `release.json` must match the pushed GitHub head. Re-run a failed workflow only after diagnosing the failed step.

For a manual live check, set `MEM_BASE_URL` to the exact custom-domain or Azure-generated HTTPS URL and run `npm run verify:live` and `npm run test:e2e`. The verifier defaults to local Git HEAD as the expected commit; GitHub Actions uses `GITHUB_SHA`.

To release a fix, validate and push a reviewed commit to `main`. To roll back, revert the relevant Git commit and let the same pipeline deploy and verify the result. Do not print deployment tokens, add paid resources, create duplicate apps, or migrate subscriptions as a workaround.

The custom domain and generated hostname have separate localStorage origins. Links to the portfolio and related applications do not synchronize or transfer experiment data. The release workflow still validates the generated hostname; check the custom domain separately when verifying a publication.
