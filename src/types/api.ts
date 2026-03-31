// Authentication Types
export type Role = 'system_admin' | 'facility_admin' | 'department_head' | 'liaison_officer' | 'doctor' | 'hew';

export interface User {
  id: string;
  username?: string;
  fullName?: string;
  role?: Role;
  departmentId?: string;
  facilityId?: string;
  active?: boolean;
  lastLogin?: string;
  phone?: string;
  email?: string;
  profileImageUrl?: string;
  location?: string;
  birthDate?: string;
  specialityDescription?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Facility Types
export type FacilityType = 'health_center' | 'primary_hospital' | 'general_hospital' | 'specialized_hospital';
export type ServiceStatus = 'Available' | 'Limited' | 'Unavailable';

export interface Service {
  id: string;
  serviceType?: string;
  status?: ServiceStatus;
  estimatedDelayDays?: number;
}

export interface Facility {
  id: string;
  name?: string;
  type?: FacilityType;
  location?: string;
  contact?: string;
  services?: Service[];
}

export interface CreateFacilityRequest {
  name: string;
  type: FacilityType;
  location: string;
  contact?: string;
  adminUsername: string;
  adminPassword: string;
}

// Department Types
export interface Department {
  id: string;
  name?: string;
  facilityId?: string;
}

// Referral Types
export type ReferralPriority = 'routine' | 'urgent' | 'emergency';
export type ReferralStatus = 'draft' | 'pending' | 'accepted' | 'rejected' | 'forwarded' | 'completed';
export type PatientGender = 'male' | 'female' | 'other' | 'unknown';

export interface DischargeSummary {
  id: string;
  referralId?: string;
  summary?: string;
  finalDiagnosis?: string;
  medicationsPrescribed?: string;
  followUpInstructions?: string;
  dischargeDate?: string;
  completedBy?: User;
}

export interface Referral {
  id: string;
  patientName?: string;
  patientDob?: string;
  patientGender?: PatientGender;
  patientPhone?: string;
  referringFacility?: Facility;
  referringUser?: User;
  receivingFacility?: Facility;
  priority?: ReferralPriority;
  clinicalSummary?: string;
  primaryDiagnosis?: string;
  treatmentGiven?: string;
  reason?: string;
  status?: ReferralStatus;
  createdAt?: string;
  acceptedAt?: string;
  waitingTime?: string;
  forwardingNote?: string;
  forwardedTo?: Facility;
  appointmentDate?: string;
  dischargeSummary?: DischargeSummary;
}

export interface CreateReferralRequest {
  patientName: string;
  patientDob: string;
  patientGender?: PatientGender;
  patientPhone?: string;
  receivingFacilityId: string;
  priority: ReferralPriority;
  clinicalSummary: string;
  primaryDiagnosis: string;
  treatmentGiven?: string;
  reason: string;
  consentGiven: boolean;
  allergies?: string;
  pastMedicalHistory?: string;
  currentMedications?: string;
}

// General Types
export interface ErrorResponse {
  statusCode?: number;
  message?: string;
  error?: string;
}
