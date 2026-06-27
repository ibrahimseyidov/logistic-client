import { useCallback, useEffect, useState } from "react";
import {
  convertToAznWithRates,
  fetchCurrencyRates,
  type CurrencyRatesResponse,
} from "../utils/currency.utils";

export function useCurrencyRates(date?: string) {
  const [ratesData, setRatesData] = useState<CurrencyRatesResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchCurrencyRates(date)
      .then((data) => {
        if (active) setRatesData(data);
      })
      .catch(() => {
        if (active) {
          setRatesData({
            date: date || "",
            source: "fallback",
            rates: { AZN: 1, USD: 1.7, EUR: 1.9324, TRY: 0.0364 },
          });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [date]);

  const toAzn = useCallback(
    (amount: number, currency: string) => {
      if (!ratesData) return amount;
      return convertToAznWithRates(amount, currency, ratesData.rates);
    },
    [ratesData],
  );

  const getRate = useCallback(
    (currency: string) => {
      const code = (currency || "AZN").toUpperCase();
      if (code === "AZN") return 1;
      return ratesData?.rates[code] ?? 1;
    },
    [ratesData],
  );

  return { ratesData, loading, toAzn, getRate };
}
