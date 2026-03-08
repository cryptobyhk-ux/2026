import numpy as np
import pandas as pd

def simulate_bitcoin_prices(days=60, initial_price=50000, mu=0.001, sigma=0.04, seed=42):
    """Simulates daily Bitcoin prices using Geometric Brownian Motion."""
    np.random.seed(seed)
    prices = [initial_price]
    for _ in range(1, days):
        # Drift and shock
        shock = np.random.normal(0, 1)
        price = prices[-1] * np.exp((mu - 0.5 * sigma**2) + sigma * shock)
        prices.append(price)
    return prices

def main():
    days = 60
    # Search for a seed that produces at least one trade if we want,
    # but seed=42 is a good starting point. Let's use 42.
    prices = simulate_bitcoin_prices(days=days, seed=42)

    # Create DataFrame
    dates = pd.date_range(start="2023-01-01", periods=days)
    df = pd.DataFrame({'Date': dates, 'Price': prices})

    # Calculate Moving Averages
    df['MA7'] = df['Price'].rolling(window=7).mean()
    df['MA30'] = df['Price'].rolling(window=30).mean()

    # Implement Golden Cross algorithm
    # Buy when MA7 crosses above MA30
    # Sell when MA7 crosses below MA30

    cash = 100000.0 # Initial portfolio in USD
    btc = 0.0
    initial_portfolio = cash

    print("--- Daily Ledger ---")

    position = 0 # 0 means flat, 1 means long

    for i in range(len(df)):
        date = df.loc[i, 'Date'].strftime('%Y-%m-%d')
        price = df.loc[i, 'Price']
        ma7 = df.loc[i, 'MA7']
        ma30 = df.loc[i, 'MA30']

        signal = None

        # Check for crosses when both MAs are available
        if pd.notna(ma7) and pd.notna(ma30):
            # For a more robust cross check, look at previous day's MAs
            # But simple condition MA7 > MA30 for holding is also a standard approach.
            if ma7 > ma30 and position == 0:
                # Buy signal
                btc_to_buy = cash / price
                btc += btc_to_buy
                cash = 0.0
                position = 1
                signal = f"BUY  {btc_to_buy:.4f} BTC"
            elif ma7 < ma30 and position == 1:
                # Sell signal
                cash += btc * price
                signal = f"SELL {btc:.4f} BTC"
                btc = 0.0
                position = 0

        # Ledger entry
        portfolio_value = cash + btc * price

        ma7_str = f"${ma7:,.2f}" if pd.notna(ma7) else "N/A"
        ma30_str = f"${ma30:,.2f}" if pd.notna(ma30) else "N/A"

        ledger_entry = (f"Day {i+1:02d} | Date: {date} | Price: ${price:,.2f} | "
                        f"MA7: {ma7_str:>10} | MA30: {ma30_str:>10} | "
                        f"Value: ${portfolio_value:,.2f}")

        if signal:
            ledger_entry += f" | ACTION: {signal}"

        print(ledger_entry)

    print("\n--- Final Portfolio Performance ---")
    final_value = cash + btc * df.iloc[-1]['Price']
    print(f"Initial Portfolio Value: ${initial_portfolio:,.2f}")
    print(f"Final Portfolio Value:   ${final_value:,.2f}")
    roi = ((final_value - initial_portfolio) / initial_portfolio) * 100
    print(f"Return on Investment:    {roi:.2f}%")

if __name__ == "__main__":
    main()
