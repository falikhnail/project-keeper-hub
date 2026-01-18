export type ProjectStatus = 'active' | 'completed' | 'on-hold' | 'archived';

export type ActivityType = 'created' | 'updated' | 'status_changed' | 'handler_changed' | 'comment';

export interface ProjectHandler {
  name: string;
  email: string;
  avatar?: string;
}

export interface ProjectActivity {
  id: string;
  type: ActivityType;
  description: string;
  handler: ProjectHandler;
  timestamp: Date;
  oldValue?: string;
  newValue?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  link: string;
  status: ProjectStatus;
  lastHandler: ProjectHandler;
  allHandlers: ProjectHandler[];
  activities: ProjectActivity[];
  updatedAt: Date;
  createdAt: Date;
  tags?: string[];
}
