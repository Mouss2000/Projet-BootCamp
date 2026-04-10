# backend/planning/models.py

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


# ================================================================
# MODÈLE 1 : SOIGNANTS (STAFF)
# ================================================================

class Staff(models.Model):
    """
    Table des soignants
    Stocke les informations de base de chaque membre du personnel
    """
    first_name = models.CharField(
        max_length=100,
        verbose_name="Prénom"
    )
    last_name = models.CharField(
        max_length=100,
        verbose_name="Nom"
    )
    email = models.EmailField(
        unique=True,
        verbose_name="Email"
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name="Téléphone"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Actif"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Créé le"
    )

    class Meta:
        db_table = 'staff'
        verbose_name = "Soignant"
        verbose_name_plural = "Soignants"
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


# ================================================================
# MODÈLE 2 : RÔLES
# ================================================================

class Role(models.Model):
    """
    Table des rôles (Infirmier, Aide-soignant, Médecin, etc.)
    """
    name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="Nom du rôle"
    )

    class Meta:
        db_table = 'role'
        verbose_name = "Rôle"
        verbose_name_plural = "Rôles"

    def __str__(self):
        return self.name


# ================================================================
# MODÈLE 3 : ASSOCIATION SOIGNANT-RÔLE
# ================================================================

class StaffRole(models.Model):
    """
    Table d'association Many-to-Many entre Staff et Role
    Un soignant peut avoir plusieurs rôles
    """
    staff = models.ForeignKey(
        Staff,
        on_delete=models.CASCADE,
        related_name='staff_roles',
        verbose_name="Soignant"
    )
    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name='staff_roles',
        verbose_name="Rôle"
    )

    class Meta:
        db_table = 'staff_role'
        unique_together = ('staff', 'role')
        verbose_name = "Rôle du soignant"
        verbose_name_plural = "Rôles des soignants"

    def __str__(self):
        return f"{self.staff} - {self.role}"


# ================================================================
# MODÈLE 4 : SPÉCIALITÉS
# ================================================================

class Specialty(models.Model):
    """
    Table des spécialités médicales
    Structure hiérarchique (parent_id pour les sous-spécialités)
    """
    name = models.CharField(
        max_length=100,
        verbose_name="Nom de la spécialité"
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='children',
        verbose_name="Spécialité parente"
    )

    class Meta:
        db_table = 'specialty'
        verbose_name = "Spécialité"
        verbose_name_plural = "Spécialités"

    def __str__(self):
        return self.name


# ================================================================
# MODÈLE 5 : ASSOCIATION SOIGNANT-SPÉCIALITÉ
# ================================================================

class StaffSpecialty(models.Model):
    """
    Table d'association entre Staff et Specialty
    """
    staff = models.ForeignKey(
        Staff,
        on_delete=models.CASCADE,
        related_name='staff_specialties',
        verbose_name="Soignant"
    )
    specialty = models.ForeignKey(
        Specialty,
        on_delete=models.CASCADE,
        related_name='staff_specialties',
        verbose_name="Spécialité"
    )

    class Meta:
        db_table = 'staff_specialty'
        unique_together = ('staff', 'specialty')
        verbose_name = "Spécialité du soignant"
        verbose_name_plural = "Spécialités des soignants"


# ================================================================
# MODÈLE 6 : TYPES DE CONTRAT
# ================================================================

class ContractType(models.Model):
    """
    Types de contrat (CDI, CDD, Stage, Intérim...)
    Définit les règles associées à chaque type
    """
    name = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="Type de contrat"
    )
    max_hours_per_week = models.IntegerField(
        blank=True,
        null=True,
        verbose_name="Heures max/semaine"
    )
    leave_days_per_year = models.IntegerField(
        blank=True,
        null=True,
        verbose_name="Jours de congés/an"
    )
    night_shift_allowed = models.BooleanField(
        default=True,
        verbose_name="Garde de nuit autorisée"
    )

    class Meta:
        db_table = 'contract_type'
        verbose_name = "Type de contrat"
        verbose_name_plural = "Types de contrat"

    def __str__(self):
        return self.name


