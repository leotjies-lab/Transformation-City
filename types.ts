
export interface NavItem {
  label: string;
  href: string;
  subItems?: NavItem[];
}

export interface Ministry {
  title: string;
  description: string;
  icon: string;
}

export interface WeeklyActivity {
  day: string;
  time: string;
  title: string;
  description?: string;
  color?: string;
}
