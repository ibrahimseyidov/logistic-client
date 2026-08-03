import { useCallback, useEffect, useState } from "react";
import {
  convertToAznWithRates,
  FALLBACK_AZN_RATES,
  fetchCurrencyRates,
  getAznRate,
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
            rates: { ...FALLBACK_AZN_RATES },
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
      return convertToAznWithRates(
        amount,
        currency,
        ratesData?.rates || FALLBACK_AZN_RATES,
      );
    },
    [ratesData],
  );

  const getRate = useCallback(
    (currency: string) => getAznRate(currency, ratesData?.rates),
    [ratesData],
  );

  return { ratesData, loading, toAzn, getRate };
}
