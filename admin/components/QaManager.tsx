"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { QaItem } from "@/utils/admin-types";

export function QaManager({ items }: { items: QaItem[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<QaItem | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    const payload = Object.fromEntries(formData.entries());
    startTransition(async () => {
      await fetch(editing ? `/dashboard/qa/${editing.id}` : "/dashboard/qa/create", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setEditing(null);
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await fetch(`/dashboard/qa/${id}`, { method: "DELETE" });
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Q&A Table List */}
      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-outline-variant bg-surface-container-lowest">
          <h3 className="font-headline-md text-[18px] font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">menu_book</span>
            Offline Q&A Catalog
          </h3>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Topic</th>
                <th className="px-4 py-3 font-medium">Trimester</th>
                <th className="px-4 py-3 font-medium">Severity</th>
                <th className="px-4 py-3 font-medium">Question (EN / BN)</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant font-body-md text-body-md text-on-surface bg-surface">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="whitespace-nowrap px-4 py-3.5 font-bold text-on-surface">{item.topic}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-on-surface-variant font-semibold">{item.trimester}</td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    {item.severity === "HIGH" ? (
                      <span className="inline-flex items-center gap-1 bg-error text-on-error px-2 py-0.5 rounded-full text-xs font-bold border border-error">
                        <span className="material-symbols-outlined text-[12px]">warning</span>
                        HIGH
                      </span>
                    ) : item.severity === "MODERATE" ? (
                      <span className="inline-flex items-center gap-1 bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full text-xs font-bold border border-secondary-container">
                        <span className="material-symbols-outlined text-[12px]">emergency</span>
                        MODERATE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full text-xs font-bold border border-primary-container">
                        <span className="material-symbols-outlined text-[12px]">check_circle</span>
                        LOW
                      </span>
                    )}
                  </td>
                  <td className="max-w-md px-4 py-3.5 text-on-surface-variant text-xs flex flex-col gap-0.5 justify-center">
                    <div className="font-bold text-on-surface line-clamp-1">EN: {item.question_en}</div>
                    <div className="text-on-surface-variant/80 line-clamp-1">BN: {item.question_bn}</div>
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
            <p className="px-6 py-12 text-center font-bold text-on-surface-variant">No items found.</p>
          )}
        </div>
      </div>

      {/* Create / Edit Form */}
      <form action={submit} className="bg-surface border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col gap-4 h-fit">
        <h3 className="font-headline-md text-[18px] font-bold text-on-surface">
          {editing ? "Edit Q&A Entry" : "Create Q&A Entry"}
        </h3>
        <div className="flex flex-col gap-4">
          <Input name="topic" label="Topic / Subheading" value={editing?.topic} />
          <Select
            name="trimester"
            label="Maternal Lifecycle Stage"
            value={editing?.trimester || "ALL"}
            options={["ALL", "T1", "T2", "T3", "POSTPARTUM"]}
          />
          <Select
            name="severity"
            label="Risk Severity Threshold"
            value={editing?.severity || "LOW"}
            options={["LOW", "MODERATE", "HIGH"]}
          />
          <div className="h-px w-full bg-outline-variant/50 my-1"></div>
          <TextArea name="question_en" label="Question (English)" value={editing?.question_en} />
          <TextArea name="answer_en" label="Answer / Guidance (English)" value={editing?.answer_en} />
          <div className="h-px w-full bg-outline-variant/50 my-1"></div>
          <TextArea name="question_bn" label="Question (Bengali)" value={editing?.question_bn} />
          <TextArea name="answer_bn" label="Answer / Guidance (Bengali)" value={editing?.answer_bn} />

          <div className="flex flex-col gap-2 mt-2">
            <button
              className="w-full bg-primary text-on-primary py-2.5 rounded-full font-label-lg text-sm font-semibold hover:bg-surface-tint transition-colors disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
              disabled={pending}
              type="submit"
            >
              {editing ? "Save changes" : "Create item"}
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

function Input({ name, label, value }: { name: string; label: string; value?: string }) {
  return (
    <label className="font-label-lg text-label-lg text-on-surface flex flex-col gap-1.5 w-full">
      {label}
      <input
        className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-normal"
        key={value}
        defaultValue={value}
        name={name}
        required
      />
    </label>
  );
}

function TextArea({ name, label, value }: { name: string; label: string; value?: string }) {
  return (
    <label className="font-label-lg text-label-lg text-on-surface flex flex-col gap-1.5 w-full">
      {label}
      <textarea
        className="min-h-24 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-normal"
        key={value}
        defaultValue={value}
        name={name}
        required
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
  options: string[];
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
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
