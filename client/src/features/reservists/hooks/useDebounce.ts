import { useEffect, useState } from "react";

type UseDebounceProps<T> = {
  delay: number;
  value: T;
};

const useDebounce = <T>({ delay, value }: UseDebounceProps<T>) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);
  return debouncedValue;
};

export default useDebounce;
