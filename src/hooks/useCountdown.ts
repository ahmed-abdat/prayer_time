import { useState, useEffect, useCallback, useRef } from 'react';

export const useCountdown = (targetDate: Date) => {
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');
  const timerRef = useRef<NodeJS.Timeout>();

  const calculateTimeLeft = useCallback(() => {
    const now = new Date();
    const difference = targetDate.getTime() - now.getTime();

    if (difference <= 0) {
      return '00:00:00';
    }

    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [targetDate]);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const initialTime = calculateTimeLeft();
    setTimeLeft(initialTime);

    if (initialTime !== '00:00:00') {
      timerRef.current = setInterval(() => {
        const newTimeLeft = calculateTimeLeft();
        setTimeLeft(newTimeLeft);
        
        if (newTimeLeft === '00:00:00' && timerRef.current) {
          clearInterval(timerRef.current);
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [calculateTimeLeft]);

  return timeLeft;
}; 