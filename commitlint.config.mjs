/**
 * Commit message gate (P0-X-02).
 *
 * type-enum is NOT the stock conventional list: it is the stock list plus the
 * two types this repo has actually been using. Measured over the last 200
 * commits on the current branch (2026-08-21):
 *   docs 64 · feat 38 · fix 28 · refactor 12 · perf 11 · chore 11
 *   integrate 9 · test 6 · merge 3 · ci 3 · content 2 · style 1
 * `integrate` marks branch-integration commits ("integrate: xvyimu/ch-perf-*")
 * and `content` marks MDX/content-only changes. Dropping either would make the
 * hook reject the repo's own established history style, so they stay.
 *
 * Merge commits: commitlint's built-in defaultIgnores only covers git's own
 * generated wording ("Merge branch ...", "Merge pull request ...", "Merge tag
 * ..."). This repo also hand-writes "Merge PR #17: ..." and "merge wire
 * worktree: ...", which do NOT match those patterns — verified by replaying the
 * last 200 subjects through the gate. `ignores` below covers the hand-written
 * forms so the hook does not block an actual merge.
 *
 * Header length: 100. Longest real subject measured is 96 chars
 * ("@fix(critical): 修复生产环境内容为空 — 移除 headers() 实现全站静态化"),
 * so 100 is a deliberately tight ceiling rather than a round guess. Note the
 * leading `@` on 5 historical subjects is legacy noise, intentionally NOT
 * legitimised here — new commits must not carry it.
 *
 * Body length: the inherited `body-max-line-length` / `footer-max-line-length`
 * from config-conventional are [Error, 100] and are left at 100 on purpose —
 * the repo's current style already satisfies them (0 violations in the 35
 * commits since 2026-07-25). Replaying the last 200 commits through this exact
 * config (`pnpm exec commitlint --from 8fa40e5 --to HEAD`) rejects 16 on Error
 * rules, all of them legacy: 11 on `body-max-line-length` (13 over-length body
 * lines, longest 265 chars, spanning 2026-07-04…2026-07-24) and 5 on the
 * `@`-prefixed subjects above. A further 6 are warnings only
 * (`body-leading-blank` / `footer-leading-blank`) and do not block. Earlier
 * drafts of this comment claimed the replay rejected only 5 — that count fed
 * subjects in and never measured bodies; the 16 above is the real figure.
 *
 * No CI workflow replays commitlint over history (`.husky/commit-msg` lints the
 * message being committed, nothing else), so those 16 legacy rejections do not
 * block anything today. If a `--from/--to` replay is ever added to CI, it must
 * either start from a cut-off after 2026-07-24 or this rule must be loosened —
 * do NOT silently widen it now, since 100 is what the repo actually writes.
 */
const config = {
  extends: ['@commitlint/config-conventional'],
  // Hand-written merge wordings this repo uses that git/commitlint don't know.
  ignores: [
    (message) => /^Merge PR #\d+:/i.test(message),
    (message) => /^merge wire worktree:/i.test(message),
  ],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        // stock conventional
        'build',
        'chore',
        'ci',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'style',
        'test',
        // repo-specific (see header comment for measured counts)
        'integrate',
        'content',
        // 3 historical commits use `merge(scope):` / `merge:` as a real type
        // (distinct from the ignored auto-merge wordings above).
        'merge',
      ],
    ],
    'header-max-length': [2, 'always', 100],
    // Chinese subjects are common in this repo ("修 stale pin 反噬 + 收口全部质量门"),
    // and case rules are meaningless for CJK — disable rather than half-enforce.
    'subject-case': [0],
  },
};

export default config;
