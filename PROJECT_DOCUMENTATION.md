# MRE Elective Voting Site: Project Documentation

## Purpose

This project provides a public website where Mechatronics & Robotics Engineering students can review elective descriptions and submit or update a six-course preference ballot. It is a preference poll, not the university's official registration system.

Live site: <https://oselazab.github.io/mre-elective-voting/>  
Repository: <https://github.com/Oselazab/mre-elective-voting>

## Student flow

1. The page loads the 28 elective records from `courses.json`.
2. Students can search and sort courses, then select exactly six open electives.
3. CSE 426 and EEP 456 are shown as previously selected and cannot be selected in the current poll. The other 26 are open.
4. The student enters a name and student ID and submits on the website.
5. A returning student enters the same ID, loads the existing ballot, changes choices if desired, and saves again. The backend replaces the row matching that normalized ID.

The page does not display or require a Google Forms interface or a GitHub account.

## Architecture and data flow

```text
Browser page (GitHub Pages)
  ├─ app.js + styles.css + index.html
  ├─ reads course descriptions from courses.json
  └─ posts a hidden request to the Apps Script web app
       └─ Apps Script reads/writes the linked response spreadsheet
            └─ returns a result to the page through the hidden iframe
```

The Apps Script web app runs as the organizer and is configured for access by anyone. It uses the linked spreadsheet attached to the Apps Script project's active form to locate the response tab. Website saves and lookups read and write the spreadsheet directly; they do not create, edit, or delete Google Form responses. **The linked spreadsheet is the source of truth for votes submitted through the site. The Google Forms response summary is not synchronized with those website votes.**

The response sheet has a header row with `Timestamp`, `Student name`, `Student ID`, and a choices column. New ballots store the six selected course labels as a JSON array in the choices cell. Existing comma-separated rows are still read by matching complete known course labels, including course titles that contain commas.

## ID matching and ballot updates

- The server trims IDs, removes internal whitespace, and converts letters to uppercase before matching.
- A script lock serializes writes so two saves cannot update the response sheet at the same time.
- Saving with an ID already present updates that ID's most recent row and removes any older duplicate rows for that ID.
- Loading by ID reads the stored course labels and returns them to the website.
- The server checks that a save contains exactly six distinct choices. The current user-requested setup does not verify a student's identity or prevent someone from entering another ID.

## Files

| File or folder | Role |
|---|---|
| `index.html` | Page structure, form fields, and hidden backend iframe |
| `styles.css` | Responsive layout and visual styling |
| `app.js` | Course rendering, search/sort, six-choice selection, save/load interactions, and Apps Script endpoint |
| `courses.json` | Course codes, titles, descriptions, closed state, and posted course labels |
| `google-apps-script/Code.gs` | Server-side validation, ID normalization, spreadsheet lookup/update, and response message |
| `google-apps-script/appsscript.json` | Apps Script runtime and OAuth scopes |
| `BYLAWS_ELECTIVE_REGISTRATION.md` | Summary of the 2020 elective slots, prerequisites, and poll limitations |

## Editing course data

- Change course titles or descriptions in `courses.json`.
- Keep each course `id` stable; the page uses it to track selections.
- The `formLabel` value is the label submitted by the page and stored in the response sheet. Keep it consistent with `COURSE_LABELS` in `google-apps-script/Code.gs`, which is also used to read older response rows.
- To close or reopen a course, update both its `closed` value in `courses.json` and the `CLOSED` set in `app.js`.
- The page requires six open choices; changing that number requires coordinated changes in `app.js`, its selection UI, and the backend validation in `Code.gs`.

## Publishing and deployment

- GitHub Pages publishes the site from the repository's `main` branch.
- Frontend changes are committed and pushed to `main`; GitHub Pages then rebuilds the public site.
- Backend changes require saving the Apps Script project and updating the existing web-app deployment to a new version. Keep the web-app URL in `app.js` aligned with the deployment URL.
- The deployed Apps Script web app currently executes as the organizer and accepts requests from anyone. The organizer's Google account must retain access to the linked response spreadsheet.

## Known limitations and operations

- A public vote form cannot prove that a person owns the entered student ID. ID matching only ensures that submissions using the same normalized ID update one ballot; it is not identity verification or fake-vote prevention.
- Anyone who can access the public website can submit a vote. Do not put private credentials or secret keys in this public repository or frontend.
- The spreadsheet contains student names, student IDs, and selections. Restrict access to the sheet itself to the intended organizers; website access does not grant sheet access.
- Since site votes bypass Google Forms response submission, use the linked spreadsheet (not Google Forms' response charts/count) when reviewing the current vote.
- The six-choice poll setting and two closed courses are organizer settings. The 2020 bylaws' study plan lists seven 3-credit elective slots; the poll does not itself reconcile or satisfy official registration requirements.

## Course and source provenance

The 28 course titles and detailed descriptions originate from the 2020 SSP Mechatronics bylaws. The website's short descriptions in `courses.json` are student-facing summaries. Consult the PDF and the department for official course text, current offerings, prerequisites, and registration decisions.
