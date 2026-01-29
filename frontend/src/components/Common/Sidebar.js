import React from 'react';
import { List, ListItem, ListItemIcon, ListItemText, Paper } from '@mui/material';
import { Dashboard, LiveTv, History, Settings } from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/' },
    { text: 'Live Caption', icon: <LiveTv />, path: '/live' },
    { text: 'History', icon: <History />, path: '/history' }, // Add this item
    { text: 'Settings', icon: <Settings />, path: '/settings' }
  ];

  return (
    <Paper className="sidebar" elevation={3}>
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            component={Link}
            to={item.path}
            selected={location.pathname === item.path}
            className={location.pathname === item.path ? 'selected' : ''}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default Sidebar;
