import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { User, UserRole } from '../../types/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import {
  IconPlus, IconTrash, IconEdit, IconSearch, IconX, IconCheck,
  IconUser, IconChevronRight, IconKey, IconLock, IconChecklist,
  IconUsers, IconStethoscope, IconMessageCircle, IconAlertTriangle,
  IconClock, IconMail, IconArrowLeft, IconEye, IconEyeOff
} from '@tabler/icons-react';
import { validatePassword } from '../../utils/password-validation';

type ModalMode = 'create' | 'edit' | 'password' | 'delete' | null;

const AVAILABLE_ROLES = [
  { value: UserRole.DOCTOR, label: 'Doctor / Clinician' },
  { value: UserRole.LIAISON_OFFICER, label: 'Referral Liaison Officer' },
  { value: UserRole.HEW, label: 'Health Extension Worker' },
];

export default function ClinicianManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [modal, setModal] = useState<ModalMode>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    role: UserRole.DOCTOR,
    password: '',
    confirmPassword: '',
  });

  /* ── DATA FETCHING ── */
  const { data: clinicians = [], isLoading } = useQuery({
    queryKey: ['clinicians', user?.departmentId],
    queryFn: async () => {
      const r = await apiClient.get<User[]>(`/users?departmentId=${user?.departmentId}`);
      return r.data.filter(u => u.id !== user?.id);
    },
    enabled: !!user?.departmentId,
  });

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return clinicians;
    const q = searchQuery.toLowerCase();
    return clinicians.filter(c => 
      c.fullName?.toLowerCase().includes(q) || 
      c.username?.toLowerCase().includes(q)
    );
  }, [clinicians, searchQuery]);

  /* ── MUTATIONS ── */
  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      const { password, confirmPassword, ...rest } = data;
      
      return apiClient.post('/users', {
        ...rest,
        initialPassword: password,
        id: crypto.randomUUID(),
        facilityId: user?.facilityId || '',
        departmentId: user?.departmentId || '',
        active: true,
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clinicians'] }); closeModal(); },
    onError: (err: any) => setError(err?.response?.data?.message || 'Failed to create clinician'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<User>) => apiClient.patch(`/users/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clinicians'] }); closeModal(); },
    onError: (err: any) => setError(err?.response?.data?.message || 'Update failed'),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string, password: string }) => apiClient.patch(`/users/${id}`, { password }),
    onSuccess: () => { closeModal(); },
    onError: (err: any) => setError(err?.response?.data?.message || 'Password reset failed'),
  });

  /* ── ACTIONS ── */
  const openCreate = () => { setFormData({ fullName: '', username: '', role: UserRole.DOCTOR, password: '', confirmPassword: '' }); setError(null); setModal('create'); };
  
  const openEdit = (u: User) => {
    setSelectedUser(u);
    setFormData({ fullName: u.fullName || '', username: u.username || '', role: u.role as UserRole, password: '', confirmPassword: '' });
    setError(null);
    setModal('edit');
  };

  const openPasswordReset = (u: User) => {
    setSelectedUser(u);
    setFormData(prev => ({ ...prev, password: '' }));
    setError(null);
    setModal('password');
  };

  const closeModal = () => { setModal(null); setSelectedUser(null); setError(null); setShowPassword(false); };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-primary-900 leading-none mb-2">Personnel Roster</h2>
          <p className="text-sm font-bold text-primary-600 uppercase tracking-widest">{clinicians.length} Departmental Clinicians</p>
        </div>
        <Button onClick={openCreate} className="rounded-2xl px-10 py-5 bg-primary-900 text-white hover:bg-black transition-all shadow-xl shadow-primary-900/20">
          <IconPlus size={20} className="mr-2" /> Add clinician
        </Button>
      </div>

      {/* Search Header */}
      <div className="relative group">
        <IconSearch size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-primary-400 group-focus-within:text-primary-900 transition-colors" />
        <input 
          placeholder="Search by name or username..." 
          className="w-full pl-16 pr-6 py-5 rounded-[2rem] border-2 border-primary-50 outline-none focus:ring-8 focus:ring-primary-500/10 transition-all font-black uppercase tracking-tight text-sm text-primary-900 placeholder:text-primary-400"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Grid of Clinicians */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <div key={i} className="h-44 rounded-[2rem] bg-primary-50 animate-pulse border-2 border-white" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(c => (
            <div key={c.id} className="group relative p-8 rounded-[2.5rem] border-2 border-primary-50 bg-white transition-all duration-300 hover:shadow-2xl overflow-hidden bg-gradient-to-br from-white to-primary-50/10">
              <div className="flex items-center gap-5 mb-6 relative">
                <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6 text-primary-600">
                  {c.role === UserRole.DOCTOR ? <IconStethoscope size={32} /> : 
                   c.role === UserRole.LIAISON_OFFICER ? <IconMessageCircle size={32} /> : 
                   <IconUser size={32} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-primary-900 uppercase truncate text-lg tracking-tight leading-none mb-1">{c.fullName}</h3>
                  <Badge label={(c.role || 'clinician').replace('_', ' ')} variant={c.active ? 'info' : 'default'} />
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-primary-50 relative">
                <div className="flex items-center justify-between">
                   <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest">@{c.username}</p>
                   <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest font-mono">
                     Last: {c.lastLogin ? new Date(c.lastLogin).toLocaleDateString() : 'Never'}
                   </p>
                </div>
                
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="secondary" size="sm" className="flex-1 rounded-xl" onClick={() => openEdit(c)}><IconEdit size={14} /> Profile</Button>
                    <Button variant="ghost" size="sm" className="rounded-xl border border-primary-100" onClick={() => openPasswordReset(c)}><IconKey size={14} /></Button>
                    <button 
                      onClick={() => updateMutation.mutate({ id: c.id, active: !c.active })}
                      className={`p-2 rounded-xl transition-colors ${c.active ? 'text-emerald-500 hover:bg-emerald-50' : 'text-primary-300 hover:bg-primary-50'}`}
                    >
                      {c.active ? <IconEye size={18} /> : <IconEyeOff size={18} />}
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODALS ── */}
      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'create' ? 'Personnel Recruitment' : 'Edit Personnel Profile'} onClose={closeModal}>
          <form className="space-y-8" onSubmit={e => {
            e.preventDefault();
            if (modal === 'create') {
              if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                return;
              }
              const strength = validatePassword(formData.password);
              if (!strength.isValid) {
                setError(strength.errors[0]);
                return;
              }
              createMutation.mutate(formData);
            }
            else if (selectedUser) {
              updateMutation.mutate({ id: selectedUser.id, fullName: formData.fullName, role: formData.role as UserRole });
            }
          }}>
            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center gap-3 text-red-700">
                <IconAlertTriangle size={20} />
                <p className="text-[10px] font-black uppercase">{error}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Legal Full Name">
                <input required className={inputCls} placeholder="e.g. Dr. Jane Smith" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
              </Field>
              <Field label="Clinical Functional Role">
                <select className={inputCls} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                  {AVAILABLE_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </Field>
              <Field label="System Access ID (Username)">
                <input 
                  required 
                  disabled={modal === 'edit'}
                  className={`${inputCls} ${modal === 'edit' ? 'bg-primary-50 text-primary-300 cursor-not-allowed' : ''}`} 
                  placeholder="e.g. Dr.Jane.Smith" 
                  value={formData.username} 
                  onChange={e => setFormData({...formData, username: e.target.value})} 
                />
              </Field>
              {modal === 'create' && (
                <>
                  <Field label="Initial Temporary Password">
                    <input required type="password" className={inputCls} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                  </Field>
                  <Field label="Confirm Temporary Password">
                    <input required type="password" className={inputCls} value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
                  </Field>
                </>
              )}
            </div>

            <ModalFooter onCancel={closeModal} isLoading={createMutation.isPending || updateMutation.isPending} submitLabel={modal === 'create' ? 'Onboard Clinician' : 'Save Profile'} />
          </form>
        </Modal>
      )}

      {modal === 'password' && selectedUser && (
        <Modal title="Secure Key Reset" onClose={closeModal} maxWidth="max-w-md">
          <form className="space-y-6" onSubmit={e => { 
            e.preventDefault(); 
            if (formData.password !== formData.confirmPassword) {
              setError('Passwords do not match');
              return;
            }
            const strength = validatePassword(formData.password);
            if (!strength.isValid) {
              setError(strength.errors[0]);
              return;
            }
            resetPasswordMutation.mutate({ id: selectedUser.id, password: formData.password }); 
          }}>
            <div className="text-center space-y-2 mb-6">
               <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 mx-auto flex items-center justify-center border-2 border-amber-100"><IconLock size={32} /></div>
               <h3 className="font-black text-primary-900 uppercase">Emergency Key Reset</h3>
               <p className="text-xs font-bold text-primary-600 uppercase tracking-widest">You are resetting the access key for {selectedUser.fullName}</p>
            </div>
            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center gap-3 text-red-700">
                <IconAlertTriangle size={20} />
                <p className="text-[10px] font-black uppercase text-center">{error}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Field label="New Secure Password">
                <input required type="password" className={inputCls} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </Field>
              <Field label="Confirm Password">
                <input required type="password" className={inputCls} value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
              </Field>
            </div>
            <ModalFooter onCancel={closeModal} isLoading={resetPasswordMutation.isPending} submitLabel="Apply New Key" />
          </form>
        </Modal>
      )}
    </div>
  );
}

const inputCls = 'w-full px-5 py-4 rounded-2xl border-2 border-primary-50 bg-white text-sm font-black focus:ring-8 focus:ring-primary-500/10 outline-none transition-all placeholder:text-primary-100 shadow-sm';

function Modal({ title, children, onClose, maxWidth = 'max-w-3xl' }: { title: string; children: React.ReactNode; onClose: () => void; maxWidth?: string }) {
  return (
    <div className="fixed inset-0 bg-primary-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-[3rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] w-full ${maxWidth} border border-white/20 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300`}>
        <div className="px-10 py-8 border-b border-primary-50 flex justify-between items-center bg-white">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary-400">{title}</h3>
          <button onClick={onClose} className="p-3 rounded-2xl text-primary-300 hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"><IconX size={24} /></button>
        </div>
        <div className="p-10 overflow-y-auto max-h-[85vh]">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><label className="block text-[10px] font-black text-primary-600 uppercase tracking-widest ml-2">{label}</label>{children}</div>; }
function ModalFooter({ onCancel, isLoading, submitLabel }: { onCancel: () => void; isLoading: boolean; submitLabel: string }) {
  return (<div className="flex justify-end gap-3 pt-8 mt-6 border-t border-primary-50"><Button variant="secondary" type="button" onClick={onCancel} className="px-8 h-14">Cancel</Button><Button variant="primary" type="submit" isLoading={isLoading} className="px-12 h-14 shadow-lg shadow-primary-500/20">{submitLabel}</Button></div>);
}
