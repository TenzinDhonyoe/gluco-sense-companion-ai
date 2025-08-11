import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { 
  Target, 
  Plus, 
  Clock, 
  CheckCircle2, 
  PlayCircle,
  PauseCircle,
  TrendingUp,
  Calendar
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";

export type Goal = {
  id: string;
  title: string;
  targetPerWeek: number;
  progressThisWeek: number;
  remindersEnabled: boolean;
  status: 'active' | 'paused' | 'completed';
};

export type ExperimentOutcome = 'helped' | 'inconclusive' | 'noEffect';

export type ExperimentResult = {
  beforeScore: number;
  duringScore: number;
  outcome: ExperimentOutcome;
};

export type MicroExperiment = {
  id: string;
  type: 'late_night_cutoff' | 'post_dinner_walk' | 'sleep_plus_30';
  title: string;
  description: string;
  duration: number; // weeks
  status: 'available' | 'active' | 'completed';
  startDate?: Date;
  endDate?: Date;
  result?: ExperimentResult;
};

const Plan = () => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [experiments, setExperiments] = useState<MicroExperiment[]>([]);
  const [activeExperiment, setActiveExperiment] = useState<MicroExperiment | null>(null);

  // Initialize default goals and experiments
  useEffect(() => {
    // Check if user is authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/");
      }
    });

    // Initialize with sample data (in production, load from database)
    const defaultGoals: Goal[] = [
      {
        id: '1',
        title: '10-minute walk after dinner',
        targetPerWeek: 4,
        progressThisWeek: 2,
        remindersEnabled: true,
        status: 'active'
      },
      {
        id: '2', 
        title: 'Protein-first breakfast',
        targetPerWeek: 5,
        progressThisWeek: 3,
        remindersEnabled: false,
        status: 'active'
      }
    ];

    const defaultExperiments: MicroExperiment[] = [
      {
        id: '1',
        type: 'late_night_cutoff',
        title: 'Late-Night Cutoff',
        description: 'No meals after 9 PM for 2 weeks',
        duration: 2,
        status: 'available'
      },
      {
        id: '2',
        type: 'post_dinner_walk',
        title: 'Post-Dinner Walk',
        description: '10-minute walk after dinner',
        duration: 2,
        status: 'active',
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Started 5 days ago
        result: {
          beforeScore: 72,
          duringScore: 0, // Still calculating
          outcome: 'inconclusive'
        }
      },
      {
        id: '3',
        type: 'sleep_plus_30',
        title: 'Sleep +30 min',
        description: 'Go to bed 30 minutes earlier',
        duration: 2,
        status: 'completed',
        startDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        result: {
          beforeScore: 68,
          duringScore: 75,
          outcome: 'helped'
        }
      }
    ];

    setGoals(defaultGoals);
    setExperiments(defaultExperiments);
    setActiveExperiment(defaultExperiments.find(e => e.status === 'active') || null);
  }, [navigate]);

  const toggleGoalReminders = (goalId: string) => {
    setGoals(goals.map(goal => 
      goal.id === goalId 
        ? { ...goal, remindersEnabled: !goal.remindersEnabled }
        : goal
    ));
  };

  const startExperiment = (experimentId: string) => {
    setExperiments(experiments.map(exp =>
      exp.id === experimentId
        ? { 
            ...exp, 
            status: 'active' as const,
            startDate: new Date()
          }
        : exp
    ));
  };

  const getOutcomeColor = (outcome: ExperimentOutcome) => {
    switch (outcome) {
      case 'helped':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'inconclusive':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'noEffect':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getOutcomeText = (outcome: ExperimentOutcome) => {
    switch (outcome) {
      case 'helped':
        return 'Likely helped';
      case 'inconclusive':
        return 'Inconclusive';
      case 'noEffect':
        return 'No clear effect';
      default:
        return 'Analyzing...';
    }
  };

  const formatProgress = (current: number, target: number) => {
    const percentage = Math.round((current / target) * 100);
    return { percentage: Math.min(percentage, 100), text: `${current}/${target}` };
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
      style={{ 
        paddingTop: 'max(3rem, env(safe-area-inset-top))',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 8rem)'
      }}
    >
      <div className="px-4 space-y-6">
        {/* Header */}
        <div className="py-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Plan</h1>
          <p className="text-sm text-gray-600 mt-1">Build healthy habits & track experiments</p>
        </div>

        {/* Weekly Goals Section */}
        <Card className="bg-white rounded-2xl shadow-sm">
          <CardHeader className="px-6 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Target className="w-5 h-5 text-blue-500" />
                <span>Weekly Goals</span>
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-1 min-h-9"
                disabled // TODO: Implement goal creation
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Goal</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            <div className="space-y-4">
              {goals.map((goal) => {
                const progress = formatProgress(goal.progressThisWeek, goal.targetPerWeek);
                return (
                  <div key={goal.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{goal.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Target: {goal.targetPerWeek}× per week
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">
                            {progress.text}
                          </div>
                          <div className="text-xs text-gray-500">
                            {progress.percentage}%
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Progress 
                        value={progress.percentage} 
                        className="h-2"
                      />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <Switch 
                            checked={goal.remindersEnabled}
                            onCheckedChange={() => toggleGoalReminders(goal.id)}
                            className="scale-75"
                          />
                          <span className="text-gray-600">Gentle reminders</span>
                        </div>
                        
                        {progress.percentage >= 100 && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Complete
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {goals.length === 0 && (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No goals yet</p>
                  <p className="text-sm text-gray-400">Add 1-2 weekly goals to get started</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Micro-Experiments Section */}
        <Card className="bg-white rounded-2xl shadow-sm">
          <CardHeader className="px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <span>Micro-Experiments</span>
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              2-week experiments to discover what works for you
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            <div className="space-y-4">
              {experiments.map((experiment) => (
                <div key={experiment.id} className="p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{experiment.title}</h3>
                        {experiment.status === 'active' && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <PlayCircle className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        )}
                        {experiment.status === 'completed' && experiment.result && (
                          <Badge 
                            variant="outline" 
                            className={getOutcomeColor(experiment.result.outcome)}
                          >
                            {getOutcomeText(experiment.result.outcome)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{experiment.description}</p>
                      
                      {experiment.status === 'active' && experiment.startDate && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>
                            Started {Math.ceil((Date.now() - experiment.startDate.getTime()) / (1000 * 60 * 60 * 24))} days ago
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      {experiment.status === 'available' && (
                        <Button 
                          onClick={() => startExperiment(experiment.id)}
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          Start
                        </Button>
                      )}
                      
                      {experiment.status === 'completed' && experiment.result && (
                        <div className="text-right text-sm">
                          <div className="text-gray-600">Before vs During</div>
                          <div className="font-semibold">
                            {experiment.result.beforeScore} → {experiment.result.duringScore}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {experiment.status === 'active' && experiment.result && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Current progress</span>
                        <span className="font-medium">Stability: {experiment.result.beforeScore} (baseline)</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Final results available after 2 weeks
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Nudges Section (Coming Soon) */}
        <Card className="bg-white rounded-2xl shadow-sm opacity-60">
          <CardHeader className="px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Clock className="w-5 h-5 text-green-500" />
              <span>Smart Nudges</span>
              <Badge variant="outline" className="ml-2 text-xs">Coming Soon</Badge>
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Time-bound reminders based on your goals
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            <div className="text-center py-4 text-gray-500">
              <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Personalized reminders coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default Plan;