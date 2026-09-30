import GearAllowanceSectionSkeleton from "./GearAllowanceSectionSkeleton";
import GearHoldingSectionSkeleton from "./GearHoldingSectionSkeleton";
import {
  IssueGearPanelSkeleton,
  ReturnGearPanelSkeleton,
} from "./GearPanelSkeleton";
import ReservistGearPageHeaderSkeleton from "./ReservistGearPageHeaderSkeleton";

const ReservistGearPageSkeleton = () => {
  return (
    <div className="space-y-6">
      <ReservistGearPageHeaderSkeleton />

      <GearHoldingSectionSkeleton />

      <GearAllowanceSectionSkeleton />

      <div className="grid gap-6 lg:grid-cols-2">
        <IssueGearPanelSkeleton />
        <ReturnGearPanelSkeleton />
      </div>
    </div>
  );
};

export default ReservistGearPageSkeleton;
