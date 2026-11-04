[FORMAT REQUIREMENT — READ CAREFULLY]
You MUST wrap ALL JSON tool call arrays in a  code block. This is critical: the automation harness parses your response by looking for code blocks first. Raw JSON outside a code block will NOT be detected.
CORRECT format:

[{"tool": "write_file", "path": "/abs/path", "content": "file content here"}]

IMPORTANT: When the file content contains double-quote characters ("), you MUST escape them as \" inside the JSON string. For example, XML like: <tag attr="value"> must be written as: <tag attr=\"value\"> in the JSON content field.


You are the HEY Agency Specialist.
YOUR SKILL LIBRARY:

PREVIOUSLY SUCCESSFUL PATTERN:

You are the HEY Agency Specialist.
YOUR SKILL LIBRARY:

PREVIOUSLY SUCCESSFUL PATTERN:

You are the HEY Agency Specialist.
YOUR SKILL LIBRARY:

PREVIOUSLY SUCCESSFUL PATTERN:

You are the HEY Agency Specialist.
YOUR SKILL LIBRARY:

PREVIOUSLY SUCCESSFUL PATTERN:

You are the HEY Agency Specialist.
YOUR SKILL LIBRARY:

PREVIOUSLY SUCCESSFUL PATTERN:

You are the HEY Agency Specialist.
YOUR SKILL LIBRARY:

PREVIOUSLY SUCCESSFUL PATTERN:

You are the HEY Agency Specialist.
YOUR SKILL LIBRARY:

PRE

FILE TO UPGRADE: src\components\ui\index.js
CURRENT CODE:
// HEY V1 Design System - Component Exports

// Core Components
export { Button, IconButton, SplitButton } from './Button';
export { Card, GlassCard, RaisedCard } from './Card';
export { TextInput, Textarea, PromptInput } from './Input';
export { Select } from './Select';
export { Toggle, Checkbox, Radio, RadioGroup } from './Toggle';
export { Modal, AlertModal, ConfirmModal } from './Modal';
export { Drawer } from './Drawer';
export { Toast, ToastProvider, useToast } from './Toast';
export { Tooltip } from './Tooltip';
export { ProgressBar, CircularProgress, StepProgress } from './ProgressBar';
export { Skeleton, SkeletonCard, SkeletonChat } from './Skeleton';
export { Avatar, AvatarGroup } from './Avatar';
export { Badge, Chip } from './Badge';
export { StatusDot, StatusBadge } from './StatusDot';
export { EmptyState, EmptyStatePage } from './EmptyState';
export { ErrorState, ErrorStatePage, InlineError } from './ErrorState';
export { Tabs } from './Tabs';
export { Table, TableColumn } from './Table';
export { Slider, RangeSlider } from './Slider';
export { SplitPane, ResizablePane } from './SplitPane';
export { ContextMenu } from './ContextMenu';
export { Popover } from './Popover';
export { Breadcrumb } from './Breadcrumb';
export { Timeline } from './Timeline';
export { FileTree } from './FileTree';
export { ArtifactCard, ArtifactCardList } from './ArtifactCard';
export { MissionCard, MissionCardList } from './MissionCard';
export { DeviceCard } from './DeviceCard';
export { AgentCard } from './AgentCard';
export { ProviderCard } from './ProviderCard';

// Motion Components
export { MotionButton } from './MotionButton';
export { MotionCard } from './MotionCard';
export { MotionModal } from './MotionModal';
export { MotionDrawer } from './MotionDrawer';
export { MotionPopover } from './MotionPopover';
export { MotionTooltip } from './MotionTooltip';
export { MotionSidebar } from './MotionSidebar';
export { MotionDynamicIsland } from './MotionDynamicIsland';
export { MotionLive } from './MotionLive';
export { MotionWidget } from './MotionWidget';
export { MotionContextMenu } from './MotionContextMenu';
export { MotionTutorial } from './MotionTutorial';
export { MotionVoiceVisualizer } from './MotionVoiceVisualizer';
export { PageTransition } from './PageTransition';
export { PerformanceTierProvider } from './PerformanceTierProvider';
export { Pressable } from './Pressable';
export { PullToRefresh } from './PullToRefresh';
export { StateViews } from './StateViews';

// Layout Components
export { AppLayout } from '../layout/AppLayout';
export { PublicLayout } from '../layout/PublicLayout';
export { Container } from '../layout/Container';
export { DashboardGrid } from '../layout/DashboardGrid';
export { DynamicIsland } from '../layout/DynamicIsland';
export { PageHeader } from '../layout/PageHeader';
export { PublicFooter } from '../layout/PublicFooter';

// Chat Components
export { ChatPage } from '../ChatPage';
export { ChatFeed } from '../chat/ChatFeed';
export { ChatInput } from '../chat/ChatInput';
export { ChatMessage } from '../chat/ChatMessage';

// Feature Components
export { CommandPalette } from '../CommandPalette';
export { TutorialOverlay } from '../tutorials/TutorialOverlay';
export { ConnectionNotice } from '../ConnectionNotice';
export { IdleScreensaver } from '../IdleScreensaver';
export { BlockBackground } from '../BlockBackground';
export { ScrollReveal } from '../ScrollReveal';

// App Pages
export { Home } from '../pages/Home';
export { Features } from '../pages/Features';
export { Customization } from '../pages/Customization';
export { Pricing } from '../pages/Pricing';
export { Live } from '../pages/Live';
export { Create } from '../pages/Create';
export { Download } from '../pages/Download';
export { StudioPage } from '../StudioPage';
export { Dashboard } from '../Dashboard';
export { CosmosPage } from '../CosmosPage';
export { ForgePage } from '../ForgePage';
export { MemoryPage } from '../MemoryPage';
export { CalendarPage } from '../CalendarPage';
export { DeenPage } from '../pages/DeenPage';
export { TasksPage } from '../TasksPage';
export { LearnPage } from '../LearnPage';
export { AgentsPage } from '../AgentsPage';
export { AnalyticsPage } from '../AnalyticsPage';
export { FinancePage } from '../FinancePage';
export { GoalsPage } from '../GoalsPage';
export { HabitsPage } from '../HabitsPage';
export { HealthPage } from '../HealthPage';
export { JournalPage } from '../JournalPage';
export { NotesPage } from '../NotesPage';
export { ProjectsPage } from '../ProjectsPage';
export { MorningMode } from '../MorningMode';
export { CrisisMode } from '../CrisisMode';
export { ModesPage } from '../pages/ModesPage';
export { SettingsPage } from '../SettingsPage';
export { PermissionsPage } from '../PermissionsPage';
export { CapabilitiesPage } from '../CapabilitiesPage';
export { DeviceCenterPage } from '../DeviceCenterPage';
export { DebugPage } from '../DebugPage';
export { NotFound } f
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.