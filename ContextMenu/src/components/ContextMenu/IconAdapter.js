import React from 'react';
import { getLucideIcon } from './iconMap';

const IconAdapter = ({ name, size, color, style }) => {
  const LucideIcon = getLucideIcon(name);
  
  if (!LucideIcon) {
    return null;
  }

  return <LucideIcon size={size} color={color} style={style} />;
};

export default IconAdapter;
