# Claude Code Guidelines for QuotingProject

## CRITICAL: Git Commit Policy

**🚫 NEVER commit code without explicit testing and user approval.**

### The Process (Non-Negotiable)

1. **Make the changes** locally
2. **Test thoroughly** - provide evidence:
   - Show `git diff` of changes
   - Run tests/start server and verify it works
   - Include curl commands or screenshots proving functionality
3. **Show the user exactly what will be committed:**
   - Display the diff
   - Display the commit message
4. **Wait for explicit approval** - user must say "OK" or "commit this" or similar
5. **Only then:** Run `git add/commit/push`

### Why This Matters

- Previous violations: Committed untested code multiple times
- Result: Dead code left in repo, extra cleanup commits needed
- User trust: Broken by committing before testing despite promising not to

### Examples of Correct Process

**WRONG:**
```
Claude: I'll fix that and commit it
[commits without testing]
```

**RIGHT:**
```
Claude: I'll fix that. Let me test it first:
[makes change]
[starts server, shows output, runs curl tests]
Here's what changed:
git diff [shows changes]

Ready to commit? Commit message will be:
"fix: ..."
User: OK commit this
Claude: [commits and pushes]
```

## General Development Guidelines

- Prefer editing existing files over creating new ones
- No comments unless WHY is non-obvious
- No error handling for impossible scenarios
- No premature abstractions
- Default to small, focused commits

## Code Quality

- Type-safe code (TypeScript)
- No security vulnerabilities
- Follows project conventions
- Test any changes before committing

---

**Last Updated:** June 26, 2026  
**Enforced By:** User explicit approval before every commit
