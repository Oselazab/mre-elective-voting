# MRE Elective Vote

A student voting page for the 28 elective options in the 2020 Mechatronics & Robotics Engineering bylaws.

Website: https://oselazab.github.io/mre-elective-voting/

Students select six open courses, enter their name and student ID, and save from the website. Returning students can load their saved choices, adjust them, and update the same ballot. EEP 456 and CSE 426 remain visible but closed to new choices. The Apps Script backend reads and writes the linked response spreadsheet directly; website votes do not update Google Forms' response summary. The spreadsheet is the source of truth for votes submitted through the site.

## Project files
- `courses.json`: course names, descriptions, closed status, and response labels
- `index.html` and `styles.css`: site layout and appearance
- `app.js`: course selection, response lookup, and save/update requests
- `google-apps-script/Code.gs`: server-side lookup and response replacement
- `google-apps-script/appsscript.json`: Apps Script runtime and access configuration
- `BYLAWS_ELECTIVE_REGISTRATION.md`: elective slots and prerequisites from the 2020 bylaws, plus poll limitations
- `PROJECT_DOCUMENTATION.md`: project architecture, data flow, editing, deployment, and limitations

## Publishing
GitHub Pages publishes the site from `main`. The Apps Script web app runs as the organizer and returns results to the page through a hidden frame, so students never leave the site. For implementation and privacy details, see `PROJECT_DOCUMENTATION.md`.
