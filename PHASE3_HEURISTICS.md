# Phase 3 — Heuristiques et Optimisation du Planning

Ce document détaille les approches algorithmiques et le pseudo-code des heuristiques utilisées pour la génération automatique du planning dans **HospiPlan**. L'objectif est de produire un planning **100 % admissible** (respect des contraintes dures) tout en minimisant les **contraintes molles** via une fonction de score.

---

## 1. Modèle de Scoring (Fonction Objectif)

Pour évaluer la qualité d'un planning, nous utilisons une fonction de pénalité. Chaque violation d'une contrainte molle ajoute des points au score global. **L'objectif est de minimiser ce score.**

### Formule :
$Score_{global} = \sum (Poids_{i} \times NombreViolations_{i})$

| Contrainte Molle | Poids (Exemple) | Description |
| :--- | :--- | :--- |
| **Équité (Charge)** | 10 | Écart par rapport à la moyenne du service |
| **Préférences** | 5 | Non-respect d'un créneau souhaité |
| **Nuits consécutives** | 15 | Dépassement du seuil N de nuits |
| **Changement Service** | 8 | Mutation de service au sein d'une même semaine |
| **Repos Week-end** | 12 | Déséquilibre des gardes de week-end |

---

## 2. Heuristique du "Moins Chargé" (Least-Loaded)

Cette heuristique vise à maximiser l'équité en affectant prioritairement les soignants ayant le moins de gardes accumulées sur la période.

### Pseudo-code :

```python
FONCTION HeuristiqueMoinsChargé(poste_a_pourvoir, liste_soignants):
    soignants_eligibles = []
    
    # 1. Filtrage par contraintes dures (Légalité)
    POUR CHAQUE soignant DANS liste_soignants:
        SI EstValide(soignant, poste_a_pourvoir): # Vérifie les dures (Repos, Certifs, Absences)
            AJOUTER soignant A soignants_eligibles
            
    SI soignants_eligibles EST VIDE:
        RETOURNER "Poste non pourvu" (Signalement RH)

    # 2. Sélection du soignant le moins chargé
    soignant_elu = soignants_eligibles[0]
    charge_min = CalculerCharge(soignant_elu, periode_actuelle)
    
    POUR CHAQUE s DANS soignants_eligibles:
        charge_actuelle = CalculerCharge(s, periode_actuelle)
        SI charge_actuelle < charge_min:
            charge_min = charge_actuelle
            soignant_elu = s
            
    RETOURNER soignant_elu
```

---

## 3. Algorithme de Construction Glouton avec Pénalités (Greedy with Penalties)

Cet algorithme construit le planning créneau par créneau en choisissant à chaque étape l'affectation qui minimise l'augmentation immédiate du score de pénalité.

### Pseudo-code :

```python
FONCTION GenererPlanningAutomatique(liste_postes, liste_soignants):
    # Trier les postes par "difficulté" (ex: postes de nuit ou avec certifs rares en premier)
    postes_tries = TrierParPriorite(liste_postes)
    planning_final = []

    POUR CHAQUE poste DANS postes_tries:
        meilleur_soignant = NULL
        score_min = INFINI
        
        # Trouver tous les soignants qui respectent les contraintes DURES
        candidats = FiltrerSoignantsLegaux(poste, liste_soignants)
        
        POUR CHAQUE candidat DANS candidats:
            # Calculer l'impact du candidat sur les contraintes MOLLES
            penalite_potentielle = CalculerPenalites(candidat, poste, planning_actuel)
            
            # On cherche à minimiser le score
            SI penalite_potentielle < score_min:
                score_min = penalite_potentielle
                meilleur_soignant = candidat
        
        SI meilleur_soignant N'EST PAS NULL:
            Affecter(meilleur_soignant, poste)
            planning_final.append(poste)
        SINON:
            MarquerCommeEchec(poste) # Alerte pour intervention manuelle

    RETOURNER planning_final
```

---

## 4. Analyse de Complexité et Optimisation

### NP-Difficulté
La planification du personnel est un problème **NP-difficile**. L'approche gloutonne proposée ci-dessus garantit :
1. **Rapidité** : Exécution en $O(P \times S)$ où $P$ est le nombre de postes et $S$ le nombre de soignants.
2. **Admissibilité** : Les contraintes dures sont vérifiées à chaque insertion.
3. **Qualité** : Bonne, mais pas nécessairement optimale.

### Amélioration (Métaheuristique - Optionnel)
Pour améliorer le résultat, une phase de **Recherche Taboue** ou de **Recuit Simulé** peut être ajoutée après la construction initiale :
- **Principe** : Échanger les affectations de deux soignants sur deux postes différents.
- **Validation** : Vérifier si l'échange réduit le $Score_{global}$ sans violer de contraintes dures.
