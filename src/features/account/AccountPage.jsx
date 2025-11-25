import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Grid,
  Stack,
  Typography
} from '@mui/material';
import { useUser } from '../auth/UserContext.jsx';
import ConfirmDialog from '../../shared/components/ui/ConfirmDialog';

const FeatureCard = ({ title, description, status }) => (
  <Card variant="outlined" sx={{ borderRadius: 2 }}>
    <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box>
        <Typography fontWeight={700}>{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>
      <Chip label={status} color="success" size="small" />
    </CardContent>
  </Card>
);

const AccountPage = () => {
  const { user, logout } = useUser();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      localStorage.clear();
      await logout();
      toast.success('Local data cleared. Sign-in again to resync from cloud.');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account. Please try again.');
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 1.5, md: 3 } }}>
      <Stack spacing={2.5}>
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardHeader
            title={
              <Stack spacing={0.5} alignItems="center" textAlign="center">
                <Typography variant="h5" fontWeight={800}>
                  <span className="wiggle">👤</span> Account Settings
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage your account and preferences
                </Typography>
              </Stack>
            }
          />
          <CardContent>
            <Grid container spacing={2}>
              {/* Profile */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
                  <CardHeader
                    title={<Typography variant="h6" fontWeight={800}>Profile Information</Typography>}
                  />
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
                          src={user?.photoURL || ''}
                          alt={user?.displayName || 'Profile'}
                          sx={{ width: 48, height: 48 }}
                        >
                          {(user?.displayName || 'U').charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography fontWeight={700}>{user?.displayName || 'User'}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {user?.email}
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack spacing={0.75}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography fontWeight={600}>Account ID:</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {user?.uid?.slice(0, 8)}...
                          </Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography fontWeight={600}>Sign-in Provider:</Typography>
                          <Typography variant="body2" color="text.secondary">Google</Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography fontWeight={600}>Account Created:</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {user?.metadata?.creationTime
                              ? new Date(user.metadata.creationTime).toLocaleDateString()
                              : 'Unknown'}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Features */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
                  <CardHeader title={<Typography variant="h6" fontWeight={800}>App Features</Typography>} />
                  <CardContent>
                    <Stack spacing={1.25}>
                      <FeatureCard title="Cloud Sync" description="Your data syncs across devices" status="Enabled" />
                      <FeatureCard title="Meal Plans" description="Save unlimited meal plans" status="Available" />
                      <FeatureCard title="Custom Ingredients" description="Add your own ingredients" status="Available" />
                      <FeatureCard title="PDF Export" description="Export shopping lists" status="Available" />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Data Management */}
            <Card variant="outlined" sx={{ borderRadius: 3, mt: 2 }}>
              <CardHeader title={<Typography variant="h6" fontWeight={800}>Data Management</Typography>} />
              <CardContent>
                <Grid container spacing={2}>
                  {[
                    { title: 'Storage Used', value: '~1KB', detail: 'Per saved plan', color: 'primary.main' },
                    { title: 'Backup Status', value: '✓', detail: 'Auto-backup enabled', color: 'success.main' },
                    { title: 'Data Location', value: '🌐', detail: 'Cloud & Local', color: 'text.primary' },
                  ].map((item) => (
                    <Grid item xs={12} md={4} key={item.title}>
                      <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography fontWeight={700}>{item.title}</Typography>
                          <Typography variant="h5" fontWeight={800} color={item.color}>
                            {item.value}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.detail}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            {/* Support */}
            <Card variant="outlined" sx={{ borderRadius: 3, mt: 2 }}>
              <CardHeader title={<Typography variant="h6" fontWeight={800}>Support & Feedback</Typography>} />
              <CardContent>
                <Stack spacing={1.5}>
                  <Typography variant="body2" color="text.secondary">
                    Need help or have suggestions? We'd love to hear from you!
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <Button variant="contained">📧 Contact Support</Button>
                    <Button variant="outlined">💡 Send Feedback</Button>
                    <Button variant="contained" color="success">⭐ Rate App</Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Logout */}
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                mt: 2,
                backgroundColor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(248,113,113,0.08)' : 'rgba(254,226,226,0.7)',
                borderColor: 'error.light',
              }}
            >
              <CardHeader title={<Typography variant="h6" fontWeight={800}>Account Actions</Typography>} />
              <CardContent>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button variant="contained" color="error" onClick={handleLogout}>
                    🚪 Sign Out
                  </Button>
                  <Button variant="outlined" color="inherit" onClick={() => setShowDeleteConfirm(true)}>
                    🗑️ Reset Local Data
                  </Button>
                </Stack>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Signing out keeps your data safe in the cloud. Reset Local Data only clears this device.
                </Typography>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteAccount}
          title="Reset Local Data?"
          message={`This will clear all saved plans and ingredients on this device.\n\nCloud data in your account will resync after sign-in.\n\nProceed?`}
          confirmText="Clear Local Data"
          cancelText="Keep Data"
          variant="warning"
        />
      </Stack>
    </Box>
  );
};

export default AccountPage;
