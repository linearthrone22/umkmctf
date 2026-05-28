import React from 'react';
import { Check, Search, Cpu, Send } from 'lucide-react';

interface ProgressStepperProps {
    currentStep: number;
}

const steps = [
    { id: 1, name: 'Input Data', icon: Search },
    { id: 2, name: 'AI Analysis', icon: Cpu },
    { id: 3, name: 'Direct Action', icon: Send },
];

const ProgressStepper: React.FC<ProgressStepperProps> = ({ currentStep }) => {
    return (
        <div className="w-full px-4 pt-4 pb-5">
            <div className="relative">
                {/* Connection Line aligned to center of 40px circles (top-5 = 20px) */}
                <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-200/70 z-0"></div>
                <div
                    className="absolute top-5 left-0 h-0.5 bg-emerald-500 z-0 transition-all duration-500"
                    style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                ></div>

                <div className="flex items-start justify-between relative z-10">
                    {steps.map(step => {
                        const Icon = step.icon;
                        const isActive = step.id <= currentStep;
                        const isCompleted = step.id < currentStep;

                        return (
                            <div key={step.id} className="flex flex-col items-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                                        isCompleted
                                            ? 'bg-emerald-500 text-white'
                                            : isActive
                                                ? 'bg-emerald-100 text-emerald-600 border-2 border-emerald-500'
                                                : 'bg-white text-slate-400 border-2 border-slate-200'
                                    }`}
                                >
                                    {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                                </div>
                                <span
                                    className={`mt-2 text-xs font-medium whitespace-nowrap ${
                                        isActive ? 'text-emerald-600' : 'text-slate-400'
                                    }`}
                                >
                                    {step.name}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ProgressStepper;
