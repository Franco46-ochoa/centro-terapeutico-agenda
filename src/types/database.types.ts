import type { AppRole, ClinicalEntryType, DayOfWeek } from './clinical';

export interface Database {
  public: {
    Tables: {
      centers: {
        Row: {
          id: string;
          name: string;
          start_hour: number;
          end_hour: number;
          slot_duration_mins: number;
          include_saturday: boolean;
          created_at: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          center_id: string;
          full_name: string;
          license_number: string | null;
          role: AppRole;
          is_active: boolean;
          created_at: string;
        };
      };
      patients: {
        Row: {
          id: string;
          center_id: string;
          full_name: string;
          age_years: number;
          tutor_name: string;
          tutor_phone: string;
          consent_signed_at: string | null;
          absences_count: number;
          slot_day: DayOfWeek | null;
          slot_hour: string | null;
          archived_at: string | null;
          archived_by: string | null;
          archive_reason: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      patient_clinical_profiles: {
        Row: {
          patient_id: string;
          center_id: string;
          condition_label: string;
          updated_by: string | null;
          updated_at: string;
        };
      };
      clinical_entries: {
        Row: {
          id: string;
          patient_id: string;
          center_id: string;
          author_id: string;
          session_date: string;
          type: ClinicalEntryType;
          title: string;
          content: string;
          amends_entry_id: string | null;
          is_ai_generated: boolean;
          created_at: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          center_id: string | null;
          actor_id: string | null;
          actor_role: string | null;
          action: string;
          table_name: string;
          record_id: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
      };
    };
  };
}
