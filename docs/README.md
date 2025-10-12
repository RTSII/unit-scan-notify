# 📚 SPR Vice City - Documentation Index

**Last Updated:** October 11, 2025  
**Version:** 3.2.1

---

## 📖 Documentation Overview

This folder contains all technical documentation for the SPR Vice City violation management system.

---

## 🎯 Quick Start

**New to the project?** Read these in order:

1. **[Main README](../README.md)** - Project overview and setup
2. **[WORKFLOW_REVIEW.md](WORKFLOW_REVIEW.md)** - Complete system audit
3. **[FINAL_CHECKLIST.md](FINAL_CHECKLIST.md)** - Testing and verification

---

## 📋 Core Documentation

### System Design & Planning

**[WORKFLOW_REVIEW.md](WORKFLOW_REVIEW.md)**

- Complete system audit
- Page-by-page integration status
- Workflow analysis
- Issues & priorities
- System health: 95% complete

**[PRIORITY_TODO.md](PRIORITY_TODO.md)**

- Prioritized action items
- Critical fixes (completed)
- Future enhancements
- Sprint goals

**[NEXT_STEPS.md](NEXT_STEPS.md)**

- Implementation status
- Completed fixes
- Success criteria
- Known limitations

**[FINAL_CHECKLIST.md](FINAL_CHECKLIST.md)**

- Pre-production verification
- Database schema verification
- Page integration verification
- Workflow testing
- Mobile testing
- Security & permissions
- Production checklist

---

## 🔐 Security & Access Control

**[PERMISSIONS_STRUCTURE.md](PERMISSIONS_STRUCTURE.md)**

- User roles (Admin vs Regular Users)
- Access control matrix
- Page-level permissions
- Database RLS policies
- Design philosophy
- Code comments guide

---

## 🗄️ Database Documentation

**[DATABASE_MANAGEMENT.md](DATABASE_MANAGEMENT.md)**
- Complete database schema
- Table definitions
- Foreign key relationships
- RLS policies
- Migration system
- CLI commands

Note:
- Photos are stored in Supabase Storage (`violation-photos`) with public read for thumbnails, admin-only deletes, and authenticated, path-scoped uploads. See `DATABASE_MANAGEMENT.md` storage strategy.

---

## 🔑 Authentication

**[AUTHENTICATION_SETUP.md](AUTHENTICATION_SETUP.md)**
- Supabase Auth setup
- User registration flow
- Invite system
- Role-based access
- Session management

---

## 📱 Mobile & UI

**[MOBILE_RESPONSIVE_IMPLEMENTATION.md](MOBILE_RESPONSIVE_IMPLEMENTATION.md)**
- iPhone 13+ optimization
- Safe area handling
- Touch targets
- Viewport configuration
- Mobile-first design

**[3d-carousel.md](3d-carousel.md)**
- Unified Books/Export usage
- Quick-start API notes (heightClass, containerClassName)
- Time-filter pattern reference
- Note: Books and Export now share a unified Search + Filter UI component and enhanced search semantics

---

## 🛠️ Development Tools

**[TOOLBAR_INTEGRATION.md](TOOLBAR_INTEGRATION.md)**
- 21st.dev toolbar integration
- Dev-only toggle
- Usage guide
- Troubleshooting

**[SUPABASE_MCP_INTEGRATION.md](SUPABASE_MCP_INTEGRATION.md)**
- Supabase MCP Server setup
- AI assistant database access
- Configuration for Claude Desktop, Cline, Cursor
- Security best practices
- Query examples and troubleshooting

**[NETLIFY_MCP_INTEGRATION.md](NETLIFY_MCP_INTEGRATION.md)**
- Netlify MCP Server setup
- Deployment management and monitoring
- Build log analysis and debugging
- Environment variable management
- Configuration with access token

---

## 🏠💼 Multi-PC Workflow (Home ↔ Work)

Use these steps to switch between your Home and Work PCs reliably.

### On Home (before you leave)
- Pull latest: `git pull`
- Stage, commit, push your work: `git add -A && git commit -m "<message>" && git push`

