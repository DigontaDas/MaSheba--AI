import { HospitalManager } from "@/components/HospitalManager";
import { getHospitals } from "@/utils/admin-api";

export const dynamic = "force-dynamic";

export default async function HospitalsPage() {
  const items = await getHospitals();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-headline-lg text-headline-lg text-on-background">Emergency Contacts & Hospitals</h2>
        <p className="mt-1 font-body-md text-body-md text-on-surface-variant text-sm">
          Manage clinical facilities, emergency response helplines, ambulance centers, and partners linked with MaaSheba.
        </p>
      </div>
      <HospitalManager items={items} />
    </div>
  );
}
