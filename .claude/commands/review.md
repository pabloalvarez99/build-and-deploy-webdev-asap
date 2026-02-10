Run a comprehensive code review on all staged/modified files before committing. Check each category systematically:

## SECURITY (Critical)
- SQL injection: Any raw SQL or unsanitized user input in queries?
- XSS: Any dangerouslySetInnerHTML or unescaped user content in JSX?
- Auth bypass: Are all admin routes checking is_admin()? Are API routes authenticated?
- Data exposure: Any sensitive data (keys, passwords, tokens) in client code?
- HTTPS: Any http:// URLs that should be https://?

## CODE QUALITY
- Dead code: Unused imports, unreachable code, commented-out blocks?
- Debug artifacts: console.log, debugger statements, TODO comments?
- Magic numbers: Hardcoded values that should be constants?
- Error handling: Unhandled promise rejections, empty catch blocks?
- Type safety: Any `any` types that should be specific?

## BEST PRACTICES (Tu Farmacia specific)
- Is formatPrice() used for all prices (not raw number display)?
- Is locale 'es-CL' used for dates (not es-AR or en-US)?
- Do all buttons have min-h-[48px] for elderly touch targets?
- Are form inputs using the .input class (min-h-[52px], border-2)?
- Is the build command correct? (./node_modules/.bin/next build, NOT npx)

## SUPABASE
- Is category filtering using category_id (NOT categories.slug join)?
- Are admin queries using getServiceClient() (NOT browser client)?
- Is RLS considered for new tables?

Report findings as: OK, WARNING, or CRITICAL for each check. Then suggest fixes for any non-OK items.
