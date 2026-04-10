# backend/planning/serializers.py

from rest_framework import serializers
from django.db import models
from .models import (
    Staff, Role, StaffRole, Specialty, ContractType, Contract,
    Certification, StaffCertification, Service, CareUnit,
    ShiftType, Shift, ShiftAssignment, ShiftRequiredCertification,
    AbsenceType, Absence, Preference, Rule
)


# ================================================================
# SERIALIZERS SIMPLES (pour les listes déroulantes, références)
# ================================================================

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name']


class ContractTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContractType
        fields = ['id', 'name', 'max_hours_per_week', 'leave_days_per_year', 'night_shift_allowed']


class CertificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certification
        fields = ['id', 'name']


class AbsenceTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AbsenceType
        fields = ['id', 'name', 'impacts_quota']


class ShiftTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShiftType
        fields = ['id', 'name', 'duration_hours', 'requires_rest_after']


class ServiceSerializer(serializers.ModelSerializer):
    manager_name = serializers.CharField(source='manager.full_name', read_only=True, allow_null=True)

    class Meta:
        model = Service
        fields = ['id', 'name', 'manager', 'manager_name', 'bed_capacity', 'criticality_level']


class CareUnitSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service.name', read_only=True)

    class Meta:
        model = CareUnit
        fields = ['id', 'service', 'service_name', 'name']


class RuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rule
        fields = ['id', 'name', 'description', 'rule_type', 'value', 'unit', 'valid_from', 'valid_to']


# ================================================================
# SERIALIZERS SOIGNANTS
# ================================================================

class StaffCertificationSerializer(serializers.ModelSerializer):
    """Certification d'un soignant avec détails"""
    certification_name = serializers.CharField(source='certification.name', read_only=True)
    staff_name = serializers.CharField(source='staff.full_name', read_only=True)
    is_valid = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    days_until_expiration = serializers.SerializerMethodField()

    class Meta:
        model = StaffCertification
        fields = [
            'id', 'staff', 'staff_name', 'certification', 'certification_name',
            'obtained_date', 'expiration_date', 'is_valid', 'is_expired', 'days_until_expiration'
        ]

    def get_is_valid(self, obj):
        from datetime import date
        return obj.is_valid_on(date.today())

    def get_is_expired(self, obj):
        from datetime import date
        if obj.expiration_date:
            return obj.expiration_date < date.today()
        return False

    def get_days_until_expiration(self, obj):
        from datetime import date
        if obj.expiration_date:
            delta = obj.expiration_date - date.today()
            return delta.days
        return None


class ContractSerializer(serializers.ModelSerializer):
    """Contrat avec détails du type"""
    contract_type_name = serializers.CharField(source='contract_type.name', read_only=True)
    is_active = serializers.SerializerMethodField()

    class Meta:
        model = Contract
        fields = ['id', 'staff', 'contract_type', 'contract_type_name', 'start_date', 'end_date', 'workload_percent', 'is_active']

    def get_is_active(self, obj):
        from datetime import date
        return obj.is_active_on(date.today())


class StaffListSerializer(serializers.ModelSerializer):
    """Serializer léger pour les listes de soignants"""
    full_name = serializers.CharField(read_only=True)
    status = serializers.SerializerMethodField()

    class Meta:
        model = Staff
        fields = ['id', 'first_name', 'last_name', 'full_name', 'email', 'is_active', 'status']

    def get_status(self, obj):
        from datetime import date
        today = date.today()
        
        # Si inactif manuellement, c'est la priorité
        if not obj.is_active:
            return "Inactif"
            
        # Vérifie si absent aujourd'hui
        is_absent = obj.absences.filter(
            start_date__lte=today
        ).filter(
            models.Q(actual_end_date__isnull=True, expected_end_date__gte=today) |
            models.Q(actual_end_date__gte=today)
        ).exists()
        
        if is_absent:
            return "Absent"
            
        return "Actif"


