import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import Layout from "../../components/Layout";
import { adminApi } from "../../services/api";

export default function AdminProfile() {
  const [profile, setProfile] = useState({ name: "", email: "", website_link: "", full_address: "", profile_photo: "" });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [pwdForm, setPwdForm]   = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [savingPwd, setSavingPwd] = useState(false);
  const photoRef = useRef();

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res  = await adminApi.getProfile();
      const data = res?.data || res;
      setProfile({ name: data.name || "", email: data.email || "", website_link: data.website_link || "", full_address: data.full_address || "", profile_photo: data.profile_photo || "" });
      localStorage.setItem("vp_user_name", data.name || "");
      localStorage.setItem("vp_user_email", data.email || "");
      if (data.profile_photo) { localStorage.setItem("vp_user_photo", data.profile_photo); window.dispatchEvent(new Event("storage")); }
    } catch {
      setProfile({ name: localStorage.getItem("vp_user_name") || "", email: localStorage.getItem("vp_user_email") || "", website_link: "", full_address: "", profile_photo: localStorage.getItem("vp_user_photo") || "" });
    } finally { setLoading(false); }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUri = ev.target.result;
      setPhotoPreview(dataUri);
      localStorage.setItem("vp_user_photo", dataUri);
      window.dispatchEvent(new Event("storage"));
      try {
        await adminApi.uploadProfilePhoto(file);
        const res  = await adminApi.getProfile();
        const data = res?.data || res;
        const saved = data.profile_photo || dataUri;
        setProfile(p => ({ ...p, profile_photo: saved }));
        setPhotoPreview(null);
        localStorage.setItem("vp_user_photo", saved);
        window.dispatchEvent(new Event("storage"));
        toast.success("Profile photo updated");
      } catch (err) { toast.error(err.message || "Failed to upload photo"); }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res     = await adminApi.updateProfile({ name: profile.name, website_link: profile.website_link || null, full_address: profile.full_address || null });
      const updated = res?.data || res;
      localStorage.setItem("vp_user_name", updated.name || profile.name);
      window.dispatchEvent(new Event("storage"));
      toast.success("Profile updated");
    } catch (err) { toast.error(err.message || "Failed to update profile"); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwdForm.new_password !== pwdForm.confirm_password) { toast.error("Passwords do not match"); return; }
    if (pwdForm.new_password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setSavingPwd(true);
    try {
      await adminApi.changePassword({ current_password: pwdForm.current_password, new_password: pwdForm.new_password });
      toast.success("Password changed");
      setPwdForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) { toast.error(err.message || "Failed to change password"); }
    finally { setSavingPwd(false); }
  };

  const photoSrc = photoPreview || profile.profile_photo || null;
  const initials = (profile.name || "A").charAt(0).toUpperCase();

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-gray-100 border-t-blue-600 animate-spin" />
      </div>
    </Layout>
  );

  const inp = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none";

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your administrator account information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Avatar card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col items-center text-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-blue-50 flex items-center justify-center border-4 border-white shadow">
                {photoSrc
                  ? <img src={photoSrc} alt="Profile" className="w-full h-full object-cover" />
                  : <span className="text-3xl font-bold text-blue-600">{initials}</span>}
              </div>
              <button type="button" onClick={() => photoRef.current?.click()}
                className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center shadow hover:bg-blue-700 transition" title="Change photo">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                </svg>
              </button>
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">{profile.name || "Admin"}</p>
              <p className="text-sm text-gray-400 mt-0.5">{profile.email}</p>
              <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Administrator</span>
            </div>
            <button type="button" onClick={() => photoRef.current?.click()}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition font-medium">
              Change Photo
            </button>
          </div>

          {/* Forms */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Profile Information</h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Full Name</label>
                    <input type="text" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email Address</label>
                    <input type="email" value={profile.email} readOnly className={inp + " bg-gray-50 text-gray-400 cursor-not-allowed"} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Website Link</label>
                    <input type="url" value={profile.website_link} onChange={e => setProfile(p => ({ ...p, website_link: e.target.value }))} className={inp} placeholder="https://example.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Full Address</label>
                    <input type="text" value={profile.full_address} onChange={e => setProfile(p => ({ ...p, full_address: e.target.value }))} className={inp} />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button type="submit" disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50 transition">
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Change Password</h2>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Current Password</label>
                  <input type="password" value={pwdForm.current_password} onChange={e => setPwdForm(p => ({ ...p, current_password: e.target.value }))} className={inp} placeholder="Enter current password" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">New Password</label>
                    <input type="password" value={pwdForm.new_password} onChange={e => setPwdForm(p => ({ ...p, new_password: e.target.value }))} className={inp} placeholder="Enter new password" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Confirm New Password</label>
                    <input type="password" value={pwdForm.confirm_password} onChange={e => setPwdForm(p => ({ ...p, confirm_password: e.target.value }))} className={inp} placeholder="Confirm new password" />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button type="submit" disabled={savingPwd}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50 transition">
                    {savingPwd ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
