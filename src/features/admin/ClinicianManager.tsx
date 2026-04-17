import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { User, UserRole, DepartmentType, Department } from '../../types/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import {
  IconPlus, IconTrash, IconEdit, IconSearch, IconX,
  IconUser, IconKey, IconLock, IconStethoscope, IconMessageCircle, IconAlertTriangle,
  IconEye, IconEyeOff, IconUsersGroup, IconUserCheck, IconShieldCheck, IconFilter
} from '@tabler/icons-react';
import { validatePassword } from '../../utils/password-validation';

type ModalMode = 'create' | 'edit' | 'password' | 'delete' | null;

const CLINICAL_ROLES = [
  { value: UserRole.DOCTOR, label: 'Doctor / Clinician' },
  { value: UserRole.HEW, label: 'Health Extension Worker' },
];

const LIAISON_ROLES = [
  { value: UserRole.LIAISON_OFFICER, label: 'Referral Liaison Officer' },
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

  const { data: currentDept } = useQuery({
    queryKey: ['my-department', user?.departmentId],
    queryFn: async () => {
      const r = await apiClient.get<Department>(`/departments/${user?.departmentId}`);
      return r.data;
    },
    enabled: !!user?.departmentId,
  });

  const unitLabel = useMemo(() => {
    return currentDept?.type === DepartmentType.LIAISON ? 'Liaison Officer' : 'Clinician';
  }, [currentDept]);

  const unitRoleLabel = useMemo(() => {
    return currentDept?.type === DepartmentType.LIAISON ? 'Operational Role' : 'Clinical Functional Role';
  }, [currentDept]);

  const availableRoles = useMemo(() => {
    if (currentDept?.type === DepartmentType.LIAISON) return LIAISON_ROLES;
    return CLINICAL_ROLES;
  }, [currentDept]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return clinicians;
    const q = searchQuery.toLowerCase();
    return clinicians.filter(c => 
      c.fullName?.toLowerCase().includes(q) || 
      c.username?.toLowerCase().includes(q)
    );
  }, [clinicians, searchQuery]);

  const activeCount = useMemo(() => filtered.filter((c) => c.active).length, [filtered]);
  const inactiveCount = useMemo(() => Math.max(filtered.length - activeCount, 0), [filtered, activeCount]);

  /* ── MUTATIONS ── */
  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      const { password, confirmPassword, ...rest } = data;
      
      return apiClient.post('/users', {
        ...rest,
        initialPassword: password,
        facilityId: user?.facilityId || '',
        departmentId: user?.departmentId || '',
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/users/${id}`),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['clinicians'] }); 
      closeModal(); 
    },
    onError: (err: any) => setError(err?.response?.data?.message || 'Forceful deletion failed. Ensure node is not protected.'),
  });

  /* ── ACTIONS ── */
  const openCreate = () => { 
    setFormData({ 
      fullName: '', 
      username: '', 
      role: currentDept?.type === DepartmentType.LIAISON ? UserRole.LIAISON_OFFICER : UserRole.DOCTOR, 
      password: '', 
      confirmPassword: '' 
    }); 
    setError(null); 
    setModal('create'); 
  };
  
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

  const openDelete = (u: User) => {
    setSelectedUser(u);
    setError(null);
    setModal('delete');
  };

  const closeModal = () => { setModal(null); setSelectedUser(null); setError(null); setShowPassword(false); };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <section className="rounded-3xl border border-primary-100 dark:border-primary-800 bg-white dark:bg-surface-900 p-5 lg:p-7 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-500">Department Workforce</p>
            <h2 className="mt-2 text-2xl lg:text-3xl font-black tracking-tight text-primary-900 dark:text-white">Manage Staff</h2>
            <p className="mt-2 text-xs text-primary-600 dark:text-primary-300 uppercase tracking-wider">
              Operate identities, roles, and access for your {unitLabel.toLowerCase()} team.
            </p>
          </div>
          <Button onClick={openCreate} className="rounded-xl px-5 py-3 bg-primary-900 text-white hover:bg-primary-800 transition-all shadow-lg shadow-primary-900/20">
            <IconPlus size={18} className="mr-2" /> Add {unitLabel}
          </Button>
        </div>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <MiniStat icon={IconUsersGroup} label="Total Staff" value={filtered.length} />
          <MiniStat icon={IconUserCheck} label="Active Accounts" value={activeCount} />
          <MiniStat icon={IconShieldCheck} label="Inactive Accounts" value={inactiveCount} />
        </div>
      </section>

      <section className="rounded-2xl border border-primary-100 dark:border-primary-800 bg-white dark:bg-surface-900 p-4">
        <div className="relative">
          <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
          <input
            placeholder="Search by staff name or username..."
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-primary-200 dark:border-primary-700 bg-surface-50 dark:bg-surface-950 outline-none focus:ring-4 focus:ring-primary-500/10 transition-all text-sm text-primary-900 dark:text-white placeholder:text-primary-400"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <IconFilter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-300" />
        </div>
      </section>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-56 rounded-2xl bg-primary-50 animate-pulse border border-primary-100" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-primary-300 bg-white dark:bg-surface-900 p-8 text-center">
          <p className="text-sm font-semibold text-primary-700 dark:text-primary-200">No matching staff accounts found.</p>
          <p className="mt-2 text-xs text-primary-500">Try a different search term or add a new staff member.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(c => (
            <article key={c.id} className="p-5 rounded-2xl border border-primary-100 dark:border-primary-800 bg-white dark:bg-surface-900 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-300">
                  {c.role === UserRole.DOCTOR ? <IconStethoscope size={24} /> :
                   c.role === UserRole.LIAISON_OFFICER ? <IconMessageCircle size={24} /> :
                   <IconUser size={24} />}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-primary-900 dark:text-white truncate">{c.fullName}</h3>
                  <p className="text-xs text-primary-500 truncate">@{c.username}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <Badge label={(c.role || unitLabel).replace('_', ' ')} variant={c.active ? 'info' : 'default'} />
                <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${c.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {c.active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>

              <p className="mt-3 text-[11px] text-primary-500">
                Last login: {c.lastLogin ? new Date(c.lastLogin).toLocaleDateString() : 'Never'}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="secondary" size="sm" className="rounded-lg" onClick={() => openEdit(c)}>
                  <IconEdit size={14} /> Profile
                </Button>
                <Button variant="ghost" size="sm" className="rounded-lg border border-primary-100" onClick={() => openPasswordReset(c)}>
                  <IconKey size={14} /> Reset Key
                </Button>
                <button
                  onClick={() => updateMutation.mutate({ id: c.id, active: !c.active })}
                  className={`h-9 rounded-lg border text-xs font-semibold transition-colors flex items-center justify-center gap-1 ${c.active ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' : 'border-primary-200 text-primary-700 hover:bg-primary-50'}`}
                >
                  {c.active ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                  {c.active ? 'Deactivate' : 'Activate'}
                </button>
                <Button variant="ghost" size="sm" className="rounded-lg border border-red-100 text-red-600 hover:bg-red-50" onClick={() => openDelete(c)}>
                  <IconTrash size={14} /> Delete
                </Button>
              </div>
            </article>
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
              <Field label={unitRoleLabel}>
                <select className={inputCls} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                  {availableRoles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
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

            <ModalFooter onCancel={closeModal} isLoading={createMutation.isPending || updateMutation.isPending} submitLabel={modal === 'create' ? `Onboard ${unitLabel}` : 'Save Profile'} />
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

      {modal === 'delete' && selectedUser && (
        <Modal title="Permanent Account Purge" onClose={closeModal} maxWidth="max-w-md">
          <div className="space-y-6">
            <div className="text-center space-y-2">
               <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 mx-auto flex items-center justify-center border-2 border-red-100 animate-bounce"><IconTrash size={32} /></div>
               <h3 className="font-black text-primary-900 uppercase">Confirm Forceful Deletion</h3>
               <p className="text-xs font-bold text-primary-600 uppercase tracking-widest leading-relaxed">
                 You are about to permanently remove <span className="text-red-600 underline">@{selectedUser.username}</span> from the system core. This action cannot be undone.
               </p>
            </div>
            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center gap-3 text-red-700">
                <IconAlertTriangle size={20} />
                <p className="text-[10px] font-black uppercase text-center">{error}</p>
              </div>
            )}
            <div className="flex flex-col gap-3">
               <Button 
                 variant="danger" 
                 className="w-full h-14 rounded-2xl shadow-lg shadow-red-500/20" 
                 onClick={() => deleteMutation.mutate(selectedUser.id)}
                 isLoading={deleteMutation.isPending}
               >
                 Purge from Database
               </Button>
               <Button 
                 variant="secondary" 
                 className="w-full h-14 rounded-2xl" 
                 onClick={closeModal}
                 disabled={deleteMutation.isPending}
               >
                 Abort Action
               </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

const inputCls = 'w-full px-5 py-4 rounded-2xl border-2 border-primary-50 dark:border-primary-800 bg-white dark:bg-surface-900 text-primary-900 dark:text-white text-sm font-black focus:ring-8 focus:ring-primary-500/10 outline-none transition-all placeholder:text-primary-300 dark:placeholder:text-primary-600 shadow-sm';

function Modal({ title, children, onClose, maxWidth = 'max-w-3xl' }: { title: string; children: React.ReactNode; onClose: () => void; maxWidth?: string }) {
  return (
    <div className="fixed inset-0 bg-primary-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className={`bg-white dark:bg-surface-900 rounded-[3rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] w-full ${maxWidth} border border-white/20 dark:border-primary-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300`}>
        <div className="px-10 py-8 border-b border-primary-50 dark:border-primary-800 flex justify-between items-center bg-white dark:bg-surface-900">
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

function MiniStat({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-primary-100 dark:border-primary-800 bg-surface-50 dark:bg-surface-950 p-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 flex items-center justify-center">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-primary-500">{label}</p>
        <p className="text-lg font-black text-primary-900 dark:text-white leading-none">{value}</p>
      </div>
    </div>
  );
}
