# backend/planning/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count
from datetime import datetime, date, timedelta

from .models import (
    Staff, Role, ContractType, Contract, Certification, StaffCertification,
    Service, CareUnit, ShiftType, Shift, ShiftAssignment,
    AbsenceType, Absence, Preference, Rule
)
from .serializers import (
    StaffListSerializer, StaffDetailSerializer, StaffCreateUpdateSerializer,
    RoleSerializer, ContractTypeSerializer, ContractSerializer,
    CertificationSerializer, StaffCertificationSerializer,
    ServiceSerializer, CareUnitSerializer,
    ShiftTypeSerializer, ShiftListSerializer, ShiftDetailSerializer,
    ShiftCreateUpdateSerializer, ShiftAssignmentSerializer,
    ShiftAssignmentCreateSerializer,
    AbsenceTypeSerializer, AbsenceSerializer, AbsenceCreateUpdateSerializer,
    PreferenceSerializer, RuleSerializer
)
from .validators import validate_assignment


# ================================================================
# VIEWSET SOIGNANTS
# ================================================================

class StaffViewSet(viewsets.ModelViewSet):
    queryset = Staff.objects.all()

    def get_serializer_class(self):
        if self.action == 'list':
            return StaffListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return StaffCreateUpdateSerializer
        return StaffDetailSerializer

    def get_queryset(self):
        queryset = Staff.objects.all()
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search)
            )
        return queryset.order_by('last_name', 'first_name')

    @action(detail=True, methods=['get'])
    def absences(self, request, pk=None):
        staff = self.get_object()
        absences = Absence.objects.filter(staff=staff).order_by('-start_date')
        serializer = AbsenceSerializer(absences, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def shifts(self, request, pk=None):
        staff = self.get_object()
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        assignments = ShiftAssignment.objects.filter(staff=staff).select_related(
            'shift', 'shift__care_unit', 'shift__care_unit__service', 'shift__shift_type'
        )
        if date_from:
            assignments = assignments.filter(shift__start_datetime__date__gte=date_from)
        if date_to:
            assignments = assignments.filter(shift__start_datetime__date__lte=date_to)
        serializer = ShiftAssignmentSerializer(assignments.order_by('shift__start_datetime'), many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def certifications(self, request, pk=None):
        staff = self.get_object()
        certs = StaffCertification.objects.filter(staff=staff).select_related('certification')
        serializer = StaffCertificationSerializer(certs, many=True)
        return Response(serializer.data)


# ================================================================
# VIEWSET POSTES DE GARDE
# ================================================================

class ShiftViewSet(viewsets.ModelViewSet):
    queryset = Shift.objects.all()

    def get_serializer_class(self):
        if self.action == 'list':
            return ShiftListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ShiftCreateUpdateSerializer
        return ShiftDetailSerializer

    def get_queryset(self):
        queryset = Shift.objects.select_related(
            'care_unit', 'care_unit__service', 'shift_type'
        ).prefetch_related('assignments')

        service_id = self.request.query_params.get('service')
        if service_id:
            queryset = queryset.filter(care_unit__service_id=service_id)

        care_unit_id = self.request.query_params.get('care_unit')
        if care_unit_id:
            queryset = queryset.filter(care_unit_id=care_unit_id)

        shift_type_id = self.request.query_params.get('shift_type')
        if shift_type_id:
            queryset = queryset.filter(shift_type_id=shift_type_id)

        date_from = self.request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(start_datetime__date__gte=date_from)

        date_to = self.request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(start_datetime__date__lte=date_to)

        date_param = self.request.query_params.get('date')
        if date_param:
            queryset = queryset.filter(start_datetime__date=date_param)

        return queryset.order_by('start_datetime')

    @action(detail=True, methods=['post'])
    def add_certification(self, request, pk=None):
        shift = self.get_object()
        cert_id = request.data.get('certification_id')
        if not cert_id:
            return Response({'detail': 'certification_id est requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            cert = Certification.objects.get(id=cert_id)
        except Certification.DoesNotExist:
            return Response({'detail': 'Certification introuvable'}, status=status.HTTP_404_NOT_FOUND)
            
        from .models import ShiftRequiredCertification
        obj, created = ShiftRequiredCertification.objects.get_or_create(
            shift=shift,
            certification=cert
        )
        
        return Response({'detail': 'Certification ajoutée avec succès'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def remove_certification(self, request, pk=None):
        shift = self.get_object()
        cert_id = request.data.get('certification_id')
        if not cert_id:
            return Response({'detail': 'certification_id est requis'}, status=status.HTTP_400_BAD_REQUEST)
            
        from .models import ShiftRequiredCertification
        try:
            req_cert = ShiftRequiredCertification.objects.get(shift=shift, certification_id=cert_id)
            req_cert.delete()
            return Response({'detail': 'Certification retirée avec succès'}, status=status.HTTP_200_OK)
        except ShiftRequiredCertification.DoesNotExist:
            return Response({'detail': 'Cette certification n\'est pas requise pour ce poste'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'])
    def available_staff(self, request, pk=None):
        shift = self.get_object()
        shift_date = shift.start_datetime.date()

        # 1. Base: Active staff
        available = Staff.objects.filter(is_active=True)
        
        # 2. Exclude already assigned
        assigned_ids = shift.assignments.values_list('staff_id', flat=True)
        available = available.exclude(id__in=assigned_ids)

        # 3. Exclude absent
        absent_ids = Absence.objects.filter(
            start_date__lte=shift_date
        ).filter(
            Q(actual_end_date__isnull=True, expected_end_date__gte=shift_date) |
            Q(actual_end_date__gte=shift_date)
        ).values_list('staff_id', flat=True)
        available = available.exclude(id__in=absent_ids)

        # 4. Exclude busy (overlapping shifts)
        busy_ids = ShiftAssignment.objects.filter(
            shift__start_datetime__lt=shift.end_datetime,
            shift__end_datetime__gt=shift.start_datetime
        ).values_list('staff_id', flat=True)
        available = available.exclude(id__in=busy_ids)

        # 5. Filter by REQUIRED CERTIFICATIONS
        required_cert_ids = list(shift.required_certifications.values_list('certification_id', flat=True))
        
        if required_cert_ids:
            # We need to find staff who have ALL required certs and they are not expired
            for cert_id in required_cert_ids:
                available = available.filter(
                    certifications__certification_id=cert_id,
                    certifications__obtained_date__lte=shift_date
                ).filter(
                    Q(certifications__expiration_date__isnull=True) | 
                    Q(certifications__expiration_date__gte=shift_date)
                )

        serializer = StaffListSerializer(available, many=True)
        return Response({
            'shift': ShiftListSerializer(shift).data,
            'available_staff': serializer.data,
            'count': available.count()
        })


# ================================================================
# VIEWSET AFFECTATIONS
# ================================================================

class ShiftAssignmentViewSet(viewsets.ModelViewSet):
    queryset = ShiftAssignment.objects.select_related(
        'staff', 'shift', 'shift__care_unit', 'shift__care_unit__service', 'shift__shift_type'
    )

    def get_serializer_class(self):
        if self.action == 'create':
            return ShiftAssignmentCreateSerializer
        return ShiftAssignmentSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        staff_id = self.request.query_params.get('staff')
        if staff_id:
            queryset = queryset.filter(staff_id=staff_id)
        shift_id = self.request.query_params.get('shift')
        if shift_id:
            queryset = queryset.filter(shift_id=shift_id)
        date_param = self.request.query_params.get('date')
        if date_param:
            queryset = queryset.filter(shift__start_datetime__date=date_param)
        return queryset.order_by('-assigned_at')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        staff = serializer.validated_data['staff']
        shift = serializer.validated_data['shift']

        is_valid, errors, warnings = validate_assignment(staff, shift)

        if not is_valid:
            return Response({
                'status': 'error',
                'message': 'Contraintes non respectées.',
                'errors': errors,
                'warnings': warnings
            }, status=status.HTTP_400_BAD_REQUEST)

        self.perform_create(serializer)

        assignment = ShiftAssignment.objects.select_related(
            'staff', 'shift', 'shift__care_unit', 'shift__shift_type'
        ).get(id=serializer.instance.id)

        response_data = {
            'status': 'success',
            'message': f'{staff.full_name} affecté(e) avec succès.',
            'data': ShiftAssignmentSerializer(assignment).data
        }
        if warnings:
            response_data['warnings'] = warnings

        return Response(response_data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        staff_name = instance.staff.full_name
        self.perform_destroy(instance)
        return Response({
            'status': 'success',
            'message': f'Affectation de {staff_name} supprimée.'
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def validate(self, request):
        staff_id = request.data.get('staff')
        shift_id = request.data.get('shift')
        if not staff_id or not shift_id:
            return Response({
                'status': 'error',
                'message': 'staff et shift requis.'
            }, status=status.HTTP_400_BAD_REQUEST)
        is_valid, errors, warnings = validate_assignment(int(staff_id), int(shift_id))
        return Response({
            'is_valid': is_valid,
            'errors': errors,
            'warnings': warnings
        })


# ================================================================
# VIEWSET ABSENCES
# ================================================================

class AbsenceViewSet(viewsets.ModelViewSet):
    queryset = Absence.objects.select_related('staff', 'absence_type')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return AbsenceCreateUpdateSerializer
        return AbsenceSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        staff_id = self.request.query_params.get('staff')
        if staff_id:
            queryset = queryset.filter(staff_id=staff_id)
        current = self.request.query_params.get('current')
        if current and current.lower() == 'true':
            today = date.today()
            queryset = queryset.filter(
                start_date__lte=today
            ).filter(
                Q(actual_end_date__isnull=True, expected_end_date__gte=today) |
                Q(actual_end_date__gte=today)
            )
        is_planned = self.request.query_params.get('is_planned')
        if is_planned is not None:
            queryset = queryset.filter(is_planned=is_planned.lower() == 'true')
        return queryset.order_by('-start_date')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        absence = Absence.objects.select_related('staff', 'absence_type').get(id=serializer.instance.id)
        return Response({
            'status': 'success',
            'message': f'Absence déclarée pour {absence.staff.full_name}.',
            'data': AbsenceSerializer(absence).data
        }, status=status.HTTP_201_CREATED)


# ================================================================
# VIEWSETS DE RÉFÉRENCE
# ================================================================

class RoleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer


class ContractTypeViewSet(viewsets.ModelViewSet):
    queryset = ContractType.objects.all()
    serializer_class = ContractTypeSerializer


class ContractViewSet(viewsets.ModelViewSet):
    queryset = Contract.objects.select_related('staff', 'contract_type')

    def get_serializer_class(self):
        return ContractSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        staff_id = self.request.query_params.get('staff')
        if staff_id:
            queryset = queryset.filter(staff_id=staff_id)
        return queryset.order_by('-start_date')


class CertificationViewSet(viewsets.ModelViewSet):
    """Gestion des certifications"""
    queryset = Certification.objects.all()
    serializer_class = CertificationSerializer


class StaffCertificationViewSet(viewsets.ModelViewSet):
    """Gestion des certifications des soignants"""
    queryset = StaffCertification.objects.select_related('staff', 'certification')
    serializer_class = StaffCertificationSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        staff_id = self.request.query_params.get('staff')
        if staff_id:
            queryset = queryset.filter(staff_id=staff_id)
        certification_id = self.request.query_params.get('certification')
        if certification_id:
            queryset = queryset.filter(certification_id=certification_id)
        return queryset.order_by('-obtained_date')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        staff = serializer.validated_data['staff']
        certification = serializer.validated_data['certification']
        
        # Check if it already exists for RENEWAL
        existing = StaffCertification.objects.filter(staff=staff, certification=certification).first()
        if existing:
            existing.obtained_date = serializer.validated_data['obtained_date']
            existing.expiration_date = serializer.validated_data.get('expiration_date')
            existing.save()
            return Response({
                'status': 'success',
                'message': f'Certification "{certification.name}" mise à jour (renouvellement) pour {staff.full_name}.',
                'data': StaffCertificationSerializer(existing).data
            }, status=status.HTTP_200_OK)
        
        self.perform_create(serializer)
        return Response({
            'status': 'success',
            'message': f'Certification affectée à {staff.full_name}.',
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        staff_name = instance.staff.full_name
        cert_name = instance.certification.name
        self.perform_destroy(instance)
        return Response({
            'status': 'success',
            'message': f'Certification "{cert_name}" retirée de {staff_name}.'
        }, status=status.HTTP_200_OK)


class AbsenceTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AbsenceType.objects.all()
    serializer_class = AbsenceTypeSerializer


class ShiftTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ShiftType.objects.all()
    serializer_class = ShiftTypeSerializer


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer


class CareUnitViewSet(viewsets.ModelViewSet):
    queryset = CareUnit.objects.select_related('service')
    serializer_class = CareUnitSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        service_id = self.request.query_params.get('service')
        if service_id:
            queryset = queryset.filter(service_id=service_id)
        return queryset


class RuleViewSet(viewsets.ModelViewSet):
    queryset = Rule.objects.all()
    serializer_class = RuleSerializer


class PreferenceViewSet(viewsets.ModelViewSet):
    queryset = Preference.objects.select_related('staff')
    serializer_class = PreferenceSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        staff_id = self.request.query_params.get('staff')
        if staff_id:
            queryset = queryset.filter(staff_id=staff_id)
        return queryset