import * as LucideIcons from 'lucide-react-native';

// Manual mapping for icons where names don't match directly or need specific conversion
const manualMap = {
  // Common Actions
  'add': 'Plus',
  'add_box': 'PlusSquare',
  'add_circle': 'PlusCircle',
  'add_circle_outline': 'PlusCircle',
  'create': 'Pencil',
  'edit': 'Pencil',
  'delete': 'Trash2',
  'delete_outline': 'Trash2',
  'delete_forever': 'Trash2',
  'remove': 'Minus',
  'remove_circle': 'MinusCircle',
  'remove_circle_outline': 'MinusCircle',
  'done': 'Check',
  'done_all': 'CheckCheck',
  'done_outline': 'CheckCircle',
  'close': 'X',
  'cancel': 'XCircle',
  'check_circle': 'CheckCircle',
  'check_box': 'CheckSquare',
  'check_box_outline_blank': 'Square',
  'indeterminate_check_box': 'MinusSquare',
  'logout': 'LogOut',
  'login': 'LogIn',
  
  // Navigation
  'arrow_back': 'ArrowLeft',
  'arrow_forward': 'ArrowRight',
  'arrow_upward': 'ArrowUp',
  'arrow_downward': 'ArrowDown',
  'arrow_drop_down': 'ChevronDown',
  'arrow_drop_up': 'ChevronUp',
  'arrow_drop_down_circle': 'ChevronDownCircle', // Check if exists
  'chevron_left': 'ChevronLeft',
  'chevron_right': 'ChevronRight',
  'expand_less': 'ChevronUp',
  'expand_more': 'ChevronDown',
  'menu': 'Menu',
  'menu_open': 'Menu',
  'more_vert': 'MoreVertical',
  'more_horiz': 'MoreHorizontal',
  'refresh': 'RefreshCw',
  'sync': 'RefreshCw',
  'autorenew': 'RotateCw',
  'home': 'Home',
  'apps': 'Grid',
  'arrow_back_ios': 'ChevronLeft',
  'arrow_forward_ios': 'ChevronRight',
  'fullscreen': 'Maximize',
  'fullscreen_exit': 'Minimize',
  
  // AV
  'play_arrow': 'Play',
  'play_circle_filled': 'PlayCircle',
  'play_circle_outline': 'PlayCircle',
  'pause': 'Pause',
  'pause_circle_filled': 'PauseCircle',
  'pause_circle_outline': 'PauseCircle',
  'stop': 'Square',
  'skip_next': 'SkipForward',
  'skip_previous': 'SkipBack',
  'fast_forward': 'FastForward',
  'fast_rewind': 'Rewind',
  'volume_up': 'Volume2',
  'volume_down': 'Volume1',
  'volume_mute': 'VolumeX',
  'volume_off': 'VolumeX',
  'mic': 'Mic',
  'mic_off': 'MicOff',
  'mic_none': 'Mic',
  'videocam': 'Video',
  'videocam_off': 'VideoOff',
  'library_music': 'Music',
  'music_note': 'Music',
  'movie': 'Film',
  
  // Device
  'access_alarm': 'AlarmClock',
  'access_time': 'Clock',
  'battery_full': 'BatteryFull',
  'battery_std': 'BatteryMedium',
  'battery_alert': 'BatteryWarning',
  'bluetooth': 'Bluetooth',
  'bluetooth_connected': 'BluetoothConnected',
  'bluetooth_disabled': 'BluetoothOff',
  'camera_alt': 'Camera',
  'signal_wifi_4_bar': 'Wifi',
  'signal_wifi_off': 'WifiOff',
  'storage': 'Database',
  'widgets': 'LayoutGrid',
  'gps_fixed': 'Crosshair',
  'gps_not_fixed': 'Crosshair',
  'gps_off': 'Crosshair', // Approximate
  
  // Communication
  'email': 'Mail',
  'mail': 'Mail',
  'mail_outline': 'Mail',
  'call': 'Phone',
  'phone': 'Phone',
  'phone_in_talk': 'PhoneCall',
  'phone_missed': 'PhoneMissed',
  'chat': 'MessageCircle',
  'chat_bubble': 'MessageCircle',
  'chat_bubble_outline': 'MessageCircle',
  'message': 'MessageSquare',
  'rss_feed': 'Rss',
  'import_contacts': 'Book',
  'contact_mail': 'Contact',
  
  // File
  'attachment': 'Paperclip',
  'attach_file': 'Paperclip',
  'cloud': 'Cloud',
  'cloud_download': 'CloudDownload',
  'cloud_upload': 'CloudUpload',
  'cloud_off': 'CloudOff',
  'folder': 'Folder',
  'folder_open': 'FolderOpen',
  'folder_shared': 'FolderInput', // Approximate
  'create_new_folder': 'FolderPlus',
  'file_download': 'Download',
  'file_upload': 'Upload',
  
  // Hardware
  'keyboard_arrow_down': 'ChevronDown',
  'keyboard_arrow_left': 'ChevronLeft',
  'keyboard_arrow_right': 'ChevronRight',
  'keyboard_arrow_up': 'ChevronUp',
  'keyboard_backspace': 'Delete',
  'mouse': 'Mouse',
  'desktop_mac': 'Monitor',
  'desktop_windows': 'Monitor',
  'laptop': 'Laptop',
  'laptop_chromebook': 'Laptop',
  'laptop_mac': 'Laptop',
  'smartphone': 'Smartphone',
  'tablet': 'Tablet',
  'tablet_android': 'Tablet',
  'tablet_mac': 'Tablet',
  'watch': 'Watch',
  
  // Image
  'image': 'Image',
  'photo': 'Image',
  'photo_camera': 'Camera',
  'camera': 'Camera',
  'slideshow': 'Presentation',
  'tune': 'Sliders',
  'palette': 'Palette',
  'remove_red_eye': 'Eye',
  'crop': 'Crop',
  'crop_free': 'Crop',
  'crop_original': 'Image',
  
  // Maps
  'place': 'MapPin',
  'location_on': 'MapPin',
  'location_off': 'MapPinOff',
  'map': 'Map',
  'my_location': 'Crosshair',
  'navigation': 'Navigation',
  'person_pin': 'User',
  'directions': 'Signpost', // Approximate
  'local_shipping': 'Truck',
  'flight': 'Plane',
  
  // Social
  'person': 'User',
  'person_add': 'UserPlus',
  'person_outline': 'User',
  'group': 'Users',
  'group_add': 'UserPlus',
  'people': 'Users',
  'people_outline': 'Users',
  'notifications': 'Bell',
  'notifications_none': 'Bell',
  'notifications_off': 'BellOff',
  'notifications_active': 'BellRing',
  'share': 'Share2',
  'thumb_up': 'ThumbsUp',
  'thumb_down': 'ThumbsDown',
  'public': 'Globe',
  'school': 'GraduationCap',
  'cake': 'Cake',
  'mood': 'Smile',
  'mood_bad': 'Frown',
  
  // Toggle
  'check_box': 'CheckSquare',
  'radio_button_checked': 'Disc',
  'radio_button_unchecked': 'Circle',
  'star': 'Star',
  'star_border': 'Star',
  'star_half': 'StarHalf',
  
  // Editor
  'format_bold': 'Bold',
  'format_italic': 'Italic',
  'format_underlined': 'Underline',
  'format_align_left': 'AlignLeft',
  'format_align_center': 'AlignCenter',
  'format_align_right': 'AlignRight',
  'format_align_justify': 'AlignJustify',
  'format_list_bulleted': 'List',
  'format_list_numbered': 'ListOrdered',
  'insert_link': 'Link',
  'mode_edit': 'Pencil',
  'title': 'Heading',
  'short_text': 'AlignLeft',
  
  // Other
  'search': 'Search',
  'settings': 'Settings',
  'info': 'Info',
  'info_outline': 'Info',
  'help': 'HelpCircle',
  'help_outline': 'HelpCircle',
  'warning': 'AlertTriangle',
  'error': 'AlertCircle',
  'error_outline': 'AlertCircle',
  'lock': 'Lock',
  'lock_open': 'Unlock',
  'lock_outline': 'Lock',
  'visibility': 'Eye',
  'visibility_off': 'EyeOff',
  'favorite': 'Heart',
  'favorite_border': 'Heart',
  'shopping_cart': 'ShoppingCart',
  'add_shopping_cart': 'ShoppingCart', // Approximate
  'shopping_basket': 'ShoppingBag',
  'credit_card': 'CreditCard',
  'account_circle': 'UserCircle',
  'account_box': 'UserSquare',
  'dashboard': 'LayoutDashboard',
  'exit_to_app': 'LogOut',
  'launch': 'ExternalLink',
  'power_settings_new': 'Power',
  'print': 'Printer',
  'save': 'Save',
  'zoom_in': 'ZoomIn',
  'zoom_out': 'ZoomOut',
  'view_list': 'List',
  'view_module': 'Grid',
  'view_comfy': 'LayoutGrid',
  'view_quilt': 'LayoutTemplate',
  'aspect_ratio': 'Monitor',
  'dns': 'Server',
  'timeline': 'Activity',
  'update': 'History',
  'watch_later': 'Clock',
  'verified_user': 'ShieldCheck',
  'fingerprint': 'Fingerprint',
  'lightbulb_outline': 'Lightbulb',
  'code': 'Code',
  'bug_report': 'Bug',
  'build': 'Wrench',
  'cached': 'RefreshCw',
  'extension': 'Puzzle',
  'face': 'Smile',
  'g_translate': 'Languages',
  'grade': 'Star',
  'history': 'History',
  'label': 'Tag',
  'language': 'Globe',
  'loyalty': 'Tag',
  'query_builder': 'Clock',
  'question_answer': 'MessageSquare',
  'receipt': 'Receipt',
  'room': 'MapPin',
  'subject': 'AlignLeft',
  'tab': 'AppWindow',
  'work': 'Briefcase',
  'filter_list': 'Filter',
  'sort': 'ArrowUpDown', // Approximate
  'sort_by_alpha': 'ArrowDownAZ',
  'today': 'Calendar',
  'calendar_today': 'Calendar',
  'date_range': 'CalendarRange',
  'event': 'CalendarEvent',
};

