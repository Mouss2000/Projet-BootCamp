# backend/backend/urls.py

from django.contrib import admin
from django.urls import path, include
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(['GET'])
def api_root(request):
    """Point d'entrée de l'API avec documentation"""
    return Response({
        'message': 'Bienvenue sur l\'API Healthcare Planning',
        'version': '1.0',
        'endpoints': {
            'staff': {
                'list': '/api/staff/',
                'detail': '/api/staff/{id}/',
                'absences': '/api/staff/{id}/absences/',
                'shifts': '/api/staff/{id}/shifts/',
                'certifications': '/api/staff/{id}/certifications/',
            },
            'shifts': {
                'list': '/api/shifts/',
                'detail': '/api/shifts/{id}/',
                'available_staff': '/api/shifts/{id}/available_staff/',
            },
            'assignments': {
                'list': '/api/assignments/',
                'create': '/api/assignments/',
                'validate': '/api/assignments/validate/',
                'delete': '/api/assignments/{id}/',
            },
            'absences': {
                'list': '/api/absences/',
                'create': '/api/absences/',
            },
            'reference_data': {
                'services': '/api/services/',
                'care_units': '/api/care-units/',
                'shift_types': '/api/shift-types/',
                'contract_types': '/api/contract-types/',
                'certifications': '/api/certifications/',
                'absence_types': '/api/absence-types/',
                'roles': '/api/roles/',
                'rules': '/api/rules/',
            }
        }
    })


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('planning.urls')),
    path('', api_root, name='api-root'),
]