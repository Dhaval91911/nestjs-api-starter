# Contributing Guide

> Thank you for considering contributing to **Pet App API**! 🚀

The following guidelines help keep the project consistent and easy to maintain.

---

## Table of Contents

1. Getting Started
2. Branch Strategy
3. Commit Message Style
4. Coding Standards
5. Pull Request Checklist
6. Running the Test Suite
7. Code of Conduct

---

## 1️⃣ Getting Started

1. **Fork** the repository & clone your fork.
2. Install dependencies with `pnpm install` (use **pnpm** ≥ 8).
3. Copy the environment template and adjust values:
   ```bash
   cp .env.example .env
   ```
4. Start databases via Docker if you do not have local instances:
   ```bash
   docker compose up -d mongo redis
   ```
5. Run the dev server:
   ```bash
   pnpm run start:dev
   ```

---

## 2️⃣ Branch Strategy

- `main` – protected, release-ready builds only
- `develop` – integration branch for features
- `feat/<scope>` – new features
- `fix/<scope>` – bug fixes
- `docs/<scope>` – documentation-only

> Keep branches short-lived; rebase against `develop` regularly.

---

## 3️⃣ Commit Message Style (Conventional Commits)

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type** examples: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.

Example:
```
feat(auth): add refresh-token endpoint
```

---

## 4️⃣ Coding Standards

- **TypeScript** strict mode on (`tsconfig.json`).
- Run `pnpm run lint` and `pnpm run format` before pushing.
- No `console.*`; use NestJS `Logger`.
- Unit tests must accompany non-trivial logic.

---

## 5️⃣ Pull Request Checklist

- [ ] Descriptive title & linked issue (if exists)
- [ ] Unit / e2e tests green
- [ ] `pnpm run lint` passes
- [ ] Docs updated (README, Swagger, etc.)
- [ ] Notable changes added to `CHANGELOG.md` (if exists)

---

## 6️⃣ Running the Test Suite

```bash
# unit
pnpm run test

# e2e
pnpm run test:e2e

# coverage
pnpm run test:cov
```

---

## 7️⃣ Code of Conduct

Be kind, inclusive, and assume positive intent at all times. We follow the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).
