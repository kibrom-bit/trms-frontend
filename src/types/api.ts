// Authentication Types
export enum UserRole {
  SYSTEM_ADMIN = 'system_admin',
  FACILITY_ADMIN = 'facility_admin',
  DEPARTMENT_HEAD = 'department_head',
  LIAISON_OFFICER = 'liaison_officer',
  DOCTOR = 'doctor',
  HEW = 'hew'
}

export interface User {
  id: string;
  username?: string;
  fullName?: string;
  role?: UserRole;
  departmentId?: string;
  departmentName?: string;
  facilityId?: string;
  facilityName?: string;
  active: boolean;
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
export enum DepartmentType {
  CLINICAL = 'clinical',
  LIAISON = 'liaison',
}

export type FacilityType = 
  | 'health_center' 
  | 'primary_hospital' 
  | 'general_hospital' 
  | 'specialized_hospital';
export enum ServiceStatus {
  AVAILABLE = 'available',
  LIMITED = 'limited',
  UNAVAILABLE = 'unavailable',
}

export enum NotificationType {
  NEW_REFERRAL = 'NEW_REFERRAL',
  REFERRAL_ACCEPTED = 'REFERRAL_ACCEPTED',
  REFERRAL_REJECTED = 'REFERRAL_REJECTED',
  REFERRAL_FORWARDED = 'REFERRAL_FORWARDED',
  DISCHARGE_SUMMARY_COMPLETED = 'DISCHARGE_SUMMARY_COMPLETED',
  SERVICE_STATUS_UPDATED = 'SERVICE_STATUS_UPDATED',
  DEPARTMENT_CREATED = 'DEPARTMENT_CREATED',
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  FACILITY_CREATED = 'FACILITY_CREATED',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
}

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
  profileImageUrl?: string;
  updatedAt?: string;
  services?: Service[];
  departmentCount?: number;
  userCount?: number;
  referralCount?: number;
}

export interface FacilityDetails {
  facility: Facility;
  admin: {
    id: string;
    username: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    profileImageUrl: string | null;
    lastLogin?: string;
  } | null;
  departmentCount: number;
  clinicianCount: number;
  referralCount: number;
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
  type?: DepartmentType;
  facilityId?: string;
  facilityName?: string;
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
  referringUserId: string;
  receivingFacilityId: string;
  receivingDepartmentId?: string;
  status: ReferralStatus;
  createdAt?: string;
  syncedAt?: string;
  forwardedFromReferralId?: string;
  forwardingNote?: string;
  forwardedTo?: Facility;
  appointmentDate?: string;
  waitingTime?: string;
  rejectionReason?: string;
  acceptedAt?: string;
  acceptedByUserId?: string;
  rejectedByUserId?: string;
  dischargeSummary?: DischargeSummary;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: NotificationType;
  targetId?: string;
  isRead: boolean;
  createdAt: string;
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
