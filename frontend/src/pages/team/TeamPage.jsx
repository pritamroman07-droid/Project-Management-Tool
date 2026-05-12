import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { teamAPI, userAPI } from '../../api';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input, Textarea } from '../../components/common/Input';
import { Avatar } from '../../components/common/Avatar';
import { RoleBadge } from '../../components/common/Badge';
import { Plus, Users, Search, UserPlus, Trash2, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function TeamPage() {
  const { user } = useSelector((s) => s.auth);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddMember, setShowAddMember] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1' });
  const [memberSearch, setMemberSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [creating, setCreating] = useState(false);

  const loadTeams = async () => {
    try {
      const { data } = await teamAPI.getAll();
      setTeams(data.data);
    } catch { toast.error('Failed to load teams'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadTeams(); }, []);

  useEffect(() => {
    if (memberSearch.length < 2) { setSearchResults([]); return; }
    const search = async () => {
      try {
        const { data } = await userAPI.search(memberSearch);
        setSearchResults(data.data);
      } catch {}
    };
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [memberSearch]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { data } = await teamAPI.create(form);
      setTeams((prev) => [data.data, ...prev]);
      toast.success('Team created!');
      setShowCreate(false);
      setForm({ name: '', description: '', color: '#6366f1' });
    } catch { toast.error('Failed to create team'); }
    finally { setCreating(false); }
  };

  const handleAddMember = async (teamId, userId) => {
    try {
      const { data } = await teamAPI.addMember(teamId, { userId });
      setTeams((prev) => prev.map((t) => t._id === teamId ? data.data : t));
      toast.success('Member added!');
      setSearchResults([]);
      setMemberSearch('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add member'); }
  };

  const handleRemoveMember = async (teamId, userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      const { data } = await teamAPI.removeMember(teamId, userId);
      setTeams((prev) => prev.map((t) => t._id === teamId ? data.data : t));
      toast.success('Member removed');
    } catch { toast.error('Failed to remove member'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Team</h2>
          <p className="text-sm text-slate-500 mt-0.5">{teams.length} workspace{teams.length !== 1 ? 's' : ''}</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>New Team</Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array(3).fill(0).map((_, i) => <div key={i} className="card p-6 h-40 skeleton" />)}
        </div>
      ) : teams.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-14 h-14 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-600 dark:text-slate-400 mb-2">No teams yet</h3>
          <Button onClick={() => setShowCreate(true)} icon={<Plus className="w-4 h-4" />}>Create Team</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map((team) => (
            <div key={team._id} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: team.color || '#6366f1' }}>
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{team.name}</h3>
                    {team.description && <p className="text-xs text-slate-500 mt-0.5">{team.description}</p>}
                  </div>
                </div>
                <Button size="xs" variant="secondary" icon={<UserPlus className="w-3.5 h-3.5" />} onClick={() => setShowAddMember(team._id)}>
                  Add
                </Button>
              </div>

              <div className="space-y-2">
                {team.members?.map((m) => (
                  <div key={m.user?._id} className="flex items-center justify-between py-1.5 group">
                    <div className="flex items-center gap-2">
                      <Avatar user={m.user} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          {m.user?.name}
                          {team.owner === m.user?._id && <Crown className="w-3 h-3 text-yellow-500" />}
                        </p>
                        <p className="text-xs text-slate-400">{m.user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <RoleBadge role={m.role} />
                      {team.owner?._id === user?._id && m.user?._id !== user?._id && (
                        <button
                          onClick={() => handleRemoveMember(team._id, m.user?._id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Team"
        footer={<><Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button form="team-form" type="submit" loading={creating}>Create</Button></>}>
        <form id="team-form" onSubmit={handleCreate} className="space-y-4">
          <Input label="Team Name *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
          <div>
            <label className="label">Team Color</label>
            <input type="color" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer" />
          </div>
        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal isOpen={!!showAddMember} onClose={() => { setShowAddMember(null); setMemberSearch(''); setSearchResults([]); }} title="Add Team Member" size="sm">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="Search by name or email..."
              className="input pl-9 text-sm" autoFocus />
          </div>
          {searchResults.length > 0 && (
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {searchResults.map((u) => (
                <button key={u._id} onClick={() => handleAddMember(showAddMember, u._id)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-left transition-colors">
                  <Avatar user={u} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{u.name}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {memberSearch.length >= 2 && searchResults.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">No users found</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
