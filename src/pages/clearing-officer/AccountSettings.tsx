import React, { useState, type ChangeEvent } from "react";
import { User, Lock, Upload, Mail, Phone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useAuth } from "@/authentication/useAuth";
import {
  updateUserProfile,
  updateUserPassword,
  updateAvatar,
} from "@/services/userService";
import { toast } from "react-toastify";

const AccountSettings = () => {
  const { user, updateUser } = useAuth();
  // const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);

  console.log("👤 Current User in AccountSettings:", user);

  // Profile form state - initialized from user data
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
  });

  // Sync form state when user data changes (e.g., after login or refresh)
  React.useEffect(() => {
    if (user) {
      console.log("🔄 useEffect triggered - Syncing user data");
      console.log("👤 User profileImage:", user.profileImage);

      setProfileForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
      });
      // Sync avatar with user's profile image from server only if different
      if (user.profileImage && user.profileImage !== avatar) {
        console.log("✅ Updating avatar state to:", user.profileImage);
        setAvatar(user.profileImage);
      }
    }
  }, [user, avatar]);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleProfileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [id]: value }));
  };

  const handlePasswordInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user?.id) {
      toast.error("User not found. Please log in again.");
      return;
    }

    setLoading(true);
    try {
      const updateProfileParams = user.id;

      const response = await updateUserProfile(updateProfileParams, {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email,
        phoneNumber: profileForm.phoneNumber,
      });

      // Update the user context with new data, preserving existing user properties
      const updatedUser = {
        ...user,
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email,
        phoneNumber: profileForm.phoneNumber,
        // Merge any additional data from the response if available
        ...(response.user || {}),
      };

      updateUser(updatedUser);
      toast.success("Profile updated successfully!");
    } catch (error: unknown) {
      // Type guard for Axios error shape
      const err = error as { response?: { data?: { message?: string } } };
      console.error("Profile update error:", error);
      toast.error(
        err?.response?.data?.message ||
          "Failed to update profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user?.id) {
      toast.error("User not found. Please log in again.");
      return;
    }

    // Validate password match
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }

    // Validate password length
    if (passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long!");
      return;
    }

    setPasswordLoading(true);
    try {
      const updatePasswordParams = user.id;

      await updateUserPassword(updatePasswordParams, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      toast.success("Password changed successfully!");

      // Clear password form
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: unknown) {
      // Type guard for Axios error shape
      const err = error as { response?: { data?: { message?: string } } };
      console.error("Password change error:", error);
      toast.error(
        err?.response?.data?.message ||
          "Failed to change password. Please try again."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  // const handleDeleteAccount = async () => {
  //   setLoading(true);
  //   // TODO: Implement delete account functionality when endpoint is ready
  //   await new Promise((resolve) => setTimeout(resolve, 1000));
  //   setLoading(false);
  //   setIsDeleteModalOpen(false);
  //   toast.info("Delete account functionality will be implemented soon.");
  // };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file.");
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        toast.error("Image size must be less than 5MB.");
        return;
      }

      if (!user?.id) {
        toast.error("User not found. Please log in again.");
        return;
      }

      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload the file
      setAvatarLoading(true);
      try {
        const response = await updateAvatar(user.id, file);

        console.log("📸 Upload Response:", response);

        // Extract the uploaded image URL from various possible response structures
        const uploadedImageUrl =
          response.updatedOfficer?.profileImage ||
          response.updatedOfficer?.profileImageUrl ||
          response.profileImageUrl ||
          response.profileImage ||
          response.data?.profileImageUrl ||
          response.data?.profileImage ||
          response.user?.profileImage ||
          response.user?.profileImageUrl;

        console.log("📸 Uploaded Image URL:", uploadedImageUrl);

        if (!uploadedImageUrl) {
          console.error("❌ No image URL in response:", response);
          throw new Error("Server did not return an image URL");
        }

        // Update the user context with new profile image
        const updatedUser = {
          ...user,
          profileImage: uploadedImageUrl,
        };

        console.log("👤 Updated User:", updatedUser);

        updateUser(updatedUser);

        // Update avatar state with the server URL for immediate display
        setAvatar(uploadedImageUrl);

        toast.success("Profile image updated successfully!");
      } catch (error: unknown) {
        // Type guard for Axios error shape
        const err = error as { response?: { data?: { message?: string } } };
        console.error("Avatar upload error:", error);

        // Reset preview on error
        setAvatar(null);

        toast.error(
          err?.response?.data?.message ||
            "Failed to upload profile image. Please try again."
        );
      } finally {
        setAvatarLoading(false);
      }
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your public profile details.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 mb-8">
            <div className="relative group">
              <Avatar className="w-24 h-24 border-2 border-primary">
                <AvatarImage
                  src={
                    avatar ||
                    user?.profileImage ||
                    // "https://github.com/evilrabbit.png"
                    "https://media.istockphoto.com/id/1327592449/vector/default-avatar-photo-placeholder-icon-grey-profile-picture-business-man.jpg?s=612x612&w=0&k=20&c=yqoos7g9jmufJhfkbQsk-mdhKEsih6Di4WZ66t_ib7I="
                  }
                />
                <AvatarFallback>
                  <User className="w-10 h-10" />
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className={`absolute inset-0 flex items-center justify-center bg-black/50 rounded-full transition-opacity ${
                  avatarLoading
                    ? "opacity-100 cursor-wait"
                    : "opacity-0 group-hover:opacity-100 cursor-pointer"
                }`}
              >
                {avatarLoading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                ) : (
                  <Upload className="text-white w-8 h-8" />
                )}
                <input
                  id="avatar-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={avatarLoading}
                />
              </label>
            </div>
            <div>
              <h2 className="text-2xl font-semibold">
                {user?.firstName} {user?.lastName}{" "}
              </h2>
              <span className="text-muted-foreground text-sm">
                {user?.schoolId}
              </span>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="firstName"
                    placeholder="John"
                    className="pl-10"
                    value={profileForm.firstName}
                    onChange={handleProfileInputChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    className="pl-10"
                    value={profileForm.lastName}
                    onChange={handleProfileInputChange}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="johndoe@example.com"
                  className="pl-10"
                  value={profileForm.email}
                  onChange={handleProfileInputChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+1234567890"
                  className="pl-10"
                  value={profileForm.phoneNumber}
                  onChange={handleProfileInputChange}
                />
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password Section */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            For your security, we recommend using a strong password that you
            don't use elsewhere.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordInputChange}
                  required
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordInputChange}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordInputChange}
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </div>
            <Button type="submit" disabled={passwordLoading}>
              {passwordLoading ? "Changing..." : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Delete Account Section */}
      {/* <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Delete Account</CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data. This action
            is irreversible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="text-destructive" />
                    <span>Are you absolutely sure?</span>
                  </div>
                </DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete
                  your account and remove your data from our servers.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={loading}
                >
                  {loading ? "Deleting..." : "Yes, delete my account"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card> */}
    </div>
  );
};

export default AccountSettings;
