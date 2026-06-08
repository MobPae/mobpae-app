import { Check } from "lucide-react";

type OnboardingStepsProps = {
  steps: Array<{ label: string; done: boolean }>;
};

export function OnboardingSteps({ steps }: OnboardingStepsProps) {
  return (
    <div className="step-strip" aria-label="Onboarding progress">
      {steps.map((step, index) => (
        <div key={step.label} className={`step ${step.done ? "done" : ""}`}>
          <span>{step.done ? <Check size={12} /> : index + 1}</span>
          <p>{step.label}</p>
        </div>
      ))}
    </div>
  );
}
