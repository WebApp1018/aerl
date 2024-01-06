import getTimeOptions from "@/util/time_options";
import { createContext, ReactNode } from "react";

export const TimeContext = createContext({ start: getTimeOptions("today").start, end: getTimeOptions("today").end });

export default function TimeContextProvider({ value, children }: { value: any, children: ReactNode }) {
  return (
    <TimeContext.Provider value={value}>
      {children}
    </TimeContext.Provider>
  )
}
