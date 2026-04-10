# backend/planning/validators.py

"""
VALIDATEURS DE CONTRAINTES DURES
================================
Ces fonctions vérifient les contraintes métier avant chaque affectation.
Si une contrainte est violée, l'affectation est refusée.
"""

from django.db.models import Q, Sum
from datetime import datetime, timedelta, date
from decimal import Decimal


class AssignmentValidator:
    """
    Validateur principal pour les affectations.
    Vérifie toutes les contraintes dures définies dans le cahier des charges.
    """

    def __init__(self, staff, shift):
        """
        Initialise le validateur.
        
        Args:
            staff: Instance du modèle Staff
            shift: Instance du modèle Shift
        """
        self.staff = staff
        self.shift = shift
        self.errors = []
        self.warnings = []

    def validate_all(self):
        """
        Exécute toutes les validations.
        
        Returns:
            tuple: (is_valid: bool, errors: list, warnings: list)
        """
        # Vérifie que le soignant est actif
        if not self.staff.is_active:
            self.errors.append(f"{self.staff.full_name} n'est pas actif.")
            return False, self.errors, self.warnings

        # Exécute chaque contrainte
        self._check_no_time_overlap()
        self._check_certifications()
        self._check_rest_after_night()
        self._check_contract_allows_shift()
        self._check_no_absence()
        self._check_weekly_hours()
        self._check_hard_constraints()
        self._check_max_staff()

        is_valid = len(self.errors) == 0
        return is_valid, self.errors, self.warnings

    def _check_no_time_overlap(self):
        """
        CONTRAINTE 1: Pas de chevauchement horaire
        Un soignant ne peut pas être affecté à deux postes qui se chevauchent.
        """
        from .models import ShiftAssignment

        overlapping = ShiftAssignment.objects.filter(
            staff=self.staff,
            shift__start_datetime__lt=self.shift.end_datetime,
            shift__end_datetime__gt=self.shift.start_datetime
        ).exclude(
            shift=self.shift
        ).select_related('shift', 'shift__care_unit', 'shift__shift_type').first()

        if overlapping:
            self.errors.append(
                f"Conflit horaire : {self.staff.full_name} est déjà affecté(e) à "
                f"'{overlapping.shift.care_unit.name} - {overlapping.shift.shift_type.name}' "
                f"de {overlapping.shift.start_datetime.strftime('%H:%M')} à "
                f"{overlapping.shift.end_datetime.strftime('%H:%M')} le "
                f"{overlapping.shift.start_datetime.strftime('%d/%m/%Y')}."
            )

    def _check_certifications(self):
        """
        CONTRAINTE 2: Certifications requises
        Le soignant doit posséder toutes les certifications requises, non expirées.
        """
        from .models import ShiftRequiredCertification, StaffCertification

        shift_date = self.shift.start_datetime.date()

        # Récupère les certifications requises
        required_certs = ShiftRequiredCertification.objects.filter(
            shift=self.shift
        ).select_related('certification')

        if not required_certs.exists():
            return  # Pas de certification requise

        required_cert_ids = [rc.certification.id for rc in required_certs]

        # Récupère les certifications valides du soignant
        valid_staff_certs = StaffCertification.objects.filter(
            staff=self.staff,
            certification_id__in=required_cert_ids
        ).filter(
            Q(expiration_date__isnull=True) | Q(expiration_date__gte=shift_date)
        )

        valid_cert_ids = set(vc.certification_id for vc in valid_staff_certs)
        missing_cert_ids = set(required_cert_ids) - valid_cert_ids

        if missing_cert_ids:
            from .models import Certification
            missing_names = Certification.objects.filter(
                id__in=missing_cert_ids
            ).values_list('name', flat=True)
            self.errors.append(
                f"Certifications manquantes ou expirées : {', '.join(missing_names)}. "
                f"Ces certifications sont requises pour ce poste."
            )

    def _check_rest_after_night(self):
        """
        CONTRAINTE 3: Repos après garde de nuit
        Après une garde de nuit, un repos minimal réglementaire doit être respecté.
        """
        from .models import ShiftAssignment, Rule

        # Récupère la règle de repos (par défaut 11h)
        rest_rule = Rule.objects.filter(
            rule_type='rest_time',
            valid_from__lte=self.shift.start_datetime.date()
        ).filter(
            Q(valid_to__isnull=True) | Q(valid_to__gte=self.shift.start_datetime.date())
        ).first()

        rest_hours = float(rest_rule.value) if rest_rule else 11.0

        # Cherche une garde de nuit récente
        min_start_time = self.shift.start_datetime - timedelta(hours=rest_hours)

        recent_night = ShiftAssignment.objects.filter(
            staff=self.staff,
            shift__shift_type__name__icontains='nuit',
            shift__end_datetime__gt=min_start_time,
            shift__end_datetime__lte=self.shift.start_datetime
        ).select_related('shift').first()

        if recent_night:
            time_diff = self.shift.start_datetime - recent_night.shift.end_datetime
            hours_rest = time_diff.total_seconds() / 3600

            if hours_rest < rest_hours:
                self.errors.append(
                    f"Repos insuffisant après garde de nuit : seulement {hours_rest:.1f}h de repos "
                    f"depuis la fin de la garde à {recent_night.shift.end_datetime.strftime('%H:%M')} "
                    f"le {recent_night.shift.end_datetime.strftime('%d/%m/%Y')}. "
                    f"Minimum requis : {rest_hours}h."
                )

    def _check_contract_allows_shift(self):
        """
        CONTRAINTE 5: Contrat compatible
        Le contrat actif doit autoriser ce type de garde.
        """
        from .models import Contract

        shift_date = self.shift.start_datetime.date()

        # Cherche un contrat actif
        active_contract = Contract.objects.filter(
            staff=self.staff,
            start_date__lte=shift_date
        ).filter(
            Q(end_date__isnull=True) | Q(end_date__gte=shift_date)
        ).select_related('contract_type').first()

        if not active_contract:
            self.errors.append(
                f"Aucun contrat actif trouvé pour {self.staff.full_name} "
                f"à la date du {shift_date.strftime('%d/%m/%Y')}."
            )
            return

        # Vérifie si c'est une garde de nuit
        is_night = 'nuit' in self.shift.shift_type.name.lower()

        if is_night and not active_contract.contract_type.night_shift_allowed:
            self.errors.append(
                f"Le contrat '{active_contract.contract_type.name}' de {self.staff.full_name} "
                f"n'autorise pas les gardes de nuit."
            )

    def _check_no_absence(self):
        """
        CONTRAINTE 6: Pas d'absence
        Un soignant en absence déclarée ne peut pas être affecté.
        """
        from .models import Absence

        shift_date = self.shift.start_datetime.date()

        absence = Absence.objects.filter(
            staff=self.staff,
            start_date__lte=shift_date
        ).filter(
            Q(actual_end_date__isnull=True, expected_end_date__gte=shift_date) |
            Q(actual_end_date__gte=shift_date)
        ).select_related('absence_type').first()

        if absence:
            end_date = absence.actual_end_date or absence.expected_end_date
            self.errors.append(
                f"{self.staff.full_name} est en absence ({absence.absence_type.name}) "
                f"du {absence.start_date.strftime('%d/%m/%Y')} au {end_date.strftime('%d/%m/%Y')}."
            )

    def _check_weekly_hours(self):
        """
        CONTRAINTE 7: Quota d'heures hebdomadaires
        Le nombre d'heures hebdomadaires ne peut pas dépasser le maximum contractuel.
        """
        from .models import Contract, ShiftAssignment

        shift_date = self.shift.start_datetime.date()

        # Récupère le contrat actif
        active_contract = Contract.objects.filter(
            staff=self.staff,
            start_date__lte=shift_date
        ).filter(
            Q(end_date__isnull=True) | Q(end_date__gte=shift_date)
        ).select_related('contract_type').first()

        if not active_contract:
            return  # Déjà géré dans _check_contract_allows_shift

        max_hours = active_contract.contract_type.max_hours_per_week
        if not max_hours:
            return  # Pas de limite définie

        # Ajuste selon le pourcentage de temps de travail
        max_hours = max_hours * (active_contract.workload_percent / 100)

        # Calcule la semaine (lundi à dimanche)
        week_start = shift_date - timedelta(days=shift_date.weekday())
        week_end = week_start + timedelta(days=7)

        # Calcule les heures déjà planifiées
        current_assignments = ShiftAssignment.objects.filter(
            staff=self.staff,
            shift__start_datetime__date__gte=week_start,
            shift__start_datetime__date__lt=week_end
        ).select_related('shift__shift_type')

        total_hours = sum(
            a.shift.shift_type.duration_hours for a in current_assignments
        )

        # Ajoute les heures du nouveau poste
        new_total = total_hours + self.shift.shift_type.duration_hours

        if new_total > max_hours:
            self.errors.append(
                f"Dépassement du quota hebdomadaire : {new_total}h prévues pour la semaine "
                f"du {week_start.strftime('%d/%m')} au {(week_end - timedelta(days=1)).strftime('%d/%m/%Y')}. "
                f"Maximum autorisé : {max_hours}h ({active_contract.workload_percent}% de "
                f"{active_contract.contract_type.max_hours_per_week}h)."
            )

    def _check_hard_constraints(self):
        """
        CONTRAINTE 8: Contraintes impératives du soignant
        Les contraintes marquées comme 'dures' doivent être respectées.
        """
        from .models import Preference

        shift_date = self.shift.start_datetime.date()
        shift_day = shift_date.strftime('%A').lower()  # jour de la semaine

        hard_constraints = Preference.objects.filter(
            staff=self.staff,
            is_hard_constraint=True,
            start_date__lte=shift_date
        ).filter(
            Q(end_date__isnull=True) | Q(end_date__gte=shift_date)
        )

        for constraint in hard_constraints:
            desc = constraint.description.lower()

            # Vérifie les contraintes sur les jours
            days_mapping = {
                'lundi': 'monday', 'mardi': 'tuesday', 'mercredi': 'wednesday',
                'jeudi': 'thursday', 'vendredi': 'friday', 'samedi': 'saturday',
                'dimanche': 'sunday'
            }

            for fr_day, en_day in days_mapping.items():
                if fr_day in desc and en_day == shift_day:
                    self.errors.append(
                        f"Contrainte impérative non respectée : '{constraint.description}'"
                    )
                    break

            # Vérifie les contraintes sur les nuits
            if 'nuit' in desc and 'nuit' in self.shift.shift_type.name.lower():
                # Vérifie si c'est un weekend
                if 'weekend' in desc and shift_date.weekday() >= 5:
                    self.errors.append(
                        f"Contrainte impérative non respectée : '{constraint.description}'"
                    )

    def _check_max_staff(self):
        """
        CONTRAINTE ADDITIONNELLE: Effectif maximum
        Vérifie que le poste n'est pas déjà complet.
        """
        if self.shift.max_staff:
            current_count = self.shift.assignments.count()
            if current_count >= self.shift.max_staff:
                self.errors.append(
                    f"Ce poste est complet : {current_count}/{self.shift.max_staff} soignants affectés."
                )


def validate_assignment(staff, shift):
    """
    Fonction utilitaire pour valider une affectation.
    
    Args:
        staff: Instance Staff ou ID
        shift: Instance Shift ou ID
    
    Returns:
        tuple: (is_valid, errors, warnings)
    """
    from .models import Staff, Shift

    # Récupère les instances si on a des IDs
    if isinstance(staff, int):
        try:
            staff = Staff.objects.get(id=staff)
        except Staff.DoesNotExist:
            return False, ["Soignant introuvable"], []

    if isinstance(shift, int):
        try:
            shift = Shift.objects.get(id=shift)
        except Shift.DoesNotExist:
            return False, ["Poste de garde introuvable"], []

    validator = AssignmentValidator(staff, shift)
    return validator.validate_all()