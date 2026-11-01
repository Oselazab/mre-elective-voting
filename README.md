# MRE Elective Vote

A student voting page for the 28 elective options listed in the 2020 Mechatronics & Robotics Engineering bylaws.

Website: https://oselazab.github.io/mre-elective-voting/

Students click six of the 26 open course cards, then enter their name and student ID on the page. The response is sent to the linked Google Form without displaying its ballot interface. Google Forms stores the response and provides an edit-response link after submission. Email collection and Google sign-in are off. EEP 456 and CSE 426 remain visible but closed to new choices.

## Editing
- `courses.json`: elective names, codes, descriptions, and closed status
- `index.html` and `styles.css`: page structure and appearance
- `app.js`: search, sorting, course selection, and form submission

Every push to `main` publishes the site through GitHub Pages.
