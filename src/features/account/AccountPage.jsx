import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  Typography,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import { Delete as DeleteIcon, RestaurantMenu as MealIcon } from '@mui/icons-material';
import { useUser } from '../auth/UserContext.jsx';
import Login from '../auth/Login';
import ConfirmDialog from '../../shared/components/ui/ConfirmDialog';
import { loadUserPreferences, updateUserPreference } from '../../shared/services/userPreferences';
import { getGuestDataSummary } from '../../shared/services/guestMigration';
import { loadCustomTemplates, deleteCustomTemplate } from '../meal-planner/mealTemplates';



const AccountPage = () => {
  const { user, isGuest, logout } = useUser();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [preferences, setPreferences] = useState({ showRecentIngredients: true });
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [guestData, setGuestData] = useState({ planCount: 0, hasBaseline: false });
  
  // Templates state
  const [customTemplates, setCustomTemplates] = useState([]);
  const [templateToDelete, setTemplateToDelete] = useState(null);

  // Load templates
  const refreshTemplates = () => {
    const loaded = loadCustomTemplates();
    setCustomTemplates(loaded);
  };

  useEffect(() => {
    refreshTemplates();
  }, []);

  const handleDeleteTemplate = () => {
    if (templateToDelete) {
      deleteCustomTemplate(templateToDelete.id);
      refreshTemplates();
      setTemplateToDelete(null);
      toast.success('Template deleted');
    }
  };

  // Load user preferences
  useEffect(() => {
    const loadPrefs = async () => {
      if (user?.uid) {
        try {
          const prefs = await loadUserPreferences(user.uid);
          setPreferences(prefs);
        } catch (err) {
          console.error('Failed to load preferences:', err);
        } finally {
          setLoadingPrefs(false);
        }
      }
    };
    loadPrefs();
  }, [user?.uid]);

  // Load guest data summary
  useEffect(() => {
    if (isGuest) {
      const summary = getGuestDataSummary();
      setGuestData(summary);
    }
  }, [isGuest]);

  const handleTogglePreference = async (key, value) => {
    if (!user?.uid) return;

    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    try {
      await updateUserPreference(user.uid, key, value);
      toast.success('Preference updated!');
    } catch (err) {
      console.error('Failed to save preference:', err);
      toast.error('Failed to save preference. Please try again.');
      // Revert on error
      setPreferences(preferences);
    }
  };

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

  // Guest Mode UI
  if (isGuest) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 1.5, md: 3 } }}>
        <Stack spacing={2.5}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardHeader
              title={
                <Stack spacing={0.5} alignItems="center" textAlign="center">
                  <Typography variant="h5" fontWeight={800}>
                    <span className="wiggle">👋</span> Welcome, Guest!
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    You're using Prep Thy Meal in guest mode
                  </Typography>
                </Stack>
              }
            />
            <CardContent>
              <Stack spacing={3}>
                {/* Current Guest Status */}
                <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: 'background.paper' }}>
                  <CardHeader title={<Typography variant="h6" fontWeight={800}>Your Guest Data</Typography>} />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={3}>
                        <Card variant="outlined" sx={{ borderRadius: 2, textAlign: 'center' }}>
                          <CardContent>
                            <Typography variant="h4" fontWeight={800} color="primary">
                              {guestData.planCount}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Meal Plans
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Card variant="outlined" sx={{ borderRadius: 2, textAlign: 'center' }}>
                          <CardContent>
                            <Typography variant="h4" fontWeight={800} color="primary">
                              {guestData.hasBaseline ? '✓' : '—'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Baseline Config
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Card variant="outlined" sx={{ borderRadius: 2 }}>
                          <CardContent>
                            <Typography fontWeight={700} gutterBottom>Storage Location</Typography>
                            <Typography variant="body2" color="text.secondary">
                              📱 Saved locally on this device only
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Benefits of Signing Up */}
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    background: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(99,102,241,0.1) 100%)'
                        : 'linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(99,102,241,0.05) 100%)',
                    borderColor: 'primary.main',
                  }}
                >
                  <CardHeader
                    title={<Typography variant="h6" fontWeight={800}>Unlock Premium Features</Typography>}
                    subheader="Sign up with Google to access all features"
                  />
                  <CardContent>
                    <Grid container spacing={2}>
                      {[
                        { icon: '☁️', title: 'Cloud Sync', desc: 'Access your data from any device' },
                        { icon: '🔒', title: 'Secure Backup', desc: 'Never lose your meal plans' },
                        { icon: '📱', title: 'Multi-Device', desc: 'Seamlessly switch between devices' },
                        { icon: '⚙️', title: 'Preferences', desc: 'Customize your experience' },
                        { icon: '💾', title: 'Auto-Save', desc: 'Automatic cloud backup' },
                        { icon: '🎯', title: 'Keep Your Data', desc: 'All guest data migrates automatically!' },
                      ].map((feature) => (
                        <Grid item xs={12} sm={6} md={4} key={feature.title}>
                          <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                            <CardContent>
                              <Stack spacing={0.5}>
                                <Typography variant="h5">{feature.icon}</Typography>
                                <Typography fontWeight={700}>{feature.title}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {feature.desc}
                                </Typography>
                              </Stack>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>

                    <Box sx={{ textAlign: 'center', mt: 3 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        onClick={() => setShowLoginModal(true)}
                        sx={{ minWidth: 240, fontWeight: 700 }}
                      >
                        Sign Up / Login with Google
                      </Button>
                      {guestData.hasAnyData && (
                        <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                          ✓ Your {guestData.planCount} plan{guestData.planCount !== 1 ? 's' : ''} will be saved automatically
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>

                {/* Guest Mode Features */}
                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardHeader title={<Typography variant="h6" fontWeight={800}>What You Can Do in Guest Mode</Typography>} />
                  <CardContent>
                    <Stack spacing={1.25}>
                      <FeatureCard title="Create Meal Plans" description="Plan your meals and calculate nutrition" status="Available" />
                      <FeatureCard title="Add Custom Ingredients" description="Add your own ingredients" status="Available" />
                      <FeatureCard title="Export Shopping Lists" description="Download PDF shopping lists" status="Available" />
                      <FeatureCard title="Calorie Calculator" description="Calculate your daily needs" status="Available" />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" display="block" mt={2}>
                      ⚠️ Guest data is only saved on this browser. Clear your browser data and it's gone forever!
                    </Typography>
                  </CardContent>
                </Card>
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        {/* Login Modal */}
        <Login
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={(user) => {
            setShowLoginModal(false);
            toast.success(`Welcome, ${user.displayName}!`);
          }}
        />
      </Box>
    );
  }

  // Authenticated User UI
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

              {/* Features & Templates Column */}
              <Grid item xs={12} md={6}>
                {/* Templates Manager */}
                <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
                  <CardHeader 
                    title={<Typography variant="h6" fontWeight={800}>My Templates</Typography>}
                    subheader={`${customTemplates.length} saved custom meals`}
                  />
                  <CardContent sx={{ pt: 0 }}>
                    {customTemplates.length === 0 ? (
                      <Box sx={{ py: 4, textAlign: 'center', opacity: 0.7 }}>
                        <Typography variant="body2" color="text.secondary">
                          No custom templates yet.
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Save a meal as a template in the Planner to see it here.
                        </Typography>
                      </Box>
                    ) : (
                      <Stack spacing={1.5}>
                        {customTemplates.map((template) => (
                          <Card 
                            key={template.id} 
                            variant="outlined" 
                            sx={{ 
                              borderRadius: 2,
                              '&:hover': { bgcolor: (theme) => theme.palette.action.hover }
                            }}
                          >
                            <CardContent sx={{ p: 1.5, '&:last-child': { p: 1.5 } }}>
                              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                <Box>
                                  <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                                    <Typography variant="subtitle2" fontWeight={700}>
                                      {template.name}
                                    </Typography>
                                    <Chip 
                                      label={template.category} 
                                      size="small" 
                                      sx={{ height: 20, fontSize: '0.65rem', textTransform: 'capitalize' }} 
                                    />
                                  </Stack>
                                  <Typography variant="caption" color="text.secondary">
                                    {template.ingredients.length} ingredients
                                  </Typography>
                                </Box>
                                <Tooltip title="Delete Template">
                                  <IconButton 
                                    size="small" 
                                    color="error"
                                    onClick={() => setTemplateToDelete(template)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Settings & Actions */}
            <Grid container spacing={2} sx={{ mt: 0 }}>
              {/* Preferences */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
                  <CardHeader title={<Typography variant="h6" fontWeight={800}>App Settings</Typography>} />
                  <CardContent>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography fontWeight={600}>Recent Ingredients</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Show recently used items in planner
                          </Typography>
                        </Box>
                        <Switch
                          checked={preferences.showRecentIngredients}
                          onChange={(e) => handleTogglePreference('showRecentIngredients', e.target.checked)}
                          disabled={loadingPrefs}
                        />
                      </Box>
                      <Divider />
                      <Stack spacing={1}>
                        <Button variant="outlined" color="inherit" onClick={() => setShowDeleteConfirm(true)} fullWidth>
                          Reset Local Data
                        </Button>
                        <Button variant="contained" color="error" onClick={handleLogout} fullWidth>
                          Sign Out
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Support */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
                  <CardHeader title={<Typography variant="h6" fontWeight={800}>Support</Typography>} />
                  <CardContent>
                    <Stack spacing={2}>
                      <Typography variant="body2" color="text.secondary">
                        Prep Thy Meal is currently in Beta. Your feedback helps us improve!
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Button variant="outlined" fullWidth>Feedback</Button>
                        <Button variant="contained" color="primary" fullWidth>Rate App</Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
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

        <ConfirmDialog
          isOpen={Boolean(templateToDelete)}
          onClose={() => setTemplateToDelete(null)}
          onConfirm={handleDeleteTemplate}
          title="Delete Template?"
          message={`Are you sure you want to delete "${templateToDelete?.name}"?`}
          confirmText="Delete"
          variant="danger"
        />
      </Stack>
    </Box>
  );
};

export default AccountPage;
