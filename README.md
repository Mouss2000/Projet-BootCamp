# HospiPlan — Système de Planification Hospitalière Intelligent

HospiPlan est une application web full-stack conçue pour automatiser et optimiser la planification du personnel de santé. Le projet a été développé en trois phases majeures, passant d'une gestion de données de base à un moteur d'optimisation sous contraintes complexe.

---

## 🚀 Vue d'Ensemble des Phases

### Phase 1 : Fondations et Structure de Données
Mise en place de l'infrastructure de l'hôpital et du référentiel RH.
- **Hiérarchie Hospitalière** : Gestion des Services (Urgences, Réa, etc.) et des Unités de Soins.
- **Profils Soignants** : Gestion complète du personnel (Coordonnées, Statut, Rôles).
- **Référentiel RH** : Types de contrats (CDI, CDD, Vacataires) et gestion des certifications (Diplômes, spécialisations).

### Phase 2 : Sécurité et Contraintes Dures
Implémentation du "moteur légal" garantissant qu'aucune affectation dangereuse ou illégale ne soit enregistrée.
- **Validateur de Contraintes (Dures)** :
    - **Chevauchements** : Interdiction d'être sur deux postes simultanément.
    - **Certifications** : Vérification des compétences obligatoires pour certains postes (ex: Réa).
    - **Repos Légal** : Respect des 11h de repos obligatoire après une garde de nuit.
    - **Absences** : Blocage des affectations pendant les congés ou maladies.
    - **Quotas Horaires** : Contrôle du temps de travail hebdomadaire selon le contrat.

### Phase 3 : Intelligence et Optimisation (Planning Auto)
Passage de la saisie manuelle à la génération intelligente assistée.
- **Moteur de Génération (Heuristique Gloutonne)** : Algorithme capable de remplir les planning vides en quelques secondes.
- **Gestion des Contraintes Molles (Scoring)** :
    - **Équité** : Répartition équitable de la charge de travail entre collègues.
    - **Équité Week-end** : Algorithme historique (90 jours) pour éviter de solliciter les mêmes agents le week-end.
    - **Fatigue** : Pénalités pour les nuits consécutives.
    - **Préférences** : Respect des souhaits de créneaux des agents.
    - **Continuité** : Bonus pour le maintien des agents dans leur service de prédilection.

---

## 🛠️ Installation et Lancement

### 1. Prérequis
- Python 3.10+
- Node.js 18+
- npm ou yarn

### 2. Configuration Backend (Django)
```bash
# Accéder au dossier
cd backend

# Créer l'environnement virtuel
python -m venv venv
source venv/bin/activate  # Linux/Mac
.\venv\Scripts\activate   # Windows

# Installer les dépendances
pip install -r requirements.txt

# Initialiser la base de données
python manage.py migrate

# CHARGER LES DONNÉES DE TEST (Crucial pour la Phase 3)
# Génère 14 jours de planning vide à partir d'aujourd'hui
python manage.py seed_data

# Lancer le serveur
python manage.py runserver
```

### 3. Configuration Frontend (React)
```bash
# Accéder au dossier
cd frontend

# Installer les dépendances
npm install

# Lancer l'application
npm start
```

---

## 📖 Guide d'Utilisation

### Étape 1 : Visualisation du Planning
Rendez-vous sur l'onglet **"Postes de Garde"**. Vous verrez les créneaux créés par le `seed_data`. Les postes en orange sont en sous-effectif (non pourvus).

### Étape 2 : Génération Automatique (Phase 3)
1. Cliquez sur le bouton **"Générer Planning Auto"** en haut à droite.
2. Le moteur va analyser les soignants disponibles et les affecter selon les meilleures scores d'équité et de fatigue.
3. Un tableau de bord de **Qualité** s'affiche, détaillant le score global et les points de pénalité par catégorie.

### Étape 3 : Ajustements Manuels (Phase 2)
1. Cliquez sur **"Gérer"** sur n'importe quel poste.
2. Vous pouvez ajouter ou retirer un soignant.
3. Si vous tentez une affectation illégale (ex: soignant déjà occupé ou n'ayant pas la bonne certification), le système bloquera l'enregistrement avec un message d'erreur explicite.

---

## 🏗️ Structure Technique

- **Backend** : Django REST Framework.
    - `planning/engine.py` : Logique de l'algorithme Phase 3.
    - `planning/validators.py` : Moteur de règles Phase 2.
- **Frontend** : React 18, Tailwind CSS, Lucide Icons.
- **Documentation Algorithmique** : Voir `PHASE3_HEURISTICS.md` pour le pseudo-code des heuristiques.

---

## 📚 Livrables Inclus
- ✅ Code source complet (Backend & Frontend).
- ✅ Script de peuplement de données (`seed_data`).
- ✅ Guide des heuristiques de la Phase 3.
- ✅ Validateurs de contraintes dures.
