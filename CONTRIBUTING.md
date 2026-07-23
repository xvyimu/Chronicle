# Contributing · Chronicle

Personal blog + portfolio (西江月). Issues and PRs welcome.

## Guidelines

1. Read [`docs/PROJECT.md`](docs/PROJECT.md) and [`docs/PRODUCT-LAYERS.md`](docs/PRODUCT-LAYERS.md).
2. **Content changes:** after MDX/JSON edits run `pnpm content:build` (or project equivalent) and commit **content snapshots** when required for production parity.
3. Do not weaken CSP (e.g. blanket `unsafe-inline`) for convenience.
4. Visual work stays **A0/A1** family tokens unless a new design ADR says otherwise.

## Checks

```bash
pnpm typecheck
pnpm test
pnpm build
```

## License

**MIT** — `LICENSE`.

## Code of Conduct

[`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

## Security

[`SECURITY.md`](SECURITY.md).
