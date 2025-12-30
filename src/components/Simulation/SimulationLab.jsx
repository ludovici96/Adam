import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useAnalysis } from '../../context/AnalysisContext';
import { PharmacogenomicAnalyzer } from '../../analysis/PharmacogenomicAnalyzer';
import { SimulationPanel } from '../Dashboard/SimulationPanel';
import { RadarChart } from '../visualizations/RadarChart';
import { PowerHourClock } from '../Dashboard/PowerHourClock';
import { CircadianAnalyzer } from '../../analysis/CircadianAnalyzer';
import { Beaker, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../common/Button';

export function SimulationLab() {
    const { emotionalProfile, matches, archetype } = useAnalysis();

    // Track object of active substances { caffeine: 'High', alcohol: 2 }
    const [activeSubstances, setActiveSubstances] = useState({});

    // 1. Calculate Pharma Results (Static Genetic Profile)
    const pharmaResults = useMemo(() => {
        if (!matches) return null;
        const analyzer = new PharmacogenomicAnalyzer();
        return analyzer.analyze(matches);
    }, [matches]);

    // 2. Calculate Simulation Data (Ghost State)
    const simulationData = useMemo(() => {
        if (Object.keys(activeSubstances).length === 0 || !pharmaResults || !emotionalProfile) return null;
        const analyzer = new PharmacogenomicAnalyzer();
        return analyzer.calculateGhostState(emotionalProfile.radarData, activeSubstances, pharmaResults);
    }, [activeSubstances, pharmaResults, emotionalProfile]);

    // 3. Circadian
    const circadian = useMemo(() => {
        if (!matches || !archetype) return null;
        const analyzer = new CircadianAnalyzer(matches);
        const chronoData = analyzer.determineChronotype();
        const schedule = analyzer.generateSchedule(chronoData, archetype);
        return { schedule, type: chronoData.type };
    }, [matches, archetype]);


    const navigate = useNavigate();

    const hasActiveSimulation = Object.keys(activeSubstances).length > 0;

    // Check for Red Flags in insights
    const isRedFlag = useMemo(() => {
        if (!simulationData?.insights) return false;
        return simulationData.insights.some(i =>
            i.includes('RED FLAG') ||
            i.includes('WARNING') ||
            i.includes('CARDIAC') ||
            i.includes('NEURO-TOXICITY')
        );
    }, [simulationData]);

    if (!emotionalProfile) {
        return (
            <div className="p-10 text-center text-stone-500">
                Please upload your DNA data to access the Simulation Lab.
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="space-y-6">
                <div className="flex items-center justify-start">
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={<ArrowLeft className="w-4 h-4" />}
                        onClick={() => navigate('/dashboard')}
                    >
                        Back to Dashboard
                    </Button>
                </div>

                <div className="text-center space-y-2">
                    <div className={clsx(
                        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase transition-colors duration-500",
                        isRedFlag
                            ? "bg-rose-500/10 text-rose-500 animate-pulse border border-rose-500/20"
                            : "bg-emerald-500/10 text-emerald-500"
                    )}>
                        <Beaker className="w-4 h-4" />
                        {isRedFlag ? "Bio-Hazard Detected" : "Simulation Lab"}
                    </div>
                    <h1 className="text-3xl font-serif text-stone-900 dark:text-white">
                        The "What-If" Engine
                    </h1>
                    <p className="text-stone-500 dark:text-stone-400 max-w-lg mx-auto">
                        Simulate how external chemicals interact with your specific neurochemistry.
                        See the shift before you take the dose.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Left: Visualization */}
                <div className={clsx(
                    "p-8 rounded-3xl shadow-2xl relative overflow-hidden flex justify-center items-center min-h-[400px] transition-all duration-1000",
                    isRedFlag
                        ? "bg-stone-900 shadow-rose-900/20 ring-1 ring-rose-500/30"
                        : "bg-stone-900"
                )}>
                    {/* Cyber Grid Background */}
                    <div className={clsx(
                        "absolute inset-0 transition-opacity duration-1000",
                        isRedFlag ? "opacity-10 bg-rose-900/10" : "opacity-20"
                    )}
                        style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                    </div>

                    {/* Red Alarm Overlay */}
                    <div className={clsx(
                        "absolute inset-0 pointer-events-none transition-opacity duration-500 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))]",
                        isRedFlag ? "from-rose-500/10 via-transparent to-transparent opacity-100" : "opacity-0"
                    )} />

                    {/* Radar */}
                    <div className="relative z-10 scale-110">
                        {circadian ? (
                            <PowerHourClock schedule={circadian.schedule} size={320}>
                                <div className="scale-75">
                                    <RadarChart
                                        data={emotionalProfile.radarData}
                                        secondaryData={simulationData?.ghostData}
                                        size={240}
                                        colors={{
                                            fill: '#44403c', // Dark Stone
                                            stroke: '#78716c',
                                            secondaryFill: '#10b981', // Neon Emerald
                                            secondaryStroke: '#34d399'
                                        }}
                                    />
                                </div>
                            </PowerHourClock>
                        ) : (
                            <RadarChart
                                data={emotionalProfile.radarData}
                                secondaryData={simulationData?.ghostData}
                                size={280}
                                colors={{
                                    fill: '#44403c',
                                    stroke: '#78716c',
                                    secondaryFill: '#10b981',
                                    secondaryStroke: '#34d399'
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Right: Controls & Insights */}
                <div className="space-y-6">
                    <SimulationPanel
                        activeSubstances={activeSubstances}
                        onUpdate={setActiveSubstances}
                        pharmaResults={pharmaResults}
                    />

                    {/* Simulation Insight Cards */}
                    <div className="space-y-4">
                        <AnimatePresence>
                            {hasActiveSimulation && simulationData && simulationData.insights.map((insight, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20"
                                >
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-100 mb-1">
                                        <Beaker className="w-3 h-3" />
                                        Pharmacogenomic Hit
                                    </h4>
                                    <p className="text-xs text-emerald-800/80 dark:text-emerald-200/80 leading-relaxed">
                                        {insight.split(/(\*\*.*?\*\*)/).map((part, i) =>
                                            part.startsWith('**') && part.endsWith('**') ?
                                                <strong key={i} className="font-bold text-emerald-900 dark:text-emerald-50">
                                                    {part.slice(2, -2)}
                                                </strong> :
                                                <span key={i}>{part}</span>
                                        )}
                                    </p>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Ghost Delta Summary */}
                        {hasActiveSimulation && simulationData && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50"
                            >
                                <div className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-3">
                                    Net Neurochemical Shift
                                </div>
                                <div className="space-y-1">
                                    {simulationData.ghostData.map((axis, i) => {
                                        const delta = axis.value - axis.originalValue;
                                        if (Math.abs(delta) < 0.05) return null;

                                        return (
                                            <div key={i} className="flex justify-between items-center text-xs">
                                                <span className="font-medium text-stone-700 dark:text-stone-300">{axis.axis}</span>
                                                <span className={`font-mono ${delta > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                                                    {delta > 0 ? '+' : ''}{Math.round(delta * 100)}%
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* Empty State */}
                        {!hasActiveSimulation && (
                            <div className="p-6 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 text-center text-stone-400">
                                <p className="text-sm">
                                    <strong>Initialize Simulation Kernel:</strong> Select a compound to run the new <em>Kinetic Pharmacogenomic Engine</em>.
                                    <br /><br />
                                    This engine calculates your specific <strong>Clearance Rates (Half-Life)</strong> and <strong>Receptor Sensitivity</strong> to model how your brain chemistry shifts over time.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