# ================================================================
# MODÈLE 7 : CONTRATS
# ================================================================

class Contract(models.Model):
    """
    Contrats des soignants
    Un soignant peut avoir plusieurs contrats (historique)
    """
    staff = models.ForeignKey(
        Staff,
        on_delete=models.CASCADE,
        related_name='contracts',
        verbose_name="Soignant"
    )
    contract_type = models.ForeignKey(
        ContractType,
        on_delete=models.RESTRICT,
        related_name='contracts',
        verbose_name="Type de contrat"
    )
    start_date = models.DateField(
        verbose_name="Date de début"
    )
    end_date = models.DateField(
        blank=True,
        null=True,
        verbose_name="Date de fin"
    )
    workload_percent = models.IntegerField(
        default=100,
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        verbose_name="Temps de travail (%)"
    )

    class Meta:
        db_table = 'contract'
        verbose_name = "Contrat"
        verbose_name_plural = "Contrats"
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.staff} - {self.contract_type} ({self.start_date})"

    def is_active_on(self, date):
        """Vérifie si le contrat est actif à une date donnée"""
        if self.end_date:
            return self.start_date <= date <= self.end_date
        return self.start_date <= date


# ================================================================
# MODÈLE 8 : CERTIFICATIONS
# ================================================================

class Certification(models.Model):
    """
    Table des certifications possibles
    (IDE, IADE, IBODE, Réanimation, etc.)
    """
    name = models.CharField(
        max_length=150,
        unique=True,
        verbose_name="Nom de la certification"
    )

    class Meta:
        db_table = 'certification'
        verbose_name = "Certification"
        verbose_name_plural = "Certifications"

    def __str__(self):
        return self.name


# ================================================================
# MODÈLE 9 : DÉPENDANCES ENTRE CERTIFICATIONS
# ================================================================

class CertificationDependency(models.Model):
    """
    Définit les prérequis entre certifications
    Ex: Pour avoir IADE, il faut d'abord avoir IDE
    """
    parent_cert = models.ForeignKey(
        Certification,
        on_delete=models.CASCADE,
        related_name='dependencies',
        verbose_name="Certification"
    )
    required_cert = models.ForeignKey(
        Certification,
        on_delete=models.CASCADE,
        related_name='required_for',
        verbose_name="Certification requise"
    )

    class Meta:
        db_table = 'certification_dependency'
        unique_together = ('parent_cert', 'required_cert')
        verbose_name = "Dépendance de certification"
        verbose_name_plural = "Dépendances de certification"


# ================================================================
# MODÈLE 10 : CERTIFICATIONS DES SOIGNANTS
# ================================================================

class StaffCertification(models.Model):
    """
    Certifications obtenues par chaque soignant
    Avec date d'obtention et d'expiration
    """
    staff = models.ForeignKey(
        Staff,
        on_delete=models.CASCADE,
        related_name='certifications',
        verbose_name="Soignant"
    )
    certification = models.ForeignKey(
        Certification,
        on_delete=models.CASCADE,
        related_name='staff_certifications',
        verbose_name="Certification"
    )
    obtained_date = models.DateField(
        verbose_name="Date d'obtention"
    )
    expiration_date = models.DateField(
        blank=True,
        null=True,
        verbose_name="Date d'expiration"
    )

    class Meta:
        db_table = 'staff_certification'
        unique_together = ('staff', 'certification')
        verbose_name = "Certification du soignant"
        verbose_name_plural = "Certifications des soignants"

    def __str__(self):
        return f"{self.staff} - {self.certification}"

    def is_valid_on(self, date):
        """Vérifie si la certification est valide à une date donnée"""
        if self.expiration_date:
            return self.expiration_date >= date
        return True


# ================================================================
# MODÈLE 11 : SERVICES HOSPITALIERS
# ================================================================

