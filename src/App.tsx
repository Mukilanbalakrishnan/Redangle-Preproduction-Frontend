import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'

import CRMLayout from './pages/crm/CRMLayout'
import Dashboard from './pages/crm/pages/Dashboard'
import Client from './pages/crm/pages/Client'
import Attendance from './pages/crm/pages/Attendance'
import WorkTracking from './pages/crm/pages/WorkTracking'
import ClientDelivery from './pages/crm/pages/ClientDelivery'
import RawData from './pages/crm/pages/RawData'
import CrmNotifications from './pages/crm/pages/Notifications'

import EventCoordinatorLayout from './pages/event-coordinator/EventCoordinatorLayout'
import EventCoordinatorDashboard from './pages/event-coordinator/pages/Dashboard'
import EventCoordinatorClient from './pages/event-coordinator/pages/Client'
import EventCoordinatorAttendance from './pages/event-coordinator/pages/Attendance'
import EventCoordinatorWorkTracking from './pages/event-coordinator/pages/WorkTracking'
import EventCoordinatorFinalApproval from './pages/event-coordinator/pages/FinalApproval'
import EventCoordinatorClientDelivery from './pages/event-coordinator/pages/ClientDelivery'
import EventCoordinatorLeaveManagement from './pages/event-coordinator/pages/LeaveManagement'
import EventCoordinatorLeaveRequest from './pages/event-coordinator/pages/LeaveRequest'
import EventCoordinatorMyAttendance from './pages/event-coordinator/pages/MyAttendance'
import EventCoordinatorNotifications from './pages/event-coordinator/pages/Notifications'

import MediaLayout from './pages/media/MediaLayout'
import MediaDashboard from './pages/media/pages/Dashboard'
import MediaAssignedClient from './pages/media/pages/AssignedClient'
import MediaShootSchedule from './pages/media/pages/ShootSchedule'
import MediaMyWork from './pages/media/pages/MyWork'
import MediaMyWorkDetails from './pages/media/pages/MyWorkDetails'
import MediaUploadFiles from './pages/media/pages/UploadFiles'
import MediaAttendance from './pages/media/pages/Attendance'
import MediaLeaveRequest from './pages/media/pages/LeaveRequest'
import MediaNotifications from './pages/media/pages/Notifications'

import DataManagerLayout from './pages/data-manager/DataManagerLayout'
import DataManagerDashboard from './pages/data-manager/pages/Dashboard'
import IncomingData from './pages/data-manager/pages/IncomingData'
import Verification from './pages/data-manager/pages/Verification'
import Pixoffice from './pages/data-manager/pages/Pixoffice'
import Pixstudio from './pages/data-manager/pages/Pixstudio'
import Notification from './pages/data-manager/pages/Notification'
import DataManagerAttendance from './pages/data-manager/pages/Attendance'
import DataManagerLeaveRequest from './pages/data-manager/pages/LeaveRequest'

import EmployeeLayout from './pages/employee/EmployeeLayout'
import EmployeeDashboard from './pages/employee/pages/Dashboard'
import EmployeeAssignedProjects from './pages/employee/pages/AssignedProjects'
import EmployeeMyWork from './pages/employee/pages/MyWork'
import EmployeeRoleSpecificPage from './pages/employee/pages/RoleSpecificPage'
import EmployeeReworkRequest from './pages/employee/pages/ReworkRequest'
import EmployeeAttendance from './pages/employee/pages/Attendance'
import EmployeeLeaveRequest from './pages/employee/pages/LeaveRequest'
import EmployeeDesignPreview from './pages/employee/pages/DesignPreview'
import EmployeeNotifications from './pages/employee/pages/Notifications'

