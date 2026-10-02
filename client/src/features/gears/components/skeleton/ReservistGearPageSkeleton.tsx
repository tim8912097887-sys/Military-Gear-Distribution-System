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

      <div className="mt-6 space-y-6">
        <GearHoldingSectionSkeleton />
        <GearAllowanceSectionSkeleton />
        <IssueGearPanelSkeleton />
        <ReturnGearPanelSkeleton />
      </div>
    </div>
  );
};

export default ReservistGearPageSkeleton;
