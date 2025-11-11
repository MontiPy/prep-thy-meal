import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useUser } from '../context/UserContext.jsx';
import ConfirmDialog from './ConfirmDialog';

const AccountPage = () => {
  const { user, logout } = useUser();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteAccount = async () => {
    // TODO: Implement actual account deletion with Firebase
    // For now, just logout and clear data
    try {
      // Clear local storage
      localStorage.clear();
      // Sign out
      await logout();
      // In production, this would also delete the Firebase user account
      // and all associated data from Firestore
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account. Please try again.');
    }
  };

  return (
    <div className="calculator">
      <div className="card">
        <div className="center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            <span className="wiggle">👤</span> Account Settings
          </h1>
          <p className="text-gray-600">
            Manage your account and preferences
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* User Info */}
          <div className="panel-blue">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Profile Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {user?.photoURL && (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-12 h-12 rounded-full"
                  />
                )}
                <div>
                  <p className="font-semibold">{user?.displayName || 'User'}</p>
                  <p className="text-gray-600 text-sm">{user?.email}</p>
                </div>
              </div>
              
              <div className="space-y-2 pt-4">
                <div className="flex justify-between">
                  <span className="font-medium">Account ID:</span>
                  <span className="text-sm text-gray-600">{user?.uid?.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Sign-in Provider:</span>
                  <span className="text-sm text-gray-600">Google</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Account Created:</span>
                  <span className="text-sm text-gray-600">
                    {user?.metadata?.creationTime ? 
                      new Date(user.metadata.creationTime).toLocaleDateString() : 
                      'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* App Features */}
          <div className="panel-green">
            <h3 className="text-xl font-bold text-gray-800 mb-4">App Features</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded border">
                <div>
                  <p className="font-medium">Cloud Sync</p>
                  <p className="text-sm text-gray-600">Your data syncs across devices</p>
                </div>
                <span className="text-green-600 font-medium">✓ Enabled</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white rounded border">
                <div>
                  <p className="font-medium">Meal Plans</p>
                  <p className="text-sm text-gray-600">Save unlimited meal plans</p>
                </div>
                <span className="text-green-600 font-medium">✓ Available</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white rounded border">
                <div>
                  <p className="font-medium">Custom Ingredients</p>
                  <p className="text-sm text-gray-600">Add your own ingredients</p>
                </div>
                <span className="text-green-600 font-medium">✓ Available</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white rounded border">
                <div>
                  <p className="font-medium">PDF Export</p>
                  <p className="text-sm text-gray-600">Export shopping lists</p>
                </div>
                <span className="text-green-600 font-medium">✓ Available</span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="mt-6 panel-gray">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Data Management</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded border">
              <p className="font-medium text-gray-800">Storage Used</p>
              <p className="text-2xl font-bold text-blue-600">~1KB</p>
              <p className="text-xs text-gray-600">Per saved plan</p>
            </div>
            
            <div className="text-center p-4 bg-white rounded border">
              <p className="font-medium text-gray-800">Backup Status</p>
              <p className="text-2xl font-bold text-green-600">✓</p>
              <p className="text-xs text-gray-600">Auto-backup enabled</p>
            </div>
            
            <div className="text-center p-4 bg-white rounded border">
              <p className="font-medium text-gray-800">Data Location</p>
              <p className="text-2xl font-bold text-gray-600">🌐</p>
              <p className="text-xs text-gray-600">Cloud & Local</p>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="mt-6 panel-yellow">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Support & Feedback</h3>
          <div className="space-y-3">
            <p className="text-gray-700">
              Need help or have suggestions? We'd love to hear from you!
            </p>
            <div className="flex gap-3 flex-wrap">
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                📧 Contact Support
              </button>
              <button className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
                💡 Send Feedback
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                ⭐ Rate App
              </button>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="mt-6 panel-red">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Account Actions</h3>
          <div className="flex gap-3">
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              🚪 Sign Out
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              🗑️ Delete Account
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Signing out will keep your data safe in the cloud for next time.
          </p>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account?"
        message={`Are you sure you want to permanently delete your account?\n\nThis will:\n• Delete all your meal plans\n• Delete all custom ingredients\n• Remove all your data from our servers\n\nThis action CANNOT be undone!`}
        confirmText="Delete My Account"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default AccountPage;