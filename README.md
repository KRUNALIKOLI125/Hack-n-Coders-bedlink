# BedLink 🚑🏥

A healthcare emergency coordination platform designed to connect patients, ambulance crews, and hospitals during critical situations. BedLink helps users identify suitable hospitals based on bed availability and enables hospital staff to manage and update hospital resources.

---

## 1. Project Overview

**BedLink** is a healthcare emergency coordination platform developed to improve communication and coordination between patients, ambulance personnel, and hospitals during medical emergencies.

Finding a hospital with the required bed or ICU availability can be difficult and time-consuming during emergencies. BedLink provides a centralized platform where hospital availability can be managed and accessed by relevant users.

The platform includes dedicated interfaces for patients, hospital staff, ambulance personnel, and government/NGO healthcare monitoring.

### Main Objectives

- Reduce the time required to find suitable hospitals during emergencies.
- Provide information about hospital bed and ICU availability.
- Help ambulance personnel identify appropriate hospitals.
- Allow hospital staff to update bed availability.
- Provide a simplified emergency access flow.
- Improve coordination between different healthcare stakeholders.

---

## 2. Problem Statement

During medical emergencies, patients and ambulance crews often face difficulties in finding hospitals with available beds or ICU facilities.

The process of calling multiple hospitals and manually checking availability can result in delays in emergency treatment.

Existing healthcare systems may not provide a centralized platform that simultaneously connects patients, ambulance crews, hospital staff, and healthcare monitoring authorities.

**BedLink** addresses this problem by providing a centralized emergency coordination platform for accessing and managing hospital availability information.

---

## 3. Key Features

### 🚑 Ambulance Dispatch

Helps ambulance personnel identify suitable hospitals for emergency patients based on available facilities and bed information.

### 🏥 Hospital Bed Availability

Displays hospital bed and ICU availability to help users identify suitable healthcare facilities.

### 👨‍⚕️ Nurse / Hospital Dashboard

Allows authorized hospital staff to update and manage hospital bed availability.

### 🧑‍⚕️ Patient Portal

Provides patients with access to emergency healthcare information and available hospital details.

### 🚨 Emergency Bypass

Provides a simplified emergency flow for critical situations where quick access to healthcare services is required.

### 🏛️ Government / NGO Portal

Provides a dedicated interface for healthcare monitoring and coordination.

### 📱 SMS Fallback

Provides an alternative communication mechanism for emergency situations where normal application-based communication may not be available.

### 🔄 Bed Availability Updates

Hospital staff can update bed and ICU information as availability changes.

### 📱 Responsive Interface

The application is designed to provide a user-friendly experience across different screen sizes.

---

## 4. Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Lucide React

### Backend

-Express and SQLite

### Database

- SQL / MySQL

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
                              API Requests
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   Django Backend     │
                         │    REST APIs         │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    SQL Database      │
                         │ Hospital / Bed Data  │
                         └──────────────────────┘
pplication Workflow
The user opens the BedLink application.
The user selects the required service or portal.
Patients can access emergency healthcare and hospital information.
Ambulance personnel can identify suitable hospitals.
Hospital staff can update bed and ICU availability.
Frontend requests are sent to the backend through APIs.
The backend processes the requests and communicates with the database.
Updated information is returned to the frontend.
Relevant hospital and emergency information is displayed to the user.
6. Dataset / API Information

BedLink works with hospital and emergency healthcare information.

The system is designed to handle information such as:

Hospital details
Hospital location
Available beds
ICU availability
Patient emergency information
Ambulance information
Hospital staff updates
Hospital resource availability
API

The backend provides REST APIs for communication between the frontend and database.

The APIs are intended to support operations such as:

Retrieving hospital information
Checking bed availability
Updating bed availability
Managing emergency information
Communicating between user interfaces and backend services

The current prototype may use sample or simulated hospital availability data for demonstration purposes.

7. Setup & Installation Instructions

Follow the steps below to run BedLink locally.

Prerequisites

Make sure the following software is installed:

Node.js v18 or higher
npm
Python 3.x
Git
MySQL / SQL Database
Visual Studio Code
Step 1: Clone the Repository
git clone <your-repository-url>

Navigate into the project directory:

cd <your-project-folder>
Step 2: Install Frontend Dependencies

Run:

npm install
Step 3: Configure Environment Variables

Create a .env file in the required project directory.

Example:

APP_URL=http://localhost:5173

Add the required backend and database configuration according to the project setup.

Step 4: Start the Frontend

Run:

npm run dev

The frontend will normally be available at:

http://localhost:5173
Step 5: Start the Backend

Navigate to the Django backend directory:

cd backend

Run the Django development server:

python manage.py runserver

The backend will normally be available at:

http://127.0.0.1:8000
Step 6: Open the Application

Open your browser and visit:

http://localhost:5173

##8. Screenshots / Demo
https://drive.google.com/drive/folders/1HW8z0Vzk6xVjoX-cUkCDiW6qMtX3qr8X?usp=sharing
9. Limitations & Future Scope
Limitations
Hospital availability depends on the accuracy and frequency of updates provided by hospital staff.
Real-world hospital data integration requires authorized access to hospital systems.
The current prototype may use sample or simulated hospital availability data.
SMS functionality requires integration with an external SMS service provider.
Real-world deployment would require strong authentication and authorization mechanisms.
Healthcare applications require additional security and privacy measures for sensitive information.
The prototype may not represent the complete infrastructure required for large-scale deployment.
Future Scope
Real-Time Hospital Integration

Integrate BedLink with hospital management systems to obtain real-time bed and ICU availability.

GPS-Based Ambulance Tracking

Add GPS functionality to track ambulances and identify nearby hospitals.

Intelligent Hospital Recommendation

Develop a recommendation system that considers:

Required medical facility
Bed availability
ICU availability
Distance
Emergency requirements
Authentication & Role-Based Access

Implement secure authentication and role-based access control for:

Patients
Nurses
Doctors
Ambulance personnel
Government authorities
Administrators
SMS / Emergency Notifications

Integrate SMS and notification services for emergency alerts and communication.

Mobile Application

Develop dedicated mobile applications for patients and ambulance personnel.

Government Healthcare Integration

Integrate with authorized government healthcare systems for wider healthcare coordination.

Cloud Deployment

Deploy the application on cloud infrastructure to support scalability and availability.

10. Project Structure
BedLink/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── data/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   │
│   ├── package.json
│   └── index.html
│
├── backend/
│   ├── manage.py
│   ├── ...
│
├── README.md
├── LICENSE
└── .gitignore

The exact project structure may vary depending on the final repository organization.

11. Team Members
Team Name

Hack-n-Coders

Team Members
[Palak shukla]
[nikita sequeira]
[krunali koli]
[Roby Roby Koyichirayil]