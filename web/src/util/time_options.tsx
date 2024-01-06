export const timeOptions = [
  {
    uid: "today",
    name: "Today",
    start: (now: Date) => {
      return now.getTime() - now.getHours() * 60 * 60 * 1000;
    },
    end: (now: Date) => {
      return now.getTime();
    },
  },
  {
    uid: "yesterday",
    name: "Yesterday",
    start: (now: Date) => {
      const yesterday = new Date(Date.now() - 86400000);
      return new Date(
        yesterday.getFullYear(),
        yesterday.getMonth(),
        yesterday.getDate()
      ).getTime();
    },
    end: (now: Date) => {
      const yesterday = new Date(Date.now() - 86400000);
      return new Date(
        yesterday.getFullYear(),
        yesterday.getMonth(),
        yesterday.getDate(),
        23,
        59,
        59
      ).getTime();
    },
  },
  {
    uid: "last_week",
    name: "Last Week",
    start: (now: Date) => {
      return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 7
      ).getTime();
    },
    end: (now: Date) => {
      return new Date().getTime();
    },
  },
  {
    uid: "last_month",
    name: "Last Month",
    start: (now: Date) => {
      return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 30
      ).getTime();
    },
    end: (now: Date) => {
      return new Date().getTime();
    },
  },
];

const getTimeOptions = (uid: string) => {
  const now = new Date();

  const timeOption = timeOptions.find((d) => d.uid == uid) ?? timeOptions[0];

  return {
    uid: timeOption.uid,
    name: timeOption.name,
    start: timeOption.start(now),
    end: timeOption.end(now),
  };
};

export default getTimeOptions;
