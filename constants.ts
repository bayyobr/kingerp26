import { Checklist, ServiceOrder, OSStatus } from './types';

export const CHECKLIST_LABELS: Record<keyof Checklist, string> = {
  faceId: 'Face ID',
  frontCamera: 'Câmera Frontal',
  backCamera: 'Câmera Traseira',
  mic: 'Microfone',
  speaker: 'Alto-Falante',
  earpiece: 'Auricular',
  flash: 'Flash',
  nfc: 'NFC',
  connector: 'Conector Carga',
  signal: 'Sinal / Chip',
  display: 'Tela / Display',
  proxSensor: 'Sensor Prox.',
  buttons: 'Botões',
  others: 'Outros',
  wifi: 'Wi-Fi / BT',
  battery: 'Bateria',
  touch: 'Touch 3D'
};

export const INITIAL_CHECKLIST: Checklist = {
  faceId: true,
  frontCamera: true,
  backCamera: true,
  mic: true,
  speaker: true,
  earpiece: true,
  flash: true,
  nfc: true,
  connector: true,
  signal: true,
  display: true,
  proxSensor: true,
  buttons: true,
  others: true,
  wifi: true,
  battery: true,
  touch: true,
};

export const STATUS_COLORS = {
  'Aberto': 'bg-blue-100 text-blue-800',
  'Em Análise': 'bg-yellow-100 text-yellow-800',
  'Aguardando Peças': 'bg-orange-100 text-orange-800',
  'Pronto p/ Retirada': 'bg-green-100 text-green-800',
  'Concluído': 'bg-gray-100 text-gray-800',
  'Cancelado': 'bg-red-100 text-red-800'
};

export const IPHONE_MODELS = [
  // 8 Series
  "iPhone 8", "iPhone 8 Plus",
  // X Series
  "iPhone X", "iPhone XR", "iPhone XS", "iPhone XS Max",
  // 11 Series
  "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max",
  // 12 Series
  "iPhone 12", "iPhone 12 Mini", "iPhone 12 Pro", "iPhone 12 Pro Max",
  // 13 Series
  "iPhone 13", "iPhone 13 Mini", "iPhone 13 Pro", "iPhone 13 Pro Max",
  // 14 Series
  "iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max",
  // 15 Series
  "iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max",
  // 16 Series
  "iPhone 16", "iPhone 16 Plus", "iPhone 16 Pro", "iPhone 16 Pro Max",
  // 17 Series (Future)
  "iPhone 17", "iPhone 17 Plus", "iPhone 17 Pro", "iPhone 17 Pro Max"
];
