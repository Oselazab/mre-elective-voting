# MRE Elective Vote

A student voting page for the 28 elective options listed in the 2020 Mechatronics & Robotics Engineering bylaws.

Website: https://oselazab.github.io/mre-elective-voting/

Students choose exactly six of the 26 remaining electives in the Google Form embedded on the page. They enter their name and student ID; email collection and Google sign-in are off, and response editing is enabled. EEP 456 and CSE 426 remain visible on the course list but are already selected and closed to new choices. The organizer can view per-course totals in the form's Responses tab.

## Editing
- `courses.json`: elective names, codes, and closed status
- `index.html` and `styles.css`: page structure, embedded form, and appearance
- `app.js`: search, sorting, and course cards

Every push to `main` publishes the site through GitHub Pages.
