import naturalOrder from "natural-order";

export default function useTimeZones() {
  const unformmatedTimeZones = Intl.supportedValuesOf("timeZone");

  const getTimeZoneName = computed(() => {
    return (timeZone: string) => {
      try {
        const dateTimeFormat = new Intl.DateTimeFormat(navigator.language, {
          timeZoneName: "longGeneric",
          timeZone,
        });
        const parts = dateTimeFormat.formatToParts();
        const timeZoneName = parts.find(
          (part) => part.type === "timeZoneName"
        )?.value;
        return { timeZone, timeZoneName };
      } catch {
        return { timeZone, timeZoneName: undefined };
      }
    };
  });

  const timeZones = computed(() => {
    return naturalOrder(
      unformmatedTimeZones
        .map((timeZone) => getTimeZoneName.value(timeZone))
        .filter(
          (timeZone, index, arr) =>
            !!timeZone.timeZoneName &&
            arr.findIndex((tz) => tz.timeZoneName === timeZone.timeZoneName) ===
              index
        ) as {
        timeZone: string;
        timeZoneName: string;
      }[]
    )
      .orderBy("asc")
      .sort(["timeZoneName"]);
  });

  return { timeZones, getTimeZoneName };
}
