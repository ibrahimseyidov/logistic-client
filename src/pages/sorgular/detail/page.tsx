"use client";

import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaHistory, FaPlus, FaRedo } from "react-icons/fa";
import { getSorguByKey } from "../lib/getSorguByKey";
import {
  buildSorguDetailView,
  type SorguDetailTabId,
} from "../lib/sorguDetailViewModel";

const tabBase =
  "px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap";
const tabActive = "border-indigo-600 text-indigo-700";
const tabIdle = "border-transparent text-gray-500 hover:text-gray-700";

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
      <div className="bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800 border-b border-gray-200">
        {title}
      </div>
      <div className="p-3 text-sm">{children}</div>
    </section>
  );
}

function DlRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-x-2 gap-y-1 py-1.5 border-b border-gray-100 last:border-0 text-xs sm:text-sm">
      <div className="text-gray-500 font-medium">{label}</div>
      <div className="text-gray-900 text-right sm:text-left break-words">
        {value}
      </div>
    </div>
  );
}

export default function SorguDetailPage() {
  const { sorguKey } = useParams<{ sorguKey: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<SorguDetailTabId>("main");

  const row = sorguKey ? getSorguByKey(sorguKey) : undefined;
  const detail = useMemo(() => (row ? buildSorguDetailView(row) : null), [row]);

  if (!detail) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <p className="text-gray-700 mb-4">Sorğu tapılmadı.</p>
        <Link
          to="/sorgular"
          className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
        >
          Sorğular siyahısına qayıt
        </Link>
      </div>
    );
  }

  const { row: r } = detail;

  const tabs: { id: SorguDetailTabId; label: string }[] = [
    { id: "main", label: "Əsas məlumat" },
    { id: "comments", label: "Şərhlər" },
    {
      id: "offers",
      label: `Qiymət təklifləri (${detail.offersCount})`,
    },
    {
      id: "documents",
      label: `Sənədlər (${detail.documentsCount})`,
    },
    { id: "tasks", label: "Tapşırıqlar" },
  ];

  return (
    <div className="min-h-full flex flex-col bg-gray-50/90">
      <div className="shrink-0 px-4 pt-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <FaArrowLeft className="text-xs" aria-hidden />
          Geri
        </button>
      </div>

      <div className="flex-1 flex flex-col xl:flex-row gap-4 p-4 w-full min-h-0">
        <aside className="w-full xl:w-[300px] shrink-0 flex flex-col gap-3">
          <div className="border border-gray-200 rounded-lg bg-white shadow-sm p-3">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded transition-colors mb-3"
            >
              <FaPlus className="text-[10px]" aria-hidden />
              Redaktə et
            </button>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-green-100 text-green-800 text-xs font-semibold">
                {r.status}
              </span>
              <button
                type="button"
                className="p-1.5 text-gray-500 hover:text-indigo-600 rounded border border-gray-200 bg-white"
                title="Yenilə"
                aria-label="Yenilə"
              >
                <FaRedo className="text-xs" />
              </button>
              <button
                type="button"
                className="p-1.5 text-gray-500 hover:text-indigo-600 rounded border border-gray-200 bg-white"
                title="Tarixçə"
                aria-label="Tarixçə"
              >
                <FaHistory className="text-xs" />
              </button>
            </div>
            <div>
              <DlRow label="Satıcı" value={detail.seller} />
              <DlRow label="Sorğunun tarixi" value={detail.inquiryDateLabel} />
              <DlRow label="İstiqamət" value={detail.direction} />
              <DlRow label="Şirkət" value={r.company} />
              <DlRow label="Müştəri" value={r.customer} />
              <DlRow label="Ünvan" value={detail.summaryAddress} />
              <DlRow label="Əlaqədar şəxslər" value={detail.contacts} />
              <DlRow label="Sorğunun məqsədi" value={r.purpose} />
              <DlRow label="Ümumi miqdar" value={detail.quantityTotal} />
              <DlRow label="Ümumi LDM" value={detail.ldmTotal} />
              <DlRow label="Ümumi çəki" value={detail.weightTotal} />
              <DlRow label="Ümumi həcm" value={detail.volumeLabel} />
              <DlRow label="Incoterms" value={detail.incoterms} />
              <DlRow label="Cargo Specifications" value={detail.cargoSpecs} />
              <DlRow label="Sorğunun alınması mənbəyi" value={detail.source} />
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col gap-3 min-h-0">
          <div className="flex flex-wrap gap-1 border-b border-gray-200 bg-white rounded-t-lg px-2 -mb-px">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`${tabBase} ${tab === t.id ? tabActive : tabIdle}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto border border-gray-200 rounded-b-lg bg-white shadow-sm p-4">
            {tab === "main" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <SectionCard title="Haradan">
                    <div>
                      <DlRow label="Ölkə" value={detail.fromCountry} />
                      <DlRow label="Şəhər" value={detail.fromCity} />
                      <DlRow label="Ünvan" value={detail.fromAddress} />
                    </div>
                  </SectionCard>
                  <SectionCard title="Haraya">
                    <div>
                      <DlRow label="Ölkə" value={detail.toCountry} />
                      <DlRow label="Şəhər" value={detail.toCity} />
                      <DlRow label="Ünvan" value={detail.toAddress} />
                    </div>
                  </SectionCard>
                </div>

                <SectionCard title={`Yük: ${detail.cargoTitle}`}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">
                        Miqdarı
                      </p>
                      <p className="text-gray-900 font-semibold">
                        {detail.quantityTotal}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">LDM</p>
                      <p className="text-gray-900 font-semibold">
                        {detail.ldmTotal}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">
                        Çəkisi
                      </p>
                      <p className="text-gray-900 font-semibold">
                        {detail.weightTotal}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Həcmi</p>
                      <p className="text-gray-900 font-semibold">
                        {detail.volumeLabel}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 font-medium mb-1">
                    Nəqliyyatın tipi
                  </p>
                  <p className="text-gray-900">{r.transportType}</p>
                </SectionCard>

                <SectionCard title="Yük haqqında əlavə məlumat">
                  {detail.cargoBoxLines.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1 text-gray-800">
                      {detail.cargoBoxLines.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">Məlumat yoxdur.</p>
                  )}
                </SectionCard>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">
                      Incoterms
                    </p>
                    <p className="text-gray-900">{detail.incoterms}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">
                      Cargo Specifications
                    </p>
                    <p className="text-gray-900">{detail.cargoSpecs}</p>
                  </div>
                </div>
              </div>
            )}

            {tab === "comments" && (
              <p className="text-sm text-gray-500">
                Şərhlər tezliklə əlavə olunacaq.
              </p>
            )}
            {tab === "offers" && (
              <p className="text-sm text-gray-500">
                Qiymət təklifləri siyahısı tezliklə.
              </p>
            )}
            {tab === "documents" && (
              <p className="text-sm text-gray-500">Sənədlər tezliklə.</p>
            )}
            {tab === "tasks" && (
              <p className="text-sm text-gray-500">Tapşırıqlar tezliklə.</p>
            )}
          </div>
        </div>
      </div>

      <footer className="text-xs text-gray-400 px-4 py-2.5 border-t border-gray-200 bg-white shrink-0">
        Logistra Copyright © 2013-2026
      </footer>
    </div>
  );
}
