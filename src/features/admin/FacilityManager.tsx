import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { Facility, CreateFacilityRequest, FacilityType } from '../../types/api';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { 
  IconPlus, 
  IconSearch, 
  IconTrash, 
  IconAlertCircle,
  IconX,
  IconCheck,
  IconEye,
  IconEyeOff,
  IconExternalLink,
  IconMapPin,
  IconBuildingHospital,
  IconLayoutGrid,
  IconFilter,
  IconChevronRight
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { validatePassword } from '../../utils/password-validation';
import { getBackendUrl } from '../../utils/url-utils';

export default function FacilityManager() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeType, setActiveType] = useState<FacilityType | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateFacilityRequest & { adminPasswordConfirm?: string }>({
    name: '',
    type: 'specialized_hospital',
    location: '',
    contact: '',
    adminUsername: '',
    adminPassword: '',
    adminPasswordConfirm: ''
  });

  const { data: facilities, isLoading } = useQuery({
    queryKey: ['admin-facilities'],
    queryFn: async () => {
      const response = await apiClient.get<Facility[]>('/facilities');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateFacilityRequest) => apiClient.post('/facilities', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-facilities'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Facility> }) => 
      apiClient.patch(`/facilities/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-facilities'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/facilities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-facilities'] });
      setDeleteConfirmId(null);
    },
  });

  const openModal = (facility?: Facility) => {
    setLocalError(null);
    setShowPassword(false);
    if (facility) {
      setEditingFacility(facility);
      setFormData({
        name: facility.name ?? '',
        type: (facility.type as any) ?? 'specialized_hospital',
        location: facility.location ?? '',
        contact: facility.contact ?? '',
        adminUsername: '', 
        adminPassword: '',
        adminPasswordConfirm: ''
      });
    } else {
      setEditingFacility(null);
      setFormData({ 
        name: '', 
        type: 'specialized_hospital', 
        location: '', 
        contact: '',
        adminUsername: '',
        adminPassword: '',
        adminPasswordConfirm: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingFacility(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Validation for new registrations
    if (!editingFacility) {
      if (formData.adminPassword !== formData.adminPasswordConfirm) {
        setLocalError('Administrative passwords do not match.');
        return;
      }
      if (formData.adminPassword.length < 7) {
        setLocalError('Password must be at least 7 characters.');
        return;
      }
      
      const strength = validatePassword(formData.adminPassword);
      if (!strength.isValid) {
        setLocalError(strength.errors[0]);
        return;
      }
    }

    if (editingFacility) {
      // 1. Sanitize Update Payload: Backend only allows [name, location, contact]
      const updateData = {
        name: formData.name,
        location: formData.location,
        contact: formData.contact
      };
      updateMutation.mutate({ id: editingFacility.id, data: updateData });
    } else {
      // 2. Sanitize Create Payload: Remove internal confirm field
      const { adminPasswordConfirm, ...createData } = formData;
      createMutation.mutate(createData);
    }
  };

  const filteredFacilities = facilities?.filter(f => 
    f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const normalized = (filteredFacilities || []).filter((f) => (activeType === 'all' ? true : f.type === activeType));
  const sorted = [...normalized].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  const counts = {
    all: facilities?.length || 0,
    specialized_hospital: facilities?.filter((f) => f.type === 'specialized_hospital').length || 0,
    general_hospital: facilities?.filter((f) => f.type === 'general_hospital').length || 0,
    primary_hospital: facilities?.filter((f) => f.type === 'primary_hospital').length || 0,
    health_center: facilities?.filter((f) => f.type === 'health_center').length || 0,
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="rounded-3xl bg-primary-900 text-white p-6 lg:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/15">
              <IconLayoutGrid size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Manage System</span>
            </div>
            <h2 className="mt-3 text-2xl lg:text-3xl font-black tracking-tight">Facility Registry</h2>
            <p className="mt-2 text-xs text-white/70 uppercase tracking-[0.18em]">
              Register nodes, set identity profile, and govern network topology
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-3 rounded-2xl bg-white/10 border border-white/15">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Total Facilities</p>
              <p className="mt-1 text-2xl font-black leading-none">{counts.all}</p>
            </div>
            <Button variant="secondary" className="h-12 px-6 rounded-2xl !bg-white !text-primary-900 hover:!bg-primary-100" onClick={() => openModal()}>
              <IconPlus size={18} className="mr-2" />
              Register Facility
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
        <div className="relative">
          <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400" size={18} />
          <input
            type="text"
            placeholder="Search facilities by name or location..."
            className="w-full h-12 bg-white dark:bg-surface-900 border border-primary-200 dark:border-primary-800 rounded-2xl pl-11 pr-4 text-sm text-primary-900 dark:text-white focus:ring-4 focus:ring-primary-900/10 focus:outline-none transition-shadow"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="rounded-2xl bg-white dark:bg-surface-900 border border-primary-200 dark:border-primary-800 p-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveType('all')} className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wide border transition-all ${activeType === 'all' ? 'bg-primary-900 text-white border-primary-900' : 'bg-surface-50 dark:bg-surface-950 border-primary-100 dark:border-primary-800 text-primary-700 dark:text-primary-300'}`}>
            All <span className="ml-2 text-[10px] font-bold opacity-80">{counts.all}</span>
          </button>
          {([
            ['specialized_hospital', 'Specialized', counts.specialized_hospital],
            ['general_hospital', 'General', counts.general_hospital],
            ['primary_hospital', 'Primary', counts.primary_hospital],
            ['health_center', 'Health Center', counts.health_center],
          ] as Array<[FacilityType, string, number]>).map(([type, label, count]) => (
            <button key={type} onClick={() => setActiveType(type)} className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wide border transition-all ${activeType === type ? 'bg-primary-900 text-white border-primary-900' : 'bg-surface-50 dark:bg-surface-950 border-primary-100 dark:border-primary-800 text-primary-700 dark:text-primary-300'}`}>
              {label} <span className="ml-2 text-[10px] font-bold opacity-80">{count}</span>
            </button>
          ))}
          <div className="ml-auto pr-1 text-primary-300 flex items-center gap-1">
            <IconFilter size={14} />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-52 rounded-3xl bg-white dark:bg-surface-900 border border-primary-100 dark:border-primary-800 animate-pulse" />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-surface-900 border border-dashed border-primary-300 dark:border-primary-700 p-10 text-center">
          <p className="text-sm font-semibold text-primary-700 dark:text-primary-200">No facilities match your current filters.</p>
          <p className="mt-2 text-xs text-primary-500">Try a different search or switch facility type.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((f) => (
            <button
              key={f.id}
              onClick={() => navigate(`/admin/facilities/${f.id}`)}
              className="text-left rounded-3xl bg-white dark:bg-surface-900 border border-primary-100 dark:border-primary-800 hover:border-primary-300 dark:hover:border-primary-600 transition-all shadow-sm hover:shadow-xl hover:-translate-y-0.5 overflow-hidden group"
            >
              <div className="p-5 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-surface-50 dark:bg-surface-950 border border-primary-100 dark:border-primary-800 overflow-hidden flex items-center justify-center shrink-0">
                    {f.profileImageUrl ? (
                      <img src={getBackendUrl(f.profileImageUrl)} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <IconBuildingHospital size={26} className="text-primary-300" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black uppercase tracking-tight text-primary-900 dark:text-white truncate">
                      {f.name || 'Unnamed Facility'}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-primary-500 uppercase tracking-widest">
                      <IconMapPin size={12} />
                      <span className="truncate">{f.location || 'Unknown location'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge
                    label={String(f.type || 'facility').split('_').join(' ')}
                    variant={(String(f.type || '').includes('hospital') ? 'info' : 'warning') as any}
                  />
                  <span className="text-[9px] font-black text-primary-300 uppercase tracking-widest">
                    ID {f.id.slice(0, 8)}
                  </span>
                </div>
              </div>

              <div className="px-5 pb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-primary-400 uppercase tracking-wider">
                    Open profile
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(f.id);
                    }}
                    className="p-2 rounded-xl border border-red-100 text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <IconTrash size={16} />
                  </button>
                  <div className="p-2 rounded-xl bg-primary-900 text-white border border-primary-900">
                    <IconChevronRight size={16} />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Register/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-surface-900 border border-primary-200 dark:border-primary-800 rounded shadow-2xl w-full max-w-md overflow-hidden animate-zoom-in">
            <div className="p-4 border-b border-primary-100 dark:border-primary-800 bg-primary-50 dark:bg-surface-800 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary-900 dark:text-white">
                {editingFacility ? 'Update Profile' : 'Register New Node'}
              </h3>
              <button onClick={closeModal} className="text-primary-400 hover:text-black dark:hover:text-white">
                <IconX size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-primary-600 mb-1.5 opacity-80">Facility Name</label>
                <input 
                  required
                  className="input-field text-xs h-10 font-bold uppercase"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-primary-600 mb-1.5 opacity-80">Node Type</label>
                <select 
                  className="input-field text-xs h-10 font-bold uppercase"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value as FacilityType})}
                >
                  <option value="specialized_hospital">SPECIALIZED HOSPITAL</option>
                  <option value="general_hospital">GENERAL HOSPITAL</option>
                  <option value="primary_hospital">PRIMARY HOSPITAL</option>
                  <option value="health_center">HEALTH CENTER</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-primary-600 mb-1.5 opacity-80">Location (Address/Zone)</label>
                <input 
                  required
                  className="input-field text-xs h-10 font-bold uppercase"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-primary-600 mb-1.5 opacity-80">Contact Line (Optional)</label>
                <input 
                  className="input-field text-xs h-10 font-bold lowercase tracking-normal"
                  value={formData.contact}
                  placeholder="phone or email"
                  onChange={e => setFormData({...formData, contact: e.target.value})}
                />
              </div>

              {/* Administrative Credentials - ONLY for new registrations */}
              {!editingFacility && (
                <div className="pt-4 mt-2 border-t border-primary-200 dark:border-primary-800 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-secondary-500 animate-pulse" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-secondary-600">Initial Administrator</h4>
                  </div>

                  {localError && (
                    <div className="p-3 bg-error/10 border border-error/20 rounded flex items-center gap-2 text-error text-[10px] font-bold uppercase">
                      <IconAlertCircle size={14} />
                      {localError}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-primary-400 mb-1.5">Admin Username (Case Sensitive)</label>
                    <input 
                      required
                      className="input-field text-xs h-10 font-bold"
                      placeholder="e.g. Ayalew_Admin"
                      value={formData.adminUsername}
                      onChange={e => setFormData({...formData, adminUsername: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-primary-400 mb-1.5">Admin Password</label>
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="input-field text-xs h-10 font-bold pr-10"
                        placeholder="••••••••"
                        value={formData.adminPassword}
                        onChange={e => setFormData({...formData, adminPassword: e.target.value})}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-[26px] text-primary-400 hover:text-primary-600 transition-colors"
                      >
                        {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-primary-400 mb-1.5">Confirm Password</label>
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        required
                        className={`input-field text-xs h-10 font-bold ${formData.adminPasswordConfirm && formData.adminPassword !== formData.adminPasswordConfirm ? 'border-error text-error' : ''}`}
                        placeholder="••••••••"
                        value={formData.adminPasswordConfirm}
                        onChange={e => setFormData({...formData, adminPasswordConfirm: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <Button 
                  variant="secondary" 
                  type="button" 
                  className="flex-1"
                  onClick={closeModal}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  type="submit" 
                  className="flex-1"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                >
                  {editingFacility ? 'Update Changes' : 'Finalize Registry'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-surface-900 border-2 border-error/20 rounded shadow-2xl w-full max-w-sm p-6 space-y-6 animate-zoom-in">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center text-error">
                <IconAlertCircle size={28} />
              </div>
              <h3 className="text-base font-black uppercase tracking-tight text-primary-900 dark:text-white">Critical Confirmation</h3>
              <p className="text-xs font-bold text-primary-400 uppercase tracking-widest leading-relaxed px-4">
                You are about to remove this facility from the regional health network. This action is irreversible.
              </p>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                className="flex-1"
                onClick={() => setDeleteConfirmId(null)}
              >
                Retain Node
              </Button>
              <Button 
                variant="danger" 
                className="flex-1 text-white bg-error"
                onClick={() => deleteMutation.mutate(deleteConfirmId)}
                isLoading={deleteMutation.isPending}
              >
                Confirm Removal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
