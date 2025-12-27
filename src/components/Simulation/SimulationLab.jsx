import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAnalysis } from '../../context/AnalysisContext';
import { PharmacogenomicAnalyzer } from '../../analysis/PharmacogenomicAnalyzer';
import { SimulationPanel } from '../Dashboard/SimulationPanel';
import { RadarChart } from '../visualizations/RadarChart';
import { PowerHourClock } from '../Dashboard/PowerHourClock';
import { CircadianAnalyzer } from '../../analysis/CircadianAnalyzer'; // Optional if we want the clock here too
import { Sparkles, Beaker, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../common/Button';

export function SimulationLab() {
    const { emotionalProfile, matches, archetype } = useAnalysis();
    const [activeSimulation, setActiveSimulation] = useState(null);

    // 1. Calculate Pharma Results
    const pharmaResults = useMemo(() => {
        if (!matches) return null;
        const analyzer = new PharmacogenomicAnalyzer();
        return analyzer.analyze(matches);
    }, [matches]);

    // 2. Calculate Simulation Data (Ghost)
    const simulationData = useMemo(() => {
        if (!activeSimulation || !pharmaResults || !emotionalProfile) return null;
        const analyzer = new PharmacogenomicAnalyzer();
        return analyzer.simulate(emotionalProfile.radarData, activeSimulation, pharmaResults);
    }, [activeSimulation, pharmaResults, emotionalProfile]);

    // 3. Circadian (Optional, purely aesthetic for the Lab context?)
    const circadian = useMemo(() => {
        if (!matches || !archetype) return null;
        const analyzer = new CircadianAnalyzer(matches);
        const chronoData = analyzer.determineChronotype();
        const schedule = analyzer.generateSchedule(chronoData, archetype);
        return { schedule, type: chronoData.type };
    }, [matches, archetype]);


    const navigate = useNavigate();

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
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold tracking-widest uppercase">
                        <Beaker className="w-4 h-4" />
                        Simulation Lab
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
                <div className="p-8 rounded-3xl bg-stone-900 shadow-2xl relative overflow-hidden flex justify-center items-center min-h-[400px]">
                    {/* Cyber Grid Background */}
                    <div className="absolute inset-0 opacity-20"
                        style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                    </div>

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
                        activeSimulation={activeSimulation}
                        onToggle={(val) => setActiveSimulation(activeSimulation === val ? null : val)}
                        pharmaResults={pharmaResults}
                    />

                    {/* Detailed Insight Card */}
                    {activeSimulation && simulationData && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20"
                        >
                            <h3 className="text-lg font-serif font-medium text-emerald-900 dark:text-emerald-100 mb-2">
                                {simulationData.profile} Metabolizer Impact
                            </h3>
                            <p className="text-sm text-emerald-800 dark:text-emerald-200/80 leading-relaxed mb-4">
                                {simulationData.insight}
                            </p>

                            <div className="space-y-2">
                                <div className="text-[10px] uppercase tracking-widest font-bold text-emerald-600/50">
                                    Neurochemical Shift
                                </div>
                                {simulationData.ghostData.map((axis, i) => {
                                    const delta = axis.value - axis.originalValue;
                                    if (Math.abs(delta) < 0.05) return null;

                                    return (
                                        <div key={i} className="flex justify-between items-center text-xs">
                                            <span className="font-medium text-emerald-900 dark:text-emerald-100">{axis.axis}</span>
                                            <span className={delta > 0 ? "text-emerald-600" : "text-rose-500"}>
                                                {delta > 0 ? '+' : ''}{Math.round(delta * 100)}%
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {!activeSimulation && (
                        <div className="p-6 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 text-center text-stone-400">
                            <p className="text-sm">Select a chemical agent above to simulate its effect on your unique biology.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
