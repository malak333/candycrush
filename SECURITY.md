# Security

Sugar Spell is a static offline game without accounts, backend, payments, analytics, or remote game-state submission. Saves remain in the browser. Hosting providers receive ordinary request metadata; the game sends no gameplay telemetry.

The latest `main` is supported. Review dependency and pinned-action updates and rerun CI before merging. CI is read-only except for its Pages deployment job.

Don't post secrets or private information in issues. Use **Security → Report a vulnerability** when enabled, or privately contact the owner through a channel they publish. For ordinary bugs, include browser/iOS version, reproduction steps, and expected behavior.

Saved state is untrusted and validated before use. The client engine suits a personal offline game; it is not an authority for competitive scores or transactions.
