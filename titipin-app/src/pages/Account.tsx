import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, MessageSquare, HelpCircle, Globe, LogOut, ChevronRight, Crown, LogIn, Shield, User, CheckCircle2, Check, ArrowUpCircle, KeyRound, Eye, EyeOff, X, Loader2, AlertCircle } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useTranslation } from '../utils/i18n'
import { supabase } from '../lib/supabase'
import { checkForAppUpdate, getInstalledAppVersion, CURRENT_APP_VERSION, type AppVersionInfo } from '../lib/versionService'
import { AppUpdateModal } from '../components/AppUpdateModal'

function formatIDR(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
}

export function Account() {
  const navigate = useNavigate()
  const { userName, userEmail, isAuthenticated, hasMonthlyPlan, logoutUser, language, setLanguage } = useStore()
  const { t } = useTranslation()
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [manualUpdateInfo, setManualUpdateInfo] = useState<AppVersionInfo | null>(null)
  const [isManualUpdateOpen, setIsManualUpdateOpen] = useState(false)
  const [updateToast, setUpdateToast] = useState<string | null>(null)
  const [currentVersionName, setCurrentVersionName] = useState(CURRENT_APP_VERSION.versionName)

  useEffect(() => {
    getInstalledAppVersion().then((v) => setCurrentVersionName(v.versionName))
  }, [])

  const handleLogout = async () => {
    await logoutUser()
    navigate('/auth')
  }

  const handleCheckUpdate = async () => {
    const update = await checkForAppUpdate()
    if (update) {
      setManualUpdateInfo(update)
      setIsManualUpdateOpen(true)
    } else {
      setUpdateToast(
        language === 'en'
          ? `Titipin is up to date (v${currentVersionName}).`
          : `Aplikasi Titipin sudah versi terbaru (v${currentVersionName}).`
      )
      setTimeout(() => setUpdateToast(null), 3500)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)

    if (newPassword.length < 6) {
      setPasswordError(
        language === 'en'
          ? 'New password must be at least 6 characters.'
          : 'Kata sandi baru minimal 6 karakter.'
      )
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(
        language === 'en'
          ? 'Password confirmation does not match.'
          : 'Konfirmasi kata sandi tidak cocok.'
      )
      return
    }

    setPasswordLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        setPasswordError(error.message)
      } else {
        setIsPasswordModalOpen(false)
        setNewPassword('')
        setConfirmPassword('')
        setUpdateToast(
          language === 'en'
            ? 'Password updated successfully.'
            : 'Kata sandi berhasil diperbarui.'
        )
        setTimeout(() => setUpdateToast(null), 3500)
      }
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : String(err))
    } finally {
      setPasswordLoading(false)
    }
  }

  const menuItems = [
    ...(isAuthenticated
      ? [
          {
            icon: KeyRound,
            label: language === 'en' ? 'Change Password' : 'Ubah Kata Sandi',
            action: () => {
              setPasswordError(null)
              setNewPassword('')
              setConfirmPassword('')
              setIsPasswordModalOpen(true)
            },
          },
        ]
      : []),
    { icon: Bell, label: t('accNotifications'), action: () => navigate('/notifications') },
    { icon: MessageSquare, label: t('accLiveChat'), action: () => navigate('/live-chat') },
    { icon: HelpCircle, label: t('accFaq'), action: () => navigate('/faq') },
    {
      icon: Globe,
      label: t('accLanguage'),
      value: language === 'id' ? 'Bahasa Indonesia' : 'English',
      action: () => setIsLanguageModalOpen(true),
    },
    {
      icon: ArrowUpCircle,
      label: language === 'en' ? 'Check for Updates' : 'Pembaruan Aplikasi',
      value: `v${currentVersionName}`,
      action: handleCheckUpdate,
    },
    ...(isAuthenticated
      ? [{ icon: LogOut, label: t('accLogOut'), action: handleLogout, danger: true }]
      : [{ icon: LogIn, label: t('accSignInBtn'), action: () => navigate('/auth'), highlight: true }]),
  ]

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <div className="bg-green-700 px-4 pt-12 pb-8">
        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg border-2 border-green-300">
              {userName ? userName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-white text-xl font-bold">{userName}</p>
                <span className="bg-green-600 text-green-100 text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Shield size={10} /> {t('accVerified')}
                </span>
              </div>
              <p className="text-green-200 text-sm mt-0.5">{userEmail}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <div className="w-16 h-16 rounded-full bg-green-800 text-green-200 flex items-center justify-center mx-auto mb-3">
              <User size={30} />
            </div>
            <h2 className="text-white text-lg font-bold">{t('accNotSignedIn')}</h2>
            <p className="text-green-200 text-xs mt-1 mb-4">
              {t('accNotSignedInSub')}
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="px-6 py-2.5 bg-white text-green-800 rounded-xl text-xs font-bold shadow-md hover:bg-green-50 transition-all active:scale-95"
            >
              {t('accSignInBtn')}
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 px-4 py-5 space-y-5">
        {/* Monthly Subscription Membership Pass Card */}
        <div className={`rounded-2xl p-4 border transition-all ${
          hasMonthlyPlan
            ? 'bg-gradient-to-br from-green-800 via-green-700 to-emerald-800 border-green-600 text-white shadow-md'
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Crown size={18} className={hasMonthlyPlan ? 'text-amber-300' : 'text-gray-400'} />
                <p className={`text-sm font-bold ${hasMonthlyPlan ? 'text-white' : 'text-gray-800'}`}>
                  {hasMonthlyPlan ? t('accMemberActive') : t('accMemberInactive')}
                </p>
              </div>
              <p className={`text-xs ${hasMonthlyPlan ? 'text-green-100' : 'text-gray-500'}`}>
                {hasMonthlyPlan ? t('accMemberDescActive') : t('accMemberDescInactive')}
              </p>
            </div>
            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full whitespace-nowrap ${
              hasMonthlyPlan
                ? 'bg-amber-400 text-amber-950 shadow-xs'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {hasMonthlyPlan ? t('accMemberBadgeActive') : t('accMemberBadgeInactive')}
            </span>
          </div>

          {!hasMonthlyPlan ? (
            <div>
              <p className="text-xs text-gray-500 mb-3">
                {language === 'en'
                  ? `Only ${formatIDR(125000)}/month for unlimited daily access to Size S and M lockers.`
                  : `Cukup ${formatIDR(125000)}/bulan untuk akses loker S dan M setiap hari bebas biaya jam sewa.`}
              </p>
              <button
                onClick={() => navigate('/payment?type=subscription')}
                className="w-full py-3 bg-green-700 text-white rounded-xl font-bold text-xs hover:bg-green-800 active:scale-95 transition-all shadow-sm"
              >
                {t('accSubscribeBtn')}
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-green-600/60 space-y-2">
              <div className="flex items-center justify-between text-xs text-green-100">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 size={14} className="text-amber-300" />
                  {language === 'en' ? 'Membership Status:' : 'Status Keanggotaan:'} <strong>{t('txActive')}</strong>
                </span>
                <span className="text-[11px] bg-black/20 text-green-200 px-2 py-0.5 rounded-md font-mono">
                  {t('accOneAccount')}
                </span>
              </div>
              <p className="text-[11px] text-green-200">
                {t('accValidUntil', { date: language === 'en' ? '17 December 2026' : '17 Desember 2026' })}
              </p>
            </div>
          )}
        </div>

        {/* Menu items */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100 shadow-xs">
          {menuItems.map(({ icon: Icon, label, action, danger, highlight, value }: any) => (
            <button
              key={label}
              onClick={action}
              className={`w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors ${
                danger
                  ? 'text-red-500'
                  : highlight
                  ? 'text-green-700 font-bold bg-green-50/50'
                  : 'text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={danger ? 'text-red-400' : highlight ? 'text-green-600' : 'text-gray-400'} />
                <span className="text-sm font-medium">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                {value && <span className="text-xs text-gray-400 font-medium">{value}</span>}
                {!danger && <ChevronRight size={16} className={highlight ? 'text-green-600' : 'text-gray-300'} />}
              </div>
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-gray-300 pb-2">Titipin v1.0.7 • Connected to Supabase Auth</p>
      </div>

      {/* Language Selection Dialog / Popup */}
      {isLanguageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-green-100 text-green-700 flex items-center justify-center">
                  <Globe size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900">
                    {language === 'id' ? 'Pilih Bahasa' : 'Select Language'}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    {language === 'id' ? 'Preferensi bahasa aplikasi' : 'Application language preference'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLanguageModalOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 pt-1">
              {[
                {
                  code: 'id' as const,
                  label: 'Bahasa Indonesia',
                  desc: 'Bahasa Indonesia (ID)',
                  badge: 'ID',
                },
                {
                  code: 'en' as const,
                  label: 'English',
                  desc: 'English (US)',
                  badge: 'EN',
                },
              ].map((opt) => {
                const isSelected = language === opt.code
                return (
                  <button
                    key={opt.code}
                    onClick={() => {
                      setLanguage(opt.code)
                      setIsLanguageModalOpen(false)
                    }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all ${
                      isSelected
                        ? 'border-green-600 bg-green-50/70 text-green-900 font-bold shadow-xs'
                        : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold tracking-wider ${
                          isSelected ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {opt.badge}
                      </span>
                      <div className="text-left">
                        <p className="text-sm font-bold text-gray-900">{opt.label}</p>
                        <p className="text-xs text-gray-500">{opt.desc}</p>
                      </div>
                    </div>
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center shadow-xs">
                        <Check size={14} className="stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                    )}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setIsLanguageModalOpen(false)}
              className="w-full mt-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all"
            >
              {language === 'id' ? 'Batal' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-green-100 text-green-700 flex items-center justify-center">
                  <KeyRound size={17} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900">
                    {language === 'en' ? 'Change Password' : 'Ubah Kata Sandi'}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    {language === 'en' ? 'Update your account password securely' : 'Perbarui kata sandi akun Anda'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                aria-label="Tutup"
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {passwordError && (
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-xs">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {language === 'en' ? 'New Password' : 'Kata Sandi Baru'}
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={language === 'en' ? 'Minimum 6 characters' : 'Minimal 6 karakter'}
                    className="w-full pr-10 pl-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-green-600 focus:bg-white transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass((v) => !v)}
                    aria-label="Toggle password visibility"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {language === 'en' ? 'Confirm New Password' : 'Konfirmasi Kata Sandi Baru'}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={language === 'en' ? 'Re-enter new password' : 'Ulangi kata sandi baru'}
                    className="w-full pr-10 pl-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-green-600 focus:bg-white transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass((v) => !v)}
                    aria-label="Toggle confirm password visibility"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full py-3 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  {passwordLoading && <Loader2 size={14} className="animate-spin" />}
                  {passwordLoading
                    ? language === 'en'
                      ? 'Saving...'
                      : 'Menyimpan...'
                    : language === 'en'
                    ? 'Save New Password'
                    : 'Simpan Kata Sandi'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all"
                >
                  {language === 'en' ? 'Cancel' : 'Batal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Check Update Modal */}
      {manualUpdateInfo && (
        <AppUpdateModal
          updateInfo={manualUpdateInfo}
          isOpen={isManualUpdateOpen}
          onClose={() => setIsManualUpdateOpen(false)}
        />
      )}

      {/* Update Status Toast Notification */}
      {updateToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] bg-gray-900/90 text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-lg backdrop-blur-xs flex items-center gap-2 border border-white/10 animate-fade-in whitespace-nowrap">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{updateToast}</span>
        </div>
      )}
    </div>
  )
}
