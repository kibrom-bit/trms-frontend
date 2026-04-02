import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { Facility, CreateFacilityRequest, FacilityType } from '../../types/api';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { 
  IconPlus, 
  IconSearch, 
  IconEdit, 
  IconTrash, 
  IconAlertCircle,
  IconX,
  IconCheck,
  IconEye,
  IconEyeOff,
  IconExternalLink
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { validatePassword } from '../../utils/password-validation';
import { getBackendUrl } from '../../utils/url-utils';
import { IconBuildingHospital } from '@tabler/icons-react';

export default function FacilityManager() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
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

  const columns = [
    { 
      header: 'Facility Name', 
      accessor: (f: Facility) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-primary-50 flex items-center justify-center border border-primary-100 flex-shrink-0">
            {f.profileImageUrl ? (
              <img src={getBackendUrl(f.profileImageUrl)} alt="" className="w-full h-full object-cover" />
            ) : (
              <IconBuildingHospital size={16} className="text-primary-300" />
            )}
          </div>
          <div>
            <div className="font-black text-primary-900 dark:text-white uppercase tracking-tight leading-none">{f.name ?? 'Unnamed Facility'}</div>
            <div className="text-[9px] text-primary-600 font-bold uppercase tracking-widest leading-none mt-1.5 ">ID: {f.id.slice(0,8)}</div>
          </div>
        </div>
      )
    },
    { 
      header: 'Type', 
      accessor: (f: Facility) => {
        const isHospital = (f.type ?? 'hospital').includes('hospital');
        return (
          <Badge 
            label={isHospital ? 'Hospital' : 'Health Center'} 
            variant={isHospital ? 'info' : 'warning'}
          />
        );
      },
      className: 'w-32'
    },
    { 
      header: 'Location', 
      accessor: (f: Facility) => f.location || 'N/A',
      className: 'italic text-primary-600 dark:text-primary-400'
    },
    { 
      header: 'Actions', 
      accessor: (f: Facility) => (
        <div className="flex gap-2 justify-end">
          <button 
            onClick={() => navigate(`/admin/facilities/${f.id}`)}
            className="p-1.5 hover:bg-primary-100 dark:hover:bg-surface-800 rounded text-primary-600 transition-colors"
            title="View Profile"
          >
            <IconExternalLink size={16} />
          </button>
          <button 
            onClick={() => setDeleteConfirmId(f.id)}
            className="p-1.5 hover:bg-error/10 rounded text-error transition-colors"
          >
            <IconTrash size={16} />
          </button>
        </div>
      ),
      className: 'w-24 text-right'
    }
  ];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter text-primary-900 dark:text-white leading-none">Network Governance</h2>
          <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mt-2">Manage physical facilities and regional nodes</p>
        </div>
        <Button variant="primary" className="flex items-center gap-2" onClick={() => openModal()}>
          <IconPlus size={18} />
          Register Facility
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-600" size={18} />
        <input 
          type="text" 
          placeholder="SEARCH BY NAME OR LOCATION..." 
          className="w-full bg-white dark:bg-surface-900 border border-primary-200 dark:border-primary-800 rounded pl-10 pr-4 py-2.5 text-xs font-bold uppercase tracking-widest text-primary-900 dark:text-white focus:ring-2 focus:ring-primary-900 focus:outline-none transition-shadow"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Facility List */}
      <div className="bg-white dark:bg-surface-900 border border-primary-200 dark:border-primary-800 rounded overflow-hidden">
        <DataTable 
          columns={columns} 
          data={filteredFacilities || []} 
          isLoading={isLoading} 
          emptyMessage="No facilities found in the regional health network."
        />
      </div>

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
