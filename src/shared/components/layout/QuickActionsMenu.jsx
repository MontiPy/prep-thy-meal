import React, { useState } from 'react';
import {
  Fab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  useMediaQuery,
  useTheme,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Calculate as CalculateIcon,
  FileDownload as ExportIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';

/**
 * Quick Actions Menu - Floating action button (mobile) or dropdown (desktop)
 * Provides quick access to common actions based on current context
 */
const QuickActionsMenu = ({
  currentTab = 'calculator',
  onNewPlan,
  onSearchIngredients,
  onCalculateCalories,
  onExportShoppingList,
}) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (callback) => {
    if (callback) {
      callback();
    }
    handleClose();
  };

  // Context-aware actions based on current tab
  const actions = [
    ...(currentTab === 'calculator' && onNewPlan
      ? [
          {
            label: 'New Plan',
            icon: <AddIcon />,
            onClick: () => handleAction(onNewPlan),
          },
        ]
      : []),
    ...(onSearchIngredients
      ? [
          {
            label: 'Search Ingredients',
            icon: <SearchIcon />,
            onClick: () => handleAction(onSearchIngredients),
          },
        ]
      : []),
    ...(onCalculateCalories
      ? [
          {
            label: 'Calculate Calories',
            icon: <CalculateIcon />,
            onClick: () => handleAction(onCalculateCalories),
          },
        ]
      : []),
    ...(currentTab === 'calculator' && onExportShoppingList
      ? [
          {
            label: 'Export Shopping List',
            icon: <ExportIcon />,
            onClick: () => handleAction(onExportShoppingList),
          },
        ]
      : []),
  ];

  // Mobile: Floating Action Button
  if (!isDesktop) {
    if (actions.length === 0) return null;

    return (
      <>
        <Tooltip title="Quick Actions">
          <Fab
            color="primary"
            aria-label="quick actions"
            onClick={handleClick}
            sx={{
              position: 'fixed',
              bottom: 80,
              right: 16,
              zIndex: (t) => t.zIndex.appBar - 1,
              transition: 'all 250ms ease-out',
              '&:hover': {
                boxShadow: '0 0 30px rgba(255,45,120,0.4), 0 0 80px rgba(255,45,120,0.15)',
              },
            }}
          >
            <MoreVertIcon />
          </Fab>
        </Tooltip>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
        >
          {actions.map((action, index) => (
            <MenuItem key={index} onClick={action.onClick}>
              <ListItemIcon>{action.icon}</ListItemIcon>
              <ListItemText>{action.label}</ListItemText>
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  }

  // Desktop: IconButton in header
  if (actions.length === 0) return null;

  return (
    <>
      <Tooltip title="Quick Actions">
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{ minWidth: { xs: 44, sm: 'auto' }, minHeight: { xs: 44, sm: 'auto' } }}
        >
          <MoreVertIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {actions.map((action, index) => (
          <MenuItem key={index} onClick={action.onClick}>
            <ListItemIcon>{action.icon}</ListItemIcon>
            <ListItemText>{action.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default QuickActionsMenu;
