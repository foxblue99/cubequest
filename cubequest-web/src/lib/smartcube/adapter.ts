/**
 * SmartCube Adapter — 智能魔方蓝牙接入接口定义
 * V3.6.1 Phase 4: 仅定义接口，不实现具体品牌驱动
 * 
 * iOS Safari 不支持 Web Bluetooth，isSupported() 需做平台检测
 */

export interface SmartCubeMoveEvent {
  face: 'U' | 'D' | 'L' | 'R' | 'F' | 'B';
  direction: 1 | -1;   // 1=顺时针 -1=逆时针
  timestamp: number;   // 相对于连接开始的毫秒数
}

export interface SmartCubeAdapter {
  readonly brand: 'GAN' | 'MOYU' | 'QIYI';

  /** 检测当前环境是否支持 Web Bluetooth */
  isSupported(): boolean;

  /** 建立蓝牙连接 */
  connect(): Promise<void>;

  /** 断开蓝牙连接 */
  disconnect(): void;

  /** 注册魔方转动事件回调 */
  onMove(callback: (e: SmartCubeMoveEvent) => void): void;

  /** 电池电量回调（可选） */
  onBatteryLevel?(callback: (level: number) => void): void;
}

/** 平台检测：iOS Safari 不支持 Web Bluetooth */
export function isBluetoothSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  return 'bluetooth' in navigator;
}

/** 各品牌适配器工厂（空实现，供后续实现） */
export class GanCubeAdapter implements SmartCubeAdapter {
  readonly brand = 'GAN' as const;
  isSupported(): boolean { return isBluetoothSupported(); }
  async connect(): Promise<void> { throw new Error('未实现 — 需接入 GAN 蓝牙协议'); }
  disconnect(): void {}
  onMove(_callback: (e: SmartCubeMoveEvent) => void): void {}
  onBatteryLevel?(_callback: (level: number) => void): void {}
}
