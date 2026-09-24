"""
Minimal FreqAI example strategy (LightGBM path).

Train / run (after installing FreqAI deps — see requirements.txt):

  freqtrade trade --config user_data/config/config_freqai.json \
    --strategy FreqaiExampleStrategy --freqaimodel LightGBMRegressor \
    --userdir user_data --recursive-strategy-search

Docs: https://www.freqtrade.io/en/stable/freqai/
This is a learning template — no profit claims.
"""
from __future__ import annotations

import logging

import numpy as np
from pandas import DataFrame

from freqtrade.strategy import IStrategy, IntParameter

logger = logging.getLogger(__name__)


class FreqaiExampleStrategy(IStrategy):
    INTERFACE_VERSION = 3
    timeframe = "5m"
    can_short = False
    process_only_new_candles = True
    startup_candle_count = 40
    use_exit_signal = True

    minimal_roi = {"0": 0.04, "40": 0.02, "120": 0.0}
    stoploss = -0.05

    plot_config = {
        "main_plot": {},
        "subplots": {"prediction": {"&-s_close": {"color": "blue"}}},
    }

    # Feature engineering params
    label_period = IntParameter(5, 40, default=12, space="buy")

    def feature_engineering_expand_all(self, dataframe: DataFrame, period: int, metadata: dict, **kwargs) -> DataFrame:
        dataframe[f"%-rsi-period_{period}"] = self.rsi(dataframe["close"], period)
        dataframe[f"%-sma-period_{period}"] = dataframe["close"].rolling(period).mean()
        dataframe[f"%-pct-change-period_{period}"] = dataframe["close"].pct_change(period)
        dataframe[f"%-raw_volume-period_{period}"] = dataframe["volume"].rolling(period).mean()
        return dataframe

    def feature_engineering_expand_basic(self, dataframe: DataFrame, metadata: dict, **kwargs) -> DataFrame:
        dataframe["%-raw_close"] = dataframe["close"]
        dataframe["%-raw_open"] = dataframe["open"]
        dataframe["%-raw_high"] = dataframe["high"]
        dataframe["%-raw_low"] = dataframe["low"]
        return dataframe

    def feature_engineering_standard(self, dataframe: DataFrame, metadata: dict, **kwargs) -> DataFrame:
        dataframe["%-day_of_week"] = dataframe["date"].dt.dayofweek
        dataframe["%-hour_of_day"] = dataframe["date"].dt.hour
        return dataframe

    def set_freqai_targets(self, dataframe: DataFrame, metadata: dict, **kwargs) -> DataFrame:
        # Predict future close return over label_period candles
        period = int(self.label_period.value)
        dataframe["&-s_close"] = (
            dataframe["close"].shift(-period) / dataframe["close"] - 1
        )
        return dataframe

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        # FreqAI injects predictions into dataframe
        dataframe = self.freqai.start(dataframe, metadata, self)
        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe["do_predict"] == 1)
                & (dataframe["&-s_close"] > 0.005)
                & (dataframe["volume"] > 0)
            ),
            "enter_long",
        ] = 1
        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe["do_predict"] == 1)
                & (dataframe["&-s_close"] < -0.002)
                & (dataframe["volume"] > 0)
            ),
            "exit_long",
        ] = 1
        return dataframe

    @staticmethod
    def rsi(series, period: int = 14):
        delta = series.diff()
        up = delta.clip(lower=0).rolling(period).mean()
        down = (-delta.clip(upper=0)).rolling(period).mean()
        rs = up / (down.replace(0, np.nan))
        return 100 - (100 / (1 + rs))