import AdminLayout from './pages/admin/components/AdminLayout'
import AdminDashboard from './pages/admin/pages/Dashboard'
import AdminClient from './pages/admin/pages/Client'
import AdminEmployee from './pages/admin/pages/Employee'
import AdminAssignClient from './pages/admin/pages/AssignClient'
import AdminAttendance from './pages/admin/pages/Attendance'
import AdminTracking from './pages/admin/pages/Tracking'
import AdminMyAttendance from './pages/admin/pages/MyAttendance'
import AdminLeaveApproval from './pages/admin/pages/LeaveApproval'
import AdminReports from './pages/admin/pages/Reports'
import AdminNotifications from './pages/admin/pages/Notifications'
import AdminRawData from './pages/admin/pages/RawData'
import AdminEditApproval from './pages/admin/pages/EditApproval'
import AdminEditApprovalDetail from './pages/admin/pages/EditApprovalDetail'
import AdminEditApprovalViewWrapper from './pages/admin/pages/EditApprovalViewWrapper'
import AdminClientApproval from './pages/admin/pages/ClientApproval'
import AdminClientApprovalDetail from './pages/admin/pages/ClientApprovalDetail'
import AdminQCCheck from './pages/admin/pages/QCCheck'
import CrmQCCheck from './pages/crm/pages/QCCheck'

import MasterAdminLayout from './pages/master-admin/MasterAdminLayout'
import MasterAdminDashboard from './pages/master-admin/pages/Dashboard'
import MasterAdminClients from './pages/master-admin/pages/Clients'
import MasterAdminClientDetail from './pages/master-admin/pages/ClientDetail'
import MasterAdminEmployees from './pages/master-admin/pages/Employees'
import MasterAdminWorkTracker from './pages/master-admin/pages/WorkTracker'
import MasterAdminInvoices from './pages/master-admin/pages/Invoices'
import MasterAdminAttendance from './pages/master-admin/pages/Attendance'
import MasterAdminReports from './pages/master-admin/pages/Reports'

import OperationalManagerLayout from './pages/operational-manager/OperationalManagerLayout'
import OperationalManagerDashboard from './pages/operational-manager/pages/Dashboard'
import OperationalManagerAssignedProjects from './pages/operational-manager/pages/AssignedProjects'
import OperationalManagerWorkStatus from './pages/operational-manager/pages/WorkStatus'

import ClientLayout from './pages/client/ClientLayout'
import ClientDashboard from './pages/client/pages/Dashboard'
import Tracker from './pages/client/pages/Tracker'
import Preproduction from './pages/client/pages/Preproduction'
import Postproduction from './pages/client/pages/Postproduction'
import Delivery from './pages/client/pages/Delivery'
import EventDetails from './pages/client/pages/EventDetails'
import Quotation from './pages/client/pages/Quotation'
import Invoice from './pages/client/pages/Invoice'
import ClientNotifications from './pages/client/pages/Notifications'

import AssignEditor from './ClientFlow/AssignEditor'
import AssignEditingTeamPage from './ClientFlow/AssignEditingTeamPage'
import UnifiedDashboard from './pages/dashboard/UnifiedDashboard'

import MultiRoleLayout from './pages/multi-role/MultiRoleLayout'
import MultiRoleDashboard from './pages/multi-role/pages/MultiRoleDashboard'
import PhotographerAssignedClient from './pages/multi-role/pages/photographer/AssignedClient'
import PhotographerEventSchedule from './pages/multi-role/pages/photographer/EventSchedule'
import PhotographerWorks from './pages/multi-role/pages/photographer/Works'