class StaffDetailSerializer(serializers.ModelSerializer):
    """Serializer complet pour les détails d'un soignant"""
    full_name = serializers.CharField(read_only=True)
    status = serializers.SerializerMethodField()
    certifications = StaffCertificationSerializer(many=True, read_only=True)
    contracts = ContractSerializer(many=True, read_only=True)
    current_contract = serializers.SerializerMethodField()
    last_absence = serializers.SerializerMethodField()

    class Meta:
        model = Staff
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'email', 'phone',
            'is_active', 'status', 'created_at', 'certifications', 'contracts', 
            'current_contract', 'last_absence'
        ]

    def get_status(self, obj):
        from datetime import date
        today = date.today()
        if not obj.is_active:
            return "Inactif"
        is_absent = obj.absences.filter(
            start_date__lte=today
        ).filter(
            models.Q(actual_end_date__isnull=True, expected_end_date__gte=today) |
            models.Q(actual_end_date__gte=today)
        ).exists()
        if is_absent:
            return "Absent"
        return "Actif"

    def get_current_contract(self, obj):
        from datetime import date
        today = date.today()
        contract = obj.contracts.filter(
            start_date__lte=today
        ).filter(
            models.Q(end_date__isnull=True) | models.Q(end_date__gte=today)
        ).first()
        if contract:
            return ContractSerializer(contract).data
        return None

    def get_last_absence(self, obj):
        absence = obj.absences.order_by('-start_date').first()
        if absence:
            return AbsenceSerializer(absence).data
        return None


class StaffCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour création/modification d'un soignant"""
    class Meta:
        model = Staff
        fields = ['first_name', 'last_name', 'email', 'phone', 'is_active']

    def validate_email(self, value):
        """Vérifie que l'email est unique"""
        instance = self.instance
        if Staff.objects.filter(email=value).exclude(pk=instance.pk if instance else None).exists():
            raise serializers.ValidationError("Un soignant avec cet email existe déjà.")
        return value


# ================================================================
# SERIALIZERS POSTES DE GARDE (SHIFTS)
# ================================================================

class ShiftListSerializer(serializers.ModelSerializer):
    """Serializer pour liste des postes"""
    care_unit_name = serializers.CharField(source='care_unit.name', read_only=True)
    service_name = serializers.CharField(source='care_unit.service.name', read_only=True)
    shift_type_name = serializers.CharField(source='shift_type.name', read_only=True)
    duration_hours = serializers.IntegerField(source='shift_type.duration_hours', read_only=True)
    assigned_count = serializers.SerializerMethodField()
    is_fully_staffed = serializers.SerializerMethodField()

    class Meta:
        model = Shift
        fields = [
            'id', 'care_unit', 'care_unit_name', 'service_name',
            'shift_type', 'shift_type_name', 'duration_hours',
            'start_datetime', 'end_datetime',
            'min_staff', 'max_staff', 'assigned_count', 'is_fully_staffed'
        ]

    def get_assigned_count(self, obj):
        return obj.assignments.count()

    def get_is_fully_staffed(self, obj):
        return obj.assignments.count() >= obj.min_staff


class ShiftDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé avec affectations"""
    care_unit_name = serializers.CharField(source='care_unit.name', read_only=True)
    service_name = serializers.CharField(source='care_unit.service.name', read_only=True)
    shift_type_name = serializers.CharField(source='shift_type.name', read_only=True)
    duration_hours = serializers.IntegerField(source='shift_type.duration_hours', read_only=True)
    assignments = serializers.SerializerMethodField()
    required_certifications = serializers.SerializerMethodField()

    class Meta:
        model = Shift
        fields = [
            'id', 'care_unit', 'care_unit_name', 'service_name',
            'shift_type', 'shift_type_name', 'duration_hours',
            'start_datetime', 'end_datetime',
            'min_staff', 'max_staff', 'assignments', 'required_certifications'
        ]

    def get_assignments(self, obj):
        return [
            {
                'id': a.id,
                'staff_id': a.staff.id,
                'staff_name': a.staff.full_name,
                'assigned_at': a.assigned_at
            }
            for a in obj.assignments.select_related('staff').all()
        ]

    def get_required_certifications(self, obj):
        return [
            {
                'id': rc.certification.id,
                'name': rc.certification.name
            }
            for rc in obj.required_certifications.select_related('certification').all()
        ]


class ShiftCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour création/modification d'un poste"""
    class Meta:
        model = Shift
        fields = ['care_unit', 'shift_type', 'start_datetime', 'end_datetime', 'min_staff', 'max_staff']

    def validate(self, data):
        """Vérifie que la date de fin est après la date de début"""
        if data['end_datetime'] <= data['start_datetime']:
            raise serializers.ValidationError({
                'end_datetime': "La date de fin doit être après la date de début."
            })
        return data


