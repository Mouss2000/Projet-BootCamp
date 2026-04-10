# backend/planning/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

# Routes principales
router.register(r'staff', views.StaffViewSet, basename='staff')
router.register(r'shifts', views.ShiftViewSet, basename='shift')
router.register(r'assignments', views.ShiftAssignmentViewSet, basename='assignment')
router.register(r'absences', views.AbsenceViewSet, basename='absence')

# Routes de référence
router.register(r'roles', views.RoleViewSet, basename='role')
router.register(r'contract-types', views.ContractTypeViewSet, basename='contract-type')
router.register(r'contracts', views.ContractViewSet, basename='contract')
router.register(r'certifications', views.CertificationViewSet, basename='certification')
router.register(r'staff-certifications', views.StaffCertificationViewSet, basename='staff-certification')  # NOUVEAU
router.register(r'absence-types', views.AbsenceTypeViewSet, basename='absence-type')
router.register(r'shift-types', views.ShiftTypeViewSet, basename='shift-type')
router.register(r'services', views.ServiceViewSet, basename='service')
router.register(r'care-units', views.CareUnitViewSet, basename='care-unit')
router.register(r'rules', views.RuleViewSet, basename='rule')
router.register(r'preferences', views.PreferenceViewSet, basename='preference')

urlpatterns = [
    path('', include(router.urls)),
]