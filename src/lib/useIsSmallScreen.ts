import { useEffect, useState } from 'react';

/**
 * 是否为窄屏（手机）。
 *
 * 3D 场景在手机上要同时降采样、关实时阴影、换低模，都需要这个判断。
 * 用 matchMedia 而不是 UA，横竖屏切换、平板分屏都能正确响应。
 */
export function useIsSmallScreen(breakpoint = 768) {
  const [small, setSmall] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(`(max-width: ${breakpoint}px)`).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const onChange = () => setSmall(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [breakpoint]);

  return small;
}