# ================================================================
# SERIALIZERS AFFECTATIONS
# ================================================================

class ShiftAssignmentSerializer(serializers.ModelSerializer):
    """Serializer pour affichage des affectations"""
    staff_name = serializers.CharField(source='staff.full_name', read_only=True)
    staff_email = serializers.CharField(source='staff.email', read_only=True)
    shift_info = serializers.SerializerMethodField()

    class Meta:
        model = ShiftAssignment
        fields = ['id', 'shift', 'staff', 'staff_name', 'staff_email', 'shift_info', 'assigned_at']

    def get_shift_info(self, obj):
        return {
            'id': obj.shift.id,
            'service': obj.shift.care_unit.service.name,
            'care_unit': obj.shift.care_unit.name,
            'shift_type': obj.shift.shift_type.name,
            'start': obj.shift.start_datetime,
            'end': obj.shift.end_datetime
        }


class ShiftAssignmentCreateSerializer(serializers.ModelSerializer):
    """Serializer pour création d'une affectation"""
    class Meta:
        model = ShiftAssignment
        fields = ['shift', 'staff']

    def validate(self, data):
        """Vérifie que l'affectation n'existe pas déjà"""
        if ShiftAssignment.objects.filter(shift=data['shift'], staff=data['staff']).exists():
            raise serializers.ValidationError(
                f"{data['staff'].full_name} est déjà affecté(e) à ce poste."
            )
        return data


# ================================================================
# SERIALIZERS ABSENCES
# ================================================================

class AbsenceSerializer(serializers.ModelSerializer):
    """Serializer pour affichage des absences"""
    staff_name = serializers.CharField(source='staff.full_name', read_only=True)
    absence_type_name = serializers.CharField(source='absence_type.name', read_only=True)
    is_current = serializers.SerializerMethodField()

    class Meta:
        model = Absence
        fields = [
            'id', 'staff', 'staff_name', 'absence_type', 'absence_type_name',
            'start_date', 'expected_end_date', 'actual_end_date', 'is_planned', 'is_current'
        ]

    def get_is_current(self, obj):
        from datetime import date
        today = date.today()
        end = obj.actual_end_date or obj.expected_end_date
        return obj.start_date <= today <= end


class AbsenceCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour création/modification d'une absence"""
    class Meta:
        model = Absence
        fields = ['staff', 'absence_type', 'start_date', 'expected_end_date', 'actual_end_date', 'is_planned']

    def validate(self, data):
        """Vérifie que les dates sont cohérentes"""
        if data['expected_end_date'] < data['start_date']:
            raise serializers.ValidationError({
                'expected_end_date': "La date de fin doit être après la date de début."
            })
        if data.get('actual_end_date') and data['actual_end_date'] < data['start_date']:
            raise serializers.ValidationError({
                'actual_end_date': "La date de fin réelle doit être après la date de début."
            })
        return data


# ================================================================
# SERIALIZERS PRÉFÉRENCES
# ================================================================

class PreferenceSerializer(serializers.ModelSerializer):
    """Serializer pour les préférences"""
    staff_name = serializers.CharField(source='staff.full_name', read_only=True)

    class Meta:
        model = Preference
        fields = [
            'id', 'staff', 'staff_name', 'type', 'description',
            'is_hard_constraint', 'start_date', 'end_date'
        ]