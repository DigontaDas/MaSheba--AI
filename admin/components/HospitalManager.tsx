"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Hospital } from "@/utils/admin-types";
import { deleteHospital } from "@/utils/admin-api";

export function HospitalManager({ items }: { items: Hospital[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Hospital | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setError(null);
    const rawData = Object.fromEntries(formData.entries());
    
    const payload: Record<string, any> = {
      name: rawData.name,
      type: rawData.type,
      district: rawData.district || null,
      upazila: rawData.upazila || null,
      address: rawData.address || null,
      phone: rawData.phone || null,
      is_partner: rawData.is_partner === "true",
    };

    if (rawData.lat) {
      const parsedLat = parseFloat(rawData.lat as string);
      if (isNaN(parsedLat)) {
        setError("Latitude must be a valid number");
        return;
      }
      payload.lat = parsedLat;
    } else {
      payload.lat = null;
    }

    if (rawData.lng) {
      const parsedLng = parseFloat(rawData.lng as string);
      if (isNaN(parsedLng)) {
        setError("Longitude must be a valid number");
        return;
      }
      payload.lng = parsedLng;
    } else {
      payload.lng = null;
    }

    startTransition(async () => {
      try {
        const res = await fetch(editing ? `/dashboard/hospitals/${editing.id}` : "/dashboard/hospitals/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to save hospital.");
        }
        setEditing(null);
        router.refresh();
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      }
    });
  }

  function remove(id: string) {
    if (!confirm("Are you sure you want to delete this emergency contact?")) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteHospital(id);
        router.refresh();
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* Hospitals Table List */}
      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-outline-variant bg-surface-container-lowest flex justify-between items-center">
          <h3 className="font-headline-md text-[18px] font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">local_hospital</span>
            Emergency Registry
          </h3>
          {error && (
            <span className="text-error font-semibold text-xs bg-error-container/20 px-3 py-1 rounded-lg border border-error/20">
              {error}
            </span>
          )}
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Facility / Service</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Partner</th>
                <th className="px-4 py-3 font-medium">Contact & Location</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant font-body-md text-body-md text-on-surface bg-surface">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-on-surface">
                    <div className="flex flex-col">
                      <span>{item.name}</span>
                      <span className="text-xs text-on-surface-variant font-normal">{item.address || "No address provided"}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    {getTypeBadge(item.type)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    {item.is_partner ? (
                      <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full text-xs font-bold border border-green-500/20">
                        <span className="material-symbols-outlined text-[14px]">handshake</span>
                        Partner
                      </span>
                    ) : (
                      <span className="text-xs text-on-surface-variant font-semibold">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-on-surface-variant text-xs">
                    <div className="flex flex-col gap-0.5">
                      {item.phone && (
                        <div className="flex items-center gap-1 font-mono">
                          <span className="material-symbols-outlined text-[14px]">phone</span>
                          {item.phone}
                        </div>
                      )}
                      {(item.upazila || item.district) && (
                        <div className="flex items-center gap-1 font-semibold text-[10px] uppercase tracking-wider text-primary/80">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          {item.upazila ? `${item.upazila}, ` : ""}{item.district}
                        </div>
                      )}
                      {item.lat !== null && item.lng !== null && (
                        <div className="text-[10px] text-on-surface-variant/70 font-mono mt-0.5">
                          Coordinates: {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right font-label-lg">
                    <button
                      className="mr-3 text-sm font-bold text-primary hover:text-surface-tint cursor-pointer"
                      onClick={() => setEditing(item)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="text-sm font-bold text-error hover:text-error/80 cursor-pointer"
                      onClick={() => remove(item.id)}
                      type="button"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <p className="px-6 py-12 text-center font-bold text-on-surface-variant">No emergency contacts registered.</p>
          )}
        </div>
      </div>

      {/* Create / Edit Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(new FormData(e.currentTarget));
        }}
        className="bg-surface border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col gap-4 h-fit"
      >
        <h3 className="font-headline-md text-[18px] font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">
            {editing ? "edit_note" : "add_circle"}
          </span>
          {editing ? "Edit Registry Entry" : "Register Emergency Service"}
        </h3>
        <div className="flex flex-col gap-4">
          <Input name="name" label="Facility / Contact Name" value={editing?.name} required />
          
          <Select
            name="type"
            label="Service Classification"
            value={editing?.type || "government"}
            options={[
              { value: "government", label: "Govt Hospital" },
              { value: "private", label: "Private Hospital" },
              { value: "clinic", label: "Community Clinic" },
              { value: "ambulance", label: "Ambulance Hub" },
              { value: "blood_bank", label: "Blood Bank" },
              { value: "other", label: "Other Helpline" },
            ]}
          />

          <div className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              id="is_partner"
              name="is_partner_checkbox"
              defaultChecked={editing?.is_partner || false}
              onChange={(e) => {
                const hiddenInput = document.getElementById("is_partner_hidden") as HTMLInputElement;
                if (hiddenInput) {
                  hiddenInput.value = e.target.checked ? "true" : "false";
                }
              }}
              className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary accent-primary cursor-pointer"
            />
            <input
              type="hidden"
              id="is_partner_hidden"
              name="is_partner"
              value={editing?.is_partner ? "true" : "false"}
            />
            <label htmlFor="is_partner" className="font-label-md text-on-surface cursor-pointer select-none">
              Official Partner Facility
            </label>
          </div>

          <div className="h-px w-full bg-outline-variant/50 my-1"></div>
          
          <Input name="phone" label="Phone / Helpline Number" value={editing?.phone || ""} type="tel" />
          
          <div className="grid grid-cols-2 gap-3">
            <Input name="district" label="District" value={editing?.district || ""} />
            <Input name="upazila" label="Upazila" value={editing?.upazila || ""} />
          </div>

          <TextArea name="address" label="Street Address" value={editing?.address || ""} />

          <div className="h-px w-full bg-outline-variant/50 my-1"></div>
          
          <div className="grid grid-cols-2 gap-3">
            <Input name="lat" label="Latitude" value={editing?.lat !== null && editing?.lat !== undefined ? editing.lat.toString() : ""} type="number" step="any" />
            <Input name="lng" label="Longitude" value={editing?.lng !== null && editing?.lng !== undefined ? editing.lng.toString() : ""} type="number" step="any" />
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <button
              className="w-full bg-primary text-on-primary py-2.5 rounded-full font-label-lg text-sm font-semibold hover:bg-surface-tint transition-colors disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
              disabled={pending}
              type="submit"
            >
              {editing ? "Save changes" : "Create entry"}
            </button>
            {editing && (
              <button
                className="w-full bg-surface border border-outline-variant text-on-surface py-2.5 rounded-full font-label-lg text-sm font-semibold hover:bg-surface-container-high transition-colors cursor-pointer"
                onClick={() => setEditing(null)}
                type="button"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

function getTypeBadge(type: Hospital["type"]) {
  switch (type) {
    case "government":
      return (
        <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full text-xs font-bold border border-blue-500/20">
          <span className="material-symbols-outlined text-[12px]">account_balance</span>
          Government
        </span>
      );
    case "private":
      return (
        <span className="inline-flex items-center gap-1 bg-purple-500/10 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full text-xs font-bold border border-purple-500/20">
          <span className="material-symbols-outlined text-[12px]">domain</span>
          Private
        </span>
      );
    case "clinic":
      return (
        <span className="inline-flex items-center gap-1 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 px-2 py-0.5 rounded-full text-xs font-bold border border-cyan-500/20">
          <span className="material-symbols-outlined text-[12px]">health_and_safety</span>
          Clinic
        </span>
      );
    case "ambulance":
      return (
        <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full text-xs font-bold border border-red-500/20">
          <span className="material-symbols-outlined text-[12px]">airport_shuttle</span>
          Ambulance
        </span>
      );
    case "blood_bank":
      return (
        <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded-full text-xs font-bold border border-rose-500/20">
          <span className="material-symbols-outlined text-[12px]">water_drop</span>
          Blood Bank
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 bg-gray-500/10 text-gray-700 dark:text-gray-400 px-2 py-0.5 rounded-full text-xs font-bold border border-gray-500/20">
          <span className="material-symbols-outlined text-[12px]">help</span>
          Other
        </span>
      );
  }
}

function Input({
  name,
  label,
  value,
  type = "text",
  required = false,
  step,
}: {
  name: string;
  label: string;
  value?: string;
  type?: string;
  required?: boolean;
  step?: string;
}) {
  return (
    <label className="font-label-lg text-label-lg text-on-surface flex flex-col gap-1.5 w-full">
      {label}
      <input
        type={type}
        step={step}
        className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-normal"
        key={value}
        defaultValue={value}
        name={name}
        required={required}
      />
    </label>
  );
}

function TextArea({ name, label, value }: { name: string; label: string; value?: string }) {
  return (
    <label className="font-label-lg text-label-lg text-on-surface flex flex-col gap-1.5 w-full">
      {label}
      <textarea
        className="min-h-20 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-normal resize-none"
        key={value}
        defaultValue={value}
        name={name}
      />
    </label>
  );
}

function Select({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="font-label-lg text-label-lg text-on-surface flex flex-col gap-1.5 w-full">
      {label}
      <select
        className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-normal"
        key={value}
        defaultValue={value}
        name={name}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
