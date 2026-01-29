import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Slider,
  Button,
  Box,
  Divider,
  Alert,
  Chip,
  Paper,
  Tab,
  Tabs,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Save,
  Restore,
  Settings as SettingsIcon,
  VolumeUp,
  DisplaySettings as DisplaySettingsIcon,
  Language,
  Security,
  ExpandMore
} from '@mui/icons-material';
import { useSettings } from '../../contexts/SettingsContext';
import { toast } from 'react-hot-toast';

// Consistent form field styling
const formFieldStyles = {
  '& .MuiOutlinedInput-root': {
    height: '56px',
  },
  '& .MuiInputLabel-root': {
    transform: 'translate(14px, 16px) scale(1)',
    '&.Mui-focused, &.MuiFormLabel-filled, &.MuiInputLabel-shrink': {
      transform: 'translate(14px, -9px) scale(0.75)',
    },
  },
  '& .MuiSelect-select': {
    display: 'flex',
    alignItems: 'center',
    paddingTop: '16px',
    paddingBottom: '16px',
  },
};

const Settings = () => {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [activeTab, setActiveTab] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Initialize validation errors as empty object
  useEffect(() => {
    setValidationErrors({});
    setHasChanges(false);
  }, []);

  const handleSettingChange = (key, value) => {
    // Clear any existing error for this field first
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });

    // Validate the new value
    const error = validateSetting(key, value);
    
    if (error) {
      // Set the error if validation fails
      setValidationErrors(prev => ({ ...prev, [key]: error }));
    } else {
      // Update settings if validation passes
      updateSettings({ [key]: value });
      setHasChanges(true);
    }
  };

  const validateSetting = (key, value) => {
    switch (key) {
      case 'fontSize':
        if (typeof value !== 'number' || value < 12 || value > 48) {
          return 'Font size must be between 12 and 48';
        }
        break;
      case 'maxWidth':
        // Fixed regex pattern for validation
        const widthRegex = /^\d+(%|px)$/;
        if (typeof value !== 'string' || !widthRegex.test(value)) {
          return 'Max width must be in format like 80% or 600px';
        }
        break;
      case 'opacity':
        if (typeof value !== 'number' || value < 0.1 || value > 1) {
          return 'Opacity must be between 0.1 and 1';
        }
        break;
      case 'textColor':
      case 'backgroundColor':
        // Validate hex color format
        const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (typeof value !== 'string' || !colorRegex.test(value)) {
          return 'Please enter a valid hex color (e.g., #ffffff)';
        }
        break;
      default:
        return null;
    }
    return null;
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      setLoading(true);
      setTimeout(() => {
        resetSettings();
        setHasChanges(false);
        setValidationErrors({});
        setLoading(false);
        toast.success('Settings reset to defaults');
      }, 1000);
    }
  };

  const handleSave = () => {
    // Check if there are any validation errors
    const hasErrors = Object.keys(validationErrors).length > 0;
    if (hasErrors) {
      toast.error('Please fix all validation errors before saving');
      return;
    }

    setLoading(true);
    // Simulate save operation
    setTimeout(() => {
      setHasChanges(false);
      setLoading(false);
      toast.success('Settings saved successfully');
    }, 1000);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  const SpeechRecognitionSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Language color="primary" />
              <Typography variant="h6">Language & Recognition</Typography>
            </Box>
            
            <TextField
              fullWidth
              select
              label="Language"
              margin="normal"
              variant="outlined"
              value={settings.language || 'en-US'}
              onChange={(e) => handleSettingChange('language', e.target.value)}
              sx={formFieldStyles}
            >
              <MenuItem value="en-US">🇺🇸 English (US)</MenuItem>
              <MenuItem value="en-GB">🇬🇧 English (UK)</MenuItem>
              <MenuItem value="es-ES">🇪🇸 Spanish</MenuItem>
              <MenuItem value="fr-FR">🇫🇷 French</MenuItem>
              <MenuItem value="de-DE">🇩🇪 German</MenuItem>
              <MenuItem value="ja-JP">🇯🇵 Japanese</MenuItem>
              <MenuItem value="zh-CN">🇨🇳 Chinese (Mandarin)</MenuItem>
            </TextField>

            <TextField
              fullWidth
              select
              label="Speech Provider"
              margin="normal"
              variant="outlined"
              value={settings.speechProvider || 'webSpeech'}
              onChange={(e) => handleSettingChange('speechProvider', e.target.value)}
              sx={formFieldStyles}
              helperText="Choose your preferred speech recognition service"
            >
              <MenuItem value="webSpeech">
                <Box display="flex" alignItems="center" gap={1}>
                  Web Speech API
                  <Chip label="Free" size="small" color="success" />
                </Box>
              </MenuItem>
              <MenuItem value="google">
                <Box display="flex" alignItems="center" gap={1}>
                  Google Cloud Speech
                  <Chip label="Free Tier" size="small" color="info" />
                </Box>
              </MenuItem>
              <MenuItem value="azure">
                <Box display="flex" alignItems="center" gap={1}>
                  Azure Speech
                  <Chip label="Free Tier" size="small" color="info" />
                </Box>
              </MenuItem>
              <MenuItem value="assemblyai">
                <Box display="flex" alignItems="center" gap={1}>
                  AssemblyAI
                  <Chip label="Free Tier" size="small" color="info" />
                </Box>
              </MenuItem>
            </TextField>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <VolumeUp color="primary" />
              <Typography variant="h6">Recognition Options</Typography>
            </Box>

            <Box mb={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.continuous || false}
                    onChange={(e) => handleSettingChange('continuous', e.target.checked)}
                    color="primary"
                  />
                }
                label="Continuous Recognition"
              />
              <Typography variant="caption" display="block" color="textSecondary">
                Keep listening after each phrase
              </Typography>
            </Box>

            <Box mb={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.interimResults || false}
                    onChange={(e) => handleSettingChange('interimResults', e.target.checked)}
                    color="primary"
                  />
                }
                label="Show Interim Results"
              />
              <Typography variant="caption" display="block" color="textSecondary">
                Display partial results while speaking
              </Typography>
            </Box>

            <Box mb={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showConfidence || false}
                    onChange={(e) => handleSettingChange('showConfidence', e.target.checked)}
                    color="primary"
                  />
                }
                label="Show Confidence Score"
              />
              <Typography variant="caption" display="block" color="textSecondary">
                Display recognition accuracy percentage
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const DisplaySettingsComponent = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <DisplaySettingsIcon color="primary" />
              <Typography variant="h6">Text Appearance</Typography>
            </Box>
            
            <Box mb={3}>
              <Typography gutterBottom>Font Size: {settings.fontSize || 24}px</Typography>
              <Slider
                value={settings.fontSize || 24}
                onChange={(_, value) => handleSettingChange('fontSize', value)}
                min={12}
                max={48}
                step={2}
                marks={[
                  { value: 12, label: '12px' },
                  { value: 24, label: '24px' },
                  { value: 36, label: '36px' },
                  { value: 48, label: '48px' }
                ]}
                valueLabelDisplay="auto"
                color="primary"
              />
              {validationErrors.fontSize && (
                <Typography variant="caption" color="error" display="block">
                  {validationErrors.fontSize}
                </Typography>
              )}
            </Box>

            <TextField
              fullWidth
              select
              label="Font Family"
              margin="normal"
              variant="outlined"
              value={settings.fontFamily || 'Arial, sans-serif'}
              onChange={(e) => handleSettingChange('fontFamily', e.target.value)}
              sx={formFieldStyles}
            >
              <MenuItem value="Arial, sans-serif">Arial</MenuItem>
              <MenuItem value="'Helvetica Neue', sans-serif">Helvetica Neue</MenuItem>
              <MenuItem value="'Times New Roman', serif">Times New Roman</MenuItem>
              <MenuItem value="'Courier New', monospace">Courier New</MenuItem>
              <MenuItem value="'Roboto', sans-serif">Roboto</MenuItem>
              <MenuItem value="'Open Sans', sans-serif">Open Sans</MenuItem>
            </TextField>

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Text Color"
                  type="color"
                  variant="outlined"
                  value={settings.textColor || '#ffffff'}
                  onChange={(e) => handleSettingChange('textColor', e.target.value)}
                  error={!!validationErrors.textColor}
                  helperText={validationErrors.textColor}
                  sx={formFieldStyles}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Background Color"
                  type="color"
                  variant="outlined"
                  value={settings.backgroundColor || '#000000'}
                  onChange={(e) => handleSettingChange('backgroundColor', e.target.value)}
                  error={!!validationErrors.backgroundColor}
                  helperText={validationErrors.backgroundColor}
                  sx={formFieldStyles}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Layout & Position
            </Typography>

            <Box mb={3}>
              <Typography gutterBottom>Opacity: {Math.round((settings.opacity || 0.9) * 100)}%</Typography>
              <Slider
                value={settings.opacity || 0.9}
                onChange={(_, value) => handleSettingChange('opacity', value)}
                min={0.1}
                max={1}
                step={0.1}
                marks={[
                  { value: 0.1, label: '10%' },
                  { value: 0.5, label: '50%' },
                  { value: 1, label: '100%' }
                ]}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                color="primary"
              />
              {validationErrors.opacity && (
                <Typography variant="caption" color="error" display="block">
                  {validationErrors.opacity}
                </Typography>
              )}
            </Box>

            <TextField
              fullWidth
              select
              label="Caption Position"
              margin="normal"
              variant="outlined"
              value={settings.position || 'bottom'}
              onChange={(e) => handleSettingChange('position', e.target.value)}
              sx={formFieldStyles}
            >
              <MenuItem value="top">Top</MenuItem>
              <MenuItem value="center">Center</MenuItem>
              <MenuItem value="bottom">Bottom</MenuItem>
            </TextField>

            <TextField
              fullWidth
              label="Max Width"
              margin="normal"
              variant="outlined"
              value={settings.maxWidth || '80%'}
              onChange={(e) => handleSettingChange('maxWidth', e.target.value)}
              helperText={validationErrors.maxWidth || "e.g., 80%, 600px"}
              error={!!validationErrors.maxWidth}
              sx={formFieldStyles}
            />
          </CardContent>
        </Card>
      </Grid>

      {/* Live Preview */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Live Preview
            </Typography>
            <Paper
              sx={{
                p: 2,
                backgroundColor: settings.backgroundColor || '#000000',
                minHeight: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              <Typography
                sx={{
                  color: settings.textColor || '#ffffff',
                  fontSize: `${settings.fontSize || 24}px`,
                  fontFamily: settings.fontFamily || 'Arial, sans-serif',
                  opacity: settings.opacity || 0.9,
                  maxWidth: settings.maxWidth || '80%',
                  textAlign: 'center'
                }}
              >
                This is how your captions will appear during live sessions
              </Typography>
            </Paper>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const AdvancedSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">Additional Options</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.showSpeaker || false}
                      onChange={(e) => handleSettingChange('showSpeaker', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Show Speaker Names"
                />
                <Typography variant="caption" display="block" color="textSecondary">
                  Display who is speaking
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.autoScroll || false}
                      onChange={(e) => handleSettingChange('autoScroll', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Auto Scroll"
                />
                <Typography variant="caption" display="block" color="textSecondary">
                  Automatically scroll to new captions
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.showTimestamp || false}
                      onChange={(e) => handleSettingChange('showTimestamp', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Show Timestamps"
                />
                <Typography variant="caption" display="block" color="textSecondary">
                  Display time for each caption
                </Typography>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Grid>
    </Grid>
  );

  // Count validation errors
  const errorCount = Object.keys(validationErrors).length;

  return (
    <div className="settings-container" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box display="flex" alignItems="center" gap={2}>
          <SettingsIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Settings
          </Typography>
        </Box>
        <Box display="flex" gap={2} alignItems="center">
          {errorCount > 0 && (
            <Chip
              label={`${errorCount} Error${errorCount > 1 ? 's' : ''}`}
              color="error"
              size="small"
            />
          )}
          {hasChanges && (
            <Chip
              label="Unsaved Changes"
              color="warning"
              size="small"
            />
          )}
        </Box>
      </Box>

      {errorCount > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Please fix {errorCount} validation error{errorCount > 1 ? 's' : ''} before saving.
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="settings tabs"
          variant="fullWidth"
        >
          <Tab label="Speech Recognition" />
          <Tab label="Display" />
          <Tab label="Advanced" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <SpeechRecognitionSettings />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <DisplaySettingsComponent />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <AdvancedSettings />
        </TabPanel>
      </Paper>

      {/* Action Buttons */}
      <Box display="flex" gap={2} mt={4} justifyContent="flex-end">
        <Button
          variant="outlined"
          startIcon={<Restore />}
          onClick={handleReset}
          disabled={loading}
          color="warning"
        >
          Reset to Defaults
        </Button>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <Save />}
          onClick={handleSave}
          disabled={loading || errorCount > 0}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>
    </div>
  );
};


export default Settings;
