# Contributing to clens

Thank you for considering contributing to clens! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js 18+ (we use 24.x in production)
- npm 10+
- Git

### Initial Setup

1. **Fork and clone:**

   ```bash
   git clone https://github.com/yourname/clens.git
   cd clens
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

   This installs all workspace packages in one command.

3. **Build all packages:**

   ```bash
   npm run build
   ```

4. **Run the dev environment:**

   ```bash
   npm start
   ```

   This starts all 4 services (lens, dashboard, mcp-server, example).

### Project Structure

```
clens/                     # Monorepo root
├── packages/
│   ├── lens/             # Browser inspector (@clens/lens)
│   ├── dashboard/        # Monitoring UI (@clens/dashboard)
│   └── mcp-server/       # MCP server (@clens/mcp-server)
├── example/              # Demo app (outside workspaces)
└── tasks/                # Improvement task backlog
```

### Development Workflow

#### Making Changes to Lens

```bash
# Start watch mode
npm run dev -w @clens/lens

# In another terminal, start the example
npm run dev --prefix example
```

Changes to lens source will trigger rebuilds and HMR in the example.

#### Making Changes to Dashboard

```bash
# Start dashboard dev server
npm run dev -w @clens/dashboard

# Start MCP server (for API)
npm run dev -w @clens/mcp-server
```

Open http://localhost:5173/dashboard/

#### Making Changes to MCP Server

```bash
# Start in watch mode
npm run dev -w @clens/mcp-server
```

The server restarts automatically on changes (via tsx).

---

## Code Style

We use ESLint + Prettier for code quality and formatting.

### Before Committing

Pre-commit hooks automatically:

- Lint and fix auto-fixable issues
- Format code with Prettier
- Block commit if errors remain

### Manual Checks

```bash
npm run lint           # Check for issues
npm run lint:fix       # Auto-fix issues
npm run format         # Format all files
npm run typecheck      # Verify TypeScript
npm test               # Run tests
```

### Style Guidelines

- **Indentation:** 2 spaces, no tabs
- **Quotes:** Double quotes for strings
- **Semicolons:** Always use semicolons
- **Line length:** 80 characters (soft limit)
- **File naming:** camelCase for utilities, PascalCase for components
- **Exports:** Named exports preferred over default exports

---

## Testing

We use Vitest for testing.

### Running Tests

```bash
npm test              # Run all tests
npm test -- --watch   # Watch mode
npm run test:coverage # Coverage report
```

### Writing Tests

Test files live next to source files:

```
packages/lens/src/
├── lib/
│   ├── config/
│   │   ├── connection.ts
│   │   └── connection.test.ts  <- Test file
```

**Example:**

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { getConfig, setConfig } from "./connection";

describe("connection config", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should have default config", () => {
    const config = getConfig();
    expect(config.serverUrl).toBe("http://localhost:3100");
  });
});
```

### Test Coverage

We aim for:

- **Utilities:** 80%+ coverage
- **State management:** 80%+ coverage
- **Components:** 60%+ coverage (focus on logic, not styling)

---

## Commit Guidelines

### Commit Messages

Follow conventional commits format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style (formatting, no logic change)
- `refactor`: Code restructuring (no behavior change)
- `test`: Adding or updating tests
- `chore`: Maintenance (deps, config, etc.)

**Examples:**

```
feat(lens): add settings panel for server config
fix(mcp-server): correct CORS variable name mismatch
docs: update README with monorepo structure
refactor(dashboard): extract SSE connection logic
```

### Branch Naming

- `feat/description` — New features
- `fix/description` — Bug fixes
- `docs/description` — Documentation updates
- `refactor/description` — Code refactoring

---

## Pull Request Process

1. **Create a branch:**

   ```bash
   git checkout -b feat/my-new-feature
   ```

2. **Make changes and commit:**

   ```bash
   git add .
   git commit -m "feat(lens): add new feature"
   ```

3. **Push to your fork:**

   ```bash
   git push origin feat/my-new-feature
   ```

4. **Open a Pull Request** on GitHub

5. **PR Checklist:**
   - [ ] Code follows style guidelines (pre-commit hooks pass)
   - [ ] Tests added for new features
   - [ ] All tests pass (`npm test`)
   - [ ] Type checks pass (`npm run typecheck`)
   - [ ] Documentation updated (README, JSDoc comments)
   - [ ] Changeset added if user-facing change (see below)

### Changesets

We use changesets to track version bumps and generate changelogs.

**For user-facing changes:**

```bash
npx changeset
```

Follow prompts to describe the change and select affected packages.

---

## Reporting Issues

### Bug Reports

Include:

- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, Node version, browser)
- Screenshots if applicable

### Feature Requests

Include:

- Use case / problem you're solving
- Proposed solution
- Alternatives considered
- Mockups / examples if applicable

---

## Code Review

Pull requests require:

- All CI checks pass
- At least one approving review
- No unresolved comments

Reviewers will check for:

- Code quality and style
- Test coverage
- Documentation completeness
- Breaking changes (require major version bump)

---

## Architecture Decisions

For significant changes, open a **Discussion** before starting work:

- New packages
- Major refactors
- Breaking changes
- New dependencies

This ensures alignment before investing time.

---

## Getting Help

- **Questions:** Open a [Discussion](https://github.com/nicobailon/clens/discussions)
- **Bugs:** Open an [Issue](https://github.com/nicobailon/clens/issues)

---

## Recognition

Contributors are recognized in:

- GitHub contributors page
- Release notes
- README acknowledgments

Thank you for contributing!
