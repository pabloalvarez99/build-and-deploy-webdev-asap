Use a systematic debugging framework for the issue described. Follow these steps IN ORDER - do not skip any:

## Step 1: REPRODUCE
- Identify the exact steps to reproduce the bug
- What is the expected behavior vs actual behavior?
- Can you create a minimal reproduction?

## Step 2: HYPOTHESIZE
List 3-5 possible root causes, ordered by likelihood:
1. [Most likely cause]
2. [Second most likely]
3. [Third]
Consider: Is it frontend or backend? Client or server? Data issue or logic issue?

## Step 3: INVESTIGATE
For each hypothesis, identify the specific file and line to check.
Read the relevant code. Check:
- API route handler (src/app/api/*)
- Client-side API call (src/lib/api.ts)
- Component state management
- Supabase RLS policies
- Environment variables

## Step 4: ROOT CAUSE
State the definitive root cause. Explain WHY it happens, not just WHAT happens.

## Step 5: FIX
Implement the minimal fix. Do not refactor unrelated code.

## Step 6: VERIFY
- Run `./node_modules/.bin/next build` to verify no build errors
- Explain how to test the fix manually

## Step 7: PREVENT
- Should a check be added to the /review command for this class of bug?
- Update CLAUDE.md gotchas if this is a recurring pattern
