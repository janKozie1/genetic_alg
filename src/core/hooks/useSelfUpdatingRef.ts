import type { MutableRefObject } from 'react';
import { useRef } from 'react';

const useSelfUpdatingRef = <T>(arg: T): MutableRefObject<T> => {
  const memoized = useRef(arg);
  memoized.current = arg;

  return memoized;
};

export default useSelfUpdatingRef;