class Service(models.Model):
    """
    Services de l'hôpital (Urgences, Cardiologie, etc.)
    """
    name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="Nom du service"
    )
    manager = models.ForeignKey(
        Staff,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='managed_services',
        verbose_name="Responsable"
    )
    bed_capacity = models.IntegerField(
        verbose_name="Capacité en lits"
    )
    criticality_level = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name="Niveau de criticité (1-5)"
    )

    class Meta:
        db_table = 'service'
        verbose_name = "Service"
        verbose_name_plural = "Services"

    def __str__(self):
        return self.name


# ================================================================
# MODÈLE 12 : UNITÉS DE SOINS
# ================================================================

class CareUnit(models.Model):
    """
    Unités de soins au sein d'un service
    Ex: Urgences A, Urgences B, UHCD
    """
    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name='care_units',
        verbose_name="Service"
    )
    name = models.CharField(
        max_length=100,
        verbose_name="Nom de l'unité"
    )

    class Meta:
        db_table = 'care_unit'
        verbose_name = "Unité de soins"
        verbose_name_plural = "Unités de soins"
        unique_together = ('service', 'name')

    def __str__(self):
        return f"{self.service.name} - {self.name}"


# ================================================================
# MODÈLE 13 : STATUT DES SERVICES
# ================================================================

class ServiceStatus(models.Model):
    """
    Historique des statuts d'un service
    (ouvert, fermé, sous-effectif)
    """
    STATUS_CHOICES = [
        ('ouvert', 'Ouvert'),
        ('ferme', 'Fermé'),
        ('sous_effectif', 'Sous-effectif'),
    ]

    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name='statuses',
        verbose_name="Service"
    )
    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        verbose_name="Statut"
    )
    start_date = models.DateField(
        verbose_name="Date de début"
    )
    end_date = models.DateField(
        blank=True,
        null=True,
        verbose_name="Date de fin"
    )

    class Meta:
        db_table = 'service_status'
        verbose_name = "Statut de service"
        verbose_name_plural = "Statuts de service"


# ================================================================
# MODÈLE 14 : AFFECTATION SOIGNANT-SERVICE
# ================================================================

class StaffServiceAssignment(models.Model):
    """
    Affectation d'un soignant à un service
    Avec dates de début et fin
    """
    staff = models.ForeignKey(
        Staff,
        on_delete=models.CASCADE,
        related_name='service_assignments',
        verbose_name="Soignant"
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name='staff_assignments',
        verbose_name="Service"
    )
    start_date = models.DateField(
        verbose_name="Date de début"
    )
    end_date = models.DateField(
        blank=True,
        null=True,
        verbose_name="Date de fin"
    )

    class Meta:
        db_table = 'staff_service_assignment'
        verbose_name = "Affectation au service"
        verbose_name_plural = "Affectations aux services"


# ================================================================
# MODÈLE 15 : TYPES DE GARDE
# ================================================================

class ShiftType(models.Model):
    """
    Types de garde (Matin, Après-midi, Nuit, Journée)
    """
    name = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="Type de garde"
    )
    duration_hours = models.IntegerField(
        verbose_name="Durée (heures)"
    )
    requires_rest_after = models.BooleanField(
        default=True,
        verbose_name="Repos obligatoire après"
    )

    class Meta:
        db_table = 'shift_type'
        verbose_name = "Type de garde"
        verbose_name_plural = "Types de garde"

    def __str__(self):
        return f"{self.name} ({self.duration_hours}h)"


# ================================================================
# MODÈLE 16 : POSTES DE GARDE (SHIFTS)
# ================================================================

