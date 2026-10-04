import { reservistUrl } from '../reservists/constants.js';

export const gearStatusUrl = (reservistId: string): string => `${reservistUrl(reservistId)}/gears`;
export const gearIssueUrl = (reservistId: string): string => `${gearStatusUrl(reservistId)}/issue`;
export const gearReturnUrl = (reservistId: string): string =>
  `${gearStatusUrl(reservistId)}/return`;

export const GEAR_CATEGORIES = {
  HELMET: {
    name: 'Tactical Helmet',
    trackingType: 'SERIALIZED',
    maxPerReservist: 1,
    requiresSize: true,
  },
  SHIRT: {
    name: 'Camouflage Uniform shirt',
    trackingType: 'BULK',
    maxPerReservist: 3,
    requiresSize: true,
  },
  PANTS: {
    name: 'Camouflage Uniform pant',
    trackingType: 'BULK',
    maxPerReservist: 3,
    requiresSize: true,
  },
} as const;

export const GEAR_SIZES = ['S', 'M'] as const;

export const RESERVIST_GEAR_TABLE_NAME = 'reservist_bulk_gear';
export const RESERVIST_GEAR_BROKEN_TABLE_NAME = `${RESERVIST_GEAR_TABLE_NAME}_broken`;

export const SERIALIZED_GEAR_DB_STATUSES = {
  ISSUED: 'ISSUED',
  MAINTENANCE: 'MAINTENANCE',
  AVAILABLE: 'AVAILABLE',
  LOST: 'LOST',
};

export const SERIALIZED_GEAR_RETURN_CONDITIONS = {
  SERVICEABLE: 'SERVICEABLE',
  DAMAGED: 'DAMAGED',
  LOST: 'LOST',
};
