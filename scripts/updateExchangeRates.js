import fs from 'fs';
import path from 'path';

async function updateExchangeRates() {
  console.log("Fetching live exchange rates from Open Exchange API...");
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!response.ok) {
      throw new Error(`API response status: ${response.status}`);
    }

    const data = await response.json();
    if (!data || !data.rates) {
      throw new Error("Invalid or empty rates payload received from API.");
    }

    const rates = {
      USD: 1.0,
      GBP: data.rates.GBP || 0.79,
      EUR: data.rates.EUR || 0.92,
      BDT: data.rates.BDT || 117.5,
      CAD: data.rates.CAD || 1.37,
      AUD: data.rates.AUD || 1.5,
      INR: data.rates.INR || 83.5,
      JPY: data.rates.JPY || 161.0,
      CHF: data.rates.CHF || 0.90,
      SGD: data.rates.SGD || 1.35,
      MYR: data.rates.MYR || 4.70,
      NZD: data.rates.NZD || 1.63,
      ZAR: data.rates.ZAR || 18.2,
      BRL: data.rates.BRL || 5.50,
      MXN: data.rates.MXN || 18.1
    };

    const payload = {
      base: "USD",
      rates,
      lastUpdated: new Date().toISOString()
    };

    const targetPath = path.join(process.cwd(), 'public', 'data', 'exchange_rates.json');
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, JSON.stringify(payload, null, 2), 'utf-8');
    
    console.log(`✅ Successfully updated exchange rates cache at ${targetPath}`);
  } catch (err) {
    console.error("❌ Failed to update exchange rates:", err.message);
  }
}

updateExchangeRates();
