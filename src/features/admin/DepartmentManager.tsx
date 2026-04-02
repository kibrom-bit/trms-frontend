import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { Department, DepartmentType, User, UserRole } from '../../types/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import {
  IconPlus, IconTrash, IconEdit, IconSearch, IconX, IconCheck,
  IconBuilding, IconUsers, IconEye, IconEyeOff, IconStethoscope,
  IconMessageCircle, IconAlertTriangle, IconBuildingOff, IconShieldX,
  IconArrowLeft, IconUser, IconChevronRight, IconKey, IconLock,
  IconClock, IconListSearch, IconMail, IconPhone,
} from '@tabler/icons-react';
import { validatePassword } from '../../utils/password-validation';

type ModalMode = 'create' | 'edit' | 'delete' | 'edit-head' | null;
type View = 'list' | 'detail';

const emptyForm = {
  name: '', type: DepartmentType.CLINICAL,
  adminName: '', adminUsername: '',
  adminPassword: '', adminPasswordConfirm: '',
};

export default function DepartmentManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // View state
  const [view, setView] = useState<View>('list');
  const [selected, setSelected] = useState<Department | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [modal, setModal] = useState<ModalMode>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUsernameError, setIsUsernameError] = useState(false);
  const [isDuplicateError, setIsDuplicateError] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Form state
  const [formData, setFormData] = useState({ ...emptyForm });
  const [headFormData, setHeadFormData] = useState({ fullName: '', username: '', password: '', confirmPassword: '' });

  /* ── Data Fetching ── */
  const { data: departments = [], isLoading: deptsLoading } = useQuery({
    queryKey: ['departments', user?.facilityId],
    queryFn: async () => {
      const r = await apiClient.get<Department[]>(`/departments?facilityId=${user?.facilityId}`);
      return r.data;
    },
    enabled: !!user?.facilityId,
  });

  const { data: facilityUsers = [] } = useQuery({
    queryKey: ['facility-users', user?.facilityId],
    queryFn: async () => {
      const r = await apiClient.get<User[]>(`/users?facilityId=${user?.facilityId}`);
      return r.data;
    },
    enabled: !!user?.facilityId,
  });

  // Map: departmentId → Department Head or Liaison Officer user
  const headByDeptId = useMemo(() => {
    const map: Record<string, User> = {};
    facilityUsers.forEach(u => {
      const isAdmin = u.role === UserRole.DEPARTMENT_HEAD || u.role === UserRole.LIAISON_OFFICER;
      if (isAdmin && u.departmentId) {
        map[u.departmentId] = u;
      }
    });
    return map;
  }, [facilityUsers]);

  /* ── Search filter ── */
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return departments;
    const q = searchQuery.toLowerCase();
    return departments.filter(d => {
      const head = headByDeptId[d.id];
      return (
        d.name?.toLowerCase().includes(q) ||
        head?.fullName?.toLowerCase().includes(q) ||
        head?.username?.toLowerCase().includes(q)
      );
    });
  }, [departments, headByDeptId, searchQuery]);

  /* ── Mutations ── */
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { adminPasswordConfirm, ...payload } = data;
      
      const strength = validatePassword(data.adminPassword);
      if (!strength.isValid) {
        throw new Error(strength.errors[0]);
      }

      return apiClient.post('/departments', { ...payload, facilityId: user?.facilityId });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['departments'] }); closeModal(); },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Error occurred';
      const isReserved = msg.toLowerCase().includes('username') || msg.toLowerCase().includes('reserved');
      setIsUsernameError(isReserved);
      setIsDuplicateError(!isReserved && err?.response?.status === 409);
      setError(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, type }: { id: string; name: string; type: DepartmentType }) =>
      apiClient.patch(`/departments/${id}`, { name, type }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      if (selected?.id === vars.id) {
        setSelected(prev => prev ? { ...prev, name: vars.name, type: vars.type } : null);
      }
      closeModal();
    },
    onError: (err: any) => setError(err?.response?.data?.message || 'Update failed'),
  });

  const updateHeadMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; fullName?: string; username?: string; password?: string }) => {
      if (data.password) {
        const strength = validatePassword(data.password);
        if (!strength.isValid) {
          throw new Error(strength.errors[0]);
        }
      }
      return apiClient.patch(`/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-users'] });
      closeModal();
    },
    onError: (err: any) => setError(err?.response?.data?.message || 'Head update failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/departments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      closeModal(); setView('list'); setSelected(null);
    },
    onError: (err: any) => setError(err?.response?.data?.message || 'Delete failed'),
  });

  /* ── Helpers ── */
  const openCreate = () => { setFormData({ ...emptyForm }); setError(null); setIsUsernameError(false); setIsDuplicateError(false); setModal('create'); };
  const openEdit = () => {
    if (!selected) return;
    setFormData({ ...emptyForm, name: selected.name || '', type: selected.type || DepartmentType.CLINICAL });
    setError(null); setModal('edit');
  };
  const openEditHead = () => {
    if (!selected) return;
    const head = headByDeptId[selected.id];
    if (!head) return;
    setHeadFormData({ fullName: head.fullName || '', username: head.username || '', password: '', confirmPassword: '' });
    setError(null); setModal('edit-head');
  };
  const closeModal = () => { setModal(null); setError(null); setIsUsernameError(false); setIsDuplicateError(false); setShowPassword(false); setDeleteConfirmText(''); };

  const isDeleteConfirmed = deleteConfirmText === selected?.name;

  /* ══ DETAIL VIEW — RESTORED ══ */
  if (view === 'detail' && selected) {
    const head = headByDeptId[selected.id];
    const unitStaff = facilityUsers.filter(u => u.departmentId === selected.id && u.role !== UserRole.DEPARTMENT_HEAD && u.role !== UserRole.LIAISON_OFFICER);

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between">
          <button onClick={() => setView('list')} className="flex items-center gap-2 text-xs font-black text-primary-600 hover:text-primary-900 transition-colors uppercase tracking-widest">
            <IconArrowLeft size={16} /> Back to Registry
          </button>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={openEdit} className="flex items-center gap-1.5"><IconEdit size={15} /> Edit Unit</Button>
            <Button variant="danger" size="sm" onClick={() => setModal('delete')} className="flex items-center gap-1.5"><IconTrash size={15} /> Decommission</Button>
          </div>
        </div>

        {/* Hero Card Restored */}
        <div className={`relative overflow-hidden rounded-[2.5rem] p-10 border-2 ${selected.type === DepartmentType.LIAISON ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50' : 'border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50'}`}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/20 -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="flex items-start gap-8 relative">
            <div className={`w-24 h-24 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-xl ${selected.type === DepartmentType.LIAISON ? 'bg-amber-100 border-2 border-amber-200' : 'bg-blue-100 border-2 border-blue-200'}`}>
              {selected.type === DepartmentType.LIAISON ? <IconMessageCircle size={48} className="text-amber-600" /> : <IconStethoscope size={48} className="text-blue-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-primary-900">{selected.name}</h2>
              <div className="flex items-center gap-4 mt-2">
                <Badge label={selected.type === DepartmentType.LIAISON ? 'Liaison & Referral Office' : 'Clinical Medical Unit'} variant={selected.type === DepartmentType.LIAISON ? 'warning' : 'info'} />
                <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{unitStaff.length} Total Personnel</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admin Card Restored */}
          <div className="p-6 rounded-[2rem] border border-primary-100 bg-white space-y-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between border-b border-primary-50 pb-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary-600">Unit Administrator</h3>
              {head && <button onClick={openEditHead} className="text-[10px] font-black text-primary-500 hover:text-primary-900 flex items-center gap-1 uppercase tracking-widest">Manage <IconChevronRight size={10} /></button>}
            </div>
            {head ? (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary-900 flex items-center justify-center text-white font-black text-2xl uppercase shadow-lg shadow-primary-900/20">{head.fullName?.charAt(0)}</div>
                <div>
                  <p className="text-xl font-black text-primary-900 uppercase leading-none mb-1">{head.fullName}</p>
                  <p className="text-xs font-bold text-primary-600 uppercase tracking-widest flex items-center gap-1"><IconUser size={12} /> @{head.username}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge label={head.active ? 'Active' : 'Inactive'} variant={head.active ? 'success' : 'default'} />
                    <span className="text-[10px] text-primary-600 font-bold uppercase tracking-wider"><IconClock size={10} className="inline mr-1" />{head.lastLogin ? new Date(head.lastLogin).toLocaleDateString() : 'Never Active'}</span>
                  </div>
                </div>
              </div>
            ) : <p className="text-xs text-primary-300 italic">No head assigned.</p>}
          </div>

          {/* Stats Card Restored */}
          <div className="p-6 rounded-[2rem] border border-primary-100 bg-white space-y-4 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary-600 border-b border-primary-50 pb-3">Operational Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Personnel', value: unitStaff.length, color: 'text-primary-600' },
                { label: 'Status', value: 'Active', color: 'text-emerald-600' },
                { label: 'Category', value: selected.type!.charAt(0).toUpperCase() + selected.type!.slice(1), color: 'text-amber-600' },
                { label: 'Readiness', value: '100%', color: 'text-blue-600' },
              ].map(s => (
                <div key={s.label} className="bg-primary-50/30 p-4 rounded-2xl border border-primary-50">
                  <p className="text-[9px] font-black uppercase text-primary-600 mb-1">{s.label}</p>
                  <p className={`text-lg font-black uppercase ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Staff Roster Restored */}
        <div className="rounded-[2.5rem] border border-primary-100 bg-white overflow-hidden shadow-sm">
          <div className="px-8 py-5 border-b border-primary-50 bg-primary-50/20 flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary-600"><IconListSearch size={14} className="inline mr-2" />Internal Unit Roster</h3>
            <span className="px-3 py-1 bg-primary-100 text-primary-600 rounded-full text-[10px] font-black uppercase">{unitStaff.length} Personnel</span>
          </div>
          {unitStaff.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center">
              <IconUsers size={48} className="text-primary-100 mb-2" />
              <p className="text-xs font-bold text-primary-300 uppercase tracking-[0.2em]">Roster is currently empty</p>
            </div>
          ) : (
            <div className="divide-y divide-primary-50">
              {unitStaff.map(u => (
                <div key={u.id} className="px-8 py-4 flex items-center justify-between hover:bg-primary-50/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center font-black text-primary-600 text-xs">{u.fullName?.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-black text-primary-900 uppercase truncate">{u.fullName}</p>
                      <p className="text-[10px] font-bold text-primary-600 uppercase tracking-wider">@{u.username}</p>
                    </div>
                  </div>
                  <Badge label={u.role?.replace('_', ' ') || 'staff'} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ══ MODALS RESTORED ══ */}
        {modal === 'edit' && (
          <Modal title="Edit Unit Protocol" onClose={closeModal} maxWidth="max-w-md">
            <form className="space-y-6" onSubmit={e => { e.preventDefault(); updateMutation.mutate({ id: selected.id, name: formData.name, type: formData.type }); }}>
              <Field label="Unit Identity Title"><input required className={inputCls} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></Field>
              <Field label="Unit Operational Type">
                <select className={inputCls} value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as DepartmentType })}>
                  <option value={DepartmentType.CLINICAL}>Clinical Medical Unit</option>
                  <option value={DepartmentType.LIAISON}>Referral & Liaison Office</option>
                </select>
              </Field>
              <ModalFooter onCancel={closeModal} isLoading={updateMutation.isPending} submitLabel="Update Unit" />
            </form>
          </Modal>
        )}

        {modal === 'edit-head' && (
          <Modal title="Update System Credentials" onClose={closeModal} maxWidth="max-w-md">
            <form className="space-y-6" onSubmit={e => { 
                e.preventDefault(); 
                if (headFormData.password && headFormData.password !== headFormData.confirmPassword) {
                  setError('Passwords do not match');
                  return;
                }
                const head = headByDeptId[selected.id];
                const { confirmPassword, ...payload } = headFormData;
                updateHeadMutation.mutate({ id: head!.id, ...payload }); 
              }}>
              <Field label="Administrator Legal Name"><input required className={inputCls} value={headFormData.fullName} onChange={e => setHeadFormData({ ...headFormData, fullName: e.target.value })} /></Field>
              <Field label="System Access Username"><input required className={inputCls} value={headFormData.username} onChange={e => setHeadFormData({ ...headFormData, username: e.target.value })} /></Field>
              <div className="pt-4 border-t border-primary-50 space-y-4">
                <Field label="Emergency Password Reset"><input className={`${inputCls} border-amber-200 outline-amber-500`} type="password" placeholder="Key in new password or leave blank" value={headFormData.password} onChange={e => setHeadFormData({ ...headFormData, password: e.target.value })} /></Field>
                <Field label="Confirm Reset Password"><input className={`${inputCls} border-amber-200 outline-amber-500`} type="password" placeholder="Verification required" value={headFormData.confirmPassword} onChange={e => setHeadFormData({ ...headFormData, confirmPassword: e.target.value })} /></Field>
                <p className="text-[9px] text-amber-600 font-black mt-2 uppercase tracking-widest italic">Note: Resetting is immediate upon save.</p>
              </div>
              <ModalFooter onCancel={closeModal} isLoading={updateHeadMutation.isPending} submitLabel="Apply Credentials" />
            </form>
          </Modal>
        )}

        {modal === 'delete' && (
          <Modal title="Decommission Sequence" onClose={closeModal} maxWidth="max-w-md">
            <div className="space-y-6">
              <div className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center gap-3">
                <IconShieldX size={24} className="text-red-500 flex-shrink-0" />
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest leading-loose">Caution: This action is irreversible. All unit data and access will be purged.</p>
              </div>
              <Field label={`Enter "${selected.name}" to unlock decommission`}>
                <input className={`${inputCls} ${deleteConfirmText === selected.name ? 'border-red-400' : ''}`} value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder="Verification name..." />
              </Field>
              <Button variant="danger" className="w-full h-14 rounded-2xl shadow-lg shadow-red-500/20" disabled={deleteConfirmText !== selected.name} onClick={() => deleteMutation.mutate(selected.id)} isLoading={deleteMutation.isPending}>Execute Decommission</Button>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  /* ══ LIST VIEW RESTORED ══ */
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-primary-900 leading-none mb-2">Unit Registry</h2>
          <p className="text-sm font-bold text-primary-600 uppercase tracking-widest">{departments.length} Operational Departments across facility</p>
        </div>
        <Button onClick={openCreate} className="rounded-2xl px-10 py-5 bg-primary-900 text-white hover:bg-black transition-all shadow-xl shadow-primary-900/20">
          <IconPlus size={20} className="mr-2" /> Register New unit
        </Button>
      </div>

      <div className="relative group">
        <IconSearch size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-primary-500 group-focus-within:text-primary-900 transition-colors" />
        <input placeholder="Search for unit name or administrator identity..." className="w-full pl-16 pr-6 py-5 rounded-[2rem] border-2 border-primary-50 outline-none focus:ring-8 focus:ring-primary-500/10 transition-all font-black uppercase tracking-tight text-sm text-primary-900 placeholder:text-primary-500" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      </div>

      {deptsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <div key={i} className="h-44 rounded-[2rem] bg-primary-50 animate-pulse border-2 border-white" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-32 text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mb-4"><IconBuilding size={40} className="text-primary-200" /></div>
            <p className="font-black text-primary-300 uppercase tracking-[0.3em]">Registry Query Null</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(d => {
            const head = headByDeptId[d.id];
            const isLiaison = d.type === DepartmentType.LIAISON;
            return (
              <button key={d.id} onClick={() => { setSelected(d); setView('detail'); }} className="group relative text-left p-8 rounded-[2.5rem] border-2 border-primary-50 hover:border-primary-500 bg-white transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 overflow-hidden bg-gradient-to-br from-white to-primary-50/10">
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full opacity-5 -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700 ${isLiaison ? 'bg-amber-500' : 'bg-primary-500'}`} />
                <div className="flex items-center gap-5 mb-6 relative">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6 ${isLiaison ? 'bg-amber-100 text-amber-600' : 'bg-primary-100 text-primary-600'}`}>
                    {isLiaison ? <IconMessageCircle size={28} /> : <IconStethoscope size={28} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-primary-900 uppercase truncate text-lg tracking-tight leading-none mb-1">{d.name}</h3>
                    <Badge label={isLiaison ? 'Liaison Unit' : 'Clinical Unit'} variant={isLiaison ? 'warning' : 'info'} />
                  </div>
                </div>
                <div className="pt-6 border-t border-primary-50 relative">
                  <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-2">Administrator Profile</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-900 text-white flex items-center justify-center text-[10px] font-black">{head ? head.fullName?.charAt(0) : '?'}</div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-primary-900 truncate uppercase">{head ? head.fullName : 'Headless Unit'}</p>
                        <p className="text-[9px] font-bold text-primary-600 uppercase tracking-widest">@{head?.username || 'Needs recruitment'}</p>
                    </div>
                    <IconChevronRight size={14} className="text-primary-200 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* CREATE MODAL RESTORED */}
      {modal === 'create' && (
        <Modal title="Secure Unit Provisioning" onClose={closeModal}>
          <form className="space-y-8" onSubmit={e => { e.preventDefault(); setError(null); createMutation.mutate(formData); }}>
            {error && (
              <div className={`p-6 rounded-3xl border-2 flex items-start gap-4 animate-in slide-in-from-top-2 ${isUsernameError ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                <IconAlertTriangle size={24} className="flex-shrink-0" />
                <div>
                   <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">{isUsernameError ? 'Security Guard: Reserved Identity' : 'Registry Conflict'}</p>
                   <p className="text-[10px] font-bold opacity-80 uppercase leading-relaxed">{error}</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <SectionHeader label="System Structural Definition" />
                <Field label="Unit Identity/Name"><input required className={`${inputCls} uppercase`} placeholder="e.g. RADIOLOGY" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></Field>
                <Field label="Operational Framework">
                  <select className={inputCls} value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as DepartmentType })}>
                    <option value={DepartmentType.CLINICAL}>Clinical / Medical Unit</option>
                    <option value={DepartmentType.LIAISON}>Governance / Liaison Office</option>
                  </select>
                </Field>
              </div>
              <div className="space-y-6">
                <SectionHeader label="Leadership recruitment" />
                <Field label="Administrator Full Name"><input required className={`${inputCls} uppercase`} placeholder="Dr. Full Name" value={formData.adminName} onChange={e => setFormData({ ...formData, adminName: e.target.value })} /></Field>
                <Field label="System ID (Username)"><input required className={`${inputCls} ${isUsernameError ? 'border-amber-400 bg-amber-50/50' : ''}`} placeholder="e.g. Head.Name" value={formData.adminUsername} onChange={e => setFormData({ ...formData, adminUsername: e.target.value })} /></Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="System Key"><input required type="password" className={inputCls} value={formData.adminPassword} onChange={e => setFormData({ ...formData, adminPassword: e.target.value })} /></Field>
                  <Field label="Confirm Key"><input required type="password" className={inputCls} value={formData.adminPasswordConfirm} onChange={e => setFormData({ ...formData, adminPasswordConfirm: e.target.value })} /></Field>
                </div>
              </div>
            </div>
            <ModalFooter onCancel={closeModal} isLoading={createMutation.isPending} submitLabel="Activate Unit Node" />
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

function SectionHeader({ label }: { label: string }) { return <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-600 border-b-2 border-primary-50 pb-3 mb-6 tracking-widest">{label}</h4>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><label className="block text-[10px] font-black text-primary-600 uppercase tracking-widest ml-2 tracking-widest">{label}</label>{children}</div>; }
function ModalFooter({ onCancel, isLoading, submitLabel }: { onCancel: () => void; isLoading: boolean; submitLabel: string }) {
  return (<div className="flex justify-end gap-3 pt-8 mt-6 border-t border-primary-50"><Button variant="secondary" type="button" onClick={onCancel} className="px-8 h-14">Cancel</Button><Button variant="primary" type="submit" isLoading={isLoading} className="px-12 h-14 shadow-lg shadow-primary-500/20">{submitLabel}</Button></div>);
}
