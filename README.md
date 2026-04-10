# MedPlan - Healthcare Planning System

MedPlan is a comprehensive healthcare staff planning and management application designed to handle complex hospital constraints, certifications, and contractual obligations.

## 🏥 Core Features

- **Advanced Planning**: Create and manage hospital shifts across different services and care units.
- **Intelligent Assignments**: Automated validation of "hard constraints" (overlapping shifts, minimum rest time, workload quotas).
- **Staff Management**: Full profiles for caregivers including dynamic status (Active, Inactive, Absent).
- **Certification System**: Track staff certifications with expiration alerts and enforce mandatory certification requirements for specific shifts (e.g., Resuscitation).
- **Contract Management**: Define contract types (CDI, CDD, Interim) and manage individual contracts to ensure legal compliance during scheduling.
- **Service & Care Unit Hierarchy**: Organize the hospital into Services (Emergency, Cardiology, etc.) with specific capacities and managers.
- **Modern UI**: Fully responsive interface with a working Light/Dark theme toggle using semantic styling.

## 🏗️ Project Structure

```text
healthcare-planning/
├── backend/                # Django REST Framework API
│   ├── backend/            # Project configuration (settings, urls)
│   ├── planning/           # Main application logic
│   └── requirements.txt    # Python dependencies
├── frontend/               # React (Create React App)
│   ├── src/
│   │   ├── components/     # UI Components (List, Details, Modals)
│   │   ├── services/       # Axios API client
│   │   ├── contexts/       # Theme & Notification state management
│   │   └── index.css       # Global styles & theme variables
└── .gitignore              # Repository ignore rules
```

## 🛠️ Tech Stack

### Backend (Python/Django)
- **Django 6.0**: Core framework.
- **Django REST Framework**: API development.
- **Django CORS Headers**: Cross-origin resource sharing.
- **Validation Engine**: Custom logic for healthcare-specific constraints.

### Frontend (React)
- **React 18**: UI Library.
- **Tailwind CSS**: Utility-first styling with custom semantic variables.
- **Lucide React**: Icon set.
- **Axios**: API communication.
- **React Router DOM**: Navigation.

## 🚀 Getting Started

### Backend Setup
1. Create a virtual environment: `python -m venv venv`
2. Activate the environment: `.\venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Linux/Mac)
3. Install dependencies: `pip install -r backend/requirements.txt`
4. **Environment Variables**: Copy `.env.example` to `.env` and update the values (database password, secret key, etc.).
5. Run migrations: `python backend/manage.py migrate`
5. (Optional) Seed data: `python backend/manage.py seed_data`
6. Start server: `python backend/manage.py runserver`

### Frontend Setup
1. Navigate to directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start application: `npm start`

## 🔒 Business Rules (Validators)
The system enforces several critical rules during assignment:
1. **No Overlaps**: A caregiver cannot be in two places at once.
2. **Active Contract**: Requires a valid contract for the date of the shift.
3. **Certifications**: Must possess all non-expired certifications required by the shift.
4. **Availability**: Cannot be assigned during a declared absence.
