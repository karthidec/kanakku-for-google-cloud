# /security-review

1. List every permission, host permission, and OAuth scope in manifest.json, and explain why each is needed. Flag anything not strictly needed.
2. Search the code for any network call. List every destination. Anything other than the BigQuery API (and the optional, user-enabled AI endpoint) is a failure.
3. Search for any DOM reading of console page content. Reading anything other than the URL is a failure.
4. Search the repo and git history for secrets, project ids, billing account ids, and real billing data.
5. Confirm docs/privacy-policy.md matches the actual behavior.
6. Report pass or fail for each item. Do not fix anything until I approve.