import VideographerAssignedClient from './pages/multi-role/pages/videographer/AssignedClient'
import VideographerEventSchedule from './pages/multi-role/pages/videographer/EventSchedule'
import VideographerWorks from './pages/multi-role/pages/videographer/Works'
import DroneAssignedClient from './pages/multi-role/pages/drone/AssignedClient'
import DroneEventSchedule from './pages/multi-role/pages/drone/EventSchedule'
import DroneWorks from './pages/multi-role/pages/drone/Works'
import MRSaveTheDate from './pages/multi-role/pages/employee/SaveTheDate'
import MRSaveTheVideo from './pages/multi-role/pages/employee/SaveTheVideo'
import MRRetouch from './pages/multi-role/pages/employee/Retouch'
import MRTraditionalVideo from './pages/multi-role/pages/employee/TraditionalVideo'
import MRTraditionalVideoWorks from './pages/multi-role/pages/employee/TraditionalVideoWorks'
import MRTraditionalPhoto from './pages/multi-role/pages/employee/TraditionalPhoto'
import MRTraditionalPhotoWorks from './pages/multi-role/pages/employee/TraditionalPhotoWorks'
import MRAlbumDesign from './pages/multi-role/pages/employee/AlbumDesign'
import MRAlbumDesignWorks from './pages/multi-role/pages/employee/AlbumDesignWorks'
import MRCandidVideo from './pages/multi-role/pages/employee/CandidVideo'
import MRCandidVideoWorks from './pages/multi-role/pages/employee/CandidVideoWorks'
import MRClients from './pages/multi-role/pages/Clients'
import TimeTracker from './pages/multi-role/pages/TimeTracker'

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/event-crm/*" element={<Navigate to="/post-production-crm/event-raw-data" replace />} />

        {/* --- Unified Dashboard for multi-role users --- */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<UnifiedDashboard />} />
        </Route>

        {/* --- Multi-Role Dashboard --- */}
        <Route element={<ProtectedRoute />}>
          <Route path="/multi-role" element={<MultiRoleLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<MultiRoleDashboard />} />
            <Route path="clients" element={<MRClients />} />
            <Route path="time-tracker" element={<TimeTracker />} />
            {/* Photographer */}
            <Route path="photographer/assigned-client" element={<PhotographerAssignedClient />} />
            <Route path="photographer/event-schedule" element={<PhotographerEventSchedule />} />
            <Route path="photographer/works" element={<PhotographerWorks />} />
            {/* Videographer */}
            <Route path="videographer/assigned-client" element={<VideographerAssignedClient />} />
            <Route path="videographer/event-schedule" element={<VideographerEventSchedule />} />
            <Route path="videographer/works" element={<VideographerWorks />} />
            {/* Drone */}
            <Route path="drone/assigned-client" element={<DroneAssignedClient />} />
            <Route path="drone/event-schedule" element={<DroneEventSchedule />} />
            <Route path="drone/works" element={<DroneWorks />} />
            <Route path="drone/my-work" element={<Navigate to="/multi-role/drone/works" replace />} />
            <Route path="drone/my-work-details" element={<Navigate to="/multi-role/drone/works" replace />} />
            <Route path="drone/upload-files" element={<Navigate to="/multi-role/drone/assigned-client" replace />} />
            {/* Traditional Video Editor */}
            <Route path="traditional-video/assigned-client" element={<MRTraditionalVideo />} />
            <Route path="traditional-video/works" element={<MRTraditionalVideoWorks />} />
            {/* Retouch Editor */}
            <Route path="traditional-photo/assigned-client" element={<MRTraditionalPhoto />} />
            <Route path="traditional-photo/works" element={<MRTraditionalPhotoWorks />} />
            {/* Album Designer */}
            <Route path="album-design/assigned-client" element={<MRAlbumDesign />} />
            <Route path="album-design/works" element={<MRAlbumDesignWorks />} />
            {/* Candid Video Editor */}
            <Route path="candid-video/assigned-client" element={<MRCandidVideo />} />
            <Route path="candid-video/works" element={<MRCandidVideoWorks />} />
            {/* Employee */}
            <Route path="employee/save-the-date" element={<MRSaveTheDate />} />
            <Route path="employee/save-the-video" element={<MRSaveTheVideo />} />
            <Route path="employee/retouch" element={<MRRetouch />} />
            <Route path="employee/traditional-video" element={<Navigate to="/multi-role/traditional-video/assigned-client" replace />} />
            <Route path="employee/traditional-photo" element={<Navigate to="/multi-role/traditional-photo/assigned-client" replace />} />
            <Route path="employee/album-design" element={<Navigate to="/multi-role/album-design/assigned-client" replace />} />
            <Route path="employee/candid-video" element={<Navigate to="/multi-role/candid-video/assigned-client" replace />} />
            {/* Common pages */}
            <Route path="attendance" element={<MediaAttendance />} />
            <Route path="leave-request" element={<MediaLeaveRequest />} />
            <Route path="notifications" element={<MediaNotifications />} />
          </Route>
        </Route>

        {/* --- Protected Application Routes --- */}
        <Route element={<ProtectedRoute allowedRoles={['crm']} />}>
          <Route path="/crm" element={<CRMLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="my-attendance" element={<Navigate to="/crm/attendance?tab=my-attendance" replace />} />
            <Route path="leave-request" element={<Navigate to="/crm/attendance?tab=leave-request" replace />} />
            <Route path="leave-management" element={<Navigate to="/crm/attendance?tab=leave-management" replace />} />
            <Route path="work-tracking" element={<WorkTracking />} />
            <Route path="client-delivery" element={<ClientDelivery />} />

            {/* Pre-production workflow */}
            <Route
              path="pre-production/client"
              element={
                <Client
                  workflowPhase="pre_production"
                  title="Pre-production Clients"
                  description="Clients currently in the pre-production stage"
                />
              }
            />
            <Route
              path="pre-production/raw-data"
              element={
                <RawData
                  workflowPhase="pre_production"
                  title="Pre-production Raw Data"
                  description="Phase 1 shoot uploads awaiting CRM verification"
                />
              }
            />
            <Route
              path="pre-production/qc-check"
              element={
                <CrmQCCheck
                  workflowPhase="pre_production"
                  title="Pre-production QC Checking"
                  description="Approve Phase 1 and Phase 2 pre-production submissions"
                />
              }
            />

            {/* Post-production workflow */}
            <Route
              path="post-production/qc-check"
              element={
                <CrmQCCheck
                  workflowPhase="post_production"
                  title="Post-production QC Checking"
                  description="Approve data coming from the post-production stage"
                />
              }
            />

            {/* Event workflow */}
            <Route
              path="event/raw-data"
              element={
                <RawData
                  workflowPhase="event"
                  title="Event Raw Data"
                  description="Approval requests from the Event stage only"
                />
              }
            />
            <Route
              path="event/qc-check"
              element={
                <CrmQCCheck
                  workflowPhase="event"
                  title="Event QC Checking"
                  description="Approve data coming from the Event stage only"
                />
              }
            />

            {/* Global Client page — all leads, used for the assign client flow regardless of phase */}
            <Route path="client" element={<Client />} />

            {/* Backwards-compatible redirects */}
            <Route path="raw-data" element={<Navigate to="/crm/pre-production/raw-data" replace />} />
            <Route path="qc-check" element={<Navigate to="/crm/pre-production/qc-check" replace />} />
            <Route path="final-approval" element={<Navigate to="/crm/pre-production/raw-data" replace />} />
            <Route path="reports" element={<Navigate to="/crm/pre-production/raw-data" replace />} />
            <Route path="edit-approval/*" element={<Navigate to="/crm/pre-production/qc-check" replace />} />
            <Route path="client-approval/*" element={<Navigate to="/crm/pre-production/qc-check" replace />} />

            <Route path="assign-editor" element={<AssignEditor />} />
            <Route path="notifications" element={<CrmNotifications />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['pre-production-crm']} />}>
          <Route path="/pre-production-crm" element={<CRMLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="work-tracking" element={<WorkTracking />} />
            <Route
              path="client"
              element={
                <Client
                  workflowPhase="pre_production"
                  title="Pre-production Clients"
                  description="Approve and assign clients in the pre-production stage"
                />
              }
            />
            <Route
              path="raw-data"
              element={
                <RawData
                  workflowPhase="pre_production"
                  title="Pre-production Raw Data"
                  description="Phase 1 shoot uploads awaiting pre-production CRM verification"
                />
              }
            />
            <Route
              path="event-raw-data"
              element={
                <RawData
                  workflowPhase="event"
                  title="Event Raw Data"
                  description="Event stage uploads awaiting Post-production CRM approval"
                />
              }
            />
            <Route
              path="qc-check"
              element={
                <CrmQCCheck
                  workflowPhase="pre_production"
                  title="Pre-production QC Checking"
                  description="Approve Phase 1 and Phase 2 pre-production submissions"
                />
              }
            />
            <Route path="attendance" element={<Attendance />} />
            <Route path="my-attendance" element={<Navigate to="/pre-production-crm/attendance?tab=my-attendance" replace />} />
            <Route path="leave-request" element={<Navigate to="/pre-production-crm/attendance?tab=leave-request" replace />} />
            <Route path="leave-management" element={<Navigate to="/pre-production-crm/attendance?tab=leave-management" replace />} />
            <Route path="assign-editor" element={<AssignEditor />} />
            <Route path="assign-team" element={<AssignEditingTeamPage />} />
            <Route path="notifications" element={<CrmNotifications />} />
            <Route path="*" element={<Navigate to="/pre-production-crm/dashboard" replace />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['post-production-crm']} />}>
          <Route path="/post-production-crm" element={<CRMLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="work-tracking" element={<WorkTracking />} />
            <Route path="client" element={<OperationalManagerAssignedProjects />} />
            <Route
              path="event-raw-data"
              element={
                <RawData
                  workflowPhase="event"
                  title="Event Raw Data"
                  description="Event stage uploads awaiting Post-production CRM approval"
                />
              }
            />
            <Route
              path="qc-check"
              element={
                <CrmQCCheck
                  workflowPhase="post_production"
                  title="Post-production QC Checking"
                  description="Approve data coming from the post-production stage"
                />
              }
            />
            <Route path="attendance" element={<Attendance />} />
            <Route path="my-attendance" element={<Navigate to="/post-production-crm/attendance?tab=my-attendance" replace />} />
            <Route path="leave-request" element={<Navigate to="/post-production-crm/attendance?tab=leave-request" replace />} />
            <Route path="leave-management" element={<Navigate to="/post-production-crm/attendance?tab=leave-management" replace />} />
            <Route path="assign-editor" element={<AssignEditor />} />
            <Route path="assign-team" element={<AssignEditingTeamPage />} />
            <Route path="notifications" element={<CrmNotifications />} />
            <Route path="*" element={<Navigate to="/post-production-crm/dashboard" replace />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['event-coordinator']} />}>
          <Route path="/event-coordinator" element={<EventCoordinatorLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<EventCoordinatorDashboard />} />
            <Route path="client" element={<EventCoordinatorClient />} />
            <Route path="attendance" element={<EventCoordinatorAttendance />} />
            <Route path="my-attendance" element={<EventCoordinatorMyAttendance />} />
            <Route path="work-tracking" element={<EventCoordinatorWorkTracking />} />
            <Route path="final-approval" element={<EventCoordinatorFinalApproval />} />
            <Route path="client-delivery" element={<EventCoordinatorClientDelivery />} />
            <Route path="reports" element={<Navigate to="/event-coordinator/work-tracking" replace />} />
            <Route path="leave-request" element={<EventCoordinatorLeaveRequest />} />
            <Route path="leave-management" element={<EventCoordinatorLeaveManagement />} />
            <Route path="raw-data" element={<Navigate to="/event-coordinator/work-tracking" replace />} />
            <Route path="qc-check" element={<Navigate to="/event-coordinator/work-tracking" replace />} />
            <Route path="edit-approval/*" element={<Navigate to="/event-coordinator/work-tracking" replace />} />
            <Route path="client-approval/*" element={<Navigate to="/event-coordinator/work-tracking" replace />} />
            <Route path="assign-editor" element={<Navigate to="/event-coordinator/work-tracking" replace />} />
            <Route path="notifications" element={<EventCoordinatorNotifications />} />
          </Route>
        </Route>

        {/* Unified Media Worker (Photographer + Videographer + Drone) */}
        <Route element={<ProtectedRoute allowedRoles={['photographer', 'videographer', 'drone']} />}>
          <Route path="/media" element={<MediaLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<MediaDashboard />} />
            <Route path="assigned-client" element={<MediaAssignedClient />} />
            <Route path="event-schedule" element={<MediaShootSchedule />} />
            <Route path="my-work" element={<MediaMyWork />} />
            <Route path="my-work-details" element={<MediaMyWorkDetails />} />
            <Route path="upload-files" element={<MediaUploadFiles />} />
            <Route path="attendance" element={<MediaAttendance />} />
            <Route path="leave-request" element={<MediaLeaveRequest />} />
            <Route path="notifications" element={<MediaNotifications />} />
          </Route>
          {/* Backwards-compat redirects */}
          <Route path="/photographer/*" element={<Navigate to="/media/dashboard" replace />} />
          <Route path="/videographer/*" element={<Navigate to="/media/dashboard" replace />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['data-manager']} />}>
          <Route path="/data-manager" element={<DataManagerLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DataManagerDashboard />} />
            <Route path="pre-production/incoming-data" element={<IncomingData />} />
            <Route path="pre-production/verification" element={<Verification />} />
            <Route path="pre-production/pixoffice" element={<Navigate to="/data-manager/pre-production/verification" replace />} />
            <Route path="pre-production/pixstudio" element={<Navigate to="/data-manager/pre-production/verification" replace />} />
            <Route path="event/incoming-data" element={<IncomingData />} />
            <Route path="event/verification" element={<Verification />} />
            <Route path="event/pixoffice" element={<Pixoffice />} />
            <Route path="event/pixstudio" element={<Pixstudio />} />
            <Route path="notification" element={<Notification />} />
            <Route path="attendance" element={<DataManagerAttendance />} />
            <Route path="leave-request" element={<DataManagerLeaveRequest />} />
            <Route path="incoming-data" element={<Navigate to="/data-manager/pre-production/incoming-data" replace />} />
            <Route path="verification" element={<Navigate to="/data-manager/pre-production/verification" replace />} />
            <Route path="pixoffice" element={<Navigate to="/data-manager/event/pixoffice" replace />} />
            <Route path="pixstudio" element={<Navigate to="/data-manager/event/pixstudio" replace />} />
            <Route path="data-upload" element={<Navigate to="/data-manager/pre-production/incoming-data" replace />} />
            <Route path="receive-footage" element={<Navigate to="/data-manager/pre-production/incoming-data" replace />} />
            <Route path="qc-validation" element={<Navigate to="/data-manager/pre-production/verification" replace />} />
            <Route path="server-storage" element={<Navigate to="/data-manager/pre-production/incoming-data" replace />} />
            <Route path="client-delivery" element={<Navigate to="/data-manager/event/pixoffice" replace />} />
            <Route path="link-sharing" element={<Navigate to="/data-manager/event/pixoffice" replace />} />
            <Route path="team-sharing" element={<Navigate to="/data-manager/event/pixoffice" replace />} />
            <Route path="process-status" element={<Navigate to="/data-manager/dashboard" replace />} />
            <Route path="hard-disk-closure" element={<Navigate to="/data-manager/pixoffice" replace />} />
            <Route path="client-tracker" element={<Navigate to="/data-manager/dashboard" replace />} />
            <Route path="assigned-history" element={<Navigate to="/data-manager/dashboard" replace />} />
          </Route>
          {/* Backwards-compat redirect for old data-management route */}
          <Route path="/data-management/*" element={<Navigate to="/data-manager/dashboard" replace />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['employee-1', 'employee-2', 'employee-4', 'traditional-video-editor', 'retouch-editor', 'album-designer', 'candid-video-editor']} />}>
          <Route path="/employee" element={<EmployeeLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<EmployeeDashboard />} />
            <Route path="assigned-projects" element={<EmployeeAssignedProjects />} />
            <Route path="my-work" element={<EmployeeMyWork />} />
            <Route path="save-the-date" element={<EmployeeRoleSpecificPage />} />
            <Route path="save-the-video" element={<EmployeeRoleSpecificPage />} />
            <Route path="outdoor-retouch" element={<EmployeeRoleSpecificPage />} />
            <Route path="traditional-video" element={<Navigate to="/employee/traditional-video/assigned-client" replace />} />
            <Route path="traditional-video/assigned-client" element={<EmployeeRoleSpecificPage />} />
            <Route path="traditional-video/works" element={<EmployeeRoleSpecificPage />} />
            <Route path="traditional-photo" element={<Navigate to="/employee/traditional-photo/assigned-client" replace />} />
            <Route path="traditional-photo/assigned-client" element={<EmployeeRoleSpecificPage />} />
            <Route path="traditional-photo/works" element={<EmployeeRoleSpecificPage />} />
            <Route path="album-design" element={<Navigate to="/employee/album-design/assigned-client" replace />} />
            <Route path="album-design/assigned-client" element={<EmployeeRoleSpecificPage />} />
            <Route path="album-design/works" element={<EmployeeRoleSpecificPage />} />
            <Route path="candid-video" element={<Navigate to="/employee/candid-video/assigned-client" replace />} />
            <Route path="candid-video/assigned-client" element={<EmployeeRoleSpecificPage />} />
            <Route path="candid-video/works" element={<EmployeeRoleSpecificPage />} />
            <Route path="design-preview" element={<EmployeeDesignPreview onBack={() => window.history.back()} />} />
            <Route path="rework-request" element={<EmployeeReworkRequest />} />
            <Route path="attendance" element={<EmployeeAttendance />} />
            <Route path="leave-request" element={<EmployeeLeaveRequest />} />
            <Route path="notifications" element={<EmployeeNotifications />} />
          </Route>
          {/* Backwards-compat redirects for employee roles */}
          <Route path="/employee-1/*" element={<Navigate to="/employee/dashboard" replace />} />
          <Route path="/employee-2/*" element={<Navigate to="/employee/dashboard" replace />} />
          <Route path="/employee-4/*" element={<Navigate to="/employee/dashboard" replace />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="client" element={<AdminClient />} />
            <Route path="employee" element={<AdminEmployee />} />
            <Route path="assign-client" element={<AdminAssignClient />} />
            <Route path="attendance" element={<AdminAttendance />} />
            <Route path="my-attendance" element={<AdminMyAttendance />} />
            <Route path="tracking" element={<AdminTracking />} />
            <Route path="leave-approval" element={<AdminLeaveApproval />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="raw-data" element={<AdminRawData />} />
            <Route path="qc-check" element={<AdminQCCheck />} />
            <Route path="edit-approval" element={<AdminEditApproval />} />
            <Route path="edit-approval/:projectId" element={<AdminEditApprovalDetail />} />
            <Route path="edit-approval/:projectId/:projectType" element={<AdminEditApprovalViewWrapper />} />
            <Route path="client-approval" element={<AdminClientApproval />} />
            <Route path="client-approval/:projectId" element={<AdminClientApprovalDetail />} />
            <Route path="assign-editor" element={<AssignEditor />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['master-admin']} />}>
          <Route path="/master-admin" element={<MasterAdminLayout />}>
            <Route index element={<Navigate to="sales/dashboard" replace />} />
            <Route path="sales/dashboard" element={<MasterAdminDashboard />} />
            <Route path="sales/clients" element={<MasterAdminClients />} />
            <Route path="sales/clients/:clientId" element={<MasterAdminClientDetail />} />
            <Route path="sales/employees" element={<MasterAdminEmployees />} />
            <Route path="sales/work-tracker" element={<MasterAdminWorkTracker />} />
            <Route path="sales/invoices" element={<MasterAdminInvoices />} />
            <Route path="sales/attendance" element={<MasterAdminAttendance />} />
            <Route path="sales/reports" element={<MasterAdminReports />} />
            <Route path="notifications" element={<CrmNotifications />} />
            <Route path="*" element={<Navigate to="/master-admin/sales/dashboard" replace />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['operational-manager']} />}>
          <Route path="/operational-manager" element={<OperationalManagerLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<OperationalManagerDashboard />} />
            <Route path="client" element={<OperationalManagerAssignedProjects />} />
            <Route path="assigned-projects" element={<OperationalManagerWorkStatus />} />
            <Route path="work-status" element={<OperationalManagerWorkStatus />} />
            <Route path="assign-editor" element={<AssignEditor />} />
            <Route path="notifications" element={<EmployeeNotifications />} />
            <Route path="attendance" element={<EmployeeAttendance />} />
            <Route path="leave-request" element={<EmployeeLeaveRequest />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['client']} />}>
          <Route path="/client" element={<ClientLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ClientDashboard />} />
            <Route path="tracker" element={<Tracker />} />
            <Route path="quotation" element={<Quotation />} />
            <Route path="invoice" element={<Invoice />} />
            <Route path="sales/*" element={<Navigate to="/client/invoice" replace />} />
            <Route path="event/:id" element={<EventDetails />} />
            <Route path="preproduction" element={<Preproduction />} />
            <Route path="postproduction" element={<Postproduction />} />
            <Route path="delivery" element={<Delivery />} />
            <Route path="notifications" element={<ClientNotifications />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
