Run the full deployment pipeline for Tu Farmacia:

1. **Build check**: Run `./node_modules/.bin/next build` from `pharmacy-ecommerce/apps/web/` (NEVER use npx). If build fails, fix errors before continuing.

2. **Git status**: Show what files changed. Review if any sensitive files (.env, credentials) are staged.

3. **Commit**: Stage all relevant files (NOT .env or node_modules). Create a descriptive commit message following conventional commits (feat:, fix:, chore:).

4. **Push**: `git push origin main` to trigger Vercel auto-deploy.

5. **Verify**: Check Vercel deployment status using MCP tools if available.

6. **Bitacora**: Update `pharmacy-ecommerce/bitacora.md` with what was deployed.

IMPORTANT: Always use Unix paths in bash (/c/Users/Pablo/...) not Windows paths.