### On Work (when you arrive)
- Pull latest code: `git pull`
- Install deps reproducibly: `npm ci` (use `npm install` only when dependencies change)
- Start dev: `npm run dev` (or your usual script)

### Keep environments consistent
- Do not commit `node_modules/` (ensure it’s in `.gitignore`).
- Commit `package-lock.json` for consistent installs.
- Keep Node versions aligned via `.nvmrc` and use nvm-windows on Windows.
- Manage secrets with `.env` (don’t commit it). Share values securely for both machines.

### Troubleshooting
- If installs differ, run `npm ci` to reset `node_modules` to the lockfile.
- If you see audit notices, run `npm audit` then optionally `npm audit fix`, test, and commit lockfile updates.

---

## 📝 Project History

**[CHANGELOG.md](CHANGELOG.md)**
- Version history
- Feature additions
- Bug fixes
- Breaking changes

**[DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md)**
- Deployment notes
- Environment configuration
- Lovable.dev integration

**[GEMINI.md](GEMINI.md)**
- AI integration notes
- Development assistance
- Code generation

---

## 📊 Documentation by Category

### For Developers
1. [DATABASE_MANAGEMENT.md](DATABASE_MANAGEMENT.md)
2. [AUTHENTICATION_SETUP.md](AUTHENTICATION_SETUP.md)
3. [WORKFLOW_REVIEW.md](WORKFLOW_REVIEW.md)
4. [TOOLBAR_INTEGRATION.md](TOOLBAR_INTEGRATION.md)

### For Testing
1. [FINAL_CHECKLIST.md](FINAL_CHECKLIST.md)
2. [WORKFLOW_REVIEW.md](WORKFLOW_REVIEW.md)
3. [MOBILE_RESPONSIVE_IMPLEMENTATION.md](MOBILE_RESPONSIVE_IMPLEMENTATION.md)

### For Deployment
1. [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md)
2. [FINAL_CHECKLIST.md](FINAL_CHECKLIST.md)
3. [PERMISSIONS_STRUCTURE.md](PERMISSIONS_STRUCTURE.md)

### For Understanding System
1. [WORKFLOW_REVIEW.md](WORKFLOW_REVIEW.md)
2. [PERMISSIONS_STRUCTURE.md](PERMISSIONS_STRUCTURE.md)
3. [3d-carousel.md](3d-carousel.md)

---

## 🔍 Finding Information

### "How do I...?"

**...set up the database?**
→ [DATABASE_MANAGEMENT.md](DATABASE_MANAGEMENT.md)

**...understand user permissions?**
→ [PERMISSIONS_STRUCTURE.md](PERMISSIONS_STRUCTURE.md)

**...test the application?**
→ [FINAL_CHECKLIST.md](FINAL_CHECKLIST.md)

**...understand the workflows?**
→ [WORKFLOW_REVIEW.md](WORKFLOW_REVIEW.md)

**...deploy to production?**
→ [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md)

**...optimize for mobile?**
→ [MOBILE_RESPONSIVE_IMPLEMENTATION.md](MOBILE_RESPONSIVE_IMPLEMENTATION.md)

**...see what's been completed?**
→ [NEXT_STEPS.md](NEXT_STEPS.md)

**...know what to do next?**
→ [PRIORITY_TODO.md](PRIORITY_TODO.md)

---

## 📈 Documentation Stats

**Total Files:** 13  
**Total Pages:** ~150  
**Total Lines:** ~5,000+  
**Last Major Update:** October 6, 2025

---

## 🤝 Contributing to Documentation

When updating documentation:
1. Update the relevant .md file
2. Update this index if adding new files
3. Update the main README.md if needed
4. Keep formatting consistent
5. Add examples where helpful
6. Update "Last Updated" dates

---

## 📞 Support

For questions about documentation:
- Check this index first
- Read the relevant doc file
- Review code comments
- Check git commit history

---

**SPR Vice City** - Professional violation management for the digital age 🌴⚡
