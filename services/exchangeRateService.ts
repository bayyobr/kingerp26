export const exchangeRateService = {
  getUSDRate: async (): Promise<number> => {
    try {
      const response = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      return parseFloat(data.USDBRL.bid);
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      throw error;
    }
  }
};
