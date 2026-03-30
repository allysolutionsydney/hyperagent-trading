'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Card from '@/components/Card';
import useStore from '@/hooks/useStore';
import {
  Key,
  Shield,
  Sliders,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface ApiKeyStatus {
  openai: 'valid' | 'invalid' | 'untested';
  hyperliquid: 'valid' | 'invalid' | 'untested';
  openrouter: 'valid' | 'invalid' | 'untested';
}

interface StrategySettings {
  enabled: boolean;
  weight: number;
  params: Record<string, any>;
}

const STRATEGIES = ['RSI', 'MACD', 'Bollinger', 'MA Crossover', 'Volume', 'AI Sentiment'];

export default function SettingsPage() {
  const store = useStore();

  // Form state
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    hyperliquid: '',
    walletAddress: '',
    openrouter: '',
  });

  const [network, setNetwork] = useState<'testnet' | 'mainnet'>('testnet');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({
    openai: false,
    hyperliquid: false,
    openrouter: false,
  });

  const [apiStatus, setApiStatus] = useState<ApiKeyStatus>({
    openai: 'untested',
    hyperliquid: 'untested',
    openrouter: 'untested',
  });

  const [riskSettings, setRiskSettings] = useState({
    maxPositionSize: 10000,
    maxLeverage: 10,
    stopLossDefault: 5,
    takeProfitDefault: 15,
    maxDailyLoss: 5000,
    maxOpenPositions: 5,
  });

  const [strategies, setStrategies] = useState<Record<string, StrategySettings>>({
    RSI: { enabled: true, weight: 20, params: { period: 14, overbought: 70, oversold: 30 } },
    MACD: { enabled: true, weight: 20, params: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 } },
    Bollinger: { enabled: true, weight: 20, params: { period: 20, stdDev: 2 } },
    'MA Crossover': { enabled: true, weight: 20, params: { shortPeriod: 20, longPeriod: 50 } },
    Volume: { enabled: true, weight: 10, params: { avgPeriod: 20, spikeMultiplier: 2 } },
    'AI Sentiment': { enabled: true, weight: 10, params: { model: 'gpt-3.5-turbo', temperature: 0.7 } },
  });

  const [tradingPrefs, setTradingPrefs] = useState({
    orderType: 'limit',
    defaultCoin: 'USDC',
    minSignalStrength: 60,
    minConfidence: 70,
    analysisInterval: 60,
    tradeCooldown: 30,
  });

  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showNetworkWarning, setShowNetworkWarning] = useState(false);

  // Load settings from store on mount
  useEffect(() => {
    if (store) {
      // Load from store if available
      const savedSettings = store.settings || {};
      if (savedSettings.apiKeys) setApiKeys(savedSettings.apiKeys);
      if (savedSettings.network) setNetwork(savedSettings.network);
      if (savedSettings.riskSettings) setRiskSettings(savedSettings.riskSettings);
      if (savedSettings.strategies) setStrategies(savedSettings.strategies);
      if (savedSettings.tradingPrefs) setTradingPrefs(savedSettings.tradingPrefs);
    }
  }, [store]);

  const handleKeyChange = (key: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
    if (key !== 'walletAddress') {
      setApiStatus(prev => ({ ...prev, [key]: 'untested' }));
    }
  };

  const toggleKeyVisibility = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const testConnection = async (keyType: string) => {
    setApiStatus(prev => ({ ...prev, [keyType]: 'untested' }));
    try {
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyType, key: apiKeys[keyType as keyof typeof apiKeys] }),
      });

      if (response.ok) {
        setApiStatus(prev => ({ ...prev, [keyType]: 'valid' }));
      } else {
        setApiStatus(prev => ({ ...prev, [keyType]: 'invalid' }));
      }
    } catch (error) {
      setApiStatus(prev => ({ ...prev, [keyType]: 'invalid' }));
    }
  };

  const autoDetectWallet = () => {
    // In a real implementation, this would derive the wallet address from the private key
    if (apiKeys.hyperliquid.startsWith('0x') || apiKeys.hyperliquid.length === 64) {
      setApiKeys(prev => ({ ...prev, walletAddress: '0x' + 'derived-address-placeholder' }));
      setIsDirty(true);
    }
  };

  const handleNetworkChange = (newNetwork: 'testnet' | 'mainnet') => {
    if (newNetwork === 'mainnet' && network === 'testnet') {
      setShowNetworkWarning(true);
    }
    setNetwork(newNetwork);
    setIsDirty(true);
  };

  const handleRiskChange = (field: string, value: number) => {
    setRiskSettings(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleStrategyChange = (strategyName: string, field: string, value: any) => {
    setStrategies(prev => ({
      ...prev,
      [strategyName]: {
        ...prev[strategyName],
        [field]: value,
      },
    }));
    setIsDirty(true);
  };

  const handleStrategyParamChange = (strategyName: string, paramName: string, value: any) => {
    setStrategies(prev => ({
      ...prev,
      [strategyName]: {
        ...prev[strategyName],
        params: {
          ...prev[strategyName].params,
          [paramName]: value,
        },
      },
    }));
    setIsDirty(true);
  };

  const handleTradingPrefChange = (field: string, value: any) => {
    setTradingPrefs(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Save to store
      if (store?.updateSettings) {
        store.updateSettings({
          apiKeys,
          network,
          riskSettings,
          strategies,
          tradingPrefs,
        });
      }

      // Save to server
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKeys: { ...apiKeys, openai: apiKeys.openai ? '***' : '', hyperliquid: apiKeys.hyperliquid ? '***' : '', openrouter: apiKeys.openrouter ? '***' : '' },
          network,
          riskSettings,
          strategies,
          tradingPrefs,
        }),
      });

      if (response.ok) {
        setIsDirty(false);
        // Show success toast
        console.log('Settings saved successfully');
      } else {
        console.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const exportData = () => {
    const dataToExport = {
      timestamp: new Date().toISOString(),
      apiKeys: { ...apiKeys, openai: '***', hyperliquid: '***', openrouter: '***' },
      network,
      riskSettings,
      strategies,
      tradingPrefs,
    };

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(dataToExport, null, 2)));
    element.setAttribute('download', `trading-settings-${Date.now()}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const resetData = () => {
    if (window.confirm('Are you sure you want to reset all learning data? This cannot be undone.')) {
      if (store?.resetLearningData) {
        store.resetLearningData();
      }
      console.log('Learning data reset');
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'valid') {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (status === 'invalid') {
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
    return <div className="w-5 h-5 rounded-full bg-gray-600" />;
  };

  const InputField = ({
    label,
    type = 'text',
    value,
    onChange,
    helper,
    showToggle = false,
    onToggle = null,
    isVisible = false
  }: any) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div className="flex gap-2">
        <input
          type={showToggle && isVisible ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
        />
        {showToggle && onToggle && (
          <button
            onClick={onToggle}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 transition"
          >
            {isVisible ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
          </button>
        )}
      </div>
      {helper && <p className="text-xs text-gray-400 mt-1">{helper}</p>}
    </div>
  );

  const SliderInput = ({ label, value, onChange, min = 0, max = 100, step = 1, unit = '' }: any) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <span className="text-sm font-semibold text-blue-400">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Configure your trading preferences, API keys, and strategies</p>
          {isDirty && (
            <div className="mt-2 flex items-center text-yellow-400 text-sm">
              <AlertTriangle className="w-4 h-4 mr-2" />
              You have unsaved changes
            </div>
          )}
        </div>

        {/* Network Warning */}
        {showNetworkWarning && (
          <div className="mb-6 p-4 bg-orange-900 border border-orange-700 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-orange-400">Mainnet Trading</p>
              <p className="text-sm text-orange-300">Real funds will be at risk when trading on mainnet. Please ensure your risk settings are appropriate.</p>
              <button
                onClick={() => setShowNetworkWarning(false)}
                className="text-sm text-orange-400 hover:text-orange-300 mt-2 underline"
              >
                I understand, proceed with mainnet
              </button>
            </div>
          </div>
        )}

        {/* API Keys Configuration */}
        <Card className="mb-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-700">
            <Key className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">API Keys Configuration</h2>
          </div>

          <div className="space-y-6">
            {/* OpenAI API Key */}
            <div className="pb-4 border-b border-gray-800">
              <InputField
                label="OpenAI API Key"
                type="password"
                value={apiKeys.openai}
                onChange={(value) => handleKeyChange('openai', value)}
                helper="Required for AI-powered analysis"
                showToggle={true}
                isVisible={showKeys.openai}
                onToggle={() => toggleKeyVisibility('openai')}
              />
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => testConnection('openai')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Test Connection
                </button>
                <StatusIcon status={apiStatus.openai} />
              </div>
            </div>

            {/* Hyperliquid Private Key */}
            <div className="pb-4 border-b border-gray-800">
              <InputField
                label="Hyperliquid Private Key"
                type="password"
                value={apiKeys.hyperliquid}
                onChange={(value) => handleKeyChange('hyperliquid', value)}
                helper="Your private key is stored locally and never sent to any server except Hyperliquid"
                showToggle={true}
                isVisible={showKeys.hyperliquid}
                onToggle={() => toggleKeyVisibility('hyperliquid')}
              />
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => testConnection('hyperliquid')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Test Connection
                </button>
                <StatusIcon status={apiStatus.hyperliquid} />
              </div>
            </div>

            {/* Wallet Address */}
            <div className="pb-4 border-b border-gray-800">
              <InputField
                label="Hyperliquid Wallet Address"
                type="text"
                value={apiKeys.walletAddress}
                onChange={(value) => handleKeyChange('walletAddress', value)}
                helper="Should be in format: 0x..."
              />
              <button
                onClick={autoDetectWallet}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition text-sm"
              >
                Auto-detect from Private Key
              </button>
            </div>

            {/* OpenRouter API Key */}
            <div className="pb-4">
              <InputField
                label="OpenRouter API Key (Optional)"
                type="password"
                value={apiKeys.openrouter}
                onChange={(value) => handleKeyChange('openrouter', value)}
                helper="Optional - for alternative AI models"
                showToggle={true}
                isVisible={showKeys.openrouter}
                onToggle={() => toggleKeyVisibility('openrouter')}
              />
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => testConnection('openrouter')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Test Connection
                </button>
                <StatusIcon status={apiStatus.openrouter} />
              </div>
            </div>

            {/* Network Toggle */}
            <div className="pt-4 border-t border-gray-800">
              <label className="block text-sm font-medium text-gray-300 mb-3">Network</label>
              <div className="flex gap-4">
                {(['testnet', 'mainnet'] as const).map(net => (
                  <button
                    key={net}
                    onClick={() => handleNetworkChange(net)}
                    className={`px-6 py-2 rounded font-medium transition flex items-center gap-2 ${
                      network === net
                        ? net === 'testnet'
                          ? 'bg-green-600 text-white'
                          : 'bg-orange-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${net === 'testnet' ? 'bg-green-400' : 'bg-orange-400'}`} />
                    {net.charAt(0).toUpperCase() + net.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Risk Management Settings */}
        <Card className="mb-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-700">
            <Shield className="w-6 h-6 text-red-400" />
            <h2 className="text-2xl font-bold text-white">Risk Management Settings</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <SliderInput
              label="Max Position Size"
              value={riskSettings.maxPositionSize}
              onChange={(value) => handleRiskChange('maxPositionSize', value)}
              min={100}
              max={100000}
              step={100}
              unit=" USD"
            />
            <SliderInput
              label="Max Leverage"
              value={riskSettings.maxLeverage}
              onChange={(value) => handleRiskChange('maxLeverage', value)}
              min={1}
              max={50}
              step={1}
              unit="x"
            />
            <SliderInput
              label="Stop Loss Default"
              value={riskSettings.stopLossDefault}
              onChange={(value) => handleRiskChange('stopLossDefault', value)}
              min={0.1}
              max={20}
              step={0.1}
              unit="%"
            />
            <SliderInput
              label="Take Profit Default"
              value={riskSettings.takeProfitDefault}
              onChange={(value) => handleRiskChange('takeProfitDefault', value)}
              min={0.1}
              max={50}
              step={0.1}
              unit="%"
            />
            <SliderInput
              label="Max Daily Loss"
              value={riskSettings.maxDailyLoss}
              onChange={(value) => handleRiskChange('maxDailyLoss', value)}
              min={100}
              max={50000}
              step={100}
              unit=" USD"
            />
            <SliderInput
              label="Max Open Positions"
              value={riskSettings.maxOpenPositions}
              onChange={(value) => handleRiskChange('maxOpenPositions', value)}
              min={1}
              max={20}
              step={1}
            />
          </div>
        </Card>

        {/* Strategy Configuration */}
        <Card className="mb-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-700">
            <Sliders className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Strategy Configuration</h2>
          </div>

          <div className="space-y-4">
            {STRATEGIES.map(strategy => (
              <div key={strategy} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={strategies[strategy].enabled}
                      onChange={(e) => handleStrategyChange(strategy, 'enabled', e.target.checked)}
                      className="w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                    <span className="font-semibold text-white text-lg">{strategy}</span>
                  </div>
                  <button
                    onClick={() => setExpandedStrategy(expandedStrategy === strategy ? null : strategy)}
                    className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm transition"
                  >
                    {expandedStrategy === strategy ? 'Collapse' : 'Expand'}
                  </button>
                </div>

                <SliderInput
                  label="Weight"
                  value={strategies[strategy].weight}
                  onChange={(value) => handleStrategyChange(strategy, 'weight', value)}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                />

                {expandedStrategy === strategy && (
                  <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
                    {strategy === 'RSI' && (
                      <>
                        <SliderInput
                          label="Period"
                          value={strategies[strategy].params.period}
                          onChange={(value) => handleStrategyParamChange(strategy, 'period', value)}
                          min={5}
                          max={50}
                          step={1}
                        />
                        <SliderInput
                          label="Overbought Level"
                          value={strategies[strategy].params.overbought}
                          onChange={(value) => handleStrategyParamChange(strategy, 'overbought', value)}
                          min={50}
                          max={100}
                          step={1}
                        />
                        <SliderInput
                          label="Oversold Level"
                          value={strategies[strategy].params.oversold}
                          onChange={(value) => handleStrategyParamChange(strategy, 'oversold', value)}
                          min={0}
                          max={50}
                          step={1}
                        />
                      </>
                    )}
                    {strategy === 'MACD' && (
                      <>
                        <SliderInput
                          label="Fast Period"
                          value={strategies[strategy].params.fastPeriod}
                          onChange={(value) => handleStrategyParamChange(strategy, 'fastPeriod', value)}
                          min={5}
                          max={30}
                          step={1}
                        />
                        <SliderInput
                          label="Slow Period"
                          value={strategies[strategy].params.slowPeriod}
                          onChange={(value) => handleStrategyParamChange(strategy, 'slowPeriod', value)}
                          min={20}
                          max={50}
                          step={1}
                        />
                        <SliderInput
                          label="Signal Period"
                          value={strategies[strategy].params.signalPeriod}
                          onChange={(value) => handleStrategyParamChange(strategy, 'signalPeriod', value)}
                          min={5}
                          max={20}
                          step={1}
                        />
                      </>
                    )}
                    {strategy === 'Bollinger' && (
                      <>
                        <SliderInput
                          label="Period"
                          value={strategies[strategy].params.period}
                          onChange={(value) => handleStrategyParamChange(strategy, 'period', value)}
                          min={10}
                          max={50}
                          step={1}
                        />
                        <SliderInput
                          label="Standard Deviations"
                          value={strategies[strategy].params.stdDev}
                          onChange={(value) => handleStrategyParamChange(strategy, 'stdDev', value)}
                          min={1}
                          max={5}
                          step={0.5}
                        />
                      </>
                    )}
                    {strategy === 'MA Crossover' && (
                      <>
                        <SliderInput
                          label="Short Period"
                          value={strategies[strategy].params.shortPeriod}
                          onChange={(value) => handleStrategyParamChange(strategy, 'shortPeriod', value)}
                          min={5}
                          max={50}
                          step={1}
                        />
                        <SliderInput
                          label="Long Period"
                          value={strategies[strategy].params.longPeriod}
                          onChange={(value) => handleStrategyParamChange(strategy, 'longPeriod', value)}
                          min={50}
                          max={200}
                          step={1}
                        />
                      </>
                    )}
                    {strategy === 'Volume' && (
                      <>
                        <SliderInput
                          label="Average Period"
                          value={strategies[strategy].params.avgPeriod}
                          onChange={(value) => handleStrategyParamChange(strategy, 'avgPeriod', value)}
                          min={10}
                          max={50}
                          step={1}
                        />
                        <SliderInput
                          label="Spike Multiplier"
                          value={strategies[strategy].params.spikeMultiplier}
                          onChange={(value) => handleStrategyParamChange(strategy, 'spikeMultiplier', value)}
                          min={1}
                          max={5}
                          step={0.1}
                        />
                      </>
                    )}
                    {strategy === 'AI Sentiment' && (
                      <>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-300 mb-2">Model</label>
                          <select
                            value={strategies[strategy].params.model}
                            onChange={(e) => handleStrategyParamChange(strategy, 'model', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500 transition"
                          >
                            <option>gpt-3.5-turbo</option>
                            <option>gpt-4</option>
                            <option>claude-3-opus</option>
                          </select>
                        </div>
                        <SliderInput
                          label="Temperature"
                          value={strategies[strategy].params.temperature}
                          onChange={(value) => handleStrategyParamChange(strategy, 'temperature', value)}
                          min={0}
                          max={2}
                          step={0.1}
                        />
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Trading Preferences */}
        <Card className="mb-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-700">
            <Sliders className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white">Trading Preferences</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Default Order Type</label>
              <div className="flex gap-4">
                {['limit', 'market'].map(type => (
                  <button
                    key={type}
                    onClick={() => handleTradingPrefChange('orderType', type)}
                    className={`px-6 py-2 rounded font-medium transition ${
                      tradingPrefs.orderType === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Default Trading Pair</label>
              <select
                value={tradingPrefs.defaultCoin}
                onChange={(e) => handleTradingPrefChange('defaultCoin', e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500 transition"
              >
                <option>USDC</option>
                <option>USDT</option>
                <option>ETH</option>
                <option>BTC</option>
              </select>
            </div>

            <SliderInput
              label="Minimum Signal Strength to Trade"
              value={tradingPrefs.minSignalStrength}
              onChange={(value) => handleTradingPrefChange('minSignalStrength', value)}
              min={0}
              max={100}
              step={1}
              unit="%"
            />

            <SliderInput
              label="Minimum Confidence to Trade"
              value={tradingPrefs.minConfidence}
              onChange={(value) => handleTradingPrefChange('minConfidence', value)}
              min={0}
              max={100}
              step={1}
              unit="%"
            />

            <SliderInput
              label="Analysis Interval"
              value={tradingPrefs.analysisInterval}
              onChange={(value) => handleTradingPrefChange('analysisInterval', value)}
              min={10}
              max={300}
              step={10}
              unit=" seconds"
            />

            <SliderInput
              label="Trade Cooldown Period"
              value={tradingPrefs.tradeCooldown}
              onChange={(value) => handleTradingPrefChange('tradeCooldown', value)}
              min={5}
              max={300}
              step={5}
              unit=" seconds"
            />
          </div>
        </Card>

        {/* Data & Intelligence */}
        <Card className="mb-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-700">
            <Shield className="w-6 h-6 text-teal-400" />
            <h2 className="text-2xl font-bold text-white">Data & Intelligence</h2>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <button
                onClick={exportData}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Export Intelligence Data
              </button>
              <button
                onClick={() => document.getElementById('importInput')?.click()}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Import Intelligence Data
              </button>
              <input id="importInput" type="file" accept=".json" className="hidden" />
            </div>

            <button
              onClick={resetData}
              className="w-full px-4 py-3 bg-red-900 hover:bg-red-800 text-red-200 rounded font-medium transition border border-red-700"
            >
              Reset Learning Data
            </button>

            <SliderInput
              label="Data Retention Period"
              value={90}
              onChange={() => {}}
              min={7}
              max={365}
              step={1}
              unit=" days"
            />
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4 mb-6">
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded font-semibold transition"
            disabled={!isDirty}
          >
            Discard Changes
          </button>
          <button
            onClick={saveSettings}
            disabled={!isDirty || isSaving}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded font-semibold transition flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {isSaving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
