import * as Popover from "@radix-ui/react-popover";
import type { OrderStatusKind } from "../types/sifaris.types";

export const ORDER_STATUS_CHOICES: Array<{
  value: OrderStatusKind;
  label: string;
  bg: string;
  text: string;
  dot: string;
  border: string;
}> = [
  {
    value: "planned",
    label: "Planlaşdırılıb",
    bg: "#eff6ff",
    text: "#1d4ed8",
    dot: "#3b82f6",
    border: "#bfdbfe",
  },
  {
    value: "progress",
    label: "Davam edir",
    bg: "#fef3c7",
    text: "#b45309",
    dot: "#f59e0b",
    border: "#fde68a",
  },
  {
    value: "completed",
    label: "Tamamlandı",
    bg: "#ecfdf5",
    text: "#047857",
    dot: "#10b981",
    border: "#a7f3d0",
  },
  {
    value: "finance_closed",
    label: "Maliyyə cəhətdən bağlandı",
    bg: "#e0e7ff",
    text: "#4338ca",
    dot: "#6366f1",
    border: "#c7d2fe",
  },
  {
    value: "cancelled",
    label: "Sifariş ləğv edildi",
    bg: "#fee2e2",
    text: "#b91c1c",
    dot: "#ef4444",
    border: "#fecaca",
  },
];

export function statusLabelForKind(kind: OrderStatusKind): string {
  return (
    ORDER_STATUS_CHOICES.find((o) => o.value === kind)?.label ||
    "Planlaşdırılıb"
  );
}

export default function OrderStatusPicker({
  value,
  disabled,
  onChange,
}: {
  value?: string | null;
  disabled?: boolean;
  onChange: (kind: OrderStatusKind, label: string) => void;
}) {
  const current =
    ORDER_STATUS_CHOICES.find((o) => o.value === value) ||
    ORDER_STATUS_CHOICES[0];

  const pillStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    border: `1px solid ${current.border}`,
    borderRadius: "999px",
    padding: "0.3rem 0.85rem",
    fontSize: "0.75rem",
    fontWeight: 700,
    backgroundColor: current.bg,
    color: current.text,
  } as const;

  if (disabled) {
    return (
      <span style={pillStyle}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: current.dot,
          }}
        />
        {current.label}
      </span>
    );
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          style={{
            ...pillStyle,
            cursor: "pointer",
            outline: "none",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: current.dot,
            }}
          />
          {current.label}
          <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
            <path
              d="M1 1L4 4L7 1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          style={{
            zIndex: 10050,
            minWidth: 220,
            borderRadius: "0.85rem",
            border: "1px solid #e2e8f0",
            backgroundColor: "#fff",
            padding: "0.5rem",
            boxShadow:
              "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            outline: "none",
          }}
          sideOffset={4}
          align="start"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {ORDER_STATUS_CHOICES.map((opt) => {
              const isSelected = current.value === opt.value;
              return (
                <Popover.Close key={opt.value} asChild>
                  <button
                    type="button"
                    onClick={() => onChange(opt.value, opt.label)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      border: 0,
                      background: isSelected ? "#f1f5f9" : "transparent",
                      color: isSelected ? opt.text : "#334155",
                      borderRadius: "0.5rem",
                      padding: "0.5rem 0.75rem",
                      fontSize: "0.8rem",
                      fontWeight: isSelected ? 700 : 600,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: opt.dot,
                      }}
                    />
                    {opt.label}
                  </button>
                </Popover.Close>
              );
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
