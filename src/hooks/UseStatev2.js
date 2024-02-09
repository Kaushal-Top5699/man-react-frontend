import { useEffect, useRef, useState } from "react";

/**
 * @param {any} initialValue Initial value
 * @returns {[ Function, Function ]}
 */
export function useStatev2(initialValue) {
  const valueRef = useRef(initialValue);
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  /**
   * @param {typeof initialValue | Function} arg
   */
  function customSetValue(arg) {
    if (typeof arg === "function") {
      const updatedValue = arg(valueRef.current);
      valueRef.current = updatedValue;
      return setValue(updatedValue);
    }

    valueRef.current = arg;
    return setValue(arg);
  }

  return [() => valueRef.current, customSetValue];
}
