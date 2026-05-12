import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { userAPI, authAPI } from '../../api';
import { updateUser } from '../../store/slices/authSlice';
import { Button } from '../../components/common/Button';
import { Input, Textarea } from '../../components/common/Input';
import { Avatar } from '../../components/common/Avatar';
import { RoleBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Shield, Key, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [profile, setProfile] = useState({ name: user?.name || '', bio: user?.bio || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [twoFAToken, setTwoFAToken] = useState('');
  const [setting2FA, setSetting2FA] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await userAPI.updateProfile(profile);
      dispatch(updateUser(data.data));
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    try {
      await userAPI.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      toast.success('Password changed!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handle2FASetup = async () => {
    setSetting2FA(true);
    try {
      const { data } = await authAPI.setup2FA();
      setQrCode(data.data.qrCode);
      setShow2FA(true);
    } catch { toast.error('Failed to setup 2FA'); }
    finally { setSetting2FA(false); }
  };

  const handle2FAVerify = async () => {
    try {
      await authAPI.verify2FA(twoFAToken);
      dispatch(updateUser({ twoFactorEnabled: true }));
      toast.success('2FA enabled!');
      setShow2FA(false);
    } catch { toast.error('Invalid 2FA code'); }
  };

  const handle2FADisable = async () => {
    if (!confirm('Disable two-factor authentication?')) return;
    try {
      await authAPI.disable2FA();
      dispatch(updateUser({ twoFactorEnabled: false }));
      toast.success('2FA disabled');
    } catch { toast.error('Failed to disable 2FA'); }
  };

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div className="card p-6 flex items-center gap-4">
        <Avatar user={user} size="xl" />
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user?.name}</h2>
          <p className="text-slate-500 text-sm">{user?.email}</p>
          <div className="mt-2"><RoleBadge role={user?.role} /></div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-primary-500" /> Edit Profile
        </h3>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input label="Full Name" value={profile.name} onChange={(e) => setProfile((f) => ({ ...f, name: e.target.value }))} />
          <Textarea label="Bio" value={profile.bio} onChange={(e) => setProfile((f) => ({ ...f, bio: e.target.value }))} placeholder="Tell your team about yourself..." rows={3} />
          <div className="flex justify-end"><Button type="submit" loading={saving}>Save Changes</Button></div>
        </form>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Key className="w-4 h-4 text-primary-500" /> Change Password
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input label="Current Password" type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))} required />
          <Input label="New Password" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))} required />
          <Input label="Confirm New Password" type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))} required />
          <div className="flex justify-end"><Button type="submit">Change Password</Button></div>
        </form>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary-500" /> Two-Factor Authentication
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          {user?.twoFactorEnabled ? '✅ 2FA is enabled. Your account is secured.' : 'Add an extra layer of security.'}
        </p>
        {user?.twoFactorEnabled ? (
          <Button variant="danger" size="sm" onClick={handle2FADisable}>Disable 2FA</Button>
        ) : (
          <Button variant="secondary" size="sm" loading={setting2FA} icon={<Shield className="w-4 h-4" />} onClick={handle2FASetup}>Setup 2FA</Button>
        )}
      </div>

      <Modal isOpen={show2FA} onClose={() => setShow2FA(false)} title="Setup Two-Factor Authentication"
        footer={<><Button variant="secondary" onClick={() => setShow2FA(false)}>Cancel</Button><Button onClick={handle2FAVerify}>Enable 2FA</Button></>}>
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Scan with Google Authenticator or Authy</p>
          {qrCode && <img src={qrCode} alt="2FA QR" className="mx-auto rounded-lg border border-slate-200 dark:border-slate-700" />}
          <Input label="Enter 6-digit verification code" value={twoFAToken} onChange={(e) => setTwoFAToken(e.target.value)} maxLength={6} placeholder="000000" className="text-center text-2xl tracking-widest" />
        </div>
      </Modal>
    </div>
  );
}