const toPascalCase = (str) => {
  return str
    .replace(/(\w)(\w*)/g,
      function(g0,g1,g2){return g1.toUpperCase() + g2.toLowerCase();})
    .replace(/_/g, '');
};

export const getLucideIcon = (materialName) => {
  if (!materialName) return LucideIcons.HelpCircle;
  
  // Normalize: lowercase and replace hyphens with underscores
  const normalizedName = materialName.toLowerCase().replace(/-/g, '_');
  
  // 1. Check manual map
  if (manualMap[normalizedName]) {
    const lucideName = manualMap[normalizedName];
    if (LucideIcons[lucideName]) {
      return LucideIcons[lucideName];
    }
  }
  
  // 2. Try PascalCase conversion
  const pascalName = toPascalCase(normalizedName);
  if (LucideIcons[pascalName]) {
    return LucideIcons[pascalName];
  }
  
  // 3. Try removing suffixes
  const suffixes = ['_outline', '_filled', '_sharp', '_rounded', '_two_tone'];
  for (const suffix of suffixes) {
    if (normalizedName.endsWith(suffix)) {
      const baseName = normalizedName.replace(suffix, '');
      
      // Check manual map for base name
      if (manualMap[baseName]) {
        const lucideName = manualMap[baseName];
        if (LucideIcons[lucideName]) {
          return LucideIcons[lucideName];
        }
      }
      
      // Check PascalCase for base name
      const pascalBase = toPascalCase(baseName);
      if (LucideIcons[pascalBase]) {
        return LucideIcons[pascalBase];
      }
    }
  }

  // 4. Fallback
  return LucideIcons.HelpCircle; 
};
