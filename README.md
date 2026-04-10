# MedPlan - Système de Planification de Santé

MedPlan est une application complète de planification et de gestion du personnel de santé, conçue pour gérer les contraintes hospitalières complexes, les certifications et les obligations contractuelles.

## 🏥 Fonctionnalités Clés

- **Planification Avancée** : Créez et gérez les roulements (shifts) hospitaliers à travers différents services et unités de soins.
- **Assignations Intelligentes** : Validation automatisée des "contraintes fortes" (chevauchements d'horaires, temps de repos minimum, quotas de charge de travail).
- **Gestion du Personnel** : Profils complets des soignants incluant un statut dynamique (Actif, Inactif, Absent).
- **Système de Certification** : Suivi des certifications du personnel avec alertes d'expiration et application des certifications obligatoires pour des shifts spécifiques (ex: Réanimation).
- **Gestion des Contrats** : Définition des types de contrats (CDI, CDD, Intérim) et gestion des contrats individuels pour assurer la conformité légale lors de la planification.
- **Hiérarchie des Services et Unités** : Organisation de l'hôpital en Services (Urgences, Cardiologie, etc.) avec capacités spécifiques et gestionnaires.
- **Interface Moderne** : Interface entièrement responsive avec un mode Clair/Sombre fonctionnel utilisant un stylisage sémantique.

## 🏗️ Structure du Projet

```text
healthcare-planning/
├── backend/                # API Django REST Framework
│   ├── backend/            # Configuration du projet (settings, urls)
│   ├── planning/           # Logique métier principale
│   └── requirements.txt    # Dépendances Python
├── frontend/               # React (Create React App)
│   ├── src/
│   │   ├── components/     # Composants UI (Listes, Détails, Modals)
│   │   ├── services/       # Client API Axios
│   │   ├── contexts/       # Gestion d'état (Thème & Notifications)
│   │   └── index.css       # Styles globaux et variables de thème
└── .gitignore              # Règles d'exclusion Git
```

## 🛠️ Stack Technique

### Backend (Python/Django)
- **Django 6.0** : Framework principal.
- **Django REST Framework** : Développement de l'API.
- **Django CORS Headers** : Gestion du partage de ressources cross-origin.
- **Moteur de Validation** : Logique personnalisée pour les contraintes spécifiques à la santé.

### Frontend (React)
- **React 18** : Bibliothèque UI.
- **Tailwind CSS** : Stylisage utilitaire avec variables sémantiques personnalisées.
- **Lucide React** : Jeu d'icônes.
- **Axios** : Communication API.
- **React Router DOM** : Navigation.

## 🚀 Mise en Route

### Configuration du Backend
1. Créez un environnement virtuel : `python -m venv venv`
2. Activez l'environnement : `.\venv\Scripts\activate` (Windows) ou `source venv/bin/activate` (Linux/Mac)
3. Installez les dépendances : `pip install -r backend/requirements.txt`
4. **Variables d'Environnement** : Copiez `.env.example` vers `.env` et mettez à jour les valeurs (mot de passe base de données, clé secrète, etc.).
5. Lancez les migrations : `python backend/manage.py migrate`
6. (Optionnel) Données de test : `python backend/manage.py seed_data`
7. Démarrez le serveur : `python backend/manage.py runserver`

### Configuration du Frontend
1. Allez dans le répertoire : `cd frontend`
2. Installez les dépendances : `npm install`
3. Démarrez l'application : `npm start`

## 🔒 Règles Métier (Validateurs)
Le système applique plusieurs règles critiques lors de l'assignation :
1. **Pas de Chevauchement** : Un soignant ne peut pas être à deux endroits en même temps.
2. **Contrat Actif** : Nécessite un contrat valide à la date du shift.
3. **Certifications** : Doit posséder toutes les certifications non expirées requises par le shift.
4. **Disponibilité** : Ne peut pas être assigné pendant une absence déclarée.
