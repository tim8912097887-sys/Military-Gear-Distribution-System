import type { GearStatusResponse } from "../../../features/reservist-gears/types";

export type BuildReservistGearStatusProps = Partial<GearStatusResponse>;

export function buildReservistGearStatus(
  props: BuildReservistGearStatusProps,
): GearStatusResponse {
  const baseStatus: GearStatusResponse = {
    reservist: {
      id: crypto.randomUUID().toString(),
      name: "Test Reservist",
      militaryRank: "Test Rank",
      checkedInAt: new Date().toISOString(),
    },
    holdings: {
      bulk: [],
      serialized: [],
    },
    allowance: [],
    availability: [],
  };

  if (props.reservist) {
    baseStatus.reservist = {
      ...baseStatus.reservist,
      ...props.reservist,
    };
  }

  if (props.holdings && props.holdings.bulk) {
    baseStatus.holdings.bulk = [
      ...baseStatus.holdings.bulk,
      ...props.holdings.bulk,
    ];
  }

  if (props.holdings && props.holdings.serialized) {
    baseStatus.holdings.serialized = [
      ...baseStatus.holdings.serialized,
      ...props.holdings.serialized,
    ];
  }

  if (props.allowance) {
    baseStatus.allowance = [...baseStatus.allowance, ...props.allowance];
  }

  if (props.availability) {
    baseStatus.availability = [
      ...baseStatus.availability,
      ...props.availability,
    ];
  }

  return baseStatus;
}
