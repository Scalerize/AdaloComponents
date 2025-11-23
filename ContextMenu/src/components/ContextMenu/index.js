import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
  Modal,
  Dimensions,
} from 'react-native';

import Icon from './IconAdapter';

const EDGE_MARGIN = 20;
const SPACING_Y = 10;


const ContextMenu = props => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [iconLayout, setIconLayout] = useState(null);
  const [menuSize, setMenuSize] = useState(null);
  const iconRef = useRef(null);
  const menuRef = useRef(null);

  const getDimensions = Platform.select({
    web: (setLayout, ref) => {
      let rect = ref?.current?.getBoundingClientRect?.();
      rect &&
        setLayout({
          width: rect.width,
          height: rect.height,
          pageX: rect.left,
          pageY: rect.top,
        });
    },
    default: (setLayout, ref) =>
      ref?.current?.measure((x, y, width, height, pageX, pageY) => {
        setLayout({pageX, pageY, width, height});
      }),
  });
  
  const measureIcon = () => getDimensions(setIconLayout, iconRef);
  const measureMenu = () => getDimensions(setMenuSize, menuRef);

  const toggleMenu = () => {
    measureIcon();
    setMenuVisible(!menuVisible);
  };

  const closeMenu = () => {
    setMenuVisible(false);
  };

  const handleMenuItemPress = action => {
    setMenuVisible(false);
    if (action && typeof action === 'function') {
      action();
    }
  };

  const getMenuAlignment = (iconLayout, menuSize, windowWidth) => {
    if (!iconLayout || !menuSize) return 'right';

    const rightAlignedPosition = iconLayout.pageX + iconLayout.width;
    const leftAlignedPosition = iconLayout.pageX - menuSize.width;

    if (rightAlignedPosition + menuSize.width + EDGE_MARGIN > windowWidth) {
      return 'left';
    }

    if (leftAlignedPosition < EDGE_MARGIN) {
      return 'right';
    }

    return 'right';
  };

  const iconName = props.icon?.iconName || 'menu';
  const iconColor = props.icon?.iconColor || '#000000';
  const iconSize = props.icon?.iconSize || 24;

  const isEditor = props.editor || false;
  const showMenuOnEditor =
    isEditor &&
    (props.openAccordion === 'root' ||
      props.openAccordion?.startsWith('menuItem'));

  const dynamicStyles = StyleSheet.create({
    menuContainer: {
      ...styles.menuContainer,
      position: isEditor ? 'fixed' : 'absolute',
      backgroundColor: props.backgroundColor || '#FFFFFF',
      borderRadius:
        props.menuBorderRadius !== undefined ? props.menuBorderRadius : 5,
      shadowColor: props.menuShadowColor || '#000000',
      shadowOpacity:
        props.menuShadowOpacity !== undefined
          ? props.menuShadowOpacity / 100
          : 0.1,
      transform:
        iconLayout && menuSize
          ? [
              {
                translateX:
                  getMenuAlignment(
                    iconLayout,
                    menuSize,
                    Dimensions.get('window').width,
                  ) === 'left'
                    ? iconLayout.pageX + iconLayout.width - menuSize.width
                    : iconLayout.pageX,
              },
              {translateY: iconLayout.pageY + iconLayout.height + SPACING_Y },
            ]
          : [],
    },
    menuItemText: {
      ...styles.menuItemText,
      color: props.textColor || '#000000',
    },
  });

  const menuItems = [];
  for (let i = 1; i <= 5; i++) {
    const item = props[`menuItem${i}`];
    if (item && item.label && item.enabled) {
      menuItems.push(item);
    }
  }

  if (isEditor) {
    useEffect(() => {
      const style = document.createElement('style');
      style.innerHTML = `
          foreignObject:has(.context-menu-fixed-container) {
            overflow: visible !important;
          }
          
          .context-menu-fixed-container {
            z-index: 1000;
            margin-top: calc(${iconSize}px + 10px) !important;
            right: 20px;
          }
        `;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
      };
    }, []);
  }

  useEffect(() => {
    const handleResize = () => {
      measureIcon();
      if (menuVisible) {
        setTimeout(measureMenu, 0);
      }
    };

    if (Platform.OS === 'web') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    } else {
      const subscription = Dimensions.addEventListener('change', handleResize);
      return () => subscription.remove();
    }
  }, [menuVisible]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        ref={iconRef}
        onPress={toggleMenu}
        onLayout={measureIcon}>
        <Icon name={iconName} size={iconSize} color={iconColor} />
      </TouchableOpacity>

      {(!isEditor || showMenuOnEditor) && (
        <Modal
          visible={showMenuOnEditor || menuVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={closeMenu}>
          {!isEditor && (
            <TouchableWithoutFeedback
              onPress={closeMenu}
              style={styles.overlay}>
              <View style={styles.overlay}></View>
            </TouchableWithoutFeedback>
          )}
          <View
            style={dynamicStyles.menuContainer}
            ref={menuRef}
            onLayout={measureMenu}
            className="context-menu-fixed-container">
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => !isEditor && handleMenuItemPress(item.action)}>
                {item.iconName && (
                  <Icon
                    name={item.iconName}
                    size={20}
                    color={item.iconColor || props.textColor || '#000000'}
                    style={styles.menuItemIcon}
                  />
                )}
                <Text style={dynamicStyles.menuItemText} numberOfLines={1}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
  },
  menuContainer: {
    position: 'fixed',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    shadowRadius: 5,
    shadowOffset: {width: 0, height: 2},
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  menuItemIcon: {
    marginRight: 10,
  },
  menuItemText: {
    fontSize: 16,
    flexShrink: 1,
  },
});

export default ContextMenu;
