# **App Name**: EnterpriseFlow

## Core Features:

- User Authentication: Secure user registration and login with JWT and refresh tokens, supporting roles like Super Admin, Admin, Developer, Tester, and Viewer.
- Project Management: Create and manage multiple projects with settings for key, description, lead, and permissions; supports software and business project types.
- Issue Tracking: Comprehensive issue management including issue types (Epic, Story, Task, Bug, Sub-task), fields (title, description, status, priority, assignee, reporter, labels, attachments, due date, story points), and issue linking.
- Workflow Customization: Define custom workflows per project with default statuses (Backlog, To Do, In Progress, Code Review, QA, Done) and drag-and-drop status changes.
- Agile Board Management: Creation, management, and automatic population of either Scrum or Kanban boards. Also includes sprint planning, and backlog management.
- Realtime Collaboration: Enables real-time collaboration through features like adding comments to the issues, sending notifications using the bell notification, and adding/mentioning a team mate.
- AI-Powered Summarization: AI tool to provide quick summaries of user stories, bug reports, or other long-form text. It generates a synopsis to quickly determine relevancy for the end-user.

## Style Guidelines:

- Primary color: Indigo (#4B0082) to convey trust and enterprise feel.
- Accent color: Teal (#008080) to highlight interactive elements.
- Background color: Light gray (#F0F0F0) for light mode and Dark charcoal (#333333) for dark mode.
- Body and headline font: 'Inter', a grotesque-style sans-serif, for a modern, objective, neutral look.
- Use Lucide or Hero icons for a consistent and modern look throughout the application.
- Clean and organized layout with a sidebar navigation, project switcher dropdown, and Kanban boards with drag-and-drop functionality.
- Implement smooth page transitions, hover animations, and drag-and-drop animations using Framer Motion and CSS transitions.