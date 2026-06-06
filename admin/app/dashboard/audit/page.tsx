import { getAuditEvents } from "@/utils/admin-api";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const events = await getAuditEvents();
  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h2 className="font-headline-lg text-headline-lg text-on-background">Operational Audit Ledger</h2>
        <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
          Immutable-style audit log of administrative read, write, and lifecycle security events.
        </p>
      </div>

      {/* Audit Logs Catalog Table */}
      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-outline-variant bg-surface-container-lowest">
          <h3 className="font-headline-md text-[18px] font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">history</span>
            Security and Operations Ledger
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                <th className="px-6 py-3.5 font-medium">Action type</th>
                <th className="px-6 py-3.5 font-medium">Target Entity</th>
                <th className="px-6 py-3.5 font-medium">Actor</th>
                <th className="px-6 py-3.5 font-medium text-right">Event Timestamp</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-body-md text-on-surface divide-y divide-outline-variant bg-surface">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="whitespace-nowrap px-6 py-3.5 font-bold text-on-surface">
                    {event.action}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3.5 text-on-surface-variant">
                    {event.entity_type}
                    {event.entity_id ? `:${event.entity_id}` : ""}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3.5 text-on-surface font-semibold">
                    {event.actor_user_id || "system"}
                  </td>
                  <td suppressHydrationWarning className="whitespace-nowrap px-6 py-3.5 text-right text-on-surface-variant font-semibold text-xs font-label-sm">
                    {new Date(event.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center font-bold text-on-surface-variant">
                    No audit logs recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
