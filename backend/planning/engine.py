# backend/planning/engine.py

import logging
from datetime import timedelta, date
from django.db import transaction
from django.db.models import Count, Q
from .models import Shift, Staff, ShiftAssignment, Preference, Rule, Contract
from .validators import validate_assignment

logger = logging.getLogger(__name__)

class PlanningEngine:
    """
    Engine for automatic planning generation with detailed penalty tracking.
    """

    def __init__(self, start_date, end_date, service_id=None):
        self.start_date = start_date
        self.end_date = end_date
        self.service_id = service_id
        self.stats = {
            'total_shifts': 0,
            'assigned': 0,
            'failed': 0,
            'global_score': 0,
            'breakdown': {
                'workload_equity': 0,
                'weekend_equity': 0,
                'preferences': 0,
                'fatigue': 0,
                'continuity_bonus': 0
            }
        }

    def generate(self):
        # 1. Get all shifts for the period
        shifts = Shift.objects.filter(
            start_datetime__date__gte=self.start_date,
            start_datetime__date__lte=self.end_date
        ).prefetch_related('required_certifications', 'assignments')

        if self.service_id:
            shifts = shifts.filter(care_unit__service_id=self.service_id)

        if not shifts.exists():
            return {
                'error': f"Aucun poste de garde n'existe entre le {self.start_date} et le {self.end_date}. Veuillez d'abord créer les créneaux vides (Phase 2)."
            }

        shifts = shifts.order_by('start_datetime', 'shift_type__name')
        self.stats['total_shifts'] = shifts.count()
        all_staff = list(Staff.objects.filter(is_active=True))

        with transaction.atomic():
            for shift in shifts:
                needed = shift.min_staff - shift.assignments.count()
                if needed <= 0: continue

                for _ in range(needed):
                    already_assigned_ids = shift.assignments.values_list('staff_id', flat=True)
                    eligible_staff = [s for s in all_staff if s.id not in already_assigned_ids]
                    
                    best_staff, best_breakdown = self._find_best_staff(shift, eligible_staff)
                    
                    if best_staff:
                        ShiftAssignment.objects.create(staff=best_staff, shift=shift)
                        self.stats['assigned'] += 1
                        # Update global stats
                        for key in self.stats['breakdown']:
                            self.stats['breakdown'][key] += best_breakdown[key]
                        self.stats['global_score'] += sum(v for v in best_breakdown.values())
                    else:
                        self.stats['failed'] += 1

        return self.stats

    def _find_best_staff(self, shift, candidates):
        best_candidate = None
        best_breakdown = None
        lowest_penalty = float('inf')

        for staff in candidates:
            is_valid, _, _ = validate_assignment(staff, shift)
            if not is_valid: continue

            breakdown = self._calculate_detailed_penalties(staff, shift)
            total_penalty = sum(v for v in breakdown.values())

            if total_penalty < lowest_penalty:
                lowest_penalty = total_penalty
                best_candidate = staff
                best_breakdown = breakdown
            
            if total_penalty <= 0: break # Perfect match

        return best_candidate, best_breakdown

    def _calculate_detailed_penalties(self, staff, shift):
        p = {
            'workload_equity': 0,
            'weekend_equity': 0,
            'preferences': 0,
            'fatigue': 0,
            'continuity_bonus': 0
        }
        
        # 1. Workload Equity (10 pts per shift in current period)
        p['workload_equity'] = ShiftAssignment.objects.filter(
            staff=staff,
            shift__start_datetime__date__gte=self.start_date,
            shift__start_datetime__date__lte=self.end_date
        ).count() * 10

        # 2. Weekend Equity (Refined)
        # Weight: 40 pts per weekend worked in the last 90 days (Quarterly)
        if shift.start_datetime.date().weekday() >= 5: # Saturday (5) or Sunday (6)
            lookback_90d = shift.start_datetime.date() - timedelta(days=90)
            weekend_shifts_count = ShiftAssignment.objects.filter(
                staff=staff,
                shift__start_datetime__date__gte=lookback_90d,
                shift__start_datetime__date__lt=shift.start_datetime.date(),
                shift__start_datetime__date__week_day__in=[1, 7] # Django week_day: 1=Sun, 7=Sat
            ).values('shift__start_datetime__date').distinct().count()
            p['weekend_equity'] = weekend_shifts_count * 40

        # 3. Preferences (20 pts)
        pref_violations = Preference.objects.filter(
            staff=staff, type='preference', is_hard_constraint=False,
            start_date__lte=shift.start_datetime.date()
        ).filter(Q(end_date__isnull=True) | Q(end_date__gte=shift.start_datetime.date()))
        
        for pref in pref_violations:
            if pref.description.lower() in shift.shift_type.name.lower():
                p['preferences'] += 20

        # 4. Service Continuity (Bonus -10 pts)
        if ShiftAssignment.objects.filter(
            staff=staff, shift__care_unit__service=shift.care_unit.service,
            shift__start_datetime__date__gte=shift.start_datetime.date() - timedelta(days=3),
            shift__start_datetime__date__lt=shift.start_datetime.date()
        ).exists():
            p['continuity_bonus'] = -10

        # 5. Fatigue (30 pts)
        if 'nuit' in shift.shift_type.name.lower():
            if ShiftAssignment.objects.filter(
                staff=staff, shift__shift_type__name__icontains='nuit',
                shift__end_datetime__gte=shift.start_datetime - timedelta(hours=48),
                shift__end_datetime__lte=shift.start_datetime
            ).exists():
                p['fatigue'] = 30

        return p
