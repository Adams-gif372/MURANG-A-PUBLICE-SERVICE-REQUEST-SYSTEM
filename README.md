Murang'a County Public Service Request System:

A responsive, browser-based demonstration portal for reporting and tracking everyday county service issues. It is designed as an ICT internship project prototype, with citizen and administrator workflows in one simple static application.

Technologies:

HTML5, CSS3, and JavaScript
Bootstrap 5.3 for responsive components and layout


FEATURES: 

Citizen registration, sign-in, and sign-out with field validation
Service requests for water, roads, streetlights, garbage collection, drainage and other issues
Murang'a County sub-county selection, precise location, description, optional image and generated reference number
Citizen only request lists, status filtering, detail view, and progress history
Administrator request queue with search, category/status filters, and status updates with audit notes
Live totals and status overview for all requests
Print friendly request detail summary and realistic sample records

Project structure:

public-service-request-system/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── auth.js
│   ├── requests.js
│   └── dashboard.js
└── README.md


Run locally:

The project can be opened by going live on the  index.html directly or using the vercel link after deploying to vercel (https://murang-a-public-service-request-sys.vercel.app). 

Bootstrap and the display fonts load from CDNs, so an internet connection is needed for those assets. The core application files remain local.

Demonstration accounts:

Citizen: citizen@example.com Password - Citizen123!
Administrator: admin@muranga.go.ke - Admin123!

The first visit seeds these accounts and three example requests. You can also register a new citizen, submit an issue, then sign in as the administrator to filter the request and update its status. Sign back in as the citizen to see the update and full history. The Clear action resets the administrator filters, demo data can be reset by clearing site data for localhost in browser settings.