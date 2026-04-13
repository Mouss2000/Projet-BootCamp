# backend/planning/management/commands/seed_data.py

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta
from planning.models import (
    Staff, Role, StaffRole, ContractType, Contract,
    Certification, StaffCertification, Service, CareUnit,
    ShiftType, Shift, AbsenceType, Absence, Rule, Preference,
    StaffServiceAssignment, ShiftAssignment, ShiftRequiredCertification
)


class Command(BaseCommand):
    help = 'Charge des données de test dans la base de données'

    def handle(self, *args, **options):
        self.stdout.write('🚀 Chargement des données de test...\n')

        # ===== TYPES DE CONTRAT =====
        self.stdout.write('  📝 Création des types de contrat...')
        contract_types = [
            {'name': 'CDI', 'max_hours_per_week': 35, 'leave_days_per_year': 25, 'night_shift_allowed': True},
            {'name': 'CDD', 'max_hours_per_week': 35, 'leave_days_per_year': 20, 'night_shift_allowed': True},
            {'name': 'Stage', 'max_hours_per_week': 35, 'leave_days_per_year': 0, 'night_shift_allowed': False},
            {'name': 'Intérim', 'max_hours_per_week': 48, 'leave_days_per_year': 0, 'night_shift_allowed': True},
        ]
        for ct in contract_types:
            ContractType.objects.get_or_create(name=ct['name'], defaults=ct)
        self.stdout.write(self.style.SUCCESS(' ✓'))

        # ===== TYPES DE GARDE =====
        self.stdout.write('  ⏰ Création des types de garde...')
        shift_types = [
            {'name': 'Matin', 'duration_hours': 8, 'requires_rest_after': False},
            {'name': 'Après-midi', 'duration_hours': 8, 'requires_rest_after': False},
            {'name': 'Nuit', 'duration_hours': 10, 'requires_rest_after': True},
            {'name': 'Journée', 'duration_hours': 12, 'requires_rest_after': True},
        ]
        for st in shift_types:
            ShiftType.objects.get_or_create(name=st['name'], defaults=st)
        self.stdout.write(self.style.SUCCESS(' ✓'))

        # ===== TYPES D'ABSENCE =====
        self.stdout.write('  🏖️  Création des types d\'absence...')
        absence_types = [
            {'name': 'Congés payés', 'impacts_quota': True},
            {'name': 'Maladie', 'impacts_quota': False},
            {'name': 'Formation', 'impacts_quota': False},
            {'name': 'Congé maternité', 'impacts_quota': False},
            {'name': 'Congé paternité', 'impacts_quota': False},
            {'name': 'Absence injustifiée', 'impacts_quota': True},
        ]
        for at in absence_types:
            AbsenceType.objects.get_or_create(name=at['name'], defaults=at)
        self.stdout.write(self.style.SUCCESS(' ✓'))

        # ===== CERTIFICATIONS =====
        self.stdout.write('  🎓 Création des certifications...')
        certifications = [
            'Diplôme IDE',
            'Diplôme IADE',
            'Diplôme IBODE',
            'Réanimation',
            'Pédiatrie',
            'Gériatrie',
            'Urgences',
            'Soins palliatifs',
        ]
        for cert_name in certifications:
            Certification.objects.get_or_create(name=cert_name)
        self.stdout.write(self.style.SUCCESS(' ✓'))

        # ===== RÔLES =====
        self.stdout.write('  👔 Création des rôles...')
        roles = ['Infirmier', 'Aide-soignant', 'Médecin', 'Cadre de santé', 'Interne']
        for role_name in roles:
            Role.objects.get_or_create(name=role_name)
        self.stdout.write(self.style.SUCCESS(' ✓'))

        # ===== SERVICES =====
        self.stdout.write('  🏥 Création des services...')
        services_data = [
            {'name': 'Urgences', 'bed_capacity': 30, 'criticality_level': 5},
            {'name': 'Cardiologie', 'bed_capacity': 25, 'criticality_level': 4},
            {'name': 'Pédiatrie', 'bed_capacity': 20, 'criticality_level': 3},
            {'name': 'Chirurgie', 'bed_capacity': 35, 'criticality_level': 4},
            {'name': 'Médecine générale', 'bed_capacity': 40, 'criticality_level': 2},
            {'name': 'Réanimation', 'bed_capacity': 15, 'criticality_level': 5},
        ]
        services = {}
        for s in services_data:
            service, _ = Service.objects.get_or_create(name=s['name'], defaults=s)
            services[s['name']] = service
        self.stdout.write(self.style.SUCCESS(' ✓'))

        # ===== UNITÉS DE SOINS =====
        self.stdout.write('  🛏️  Création des unités de soins...')
        care_units_data = [
            ('Urgences', ['Urgences A', 'Urgences B', 'UHCD']),
            ('Cardiologie', ['USI Cardio', 'Cardio Standard']),
            ('Pédiatrie', ['Pédiatrie 1', 'Néonatologie']),
            ('Chirurgie', ['Chirurgie A', 'Chirurgie B']),
            ('Médecine générale', ['Médecine 1', 'Médecine 2']),
            ('Réanimation', ['Réanimation']),
        ]
        care_units = {}
        for service_name, units in care_units_data:
            for unit_name in units:
                cu, _ = CareUnit.objects.get_or_create(
                    service=services[service_name],
                    name=unit_name
                )
                care_units[f"{service_name}-{unit_name}"] = cu
        self.stdout.write(self.style.SUCCESS(' ✓'))

        # ===== SOIGNANTS =====
        self.stdout.write('  👨‍⚕️ Création des soignants...')
        staff_data = [
            ('Marie', 'Dupont', 'marie.dupont@hospital.fr', '0601020304'),
            ('Jean', 'Martin', 'jean.martin@hospital.fr', '0602030405'),
            ('Sophie', 'Bernard', 'sophie.bernard@hospital.fr', '0603040506'),
            ('Pierre', 'Petit', 'pierre.petit@hospital.fr', '0604050607'),
            ('Lucie', 'Robert', 'lucie.robert@hospital.fr', '0605060708'),
            ('Thomas', 'Richard', 'thomas.richard@hospital.fr', '0606070809'),
            ('Emma', 'Durand', 'emma.durand@hospital.fr', '0607080910'),
            ('Lucas', 'Leroy', 'lucas.leroy@hospital.fr', '0608091011'),
            ('Chloé', 'Moreau', 'chloe.moreau@hospital.fr', '0609101112'),
            ('Hugo', 'Simon', 'hugo.simon@hospital.fr', '0610111213'),
        ]
        staff_list = []
        for first, last, email, phone in staff_data:
            staff, _ = Staff.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': first,
                    'last_name': last,
                    'phone': phone,
                    'is_active': True
                }
            )
            staff_list.append(staff)
        # Hugo est inactif
        hugo = Staff.objects.get(email='hugo.simon@hospital.fr')
        hugo.is_active = False
        hugo.save()
        self.stdout.write(self.style.SUCCESS(' ✓'))

        # ===== CONTRATS =====
        self.stdout.write('  📄 Création des contrats...')
        today = timezone.now().date()
        cdi = ContractType.objects.get(name='CDI')
        cdd = ContractType.objects.get(name='CDD')
        stage = ContractType.objects.get(name='Stage')

        contracts_data = [
            (staff_list[0], cdi, today - timedelta(days=365*4), None, 100),    # Marie CDI
            (staff_list[1], cdi, today - timedelta(days=365*5), None, 100),    # Jean CDI
            (staff_list[2], cdi, today - timedelta(days=365*3), None, 80),     # Sophie CDI 80%
            (staff_list[3], cdd, today - timedelta(days=180), today + timedelta(days=180), 100),  # Pierre CDD
            (staff_list[4], stage, today - timedelta(days=30), today + timedelta(days=60), 100),  # Lucie Stage
            (staff_list[5], cdi, today - timedelta(days=365*2), None, 100),    # Thomas CDI
            (staff_list[6], cdi, today - timedelta(days=365*6), None, 100),    # Emma CDI
            (staff_list[7], cdd, today - timedelta(days=90), today + timedelta(days=270), 100),   # Lucas CDD
            (staff_list[8], cdi, today - timedelta(days=365), None, 50),       # Chloé CDI 50%
            (staff_list[9], cdi, today - timedelta(days=365*7), None, 100),    # Hugo CDI
        ]
        for staff, ct, start, end, workload in contracts_data:
            Contract.objects.get_or_create(
                staff=staff,
                contract_type=ct,
                start_date=start,
                defaults={'end_date': end, 'workload_percent': workload}
            )
        self.stdout.write(self.style.SUCCESS(' ✓'))

        # ===== CERTIFICATIONS DES SOIGNANTS =====
        self.stdout.write('  🎖️  Attribution des certifications...')
        ide = Certification.objects.get(name='Diplôme IDE')
        rea = Certification.objects.get(name='Réanimation')
        urg = Certification.objects.get(name='Urgences')
        ped = Certification.objects.get(name='Pédiatrie')
        ibode = Certification.objects.get(name='Diplôme IBODE')
        ger = Certification.objects.get(name='Gériatrie')

        cert_data = [
            # Marie: IDE + Réa + Urgences
            (staff_list[0], ide, today - timedelta(days=365*6), today + timedelta(days=365*4)),
            (staff_list[0], rea, today - timedelta(days=365*4), today + timedelta(days=365)),
            (staff_list[0], urg, today - timedelta(days=365*3), today + timedelta(days=365*2)),
            # Jean: IDE
            (staff_list[1], ide, today - timedelta(days=365*7), today + timedelta(days=365*3)),
            # Sophie: IDE + Pédiatrie
            (staff_list[2], ide, today - timedelta(days=365*5), today + timedelta(days=365*5)),
            (staff_list[2], ped, today - timedelta(days=365*3), today + timedelta(days=365*2)),
            # Pierre: IDE
            (staff_list[3], ide, today - timedelta(days=365*2), today + timedelta(days=365*8)),
            # Lucie: IDE (stagiaire)
            (staff_list[4], ide, today - timedelta(days=30), today + timedelta(days=365*10)),
            # Thomas: IDE + Réa
            (staff_list[5], ide, today - timedelta(days=365*4), today + timedelta(days=365*6)),
            (staff_list[5], rea, today - timedelta(days=365*2), today + timedelta(days=365*3)),
            # Emma: IDE + IBODE
            (staff_list[6], ide, today - timedelta(days=365*8), today + timedelta(days=365*2)),
            (staff_list[6], ibode, today - timedelta(days=365*6), today + timedelta(days=365*4)),
            # Lucas: IDE
            (staff_list[7], ide, today - timedelta(days=365*2), today + timedelta(days=365*8)),
            # Chloé: IDE + Gériatrie
            (staff_list[8], ide, today - timedelta(days=365*3), today + timedelta(days=365*7)),
            (staff_list[8], ger, today - timedelta(days=365), today + timedelta(days=365*4)),
        ]
        for staff, cert, obtained, expires in cert_data:
            StaffCertification.objects.get_or_create(
                staff=staff,
                certification=cert,
                defaults={'obtained_date': obtained, 'expiration_date': expires}
            )
        self.stdout.write(self.style.SUCCESS(' ✓'))

        # ===== RÔLES DES SOIGNANTS =====
        self.stdout.write('  👤 Attribution des rôles...')
        infirmier = Role.objects.get(name='Infirmier')
        for staff in staff_list:
            StaffRole.objects.get_or_create(staff=staff, role=infirmier)
        self.stdout.write(self.style.SUCCESS(' ✓'))

        # ===== AFFECTATIONS AUX SERVICES =====
        self.stdout.write('  🏢 Affectation aux services...')
        assignments = [
            (staff_list[0], services['Urgences']),
            (staff_list[1], services['Cardiologie']),
            (staff_list[2], services['Pédiatrie']),
            (staff_list[3], services['Urgences']),
            (staff_list[4], services['Médecine générale']),
            (staff_list[5], services['Réanimation']),
            (staff_list[6], services['Chirurgie']),
            (staff_list[7], services['Médecine générale']),
            (staff_list[8], services['Médecine générale']),
        ]
        for staff, service in assignments:
            StaffServiceAssignment.objects.get_or_create(
                staff=staff,
                service=service,
                start_date=today - timedelta(days=365),
                defaults={'end_date': None}
            )
        self.stdout.write(self.style.SUCCESS(' ✓'))

        # ===== RÈGLES MÉTIER =====
        self.stdout.write('  📏 Création des règles métier...')
        rules = [
            {
                'name': 'Repos après nuit',
                'description': 'Repos minimum obligatoire après une garde de nuit',
                'rule_type': 'rest_time',
                'value': 11,
                'unit': 'hours',
                'valid_from': today - timedelta(days=365*5)
            },
            {
                'name': 'Heures max hebdo',
                'description': 'Maximum d\'heures de travail par semaine',
                'rule_type': 'max_hours',
                'value': 48,
                'unit': 'hours',
                'valid_from': today - timedelta(days=365*5)
            },
            {
                'name': 'Effectif min urgences',
                'description': 'Effectif minimum aux urgences par garde',
                'rule_type': 'min_staff',
                'value': 3,
                'unit': 'staff',
                'valid_from': today - timedelta(days=365*5)
            },
        ]
        for rule in rules:
            Rule.objects.get_or_create(name=rule['name'], defaults=rule)
        self.stdout.write(self.style.SUCCESS(' ✓'))

        # ===== POSTES DE GARDE =====
        self.stdout.write('  🗑️  Nettoyage des anciens postes...')
        ShiftAssignment.objects.all().delete()
        Shift.objects.all().delete()
        self.stdout.write(self.style.SUCCESS(' ✓'))

        self.stdout.write('  📅 Création des postes de garde (14 jours)...')
        matin = ShiftType.objects.get(name='Matin')
        aprem = ShiftType.objects.get(name='Après-midi')
        nuit = ShiftType.objects.get(name='Nuit')

        units_for_shifts = [
            care_units['Urgences-Urgences A'],
            care_units['Urgences-Urgences B'],
            care_units['Cardiologie-USI Cardio'],
            care_units['Pédiatrie-Pédiatrie 1'],
            care_units['Réanimation-Réanimation'],
        ]

        for i in range(14):  # Augmenté à 14 jours
            shift_date = today + timedelta(days=i)
            for unit in units_for_shifts:
                # Matin 07:00-15:00
                Shift.objects.get_or_create(
                    care_unit=unit,
                    shift_type=matin,
                    start_datetime=timezone.make_aware(
                        datetime.combine(shift_date, datetime.strptime('07:00', '%H:%M').time())
                    ),
                    defaults={
                        'end_datetime': timezone.make_aware(
                            datetime.combine(shift_date, datetime.strptime('15:00', '%H:%M').time())
                        ),
                        'min_staff': 2,
                        'max_staff': 4
                    }
                )
                # Après-midi 15:00-23:00
                Shift.objects.get_or_create(
                    care_unit=unit,
                    shift_type=aprem,
                    start_datetime=timezone.make_aware(
                        datetime.combine(shift_date, datetime.strptime('15:00', '%H:%M').time())
                    ),
                    defaults={
                        'end_datetime': timezone.make_aware(
                            datetime.combine(shift_date, datetime.strptime('23:00', '%H:%M').time())
                        ),
                        'min_staff': 2,
                        'max_staff': 4
                    }
                )
                # Nuit 23:00-07:00
                Shift.objects.get_or_create(
                    care_unit=unit,
                    shift_type=nuit,
                    start_datetime=timezone.make_aware(
                        datetime.combine(shift_date, datetime.strptime('23:00', '%H:%M').time())
                    ),
                    defaults={
                        'end_datetime': timezone.make_aware(
                            datetime.combine(shift_date + timedelta(days=1), datetime.strptime('07:00', '%H:%M').time())
                        ),
                        'min_staff': 1,
                        'max_staff': 3
                    }
                )
        self.stdout.write(self.style.SUCCESS(' ✓'))

        # ===== CERTIFICATIONS REQUISES POUR RÉANIMATION =====
        self.stdout.write('  🔒 Ajout des certifications requises pour Réa...')
        rea_shifts = Shift.objects.filter(care_unit__name='Réanimation')
        rea_cert = Certification.objects.get(name='Réanimation')
        for shift in rea_shifts:
            ShiftRequiredCertification.objects.get_or_create(
                shift=shift,
                certification=rea_cert
            )
        self.stdout.write(self.style.SUCCESS(' ✓'))

        # ===== QUELQUES AFFECTATIONS =====
        self.stdout.write('  ✅ Création de quelques affectations...')
        today_shifts = Shift.objects.filter(
            start_datetime__date=today,
            shift_type__name='Matin'
        )
        
        for shift in today_shifts[:3]:
            available_staff = staff_list[:5]
            for staff in available_staff[:2]:
                ShiftAssignment.objects.get_or_create(
                    shift=shift,
                    staff=staff
                )
        self.stdout.write(self.style.SUCCESS(' ✓'))

        # ===== QUELQUES ABSENCES =====
        self.stdout.write('  🏖️  Création de quelques absences...')
        conges = AbsenceType.objects.get(name='Congés payés')
        maladie = AbsenceType.objects.get(name='Maladie')
        
        Absence.objects.get_or_create(
            staff=staff_list[9],  # Hugo
            absence_type=conges,
            start_date=today,
            defaults={
                'expected_end_date': today + timedelta(days=14),
                'is_planned': True
            }
        )
        Absence.objects.get_or_create(
            staff=staff_list[6],  # Emma
            absence_type=maladie,
            start_date=today + timedelta(days=2),
            defaults={
                'expected_end_date': today + timedelta(days=5),
                'is_planned': False
            }
        )
        self.stdout.write(self.style.SUCCESS(' ✓'))

        # ===== PRÉFÉRENCES =====
        self.stdout.write('  ⭐ Création de quelques préférences...')
        Preference.objects.get_or_create(
            staff=staff_list[2],  # Sophie
            type='constraint',
            description='Ne peut pas travailler le mercredi (garde enfant)',
            defaults={
                'is_hard_constraint': True,
                'start_date': today - timedelta(days=365),
                'end_date': None
            }
        )
        Preference.objects.get_or_create(
            staff=staff_list[8],  # Chloé
            type='preference',
            description='Préfère les matins',
            defaults={
                'is_hard_constraint': False,
                'start_date': today - timedelta(days=180),
                'end_date': None
            }
        )
        Preference.objects.get_or_create(
            staff=staff_list[0],  # Marie
            type='constraint',
            description='Pas de nuit les weekends',
            defaults={
                'is_hard_constraint': True,
                'start_date': today - timedelta(days=365),
                'end_date': today + timedelta(days=365)
            }
        )
        self.stdout.write(self.style.SUCCESS(' ✓'))

        # ===== RÉSUMÉ =====
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('✅ DONNÉES DE TEST CHARGÉES AVEC SUCCÈS !'))
        self.stdout.write('='*50)
        self.stdout.write(f'\n📊 Résumé :')
        self.stdout.write(f'   • {Staff.objects.count()} soignants')
        self.stdout.write(f'   • {Service.objects.count()} services')
        self.stdout.write(f'   • {CareUnit.objects.count()} unités de soins')
        self.stdout.write(f'   • {Shift.objects.count()} postes de garde')
        self.stdout.write(f'   • {ShiftAssignment.objects.count()} affectations')
        self.stdout.write(f'   • {Certification.objects.count()} certifications')
        self.stdout.write(f'   • {Contract.objects.count()} contrats')
        self.stdout.write(f'   • {Absence.objects.count()} absences')
        self.stdout.write(f'   • {Rule.objects.count()} règles métier')
        self.stdout.write('')