class Shift(models.Model):
    """
    Postes de garde planifiés
    Définit quand et où une garde a lieu
    """
    care_unit = models.ForeignKey(
        CareUnit,
        on_delete=models.CASCADE,
        related_name='shifts',
        verbose_name="Unité de soins"
    )
    shift_type = models.ForeignKey(
        ShiftType,
        on_delete=models.RESTRICT,
        related_name='shifts',
        verbose_name="Type de garde"
    )
    start_datetime = models.DateTimeField(
        verbose_name="Début"
    )
    end_datetime = models.DateTimeField(
        verbose_name="Fin"
    )
    min_staff = models.IntegerField(
        default=1,
        verbose_name="Effectif minimum"
    )
    max_staff = models.IntegerField(
        blank=True,
        null=True,
        verbose_name="Effectif maximum"
    )

    class Meta:
        db_table = 'shift'
        verbose_name = "Poste de garde"
        verbose_name_plural = "Postes de garde"
        ordering = ['start_datetime']

    def __str__(self):
        return f"{self.care_unit.name} - {self.shift_type.name} ({self.start_datetime.strftime('%d/%m/%Y %H:%M')})"

    @property
    def service(self):
        return self.care_unit.service


# ================================================================
# MODÈLE 17 : CERTIFICATIONS REQUISES PAR POSTE
# ================================================================

class ShiftRequiredCertification(models.Model):
    """
    Certifications requises pour un poste spécifique
    """
    shift = models.ForeignKey(
        Shift,
        on_delete=models.CASCADE,
        related_name='required_certifications',
        verbose_name="Poste"
    )
    certification = models.ForeignKey(
        Certification,
        on_delete=models.CASCADE,
        related_name='required_for_shifts',
        verbose_name="Certification requise"
    )

    class Meta:
        db_table = 'shift_required_certification'
        unique_together = ('shift', 'certification')
        verbose_name = "Certification requise pour le poste"
        verbose_name_plural = "Certifications requises pour les postes"


# ================================================================
# MODÈLE 18 : AFFECTATIONS AUX POSTES
# ================================================================

class ShiftAssignment(models.Model):
    """
    Affectation d'un soignant à un poste de garde
    C'est ici que les contraintes dures sont vérifiées
    """
    shift = models.ForeignKey(
        Shift,
        on_delete=models.CASCADE,
        related_name='assignments',
        verbose_name="Poste"
    )
    staff = models.ForeignKey(
        Staff,
        on_delete=models.CASCADE,
        related_name='shift_assignments',
        verbose_name="Soignant"
    )
    assigned_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Affecté le"
    )

    class Meta:
        db_table = 'shift_assignment'
        unique_together = ('shift', 'staff')
        verbose_name = "Affectation au poste"
        verbose_name_plural = "Affectations aux postes"

    def __str__(self):
        return f"{self.staff.full_name} → {self.shift}"


# ================================================================
# MODÈLE 19 : TYPES D'ABSENCE
# ================================================================

class AbsenceType(models.Model):
    """
    Types d'absence (Congés, Maladie, Formation, etc.)
    """
    name = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="Type d'absence"
    )
    impacts_quota = models.BooleanField(
        default=True,
        verbose_name="Impacte le quota de congés"
    )

    class Meta:
        db_table = 'absence_type'
        verbose_name = "Type d'absence"
        verbose_name_plural = "Types d'absence"

    def __str__(self):
        return self.name


# ================================================================
# MODÈLE 20 : ABSENCES
# ================================================================

class Absence(models.Model):
    """
    Absences déclarées des soignants
    """
    staff = models.ForeignKey(
        Staff,
        on_delete=models.CASCADE,
        related_name='absences',
        verbose_name="Soignant"
    )
    absence_type = models.ForeignKey(
        AbsenceType,
        on_delete=models.RESTRICT,
        related_name='absences',
        verbose_name="Type d'absence"
    )
    start_date = models.DateField(
        verbose_name="Date de début"
    )
    expected_end_date = models.DateField(
        verbose_name="Date de fin prévue"
    )
    actual_end_date = models.DateField(
        blank=True,
        null=True,
        verbose_name="Date de fin réelle"
    )
    is_planned = models.BooleanField(
        default=True,
        verbose_name="Planifiée"
    )

    class Meta:
        db_table = 'absence'
        verbose_name = "Absence"
        verbose_name_plural = "Absences"
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.staff} - {self.absence_type} ({self.start_date})"


# ================================================================
# MODÈLE 21 : PRÉFÉRENCES ET CONTRAINTES
# ================================================================

