# Role Experience Framework

Symphony One uses a shared client, policy, renewal, submission, placement, claim, compliance, document, task, activity and team dataset for every workspace.

The role framework in `src/config/roleExperiences.js` controls presentation only: landing route, navigation order, default filters, priority ranking, iBar suggestions, notifications, briefing labels and simulated quick actions. Role selection is stored in browser session storage by default, with optional local storage when the user selects **Remember this workspace**.

This demonstration does not provide authorization. A production implementation must enforce role-based access control on the server for every protected record, query and action. Client-side route guards and hidden navigation must never be treated as a security boundary.
