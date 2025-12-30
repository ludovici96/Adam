import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { Sun, Moon, Zap, Bell, BellOff, Clock } from 'lucide-react';

export function PowerHourClock({
    schedule,
    interactionMode = true,
    children,
    size = 360
}) {
    const [now, setNow] = useState(new Date());
    const [notifyEnabled, setNotifyEnabled] = useState(false);
    const [hoveredSegment, setHoveredSegment] = useState(null);

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const currentHour = now.getHours() + now.getMinutes() / 60;

    // SVG Math
    const center = size / 2;
    const radius = (size / 2) - 65; // Increased padding to prevent label cutoff
    const circumference = 2 * Math.PI * radius;
    const strokeWidth = 12;

    // Helper to convert time (0-24) to degrees (0-360), starting at top (00:00)
    // 00:00 is -90deg in SVG space (3 o'clock is 0)
    // Actually, let's map 00:00 to Top (-90deg).
    const timeToDegrees = (time) => ((time / 24) * 360) - 90;

    // Helper to calculate arc path for a segment
    // Handling wrap-around (e.g., 22:00 to 06:00) is tricky with simple stroke-dasharray
    // We'll render multiple arcs if needed or just use simple rotation logic for non-wrapping blocks first
    // However, "Recovery" usually wraps.

    const segments = useMemo(() => {
        if (!schedule || !schedule.windows) return [];

        return schedule.windows.flatMap(window => {
            let start = window.start;
            let end = window.end;

            // Handle wrap around (e.g. 23 to 7)
            if (end < start) {
                return [
                    { ...window, start: start, end: 24, part: 1 },
                    { ...window, start: 0, end: end, part: 2 }
                ];
            }
            return [window];
        });
    }, [schedule]);

    const getSegmentPath = (start, end) => {
        // Describe arc
        const startAngle = (start / 24) * Math.PI * 2 - Math.PI / 2;
        const endAngle = (end / 24) * Math.PI * 2 - Math.PI / 2;

        const x1 = center + radius * Math.cos(startAngle);
        const y1 = center + radius * Math.sin(startAngle);
        const x2 = center + radius * Math.cos(endAngle);
        const y2 = center + radius * Math.sin(endAngle);

        const largeArcFlag = end - start > 12 ? 1 : 0; // > 180 degrees

        return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
    };

    // Current Time Indicator Position
    const indicatorAngle = (currentHour / 24) * 360; // 0 is top? No, 0 is 00:00.
    // In SVG rotation transform, 0 is usually 3 o'clock + rotation.
    // We'll rotate the whole indicator group.

    return (
        <div className="relative flex flex-col items-center">
            {/* Container with specified size */}
            <div
                className="relative"
                style={{ width: size, height: size }}
            >
                {/* Background Rings */}
                <svg
                    width={size}
                    height={size}
                    className="absolute inset-0 rotate-0 pointer-events-none"
                >
                    {/* Base Ring (24h Track) */}
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-stone-200 dark:text-white/10"
                    />

                    {/* Hour Ticks */}
                    {Array.from({ length: 24 }).map((_, i) => {
                        const angle = (i / 24) * 360 - 90;
                        const x1 = center + (radius - 8) * Math.cos((angle * Math.PI) / 180);
                        const y1 = center + (radius - 8) * Math.sin((angle * Math.PI) / 180);
                        const x2 = center + (radius + 8) * Math.cos((angle * Math.PI) / 180);
                        const y2 = center + (radius + 8) * Math.sin((angle * Math.PI) / 180);
                        const isMajor = i % 6 === 0;

                        return (
                            <line
                                key={i}
                                x1={i % 3 === 0 ? x1 : center + (radius - 4) * Math.cos((angle * Math.PI) / 180)}
                                y1={i % 3 === 0 ? y1 : center + (radius - 4) * Math.sin((angle * Math.PI) / 180)}
                                x2={i % 3 === 0 ? x2 : center + (radius + 4) * Math.cos((angle * Math.PI) / 180)}
                                y2={i % 3 === 0 ? y2 : center + (radius + 4) * Math.sin((angle * Math.PI) / 180)}
                                stroke="currentColor"
                                strokeWidth={isMajor ? 2 : 1}
                                className={isMajor ? "text-stone-300 dark:text-white/20" : "text-stone-100 dark:text-white/5"}
                            />
                        );
                    })}

                    {/* Time Labels (0, 6, 12, 18) */}
                    <text x={center} y={center - radius - 20} textAnchor="middle" className="text-[10px] font-mono fill-stone-400">00:00</text>
                    <text x={center} y={center + radius + 25} textAnchor="middle" className="text-[10px] font-mono fill-stone-400">12:00</text>
                    <text x={center + radius + 25} y={center + 3} textAnchor="start" className="text-[10px] font-mono fill-stone-400">06:00</text>
                    <text x={center - radius - 25} y={center + 3} textAnchor="end" className="text-[10px] font-mono fill-stone-400">18:00</text>
                </svg>

                {/* Activity Segments (Interactive Layer) */}
                <svg
                    width={size}
                    height={size}
                    className="absolute inset-0 pointer-events-auto"
                >
                    <defs>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {segments.map((seg, i) => {
                        const isLowIntensity = seg.intensity === 'low';
                        // Thin stroke for transitions (4px), Thick for peaks (12px)
                        const baseStroke = isLowIntensity ? 4 : strokeWidth;
                        const activeStroke = hoveredSegment === seg.type ? baseStroke + 4 : baseStroke;

                        return (
                            <path
                                key={`${seg.type}-${i}`}
                                d={getSegmentPath(seg.start, seg.end)}
                                fill="none"
                                stroke={seg.color}
                                strokeWidth={activeStroke}
                                strokeLinecap="round"
                                strokeOpacity={isLowIntensity ? 0.4 : 1}
                                className={clsx(
                                    "transition-all duration-300 cursor-pointer hover:stroke-opacity-100",
                                    // Add subtle pulse for high intensity segments
                                    !isLowIntensity && "hover:drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                                )}
                                onMouseEnter={() => setHoveredSegment(seg.type)}
                                onMouseLeave={() => setHoveredSegment(null)}
                            />
                        );
                    })}
                </svg>

                {/* Current Time Indicator - Minimal Pill */}
                <motion.div
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    style={{ rotate: indicatorAngle }}
                    animate={{ rotate: indicatorAngle }}
                    transition={{ type: "spring", stiffness: 50 }}
                >
                    {/* The Pill Marker */}
                    <div
                        className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center"
                        style={{ top: `${(size - radius * 2) / 2 - 8}px` }} // Position exactly on the ring track
                    >
                        <div className="w-1.5 h-4 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.8)] ring-2 ring-white dark:ring-stone-900"></div>
                    </div>
                </motion.div>

                {/* Center Content (Radar) */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {children}
                </div>
            </div>

            {/* Controls & Legend */}
            <div className="flex items-center gap-4 mt-6">
                <button
                    onClick={() => setNotifyEnabled(!notifyEnabled)}
                    className={clsx(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                        notifyEnabled
                            ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-md"
                            : "bg-stone-100 text-stone-500 dark:bg-white/10 dark:text-stone-400 hover:bg-stone-200"
                    )}
                >
                    {notifyEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                    {notifyEnabled ? "Focus Alerts On" : "Enable Alerts"}
                </button>

                <div className="flex items-center gap-3 text-[10px] font-medium text-stone-400">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-rose-500"></div> Focus
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div> Social
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div> Recharge
                    </div>
                    <div className="flex items-center gap-1.5 opacity-50">
                        <div className="w-1.5 h-1.5 rounded-full border border-stone-400"></div> Transitions
                    </div>
                </div>
            </div>

            {/* Interactive Tooltip / Info Panel */}
            <AnimatePresence>
                {hoveredSegment && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute -bottom-16 bg-stone-900/90 dark:bg-white/90 backdrop-blur text-white dark:text-stone-900 px-4 py-2 rounded-xl shadow-xl text-center pointer-events-none z-10"
                    >
                        {(() => {
                            const seg = segments.find(s => s.type === hoveredSegment);
                            if (!seg) return null;
                            return (
                                <>
                                    <div className="text-xs font-bold uppercase tracking-wider mb-0.5">{seg.label}</div>
                                    <div className="text-[10px] opacity-80 font-mono">{seg.subLabel}</div>
                                </>
                            )
                        })()}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default PowerHourClock;
