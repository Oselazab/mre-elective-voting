# MRE Elective Vote

A student voting page for the 28 elective options listed in the 2020 Mechatronics & Robotics Engineering bylaws.

Website: https://oselazab.github.io/mre-elective-voting/

Ballots are public GitHub issues with the `elective-vote` label. The course is read from the issue title. The tally counts each GitHub account once per course. Students need a GitHub account to submit; their username and ballot are public. EEP 456 and CSE 426 are closed to new votes.

## Editing
- `courses.json`: elective names and codes
- `index.html` and `styles.css`: page structure and appearance
- `app.js`: sort, ballot links, and shared vote tally
- `.github/ISSUE_TEMPLATE/elective-vote.md`: ballot issue

Every push to `main` publishes the site through GitHub Pages.
