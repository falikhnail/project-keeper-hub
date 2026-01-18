export type ProjectStatus = 'active' | 'completed' | 'on-hold' | 'archived';

export interface ProjectHandler {
  name: string;
  email: string;
  avatar?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  link: string;
  status: ProjectStatus;
  lastHandler: ProjectHandler;
  updatedAt: Date;
  createdAt: Date;
  tags?: string[];
}
