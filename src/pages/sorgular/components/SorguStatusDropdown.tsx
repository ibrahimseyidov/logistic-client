import React, { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { FiChevronDown, FiCheck } from "react-icons/fi";
import { FaSpinner } from "react-icons/fa";
import { SorguStatus } from "../types/sorgu.types";
import {
  getStatusTone,
  toneClasses,
  statusLabelAz,
  type StatusTone,
} from "../../../common/components/StatusBadge";

interface Props {
  status: SorguStatus;
  onStatusChange: (newStatus: SorguStatus) => Promise<void>;
}

const hoverToneClasses: Record<StatusTone, string> = {
  amber: "hover:bg-amber-50 hover:text-amber-900",
  cyan: "hover:bg-cyan-50 hover:text-cyan-900",
  emerald: "hover:bg-emerald-50 hover:text-emerald-900",
  rose: "hover:bg-rose-50 hover:text-rose-900",
  slate: "hover:bg-slate-50 hover:text-slate-900",
  sky: "hover:bg-sky-50 hover:text-sky-900",
  violet: "hover:bg-violet-50 hover:text-violet-900",
};

const dotColors: Record<StatusTone, string> = {
  amber: "bg-amber-500",
  cyan: "bg-cyan-500",
  emerald: "bg-emerald-500",
  rose: "bg-rose-500",
  slate: "bg-slate-400",
  sky: "bg-sky-500",
  violet: "bg-violet-500",
};

export default function SorguStatusDropdown({ status, onStatusChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const tone = getStatusTone(status);

  const handleSelect = async (newStatus: SorguStatus) => {
    if (newStatus === status) {
      setIsOpen(false);
      return;
    }
    setIsOpen(false);
    setIsUpdating(true);
    try {
      await onStatusChange(newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const statusOptions = [
    SorguStatus.Pending,
    SorguStatus.Approved,
    SorguStatus.Completed,
    SorguStatus.Cancelled,
  ];

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={isUpdating}
          className={`group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer select-none shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.08)] hover:scale-[1.03] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-slate-100 ${
            toneClasses[tone].badge
          } ${isUpdating ? "opacity-70 pointer-events-none" : ""}`}
        >
          {isUpdating ? (
            <FaSpinner className="animate-spin text-current" size={11} />
          ) : (
            <span
              className="h-1.5 w-1.5 rounded-full bg-current opacity-70 group-hover:scale-125 transition-transform duration-200"
              aria-hidden="true"
            />
          )}
          <span>{statusLabelAz(status)}</span>
          {!isUpdating && (
            <FiChevronDown
              className={`ml-0.5 opacity-60 group-hover:opacity-100 group-hover:translate-y-[1px] transition-all duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
              size={13}
            />
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="z-50 min-w-[180px] rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150 outline-none"
          sideOffset={6}
          align="center"
        >
          <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
            Statusu dəyiş
          </div>
          <div className="h-[1px] bg-slate-100 my-1" />
          <div className="space-y-0.5">
            {statusOptions.map((opt) => {
              const optTone = getStatusTone(opt);
              const isSelected = opt === status;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`flex items-center w-full px-2.5 py-1.75 text-xs font-semibold rounded-lg text-slate-700 transition-all duration-150 cursor-pointer select-none text-left focus:outline-none ${
                    hoverToneClasses[optTone]
                  } ${isSelected ? "bg-slate-50 font-bold" : ""}`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${dotColors[optTone]} mr-2.5 flex-shrink-0 transition-transform duration-200`}
                  />
                  <span className="flex-1">{statusLabelAz(opt)}</span>
                  {isSelected && (
                    <FiCheck className="text-slate-500 ml-2" size={14} />
                  )}
                </button>
              );
            })}
          </div>
          <Popover.Arrow className="fill-white stroke-slate-200" width={10} height={5} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
