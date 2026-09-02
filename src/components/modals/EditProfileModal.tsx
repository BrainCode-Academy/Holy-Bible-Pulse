import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useBible } from '../../context/BibleContext';
import {
  X,
  Upload,
  Trash2,
  Camera,
  Check,
  AlertCircle,
  Loader2,
  User as UserIcon,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import {
  UserAvatar,
  PRESET_AVATARS,
  AVATAR_PALETTES,
} from '../common/UserAvatar';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalView = 'profile' | 'choose_action' | 'crop_image' | 'avatar_picker' | 'confirm_remove';

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUserProfile, uploadAvatar, chooseAvatarOption, removeAvatar } = useBible();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active sub-view in modal
  const [currentView, setCurrentView] = useState<ModalView>('profile');

  // Profile form state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Image Cropper State
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [rawImageMime, setRawImageMime] = useState<string>('image/jpeg');
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Cropper Canvas & Image Refs
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  // Avatar Picker State
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(user?.avatarId || 'bible');
  const [selectedPaletteId, setSelectedPaletteId] = useState<string>(user?.avatarBgColor || 'amber');

  // Sync state when modal opens or user updates
  useEffect(() => {
    if (isOpen && user) {
      setFullName(user.fullName || '');
      setSelectedAvatarId(user.avatarId || 'bible');
      setSelectedPaletteId(user.avatarBgColor || 'amber');
      setCurrentView('profile');
      setStatusMessage(null);
      setRawImageSrc(null);
    }
  }, [isOpen, user]);

  // Maximum allowed file size: 5MB
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  // Handle local image file selection
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMessage(null);

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      setStatusMessage({
        type: 'error',
        text: 'Please select a valid JPG, PNG, or WebP image file.',
      });
      return;
    }

    // Validate file size limit
    if (file.size > MAX_FILE_SIZE) {
      setStatusMessage({
        type: 'error',
        text: `Image exceeds maximum allowed size (5MB). Selected: ${(file.size / (1024 * 1024)).toFixed(1)}MB.`,
      });
      return;
    }

    setRawImageMime(file.type || 'image/jpeg');

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) return;

      const img = new Image();
      img.onload = () => {
        loadedImageRef.current = img;
        setRawImageSrc(result);
        setZoom(1);
        setRotation(0);
        setPanOffset({ x: 0, y: 0 });
        setCurrentView('crop_image');
      };
      img.onerror = () => {
        setStatusMessage({
          type: 'error',
          text: 'Unable to open selected image. Please try another image.',
        });
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  // Render crop preview on canvas
  const drawCropperCanvas = useCallback(() => {
    const canvas = cropCanvasRef.current;
    const img = loadedImageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width; // e.g. 320px
    ctx.clearRect(0, 0, size, size);

    // Background checkerboard for transparent images
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 0, size, size);

    ctx.save();
    // Center transformations in canvas
    ctx.translate(size / 2 + panOffset.x, size / 2 + panOffset.y);
    ctx.rotate((rotation * Math.PI) / 180);

    // Calculate base scale to fill square viewport
    const scale = Math.max(size / img.width, size / img.height) * zoom;
    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();
  }, [panOffset, rotation, zoom]);

  useEffect(() => {
    if (currentView === 'crop_image' && rawImageSrc) {
      drawCropperCanvas();
    }
  }, [currentView, rawImageSrc, drawCropperCanvas]);

  // Mouse & Touch Pan Drag Handlers
  const handlePointerDown = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX - panOffset.x, y: clientY - panOffset.y });
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    setPanOffset({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Produce high-resolution 512x512 cropped square image
  const generateCroppedBase64 = (): string | null => {
    const img = loadedImageRef.current;
    if (!img) return null;

    const exportCanvas = document.createElement('canvas');
    const targetDim = 512;
    exportCanvas.width = targetDim;
    exportCanvas.height = targetDim;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return null;

    // Viewport preview dimension in UI
    const previewDim = cropCanvasRef.current?.width || 320;
    const ratio = targetDim / previewDim;

    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 0, targetDim, targetDim);

    ctx.save();
    ctx.translate(targetDim / 2 + panOffset.x * ratio, targetDim / 2 + panOffset.y * ratio);
    ctx.rotate((rotation * Math.PI) / 180);

    const scale = Math.max(previewDim / img.width, previewDim / img.height) * zoom * ratio;
    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    return exportCanvas.toDataURL('image/jpeg', 0.92);
  };

  // 1. SAVE CROPPED PHOTO
  const handleSaveCroppedPhoto = async () => {
    const croppedDataUrl = generateCroppedBase64();
    if (!croppedDataUrl) {
      setStatusMessage({ type: 'error', text: 'Unable to process cropped photo. Please try again.' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      await uploadAvatar(croppedDataUrl, 'image/jpeg');
      setCurrentView('profile');
      setStatusMessage({
        type: 'success',
        text: 'Profile picture updated successfully.',
      });
    } catch (err: any) {
      console.error('Failed to save avatar:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Unable to save profile picture. Please try again.',
      });
      setCurrentView('profile');
    } finally {
      setIsSaving(false);
    }
  };

  // 2. SAVE PRESET AVATAR
  const handleSaveAvatarChoice = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    try {
      await chooseAvatarOption(selectedAvatarId, selectedPaletteId);
      setCurrentView('profile');
      setStatusMessage({
        type: 'success',
        text: 'Profile picture updated successfully.',
      });
    } catch (err: any) {
      console.error('Failed to save avatar choice:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Unable to save avatar. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 3. CONFIRM REMOVE PHOTO
  const handleExecuteRemove = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    try {
      await removeAvatar();
      setCurrentView('profile');
      setStatusMessage({
        type: 'success',
        text: 'Profile picture removed successfully.',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Unable to remove profile picture. Please try again.',
      });
      setCurrentView('profile');
    } finally {
      setIsSaving(false);
    }
  };

  // 4. SAVE PROFILE DISPLAY NAME
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a display name.' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      if (fullName.trim() !== user?.fullName) {
        await updateUserProfile(fullName.trim());
      }
      setStatusMessage({ type: 'success', text: 'Profile updated successfully.' });
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to update profile name. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !user) return null;

  const hasCustomPicture = Boolean(
    (user.profileImageType === 'uploaded_photo' || (!user.profileImageType && user.avatarUrl)) &&
      user.avatarUrl
  );

  return (
    <div
      id="edit-profile-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="edit-profile-modal-card"
        className="w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl p-6 relative overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hidden Native File Input */}
        <input
          ref={fileInputRef}
          type="file"
          id="profile-picture-file-input"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {/* ============================================================ */}
        {/* VIEW 1: MAIN PROFILE EDIT VIEW                               */}
        {/* ============================================================ */}
        {currentView === 'profile' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-400">
                  <UserIcon size={20} />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">
                    Edit Profile
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Manage your photo, avatar, and account details
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                id="close-edit-profile-btn"
                className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Status Alert Banner */}
            {statusMessage && (
              <div
                id="profile-status-banner"
                className={`p-3 rounded-2xl text-xs flex items-center gap-2.5 transition animate-fadeIn ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle size={16} className="shrink-0 text-rose-500" />
                )}
                <span className="font-medium">{statusMessage.text}</span>
              </div>
            )}

            {/* Large Profile Image Section */}
            <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-stone-50/80 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-800 space-y-4">
              <div className="relative group">
                <UserAvatar
                  avatarUrl={user.avatarUrl}
                  profileImageType={user.profileImageType}
                  avatarId={user.avatarId}
                  avatarBgColor={user.avatarBgColor}
                  fullName={user.fullName}
                  size="xl"
                  roundedClassName="rounded-3xl"
                  borderClassName="border-4 border-amber-500/40 shadow-lg"
                />

                <button
                  type="button"
                  onClick={() => setCurrentView('choose_action')}
                  id="avatar-quick-camera-btn"
                  className="absolute -bottom-1.5 -right-1.5 p-2 rounded-full bg-amber-600 hover:bg-amber-700 text-white shadow-md border-2 border-white dark:border-stone-900 transition active:scale-95"
                  title="Change profile picture"
                >
                  <Camera size={15} />
                </button>
              </div>

              {/* Action Buttons Under Avatar */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCurrentView('choose_action')}
                  id="change-photo-modal-btn"
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition active:scale-95 flex items-center gap-1.5"
                >
                  <Camera size={13} />
                  <span>Change Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentView('avatar_picker')}
                  id="choose-avatar-modal-btn"
                  className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold shadow-2xs transition active:scale-95 flex items-center gap-1.5"
                >
                  <Sparkles size={13} className="text-amber-500" />
                  <span>Choose Avatar</span>
                </button>

                {hasCustomPicture && (
                  <button
                    type="button"
                    onClick={() => setCurrentView('confirm_remove')}
                    id="remove-photo-modal-btn"
                    className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-xs font-semibold transition active:scale-95 flex items-center gap-1"
                  >
                    <Trash2 size={12} />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>
            </div>

            {/* Profile Form (Display Name & Email) */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Display Name
                </label>
                <input
                  type="text"
                  id="edit-profile-name-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition shadow-2xs"
                />
              </div>

              {/* Read-Only Account Details */}
              <div className="p-3 rounded-2xl bg-stone-100/70 dark:bg-stone-800/40 border border-stone-200/50 dark:border-stone-800 text-xs space-y-1.5 text-stone-500 dark:text-stone-400">
                <div className="flex items-center justify-between">
                  <span>Email Address:</span>
                  <span className="font-semibold text-stone-700 dark:text-stone-300">{user.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Profile Image Mode:</span>
                  <span className="font-semibold text-amber-700 dark:text-amber-400 capitalize">
                    {user.profileImageType === 'uploaded_photo'
                      ? 'Uploaded Photo'
                      : user.profileImageType === 'avatar'
                      ? 'Themed Avatar'
                      : 'Default Initial'}
                  </span>
                </div>
              </div>

              {/* Footer Save Profile Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  id="cancel-profile-modal-btn"
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-2xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-profile-btn"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Save Profile</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 2: CHOOSE PHOTO ACTION SHEET                            */}
        {/* ============================================================ */}
        {currentView === 'choose_action' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentView('profile')}
                className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 transition"
              >
                <ArrowLeft size={18} />
              </button>
              <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                Change Profile Picture
              </h3>
              <div className="w-6"></div>
            </div>

            <div className="space-y-3">
              {/* Option A: Choose from device */}
              <button
                type="button"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                    fileInputRef.current.click();
                  }
                }}
                id="action-choose-device-btn"
                className="w-full p-4 rounded-2xl bg-white dark:bg-stone-800 hover:bg-amber-500/10 dark:hover:bg-amber-500/10 border border-stone-200 dark:border-stone-700 text-left transition flex items-center space-x-3.5 group shadow-2xs"
              >
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 group-hover:scale-110 transition">
                  <Upload size={20} />
                </div>
                <div>
                  <div className="font-semibold text-stone-900 dark:text-stone-100 text-sm">
                    Choose from device
                  </div>
                  <div className="text-xs text-stone-500 dark:text-stone-400">
                    Upload and crop a picture from your phone or computer
                  </div>
                </div>
              </button>

              {/* Option B: Use Avatar */}
              <button
                type="button"
                onClick={() => setCurrentView('avatar_picker')}
                id="action-use-avatar-btn"
                className="w-full p-4 rounded-2xl bg-white dark:bg-stone-800 hover:bg-amber-500/10 dark:hover:bg-amber-500/10 border border-stone-200 dark:border-stone-700 text-left transition flex items-center space-x-3.5 group shadow-2xs"
              >
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 group-hover:scale-110 transition">
                  <Sparkles size={20} />
                </div>
                <div>
                  <div className="font-semibold text-stone-900 dark:text-stone-100 text-sm">
                    Use Avatar
                  </div>
                  <div className="text-xs text-stone-500 dark:text-stone-400">
                    Select a Scripture-themed symbol or clean profile avatar
                  </div>
                </div>
              </button>

              {/* Option C: Remove Photo if exists */}
              {hasCustomPicture && (
                <button
                  type="button"
                  onClick={() => setCurrentView('confirm_remove')}
                  id="action-remove-photo-btn"
                  className="w-full p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/70 dark:hover:bg-rose-900/40 border border-rose-200/80 dark:border-rose-800/40 text-left transition flex items-center space-x-3.5 group"
                >
                  <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition">
                    <Trash2 size={20} />
                  </div>
                  <div>
                    <div className="font-semibold text-rose-700 dark:text-rose-300 text-sm">
                      Remove Photo
                    </div>
                    <div className="text-xs text-rose-600/80 dark:text-rose-400/80">
                      Delete current photo and revert to initial icon
                    </div>
                  </div>
                </button>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setCurrentView('profile')}
                className="w-full py-2.5 rounded-2xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              >
                Back to Profile
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 3: INTERACTIVE IMAGE CROPPER                            */}
        {/* ============================================================ */}
        {currentView === 'crop_image' && rawImageSrc && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentView('profile')}
                disabled={isSaving}
                className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 transition"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="text-center">
                <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                  Crop Profile Photo
                </h3>
                <p className="text-[11px] text-stone-500">Drag to reposition • Zoom to fit</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRotation((r) => (r + 90) % 360);
                }}
                className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition"
                title="Rotate 90°"
              >
                <RotateCw size={16} />
              </button>
            </div>

            {/* Canvas Viewport with Square Crop Mask */}
            <div className="relative mx-auto w-72 h-72 rounded-3xl overflow-hidden shadow-inner border-2 border-stone-300 dark:border-stone-700 bg-stone-950 flex items-center justify-center select-none touch-none">
              <canvas
                ref={cropCanvasRef}
                width={320}
                height={320}
                className="w-full h-full cursor-grab active:cursor-grabbing"
                onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
                onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={(e) => {
                  if (e.touches[0]) handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
                }}
                onTouchMove={(e) => {
                  if (e.touches[0]) handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
                }}
                onTouchEnd={handlePointerUp}
              />

              {/* Circular Avatar Boundary Mask Guide */}
              <div className="absolute inset-0 pointer-events-none border-2 border-white/40 rounded-full m-2 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] flex items-center justify-center">
                <div className="w-full h-px bg-white/20"></div>
                <div className="h-full w-px bg-white/20 absolute"></div>
              </div>
            </div>

            {/* Zoom Slider Controls */}
            <div className="space-y-1.5 px-2">
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                <span className="flex items-center gap-1">
                  <ZoomOut size={13} />
                  <span>Zoom</span>
                </span>
                <span className="font-mono text-[11px]">{zoom.toFixed(1)}x</span>
                <ZoomIn size={13} />
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-amber-600 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Cropper Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setPanOffset({ x: 0, y: 0 });
                  setZoom(1);
                  setRotation(0);
                }}
                className="px-3 py-2 rounded-xl text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 text-xs font-semibold transition"
              >
                Reset
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentView('profile')}
                  disabled={isSaving}
                  id="cancel-crop-btn"
                  className="px-4 py-2.5 rounded-2xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCroppedPhoto}
                  disabled={isSaving}
                  id="save-photo-btn"
                  className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Save Photo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 4: SCRIPTURE & NEUTRAL AVATAR PICKER                    */}
        {/* ============================================================ */}
        {currentView === 'avatar_picker' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentView('profile')}
                disabled={isSaving}
                className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 transition"
              >
                <ArrowLeft size={18} />
              </button>
              <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                Choose Scripture Avatar
              </h3>
              <div className="w-6"></div>
            </div>

            {/* Live Avatar Preview */}
            <div className="flex items-center justify-center p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800">
              <UserAvatar
                profileImageType="avatar"
                avatarId={selectedAvatarId}
                avatarBgColor={selectedPaletteId}
                fullName={user.fullName}
                size="lg"
                roundedClassName="rounded-3xl"
                borderClassName="border-4 border-amber-500/40 shadow-md"
              />
            </div>

            {/* Avatar Symbols Grid */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                1. Select Symbol / Icon
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1">
                {PRESET_AVATARS.map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedAvatarId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedAvatarId(item.id)}
                      className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition ${
                        isSelected
                          ? 'bg-amber-600 text-white shadow-md scale-105 ring-2 ring-amber-500'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                      }`}
                      title={item.name}
                    >
                      <Icon size={20} />
                      <span className="text-[9px] font-medium truncate max-w-[50px]">
                        {item.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Palette Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                2. Select Background Color
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {AVATAR_PALETTES.map((palette) => {
                  const isSelected = selectedPaletteId === palette.id;
                  return (
                    <button
                      key={palette.id}
                      type="button"
                      onClick={() => setSelectedPaletteId(palette.id)}
                      className={`w-7 h-7 rounded-full ${palette.bg} transition-all transform flex items-center justify-center ${
                        isSelected ? 'scale-125 ring-2 ring-offset-2 ring-amber-500 shadow-md' : 'hover:scale-110'
                      }`}
                      title={palette.label}
                    >
                      {isSelected && <Check size={12} className="text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentView('profile')}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-2xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAvatarChoice}
                disabled={isSaving}
                id="use-this-avatar-btn"
                className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Use This Avatar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 5: REMOVE PICTURE CONFIRMATION DIALOG                   */}
        {/* ============================================================ */}
        {currentView === 'confirm_remove' && (
          <div className="space-y-5 animate-fadeIn text-center p-2">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
              <Trash2 size={24} />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                Remove your profile picture?
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
                Your photo will be deleted from your account. Your profile will revert to your default initials or chosen avatar.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentView('profile')}
                disabled={isSaving}
                id="cancel-remove-photo-btn"
                className="px-5 py-2.5 rounded-2xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRemove}
                disabled={isSaving}
                id="confirm-remove-photo-btn"
                className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Remove</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
