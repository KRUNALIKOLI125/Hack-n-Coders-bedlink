# BedLink 🚑🏥

A healthcare emergency coordination platform that connects patients, ambulance crews, and hospitals during critical situations. BedLink helps users find a suitable hospital based on live bed availability, and lets hospital staff keep that information up to date.

---

## 1. Project Overview

**BedLink** improves communication and coordination between patients, ambulance personnel, and hospitals during medical emergencies.

Finding a hospital with the required bed or ICU availability can be slow and stressful. BedLink provides a centralized platform where hospital availability is stored in a database, managed by hospital staff, and accessed by the people who need it.

The platform includes dedicated interfaces for patients, hospital (nurse) staff, ambulance drivers, and administrators. The current dataset covers hospitals along the Mumbai Western Line railway corridor.

### Main Objectives

- Reduce the time required to find a suitable hospital during an emergency.
- Show hospital bed, ICU, ventilator, and blood bank availability.
- Help ambulance personnel pick the right hospital quickly.
- Allow hospital staff to update bed availability in real time.
- Provide a simplified emergency access flow.
- Improve coordination between patients, ambulances, and hospitals.

---

## 2. Problem Statement

During medical emergencies, patients and ambulance crews often struggle to find hospitals with available beds or ICU facilities.

Calling multiple hospitals and manually checking availability costs valuable time and can delay treatment. Existing systems rarely provide one platform that connects patients, ambulance crews, hospital staff, and monitoring authorities.

**BedLink** addresses this by providing a centralized emergency coordination platform for accessing and managing hospital availability.

---

## 3. Key Features

- 🚑 **Ambulance Dispatch** – Helps ambulance crews identify suitable hospitals based on facilities and bed availability, with an ambulance tracker view.
- 🏥 **Hospital Bed Availability** – Shows ICU, ventilator, oxygen, trauma, burns, and regular bed counts per hospital.
- 👨‍⚕️ **Nurse / Hospital Dashboard** – Lets authorized hospital staff update bed and blood bank availability.
- 🧑‍⚕️ **Patient Portal** – Gives patients access to emergency information and hospital details.
- 🚨 **Emergency Requests** – A simplified flow for critical cases, with request tracking.
- 🏛️ **Administrator View** – Dashboard with statistics, hospital management, and database tools.
- 📴 **Offline Emergency Mode** – Fallback flow for situations with poor connectivity.
- 🌐 **Multi-language Support** – Translations for a wider range of users.
- 💾 **Persistent Database** – All hospital, request, and patient data is stored in SQLite.
- 📱 **Responsive Interface** – Works across different screen sizes.

---

## 4. Technology Stack

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Lucide React (icons)
- Motion (animations)

### Backend

- Node.js
- Express (REST API, `server.ts`)
- tsx (runs TypeScript directly)

### Database

- SQLite, accessed through `sql.js`
- Data is stored in the `bedlink.sqlite` file in the project root
- Schema and seed data: `src/db/schema.sql` and `src/data/westernLineHospitals.ts`

### Development Tools

- Git
- GitHub
- Visual Studio Code

---

## 5. Architecture / Workflow

```text
                         ┌──────────────────────┐
                         │   Patient / User     │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   React Frontend     │
                         │  TypeScript + Vite   │
                         └──────────┬───────────┘
                                    │
                           fetch('/api/...')
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   Express Backend    │
                         │   REST APIs          │
                         │   (server.ts)        │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   SQLite Database    │
                         │   (bedlink.sqlite)   │
                         └──────────────────────┘
```

### Application Workflow

1. The user opens the BedLink application.
2. The user logs in or selects the required portal.
3. Patients can view emergency information and hospital availability.
4. Ambulance crews can identify suitable hospitals and send emergency requests.
5. Hospital staff can update bed and blood bank availability.
6. The frontend sends requests to the Express backend through the `/api` routes.
7. The backend reads from and writes to the SQLite database.
8. Updated information is returned to the frontend and displayed to the user.

In development, a single Express server serves both the API and the Vite frontend, so everything runs on one port.

---

## 6. Dataset / API Information

### Data

BedLink stores the following information:

- Hospital details, location, and nearest railway station
- ICU, ventilator, oxygen, trauma, burns, and regular bed availability
- Blood bank inventory by blood group
- Doctors and ambulances linked to each hospital
- Emergency requests and patient records
- User login logs

The prototype ships with seeded sample data for 16 hospitals along the Western Line. This data is for demonstration purposes only.

### REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/hospitals` | List all hospitals |
| GET | `/api/hospitals/:id` | Get one hospital |
| POST | `/api/hospitals` | Add a hospital |
| DELETE | `/api/hospitals/:id` | Delete a hospital |
| PATCH | `/api/hospitals/:id/beds` | Update bed availability |
| PATCH | `/api/hospitals/:id/blood` | Update blood bank inventory |
| GET / POST | `/api/requests` | List / create emergency requests |
| PATCH | `/api/requests/:id/sla` | Update request SLA |
| GET / POST | `/api/patient-records` | List / create patient records |
| GET | `/api/patient-records/:id` | Get one patient record |
| PATCH | `/api/patient-records/:id/confirm` | Confirm a patient record |
| PATCH | `/api/patient-records/:id/discharge` | Discharge a patient |
| GET / POST | `/api/user-logs` | List / create login logs |
| GET | `/api/admin/stats` | Admin statistics |
| POST | `/api/admin/sql` | Run SQL from the admin view |
| POST | `/api/admin/reset` | Reset database to default data |

---

## 7. Setup & Installation Instructions

### Prerequisites

- Node.js v18 or higher
- npm
- Git

No separate database installation is needed. SQLite runs inside the app.

### Step 1: Clone the Repository

```bash
git clone https://github.com/KRUNALIKOLI125/Hack-n-Coders-bedlink.git
cd Hack-n-Coders-bedlink
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: (Optional) Configure Environment Variables

The app runs without a `.env` file. To change settings, copy the example file:

```bash
cp .env.example .env
```

On Windows Command Prompt, use `copy .env.example .env`.

By default the server runs on port `3000`. You can change it by setting `PORT` in your `.env` file.

### Step 4: Start the App

```bash
npm run dev
```

This starts the Express backend and the Vite frontend together. You should see a message that the SQLite database was initialized.

### Step 5: Open the Application

Open your browser and visit:

```
http://localhost:3000
```

### Other Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Build the frontend for production |
| `npm run start` | Start the server |
| `npm run lint` | Type-check the project |

### Troubleshooting

- **PowerShell says "running scripts is disabled"**: run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`, or use Command Prompt instead.
- **Port already in use**: stop the other process, or set a different `PORT` in `.env`.
- **Data looks outdated in the browser**: clear the site data for `localhost:3000`, since the frontend keeps a local cache of hospital data.

---

## 8. Screenshots / Demo

https://drive.google.com/drive/folders/1HW8z0Vzk6xVjoX-cUkCDiW6qMtX3qr8X?usp=sharing

---

## 9. Limitations & Future Scope

### Limitations

- Hospital availability depends on how accurate and frequent staff updates are.
- Real-world hospital data integration requires authorized access to hospital systems.
- The prototype uses sample hospital data for demonstration.
- The database is a single local file (`bedlink.sqlite`), which suits a prototype but not a multi-server deployment.
- SMS functionality requires integration with an external SMS provider.
- Real-world deployment would need strong authentication, authorization, and protection of the admin endpoints.
- Healthcare applications require additional security and privacy measures for sensitive patient information.

### Future Scope

- **Real-time hospital integration** with hospital management systems.
- **GPS-based ambulance tracking** to find nearby hospitals.
- **Intelligent hospital recommendation** based on required facility, bed availability, ICU availability, distance, and emergency type.
- **Authentication and role-based access control** for patients, nurses, doctors, ambulance personnel, government authorities, and administrators.
- **SMS and push notifications** for emergency alerts.
- **Mobile applications** for patients and ambulance crews.
- **Government healthcare integration** with authorized systems.
- **Cloud deployment** with a production database for scalability and availability.

---

## 10. Project Structure

```text
Hack-n-Coders-bedlink/
│
├── src/
│   ├── components/        # UI views (Nurse, Ambulance, Admin, Login, etc.)
│   ├── context/           # EmergencyContext (app state + API calls)
│   ├── data/              # Hospital seed data and translations
│   ├── db/                # SQLite layer (database.ts) and schema.sql
│   ├── assets/            # Images
│   ├── App.tsx
│   ├── main.tsx
│   ├── types.ts
│   └── index.css
│
├── server.ts              # Express backend and API routes
├── bedlink.sqlite         # SQLite database file
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── .env.example
├── README.md
└── LICENSE
```

---

## 11. Team Members

**Team Name:** Hack-n-Coders

- Palak Shukla
- Nikita Sequeira
- Krunali Koli
- Roby Koyichirayil

---

## License

This project is licensed under the terms of the LICENSE file included in this repository.