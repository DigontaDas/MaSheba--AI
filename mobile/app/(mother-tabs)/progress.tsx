import { useEffect, useState } from "react";
import { MotherDashboard } from "@/features/mother/MotherDashboard";
import { getCurrentMotherProfile } from "@/auth/roleSession";

export default function MotherProgressScreen() {
  const [week, setWeek] = useState(40);

  useEffect(() => {
    getCurrentMotherProfile()
      .then((profile) => {
        if (profile?.gestationalAgeWeeks) {
          setWeek(profile.gestationalAgeWeeks);
        }
      })
      .catch(() => undefined);
  }, []);

  return <MotherDashboard variant="progress" week={week} />;
}
