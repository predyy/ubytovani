"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type BookingDateSelection = {
  checkInDate: string | null;
  checkOutDate: string | null;
};

type BookingSelectionContextValue = {
  selection: BookingDateSelection;
  setSelection: React.Dispatch<React.SetStateAction<BookingDateSelection>>;
  resetSelection: () => void;
};

const BookingSelectionContext =
  createContext<BookingSelectionContextValue | null>(null);

function useBookingSelectionState(): BookingSelectionContextValue {
  const [selection, setSelection] = useState<BookingDateSelection>({
    checkInDate: null,
    checkOutDate: null,
  });

  const resetSelection = useCallback(() => {
    setSelection({ checkInDate: null, checkOutDate: null });
  }, []);

  return useMemo(
    () => ({ selection, setSelection, resetSelection }),
    [selection, resetSelection],
  );
}

export function BookingSelectionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const value = useBookingSelectionState();
  return (
    <BookingSelectionContext.Provider value={value}>
      {children}
    </BookingSelectionContext.Provider>
  );
}

export function useBookingSelection() {
  const context = useContext(BookingSelectionContext);
  const fallback = useBookingSelectionState();
  return context ?? fallback;
}
