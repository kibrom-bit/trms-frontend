import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { FacilityDetails, UserRole } from '../../types/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { 
  IconArrowLeft, 
  IconBuilding, 
  IconUsers, 
  IconStethoscope, 
  IconDotsVertical, 
  IconTrash, 
  IconEdit, 
  IconKey, 
  IconCheck, 
  IconX, 
  IconAlertTriangle,
  IconClock,
  IconShieldLock,
  IconChevronRight,
  IconPlus,
  IconExternalLink,
  IconLoader2
} from '@tabler/icons-react';
import { AvatarUpload } from '../../components/AvatarUpload';
import { validatePassword } from '../../utils/password-validation';
import { getBackendUrl } from '../../utils/url-utils';

export default function FacilityDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isEditingAdmin, setIsEditingAdmin] = useState(false);
  const [isEditingFacility, setIsEditingFacility] = useState(false);

  const [adminData, setAdminData] = useState({
    username: '',
    password: '',
    currentPassword: ''
  });

  const [facilityData, setFacilityData] = useState({
    name: '',
    location: '',
    contact: '',
    profileImageUrl: ''
  });

  // Fetch Facility Details
  const { data: details, isLoading, isError } = useQuery({
    queryKey: ['facility-details', id],
    queryFn: async () => {
      const response = await apiClient.get<FacilityDetails>(`/facilities/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  // Mutations
  const updateFacilityMutation = useMutation({
    mutationFn: (data: any) => apiClient.patch(`/facilities/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-details', id] });
      setIsEditingFacility(false);
    },
  });

  const updateAdminMutation = useMutation({
    mutationFn: (data: any) => apiClient.patch(`/users/${details?.admin?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-details', id] });
      setIsEditingAdmin(false);
      setAdminData(prev => ({ ...prev, password: '', currentPassword: '' }));
    },
  });

  // Sync form data
  useEffect(() => {
    if (details) {
      setFacilityData({
        name: details.facility.name || '',
        location: details.facility.location || '',
        contact: details.facility.contact || '',
        profileImageUrl: details.facility.profileImageUrl || ''
      });
      setAdminData({
        username: details.admin?.username || '',
        password: '',
        currentPassword: ''
      });
    }
  }, [details]);

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!details?.admin) return;
    
    if (adminData.password) {
      const strength = validatePassword(adminData.password);
      if (!strength.isValid) {
        alert(strength.errors.join('\n'));
        return;
      }
    }

    const payload: any = { username: adminData.username };
    if (adminData.password) {
      payload.password = adminData.password;
      payload.currentPassword = adminData.currentPassword;
    }
    
    updateAdminMutation.mutate(payload, {
      onError: (err: any) => {
        const msg = err?.response?.data?.message || 'Update failed';
        alert(`SECURITY AUDIT: ${msg}`);
      }
    });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-[70vh]">
      <IconLoader2 size={48} className="text-primary-600 animate-spin" />
    </div>
  );

  if (isError || !details) return (
    <div className="p-12 text-center space-y-4">
      <IconAlertTriangle size={64} className="text-red-500 mx-auto" />
      <h2 className="text-2xl font-black uppercase text-primary-900">Node Synchronization Failed</h2>
      <Button onClick={() => navigate('/admin/facilities')}>Return to Network Registry</Button>
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto space-y-24 py-12 px-6 animate-in fade-in duration-700">
      
      {/* 1. Header & Identity Section (Swiss-Minimalist) */}
      <section className="space-y-12">
        <button 
          onClick={() => navigate('/admin/facilities')}
          className="flex items-center gap-2 text-[10px] font-black text-primary-600 hover:text-primary-900 transition-all uppercase tracking-[0.3em] mb-4"
        >
          <IconArrowLeft size={16} /> Network Registry
        </button>

        <div className="flex flex-col md:flex-row items-start gap-10 border-b border-primary-50 pb-12">
          <AvatarUpload 
            currentImageUrl={facilityData.profileImageUrl}
            onUploadSuccess={(url) => {
              setFacilityData({ ...facilityData, profileImageUrl: url });
              updateFacilityMutation.mutate({ profileImageUrl: url });
            }}
          />
          
          <div className="flex-1 space-y-4 min-w-0">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Node Operational
              </span>
              <span className="text-[10px] font-black text-primary-200 uppercase select-none">/</span>
              <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">
                {details.facility.type}
              </span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-black text-primary-900 tracking-tighter leading-none uppercase break-words">
              {details.facility.name}
            </h1>
            
            <div className="flex flex-wrap gap-6 pt-2">
              <InfoBlock label="Administrative Hub" value={details.facility.location || 'Not Specified'} />
              <InfoBlock label="Clinical Contact" value={details.facility.contact || 'No Direct Link'} />
              <InfoBlock label="Network Status" value="Public Node" color="text-primary-600" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Operational Metrics (Minified) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-12 border-b border-primary-50 pb-16">
        <MetricCard icon={<IconBuilding size={24} />} label="Unit Registry" value={details.departmentCount} subValue="Clinical Units" />
        <MetricCard icon={<IconUsers size={24} />} label="Active Personnel" value={details.clinicianCount} subValue="On-Call Staff" />
        <MetricCard icon={<IconStethoscope size={24} />} label="Referral Volume" value={details.referralCount} subValue="Load Balance" />
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-24">
        {/* 3. Node Governance (Typography and Accents) */}
        <section className="space-y-10">
          <header className="space-y-1.5">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary-500">Identity Governance</h3>
            <p className="text-sm font-bold text-primary-900 uppercase tracking-tight">Node Access Management</p>
          </header>

          <div className="p-8 border-[0.5px] border-primary-100/50 rounded-[2rem] space-y-8 bg-white/40 backdrop-blur-xl shadow-inner group hover:border-primary-900/20 transition-all duration-500">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-primary-900 flex items-center justify-center text-white text-3xl font-black uppercase shadow-2xl shadow-primary-900/30">
                {details.admin?.fullName?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-primary-500 uppercase tracking-widest mb-1">Facility Administrator</p>
                <h4 className="text-2xl font-black text-primary-900 uppercase truncate leading-none">{details.admin?.fullName || 'Root Admin'}</h4>
               <div className="mt-4 flex items-center gap-4">
                  <span className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] font-mono">@{details.admin?.username}</span>
                  <Badge label="Full Control" />
               </div>
              </div>
            </div>

            <div className="space-y-6 pt-10 border-t border-primary-50">
              <Button 
                variant="secondary" 
                className="w-full h-16 rounded-[2rem] text-xs font-black uppercase tracking-widest group"
                onClick={() => setIsEditingAdmin(true)}
              >
                <IconShieldLock size={20} className="mr-3 group-hover:rotate-12 transition-transform" /> Reset Administrative Key
              </Button>
              <div className="flex items-center justify-between px-2">
                <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest flex items-center gap-2">
                  <IconClock size={12} /> Last Access: {details.admin?.lastLogin ? new Date(details.admin.lastLogin).toLocaleDateString() : 'NEVER'}
                </p>
                <IconChevronRight size={16} className="text-primary-100 group-hover:translate-x-2 transition-transform" />
              </div>
            </div>
          </div>
        </section>

        {/* 4. Unit Provisioning */}
        <section className="space-y-12">
          <header className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary-500">Operational Scaling</h3>
            <p className="text-sm font-bold text-primary-900 uppercase tracking-tight">Active Clinical Micro-Units</p>
          </header>

          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-primary-50 pb-4">
              <p className="text-3xl font-black text-primary-900 uppercase leading-none">{details.departmentCount} Clinical Units</p>
              {user?.role === UserRole.FACILITY_ADMIN && (
                <Button size="sm" variant="ghost" className="rounded-xl border-[0.5px] border-primary-100 hover:bg-primary-50 text-[10px]" onClick={() => navigate('/admin/departments')}>
                  Manage Registry <IconChevronRight size={12} className="ml-1" />
                </Button>
              )}
            </div>
            
            <p className="text-xs font-bold text-primary-600 uppercase leading-relaxed tracking-widest">
              Units are self-contained clinical modules responsible for referral logic and clinician management within this node.
            </p>

            <div className="pt-4 flex gap-2">
              <div className="flex-1 p-5 border-[0.5px] border-primary-50 rounded-[1.5rem] bg-emerald-50/10">
                <div className="text-[9px] font-black text-emerald-600/60 uppercase mb-1 flex items-center gap-1">
                   <div className="w-1 h-1 rounded-full bg-emerald-500" /> Operational Status
                </div>
                <div className="text-lg font-black text-emerald-900 leading-none">ACTIVE</div>
              </div>
              <div className="flex-1 p-5 border-[0.5px] border-primary-50 rounded-[1.5rem] bg-primary-50/20">
                <div className="text-[9px] font-black text-primary-300 uppercase mb-1">Scale Index</div>
                <div className="text-lg font-black text-primary-900 leading-none">{details.clinicianCount} PERS.</div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 5. Footer Actions */}
      <footer className="pt-24 border-t border-primary-50 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-black text-primary-900 uppercase">Governance Protocol active</p>
          <p className="text-[10px] font-bold text-primary-300 uppercase tracking-[0.2em]">TRMS Network node {id}</p>
        </div>
        <div className="flex gap-4">
           <Button variant="ghost" className="rounded-[1.5rem] opacity-50 hover:opacity-100 border border-primary-100"><IconExternalLink size={18} className="mr-2" /> Global Registry</Button>
           <Button variant="danger" className="rounded-[1.5rem] px-10 h-14" onClick={() => { if(confirm('Purge node data?')) navigate('/admin/facilities') }}>Decommission Node</Button>
        </div>
      </footer>

      {/* --- MODALS (Typography First) --- */}
      {isEditingAdmin && (
        <Modal title="Secure Identity Overhaul" onClose={() => setIsEditingAdmin(false)} maxWidth="max-w-md">
          <form className="space-y-10" onSubmit={handleAdminSubmit}>
            <div className="text-center space-y-2">
              <IconShieldLock size={48} className="mx-auto text-primary-900" />
              <h3 className="text-lg font-black text-primary-900 uppercase tracking-tight">Administrative Access Reset</h3>
              <p className="text-xs font-bold text-primary-400 uppercase tracking-widest">Verification required for {details.admin?.fullName}</p>
            </div>

            <div className="space-y-6">
              <Field label="Identity Identifier (Username)">
                <input 
                  required
                  className={inputCls}
                  value={adminData.username}
                  onChange={e => setAdminData({...adminData, username: e.target.value})}
                />
              </Field>
              
              <div className="pt-6 border-t border-primary-50 space-y-6">
                <Field label="Current Secure Key">
                  <input 
                    type="password"
                    required={!!adminData.password}
                    className={inputCls}
                    placeholder="REQUIRED FOR OVERRIDE"
                    value={adminData.currentPassword}
                    onChange={e => setAdminData({...adminData, currentPassword: e.target.value})}
                  />
                </Field>
                
                <Field label="New High-Entropy Key">
                  <input 
                    type="password"
                    autoComplete="new-password"
                    className={inputCls}
                    placeholder="MIN 7 CHARS + MIXED CASE + SYMBOLS"
                    value={adminData.password}
                    onChange={e => setAdminData({...adminData, password: e.target.value})}
                  />
                  {adminData.password && (
                    <div className="mt-2 space-y-1">
                      {validatePassword(adminData.password).errors.map((err, i) => (
                        <p key={i} className="text-[9px] font-bold text-red-500 uppercase flex items-center gap-1">
                          <IconX size={10} /> {err}
                        </p>
                      ))}
                      {validatePassword(adminData.password).isValid && (
                        <p className="text-[9px] font-bold text-emerald-500 uppercase flex items-center gap-1">
                          <IconCheck size={10} /> Complexity Satisfied
                        </p>
                      )}
                    </div>
                  )}
                </Field>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="secondary" type="button" onClick={() => setIsEditingAdmin(false)} className="flex-1 rounded-2xl h-14">Abort</Button>
              <Button variant="primary" type="submit" isLoading={updateAdminMutation.isPending} className="flex-[2] rounded-2xl h-14 shadow-xl shadow-primary-900/20">Apply Governance</Button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}

// Sub-components
function InfoBlock({ label, value, color = "text-primary-900" }: { label: string; value: string; color?: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em] leading-none mb-2">{label}</p>
      <p className={`text-sm font-bold uppercase tracking-tight ${color}`}>{value}</p>
    </div>
  );
}

function MetricCard({ icon, label, value, subValue }: { icon: React.ReactNode; label: string; value: string | number; subValue: string }) {
  return (
    <div className="flex items-start gap-4 group transition-all duration-500">
      <div className="text-primary-300 group-hover:text-primary-900 transition-colors duration-500 pt-1">{icon}</div>
      <div className="space-y-1">
        <h5 className="text-[9px] font-black uppercase text-primary-500 tracking-[0.3em] leading-none mb-1">{label}</h5>
        <div className="text-3xl font-black text-primary-900 tracking-tighter leading-none">{value}</div>
        <p className="text-[9px] font-black text-primary-500 uppercase tracking-widest">{subValue}</p>
      </div>
    </div>
  );
}

function Modal({ title, children, onClose, maxWidth = 'max-w-3xl' }: { title: string; children: React.ReactNode; onClose: () => void; maxWidth?: string }) {
  return (
    <div className="fixed inset-0 bg-primary-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-[3rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] w-full ${maxWidth} border-4 border-white overflow-hidden flex flex-col animate-in zoom-in-95 duration-300`}>
        <div className="px-10 py-8 border-b border-primary-50 flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary-300">{title}</h3>
          <button onClick={onClose} className="p-3 rounded-2xl text-primary-200 hover:text-primary-900 transition-all"><IconX size={24} /></button>
        </div>
        <div className="p-12 overflow-y-auto max-h-[85vh]">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <label className="block text-[10px] font-black text-primary-300 uppercase tracking-[0.3em] ml-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full px-6 py-5 rounded-2xl border-2 border-primary-50 bg-white text-sm font-black focus:ring-8 focus:ring-primary-500/10 outline-none transition-all placeholder:text-primary-100 shadow-sm uppercase';
