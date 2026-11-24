# Demo project setup checklist (do this yourself, in the console)

Do this in parallel with Phase 0 to 2. Billing data can take a day or more to show up.

## 1. Safety first
- Create a NEW project just for this demo. Never use a work project or work billing account.
- Check your credits: Billing > Credits. Confirm which services they cover.
- Set a budget with alerts on the demo project.
- Set a spend cap on the eligible services you will use (for example Cloud Run). Remember: caps act on estimated cost before discounts and credits, so set the amount with that in mind.

## 2. Turn on billing export
- Billing > Billing export > BigQuery export.
- Turn on the detailed (resource-level) usage cost export, into a dataset in your demo project.
- Note: export data usually starts from when you turn it on, and arrives with a delay of hours.

## 3. Create a few small, real resources to show in the demo
- One Cloud Run service with min instances set to 2 (this creates the "always on, low traffic" story for the warning).
- One small Cloud Storage bucket with a little data.
- Optional: one very small Compute Engine VM.
- Keep everything small. Delete or scale to zero after recording the demo.

## 4. OAuth client for the extension
- APIs and Services > OAuth consent screen: keep it in Testing mode and add only yourself as a test user.
- Create an OAuth client of type "Chrome extension" using your unpacked extension's ID.
- Keep the client ID in a local, git-ignored file. Never commit it.

## 5. After 1 to 2 days
- Run the scheduled query from Phase 3 to build the summary table.
- Compare Kanakku's numbers with Billing > Reports for the same resource and dates.

## 6. After the demo
- Scale Cloud Run min instances to 0 or delete the demo resources.
- Keep the billing export and summary table if you want more data for the blog.
