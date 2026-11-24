# Shipment consistency review

Rule: the current shipment status must agree throughout the website; a cancelled shipment must not appear active. Refreshed details must use current records, while past events, payments and closed conversations remain unchanged.

| Place | Code read | Result |
| --- | --- | --- |
| Public lookup and open tracking | track route, tracking refresh, track_shipment | Exact public lookup and periodic refresh checked previously; cancellation projection fixed in the applied migration. |
| Homepage tracking entry | TrackingPanel | Navigates to the same tracking route; no separate operational status source. |
| Customer dashboard and shipment list | customer shipments/common | Active counts exclude cancellation; list and history badges use cancellation first. |
| Customer tracking/details/history | customer shipments, customer query | Uses the current refreshed shipment and preserved event history; shared map receives cancellation first. |
| Customer profile totals | customer profile | Fixed completed count to exclude cancellations, matching dashboard totals. |
| Administrator overview | admin overview | Recent shipment badges and database active counts already exclude cancellation. |
| Administrator customer shipment history | admin management | Fixed raw travel-status badge; open customer selection now resolves refreshed profile by ID. |
| Administrator shipment list/filter/detail | admin management | Fixed active-filter cancellation leak, added cancellation filter, and changed open selection to refreshed record by ID. |
| Administrator tracking correction | admin forms/management, admin_tracking_event | Timezone and millisecond precision preserved; database rejects progress on cancellation; event selection now resolves by ID. |
| Operations and assignments | admin operations | Active list and assignment choices exclude cancelled shipments; no change to assignments. |
| Reports and analytics | admin configuration, admin_operational_stats | Database active outcome counts already correct; fixed report page to exclude cancelled delivered/delayed outcomes. |
| Shipments CSV and backup exports | exportAdminData, ExportButton | Fixed shipment CSV current status projection; unchanged event/payment/audit exports. |
| Shared interactive map and selected checkpoint | TrackingMap | Fixed live radar/progress/ETA on cancelled shipments and resolve selected checkpoints from refreshed events. Historical milestones remain unchanged. |
| Booking history and in-app notifications | shipping route, customer notifications, notification functions | Read previously and exercised end-to-end; notifications are historical notices, not a second current-status source. No stored notices rewritten. |
| Support conversations | customer support, admin operations, saveSupportAction | Exercised end-to-end previously; open request selection now resolves refreshed status by ID. Closed/sent records unchanged. |
| Background refresh | admin context, customer query, tracking refresh, shipping route | Fifteen-second browser refresh; administrator passive reads do not extend inactivity. No shipment cron/server job present in the route tree. |
| Example shipments, permissions and settings | unchanged | Outside this correction; preserved. |

Remaining limitations carried forward: delivered recovery emails have not been checked in the inbox; automated SMS and payment operations require configured providers. New open-customer/support selection changes are code-reviewed and covered by ID-resolution regression tests, not new delivered-email or payment tests.