class Preference(models.Model):
    """
    Préférences et contraintes des soignants
    Les contraintes dures (is_hard_constraint=True) doivent être respectées
    """
    TYPE_CHOICES = [
        ('preference', 'Préférence'),
        ('constraint', 'Contrainte'),
    ]

    staff = models.ForeignKey(
        Staff,
        on_delete=models.CASCADE,
        related_name='preferences',
        verbose_name="Soignant"
    )
    type = models.CharField(
        max_length=50,
        choices=TYPE_CHOICES,
        verbose_name="Type"
    )
    description = models.TextField(
        verbose_name="Description"
    )
    is_hard_constraint = models.BooleanField(
        default=False,
        verbose_name="Contrainte impérative"
    )
    start_date = models.DateField(
        verbose_name="Date de début"
    )
    end_date = models.DateField(
        blank=True,
        null=True,
        verbose_name="Date de fin"
    )

    class Meta:
        db_table = 'preference'
        verbose_name = "Préférence"
        verbose_name_plural = "Préférences"


# ================================================================
# MODÈLE 22 : CHARGE PATIENT
# ================================================================

class PatientLoad(models.Model):
    """
    Charge patient par unité et par jour
    Pour ajuster les besoins en personnel
    """
    care_unit = models.ForeignKey(
        CareUnit,
        on_delete=models.CASCADE,
        related_name='patient_loads',
        verbose_name="Unité de soins"
    )
    date = models.DateField(
        verbose_name="Date"
    )
    patient_count = models.IntegerField(
        verbose_name="Nombre de patients"
    )
    occupancy_rate = models.FloatField(
        blank=True,
        null=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name="Taux d'occupation (%)"
    )

    class Meta:
        db_table = 'patient_load'
        unique_together = ('care_unit', 'date')
        verbose_name = "Charge patient"
        verbose_name_plural = "Charges patient"


# ================================================================
# MODÈLE 23 : PRÊTS DE PERSONNEL
# ================================================================

class StaffLoan(models.Model):
    """
    Prêts de personnel entre services
    Quand un soignant est temporairement affecté à un autre service
    """
    staff = models.ForeignKey(
        Staff,
        on_delete=models.CASCADE,
        related_name='loans',
        verbose_name="Soignant"
    )
    from_service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name='staff_loaned_out',
        verbose_name="Service d'origine"
    )
    to_service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name='staff_loaned_in',
        verbose_name="Service d'accueil"
    )
    start_date = models.DateField(
        verbose_name="Date de début"
    )
    end_date = models.DateField(
        verbose_name="Date de fin"
    )

    class Meta:
        db_table = 'staff_loan'
        verbose_name = "Prêt de personnel"
        verbose_name_plural = "Prêts de personnel"


# ================================================================
# MODÈLE 24 : RÈGLES MÉTIER
# ================================================================

class Rule(models.Model):
    """
    Règles métier configurables
    (max heures, temps de repos, effectif minimum, etc.)
    """
    RULE_TYPE_CHOICES = [
        ('max_hours', 'Heures maximum'),
        ('rest_time', 'Temps de repos'),
        ('min_staff', 'Effectif minimum'),
        ('max_consecutive_days', 'Jours consécutifs max'),
    ]

    name = models.CharField(
        max_length=100,
        verbose_name="Nom de la règle"
    )
    description = models.TextField(
        blank=True,
        verbose_name="Description"
    )
    rule_type = models.CharField(
        max_length=50,
        choices=RULE_TYPE_CHOICES,
        verbose_name="Type de règle"
    )
    value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Valeur"
    )
    unit = models.CharField(
        max_length=20,
        verbose_name="Unité"
    )
    valid_from = models.DateField(
        verbose_name="Valide depuis"
    )
    valid_to = models.DateField(
        blank=True,
        null=True,
        verbose_name="Valide jusqu'à"
    )

    class Meta:
        db_table = 'rule'
        verbose_name = "Règle"
        verbose_name_plural = "Règles"

    def __str__(self):
        return f"{self.name}: {self.value} {self.unit}"
# Create your models here.
