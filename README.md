# ANA Letter Tracker

Static website for browsing ANA policy position letters by state, bill, topic,
date, recipient, and PDF link.

## Updating letters

Letter records live in `data/letters.json`. Add new entries using this shape:

```json
{
  "state": "California",
  "stateCode": "CA",
  "billNumber": "SB 1050",
  "billTopic": "Synthetic Performers / AI Disclosure",
  "anaPosition": "Oppose",
  "submissionDate": "2026-06-15",
  "submittedTo": "Assembly Judiciary Committee",
  "pdfUrl": "letters/example.pdf"
}
```

Use `YYYY-MM-DD` for `submissionDate` so sorting works correctly. Put new PDF
letters in the `letters` folder and use a relative link in `pdfUrl`.
