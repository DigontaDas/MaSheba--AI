import { useEffect, useState } from "react";
import { MotherDashboard } from "@/features/mother/MotherDashboard";
import { getCurrentMotherProfile } from "@/auth/roleSession";

export default function MotherHomeScreen() {
  const [week, setWeek] = useState(24);

  useEffect(() => {
    getCurrentMotherProfile()
      .then((profile) => {
        if (profile?.gestationalAgeWeeks) {
          setWeek(profile.gestationalAgeWeeks);
        }
      })
      .catch(() => undefined);
  }, []);

  return <MotherDashboard week={week} />;
}
